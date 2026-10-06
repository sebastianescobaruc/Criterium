// Escribe en el master prompt «del caso al protocolo» el catálogo vigente de animaciones:
// las escenas hechas a mano (nombre y qué muestran) y el vocabulario de las recetas.
// Así el prompt nunca queda desactualizado respecto del código. Uso: npm run catalogo
import { build } from 'esbuild';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DOC = RAIZ + 'docs/MASTER_PROMPT_CASO_A_PROTOCOLO.md';
const TMP = RAIZ + 'node_modules/.cache/catalogo-anim.mjs';
await build({
  stdin: { contents: "export { ESCENAS } from './src/views/animaciones.jsx'; export { VOCABULARIO } from './src/views/anim/receta.jsx';", resolveDir: RAIZ, loader: 'js' },
  bundle: true, platform: 'node', format: 'esm', outfile: TMP, jsx: 'automatic', loader: { '.jsx': 'jsx', '.md': 'text' }, logLevel: 'error',
  external: ['react', 'react-dom']
});
const { ESCENAS, VOCABULARIO } = await import(pathToFileURL(TMP).href + '?' + Date.now());
rmSync(TMP);

const escenas = Object.entries(ESCENAS).map(([k, e]) => `- \`${k}\` — ${e.alt}`).join('\n');
const v = VOCABULARIO;
const bases = Object.entries(v.bases).map(([k, b]) => [
  `#### \`${k}\``, b.desc, '',
  '- **estado:** ' + (Object.keys(b.estados).length ? Object.entries(b.estados).map(([e, d]) => `\`${e}\` (${d})`).join(', ') : 'ninguno'),
  '- **capas:** ' + b.capas.map((c) => '`' + c + '`').join(', '),
  '- **puntos:** ' + b.puntos.map((c) => '`' + c + '`').join(', ') + (b.puntosExtra ? '; además ' + b.puntosExtra : ''),
  ...(b.pieza ? ['- **pieza:** ' + b.pieza] : [])
].join('\n')).join('\n\n');
const instrumentos = Object.entries(v.instrumentos).map(([k, d]) => `\`${k}\` (${d})`).join(', ');
const efectos = Object.entries(v.efectos).map(([k, d]) => `\`${k}\` (${d})`).join(', ');
const bloque = `<!-- catalogo:inicio (lo escribe npm run catalogo; no lo edites a mano) -->
### Escenas hechas a mano (${Object.keys(ESCENAS).length})

${escenas}

### Vocabulario de las recetas

${bases}

**Instrumentos:** ${instrumentos}.

**Efectos:** ${efectos}.

**Tonos de rótulo:** \`''\` (normal), \`'acento'\` (lo que hay que lograr), \`'mal'\` (lo que no se hace).
<!-- catalogo:fin -->`;
const doc = readFileSync(DOC, 'utf8');
const nuevo = doc.replace(/<!-- catalogo:inicio[\s\S]*?<!-- catalogo:fin -->/, bloque);
if (nuevo === doc && !doc.includes('catalogo:inicio')) { console.error('Falta el bloque <!-- catalogo:inicio --> … <!-- catalogo:fin --> en ' + DOC); process.exit(1); }
writeFileSync(DOC, nuevo);
console.log('Catálogo actualizado: ' + Object.keys(ESCENAS).length + ' escenas, ' + Object.keys(v.bases).length + ' bases, ' + Object.keys(v.instrumentos).length + ' instrumentos.');
