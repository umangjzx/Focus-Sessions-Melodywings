import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Timer, Target, Play, CheckCircle2, Volume2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore } from '../store/useAppStore';
import { tasksApi, sessionsApi, settingsApi } from '../services/api';
import { AMBIENT_SOUNDS } from '../data/ambientSounds';
import type { Task } from '../services/api';
import { sessionSetupSchema, type SessionSetupValues } from '../validation/schemas';

const POMODORO_PRESETS = [
  { label: '25 / 5', work: 25, break: 5 },
  { label: '50 / 10', work: 50, break: 10 },
  { label: 'Custom', work: 0, break: 0 },
];
const DURATIONS = [5, 15, 25, 45, 60, 90, 120];

export default function SessionSetup() {
  const navigate = useNavigate();
  const { settings, setActiveSession } = useAppStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [preset, setPreset] = useState(0);
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [coachMsg, setCoachMsg] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SessionSetupValues>({
    resolver: zodResolver(sessionSetupSchema),
    defaultValues: {
      title: '',
      task_id: undefined,
      goal: '',
      planned_minutes: settings?.default_duration ?? 25,
      ambient_sound: settings?.preferred_sound ?? 'rain',
      auto_start_breaks: settings?.auto_start_breaks ?? true,
      strict_mode: false,
    },
  });

  const plannedMinutes = watch('planned_minutes');
  const autoBreak = watch('auto_start_breaks');

  useEffect(() => {
    tasksApi.getAll().then((r) => setTasks(r.data.filter((t) => t.status !== 'completed')));
    settingsApi.coach('pre').then((r) => setCoachMsg(r.data.message));
  }, []);

  useEffect(() => {
    if (!settings) return;
    setValue('planned_minutes', settings.default_duration, { shouldValidate: true });
    setValue('ambient_sound', settings.preferred_sound ?? 'rain', { shouldValidate: true });
    setValue('auto_start_breaks', settings.auto_start_breaks ?? true, { shouldValidate: true });
  }, [settings, setValue]);

  const pomodoro = POMODORO_PRESETS[preset];
  const workMin = preset === 2 ? Math.max(5, customWork || 25) : pomodoro.work || plannedMinutes;
  const breakMin = preset === 2 ? Math.max(1, customBreak || 5) : pomodoro.break;

  async function onSubmit(values: SessionSetupValues) {
    try {
      const { data: session } = await sessionsApi.start({
        title: values.title.trim(),
        task_id: values.task_id,
        goal: values.goal ? values.goal : undefined,
        planned_minutes: values.planned_minutes,
        ambient_sound: values.ambient_sound,
        pomodoro_work: workMin,
        pomodoro_break: breakMin,
      });
      const task = tasks.find((t) => t.id === values.task_id);
      setActiveSession({
        dbSessionId: session.id,
        title: values.title.trim(),
        taskTitle: task?.title,
        goal: values.goal || undefined,
        plannedMinutes: values.planned_minutes,
        pomodoroWork: workMin,
        pomodoroBreak: breakMin,
        ambientSound: values.ambient_sound,
        taskId: values.task_id,
        autoStartBreaks: autoBreak,
        strictMode: values.strict_mode,
      });
      setShowSuccess(true);
      setTimeout(() => navigate('/focus'), 600);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to start session', err);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-lg bg-primary/20 px-3 py-1">
          <Play className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary-light">New Focus Session</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-text">Get into the zone</h1>
        {coachMsg && (
          <p className="text-lg text-text-secondary leading-relaxed max-w-xl">
            💡 <em>"{coachMsg}"</em>
          </p>
        )}
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
        {/* Session Title */}
        <motion.div variants={itemVariants} className="space-y-3">
          <label className="form-label flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            What are you focusing on?
          </label>
          <input
            type="text"
            className="input-field text-lg"
            placeholder="e.g. Deep work on Q1 report"
            {...register('title')}
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <motion.p className="form-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="alert">
              {errors.title.message}
            </motion.p>
          )}
        </motion.div>

        {/* Task Link */}
        {tasks.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-3">
            <label className="form-label">Link to a task (optional)</label>
            <select
              className="input-field"
              {...register('task_id', {
                setValueAs: (value) => (value ? Number(value) : undefined),
              })}
            >
              <option value="">No specific task</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </motion.div>
        )}

        {/* Duration Selector */}
        <motion.div variants={itemVariants} className="space-y-4">
          <label className="form-label flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" />
            Session Duration
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {DURATIONS.map((d) => (
              <motion.button
                key={d}
                type="button"
                onClick={() => setValue('planned_minutes', d, { shouldValidate: true })}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-lg px-3 py-3 text-sm font-semibold transition-all ${
                  plannedMinutes === d
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30'
                    : 'bg-surface hover:bg-surface-hover text-text-secondary hover:text-text border border-border'
                }`}
              >
                {d}m
              </motion.button>
            ))}
          </div>
          {errors.planned_minutes && (
            <motion.p className="form-error" role="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {errors.planned_minutes.message}
            </motion.p>
          )}
        </motion.div>

        {/* Pomodoro Settings */}
        <motion.div variants={itemVariants} className="space-y-4">
          <label className="form-label flex items-center gap-2">
            <Timer className="h-4 w-4 text-secondary" />
            Pomodoro Technique
          </label>
          <div className="flex gap-2">
            {POMODORO_PRESETS.map((p, i) => (
              <motion.button
                key={p.label}
                type="button"
                onClick={() => setPreset(i)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                  preset === i
                    ? 'bg-secondary text-white shadow-lg shadow-secondary/30'
                    : 'bg-surface hover:bg-surface-hover text-text-secondary border border-border'
                }`}
              >
                {p.label}
              </motion.button>
            ))}
          </div>

          {/* Custom Pomodoro Times */}
          {preset === 2 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 gap-4 rounded-lg bg-surface/50 p-4 border border-border"
            >
              <div className="space-y-2">
                <label className="form-label text-sm">Work interval</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    max={120}
                    className="input-field"
                    value={customWork}
                    onChange={(e) => setCustomWork(Number(e.target.value) || 0)}
                  />
                  <span className="text-text-muted font-medium">min</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="form-label text-sm">Break interval</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    className="input-field"
                    value={customBreak}
                    onChange={(e) => setCustomBreak(Number(e.target.value) || 0)}
                  />
                  <span className="text-text-muted font-medium">min</span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Ambient Sound */}
        <motion.div variants={itemVariants} className="space-y-3">
          <label className="form-label flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-primary" />
            Ambient Sound
          </label>
          <select className="input-field" {...register('ambient_sound')}>
            <option value="">None</option>
            {AMBIENT_SOUNDS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </motion.div>

        {/* Goal (Optional) */}
        <motion.div variants={itemVariants} className="space-y-3">
          <label className="form-label flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Session Goal (optional)
          </label>
          <textarea
            className="textarea-field"
            placeholder="What's your target outcome for this session?"
            rows={3}
            {...register('goal')}
          />
          <p className="form-hint">Be specific to keep yourself accountable</p>
          {errors.goal && (
            <motion.p className="form-error" role="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {errors.goal.message}
            </motion.p>
          )}
        </motion.div>

        {/* Auto-Start Breaks */}
        <motion.div variants={itemVariants} className="flex items-center gap-3 rounded-lg bg-surface/50 p-4 border border-border">
          <input
            type="checkbox"
            id="autoBreaks"
            className="w-5 h-5 rounded accent-primary cursor-pointer"
            {...register('auto_start_breaks')}
          />
          <label htmlFor="autoBreaks" className="flex-1 cursor-pointer">
            <p className="font-semibold text-text">Auto-start breaks</p>
            <p className="text-sm text-text-muted">Automatically start break periods after work intervals</p>
          </label>
        </motion.div>

        {/* Strict Mode */}
        <motion.div variants={itemVariants} className="flex items-center gap-3 rounded-lg bg-surface/50 p-4 border border-border">
          <input
            type="checkbox"
            id="strictMode"
            className="w-5 h-5 rounded accent-primary cursor-pointer"
            {...register('strict_mode')}
          />
          <label htmlFor="strictMode" className="flex-1 cursor-pointer">
            <p className="font-semibold text-text">Strict Mode (Impulse Control)</p>
            <p className="text-sm text-text-muted">Requires typing a phrase to stop sessions early</p>
          </label>
        </motion.div>

        {/* Submit Button */}
        <motion.button
          variants={itemVariants}
          type="submit"
          disabled={isSubmitting || showSuccess}
          className="btn-primary w-full py-4 text-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSubmitting ? (
            <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
              Starting session...
            </motion.span>
          ) : showSuccess ? (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              ✨ Let's focus!
            </motion.span>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Begin Focus Session
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
