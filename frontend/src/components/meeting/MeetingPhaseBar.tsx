import { getMeetingPhase, type MeetingPhase } from '../../utils/meetingUtils';

const PHASES: { id: MeetingPhase; label: string }[] = [
  { id: 'waiting', label: 'Waiting' },
  { id: 'focus', label: 'Focus' },
  { id: 'paused', label: 'Paused' },
  { id: 'done', label: 'Done' },
];

export default function MeetingPhaseBar({ status }: { status: string }) {
  const current = getMeetingPhase(status);
  const currentIndex = PHASES.findIndex((p) => p.id === current);

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {PHASES.map((phase, i) => {
        const active = i === currentIndex;
        const done = i < currentIndex;
        return (
          <div key={phase.id} className="flex items-center gap-1 sm:gap-2">
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition sm:px-3 ${
                active
                  ? 'bg-primary/25 text-primary'
                  : done
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-slate-800/80 text-slate-500'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  active ? 'bg-primary' : done ? 'bg-emerald-400' : 'bg-slate-600'
                }`}
              />
              <span className="hidden sm:inline">{phase.label}</span>
            </div>
            {i < PHASES.length - 1 && (
              <div
                className={`h-px w-4 sm:w-8 ${done ? 'bg-emerald-500/40' : 'bg-slate-700'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
