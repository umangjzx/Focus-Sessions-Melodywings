import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, UserPlus, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { registerSchema, type RegisterValues } from '../validation/schemas';
import logoSvg from '../assets/unnamed.png';

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [error, setError] = useState('');

  const {
    register: formRegister,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const password = watch('password');

  async function onSubmit(values: RegisterValues) {
    setError('');
    try {
      await register(values.name, values.email, values.password);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof msg === 'string' ? msg : 'Registration failed');
    }
  }

  const passwordStrength = {
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasLength: password.length >= 8,
  };

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
          <h1 className="text-3xl font-bold text-text mb-2">Create Account</h1>
          <p className="text-text-muted">Join MelodyWings and start mastering your focus</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Username Field */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <label className="form-label flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Full Name
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="John Doe"
              {...formRegister('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <motion.p className="form-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="alert">
                {errors.name.message}
              </motion.p>
            )}
          </motion.div>

          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
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
              {...formRegister('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <motion.p className="form-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="alert">
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
            <label className="form-label flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Password
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              {...formRegister('password')}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <motion.p className="form-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="alert">
                {errors.password.message}
              </motion.p>
            )}
            
            {/* Password Requirements */}
            {password && (
              <motion.div
                className="space-y-1 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    className={`w-1.5 h-1.5 rounded-full ${passwordStrength.hasLength ? 'bg-success' : 'bg-border'}`}
                    animate={passwordStrength.hasLength ? { scale: [1, 1.2, 1] } : {}}
                  />
                  <span className={passwordStrength.hasLength ? 'text-success' : 'text-text-muted'}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div
                    className={`w-1.5 h-1.5 rounded-full ${passwordStrength.hasUpper ? 'bg-success' : 'bg-border'}`}
                    animate={passwordStrength.hasUpper ? { scale: [1, 1.2, 1] } : {}}
                  />
                  <span className={passwordStrength.hasUpper ? 'text-success' : 'text-text-muted'}>
                    One uppercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div
                    className={`w-1.5 h-1.5 rounded-full ${passwordStrength.hasNumber ? 'bg-success' : 'bg-border'}`}
                    animate={passwordStrength.hasNumber ? { scale: [1, 1.2, 1] } : {}}
                  />
                  <span className={passwordStrength.hasNumber ? 'text-success' : 'text-text-muted'}>
                    One number
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Confirm Password Field */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-2"
          >
            <label className="form-label flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Confirm Password
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              {...formRegister('confirmPassword', {
                validate: (value) => value === password || "Passwords don't match",
              })}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <motion.p className="form-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="alert">
                {errors.confirmPassword.message}
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

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3 text-base font-semibold mt-6"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {isSubmitting ? (
              <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                Creating account...
              </motion.span>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Create Account
              </>
            )}
          </motion.button>
        </form>

        {/* Login Link */}
        <motion.p
          className="text-center text-text-secondary mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-light transition-colors">
            Sign in
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
