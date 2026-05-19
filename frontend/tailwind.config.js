/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        'primary-light': '#60a5fa',
        'primary-dark': '#1e40af',
        secondary: '#8b5cf6',
        'secondary-light': '#a78bfa',
        'secondary-dark': '#6d28d9',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        'error-light': '#fca5a5',
        surface: '#1e293b',
        'surface-hover': '#334155',
        'surface-active': '#475569',
        text: '#f1f5f9',
        'text-secondary': '#cbd5e1',
        'text-muted': '#94a3b8',
        'text-subtle': '#64748b',
        border: '#334155',
        'border-light': '#475569',
      },
    },
  },
  plugins: [],
};
