import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, AppTheme } from '../store/useAppStore';
import { settingsApi } from '../services/api';

export default function SettingsPage() {
  const { settings, setTheme, theme, loadInitialData } = useAppStore();
  const [duration, setDuration] = useState(25);
  const [notifications, setNotifications] = useState(true);
  const [autoBreak, setAutoBreak] = useState(true);
  const [volume, setVolume] = useState(80);
  const [aiCoach, setAiCoach] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setDuration(settings.default_duration);
      setNotifications(settings.notifications_enabled);
      setAutoBreak(settings.auto_start_breaks);
      setVolume(settings.sound_volume);
      setAiCoach(settings.ai_coach_enabled);
    }
  }, [settings]);

  async function handleSave() {
    setSaving(true);
    try {
      await settingsApi.update({
        default_duration: duration,
        theme,
        notifications_enabled: notifications,
        auto_start_breaks: autoBreak,
        sound_volume: volume,
        ai_coach_enabled: aiCoach,
      });
      await loadInitialData();
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-white">Settings</h1>
      <div className="card space-y-6">
        <div>
          <label className="mb-2 block text-sm text-slate-300">Default session (minutes)</label>
          <input type="number" className="input-field" min={5} max={120} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </div>
        <div className="flex gap-2">
          {(['dark', 'light', 'calm-blue', 'forest-green'] as AppTheme[]).map((t) => (
            <button key={t} type="button" onClick={() => setTheme(t)} className={`flex-1 rounded-xl py-3 capitalize ${theme === t ? 'bg-primary text-white' : 'bg-slate-700 text-slate-300'}`}>{t.replace('-', ' ')}</button>
          ))}
        </div>
        <label className="flex justify-between text-slate-300">
          <span>Notifications</span>
          <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} className="accent-primary" />
        </label>
        <label className="flex justify-between text-slate-300">
          <span>Auto-start breaks</span>
          <input type="checkbox" checked={autoBreak} onChange={(e) => setAutoBreak(e.target.checked)} className="accent-primary" />
        </label>
        <label className="flex justify-between text-slate-300">
          <span>AI focus coach</span>
          <input type="checkbox" checked={aiCoach} onChange={(e) => setAiCoach(e.target.checked)} className="accent-primary" />
        </label>
        <motion.div>
          <label className="mb-2 block text-sm text-slate-300">Volume: {volume}%</label>
          <input type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full accent-primary" />
        </motion.div>
        <button type="button" className="btn-primary w-full" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </motion.div>
  );
}
