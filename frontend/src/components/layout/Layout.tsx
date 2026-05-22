import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { joinLatestMeeting } from '../../services/meetingService';
import {
  LayoutDashboard,
  Play,
  ListTodo,
  BarChart3,
  Trophy,
  Settings,
  LogOut,
  Focus,
  Crown,
  Users,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/authStore';

const navItems: {
  path: string;
  icon: typeof LayoutDashboard;
  label: string;
  action?: 'join-latest';
}[] = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/setup', icon: Play, label: 'Focus' },
  { path: '/create-meeting', icon: Crown, label: 'Host Room' },
  { path: '/join-meeting', icon: Users, label: 'Join Latest', action: 'join-latest' },
  { path: '/tasks', icon: ListTodo, label: 'Tasks' },
  { path: '/analytics', icon: BarChart3, label: 'Stats' },
  { path: '/achievements', icon: Trophy, label: 'Rewards' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { dashboard } = useAppStore();
  const { user, logout } = useAuthStore();
  const [joining, setJoining] = useState(false);

  async function handleNavClick(path: string, action?: 'join-latest') {
    if (action === 'join-latest') {
      setJoining(true);
      try {
        const data = await joinLatestMeeting();
        navigate(`/meeting/${data.room_code}`);
      } catch {
        navigate('/join-meeting');
      } finally {
        setJoining(false);
      }
      return;
    }
    navigate(path);
  }

  return (
    <motion.div className="flex min-h-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <aside className="flex w-20 flex-col border-r border-slate-700/50 bg-slate-900/80 py-6 lg:w-56 lg:px-4">
        <motion.div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary">
            <Focus className="h-6 w-6 text-white" />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-bold text-white">Focus Sessions</p>
            <p className="truncate text-xs text-slate-400">{user?.name}</p>
          </div>
        </motion.div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map(({ path, icon: Icon, label, action }) => {
            const active =
              location.pathname === path ||
              (path === '/join-meeting' && location.pathname.startsWith('/meeting/'));
            const isJoin = action === 'join-latest';
            return (
              <button
                key={path}
                type="button"
                disabled={isJoin && joining}
                onClick={() => handleNavClick(path, action)}
                className={`flex items-center gap-3 rounded-2xl p-3 transition ${
                  active && (path !== '/join-meeting' || location.pathname.startsWith('/meeting/'))
                    ? 'bg-primary/20 text-primary'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                } disabled:opacity-50`}
              >
                <Icon className="h-6 w-6 shrink-0" />
                <span className="hidden text-sm font-medium lg:inline">
                  {isJoin && joining ? 'Joining…' : label}
                </span>
              </button>
            );
          })}
        </nav>

        {dashboard && (
          <motion.div className="hidden rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 p-4 lg:block">
            <p className="text-xs text-slate-400">Level {dashboard.level}</p>
            <p className="text-lg font-bold text-white">{dashboard.total_xp} XP</p>
            <p className="mt-1 text-xs text-emerald-400">🔥 {dashboard.current_streak} day streak</p>
          </motion.div>
        )}

        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/welcome');
          }}
          className="mt-4 flex items-center gap-3 rounded-2xl p-3 text-slate-400 hover:bg-slate-800 hover:text-red-300"
        >
          <LogOut className="h-5 w-5" />
          <span className="hidden text-sm lg:inline">Log out</span>
        </button>
      </aside>

      <main className="flex-1 overflow-auto p-4 lg:p-8">
        <Outlet />
      </main>
    </motion.div>
  );
}
