"use client"

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { apiFetch } from "@/lib/auth"

type StopwatchSnapshot = {
  category: string
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

type ActiveTimerResponse = {
  category: string
  elapsed_seconds: number
  is_running: boolean
  started_at: string | null
  laps: number[]
}

type StopwatchContextValue = {
  category: string
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
  setCategory: (category: string) => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
const STORAGE_KEY = "next-rails-stopwatch"
const DEFAULT_CATEGORY = "Programming"
const SYNC_INTERVAL_MS = 5000
const StopwatchContext = createContext<StopwatchContextValue | null>(null)

export function StopwatchProvider({ children }: { children: ReactNode }) {
  const [category, setCategoryState] = useState(DEFAULT_CATEGORY)
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
    category: DEFAULT_CATEGORY,
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
      category,
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

  async function syncActiveTimer(next?: Partial<StopwatchSnapshot>) {
    if (!API_BASE_URL) return

    const liveTimes = getLiveTimes()
    const nextCategory = next?.category ?? category
    const nextElapsedTime = next?.elapsedTime ?? liveTimes.elapsed
    const nextIsRunning = next?.isRunning ?? isRunning
    const nextLaps = next?.laps ?? laps
    const nextStartedAt = nextIsRunning ? new Date().toISOString() : null

    try {
      await apiFetch(`${API_BASE_URL}/active_timer`, {
        method: "PATCH",
        body: JSON.stringify({
          active_timer: {
            category: nextCategory,
            elapsed_seconds: Math.floor(nextElapsedTime / 1000),
            is_running: nextIsRunning,
            started_at: nextIsRunning ? nextStartedAt : null,
            laps: nextLaps.map((lap) => Math.floor(lap / 1000)),
          },
        }),
      })
    } catch {
      // Local timer behavior should continue even if cross-device sync fails.
    }
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

  function applySnapshot(snapshot: StopwatchSnapshot) {
    totalStartTimeRef.current = snapshot.totalStartTime
    lapStartTimeRef.current = snapshot.lapStartTime
    savedElapsedTimeRef.current = snapshot.savedElapsedTime
    savedLapTimeRef.current = snapshot.savedLapTime

    setCategoryState(snapshot.category || DEFAULT_CATEGORY)
    setElapsedTime(snapshot.elapsedTime)
    setCurrentLapTime(snapshot.currentLapTime)
    setLaps(Array.isArray(snapshot.laps) ? snapshot.laps : [])
    setHasUnsavedStop(snapshot.hasUnsavedStop)
    setIsRunning(snapshot.isRunning)

    if (snapshot.isRunning) {
      beginInterval()
    } else {
      clearRunningInterval()
    }
  }

  function applyActiveTimer(activeTimer: ActiveTimerResponse) {
    const elapsedMs = Math.max(activeTimer.elapsed_seconds, 0) * 1000
    const lapsMs = Array.isArray(activeTimer.laps)
      ? activeTimer.laps.map((lap) => Math.max(lap, 0) * 1000)
      : []
    const lapElapsedMs = Math.max(
      elapsedMs - lapsMs.reduce((sum, lap) => sum + lap, 0),
      0,
    )
    const now = Date.now()
    const totalStartTime = activeTimer.is_running ? now - elapsedMs : null
    const lapStartTime = activeTimer.is_running ? now - lapElapsedMs : null

    applySnapshot({
      category: activeTimer.category || DEFAULT_CATEGORY,
      elapsedTime: elapsedMs,
      currentLapTime: lapElapsedMs,
      isRunning: activeTimer.is_running,
      laps: lapsMs,
      totalStartTime,
      lapStartTime,
      savedElapsedTime: activeTimer.is_running ? elapsedMs : elapsedMs,
      savedLapTime: activeTimer.is_running ? lapElapsedMs : lapElapsedMs,
      hasUnsavedStop: elapsedMs > 0 && !activeTimer.is_running,
    })
  }

  async function loadActiveTimer() {
    if (!API_BASE_URL) return false

    try {
      const res = await apiFetch(`${API_BASE_URL}/active_timer`, {
        cache: "no-store",
      })

      if (!res.ok) return false

      const activeTimer = (await res.json()) as ActiveTimerResponse
      applyActiveTimer(activeTimer)
      return true
    } catch {
      return false
    }
  }

  useEffect(() => {
    latestStateRef.current = {
      category,
      isRunning,
      laps,
      hasUnsavedStop,
    }
  }, [category, isRunning, laps, hasUnsavedStop])

  useEffect(() => {
    let isMounted = true

    async function initializeTimer() {
      const loadedFromServer = await loadActiveTimer()
      if (!isMounted || loadedFromServer) return

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

        applySnapshot({
          ...snapshot,
          category: snapshot.category || DEFAULT_CATEGORY,
          elapsedTime: nextElapsed,
          currentLapTime: nextLap,
        })
      } catch {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }

    void initializeTimer()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const syncInterval = window.setInterval(() => {
      void loadActiveTimer()
    }, SYNC_INTERVAL_MS)

    return () => {
      window.clearInterval(syncInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function setCategory(nextCategory: string) {
    setCategoryState(nextCategory)
    saveSnapshot({ category: nextCategory })
    void syncActiveTimer({ category: nextCategory })
  }

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
    void syncActiveTimer({
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

    totalStartTimeRef.current = null
    lapStartTimeRef.current = null
    setIsRunning(false)
    setHasUnsavedStop(latestElapsedTime > 0)
    saveSnapshot({
      elapsedTime: latestElapsedTime,
      currentLapTime: latestLapTime,
      isRunning: false,
      totalStartTime: null,
      lapStartTime: null,
      savedElapsedTime: latestElapsedTime,
      savedLapTime: latestLapTime,
      hasUnsavedStop: latestElapsedTime > 0,
    })
    void syncActiveTimer({
      elapsedTime: latestElapsedTime,
      currentLapTime: latestLapTime,
      isRunning: false,
      totalStartTime: null,
      lapStartTime: null,
      savedElapsedTime: latestElapsedTime,
      savedLapTime: latestLapTime,
      hasUnsavedStop: latestElapsedTime > 0,
    })
  }

  async function resetRemoteTimer() {
    if (!API_BASE_URL) return

    try {
      await apiFetch(`${API_BASE_URL}/active_timer`, {
        method: "DELETE",
      })
    } catch {
      // Local reset should still happen if sync fails.
    }
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
    void resetRemoteTimer()
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
    void syncActiveTimer({
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
        category,
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
        setCategory,
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
