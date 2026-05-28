import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Timer, Trophy, Sparkles } from 'lucide-react';
import logoSvg from '../assets/logo.svg';

export default function Landing() {
  return (
    <motion.div
      className="min-h-screen bg-[var(--color-bg)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <img src={logoSvg} alt="MelodyWings" className="h-10 w-10" />
          <span className="text-xl font-bold text-gradient">
            MelodyWings
          </span>
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="btn-secondary text-sm py-2.5 px-5">
            Log in
          </Link>
          <Link to="/register" className="btn-primary text-sm py-2.5 px-5">
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary-dark">
            <Sparkles className="h-4 w-4" />
            Built for ADHD minds
          </div>
          <h1 className="text-5xl font-bold leading-tight sm:text-7xl text-text">
            Focus made{' '}
            <span className="text-gradient">gentle.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-text-muted leading-relaxed">
            Pomodoro sessions, calming sounds, streaks, and rewards — without the overwhelm. Powered by MelodyWings.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-lg px-8 py-4">
              Start your first session
            </Link>
            <Link to="/login" className="btn-ghost text-lg">
              I have an account →
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-5xl gap-5 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Timer, title: 'Easy starts', desc: '3-2-1 countdown & quick sessions', color: 'text-primary-dark bg-primary/10' },
          { icon: Brain, title: 'Stay on track', desc: 'Minimal UI & gentle reminders', color: 'text-secondary-dark bg-secondary/10' },
          { icon: Trophy, title: 'Build habits', desc: 'Streaks, XP, and badges', color: 'text-amber-600 bg-amber-500/10' },
          { icon: Sparkles, title: 'Celebrate wins', desc: 'Mood tracking & reflections', color: 'text-violet-600 bg-violet-500/10' },
        ].map(({ icon: Icon, title, desc, color }, i) => (
          <motion.div
            key={title}
            className="card text-left"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <div className={`inline-flex rounded-xl p-3 mb-4 ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-text">{title}</h3>
            <p className="mt-1 text-sm text-text-muted">{desc}</p>
          </motion.div>
        ))}
      </section>
    </motion.div>
  );
}
