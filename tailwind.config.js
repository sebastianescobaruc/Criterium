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
        nav: 'var(--nav)', navink: 'var(--nav-ink)', navink3: 'var(--nav-ink-3)', navline: 'var(--nav-line)', navact: 'var(--nav-act)',
        // Sistema de diseño 2026 (index.css, bloque sistema:inicio): bg-s-fondo, text-s-texto-2, border-s-borde…
        s: {
          fondo: 'var(--s-fondo)', 'fondo-alt': 'var(--s-fondo-alt)', hundido: 'var(--s-hundido)', superficie: 'var(--s-superficie)',
          'borde-suave': 'var(--s-borde-suave)', borde: 'var(--s-borde)', 'borde-fuerte': 'var(--s-borde-fuerte)', 'borde-campo': 'var(--s-borde-campo)',
          texto: 'var(--s-texto)', 'texto-2': 'var(--s-texto-2)', 'texto-3': 'var(--s-texto-3)',
          primario: 'var(--s-primario)', 'primario-hover': 'var(--s-primario-hover)', 'primario-suave': 'var(--s-primario-suave)',
          'primario-borde': 'var(--s-primario-borde)', enlace: 'var(--s-enlace)', 'sobre-primario': 'var(--s-sobre-primario)', foco: 'var(--s-foco)',
          marca: 'var(--s-marca)', 'marca-2': 'var(--s-marca-2)', 'sobre-marca': 'var(--s-sobre-marca)', 'sobre-marca-2': 'var(--s-sobre-marca-2)',
          'borde-marca': 'var(--s-borde-marca)', destaque: 'var(--s-destaque)', 'sobre-destaque': 'var(--s-sobre-destaque)', 'destaque-texto': 'var(--s-destaque-texto)',
          ok: 'var(--s-ok)', 'ok-fondo': 'var(--s-ok-fondo)', aviso: 'var(--s-aviso)', 'aviso-fondo': 'var(--s-aviso-fondo)',
          error: 'var(--s-error)', 'error-fondo': 'var(--s-error-fondo)', info: 'var(--s-info)', 'info-fondo': 'var(--s-info-fondo)'
        }
      },
      // Escala de letra del sistema: fluida entre 390 px y 1440 px
      fontSize: {
        's-display': ['clamp(2.5rem, 1.6rem + 3.6vw, 4.5rem)', { lineHeight: '1.02', letterSpacing: '-0.038em' }],
        's-h1': ['clamp(2.125rem, 1.6rem + 2.1vw, 3.25rem)', { lineHeight: '1.06', letterSpacing: '-0.032em' }],
        's-h2': ['clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.026em' }],
        's-h3': ['clamp(1.1875rem, 1.1rem + .35vw, 1.375rem)', { lineHeight: '1.3', letterSpacing: '-0.016em' }],
        's-lead': ['clamp(1.0625rem, 1rem + .3vw, 1.25rem)', { lineHeight: '1.55', letterSpacing: '-0.011em' }],
        's-cuerpo': ['1rem', { lineHeight: '1.6', letterSpacing: '-0.006em' }],
        's-chico': ['0.875rem', { lineHeight: '1.5' }],
        's-micro': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.09em' }]
      },
      maxWidth: { 's-pagina': '1200px', 's-texto': '38rem' },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Inter', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'sans-serif'],
        serif: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Inter', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'sans-serif'],
        display: ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', 'Inter', '"Segoe UI"', 'sans-serif'],
        mono: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'sans-serif']
      },
      borderRadius: { r: '20px', rs: '13px', campo: '8px', tarjeta: '12px', marco: '20px' },
      boxShadow: { sh: 'var(--sh)', shlg: 'var(--sh-lg)', 's-1': 'var(--s-sombra-1)', 's-2': 'var(--s-sombra-2)', 's-3': 'var(--s-sombra-3)' }
    }
  },
  plugins: []
};
