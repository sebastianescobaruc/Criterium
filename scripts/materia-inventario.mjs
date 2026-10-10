// npm run materia:inventario -- "<carpeta>" ["<otra carpeta>" …]
// Primer paso de Materia: recorre las carpetas de clases (PDF), extrae el texto de cada uno a materia/_entrada/<id>.txt
// y escribe materia/_inventario.json con lo que hay: ruta, carpeta, páginas, cuánto texto tiene, el inicio del texto y
// los duplicados exactos (mismo archivo en dos carpetas). No decide nada: eso lo hace la etapa «ordenar» de materia:noche.
// Necesita .materia-venv con pypdf (python3 -m venv .materia-venv && .materia-venv/bin/pip install pypdf).
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, relative, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const PY = join(RAIZ, '.materia-venv/bin/python');
if (!existsSync(PY)) { console.error('Falta .materia-venv (ver la cabecera de este script).'); process.exit(1); }
const carpetas = process.argv.slice(2);
if (!carpetas.length) { console.error('Indica una o más carpetas.'); process.exit(1); }
const SALIDA = join(RAIZ, 'materia/_entrada'); mkdirSync(SALIDA, { recursive: true });
const previo = existsSync(join(RAIZ, 'materia/_inventario.json')) ? JSON.parse(readFileSync(join(RAIZ, 'materia/_inventario.json'), 'utf8')) : { archivos: [] };
const ya = new Map(previo.archivos.map((a) => [a.ruta, a]));

const pdfs = [];
const recorrer = (base, d) => { for (const n of readdirSync(d)) { const p = join(d, n); const s = statSync(p); if (s.isDirectory()) recorrer(base, p); else if (/\.pdf$/i.test(n)) pdfs.push({ base, p }); } };
for (const c of carpetas) recorrer(c, c);
console.log(`· ${pdfs.length} PDF`);

const archivos = []; const porHash = new Map(); let i = 0;
for (const { base, p } of pdfs) {
  i++;
  const ruta = join(basename(base), relative(base, p));
  const buf = readFileSync(p); const hash = createHash('sha256').update(buf).digest('hex');
  const id = hash.slice(0, 12);
  const txt = join(SALIDA, id + '.txt');
  let paginas = 0, caracteres = 0;
  const prev = ya.get(ruta);
  if (prev && prev.hash === hash && existsSync(txt)) ({ paginas, caracteres } = prev);
  else {
    try { [paginas, caracteres] = execFileSync(PY, ['-I', join(RAIZ, 'scripts/pdf-texto.py'), p, txt], { encoding: 'utf8', timeout: 120000 }).trim().split(' ').map(Number); }
    catch (e) { console.warn(`  ✗ ${ruta}: no se pudo leer`); }
  }
  const inicio = existsSync(txt) ? readFileSync(txt, 'utf8').replace(/\[página \d+\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300) : '';
  const a = { id, ruta, origen: p, carpeta: dirname(ruta), nombre: basename(p), paginas, caracteres, porPagina: paginas ? Math.round(caracteres / paginas) : 0, inicio, texto: relative(RAIZ, txt), hash };
  if (porHash.has(hash)) a.duplicadoDe = porHash.get(hash); else porHash.set(hash, id);
  archivos.push(a);
  if (i % 25 === 0) console.log(`  ${i}/${pdfs.length}`);
}
writeFileSync(join(RAIZ, 'materia/_inventario.json'), JSON.stringify({ creado: new Date().toISOString(), carpetas, archivos }, null, 1));
// Vista compacta para la etapa de ordenar (una línea por archivo)
const limpio = (x) => String(x).replace(/[\t\n]/g, ' ');
writeFileSync(join(RAIZ, 'materia/_inventario.tsv'), 'id\truta\tpaginas\tletras_por_pagina\tduplicado_de\tinicio\n'
  + archivos.map((a) => [a.id, a.ruta, a.paginas, a.porPagina, a.duplicadoDe || '', a.inicio.slice(0, 160)].map(limpio).join('\t')).join('\n') + '\n');
const sinTexto = archivos.filter((a) => a.porPagina < 80).length, dup = archivos.filter((a) => a.duplicadoDe).length;
console.log(`Listo: ${archivos.length} archivos · ${dup} duplicados exactos · ${sinTexto} con poco o nada de texto (escaneados o solo imágenes).`);
