"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { publicUrl } from "@/lib/publicPath";

type RecordingState = "idle" | "recording" | "stopping";

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionResultEventLike = {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string } | undefined;
    };
  };
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

export type RecordingCompleteResult = {
  transcript: string;
  durationSec: number;
};

type VoiceMemoRecorderProps = {
  currentTranscript: string;
  durationSec: number | null;
  disabled: boolean;
  onTranscriptChange: (transcript: string) => void;
  onComplete: (result: RecordingCompleteResult) => void;
  onRecordingChange: (recording: boolean) => void;
  onStatusMessage: (message: string | null) => void;
  onErrorMessage: (message: string | null) => void;
};

export function VoiceMemoRecorder({
  currentTranscript,
  durationSec,
  disabled,
  onTranscriptChange,
  onComplete,
  onRecordingChange,
  onStatusMessage,
  onErrorMessage,
}: VoiceMemoRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [mediaSupported, setMediaSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const transcriptSeedRef = useRef("");
  const liveTranscriptRef = useRef("");
  const currentTranscriptRef = useRef(currentTranscript);

  const isBusyRecording = recordingState !== "idle";
  const displayedDurationSec =
    recordingState === "idle" ? durationSec : elapsedSec;

  useEffect(() => {
    currentTranscriptRef.current = currentTranscript;
  }, [currentTranscript]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const canUseMedia =
        typeof navigator !== "undefined" &&
        Boolean(navigator.mediaDevices?.getUserMedia) &&
        typeof MediaRecorder !== "undefined";

      setMediaSupported(canUseMedia);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  async function handleStartRecording() {
    if (disabled || isBusyRecording) return;

    onErrorMessage(null);
    onStatusMessage(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setMediaSupported(false);
      onErrorMessage("Recording is not supported in this browser.");
      onRecordingChange(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      transcriptSeedRef.current = currentTranscriptRef.current.trim();
      liveTranscriptRef.current = transcriptSeedRef.current;

      recorder.onstop = () => {
        completeRecording();
      };
      recorder.onerror = () => {
        onErrorMessage("Recording stopped because the recorder failed.");
        completeRecording();
      };

      startSpeechRecognition();

      recorder.start();
      startedAtRef.current = currentTimeMs();
      setElapsedSec(0);
      setRecordingState("recording");
      onRecordingChange(true);
      timerRef.current = window.setInterval(() => {
        setElapsedSec(getCurrentDurationSec());
      }, 250);
    } catch {
      clearRecordingTimer();
      stopSpeechRecognition(true);
      stopMediaRecorder(true);
      stopMediaTracks();
      setRecordingState("idle");
      onRecordingChange(false);
      onErrorMessage(
        "Microphone permission failed. You can type a memo manually.",
      );
    }
  }

  function handleStopRecording() {
    if (recordingState !== "recording") return;

    setRecordingState("stopping");
    stopSpeechRecognition(false);
    stopMediaRecorder(false);
  }

  function startSpeechRecognition() {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      onStatusMessage(
        "Speech recognition is unavailable. Manual input remains enabled.",
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "ja-JP";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        const finalParts: string[] = [];
        const interimParts: string[] = [];

        for (let index = 0; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result[0]?.transcript.trim();
          if (!transcript) continue;

          if (result.isFinal) {
            finalParts.push(transcript);
          } else {
            interimParts.push(transcript);
          }
        }

        const nextTranscript = joinText(
          transcriptSeedRef.current,
          finalParts.join(" "),
          interimParts.join(" "),
        );

        liveTranscriptRef.current = nextTranscript;
        onTranscriptChange(nextTranscript);
      };
      recognition.onerror = () => {
        onErrorMessage(
          "Speech recognition stopped. Manual input remains enabled.",
        );
      };
      recognition.onend = () => {
        recognitionRef.current = null;
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      onStatusMessage(
        "Speech recognition is unavailable. Manual input remains enabled.",
      );
    }
  }

  function completeRecording() {
    const nextDurationSec = getCurrentDurationSec();
    const nextTranscript = liveTranscriptRef.current.trim();

    clearRecordingTimer();
    stopMediaTracks();
    mediaRecorderRef.current = null;
    startedAtRef.current = null;

    setElapsedSec(nextDurationSec);
    setRecordingState("idle");
    onRecordingChange(false);
    onComplete({
      durationSec: nextDurationSec,
      transcript: nextTranscript || currentTranscriptRef.current.trim(),
    });
  }

  function clearRecordingTimer() {
    if (timerRef.current === null) return;

    window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function stopMediaRecorder(discardHandler: boolean) {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (discardHandler) {
      recorder.onstop = null;
      recorder.onerror = null;
    }

    if (recorder.state !== "inactive") {
      recorder.stop();
    } else if (!discardHandler) {
      completeRecording();
    }
  }

  function stopSpeechRecognition(abort: boolean) {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    try {
      if (abort) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort();
        recognitionRef.current = null;
      } else {
        recognition.stop();
      }
    } catch {
      recognitionRef.current = null;
    }
  }

  function stopMediaTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function getCurrentDurationSec(): number {
    if (startedAtRef.current === null) return elapsedSec;

    return Math.max(
      0,
      Math.round((currentTimeMs() - startedAtRef.current) / 1000),
    );
  }

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;

        try {
          recognition.abort();
        } catch {
          // Browsers can throw if recognition already stopped.
        }

        recognitionRef.current = null;
      }

      const recorder = mediaRecorderRef.current;
      if (recorder) {
        recorder.onstop = null;
        recorder.onerror = null;

        if (recorder.state !== "inactive") {
          recorder.stop();
        }

        mediaRecorderRef.current = null;
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={
          recordingState === "recording"
            ? handleStopRecording
            : handleStartRecording
        }
        disabled={
          recordingState === "stopping" ||
          (recordingState === "idle" && (disabled || !mediaSupported))
        }
        aria-label={
          recordingState === "recording" ? "Stop recording" : "Start recording"
        }
        className="rounded-full p-1 transition duration-500 ease-out hover:scale-110 hover:rotate-1080 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Image
          src={publicUrl("/disc-3.svg")}
          alt=""
          width={64}
          height={64}
          className={
            recordingState === "recording"
              ? "animate-[disc-spin_2.4s_linear_infinite]"
              : undefined
          }
        />
      </button>
      <p className="font-mono text-3xl font-semibold text-gray-950">
        {formatDuration(displayedDurationSec)}
      </p>
    </div>
  );
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;

  const browserWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return (
    browserWindow.SpeechRecognition ??
    browserWindow.webkitSpeechRecognition ??
    null
  );
}

function currentTimeMs(): number {
  return Date.now();
}

function formatDuration(durationSec: number | null): string {
  if (durationSec === null) return "";

  const totalSeconds = Math.max(0, Math.floor(durationSec));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function joinText(...parts: string[]): string {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n\n");
}
