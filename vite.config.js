import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Edición creativa (npm run build:creativa): el contenido clínico de data.js se reemplaza por una lista vacía,
// así ni los protocolos ni sus fuentes quedan en el código publicado de Criterium Red.
const sinProtocolos = (mode) => ({
  name: 'criterium-sin-protocolos',
  enforce: 'pre',
  resolveId(fuente, desde) {
    if (mode !== 'creativa' || !desde || !/\/src\//.test(desde) || !/^(\.\.?\/)+data\.js$/.test(fuente)) return null;
    return fileURLToPath(new URL('./src/creativa/sin-protocolos.js', import.meta.url));
  }
});

// base '/' para Vercel. Usar './' solo si se abre como archivo local.
export default defineConfig(({ mode }) => ({
  plugins: [sinProtocolos(mode), react()],
  base: '/',
  build: {
    // Firebase y React van en archivos aparte: cambian poco, así el navegador los guarda y en cada versión nueva
    // solo se descarga el código de Criterium
    rollupOptions: { output: { manualChunks: (id) => (/node_modules\/(@firebase\/storage|firebase\/storage)/.test(id) ? undefined : /node_modules\/(@firebase|firebase|re2js)\//.test(id) ? 'firebase' : id.includes('node_modules/react') ? 'react' : undefined) } },
    chunkSizeWarningLimit: 900
  }
}));
