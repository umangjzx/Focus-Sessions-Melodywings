import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Trophy } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { sessionsApi, settingsApi } from '../services/api';

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
      const coach = await settingsApi.coach('end');
      setCoachMsg(coach.data.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="card max-w-lg w-full text-center">
          <Trophy className="mx-auto h-16 w-16 text-amber-400" />
          <h1 className="mt-4 text-3xl font-bold">Session Complete!</h1>
          <p className="mt-2 text-slate-400">{elapsed} minutes focused</p>
          {coachMsg && <p className="mt-4 italic text-primary">"{coachMsg}"</p>}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-700/30 p-4">
              <p className="text-sm text-slate-400">Score</p>
              <p className="text-3xl font-bold text-primary">{result.productivity_score}</p>
            </div>
            <div className="rounded-2xl bg-slate-700/30 p-4">
              <p className="text-sm text-slate-400">XP</p>
              <p className="text-3xl font-bold text-emerald-400">+{result.xp_earned}</p>
            </div>
          </div>
          <p className="mt-4 text-slate-300">Streak: {result.streak.current_streak} days · Level {result.streak.level}</p>
          {result.unlocked_achievements.length > 0 && (
            <motion.div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4" animate={{ scale: [1, 1.05, 1] }}>
              <p className="font-semibold text-amber-300">Badge unlocked!</p>
              {result.unlocked_achievements.map((a) => (
                <p key={a.badge_name}>{a.badge_name}</p>
              ))}
            </motion.div>
          )}
          <button type="button" className="btn-primary mt-8 w-full" onClick={() => { setActiveSession(null); navigate('/'); }}>
            Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <motion.div className="card max-w-lg w-full space-y-6">
        <h1 className="text-2xl font-bold">How did it go?</h1>
        <p className="text-slate-400">Planned {activeSession?.plannedMinutes}m · ~{elapsed}m actual</p>
        <motion.div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setMood(n)} className={`flex h-12 w-12 items-center justify-center rounded-xl ${mood >= n ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-700 text-slate-500'}`}>
              <Star className={mood >= n ? 'fill-current' : ''} />
            </button>
          ))}
        </motion.div>
        <label className="flex items-center gap-3 text-slate-300">
          <input type="checkbox" checked={taskDone} onChange={(e) => setTaskDone(e.target.checked)} className="accent-emerald-500" />
          Task completed
        </label>
        <textarea className="input-field min-h-[100px]" placeholder="Reflection…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button type="button" className="btn-primary w-full" disabled={submitting} onClick={handleSubmit}>
          {submitting ? 'Saving…' : 'Save & Celebrate'}
        </button>
      </motion.div>
    </div>
  );
}
