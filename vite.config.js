import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// El contenido clínico de data.js nunca va en el código publicado: en las dos ediciones (la completa y Criterium, el
// borrador único sobre la Red) se reemplaza por src/protocolos-remotos.js, que se llena con lo que Firestore deja ver a
// cada persona (modo piloto). data.js sigue siendo la fuente de verdad: lo leen los scripts (pdfs, voces, protocolos:subir).
// Excepciones: las pruebas (mode 'test') y VITE_PROTOCOLOS_LOCALES=true en .env.local, para trabajar sin conexión.
const sinProtocolos = (mode, locales) => ({
  name: 'criterium-sin-protocolos',
  enforce: 'pre',
  resolveId(fuente, desde) {
    if (mode === 'test' || locales) return null;
    if (!desde || !/\/src\//.test(desde) || !/^(\.\.?\/)+data\.js$/.test(fuente)) return null;
    return fileURLToPath(new URL('./src/protocolos-remotos.js', import.meta.url));
  }
});

// Descripción y dirección pública de la Red (para la vista previa al compartir el enlace: og:image necesita la dirección completa)
const DESCRIPCION_RED = 'Software dental con guías clínicas basadas en evidencia: agenda, ficha, caja, inventario y esterilización conectados por la guía del procedimiento. Para clínicas, estudiantes y docentes.';
const SITIO_RED = 'https://criterium-e5d90--creativa-5za5fsbq.web.app';

// Criterium Red: la pantalla de carga (index.html) lleva el lema de la marca, «Cada paso, con criterio.» (elegido el 2026-10-11)
const pantallaRed = (mode) => ({
  name: 'criterium-pantalla-red',
  transformIndexHtml(html) {
    if (mode !== 'creativa') return html;
    return html
      .replace('<p class="c-lema">Procedimientos clínicos basados en la evidencia</p>', '<p class="c-lema">Cada paso, con criterio.</p>')
      // Visita pública (sin sesión guardada, sin #, sin invitación ?i= ni grupo ?g=, en la web): sin pantalla de carga; main.jsx abre la portada sin Firebase
      .replace('</head>', `    <script>try{if(!localStorage.getItem('criterium-sesion')&&!location.hash&&!/[?&](i|g)=/.test(location.search)&&/^https?:$/.test(location.protocol))document.documentElement.classList.add('publica')}catch(e){}</script>
    <style>.publica #carga{display:none}</style>
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Criterium · Cada paso, con criterio." />
    <meta property="og:description" content="${DESCRIPCION_RED}" />
    <meta property="og:image" content="${SITIO_RED}/portada/og.png" />
    <meta property="og:locale" content="es_CL" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>`)
      .replace('<title>Criterium</title>', '<title>Criterium · Cada paso, con criterio.</title>')
      .replace(/content="Protocolos odontológicos con evidencia trazable, casos clínicos y revisión por pares\."/, `content="${DESCRIPCION_RED}"`);
  }
});

// base '/' para Vercel. Usar './' solo si se abre como archivo local.
export default defineConfig(({ mode }) => ({
  plugins: [sinProtocolos(mode, loadEnv(mode, process.cwd(), 'VITE_').VITE_PROTOCOLOS_LOCALES === 'true'), pantallaRed(mode), react()],
  base: '/',
  build: {
    // Firebase y React van en archivos aparte: cambian poco, así el navegador los guarda y en cada versión nueva
    // solo se descarga el código de Criterium
    rollupOptions: { output: { manualChunks: (id) => (/node_modules\/(@firebase\/storage|firebase\/storage)/.test(id) ? undefined : /node_modules\/(@firebase|firebase|re2js)\//.test(id) ? 'firebase' : id.includes('node_modules/react') ? 'react' : undefined) } },
    chunkSizeWarningLimit: 900
  }
}));
