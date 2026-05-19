// User and Authentication
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tasks
export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  estimatedMinutes: number;
  status: 'todo' | 'in-progress' | 'completed';
  tags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Focus Sessions
export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string;
  title: string;
  duration: number; // in minutes
  actualDuration: number; // in minutes
  musicUsed?: string;
  ambientSound?: string;
  productivityScore: number; // 0-100
  moodRating: number; // 1-5
  notes?: string;
  pauses: number;
  completed: boolean;
  createdAt: Date;
  endedAt?: Date;
}

// Streaks
export interface Streak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: Date;
  updatedAt: Date;
}

// Achievements/Badges
export interface Achievement {
  id: string;
  userId: string;
  badgeName: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

// Settings
export interface UserSettings {
  id: string;
  userId: string;
  defaultSessionDuration: number; // in minutes
  pomodoroWorkDuration: number; // in minutes
  pomodoroBreakDuration: number; // in minutes
  theme: 'light' | 'dark' | 'calm-blue' | 'forest-green';
  notificationsEnabled: boolean;
  aiCoachEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number; // 0-100
  preferredMusicGenres: string[];
  preferredAmbientSounds: string[];
  updatedAt: Date;
}

// Analytics
export interface SessionAnalytics {
  userId: string;
  totalFocusHours: number;
  averageSessionDuration: number;
  completionRate: number; // percentage
  averageProductivityScore: number;
  mostProductiveHour: number; // 0-23
  mostProductiveDay: string; // day of week
  favoriteMusic: string[];
  totalSessions: number;
  lastUpdated: Date;
}

// Timer State
export interface TimerState {
  isRunning: boolean;
  timeRemaining: number; // in seconds
  totalTime: number; // in seconds
  pauses: number;
  isPaused: boolean;
}

// Session Config
export interface SessionConfig {
  title: string;
  duration: number;
  taskId?: string;
  music?: string;
  ambientSound?: string;
  goal?: string;
  pomodoroMode: boolean;
}

// Music/Audio
export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  genre: string;
  category: 'lo-fi' | 'white-noise' | 'rain' | 'brown-noise' | 'classical' | 'deep-focus' | 'nature';
  url?: string;
  favorite: boolean;
}

// AI Coach Message
export interface CoachMessage {
  id: string;
  type: 'encouragement' | 'reminder' | 'reflection' | 'suggestion';
  message: string;
  timestamp: Date;
  sessionId?: string;
}

// Notifications
export interface Notification {
  id: string;
  userId: string;
  type: 'session-start' | 'break-start' | 'session-end' | 'milestone' | 'reminder';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

// Database Sync State
export interface SyncState {
  lastSyncTime: Date;
  isPending: boolean;
  failedItems: SyncItem[];
}

export interface SyncItem {
  id: string;
  type: string;
  action: 'create' | 'update' | 'delete';
  data: any;
}
