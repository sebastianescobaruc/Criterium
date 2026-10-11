// Comprueba el contraste (WCAG 2.1) de los pares de texto y fondo del sistema de diseño.
// Lee los tokens del bloque `sistema:inicio … sistema:fin` de src/index.css. Falla si algún par no llega a su mínimo.
// Uso: npm run contraste            (tabla en la terminal)
//      npm run contraste -- --md    (tabla en Markdown)
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const bloque = css.split('/* sistema:inicio */')[1]?.split('/* sistema:fin */')[0];
if (!bloque) { console.error('No encontré el bloque sistema:inicio … sistema:fin en src/index.css'); process.exit(1); }

const tokens = {};
for (const [, k, v] of bloque.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) tokens[k] = v.trim();
const valor = (k, n = 0) => {
  const v = tokens[k];
  if (v === undefined) throw new Error(`Falta el token --${k}`);
  const ref = v.match(/^var\(--([\w-]+)\)$/);
  return ref && n < 10 ? valor(ref[1], n + 1) : v;
};
const lum = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0);
};
const razon = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

// [texto, fondo, mínimo, uso]. 4.5 = texto normal; 3 = texto grande (≥ 24 px, o 19 px en negrita) y bordes de componentes.
const PARES = [
  ['s-texto', 's-fondo', 4.5, 'Texto principal'],
  ['s-texto', 's-fondo-alt', 4.5, 'Texto principal en sección gris'],
  ['s-texto-2', 's-fondo', 4.5, 'Texto secundario'],
  ['s-texto-2', 's-fondo-alt', 4.5, 'Texto secundario en sección gris'],
  ['s-texto-3', 's-fondo', 4.5, 'Texto terciario'],
  ['s-texto-3', 's-fondo-alt', 4.5, 'Texto terciario en sección gris'],
  ['s-texto-3', 's-hundido', 4.5, 'Texto terciario en recuadro hundido'],
  ['s-enlace', 's-fondo', 4.5, 'Enlace'],
  ['s-enlace', 's-fondo-alt', 4.5, 'Enlace en sección gris'],
  ['s-sobre-primario', 's-primario', 4.5, 'Botón primario'],
  ['s-sobre-primario', 's-primario-hover', 4.5, 'Botón primario (encima)'],
  ['s-enlace', 's-primario-suave', 4.5, 'Insignia o botón suave'],
  ['s-sobre-marca', 's-marca', 4.5, 'Texto en sección oscura'],
  ['s-sobre-marca-2', 's-marca', 4.5, 'Texto secundario en sección oscura'],
  ['s-sobre-marca-2', 's-marca-2', 4.5, 'Texto secundario en tarjeta oscura'],
  ['s-destaque', 's-marca', 4.5, 'Menta sobre oscuro'],
  ['s-destaque', 's-marca-2', 4.5, 'Menta sobre tarjeta oscura'],
  ['s-sobre-destaque', 's-destaque', 4.5, 'Botón menta'],
  ['s-destaque-texto', 's-fondo', 4.5, 'Menta como texto sobre blanco'],
  ['s-ok', 's-ok-fondo', 4.5, 'Estado: listo'],
  ['s-aviso', 's-aviso-fondo', 4.5, 'Estado: borrador / aviso'],
  ['s-error', 's-error-fondo', 4.5, 'Estado: error'],
  ['s-error', 's-fondo', 4.5, 'Mensaje de error de un campo'],
  ['s-info', 's-info-fondo', 4.5, 'Estado: información'],
  ['s-borde-campo', 's-fondo', 3, 'Borde de un campo'],
  ['s-foco', 's-fondo', 3, 'Anillo de foco'],
  ['s-primario', 's-fondo', 3, 'Ícono primario']
];

const md = process.argv.includes('--md');
let fallas = 0;
const filas = PARES.map(([t, f, min, uso]) => {
  const r = razon(valor(t), valor(f)); const ok = r >= min; if (!ok) fallas++;
  return { uso, t, f, r: r.toFixed(2), min, ok };
});
if (md) {
  console.log('| Uso | Texto | Fondo | Contraste | Mínimo | |\n|---|---|---|---|---|---|');
  for (const x of filas) console.log(`| ${x.uso} | \`--${x.t}\` | \`--${x.f}\` | ${x.r} | ${x.min} | ${x.ok ? '✓' : '✗'} |`);
} else {
  for (const x of filas) console.log(`${x.ok ? '✓' : '✗'} ${x.r.padStart(5)} (mín ${x.min})  ${x.uso}  --${x.t} / --${x.f}`);
}
console.log(fallas ? `\n${fallas} par(es) bajo el mínimo.` : `\nLos ${filas.length} pares cumplen AA.`);
process.exit(fallas ? 1 : 0);
