import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Timer, Trophy, Sparkles } from 'lucide-react';

export default function Landing() {
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Focus Sessions
        </span>
        <div className="flex gap-3">
          <Link to="/login" className="btn-secondary text-base py-2 px-5">
            Log in
          </Link>
          <Link to="/register" className="btn-primary text-base py-2 px-5">
            Get started
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <motion.h1
          className="text-4xl font-bold leading-tight sm:text-6xl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Focus made gentle.
          <br />
          <span className="text-primary">Built for ADHD minds.</span>
        </motion.h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Pomodoro sessions, calming sounds, streaks, and rewards — without the overwhelm.
        </p>
        <Link to="/register" className="btn-primary mt-10 inline-flex text-lg">
          Start your first session
        </Link>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Timer, title: 'Easy starts', desc: '3-2-1 countdown & quick sessions' },
          { icon: Brain, title: 'Stay on track', desc: 'Minimal UI & gentle reminders' },
          { icon: Trophy, title: 'Build habits', desc: 'Streaks, XP, and badges' },
          { icon: Sparkles, title: 'Celebrate wins', desc: 'Mood tracking & reflections' },
        ].map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
            className="card text-left"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Icon className="mb-3 h-8 w-8 text-primary" />
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-slate-400">{desc}</p>
          </motion.div>
        ))}
      </section>
    </motion.div>
  );
}
