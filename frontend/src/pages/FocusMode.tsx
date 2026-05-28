import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pause, Play, Square, Maximize, Volume2, VolumeX } from 'lucide-react';
import { useTimer } from '../hooks/useTimer';
import { useAppStore } from '../store/useAppStore';
import { sessionsApi, settingsApi } from '../services/api';
import { buildCoachClient } from '../utils/coachClient';
import { formatTime, showNotification } from '../utils/helpers';
import ProgressRing from '../components/focus/ProgressRing';
import CountdownOverlay from '../components/focus/CountdownOverlay';
import AmbientSoundPlayer from '../components/AmbientSoundPlayer';

export default function FocusMode() {
  const navigate = useNavigate();
  const { activeSession, settings } = useAppStore();
  const [countdown, setCountdown] = useState<number | null>(3);
  const [quote, setQuote] = useState('');
  const [pauses, setPauses] = useState(0);
  const [soundMuted, setSoundMuted] = useState(false);
  const [showStrictModal, setShowStrictModal] = useState(false);
  const [strictInput, setStrictInput] = useState('');
  const pausesRef = useRef(0);
  pausesRef.current = pauses;

  const totalSeconds = (activeSession?.plannedMinutes ?? 25) * 60;

  const timer = useTimer({
    duration: totalSeconds,
    autoStart: false,
    onComplete: () => {
      showNotification('🎉 Session Complete!', { body: 'Great focus session!' });
      if (activeSession?.pomodoroBreak && activeSession.autoStartBreaks) {
        showNotification('⏸️ Break time', { body: 'Stretch, hydrate, and breathe.' });
        navigate('/break');
      } else {
        const elapsedMin = Math.max(1, Math.round((totalSeconds) / 60));
        navigate('/complete', { state: { elapsedMin: elapsedMin, pauses: pausesRef.current } });
      }
    },
  });

  useEffect(() => {
    if (!activeSession) navigate('/setup');
    settingsApi
      .coach('mid', buildCoachClient('/focus', { in_focus_session: true }))
      .then((r) => setQuote(r.data.message))
      .catch(() => {});
  }, [activeSession, navigate]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      timer.start();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [countdown, timer]);

  async function handlePause() {
    if (timer.isRunning) {
      timer.pause();
      const next = pauses + 1;
      setPauses(next);
      if (activeSession) await sessionsApi.pause(activeSession.dbSessionId, next);
    } else {
      timer.resume();
      if (activeSession) await sessionsApi.resume(activeSession.dbSessionId);
    }
  }

  function endSession() {
    if (activeSession?.strictMode && !showStrictModal) {
      setShowStrictModal(true);
      return;
    }
    const elapsedMin = Math.max(1, Math.round((totalSeconds - timer.timeRemaining) / 60));
    navigate('/complete', { state: { elapsedMin, pauses } });
  }

  function handleStrictSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (strictInput.toLowerCase() === 'i am choosing to stop focusing') {
      setShowStrictModal(false);
      endSession();
    }
  }

  if (!activeSession) return null;

  return (
    <motion.div 
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[var(--color-bg)] via-[var(--color-bg-secondary)] to-[var(--color-bg)] p-6 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, 100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, -100, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 12, repeat: Infinity }}
          style={{ bottom: '10%', right: '10%' }}
        />
      </div>

      <CountdownOverlay count={countdown} />

      <motion.div 
        className="relative z-10 flex flex-col items-center max-w-2xl"
        animate={{ scale: 1 }}
        initial={{ scale: 0.9 }}
        transition={{ delay: 0.2 }}
      >
        {/* Motivational Quote */}
        {quote && (
          <motion.p 
            className="mb-8 text-center italic text-lg text-text-secondary leading-relaxed max-w-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            "{quote}"
          </motion.p>
        )}

        {/* Main Timer Display */}
        <ProgressRing progress={timer.progress} size={340} strokeWidth={14}>
          <motion.div
            className="flex flex-col items-center justify-center"
            animate={timer.isRunning ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span className="text-8xl font-bold tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary">
              {formatTime(timer.timeRemaining)}
            </span>
            <motion.span 
              className="mt-3 text-sm uppercase tracking-widest text-text-muted font-semibold"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {timer.isRunning ? 'Focusing' : timer.isPaused ? 'Paused' : 'Ready'}
            </motion.span>
          </motion.div>
        </ProgressRing>

        {/* Session Title & Info */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3">{activeSession.title}</h1>
          {activeSession.taskTitle && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 border border-primary/30">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary-light font-semibold text-sm">MVP: {activeSession.taskTitle}</span>
            </div>
          )}
          <div className="flex items-center justify-center gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              {pauses} pause{pauses !== 1 ? 's' : ''}
            </span>
          </div>
        </motion.div>

        {/* Sound Player — only render after countdown so browser autoplay works */}
        {activeSession.ambientSound && countdown === null && (
          <motion.div 
            className="w-full mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <AmbientSoundPlayer 
              soundId={activeSession.ambientSound} 
              volume={soundMuted ? 0 : (settings?.sound_volume ?? 80)}
              isSessionPaused={timer.isPaused}
            />
          </motion.div>
        )}

        {/* Progress Bar */}
        <motion.div 
          className="w-full max-w-md mt-8 mb-10 h-2 rounded-full bg-surface-active overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.div 
            className="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
            animate={{ width: `${timer.progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        {/* Control Buttons */}
        <motion.div 
          className="flex flex-wrap justify-center gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <motion.button 
            type="button"
            className="btn-secondary group"
            onClick={handlePause}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {timer.isRunning ? (
              <>
                <Pause className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Resume
              </>
            )}
          </motion.button>

          <motion.button 
            type="button"
            className="btn-secondary"
            onClick={() => setSoundMuted(!soundMuted)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {soundMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </motion.button>

          <motion.button 
            type="button"
            className="btn-secondary hidden sm:flex"
            onClick={() => document.documentElement.requestFullscreen?.()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Maximize className="h-5 w-5" />
            Fullscreen
          </motion.button>

          <motion.button 
            type="button"
            className="btn-danger"
            onClick={endSession}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Square className="h-5 w-5" />
            End Session
          </motion.button>
        </motion.div>

        {/* Pause Info */}
        {timer.isPaused && (
          <motion.div 
            className="alert-info text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-sm font-medium">Session paused • Click Resume to continue</p>
          </motion.div>
        )}
      </motion.div>

      {/* Strict Mode Overlay */}
      {showStrictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div 
            className="card-elevated w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-2xl font-bold text-text mb-2">Are you sure?</h2>
            <p className="text-text-secondary mb-6">
              You enabled Strict Mode for this session. To stop early, please type the following phrase exactly:
            </p>
            <div className="bg-surface/50 p-3 rounded-lg border border-border mb-4 font-mono text-center text-primary-light font-bold select-none">
              i am choosing to stop focusing
            </div>
            <form onSubmit={handleStrictSubmit}>
              <input 
                type="text" 
                className="input-field mb-6 text-center" 
                placeholder="Type the phrase here..."
                value={strictInput}
                onChange={(e) => setStrictInput(e.target.value)}
                autoFocus
              />
              <div className="flex gap-3">
                <button 
                  type="button" 
                  className="btn-secondary flex-1"
                  onClick={() => {
                    setShowStrictModal(false);
                    setStrictInput('');
                  }}
                >
                  Keep Focusing
                </button>
                <button 
                  type="submit" 
                  className="btn-danger flex-1"
                  disabled={strictInput.toLowerCase() !== 'i am choosing to stop focusing'}
                >
                  Stop Session
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
