/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#050807', // sidebar
          900: '#0a0f0a', // main background
          800: '#0e1510',
          700: '#16211a',
          600: '#1e2b22' // borders
        },
        // severity accents
        crit: '#ef4444',
        high: '#f97316',
        med: '#eab308',
        low: '#06b6d4',
        ok: '#22c55e',
        'ok-bright': '#4ade80',
        'ok-dim': '#16a34a'
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    }
  },
  plugins: []
};
