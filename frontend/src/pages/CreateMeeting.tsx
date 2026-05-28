import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Users, Copy, ArrowRight, Sparkles, Link2, CheckCircle2 } from 'lucide-react';
import { createMeeting } from '../services/meetingService';
import { buildJoinMessage } from '../utils/meetingUtils';

const cardStyle = {
  background: 'rgba(255,255,255,0.65)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.9), 0 4px 20px -4px rgba(15,23,42,0.07)',
};

export default function CreateMeeting() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [createdTitle, setCreatedTitle] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) { setError('Please enter a room name.'); return; }
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
    if (!createdCode) return;
    navigator.clipboard.writeText(createdCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  function copyInvite() {
    if (!createdCode) return;
    navigator.clipboard.writeText(buildJoinMessage(createdCode, createdTitle));
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-xl space-y-8"
    >
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Group Focus</p>
        <h1 className="mt-2 text-4xl font-bold text-text">Host a Focus Room</h1>
        <p className="mt-2 text-sm text-text-muted">
          Create a shared session. You control the timer — participants join with your room code.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!createdCode ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            onSubmit={handleCreate}
            className="space-y-5 rounded-2xl p-6 backdrop-blur-xl"
            style={cardStyle}
          >
            {/* Host badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-600">
              <Crown className="h-4 w-4" />
              You will be the host
            </div>

            <div>
              <label htmlFor="room-title" className="mb-2 block text-sm font-semibold text-text-secondary">
                Room Name
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
              {error && <p className="mt-2 text-sm text-error">{error}</p>}
            </div>

            {/* Tips */}
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">How it works</p>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Share the room code so others can join
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  Start, pause, and resume the group timer when everyone is ready
                </li>
              </ul>
            </div>

            <motion.button
              type="submit"
              className="btn-primary w-full py-4"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                  Creating…
                </motion.span>
              ) : (
                <>
                  <Crown className="h-5 w-5" />
                  Create & Become Host
                </>
              )}
            </motion.button>

            <p className="text-center text-sm text-text-subtle">
              Want to join someone else's room?{' '}
              <Link to="/join-meeting" className="font-semibold text-primary hover:underline">
                Join with a code
              </Link>
            </p>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-5 rounded-2xl p-6 backdrop-blur-xl"
            style={cardStyle}
          >
            {/* Ready banner */}
            <div className="flex items-center gap-3 rounded-2xl bg-green-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-green-700">Room Created!</p>
                <p className="text-sm text-green-600">{createdTitle}</p>
              </div>
            </div>

            {/* Room Code */}
            <div className="text-center">
              <p className="mb-3 text-sm font-semibold text-text-muted">Share this code with participants:</p>
              <div className="flex items-center justify-center gap-4">
                <span className="font-mono text-5xl font-black tracking-[0.2em] text-gradient">
                  {createdCode}
                </span>
                <motion.button
                  type="button"
                  onClick={copyCode}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${
                    codeCopied ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-text-muted hover:bg-slate-200'
                  }`}
                  title="Copy code"
                >
                  {codeCopied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </motion.button>
              </div>
            </div>

            <div className="grid gap-3">
              <motion.button
                type="button"
                onClick={copyInvite}
                className="btn-secondary w-full"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {inviteCopied ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Link2 className="h-5 w-5" />}
                {inviteCopied ? 'Copied!' : 'Copy Invite Message'}
              </motion.button>

              <motion.button
                type="button"
                className="btn-primary w-full py-4"
                onClick={() => navigate(`/meeting/${createdCode}`)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                Enter as Host
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
