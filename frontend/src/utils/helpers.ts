// Formatting utilities
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (mins === 0) {
    return `${hours}h`
  }

  return `${hours}h ${mins}m`
}

export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString()
}

export function formatDateTime(date: Date): string {
  const d = new Date(date)
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
}

// Time calculations
export function calculateProductivityScore(
  completionPercent: number,
  taskCompleted: boolean,
  moodRating: number
): number {
  let score = 0

  score += completionPercent * 0.5
  if (taskCompleted) score += 30
  score += moodRating * 4

  return Math.round(Math.min(100, score) * 10) / 10
}

export function calculateStreak(lastSessionDate: Date | null): number {
  if (!lastSessionDate) return 1

  const now = new Date()
  const last = new Date(lastSessionDate)

  const diffTime = Math.abs(now.getTime() - last.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Streak continues if session within last 24 hours
  return diffDays <= 1 ? 2 : 1
}

// Sound utilities
export function playSoundEffect(type: 'complete' | 'break-end' | 'notification'): void {
  // Use Web Audio API or simple beep
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()

  oscillator.connect(gain)
  gain.connect(audioContext.destination)

  switch (type) {
    case 'complete':
      oscillator.frequency.value = 800
      gain.gain.setValueAtTime(0.3, audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
      break

    case 'break-end':
      oscillator.frequency.value = 1200
      gain.gain.setValueAtTime(0.3, audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
      break

    case 'notification':
      oscillator.frequency.value = 600
      gain.gain.setValueAtTime(0.2, audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
      break
  }
}

// Notification utilities
export function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return Promise.resolve(false)
  }

  if (Notification.permission === 'granted') {
    return Promise.resolve(true)
  }

  if (Notification.permission === 'denied') {
    return Promise.resolve(false)
  }

  return Notification.requestPermission().then(permission => permission === 'granted')
}

export function showNotification(title: string, options?: NotificationOptions): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon.png',
      ...options,
    })
  }
}
