/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0b1016', // sidebar
          900: '#0e141b', // main background
          800: '#101823',
          700: '#1a2432',
          600: '#223043'
        },
        // severity accents
        crit: '#ef4444',
        high: '#f97316',
        med: '#eab308',
        low: '#06b6d4',
        ok: '#10b981'
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    }
  },
  plugins: []
};
