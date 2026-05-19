import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import { loginSchema, type LoginValues } from '../validation/schemas';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const email = watch('email');

  async function onSubmit(values: LoginValues) {
    setError('');
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch {
      setError('Invalid email or password');
    }
  }

  async function handleForgot() {
    if (!email) {
      setForgotMsg('Enter your email first');
      return;
    }
    await authApi.forgotPassword(email);
    setForgotMsg('If that email exists, reset instructions were sent.');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 p-4 mb-6"
          >
            <LogIn className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-bold text-text mb-2">Welcome back</h1>
          <p className="text-text-secondary">Sign in to your Focus Sessions account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <label className="form-label flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Email Address
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              {...register('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <motion.p
                className="form-error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                role="alert"
              >
                {errors.email.message}
              </motion.p>
            )}
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <label className="form-label flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Password
              </label>
              <motion.button
                type="button"
                onClick={handleForgot}
                className="btn-ghost text-xs py-0 px-0"
                whileHover={{ scale: 1.05 }}
              >
                Forgot?
              </motion.button>
            </div>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              {...register('password')}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <motion.p
                className="form-error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                role="alert"
              >
                {errors.password.message}
              </motion.p>
            )}
          </motion.div>

          {/* Error Alert */}
          {error && (
            <motion.div
              className="alert-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              role="alert"
            >
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {/* Forgot Password Message */}
          {forgotMsg && (
            <motion.div
              className="alert-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-sm">{forgotMsg}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3 text-base font-semibold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {isSubmitting ? (
              <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                Signing in...
              </motion.span>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Sign In
              </>
            )}
          </motion.button>
        </form>

        {/* Signup Link */}
        <motion.p
          className="text-center text-text-secondary mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary hover:text-primary-light transition-colors">
            Create one
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
