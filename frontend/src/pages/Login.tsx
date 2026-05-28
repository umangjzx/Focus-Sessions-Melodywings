import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import { loginSchema, type LoginValues } from '../validation/schemas';
import logoSvg from '../assets/logo.svg';

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
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-6">
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
            className="inline-flex mb-6"
          >
            <img src={logoSvg} alt="MelodyWings" className="h-14 w-14" />
          </motion.div>
          <h1 className="text-3xl font-bold text-text mb-2">Welcome back</h1>
          <p className="text-text-muted">Sign in to your MelodyWings account</p>
        </div>

        <div className="card-elevated">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
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
                <p className="form-error" role="alert">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="form-label flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgot}
                  className="text-xs text-primary-dark hover:text-primary transition-colors font-medium"
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                {...register('password')}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="form-error" role="alert">{errors.password.message}</p>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <div className="alert-error" role="alert">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Forgot Password Message */}
            {forgotMsg && (
              <div className="alert-info">
                <p className="text-sm">{forgotMsg}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3.5 text-base"
            >
              {isSubmitting ? 'Signing in...' : (
                <>
                  <LogIn className="h-5 w-5" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Signup Link */}
        <p className="text-center text-text-muted mt-6 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary-dark hover:text-primary transition-colors">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
