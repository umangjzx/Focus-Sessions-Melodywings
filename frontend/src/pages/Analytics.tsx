import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { analyticsApi } from '../services/api';

export default function Analytics() {
  const [weekly, setWeekly] = useState<{ labels: string[]; minutes: number[] } | null>(null);
  const [heatmap, setHeatmap] = useState<{ heatmap: { hour: number; minutes: number }[]; completion_rate: number } | null>(null);
  const [monthly, setMonthly] = useState<{ month: string; minutes: number; sessions: number }[]>([]);

  useEffect(() => {
    Promise.all([analyticsApi.weekly(), analyticsApi.heatmap(), analyticsApi.monthly()]).then(([w, h, m]) => {
      setWeekly(w.data);
      setHeatmap(h.data);
      setMonthly(m.data);
    });
  }, []);

  const weekData = weekly?.labels.map((name, i) => ({ name, minutes: weekly.minutes[i] })) ?? [];
  const hourData = heatmap?.heatmap.map((h) => ({ hour: `${h.hour}:00`, minutes: h.minutes })) ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-5xl space-y-8">
      <h1 className="text-3xl font-bold text-white">Analytics</h1>
      <div className="card">
        <p className="text-sm text-slate-400">Completion rate</p>
        <p className="text-3xl font-bold text-emerald-400">{heatmap?.completion_rate ?? 0}%</p>
      </div>
      <div className="card">
        <h2 className="mb-4 font-semibold">Weekly focus</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#1e293b', borderRadius: 12 }} />
              <Bar dataKey="minutes" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <h2 className="mb-4 font-semibold">Productive hours</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} interval={2} />
              <YAxis stroke="#94a3b8" />
              <Line type="monotone" dataKey="minutes" stroke="#8B5CF6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {monthly.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-3">
          {monthly.map((m) => (
            <div key={m.month} className="card">
              <p className="text-sm text-slate-400">{m.month}</p>
              <p className="text-xl font-bold">{Math.round(m.minutes / 60)}h</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
