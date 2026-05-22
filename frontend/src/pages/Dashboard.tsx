import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinLatestMeeting } from '../services/meetingService';
import { motion } from 'framer-motion';
import { Play, Clock, CheckCircle2, Flame, Sparkles, TrendingUp, Crown, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { analyticsApi, settingsApi } from '../services/api';
import { formatDuration } from '../utils/helpers';

export default function Dashboard() {
  const navigate = useNavigate();
  const { dashboard, setDashboard } = useAppStore();
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

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      analyticsApi.dashboard(),
      analyticsApi.weekly(),
      settingsApi.coach('pre', { page: 'dashboard' }),
    ])
      .then(([d, w, c]) => {
        setDashboard(d.data);
        setWeekly(w.data);
        setCoachMsg(c.data.message);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [setDashboard]);

  const chartData = weekly?.labels.map((name, i) => ({ name, minutes: weekly.minutes[i] ?? 0 })) ?? [];

  const stats = [
    { label: "Today's Focus", value: formatDuration(dashboard?.today_focus_minutes ?? 0), icon: Clock, color: 'from-blue-500 to-blue-600' },
    { label: 'Tasks Done', value: String(dashboard?.tasks_completed_today ?? 0), icon: CheckCircle2, color: 'from-green-500 to-green-600' },
    { label: 'Streak', value: `${dashboard?.current_streak ?? 0} days`, icon: Flame, color: 'from-orange-500 to-red-600' },
    { label: 'Total Sessions', value: String(dashboard?.total_sessions ?? 0), icon: Sparkles, color: 'from-purple-500 to-pink-600' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6"
    >
      {/* Header */}
      <motion.header variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pt-4">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gradient mb-3">Welcome back</h1>
          {coachMsg && (
            <p className="max-w-xl text-text-secondary italic text-base leading-relaxed border-l-4 border-primary pl-4">
              "{coachMsg}"
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary whitespace-nowrap"
            onClick={() => navigate('/setup')}
          >
            <Play className="h-5 w-5" />
            Solo Focus
          </button>
        </div>
      </motion.header>

      {/* Group focus */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate('/create-meeting')}
          className="card-interactive group text-left"
        >
          <div className="inline-flex rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 p-3 mb-3 text-white group-hover:scale-110 transition-transform">
            <Crown className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-text">Host a Focus Room</h3>
          <p className="mt-1 text-sm text-text-muted">
            Create a room, share your code, and control the group timer as host.
          </p>
        </button>
        <button
          type="button"
          onClick={handleJoinLatest}
          disabled={joiningGroup}
          className="card-interactive group text-left disabled:opacity-60"
        >
          <div className="inline-flex rounded-lg bg-gradient-to-br from-violet-500 to-primary p-3 mb-3 text-white group-hover:scale-110 transition-transform">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-text">
            {joiningGroup ? 'Joining latest room…' : 'Join Latest Focus Room'}
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            Automatically join the most recent active session hosted by someone else.
          </p>
        </button>
      </motion.div>
      {joinError && (
        <p className="text-sm text-amber-400">{joinError}</p>
      )}

      {/* Stats Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} variants={itemVariants} className={`card-interactive group`}>
            <div className={`inline-flex rounded-lg bg-gradient-to-br ${color} p-3 mb-3 text-white group-hover:scale-110 transition-transform`}>
              <Icon className="h-6 w-6" />
            </div>
            <p className="text-sm text-text-muted mb-1">{label}</p>
            <p className="text-3xl font-bold text-text">{value}</p>
            <div className="mt-2 h-1 w-0 bg-gradient-to-r from-primary to-secondary rounded-full group-hover:w-full transition-all duration-300" />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Focus Chart */}
        <div className="lg:col-span-2 card-elevated">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Focus Time This Week
            </h2>
            {chartData.length > 0 && (
              <span className="text-sm text-text-muted">
                Total: {Math.round(chartData.reduce((sum, d) => sum + d.minutes, 0) / 60)}h
              </span>
            )}
          </div>
          {isLoading ? (
            <div className="h-64 bg-surface rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }}
                  formatter={(value) => [`${value} min`, 'Focus Time']}
                />
                <Line 
                  type="monotone" 
                  dataKey="minutes" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                  fillOpacity={1} 
                  fill="url(#colorMinutes)" 
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recommendation Card */}
        <motion.div 
          variants={itemVariants}
          className="card-elevated bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 flex flex-col justify-between"
        >
          <div>
            <div className="inline-flex rounded-lg bg-primary/30 px-3 py-1 mb-4">
              <span className="text-xs font-semibold text-primary-light">Smart Recommendation</span>
            </div>
            <p className="text-sm text-text-secondary mb-2">Optimal session duration</p>
            <p className="text-5xl font-bold text-gradient mb-3">{dashboard?.recommended_duration ?? 25}<span className="text-2xl">min</span></p>
            <p className="text-sm text-text-muted leading-relaxed">
              Based on your activity patterns, we recommend starting with {dashboard?.recommended_duration ?? 25} minutes for maximum productivity.
            </p>
          </div>
          <button 
            type="button" 
            className="btn-primary mt-6 w-full" 
            onClick={() => navigate('/setup')}
          >
            <Play className="h-4 w-4" />
            Start Now
          </button>
        </motion.div>
      </motion.div>

      {/* Daily Breakdown */}
      <motion.div variants={itemVariants} className="card-elevated">
        <h2 className="text-lg font-semibold text-text mb-6">Daily Distribution</h2>
        {isLoading ? (
          <div className="h-40 bg-surface rounded-lg animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }} />
              <Bar dataKey="minutes" radius={[12, 12, 0, 0]} isAnimationActive>
                {chartData.map((_, index) => (
                  <Cell 
                    key={index} 
                    fill={index === chartData.length - 1 ? '#3b82f6' : '#8b5cf6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>
    </motion.div>
  );
}
