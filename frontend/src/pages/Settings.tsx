import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, AppTheme } from '../store/useAppStore';
import { settingsApi } from '../services/api';
import {
  Bell, Coffee, Brain, Volume2, Clock, Save, CheckCircle2,
} from 'lucide-react';

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

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 ${
        checked ? 'bg-brand-gradient shadow-sm shadow-primary/30' : 'bg-slate-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-all duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { settings, setTheme, theme, loadInitialData } = useAppStore();
  const [duration, setDuration] = useState(25);
  const [notifications, setNotifications] = useState(true);
  const [autoBreak, setAutoBreak] = useState(true);
  const [volume, setVolume] = useState(80);
  const [aiCoach, setAiCoach] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  const DURATIONS = [5, 15, 25, 45, 60, 90];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <motion.div variants={item}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Preferences</p>
        <h1 className="mt-2 text-4xl font-bold text-text">Settings</h1>
        <p className="mt-1 text-sm text-text-muted">Personalize your focus experience.</p>
      </motion.div>

      {/* Session Duration */}
      <motion.div variants={item} className="rounded-2xl p-6 backdrop-blur-xl" style={cardStyle}>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-text">Default Session Duration</h2>
            <p className="text-xs text-text-muted">Set how long your focus sessions last by default</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {DURATIONS.map((d) => (
            <motion.button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`rounded-xl py-3 text-sm font-bold transition-all duration-200 ${
                duration === d
                  ? 'bg-brand-gradient text-white shadow-md shadow-primary/25'
                  : 'bg-slate-100 text-text-secondary hover:bg-slate-200'
              }`}
            >
              {d}m
            </motion.button>
          ))}
        </div>
        <div className="mt-4">
          <label className="mb-2 block text-sm font-semibold text-text-secondary">
            Or set custom: <span className="text-primary-dark">{duration} minutes</span>
          </label>
          <input
            type="number"
            className="input-field"
            min={5}
            max={180}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>
      </motion.div>

      {/* Toggles */}
      <motion.div variants={item} className="rounded-2xl p-6 backdrop-blur-xl" style={cardStyle}>
        <h2 className="mb-5 font-bold text-text">Preferences</h2>
        <div className="space-y-5">
          {[
            {
              icon: Bell,
              color: '#5DADE2',
              bg: 'rgba(93,173,226,0.1)',
              label: 'Notifications',
              desc: 'Get alerts when sessions and breaks end',
              value: notifications,
              onChange: setNotifications,
            },
            {
              icon: Coffee,
              color: '#F0907A',
              bg: 'rgba(240,144,122,0.1)',
              label: 'Auto-start Breaks',
              desc: 'Automatically begin break time after work intervals',
              value: autoBreak,
              onChange: setAutoBreak,
            },
            {
              icon: Brain,
              color: '#A78BFA',
              bg: 'rgba(167,139,250,0.1)',
              label: 'AI Focus Coach',
              desc: 'Get personalized guidance and motivation from your AI coach',
              value: aiCoach,
              onChange: setAiCoach,
            },
          ].map(({ icon: Icon, color, bg, label, desc, value, onChange }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: bg }}>
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <div>
                  <p className="font-semibold text-text">{label}</p>
                  <p className="text-xs text-text-muted">{desc}</p>
                </div>
              </div>
              <Toggle checked={value} onChange={onChange} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Volume */}
      <motion.div variants={item} className="rounded-2xl p-6 backdrop-blur-xl" style={cardStyle}>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
            <Volume2 className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h2 className="font-bold text-text">Ambient Sound Volume</h2>
            <p className="text-xs text-text-muted">Control background sound intensity during sessions</p>
          </div>
          <span className="ml-auto text-lg font-bold text-primary-dark">{volume}%</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full cursor-pointer appearance-none rounded-full accent-primary"
            style={{ height: '6px' }}
          />
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div variants={item}>
        <motion.button
          type="button"
          className="btn-primary w-full py-4 text-base"
          disabled={saving || saved}
          onClick={handleSave}
          whileHover={{ scale: saving || saved ? 1 : 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {saving ? (
            <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
              Saving…
            </motion.span>
          ) : saved ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Settings Saved!
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Save Settings
            </span>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
