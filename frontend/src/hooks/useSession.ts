import { useState, useCallback } from 'react'
import { FocusSession, SessionConfig } from '@/types'
import { useTimer } from './useTimer'

export function useSession() {
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null)
  const [sessionHistory, setSessionHistory] = useState<FocusSession[]>([])
  const [pauses, setPauses] = useState(0)

  const timer = useTimer({
    duration: currentSession ? currentSession.duration * 60 : 0,
    onComplete: () => {
      // Handle session completion
    },
  })

  const startSession = useCallback((config: SessionConfig) => {
    const session: FocusSession = {
      id: Math.random().toString(36),
      userId: 'current-user',
      taskId: config.taskId,
      title: config.title,
      duration: config.duration,
      actualDuration: 0,
      musicUsed: config.music,
      ambientSound: config.ambientSound,
      productivityScore: 0,
      moodRating: 0,
      notes: config.goal,
      pauses: 0,
      completed: false,
      createdAt: new Date(),
    }

    setCurrentSession(session)
    timer.start()
  }, [timer])

  const pauseSession = useCallback(() => {
    timer.pause()
    setPauses(prev => prev + 1)
  }, [timer])

  const resumeSession = useCallback(() => {
    timer.resume()
  }, [timer])

  const endSession = useCallback(() => {
    if (!currentSession) return

    const endedSession: FocusSession = {
      ...currentSession,
      actualDuration: Math.floor((currentSession.duration * 60 - timer.timeRemaining) / 60),
      completed: timer.timeRemaining <= 0,
      pauses,
      endedAt: new Date(),
    }

    setSessionHistory(prev => [...prev, endedSession])
    setCurrentSession(null)
    setPauses(0)
    timer.stop()
  }, [currentSession, timer, pauses])

  return {
    currentSession,
    sessionHistory,
    pauses,
    timer,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
  }
}
