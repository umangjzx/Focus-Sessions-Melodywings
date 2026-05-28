import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Home, Crown, Users, Clock } from 'lucide-react';
import { getMeetingSummary } from '../services/meetingService';

export default function MeetingDashboard() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<{
    title: string;
    participant_count: number;
    focused_minutes: number | null;
    duration_minutes: number;
    host_name?: string | null;
  } | null>(null);

  useEffect(() => {
    if (roomCode) {
      getMeetingSummary(roomCode)
        .then(setSummary)
        .catch(() => setSummary(null));
    }
  }, [roomCode]);

  const minutes = summary?.focused_minutes ?? summary?.duration_minutes ?? 25;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl"
    >
      <div className="card-elevated text-center">
        <Trophy className="mx-auto h-16 w-16 text-amber-400" />
        <h2 className="mt-4 text-3xl font-bold text-text">Nice work, team!</h2>
        {summary ? (
          <p className="mt-3 text-lg text-text-secondary">
            You focused together in <strong className="text-text">{summary.title}</strong>
          </p>
        ) : (
          <p className="mt-3 text-text-muted">
            Room <span className="font-mono text-primary">{roomCode}</span> session complete.
          </p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-surface-hover p-4">
            <Clock className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-2xl font-bold text-text">{minutes} min</p>
            <p className="text-xs text-text-subtle">Focus block</p>
          </div>
          <div className="rounded-xl bg-surface-hover p-4">
            <Users className="mx-auto mb-2 h-6 w-6 text-emerald-500" />
            <p className="text-2xl font-bold text-text">
              {summary?.participant_count ?? '—'}
            </p>
            <p className="text-xs text-text-subtle">People in room</p>
          </div>
        </div>

        {summary?.host_name && (
          <p className="mt-4 text-sm text-text-subtle">Hosted by {summary.host_name}</p>
        )}

        <p className="mt-6 text-sm italic text-text-muted">
          Take a short break. Hydrate, stretch, breathe.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => navigate('/create-meeting')}
          >
            <Crown className="h-5 w-5" />
            Host another room
          </button>
          <button type="button" className="btn-secondary w-full" onClick={() => navigate('/')}>
            <Home className="h-5 w-5" />
            Back to home
          </button>
        </div>

        <p className="mt-6 text-sm text-text-subtle">
          <Link to="/join-meeting" className="text-primary hover:underline">
            Join a different room
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
