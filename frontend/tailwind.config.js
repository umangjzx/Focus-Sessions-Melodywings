/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#5DADE2',
        'primary-light': '#85C1E9',
        'primary-dark': '#3498DB',
        secondary: '#F0907A',
        'secondary-light': '#F5B7A6',
        'secondary-dark': '#E8744F',
        accent: '#FFB88C',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        'error-light': '#FCA5A5',
        surface: 'rgba(255, 255, 255, 0.65)',
        'surface-hover': 'rgba(255, 255, 255, 0.9)',
        'surface-active': '#FFFFFF',
        text: '#0F172A',
        'text-secondary': '#334155',
        'text-muted': '#64748B',
        'text-subtle': '#94A3B8',
        border: 'rgba(255, 255, 255, 0.6)',
        'border-light': 'rgba(255, 255, 255, 0.9)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #5DADE2 0%, #85C1E9 30%, #FFB88C 70%, #F0907A 100%)',
      },
    },
  },
  plugins: [],
};
