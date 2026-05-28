import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinLatestMeeting } from '../services/meetingService';
import { motion } from 'framer-motion';
import {
  Play,
  Clock,
  CheckCircle2,
  Flame,
  Sparkles,
  Crown,
  Users,
  MessageCircle,
  RefreshCw,
  TrendingUp,
  Zap,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import ChartBox from '../components/charts/ChartBox';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/authStore';
import { analyticsApi, settingsApi } from '../services/api';
import { formatDuration } from '../utils/helpers';
import { localCoachGreeting } from '../utils/coachGreeting';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { dashboard, setDashboard } = useAppStore();
  const user = useAuthStore((s) => s.user);
  const [weekly, setWeekly] = useState<{ labels: string[]; minutes: number[] } | null>(null);
  const [coachMsg, setCoachMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [joinError, setJoinError] = useState('');

  async function handleJoinLatest() {
    setJoinError('');
    setJoiningGroup(true);
    try {
      const data = await joinLatestMeeting();
      navigate(`/meeting/${data.room_code}`);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'No active rooms to join.');
      navigate('/join-meeting');
    } finally {
      setJoiningGroup(false);
    }
  }

  async function loadData() {
    setIsLoading(true);
    try {
      const [d, w] = await Promise.all([analyticsApi.dashboard(), analyticsApi.weekly()]);
      setDashboard(d.data);
      setWeekly(w.data);
      setCoachMsg(localCoachGreeting(d.data, user?.name));
      settingsApi
        .coachGreeting({ page: 'dashboard' })
        .then((c) => setCoachMsg(c.data.message))
        .catch(() => {});
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartData =
    weekly?.labels.map((name, i) => ({ name, minutes: weekly.minutes[i] ?? 0 })) ?? [];
  const weekTotalMinutes = chartData.reduce((sum, d) => sum + d.minutes, 0);

  const stats = [
    {
      label: "Today's Focus",
      value: formatDuration(dashboard?.today_focus_minutes ?? 0),
      sublabel: 'minutes today',
      icon: Clock,
      color: '#5DADE2',
      bg: 'rgba(93, 173, 226, 0.1)',
    },
    {
      label: 'Tasks Done',
      value: String(dashboard?.tasks_completed_today ?? 0),
      sublabel: 'completed today',
      icon: CheckCircle2,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      label: 'Current Streak',
      value: `${dashboard?.current_streak ?? 0}`,
      sublabel: dashboard?.current_streak === 1 ? 'day' : 'days',
      icon: Flame,
      color: '#F0907A',
      bg: 'rgba(240, 144, 122, 0.1)',
    },
    {
      label: 'Total Sessions',
      value: String(dashboard?.total_sessions ?? 0),
      sublabel: 'all time',
      icon: Sparkles,
      color: '#A78BFA',
      bg: 'rgba(167, 139, 250, 0.1)',
    },
    {
      label: 'Total XP',
      value: String(dashboard?.total_xp ?? 0),
      sublabel: `Level ${dashboard?.level ?? 1}`,
      icon: Zap,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    {
      label: 'Recommended',
      value: `${dashboard?.recommended_duration ?? 25}`,
      sublabel: 'min/session',
      icon: TrendingUp,
      color: '#EC4899',
      bg: 'rgba(236, 72, 153, 0.1)',
    },
  ];

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-6xl space-y-8"
    >
      {/* ===== HERO WELCOME SECTION ===== */}
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-3xl p-8 lg:p-10"
        style={{
          background: 'linear-gradient(135deg, rgba(93,173,226,0.12) 0%, rgba(255,255,255,0.7) 50%, rgba(240,144,122,0.10) 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.9), 0 8px 32px -8px rgba(15,23,42,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Decorative gradient blob */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-gradient opacity-10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-primary-light/20 blur-2xl" />

        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Your Focus Journey
            </p>
            <h1 className="text-3xl font-bold text-text sm:text-4xl lg:text-5xl">
              Welcome back,{' '}
              <span className="text-gradient">{firstName}</span> 👋
            </h1>
            {coachMsg && (
              <p className="max-w-xl text-sm text-text-muted italic leading-relaxed sm:text-base">
                "{coachMsg}"
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => loadData()}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => window.dispatchEvent(new CustomEvent('focus-coach-open'))}
            >
              <MessageCircle className="h-4 w-4" />
              Ask Coach
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/setup')}
            >
              <Play className="h-4 w-4" />
              Start Session
            </button>
          </div>
        </div>
      </motion.div>

      {/* ===== STATS GRID ===== */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(({ label, value, sublabel, icon: Icon, color, bg }, idx) => (
          <motion.div
            key={label}
            variants={item}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="relative overflow-hidden rounded-2xl p-5 backdrop-blur-xl"
            style={{
              background: 'rgba(255,255,255,0.65)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.9), 0 4px 20px -4px rgba(15,23,42,0.07)',
            }}
          >
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: bg }}
            >
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color }}>
              {isLoading ? (
                <span className="inline-block h-7 w-12 animate-pulse rounded-lg bg-slate-200" />
              ) : (
                value
              )}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {label}
            </p>
            <p className="text-xs text-text-subtle">{sublabel}</p>
          </motion.div>
        ))}
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate('/create-meeting')}
          className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1"
          style={{
            background: 'rgba(255,255,255,0.65)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.9), 0 4px 20px -4px rgba(15,23,42,0.07)',
          }}
        >
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-primary/20" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-110">
              <Crown className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-text">Host a Focus Room</h3>
              <p className="mt-0.5 text-sm text-text-muted">Create a room and lead the timer.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-text-subtle transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary" />
          </div>
        </button>

        <button
          type="button"
          onClick={handleJoinLatest}
          disabled={joiningGroup}
          className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 disabled:opacity-60"
          style={{
            background: 'rgba(255,255,255,0.65)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.9), 0 4px 20px -4px rgba(15,23,42,0.07)',
          }}
        >
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-secondary/10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-secondary/20" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-secondary/20 transition-transform duration-300 group-hover:scale-110">
              <Users className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-text">
                {joiningGroup ? 'Joining…' : 'Join Latest Room'}
              </h3>
              <p className="mt-0.5 text-sm text-text-muted">
                Drop into the most recent active session.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-text-subtle transition-all duration-200 group-hover:translate-x-1 group-hover:text-secondary" />
          </div>
        </button>
      </motion.div>
      {joinError && <p className="text-sm text-error">{joinError}</p>}

      {/* ===== CHARTS SECTION ===== */}
      <motion.div variants={item} className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Focus Chart */}
        <div
          className="rounded-2xl p-6 lg:col-span-2 backdrop-blur-xl"
          style={{
            background: 'rgba(255,255,255,0.65)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.9), 0 4px 20px -4px rgba(15,23,42,0.07)',
          }}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-text">
                <TrendingUp className="h-5 w-5 text-primary" />
                Focus Time This Week
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                Daily breakdown of your focused minutes
              </p>
            </div>
            {!isLoading && weekTotalMinutes > 0 && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary-dark">
                {weekTotalMinutes >= 60
                  ? `${Math.round(weekTotalMinutes / 60)}h total`
                  : `${weekTotalMinutes}m total`}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="h-[240px] animate-pulse rounded-xl bg-slate-100" />
          ) : weekTotalMinutes === 0 ? (
            <div className="flex h-[240px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <TrendingUp className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-semibold text-text-secondary">No focus time logged yet</p>
              <p className="mt-1 text-xs text-text-muted">Complete your first session to see the chart!</p>
              <button
                type="button"
                className="btn-primary mt-4"
                onClick={() => navigate('/setup')}
              >
                <Play className="h-4 w-4" />
                Start first session
              </button>
            </div>
          ) : (
            <ChartBox height={240}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5DADE2" />
                      <stop offset="100%" stopColor="#F0907A" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid rgba(255,255,255,0.9)',
                      borderRadius: 16,
                      boxShadow: '0 8px 32px -4px rgba(15,23,42,0.12)',
                      padding: '10px 14px',
                    }}
                    labelStyle={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}
                    formatter={(value) => [`${value} min`, 'Focus']}
                    cursor={{ fill: 'rgba(93,173,226,0.05)', radius: 8 }}
                  />
                  <Bar dataKey="minutes" radius={[8, 8, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.minutes > 0 ? 'url(#barGradient)' : 'rgba(15,23,42,0.05)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          )}
        </div>

        {/* Smart Recommendation Card */}
        <div className="relative overflow-hidden rounded-2xl p-6">
          <div className="absolute inset-0 bg-brand-gradient" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10" />

          <div className="relative flex h-full flex-col text-white">
            <div className="mb-4 inline-flex items-center gap-2 self-start rounded-full bg-white/25 px-3 py-1.5 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">Smart Pick</span>
            </div>

            <p className="text-sm font-semibold opacity-90">Optimal duration</p>
            <p className="mt-1 text-6xl font-black leading-none">
              {dashboard?.recommended_duration ?? 25}
              <span className="text-2xl font-bold">min</span>
            </p>

            <div className="my-4 h-px bg-white/20" />

            <p className="flex-1 text-sm leading-relaxed opacity-80">
              Based on your patterns, sessions of this length give you the best focus quality.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
                <p className="text-lg font-bold">{dashboard?.current_streak ?? 0}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">Day Streak</p>
              </div>
              <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
                <p className="text-lg font-bold">{dashboard?.level ?? 1}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">Current Level</p>
              </div>
            </div>

            <button
              type="button"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-primary-dark shadow-lg shadow-black/10 transition hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => navigate('/setup')}
            >
              <Play className="h-4 w-4" />
              Start Now
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
