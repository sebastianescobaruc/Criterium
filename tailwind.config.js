/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', card: 'var(--card)', soft: 'var(--soft)',
        ink: 'var(--ink)', ink2: 'var(--ink-2)', ink3: 'var(--ink-3)',
        line: 'var(--line)', line2: 'var(--line-2)', deep: 'var(--deep)',
        acento: 'var(--acento)', acentosoft: 'var(--acento-soft)', acentodeep: 'var(--acento-deep)',
        ok: 'var(--ok)', oksoft: 'var(--ok-soft)', warn: 'var(--warn)', warnsoft: 'var(--warn-soft)',
        bad: 'var(--bad)', badsoft: 'var(--bad-soft)', onc: 'var(--onc)', band: 'var(--band)',
        toast: 'var(--toast)', cardline: 'var(--card-line)', input: 'var(--input)', toastink: 'var(--toast-ink)'
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Inter', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'sans-serif'],
        serif: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Inter', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'sans-serif'],
        display: ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', 'Inter', '"Segoe UI"', 'sans-serif'],
        mono: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'sans-serif']
      },
      borderRadius: { r: '20px', rs: '13px' },
      boxShadow: { sh: 'var(--sh)', shlg: 'var(--sh-lg)' }
    }
  },
  plugins: []
};
