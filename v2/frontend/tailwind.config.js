/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out forwards',
        'blink': 'blink 1s step-start infinite',
        'pulse-glow': 'pulse-glow 3s infinite',
        "pulse": "pulse 4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 rgba(99, 102, 241, 0)' },
          '50%': { boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)' },
        },
        "pulse": {
          "0%, 100%": { opacity: 0.1 },
          "50%": { opacity: 0.2 },
        }
      },
    },
  },
  plugins: [],
};
