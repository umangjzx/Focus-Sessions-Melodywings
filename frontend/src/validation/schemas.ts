import { z } from 'zod';

/* ===== Authentication Schemas ===== */
export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(120, 'Name must be less than 120 characters'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be less than 128 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type RegisterValues = z.infer<typeof registerSchema>;

/* ===== Task Schemas ===== */
export const taskSchema = z.object({
  title: z.string()
    .min(1, 'Task title is required')
    .max(200, 'Task title must be less than 200 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'completed']).default('todo'),
  estimated_minutes: z.number()
    .int('Must be a whole number')
    .positive('Estimated time must be positive')
    .optional(),
  parent_id: z.union([z.number().int().positive(), z.literal('')]).optional().transform(v => v === '' ? undefined : v),
  due_date: z.string().optional().transform(v => v === '' ? undefined : v),
});

export type TaskValues = z.infer<typeof taskSchema>;

/* ===== Session Schemas ===== */
export const sessionSetupSchema = z.object({
  title: z.string()
    .min(1, 'Session title is required')
    .max(200, 'Session title must be less than 200 characters'),
  task_id: z.union([z.number().int().positive(), z.literal('')]).optional().transform(v => v === '' ? undefined : v),
  goal: z.string()
    .max(500, 'Goal must be less than 500 characters')
    .optional()
    .transform(v => v === '' ? undefined : v),
  planned_minutes: z.number()
    .int('Minutes must be a whole number')
    .min(5, 'Minimum 5 minutes')
    .max(480, 'Maximum 8 hours'),
  ambient_sound: z.string().optional(),
  pomodoro_enabled: z.boolean().optional().default(false),
  pomodoro_work: z.number()
    .int('Minutes must be a whole number')
    .min(5, 'Work interval minimum 5 minutes')
    .max(120, 'Work interval maximum 120 minutes')
    .optional(),
  pomodoro_break: z.number()
    .int('Minutes must be a whole number')
    .min(1, 'Break minimum 1 minute')
    .max(60, 'Break maximum 60 minutes')
    .optional(),
  auto_start_breaks: z.boolean().default(false),
  strict_mode: z.boolean().default(false),
});

export type SessionSetupValues = z.infer<typeof sessionSetupSchema>;

/* ===== Settings Schemas ===== */
export const settingsSchema = z.object({
  sound_volume: z.number().int().min(0).max(100).default(80),
  theme: z.enum(['dark', 'light', 'calm-blue', 'forest-green']).default('dark'),
  notifications_enabled: z.boolean().default(true),
  auto_start_breaks: z.boolean().default(false),
  show_analytics: z.boolean().default(true),
});

export type SettingsValues = z.infer<typeof settingsSchema>;
