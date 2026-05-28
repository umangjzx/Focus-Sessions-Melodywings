import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Lock, Star, Zap } from 'lucide-react';
import { achievementsApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';

const ALL_BADGES = [
  {
    badge_name: 'First Focus Session',
    description: 'Complete your very first focus session',
    emoji: '🚀',
    color: '#5DADE2',
    bg: 'rgba(93,173,226,0.12)',
  },
  {
    badge_name: '5 Sessions Completed',
    description: 'Build momentum with 5 completed sessions',
    emoji: '🔥',
    color: '#F0907A',
    bg: 'rgba(240,144,122,0.12)',
  },
  {
    badge_name: '7-Day Streak',
    description: 'Maintain a 7-day focus streak',
    emoji: '⚡',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
  },
  {
    badge_name: '25 Hours Focused',
    description: 'Accumulate 25 total hours of focus time',
    emoji: '⏱️',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
  },
  {
    badge_name: '100 Tasks Completed',
    description: 'Complete 100 tasks — a true achiever!',
    emoji: '🏆',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.12)',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const cardStyle = {
  background: 'rgba(255,255,255,0.65)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.9), 0 4px 20px -4px rgba(15,23,42,0.07)',
};

export default function Achievements() {
  const [earned, setEarned] = useState<{ badge_name: string; earned_at: string }[]>([]);
  const { dashboard } = useAppStore();

  useEffect(() => {
    achievementsApi.getAll().then((r) => setEarned(r.data));
  }, []);

  const earnedNames = new Set(earned.map((a) => a.badge_name));
  const earnedCount = ALL_BADGES.filter((b) => earnedNames.has(b.badge_name)).length;
  const xp = dashboard?.total_xp ?? 0;
  const level = dashboard?.level ?? 1;
  const xpToNext = level * 100;
  const xpProgress = Math.min((xp % xpToNext) / xpToNext, 1) * 100;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <motion.div variants={item}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Your Milestones</p>
        <h1 className="mt-2 text-4xl font-bold text-text">Achievements</h1>
        <p className="mt-1 text-sm text-text-muted">Keep going — every session earns you rewards!</p>
      </motion.div>

      {/* XP & Level Card */}
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-3xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(93,173,226,0.15) 0%, rgba(255,255,255,0.7) 50%, rgba(240,144,122,0.12) 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.9), 0 8px 32px -8px rgba(15,23,42,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-gradient opacity-10 blur-3xl" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-2xl font-black text-white shadow-lg shadow-primary/25">
              {level}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Current Level</p>
              <p className="text-2xl font-bold text-text">Level {level}</p>
              <p className="text-sm text-text-muted">{xp} XP total</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
            <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-amber-700">{earnedCount} / {ALL_BADGES.length} Badges</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary-dark">{xpToNext - (xp % xpToNext)} XP to Level {level + 1}</span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs font-semibold text-text-muted">
            <span>Progress to Level {level + 1}</span>
            <span>{Math.round(xpProgress)}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200/70">
            <motion.div
              className="h-full rounded-full bg-brand-gradient"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Badges Grid */}
      <motion.div variants={item}>
        <h2 className="mb-4 text-lg font-bold text-text">Badges</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {ALL_BADGES.map((badge, i) => {
            const unlocked = earnedNames.has(badge.badge_name);
            return (
              <motion.div
                key={badge.badge_name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`relative overflow-hidden rounded-2xl p-5 backdrop-blur-xl transition-all ${
                  unlocked ? '' : 'opacity-55'
                }`}
                style={{
                  ...cardStyle,
                  ...(unlocked ? { boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.9), 0 4px 20px -4px ${badge.color}30` } : {}),
                }}
              >
                {unlocked && (
                  <div
                    className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl"
                    style={{ backgroundColor: `${badge.color}30` }}
                  />
                )}
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
                    style={{ backgroundColor: unlocked ? badge.bg : 'rgba(15,23,42,0.05)' }}
                  >
                    {unlocked ? badge.emoji : <Lock className="h-6 w-6 text-text-subtle" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-text">{badge.badge_name}</p>
                      {unlocked && (
                        <Award className="h-4 w-4 shrink-0" style={{ color: badge.color }} />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-text-muted">{badge.description}</p>
                    {unlocked && (
                      <span
                        className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                      >
                        Unlocked ✓
                      </span>
                    )}
                    {!unlocked && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-subtle">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
