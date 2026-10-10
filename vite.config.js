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

// Criterium Red: la pantalla de carga (index.html) lleva su propio lema (el logo va sin cartel desde el 2026-10-10)
const pantallaRed = (mode) => ({
  name: 'criterium-pantalla-red',
  transformIndexHtml(html) {
    if (mode !== 'creativa') return html;
    return html
      .replace('<p class="c-lema">Procedimientos clínicos basados en la evidencia</p>', '<p class="c-lema" style="text-align:center;padding:0 16px;max-width:420px;text-wrap:balance">Odontología Basada en la Evidencia y Gestión Clínica</p>')
      .replace(/content="Protocolos odontológicos con evidencia trazable, casos clínicos y revisión por pares\."/, 'content="Criterium: odontología basada en evidencia, casos clínicos con revisión y discusión entre colegas."');
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
