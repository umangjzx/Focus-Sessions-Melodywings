import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Users, Copy, ArrowRight, Sparkles, Link2 } from 'lucide-react';
import { createMeeting } from '../services/meetingService';
import { buildJoinMessage } from '../utils/meetingUtils';

export default function CreateMeeting() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [createdTitle, setCreatedTitle] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Please enter a room name.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await createMeeting(trimmed);
      setCreatedCode(data.room_code);
      setCreatedTitle(trimmed);
    } catch {
      setError('Could not create the room. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    if (createdCode) navigator.clipboard.writeText(createdCode);
  }

  function copyInvite() {
    if (createdCode) navigator.clipboard.writeText(buildJoinMessage(createdCode, createdTitle));
  }

  function enterRoom() {
    if (createdCode) navigate(`/meeting/${createdCode}`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-xl space-y-8"
    >
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-sm text-amber-300">
          <Crown className="h-4 w-4" />
          You will be the host
        </div>
        <h1 className="text-3xl font-bold text-white">Host a Focus Room</h1>
        <p className="mt-2 text-slate-400">
          Create a shared session. You control the timer — participants join with your room code.
        </p>
      </div>

      {!createdCode ? (
        <form onSubmit={handleCreate} className="card-elevated space-y-5">
          <div>
            <label htmlFor="room-title" className="mb-2 block text-sm font-medium text-slate-300">
              Room name
            </label>
            <input
              id="room-title"
              className="input-field w-full"
              placeholder="e.g. Study Squad, Morning Focus"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              autoFocus
            />
          </div>

          <ul className="space-y-2 rounded-xl bg-slate-800/50 p-4 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Share the room code so others can join
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Start, pause, and resume the group timer when everyone is ready
            </li>
          </ul>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Create & become host'}
          </button>

          <p className="text-center text-sm text-slate-500">
            Want to join someone else&apos;s room?{' '}
            <Link to="/join-meeting" className="text-primary hover:underline">
              Join with a code
            </Link>
          </p>
        </form>
      ) : (
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card-elevated space-y-6 text-center"
        >
          <p className="text-slate-400">Your room is ready. Share this code:</p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-4xl font-bold tracking-widest text-primary">
              {createdCode}
            </span>
            <button
              type="button"
              onClick={copyCode}
              className="rounded-xl bg-slate-700 p-3 text-slate-300 hover:bg-slate-600"
              title="Copy code"
            >
              <Copy className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-slate-500">{createdTitle}</p>
          <button type="button" onClick={copyInvite} className="btn-secondary w-full">
            <Link2 className="h-5 w-5" />
            Copy invite link & message
          </button>
          <button type="button" className="btn-primary w-full" onClick={enterRoom}>
            Enter as host
            <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
