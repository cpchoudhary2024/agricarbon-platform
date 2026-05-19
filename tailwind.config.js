/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'gold': {
          50: '#fffbf0',
          100: '#fff8e6',
          200: '#ffecc2',
          300: '#ffe099',
          400: '#ffd966',
          500: '#f4c430',
          600: '#daa520',
          700: '#b8860b',
          800: '#8b6914',
        },
        'premium': {
          'blue': '#1e3a5f',
          'blue-light': '#2d5a8c',
          'blue-lighter': '#3d7ab8',
          'dark': '#0f1f2e',
          'darkest': '#050a10',
          'accent': '#6b9bd1',
        },
        'soil': {
          'dark': '#3e2723',
          'medium': '#5d4037',
          'light': '#795548',
          'sand': '#a1887f',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'Inter', 'sans-serif'],
        display: ['Merriweather', 'Cormorant Garamond', 'serif'],
        mono: ['IBM Plex Mono', 'Courier', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(244, 196, 48, 0.3)',
        'glow-blue': '0 0 20px rgba(109, 154, 209, 0.3)',
        'premium': '0 20px 25px -5px rgba(15, 31, 46, 0.15)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'soil-flow': 'soil-flow 8s ease-in-out infinite',
        'carbon-rise': 'carbon-rise 3s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 0px rgba(244, 196, 48, 0.5))' },
          '50%': { opacity: '0.7', filter: 'drop-shadow(0 0 20px rgba(244, 196, 48, 0.8))' },
        },
        'soil-flow': {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(100px) translateX(20px)', opacity: '0' },
        },
        'carbon-rise': {
          '0%': { transform: 'translateY(100px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

