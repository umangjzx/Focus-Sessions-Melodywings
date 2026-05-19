import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Lock } from 'lucide-react';
import { achievementsApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';

const ALL_BADGES = [
  { badge_name: 'First Focus Session', description: 'Complete your first focus session' },
  { badge_name: '5 Sessions Completed', description: 'Complete 5 focus sessions' },
  { badge_name: '7-Day Streak', description: 'Maintain a 7-day focus streak' },
  { badge_name: '25 Hours Focused', description: 'Accumulate 25 hours of focus time' },
  { badge_name: '100 Tasks Completed', description: 'Complete 100 tasks' },
];

export default function Achievements() {
  const [earned, setEarned] = useState<{ badge_name: string; earned_at: string }[]>([]);
  const { dashboard } = useAppStore();

  useEffect(() => {
    achievementsApi.getAll().then((r) => setEarned(r.data));
  }, []);

  const earnedNames = new Set(earned.map((a) => a.badge_name));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-3xl font-bold text-white">Achievements</h1>
      <p className="text-slate-400">Level {dashboard?.level ?? 1} · {dashboard?.total_xp ?? 0} XP</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {ALL_BADGES.map((badge, i) => {
          const unlocked = earnedNames.has(badge.badge_name);
          return (
            <motion.div key={badge.badge_name} className={`card flex gap-4 ${unlocked ? 'border-amber-500/30' : 'opacity-60'}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <motion.div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${unlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-500'}`}>
                {unlocked ? <Award className="h-7 w-7" /> : <Lock className="h-7 w-7" />}
              </motion.div>
              <div>
                <p className="font-semibold text-white">{badge.badge_name}</p>
                <p className="text-sm text-slate-400">{badge.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
