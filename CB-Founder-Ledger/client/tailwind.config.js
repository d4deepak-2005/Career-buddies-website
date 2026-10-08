import defaultTheme from 'tailwindcss/defaultTheme';

/** CareerBuddies brand tokens, taken from the official logo / website palette. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cb: {
          navy: '#002869',
          'navy-deep': '#001a45',
          blue: '#0052a3',
          'blue-bright': '#0055b3',
          green: '#00a63f',
          'green-dark': '#008040',
        },
        ink: { DEFAULT: '#0f1b33', muted: '#5b6b86', faint: '#8a97ad' },
        surface: { DEFAULT: '#ffffff', alt: '#f4f7fb', line: '#e3e9f2' },
        danger: { DEFAULT: '#c0392b', soft: '#fdecea' },
      },
      fontFamily: { sans: ['"Plus Jakarta Sans Variable"', ...defaultTheme.fontFamily.sans] },
      borderRadius: { card: '1.25rem' },
      boxShadow: {
        card: '0 1px 2px rgba(0,40,105,0.04), 0 8px 24px -12px rgba(0,40,105,0.12)',
        pop: '0 12px 40px -12px rgba(0,40,105,0.35)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #001a45 0%, #002869 55%, #0052a3 100%)',
        'brand-accent': 'linear-gradient(90deg, #0052a3 0%, #008040 100%)',
      },
    },
  },
  plugins: [],
};
