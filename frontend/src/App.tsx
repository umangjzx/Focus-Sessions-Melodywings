import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useAppStore } from './store/useAppStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy loaded routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SessionSetup = lazy(() => import('./pages/SessionSetup'));
const FocusMode = lazy(() => import('./pages/FocusMode'));
const BreakMode = lazy(() => import('./pages/BreakMode'));
const SessionComplete = lazy(() => import('./pages/SessionComplete'));
const TaskManager = lazy(() => import('./pages/TaskManager'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Achievements = lazy(() => import('./pages/Achievements'));
const SettingsPage = lazy(() => import('./pages/Settings'));

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-950">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-text-muted font-medium">Loading...</p>
    </div>
  </div>
);

export default function App() {
  const loadUser = useAuthStore((s) => s.loadUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { loadInitialData, theme } = useAppStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (isAuthenticated) loadInitialData().catch(console.error);
  }, [isAuthenticated, loadInitialData]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/welcome" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/setup" element={<SessionSetup />} />
            <Route path="/tasks" element={<TaskManager />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="/focus" element={<FocusMode />} />
          <Route path="/break" element={<BreakMode />} />
          <Route path="/complete" element={<SessionComplete />} />
        </Route>

        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </Suspense>
  );
}
