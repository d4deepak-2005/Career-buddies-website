import defaultTheme from 'tailwindcss/defaultTheme';
import { brandTokens as t } from './src/theme/brandTokens.js';

/** CareerBuddies brand tokens, taken from the official logo / website palette. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cb: { navy: t.colors.navy, 'navy-deep': t.colors.navyDeep, blue: t.colors.blue, 'blue-bright': t.colors.blueBright, green: t.colors.green, 'green-dark': t.colors.greenDark, mint: t.colors.mint },
        ink: { DEFAULT: t.colors.ink, muted: t.colors.inkMuted, faint: t.colors.inkFaint },
        surface: { DEFAULT: t.colors.white, alt: t.colors.tint100, line: t.colors.tint300, tint: t.colors.tint50 },
        danger: { DEFAULT: t.colors.danger, soft: t.colors.dangerSoft },
      },
      fontFamily: { sans: ['"Plus Jakarta Sans Variable"', ...defaultTheme.fontFamily.sans] },
      borderRadius: { card: '1.25rem' },
      boxShadow: {
        card: '0 1px 2px rgba(0,40,105,0.04), 0 8px 24px -12px rgba(0,40,105,0.12)',
        pop: '0 12px 40px -12px rgba(0,40,105,0.35)',
      },
      backgroundImage: {
        'brand-gradient': `linear-gradient(135deg, ${t.colors.navyDeep} 0%, ${t.colors.navy} 55%, ${t.colors.blue} 100%)`,
        'brand-accent': `linear-gradient(90deg, ${t.colors.blue} 0%, ${t.colors.greenDark} 100%)`,
      },
    },
  },
  plugins: [],
};
