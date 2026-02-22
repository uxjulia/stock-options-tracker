/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark backgrounds
        bg: {
          base: '#0f172a',
          surface: '#1e293b',
          elevated: '#334155',
        },
        // Semantic colors
        profit: {
          DEFAULT: '#22c55e',
          dim: '#166534',
        },
        loss: {
          DEFAULT: '#ef4444',
          dim: '#991b1b',
        },
        warning: {
          DEFAULT: '#f97316',
          dim: '#9a3412',
        },
        danger: {
          DEFAULT: '#dc2626',
          dim: '#7f1d1d',
        },
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
