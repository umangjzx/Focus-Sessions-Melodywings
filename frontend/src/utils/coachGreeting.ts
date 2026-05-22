import type { DashboardStats } from '../services/api';

/** Instant coach line from dashboard stats (no LLM wait). */
export function localCoachGreeting(
  dashboard: DashboardStats | null | undefined,
  userName?: string,
): string {
  const name = userName || 'there';
  if (!dashboard) {
    return 'Hi! Ask me about your tasks, streak, or next focus session.';
  }

  const streak = dashboard.current_streak;
  const today = dashboard.today_focus_minutes;
  const sessions = dashboard.total_sessions;
  const recommended = dashboard.recommended_duration;

  if (today === 0 && streak > 0) {
    return `Hi ${name}! ${streak}-day streak — start a ${recommended} min session when you're ready.`;
  }
  if (today > 0) {
    return `Hi ${name}! ${today}m focused today · ${streak}-day streak · ${sessions} sessions total. Need help picking your next task?`;
  }
  return `Hi ${name}! ${sessions} session${sessions === 1 ? '' : 's'} logged. Try a ${recommended} min focus block to build momentum.`;
}
