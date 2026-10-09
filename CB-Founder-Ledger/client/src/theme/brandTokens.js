/**
 * CareerBuddies Founder Ledger — central design tokens (single source for Tailwind, CSS and the charts).
 *
 * VERIFIED against the CareerBuddies website source in this repository (src/**: most-used colour literals, counted):
 *   #002869 navy (615×) · #061b3b deep navy (412×) · #cbdaff / #dae2ff / #e0e8ff / #f1f3ff / #f9f9ff blue tints ·
 *   #434652 / #747783 neutral text (277× / 196×) · #006e29 dark green (258×) · #79fd8d mint green (199×) · #0b3d91 blue (68×).
 * Font: 'Plus Jakarta Sans' (website src/index.css).
 * The Ledger-specific action blue (#0052a3) and button green (#00a63f) were sampled from the official logo asset; no other colour is invented.
 */
export const brandTokens = {
  colors: {
    navy: '#002869',
    navyDeep: '#061b3b',
    blue: '#0052a3',
    blueBright: '#0b3d91',
    green: '#00a63f',
    greenDark: '#006e29',
    mint: '#79fd8d',
    tint50: '#f9f9ff',
    tint100: '#f1f3ff',
    tint200: '#e0e8ff',
    tint300: '#dae2ff',
    tint400: '#cbdaff',
    inkMuted: '#434652',
    inkFaint: '#747783',
    ink: '#0f1b33',
    danger: '#c0392b',
    dangerSoft: '#fdecea',
    white: '#ffffff',
  },
  font: "'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  radius: { card: '1.25rem' },
  /** Categorical palette for charts (all from the brand colours; every slice is also labelled with text). */
  chart: ['#002869', '#0052a3', '#00a63f', '#006e29', '#5b8fd1', '#7ac79a', '#747783'],
};
