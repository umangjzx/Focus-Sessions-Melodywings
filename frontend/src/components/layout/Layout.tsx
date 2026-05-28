import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { joinLatestMeeting } from '../../services/meetingService';
import {
  LayoutDashboard,
  Play,
  ListTodo,
  BarChart3,
  Trophy,
  Settings,
  LogOut,
  Crown,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import logoSvg from '../../assets/unnamed.png';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/authStore';

const navItems: {
  path: string;
  icon: typeof LayoutDashboard;
  label: string;
  action?: 'join-latest';
}[] = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/setup', icon: Play, label: 'Focus' },
  { path: '/tasks', icon: ListTodo, label: 'Tasks' },
  { path: '/analytics', icon: BarChart3, label: 'Stats' },
  { path: '/create-meeting', icon: Crown, label: 'Host Room' },
  { path: '/join-meeting', icon: Users, label: 'Join Latest', action: 'join-latest' },
  { path: '/achievements', icon: Trophy, label: 'Rewards' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { dashboard: _dashboard } = useAppStore();
  const { user, logout } = useAuthStore();
  const [joining, setJoining] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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

  const initials = (user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* Ambient Background Glows */}
      <div className="pointer-events-none fixed -left-[10%] top-[-10%] h-[40rem] w-[40rem] animate-ambient-glow rounded-full bg-primary-light/20 blur-[100px] z-0" />
      <div className="pointer-events-none fixed -right-[10%] top-[20%] h-[35rem] w-[35rem] animate-ambient-glow rounded-full bg-secondary-light/20 blur-[100px] z-0" style={{ animationDelay: '2s' }} />
      <div className="pointer-events-none fixed bottom-[-10%] left-[20%] h-[45rem] w-[45rem] animate-ambient-glow rounded-full bg-primary/10 blur-[120px] z-0" style={{ animationDelay: '4s' }} />

      {/* ===== SIDEBAR (Desktop) ===== */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-20 hidden flex-col border-r border-white/60 bg-white/60 backdrop-blur-2xl lg:flex"
        style={{ boxShadow: '4px 0 24px -4px rgba(15,23,42,0.06)' }}
      >
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-5 pb-6 pt-7">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex shrink-0 items-center gap-3 transition-transform hover:scale-105 active:scale-95"
          >
            <img src={logoSvg} alt="MelodyWings" className="h-10 w-10 shrink-0 drop-shadow-sm" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <span className="block text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">
                    Melody Wings
                  </span>
                  <span className="block text-sm font-bold text-text leading-tight">
                    Focus Sessions
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        <div className="mx-4 mb-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Nav Items */}
        <nav className="flex flex-1 flex-col gap-1 px-3">
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
                title={collapsed ? label : undefined}
                className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-white text-primary-dark shadow-sm ring-1 ring-black/5'
                    : 'text-text-muted hover:bg-white/70 hover:text-text'
                } disabled:opacity-50`}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10 flex shrink-0 items-center justify-center">
                  <Icon className={`h-5 w-5 shrink-0 transition-colors ${active ? 'text-primary-dark' : 'text-text-muted group-hover:text-text'}`} />
                </span>
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className={`relative z-10 truncate ${active ? 'text-primary-dark' : ''}`}
                    >
                      {isJoin && joining ? 'Joining…' : label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        {/* Bottom - User Profile */}
        <div className="px-3 pb-4 pt-2">
          <div className="mx-1 mb-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className={`flex items-center gap-3 rounded-2xl p-3 transition-all ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white shadow-md shadow-primary/20 ring-2 ring-white">
              {initials}
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex min-w-0 flex-1 flex-col"
                >
                  <span className="truncate text-sm font-bold text-text">{user?.name}</span>
                  <button
                    type="button"
                    onClick={() => { logout(); navigate('/welcome'); }}
                    className="flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-error"
                  >
                    <LogOut className="h-3 w-3" />
                    Log out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-2 text-xs font-semibold text-text-muted transition-all hover:bg-white/70 hover:text-text`}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
          </button>
        </div>
      </motion.aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="relative z-10 flex flex-1 flex-col min-w-0">
        <main className="flex-1 overflow-auto px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* ===== BOTTOM TAB BAR (Mobile) ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-white/60 bg-white/80 px-2 pb-safe pt-2 backdrop-blur-2xl lg:hidden"
        style={{ boxShadow: '0 -4px 24px -4px rgba(15,23,42,0.08)' }}
      >
        {navItems.slice(0, 6).map(({ path, icon: Icon, label, action }) => {
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
              className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-[10px] font-semibold transition-all duration-200 ${
                active ? 'text-primary-dark' : 'text-text-muted'
              } disabled:opacity-50`}
            >
              <div className={`rounded-xl p-1.5 transition-all duration-200 ${active ? 'bg-primary/10' : ''}`}>
                <Icon className={`h-5 w-5 ${active ? 'text-primary-dark' : 'text-text-muted'}`} />
              </div>
              <span>{isJoin && joining ? '…' : label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
