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
        toast: 'var(--toast)', cardline: 'var(--card-line)', input: 'var(--input)', toastink: 'var(--toast-ink)',
        'estado-borrador': 'var(--estado-borrador)', 'estado-borrador-bg': 'var(--estado-borrador-bg)',
        'estado-validado': 'var(--estado-validado)', 'estado-validado-bg': 'var(--estado-validado-bg)',
        'estado-planificado': 'var(--estado-planificado)', 'estado-planificado-bg': 'var(--estado-planificado-bg)',
        panel: 'var(--panel)', panel2: 'var(--panel-2)', panelink: 'var(--panel-ink)', panelink2: 'var(--panel-ink-2)',
        menta: 'var(--menta)', mentaink: 'var(--menta-ink)', mentasoft: 'var(--menta-soft)', rotulo: 'var(--rotulo)',
        nav: 'var(--nav)', navink: 'var(--nav-ink)', navink3: 'var(--nav-ink-3)', navline: 'var(--nav-line)', navact: 'var(--nav-act)'
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
