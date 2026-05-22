import { useAppStore } from '../store/useAppStore';

export type CoachClientParams = {
  page?: string;
  planned_minutes?: number;
  session_title?: string;
  task_title?: string;
  goal?: string;
  in_focus_session?: boolean;
};

/** Map route + store state into hints the backend merges with your DB profile. */
export function buildCoachClient(pathname: string, extra?: CoachClientParams): CoachClientParams {
  const { activeSession } = useAppStore.getState();
  const segment = pathname.replace(/^\//, '').split('/')[0] || 'dashboard';
  const page =
    pathname === '/' ? 'dashboard' : segment === 'meeting' ? 'meeting' : segment;

  const base: CoachClientParams = {
    page,
    in_focus_session: pathname === '/focus',
    ...extra,
  };

  if (activeSession) {
    base.planned_minutes = activeSession.plannedMinutes;
    base.session_title = activeSession.title;
    base.task_title = activeSession.taskTitle;
    base.goal = activeSession.goal;
  }

  return base;
}
