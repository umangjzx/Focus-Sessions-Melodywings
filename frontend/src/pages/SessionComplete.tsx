import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy, Zap, Flame, CheckCircle2, LayoutDashboard, Play } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { sessionsApi, settingsApi } from '../services/api';

const cardStyle = {
  background: 'rgba(255,255,255,0.70)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.9), 0 8px 32px -8px rgba(15,23,42,0.10)',
  backdropFilter: 'blur(24px)',
};

const MOODS = ['😩', '😕', '😐', '😊', '🤩'];

export default function SessionComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeSession, setActiveSession, setUnlockedBadges, loadInitialData } = useAppStore();
  const [mood, setMood] = useState(4);
  const [notes, setNotes] = useState('');
  const [taskDone, setTaskDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    productivity_score: number;
    xp_earned: number;
    streak: { current_streak: number; level: number };
    unlocked_achievements: { badge_name: string }[];
  } | null>(null);
  const [coachMsg, setCoachMsg] = useState('');

  const state = location.state as { elapsedMin?: number; pauses?: number } | null;
  const elapsed = state?.elapsedMin ?? activeSession?.plannedMinutes ?? 25;
  const pauses = state?.pauses ?? 0;

  async function handleSubmit() {
    if (!activeSession) return;
    setSubmitting(true);
    try {
      const { data } = await sessionsApi.complete(activeSession.dbSessionId, {
        actual_minutes: elapsed,
        pauses,
        mood,
        notes,
        task_completed: taskDone,
      });
      setResult({
        productivity_score: data.productivity_score,
        xp_earned: data.xp_earned,
        streak: data.streak,
        unlocked_achievements: data.unlocked_achievements,
      });
      setUnlockedBadges(data.unlocked_achievements);
      await loadInitialData();
      const coach = await settingsApi.coach('end', {
        page: 'complete',
        planned_minutes: elapsed,
        session_title: activeSession.title,
        task_title: activeSession.taskTitle,
        goal: activeSession.goal,
      });
      setCoachMsg(coach.data.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl p-8 text-center"
          style={cardStyle}
        >
          {/* Confetti glows */}
          <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-12 -bottom-12 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />

          {/* Trophy */}
          <motion.div
            animate={{ rotate: [0, -10, 10, -5, 5, 0], y: [0, -8, 0] }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-gradient text-4xl shadow-xl shadow-primary/25"
          >
            🏆
          </motion.div>

          <h1 className="text-3xl font-black text-text">Session Complete!</h1>
          <p className="mt-1 text-text-muted">{elapsed} minutes of deep focus</p>

          {coachMsg && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mx-auto mt-4 max-w-sm text-sm italic text-primary-dark"
            >
              "{coachMsg}"
            </motion.p>
          )}

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { label: 'Focus Score', value: `${result.productivity_score}`, icon: '⭐', color: '#5DADE2', bg: 'rgba(93,173,226,0.1)' },
              { label: 'XP Earned', value: `+${result.xp_earned}`, icon: '⚡', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
              { label: 'Day Streak', value: `${result.streak.current_streak}d`, icon: '🔥', color: '#F0907A', bg: 'rgba(240,144,122,0.1)' },
              { label: 'Your Level', value: `Lvl ${result.streak.level}`, icon: '🎯', color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
            ].map(({ label, value, icon, color, bg }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl p-4 text-left"
                style={{ backgroundColor: bg }}
              >
                <span className="text-xl">{icon}</span>
                <p className="mt-1 text-xl font-bold" style={{ color }}>{value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Badge unlock */}
          <AnimatePresence>
            {result.unlocked_achievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-50 p-4"
              >
                <p className="flex items-center justify-center gap-2 font-bold text-amber-600">
                  🏅 Badge Unlocked!
                </p>
                {result.unlocked_achievements.map((a) => (
                  <p key={a.badge_name} className="mt-1 text-sm text-amber-700">{a.badge_name}</p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setActiveSession(null); navigate('/setup'); }}
            >
              <Play className="h-4 w-4" />
              New Session
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => { setActiveSession(null); navigate('/'); }}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl p-8"
        style={cardStyle}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
              ⏱️
            </div>
            <h1 className="text-2xl font-black text-text">How did it go?</h1>
            <p className="mt-1 text-sm text-text-muted">
              Planned {activeSession?.plannedMinutes}m · ~{elapsed}m actual
              {pauses > 0 && ` · ${pauses} pause${pauses > 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Mood Selector */}
          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold text-text-secondary">How focused did you feel?</p>
            <div className="flex justify-between gap-2">
              {MOODS.map((emoji, i) => {
                const val = i + 1;
                return (
                  <motion.button
                    key={val}
                    type="button"
                    onClick={() => setMood(val)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className={`flex h-14 w-14 flex-1 items-center justify-center rounded-2xl text-2xl transition-all duration-200 ${
                      mood === val
                        ? 'bg-primary/15 ring-2 ring-primary shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {emoji}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Task completed toggle */}
          {activeSession?.taskTitle && (
            <label className="mb-6 flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={taskDone}
                onChange={(e) => setTaskDone(e.target.checked)}
                className="h-5 w-5 rounded accent-primary cursor-pointer"
              />
              <div>
                <p className="font-semibold text-text">Task completed?</p>
                <p className="text-xs text-text-muted truncate">{activeSession.taskTitle}</p>
              </div>
              {taskDone && <CheckCircle2 className="ml-auto h-5 w-5 text-green-500 shrink-0" />}
            </label>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-text-secondary">Session reflection (optional)</label>
            <textarea
              className="input-field min-h-[90px] resize-none"
              placeholder="What did you accomplish? Any distractions?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <motion.button
            type="button"
            className="btn-primary w-full py-4 text-base"
            disabled={submitting}
            onClick={handleSubmit}
            whileHover={{ scale: submitting ? 1 : 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {submitting ? (
              <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                Saving results…
              </motion.span>
            ) : (
              <>
                <Trophy className="h-5 w-5" />
                Save & See Results
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
