import { Navigate, Outlet } from 'react-router-dom';
import CoachChat from './coach/CoachChat';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-text-muted">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Outlet />
      <CoachChat />
    </>
  );
}
