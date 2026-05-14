/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        deep:   '#0a0c12',
        panel:  '#111422',
        row:    '#161a28',
        hover:  '#1c2130',
        gold:   '#e2c97e',
        'gold-dim': 'rgba(226,201,126,0.15)',
      },
      fontFamily: {
        cinzel:  ['Cinzel', 'serif'],
        crimson: ['Crimson Text', 'serif'],
      },
    },
  },
  plugins: [],
}
