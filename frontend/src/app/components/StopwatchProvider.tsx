"use client"

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

type StopwatchSnapshot = {
  elapsedTime: number
  currentLapTime: number
  isRunning: boolean
  laps: number[]
  totalStartTime: number | null
  lapStartTime: number | null
  savedElapsedTime: number
  savedLapTime: number
  hasUnsavedStop: boolean
}

type StopwatchContextValue = {
  elapsedTime: number
  currentLapTime: number
  isRunning: boolean
  laps: number[]
  hasUnsavedStop: boolean
  startTimer: () => void
  stopTimer: () => void
  resetTimer: () => void
  recordLap: () => void
  markSaved: () => void
}

const STORAGE_KEY = "next-rails-stopwatch"
const StopwatchContext = createContext<StopwatchContextValue | null>(null)

export function StopwatchProvider({ children }: { children: ReactNode }) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentLapTime, setCurrentLapTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [laps, setLaps] = useState<number[]>([])
  const [hasUnsavedStop, setHasUnsavedStop] = useState(false)

  const intervalRef = useRef<number | null>(null)
  const totalStartTimeRef = useRef<number | null>(null)
  const lapStartTimeRef = useRef<number | null>(null)
  const savedElapsedTimeRef = useRef(0)
  const savedLapTimeRef = useRef(0)
  const latestStateRef = useRef({
    isRunning: false,
    laps: [] as number[],
    hasUnsavedStop: false,
  })

  function getLiveTimes() {
    const now = Date.now()

    return {
      elapsed:
        isRunning && totalStartTimeRef.current !== null
          ? now - totalStartTimeRef.current
          : savedElapsedTimeRef.current,
      lap:
        isRunning && lapStartTimeRef.current !== null
          ? now - lapStartTimeRef.current
          : savedLapTimeRef.current,
    }
  }

  function saveSnapshot(next?: Partial<StopwatchSnapshot>) {
    const liveTimes = getLiveTimes()
    const snapshot: StopwatchSnapshot = {
      elapsedTime: liveTimes.elapsed,
      currentLapTime: liveTimes.lap,
      isRunning,
      laps,
      totalStartTime: totalStartTimeRef.current,
      lapStartTime: lapStartTimeRef.current,
      savedElapsedTime: savedElapsedTimeRef.current,
      savedLapTime: savedLapTimeRef.current,
      hasUnsavedStop,
      ...next,
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  }

  function beginInterval() {
    if (intervalRef.current !== null) return

    intervalRef.current = window.setInterval(() => {
      const now = Date.now()

      if (totalStartTimeRef.current !== null) {
        setElapsedTime(now - totalStartTimeRef.current)
      }

      if (lapStartTimeRef.current !== null) {
        setCurrentLapTime(now - lapStartTimeRef.current)
      }
    }, 100)
  }

  function clearRunningInterval() {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    latestStateRef.current = {
      isRunning,
      laps,
      hasUnsavedStop,
    }
  }, [isRunning, laps, hasUnsavedStop])

  useEffect(() => {
    const rawSnapshot = window.localStorage.getItem(STORAGE_KEY)

    if (!rawSnapshot) return

    try {
      const snapshot = JSON.parse(rawSnapshot) as StopwatchSnapshot
      const now = Date.now()
      const nextElapsed =
        snapshot.isRunning && snapshot.totalStartTime !== null
          ? now - snapshot.totalStartTime
          : snapshot.elapsedTime
      const nextLap =
        snapshot.isRunning && snapshot.lapStartTime !== null
          ? now - snapshot.lapStartTime
          : snapshot.currentLapTime

      totalStartTimeRef.current = snapshot.totalStartTime
      lapStartTimeRef.current = snapshot.lapStartTime
      savedElapsedTimeRef.current = snapshot.savedElapsedTime
      savedLapTimeRef.current = snapshot.savedLapTime

      window.setTimeout(() => {
        setElapsedTime(nextElapsed)
        setCurrentLapTime(nextLap)
        setLaps(Array.isArray(snapshot.laps) ? snapshot.laps : [])
        setHasUnsavedStop(snapshot.hasUnsavedStop)
        setIsRunning(snapshot.isRunning)

        if (snapshot.isRunning) {
          beginInterval()
        }
      }, 0)
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveSnapshot(latestStateRef.current)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      handleBeforeUnload()
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      clearRunningInterval()
    }
  }, [])

  function startTimer() {
    if (intervalRef.current !== null) return

    const now = Date.now()

    totalStartTimeRef.current = now - savedElapsedTimeRef.current
    lapStartTimeRef.current = now - savedLapTimeRef.current
    setIsRunning(true)
    beginInterval()
    saveSnapshot({
      isRunning: true,
      totalStartTime: totalStartTimeRef.current,
      lapStartTime: lapStartTimeRef.current,
    })
  }

  function stopTimer() {
    clearRunningInterval()

    const now = Date.now()
    let latestElapsedTime = elapsedTime
    let latestLapTime = currentLapTime

    if (totalStartTimeRef.current !== null) {
      latestElapsedTime = now - totalStartTimeRef.current
      setElapsedTime(latestElapsedTime)
      savedElapsedTimeRef.current = latestElapsedTime
    }

    if (lapStartTimeRef.current !== null) {
      latestLapTime = now - lapStartTimeRef.current
      setCurrentLapTime(latestLapTime)
      savedLapTimeRef.current = latestLapTime
    }

    setIsRunning(false)
    setHasUnsavedStop(latestElapsedTime > 0)
    saveSnapshot({
      elapsedTime: latestElapsedTime,
      currentLapTime: latestLapTime,
      isRunning: false,
      savedElapsedTime: latestElapsedTime,
      savedLapTime: latestLapTime,
      hasUnsavedStop: latestElapsedTime > 0,
    })
  }

  function resetTimer() {
    clearRunningInterval()

    setElapsedTime(0)
    setCurrentLapTime(0)
    setIsRunning(false)
    setLaps([])
    setHasUnsavedStop(false)

    totalStartTimeRef.current = null
    lapStartTimeRef.current = null
    savedElapsedTimeRef.current = 0
    savedLapTimeRef.current = 0

    window.localStorage.removeItem(STORAGE_KEY)
  }

  function recordLap() {
    if (!isRunning || lapStartTimeRef.current === null) return

    const now = Date.now()
    const latestLapTime = now - lapStartTimeRef.current
    const nextLaps = [latestLapTime, ...laps]

    setLaps(nextLaps)
    setCurrentLapTime(0)

    lapStartTimeRef.current = now
    savedLapTimeRef.current = 0
    saveSnapshot({
      laps: nextLaps,
      currentLapTime: 0,
      lapStartTime: now,
      savedLapTime: 0,
    })
  }

  function markSaved() {
    setHasUnsavedStop(false)
    saveSnapshot({ hasUnsavedStop: false })
  }

  return (
    <StopwatchContext.Provider
      value={{
        elapsedTime,
        currentLapTime,
        isRunning,
        laps,
        hasUnsavedStop,
        startTimer,
        stopTimer,
        resetTimer,
        recordLap,
        markSaved,
      }}
    >
      {children}
    </StopwatchContext.Provider>
  )
}

export function useStopwatch() {
  const context = useContext(StopwatchContext)

  if (!context) {
    throw new Error("useStopwatch must be used within StopwatchProvider")
  }

  return context
}
