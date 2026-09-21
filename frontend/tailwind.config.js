/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        navy: {
          950: '#020408',
          900: '#0a0e1a',
          800: '#0f1629',
          700: '#141e3c',
          600: '#1a2850',
        },
        civic: {
          indigo: '#4f46e5',
          'indigo-light': '#818cf8',
          cyan: '#06b6d4',
          'cyan-light': '#67e8f9',
          amber: '#f59e0b',
          'amber-light': '#fcd34d',
          emerald: '#10b981',
          rose: '#f43f5e',
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #4f46e5, 0 0 20px #4f46e544' },
          '100%': { boxShadow: '0 0 20px #4f46e5, 0 0 60px #4f46e566' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
