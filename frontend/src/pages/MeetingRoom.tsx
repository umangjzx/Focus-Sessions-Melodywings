import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Crown,
  Copy,
  Pause,
  Play,
  Square,
  Users,
  ArrowLeft,
  Wifi,
  WifiOff,
  CheckCircle2,
  Eye,
  EyeOff,
  Link2,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import {
  joinMeeting,
  getMeetingState,
  endMeeting,
  normalizeMeetingStatus,
  type MeetingSync,
} from '../services/meetingService';
import { useMeetingSocket } from '../hooks/useMeetingSocket';
import { useParticipantPresence } from '../hooks/useParticipantPresence';
import { useMeetingState } from '../hooks/useMeetingState';
import { useMeetingTimer } from '../hooks/useMeetingTimer';
import MeetingPhaseBar from '../components/meeting/MeetingPhaseBar';
import MeetingVideoCall from '../components/meeting/MeetingVideoCall';
import { buildJoinMessage, formatTimer, getMeetingPhase } from '../utils/meetingUtils';

const DURATIONS = [15, 25, 45, 50, 60];

export default function MeetingRoom() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = localStorage.getItem('focus_token');

  const [meeting, setMeeting] = useState<{
    id: number;
    title: string;
    host_id: number;
    status: string;
  } | null>(null);
  const [initialParticipants, setInitialParticipants] = useState<MeetingSync['participants']>([]);
  const [durationMin, setDurationMin] = useState(25);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [minimalMode, setMinimalMode] = useState(false);
  const [myReady, setMyReady] = useState(false);
  const [startError, setStartError] = useState('');
  const [ending, setEnding] = useState(false);

  const code = (roomCode || '').toUpperCase();
  const onSyncRef = useRef<(sync: MeetingSync) => void>();

  const { socket, connected, reconnecting, error } = useMeetingSocket(
    code,
    token,
    (sync) => onSyncRef.current?.(sync)
  );
  const { participants, readyCount, setReadyCount } = useParticipantPresence(
    socket,
    initialParticipants
  );
  const { status, setStatus } = useMeetingState(socket, 'WAITING');
  const { remainingSeconds, setRemainingSeconds } = useMeetingTimer(socket);

  onSyncRef.current = (sync: MeetingSync) => {
    setMeeting({
      id: sync.id,
      title: sync.title,
      host_id: sync.host_id,
      status: sync.status,
    });
    setStatus(normalizeMeetingStatus(sync.status));
    if (sync.remaining_seconds != null) {
      setRemainingSeconds(sync.remaining_seconds);
    }
    setInitialParticipants(sync.participants);
    setReadyCount(sync.ready_count);
    const me = sync.participants.find((p) => p.id === user?.id);
    setMyReady(!!me?.is_ready);
  };

  useEffect(() => {
    if (!code) return;
    (async () => {
      try {
        await joinMeeting(code).catch(() => {});
        const sync = await getMeetingState(code);
        onSyncRef.current?.(sync);
      } catch {
        navigate('/join-meeting');
      }
    })();
  }, [code, navigate]);

  useEffect(() => {
    if (status === 'COMPLETED') {
      navigate(`/meeting/${code}/dashboard`);
    }
  }, [status, navigate, code]);

  const isHost = user && meeting && meeting.host_id === user.id;
  const displayStatus = normalizeMeetingStatus(status);
  const isWaiting =
    displayStatus === 'WAITING' || displayStatus === 'CREATED' || displayStatus === 'STARTED';
  const phase = getMeetingPhase(displayStatus);
  const onlineCount = participants.filter((p) => p.online).length;

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied('code');
    setTimeout(() => setCopied(null), 2000);
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(buildJoinMessage(code, meeting?.title));
    setCopied('link');
    setTimeout(() => setCopied(null), 2000);
  }

  function handleMarkReady() {
    if (!socket || !isWaiting) return;
    const next = !myReady;
    socket.emit(
      'mark_ready',
      { room_code: code, ready: next },
      (res: { error?: string; is_ready?: boolean; ready_count?: number }) => {
        if (res?.error) return;
        setMyReady(res?.is_ready ?? next);
        if (res?.ready_count != null) setReadyCount(res.ready_count);
      }
    );
  }

  function handleStart() {
    if (!socket || !connected) {
      setStartError('Not connected. Wait for Live status, then try again.');
      return;
    }
    setStartError('');
    socket.emit(
      'start_meeting',
      { room_code: code, duration_minutes: durationMin },
      (response: { error?: string; status?: string; remaining_seconds?: number }) => {
        if (response?.error) {
          setStartError(response.error);
          return;
        }
        if (response?.status === 'started') {
          setStatus('RUNNING');
          setRemainingSeconds(response.remaining_seconds ?? durationMin * 60);
          setMyReady(false);
        }
      }
    );
  }

  function handlePause() {
    socket?.emit('pause_meeting', { room_code: code });
  }

  function handleResume() {
    socket?.emit('resume_meeting', { room_code: code });
  }

  function handleEndSession() {
    if (!isHost || ending) return;

    const inWaiting = isWaiting;
    const msg = inWaiting
      ? 'End this room for everyone? No focus timer will run.'
      : 'End the focus session for everyone now?';

    if (!window.confirm(msg)) return;

    setEnding(true);
    setStartError('');

    const finish = () => {
      setStatus('COMPLETED');
      setEnding(false);
    };

    if (socket && connected) {
      socket.emit(
        'end_meeting',
        { room_code: code },
        (response: { error?: string; status?: string }) => {
          if (response?.error) {
            setStartError(response.error);
            setEnding(false);
            return;
          }
          if (response?.status === 'completed') {
            finish();
          }
        }
      );
      return;
    }

    endMeeting(code)
      .then(() => finish())
      .catch((err: Error) => {
        setStartError(err.message);
        setEnding(false);
      });
  }

  function handleResync() {
    if (!socket) return;
    socket.emit('request_sync', { room_code: code });
    getMeetingState(code).then((sync) => onSyncRef.current?.(sync)).catch(() => {});
  }

  if (error && !meeting) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-red-400">{error}</p>
        <Link to="/join-meeting" className="btn-secondary mt-4 inline-flex">
          Back to join
        </Link>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-4xl space-y-4"
    >
      {reconnecting && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <span className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Reconnecting… syncing timer
          </span>
          <button type="button" onClick={handleResync} className="text-xs underline hover:no-underline">
            Sync now
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="rounded-xl p-2 text-text-muted hover:bg-surface-hover hover:text-text"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text">{meeting.title}</h1>
            <p className="text-sm text-text-muted">
              {isHost ? (
                <span className="inline-flex items-center gap-1 text-amber-300">
                  <Crown className="h-3.5 w-3.5" /> Host
                </span>
              ) : (
                'Group focus'
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMinimalMode((m) => !m)}
            className="rounded-xl p-2 text-text-muted hover:bg-surface-hover hover:text-text"
            title={minimalMode ? 'Show details' : 'Minimal view'}
          >
            {minimalMode ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2 text-sm">
            {connected ? (
              <Wifi className="h-4 w-4 text-emerald-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400" />
            )}
            <span className={connected ? 'text-emerald-400' : 'text-amber-400'}>
              {connected ? 'Live' : reconnecting ? 'Reconnecting' : 'Connecting…'}
            </span>
          </div>
        </div>
      </div>

      <MeetingPhaseBar status={displayStatus} />

      <div className={minimalMode ? '' : 'grid gap-6 lg:grid-cols-3'}>
        <div className={`space-y-6 ${minimalMode ? '' : 'lg:col-span-2'}`}>
          <div className="card-elevated text-center">
            <p className="mb-2 text-sm text-text-muted">
              {phase === 'focus' ? 'Focus together' : phase === 'paused' ? 'Paused' : phase === 'done' ? 'Complete' : 'Waiting to start'}
            </p>
            <div className="font-mono text-6xl font-bold text-primary">
              {isWaiting ? '— : —' : formatTimer(remainingSeconds)}
            </div>
            {!isWaiting && phase === 'focus' && (
              <p className="mt-2 text-xs text-text-subtle">Stay present — you&apos;ve got this</p>
            )}
            {isHost && minimalMode && displayStatus !== 'COMPLETED' && (
              <button
                type="button"
                onClick={handleEndSession}
                disabled={ending || !connected}
                className="btn-danger mx-auto mt-4"
              >
                <Square className="h-4 w-4" />
                {ending ? 'Ending…' : 'End for everyone'}
              </button>
            )}
          </div>

          {isHost && !minimalMode && (
            <div className="card-elevated">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-text">
                <Crown className="h-5 w-5 text-amber-400" />
                Host controls
              </h3>
              <p className="mb-4 text-sm text-text-muted">
                {onlineCount} online · {readyCount}/{participants.length} ready
              </p>

              {isWaiting && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {DURATIONS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDurationMin(m)}
                        className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                          durationMin === m
                            ? 'bg-primary text-white'
                            : 'bg-surface-active text-text-secondary hover:bg-surface-hover'
                        }`}
                      >
                        {m} min
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleStart}
                    disabled={!connected}
                    className="btn-primary w-full sm:w-auto"
                  >
                    <Play className="h-5 w-5" />
                    Start {durationMin}-min session
                  </button>
                  {startError && <p className="text-sm text-red-400">{startError}</p>}
                </div>
              )}

              {displayStatus === 'RUNNING' && (
                <button type="button" onClick={handlePause} className="btn-secondary">
                  <Pause className="h-5 w-5" />
                  Pause for everyone
                </button>
              )}

              {displayStatus === 'PAUSED' && (
                <button type="button" onClick={handleResume} className="btn-primary">
                  <Play className="h-5 w-5" />
                  Resume session
                </button>
              )}

              <div className="mt-4 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleEndSession}
                  disabled={ending || !connected}
                  className="btn-danger w-full sm:w-auto"
                >
                  <Square className="h-5 w-5" />
                  {ending
                    ? 'Ending…'
                    : isWaiting
                      ? 'End room for everyone'
                      : 'End session for everyone'}
                </button>
                <p className="mt-2 text-xs text-text-subtle">
                  Only you as host can end the room. Everyone goes to the session summary.
                </p>
              </div>
            </div>
          )}

          {!minimalMode && (
            <MeetingVideoCall
              roomCode={code}
              meetingId={meeting.id}
              displayName={user?.name}
            />
          )}

          {!isHost && isWaiting && (
            <div className="card-elevated space-y-4 text-center">
              <p className="text-text-secondary">
                Mark yourself ready when you&apos;re set. The host will start the timer.
              </p>
              <button
                type="button"
                onClick={handleMarkReady}
                className={`mx-auto flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition ${
                  myReady
                    ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                <CheckCircle2 className="h-5 w-5" />
                {myReady ? "I'm ready ✓" : "I'm ready"}
              </button>
              <p className="text-xs text-text-subtle">
                {readyCount} of {participants.length} people ready
              </p>
            </div>
          )}

          {isHost && isWaiting && (
            <button
              type="button"
              onClick={handleMarkReady}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition ${
                myReady
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-border text-text-muted hover:border-border-light'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {myReady ? "You're ready (optional)" : "Mark yourself ready (optional)"}
            </button>
          )}
        </div>

        {!minimalMode && (
          <div className="card-elevated h-fit">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-text">
              <Users className="h-5 w-5 text-primary" />
              People ({participants.length})
            </h3>

            <div className="mb-3 space-y-2">
              <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-hover p-3 font-mono text-sm">
                <span>
                  Code: <strong className="text-primary">{code}</strong>
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="rounded-lg p-2 text-text-muted hover:bg-surface-active"
                  title="Copy code"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={copyInviteLink}
                className="btn-secondary w-full text-sm"
              >
                <Link2 className="h-4 w-4" />
                Copy invite link
              </button>
              {copied === 'code' && (
                <p className="text-xs text-emerald-400">Code copied!</p>
              )}
              {copied === 'link' && (
                <p className="text-xs text-emerald-400">Invite copied — paste to share</p>
              )}
            </div>

            <ul className="space-y-2">
              {participants.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-surface-hover px-3 py-2"
                >
                  <span className={p.online ? 'text-text' : 'text-text-subtle'}>
                    {p.name}
                    {p.is_host && (
                      <Crown className="ml-1.5 inline h-3.5 w-3.5 text-amber-400" />
                    )}
                    {p.is_ready && isWaiting && (
                      <span className="ml-2 text-xs text-emerald-400">ready</span>
                    )}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${p.online ? 'bg-emerald-500' : 'bg-surface-active'}`}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}
