import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseTimerOptions {
  duration: number // in seconds
  onTick?: (remaining: number) => void
  onComplete?: () => void
  autoStart?: boolean
}

export function useTimer({
  duration,
  onTick,
  onComplete,
  autoStart = false,
}: UseTimerOptions) {
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const [timeRemaining, setTimeRemaining] = useState(duration)
  const [isRunning, setIsRunning] = useState(autoStart)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1

        if (onTick) {
          onTick(newTime)
        }

        if (newTime <= 0) {
          setIsRunning(false)
          onCompleteRef.current?.()
          return 0
        }

        return newTime
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, onTick])

  const start = useCallback(() => {
    setIsRunning(true)
    setIsPaused(false)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    setIsRunning(true)
    setIsPaused(false)
  }, [])

  const stop = useCallback(() => {
    setIsRunning(false)
    setIsPaused(false)
    setTimeRemaining(duration)
  }, [duration])

  const reset = useCallback(() => {
    setIsRunning(false)
    setIsPaused(false)
    setTimeRemaining(duration)
  }, [duration])

  return {
    timeRemaining,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    stop,
    reset,
    progress: ((duration - timeRemaining) / duration) * 100,
  }
}
