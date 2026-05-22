export type MeetingPhase = 'waiting' | 'focus' | 'paused' | 'done';

export function getMeetingPhase(status: string): MeetingPhase {
  const s = (status || 'WAITING').toUpperCase();
  if (s === 'COMPLETED') return 'done';
  if (s === 'PAUSED') return 'paused';
  if (s === 'RUNNING') return 'focus';
  return 'waiting';
}

export function formatTimer(seconds: number | null): string {
  if (seconds == null) return '— : —';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function buildInviteUrl(roomCode: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/join-meeting?code=${roomCode.toUpperCase()}`;
}

export function buildJoinMessage(roomCode: string, title?: string): string {
  const url = buildInviteUrl(roomCode);
  const name = title ? `"${title}"` : 'my focus room';
  return `Join ${name} on Focus Sessions!\nCode: ${roomCode.toUpperCase()}\n${url}`;
}
