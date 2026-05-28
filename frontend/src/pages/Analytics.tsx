import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { analyticsApi } from '../services/api';
import { BarChart3, Clock, TrendingUp, Zap } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const cardStyle = {
  background: 'rgba(255,255,255,0.65)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.9), 0 4px 20px -4px rgba(15,23,42,0.07)',
};

const tooltipStyle = {
  background: 'rgba(255,255,255,0.97)',
  border: '1px solid rgba(255,255,255,0.9)',
  borderRadius: 16,
  boxShadow: '0 8px 32px -4px rgba(15,23,42,0.12)',
  padding: '10px 14px',
};

export default function Analytics() {
  const [weekly, setWeekly] = useState<{ labels: string[]; minutes: number[] } | null>(null);
  const [heatmap, setHeatmap] = useState<{ heatmap: { hour: number; minutes: number }[]; completion_rate: number } | null>(null);
  const [monthly, setMonthly] = useState<{ month: string; minutes: number; sessions: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsApi.weekly(), analyticsApi.heatmap(), analyticsApi.monthly()])
      .then(([w, h, m]) => {
        setWeekly(w.data);
        setHeatmap(h.data);
        setMonthly(m.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const weekData = weekly?.labels.map((name, i) => ({ name, minutes: weekly.minutes[i] })) ?? [];
  const hourData = heatmap?.heatmap.map((h) => ({ hour: `${h.hour}h`, minutes: h.minutes })) ?? [];
  const totalWeekMins = weekData.reduce((s, d) => s + d.minutes, 0);
  const peakHour = hourData.reduce((best, d) => (d.minutes > best.minutes ? d : best), { hour: '–', minutes: 0 });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <motion.div variants={item}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Your Progress</p>
        <h1 className="mt-2 text-4xl font-bold text-text">Analytics</h1>
        <p className="mt-1 text-sm text-text-muted">Track your focus trends and productivity patterns.</p>
      </motion.div>

      {/* KPI Row */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Completion Rate',
            value: `${heatmap?.completion_rate ?? 0}%`,
            icon: Zap,
            color: '#10B981',
            bg: 'rgba(16,185,129,0.1)',
          },
          {
            label: 'This Week',
            value: totalWeekMins >= 60 ? `${Math.round(totalWeekMins / 60)}h` : `${totalWeekMins}m`,
            icon: Clock,
            color: '#5DADE2',
            bg: 'rgba(93,173,226,0.1)',
          },
          {
            label: 'Peak Hour',
            value: peakHour.hour,
            icon: TrendingUp,
            color: '#F0907A',
            bg: 'rgba(240,144,122,0.1)',
          },
          {
            label: 'Monthly Records',
            value: String(monthly.length),
            icon: BarChart3,
            color: '#A78BFA',
            bg: 'rgba(167,139,250,0.1)',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <motion.div
            key={label}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-2xl p-5 backdrop-blur-xl"
            style={cardStyle}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: bg }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color }}>
              {loading ? <span className="inline-block h-7 w-14 animate-pulse rounded-lg bg-slate-200" /> : value}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Weekly Focus Chart */}
      <motion.div variants={item} className="rounded-2xl p-6 backdrop-blur-xl" style={cardStyle}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-text">
              <TrendingUp className="h-5 w-5 text-primary" />
              Weekly Focus
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">Minutes focused per day this week</p>
          </div>
          {totalWeekMins > 0 && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary-dark">
              {totalWeekMins >= 60 ? `${Math.round(totalWeekMins / 60)}h total` : `${totalWeekMins}m total`}
            </span>
          )}
        </div>
        {loading ? (
          <div className="h-56 animate-pulse rounded-xl bg-slate-100" />
        ) : weekData.length === 0 || totalWeekMins === 0 ? (
          <div className="flex h-56 items-center justify-center rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-sm text-text-muted">No data yet — complete a session first!</p>
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5DADE2" />
                    <stop offset="100%" stopColor="#F0907A" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }} formatter={(v) => [`${v} min`, 'Focus']} cursor={{ fill: 'rgba(93,173,226,0.05)', radius: 8 }} />
                <Bar dataKey="minutes" radius={[8, 8, 0, 0]} maxBarSize={48}>
                  {weekData.map((entry, i) => (
                    <Cell key={i} fill={entry.minutes > 0 ? 'url(#weekGrad)' : 'rgba(15,23,42,0.05)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Productive Hours Line Chart */}
      <motion.div variants={item} className="rounded-2xl p-6 backdrop-blur-xl" style={cardStyle}>
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-text">
            <Clock className="h-5 w-5 text-secondary" />
            Peak Productivity Hours
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">When are you most focused throughout the day?</p>
        </div>
        {loading ? (
          <div className="h-56 animate-pulse rounded-xl bg-slate-100" />
        ) : hourData.length === 0 ? (
          <div className="flex h-56 items-center justify-center rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-sm text-text-muted">No hourly data yet.</p>
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#5DADE2" />
                    <stop offset="100%" stopColor="#F0907A" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" vertical={false} />
                <XAxis dataKey="hour" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} interval={2} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }} formatter={(v) => [`${v} min`, 'Focus']} />
                <Line type="monotone" dataKey="minutes" stroke="url(#lineGrad)" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: '#5DADE2', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Monthly Overview */}
      {monthly.length > 0 && (
        <motion.div variants={item}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-text">
            <BarChart3 className="h-5 w-5 text-primary" />
            Monthly Overview
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {monthly.map((m, i) => (
              <motion.div
                key={m.month}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-2xl p-5 backdrop-blur-xl"
                style={cardStyle}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{m.month}</p>
                <p className="mt-2 text-3xl font-bold text-gradient">{Math.round(m.minutes / 60)}h</p>
                <p className="mt-1 text-sm text-text-secondary">{m.sessions} sessions</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
