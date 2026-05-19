import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, Wind, StretchHorizontal, SkipForward } from 'lucide-react';
import { useTimer } from '../hooks/useTimer';
import { useAppStore } from '../store/useAppStore';
import { formatTime, showNotification } from '../utils/helpers';

const TIPS = [
  { icon: StretchHorizontal, text: 'Roll your shoulders back 5 times slowly.' },
  { icon: Droplets, text: 'Drink a glass of water — hydration helps focus.' },
  { icon: Wind, text: 'Breathe in 4, hold 4, out 4. Repeat 3 times.' },
  { text: 'You are doing enough. Rest is productive too.', icon: Wind },
];

export default function BreakMode() {
  const navigate = useNavigate();
  const { activeSession } = useAppStore();
  const breakMin = activeSession?.pomodoroBreak ?? 5;
  const [tipIndex, setTipIndex] = useState(0);

  const timer = useTimer({
    duration: breakMin * 60,
    autoStart: true,
    onComplete: () => {
      showNotification('Break over', { body: 'Ready to focus again?' });
      navigate('/focus');
    },
  });

  useEffect(() => {
    if (!activeSession) navigate('/setup');
    const interval = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 8000);
    return () => clearInterval(interval);
  }, [activeSession, navigate]);

  const Tip = TIPS[tipIndex];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 p-6">
      <p className="text-sm uppercase tracking-widest text-emerald-400">Break time</p>
      <p className="mt-4 text-7xl font-bold tabular-nums text-white">{formatTime(timer.timeRemaining)}</p>
      <p className="mt-4 text-xl text-slate-300">Rest your mind. You earned this.</p>

      <motion.div key={tipIndex} className="card mt-12 flex max-w-md items-start gap-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <Tip.icon className="h-8 w-8 shrink-0 text-emerald-400" />
        <p className="text-lg text-slate-200">{Tip.text}</p>
      </motion.div>

      <button type="button" className="btn-primary mt-10" onClick={() => navigate('/focus')}>
        <SkipForward className="h-5 w-5" /> End Break Early
      </button>
    </div>
  );
}
