import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Users, Crown, Radio, Loader2 } from 'lucide-react';
import {
  getLatestAvailable,
  joinLatestMeeting,
  joinMeeting,
  type Meeting,
} from '../services/meetingService';
import { formatTimer } from '../utils/meetingUtils';

export default function JoinMeeting() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [latest, setLatest] = useState<Meeting | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fromUrl = searchParams.get('code');
    if (fromUrl) {
      setRoomCode(fromUrl.toUpperCase());
    }
  }, [searchParams]);

  useEffect(() => {
    getLatestAvailable()
      .then(setLatest)
      .catch(() => setLatest(null))
      .finally(() => setLoadingLatest(false));
  }, []);

  async function goToRoom(code: string) {
    navigate(`/meeting/${code.toUpperCase()}`);
  }

  async function handleJoinLatest() {
    setError('');
    setLoading(true);
    try {
      const data = await joinLatestMeeting();
      await goToRoom(data.room_code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join the latest room.');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinByCode(e: React.FormEvent) {
    e.preventDefault();
    const code = roomCode.trim().toUpperCase();
    if (code.length < 4) {
      setError('Enter a valid room code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await joinMeeting(code);
      await goToRoom(data.room_code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Room not found or you could not join.');
    } finally {
      setLoading(false);
    }
  }

  function previewLine(m: Meeting) {
    const parts = [
      `Host: ${m.host_name ?? 'Unknown'}`,
      `${m.online_count ?? m.participant_count ?? 0} online`,
    ];
    if (m.ready_count != null && m.status?.toUpperCase() === 'WAITING') {
      parts.push(`${m.ready_count} ready`);
    }
    if (m.remaining_seconds != null && m.status?.toUpperCase() === 'RUNNING') {
      parts.push(`${formatTimer(m.remaining_seconds)} left`);
    }
    return parts.join(' · ');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-xl space-y-8"
    >
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-sm text-primary">
          <Users className="h-4 w-4" />
          Join as participant
        </div>
        <h1 className="text-3xl font-bold text-white">Join a Focus Room</h1>
        <p className="mt-2 text-slate-400">
          See what you&apos;re joining before you enter. No surprises.
        </p>
      </div>

      <div className="card-elevated space-y-4">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <Radio className="h-5 w-5 text-emerald-400" />
          Latest available room
        </h2>

        {loadingLatest ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking for active rooms…
          </div>
        ) : latest ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="font-semibold text-white">{latest.title}</p>
            <p className="mt-1 text-sm text-slate-400">{previewLine(latest)}</p>
            <p className="mt-2 font-mono text-primary">{latest.room_code}</p>
            <p className="mt-1 text-xs uppercase text-slate-500">{latest.status}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No active rooms yet. Ask someone to host, or use a code below.
          </p>
        )}

        <button
          type="button"
          className="btn-primary w-full"
          disabled={loading || loadingLatest || !latest}
          onClick={handleJoinLatest}
        >
          <LogIn className="h-5 w-5" />
          {loading ? 'Joining…' : 'Join latest room'}
        </button>
      </div>

      <form onSubmit={handleJoinByCode} className="card-elevated space-y-5">
        <p className="text-sm font-medium text-slate-300">Or join with a specific code</p>
        <div>
          <label htmlFor="room-code" className="mb-2 block text-sm font-medium text-slate-300">
            Room code
          </label>
          <input
            id="room-code"
            className="input-field w-full font-mono text-lg uppercase tracking-widest"
            placeholder="ABC123"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={10}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" className="btn-secondary w-full" disabled={loading}>
          Join with code
        </button>

        <p className="text-center text-sm text-slate-500">
          <Link to="/create-meeting" className="inline-flex items-center gap-1 text-amber-300 hover:underline">
            <Crown className="h-3.5 w-3.5" />
            Create a room as host
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
