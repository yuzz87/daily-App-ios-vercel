"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type CountdownPreset = 1 | 5 | 10 | 25 | 30 | 60

export function useCountdownTimer() {
  const [totalSeconds, setTotalSeconds] = useState(300)
  const [remainingSeconds, setRemainingSeconds] = useState(300)
  const [isRunning, setIsRunning] = useState(false)
  const [hasFinished, setHasFinished] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => () => clearTick(), [clearTick])

  const selectPreset = useCallback(
    (minutes: CountdownPreset) => {
      if (isRunning) return
      const secs = minutes * 60
      setTotalSeconds(secs)
      setRemainingSeconds(secs)
      setHasFinished(false)
    },
    [isRunning],
  )

  const adjustMinutes = useCallback(
    (delta: number) => {
      if (isRunning) return
      setTotalSeconds((prev) => {
        const next = Math.min(3600, Math.max(60, prev + delta * 60))
        setRemainingSeconds(next)
        return next
      })
      setHasFinished(false)
    },
    [isRunning],
  )

  const start = useCallback(() => {
    if (isRunning || remainingSeconds <= 0) return
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearTick()
          setIsRunning(false)
          setHasFinished(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [isRunning, remainingSeconds, clearTick])

  const stop = useCallback(() => {
    clearTick()
    setIsRunning(false)
  }, [clearTick])

  const reset = useCallback(() => {
    clearTick()
    setIsRunning(false)
    setHasFinished(false)
    setRemainingSeconds(totalSeconds)
  }, [clearTick, totalSeconds])

  const dismissAlarm = useCallback(() => {
    setHasFinished(false)
  }, [])

  return {
    totalSeconds,
    remainingSeconds,
    isRunning,
    hasFinished,
    selectPreset,
    adjustMinutes,
    start,
    stop,
    reset,
    dismissAlarm,
  }
}
