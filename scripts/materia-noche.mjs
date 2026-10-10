// npm run materia:noche -- [--paralelo 2] [--hasta 07:30] [--limite N] [--solo ordenar] [--sin-subir] [--modelo <modelo>]
// Proceso nocturno de Materia. Corre solo, con `claude -p`, mientras nadie está:
//   1. Ordenar: si no existe materia/plan.json, una sesión lee el inventario (npm run materia:inventario) y decide qué
//      clases escribir, de qué ramo y con qué archivos (docs/MASTER_PROMPT_MATERIA_ORDEN.md).
//   2. Escribir: una sesión por clase, varias en paralelo (docs/MASTER_PROMPT_MATERIA.md). Cada clase pasa por
//      scripts/validar-materia.mjs; si falla, se le devuelve el error una vez para que lo corrija.
//   3. Subir: cada 5 clases listas y al final, npm run materia:subir -- --borrador (se ven como «Borrador» en Materia).
// El estado de cada clase queda en materia/plan.json (lo escribe solo este proceso) y el detalle en materia/_registro/.
// Se puede cortar y volver a correr: sigue donde quedó. Si se acaba el uso del plan de Claude, espera y reintenta.
// Seguridad: las sesiones solo pueden leer, escribir archivos y usar scripts/pubmed.mjs y scripts/validar-materia.mjs.
// Si una sesión cambia algo fuera de materia/, el proceso se detiene y lo anota.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, renameSync, appendFileSync } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : (i > 0 ? true : d); };
const PARALELO = +arg('paralelo', 2), HASTA = arg('hasta', '07:30'), LIMITE = +arg('limite', 0) || Infinity;
const SOLO = arg('solo', ''), SUBIR = !process.argv.includes('--sin-subir'), MODELO = arg('modelo', '');
const PLAN = join(RAIZ, 'materia/plan.json'), REG = join(RAIZ, 'materia/_registro');
mkdirSync(REG, { recursive: true }); mkdirSync(join(RAIZ, 'materia/_reportes'), { recursive: true });
const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
const LOG = join(REG, `noche-${hoy}.log`);
const log = (m) => { const l = `[${new Date().toLocaleTimeString('es-CL', { timeZone: 'America/Santiago' })}] ${m}`; console.log(l); appendFileSync(LOG, l + '\n'); };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Hora de término: hoy o mañana a esa hora (hora de Chile)
const fin = (() => { if (HASTA === 'nunca') return new Date(Date.now() + 365 * 864e5); const [h, m] = String(HASTA).split(':').map(Number); const d = new Date(); const t = new Date(d); t.setHours(h, m || 0, 0, 0); if (t <= d) t.setDate(t.getDate() + 1); return t; })();
const quedaTiempo = () => new Date() < fin;

const HERRAMIENTAS = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'Bash(node scripts/pubmed.mjs:*)', 'Bash(node scripts/validar-materia.mjs:*)', 'Bash(node -e:*)'];
const LIMITE_USO = /usage limit|rate limit|limit reached|hit your [a-z ]*limit|weekly limit|session limit|quota|too many requests|overloaded|529/i;

// Archivos cambiados fuera de materia/ desde una marca de tiempo (para detectar sesiones que se salen de su carril)
function cambiadosFuera(desde) {
  const fuera = [];
  const mirar = (d) => {
    for (const n of readdirSync(d)) {
      if (['node_modules', '.git', 'materia', 'dist', 'dist-creativa', '.materia-venv', 'ios', '.firebase', '.claude'].includes(n)) continue;
      const p = join(d, n); let s; try { s = statSync(p); } catch (e) { continue; }
      if (s.isDirectory()) mirar(p); else if (s.mtimeMs > desde) fuera.push(p.slice(RAIZ.length));
    }
  };
  mirar(RAIZ); return fuera;
}

function claude(prompt, archivoLog) {
  return new Promise((resolve) => {
    const a = ['-p', prompt, '--allowedTools', ...HERRAMIENTAS, '--permission-mode', 'acceptEdits', '--output-format', 'text'];
    if (MODELO) a.push('--model', MODELO);
    const pr = spawn('claude', a, { cwd: RAIZ, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    pr.stdout.on('data', (d) => { out += d; appendFileSync(archivoLog, d); });
    pr.stderr.on('data', (d) => { out += d; appendFileSync(archivoLog, d); });
    pr.on('close', (code) => resolve({ code, out }));
  });
}
const validar = (html) => {
  try { return { ok: true, txt: execFileSync('node', [join(RAIZ, 'scripts/validar-materia.mjs'), html, '--navegador'], { encoding: 'utf8', timeout: 300000 }) }; }
  catch (e) { return { ok: false, txt: (e.stdout || '') + (e.stderr || '') || String(e) }; }
};
const leerPlan = () => JSON.parse(readFileSync(PLAN, 'utf8'));
const guardarPlan = (p) => writeFileSync(PLAN, JSON.stringify(p, null, 1));
let detenido = false;

// ── 1. Ordenar ──
if (!existsSync(PLAN)) {
  if (!existsSync(join(RAIZ, 'materia/_inventario.tsv'))) { log('Falta el inventario: corre primero npm run materia:inventario -- "<carpetas>"'); process.exit(1); }
  log('Ordenando el material (materia/plan.json)…');
  const marca = Date.now();
  let r;
  for (;;) {
    r = await claude('Lee docs/MASTER_PROMPT_MATERIA_ORDEN.md y síguelo al pie de la letra. Hoy es ' + hoy + '.', join(REG, 'ordenar.log'));
    if (LIMITE_USO.test(r.out) && !existsSync(PLAN)) { if (!quedaTiempo()) { log('Se acabó el horario esperando el límite de uso.'); process.exit(0); } log('Límite de uso de Claude: espero 30 minutos.'); await espera(30 * 60e3); continue; }
    break;
  }
  const fuera = cambiadosFuera(marca);
  if (fuera.length) { log('ALTO: la etapa de ordenar cambió archivos fuera de materia/: ' + fuera.join(', ')); process.exit(1); }
  if (!existsSync(PLAN)) { log('La etapa de ordenar no dejó materia/plan.json. Ver materia/_registro/ordenar.log'); process.exit(1); }
  const p = leerPlan(); p.clases.forEach((c) => { c.estado = c.estado || 'pendiente'; c.intentos = 0; }); guardarPlan(p);
  log(`Plan listo: ${p.clases.length} clases, ${(p.descartados || []).length} archivos descartados.`);
}
if (SOLO === 'ordenar') process.exit(0);

// ── 2. Escribir ──
const RAMOS = JSON.parse(readFileSync(join(RAIZ, 'materia/ramos.json'), 'utf8'));
let plan = leerPlan();
for (const c of plan.clases) { if (!c.estado || c.estado === 'escribiendo') c.estado = 'pendiente'; if (!RAMOS[c.ramo]) c.estado = 'ramo-desconocido'; }
guardarPlan(plan);
let hechas = 0, desdeSubida = 0;
const cola = plan.clases.filter((c) => c.estado === 'pendiente' || (c.estado === 'error' && (c.intentos || 0) < 2));
log(`Cola: ${cola.length} clases · en paralelo: ${PARALELO} · hasta las ${fin.toLocaleTimeString('es-CL')} · límite: ${LIMITE === Infinity ? 'sin límite' : LIMITE}`);

function marcar(id, ramo, cambios) { plan = leerPlan(); const c = plan.clases.find((x) => x.id === id && x.ramo === ramo); Object.assign(c, cambios); guardarPlan(plan); }
async function subir() {
  if (!SUBIR) return;
  try { const t = execFileSync('node', [join(RAIZ, 'scripts/subir-materia.mjs'), '--borrador'], { encoding: 'utf8', cwd: RAIZ, timeout: 600000 }); log('Subida: ' + t.trim().split('\n').slice(-2).join(' · ')); }
  catch (e) { log('No se pudo subir: ' + ((e.stdout || '') + (e.stderr || '')).trim().split('\n').slice(-3).join(' · ')); }
}

async function escribir(c) {
  const html = join(RAIZ, 'materia', c.ramo, c.id + '.html');
  const regClase = join(REG, `${c.ramo}--${c.id}.log`);
  mkdirSync(join(RAIZ, 'materia', c.ramo), { recursive: true }); mkdirSync(join(RAIZ, 'materia/_reportes', c.ramo), { recursive: true });
  marcar(c.id, c.ramo, { estado: 'escribiendo', inicio: new Date().toISOString() });
  log(`→ ${c.ramo}/${c.id}: ${c.titulo}`);
  const datos = JSON.stringify({ id: c.id, ramo: c.ramo, titulo: c.titulo, orden: c.orden, archivos: c.archivos, nota: c.nota || '' });
  let prompt = `Lee docs/MASTER_PROMPT_MATERIA.md y síguelo al pie de la letra para esta clase. Hoy es ${hoy}.\n\n${datos}`;
  for (let ronda = 1; ronda <= 2; ronda++) {
    const marca = Date.now();
    let r;
    for (;;) {
      r = await claude(prompt, regClase);
      if (LIMITE_USO.test(r.out.slice(-2000)) && !/RESULTADO: OK/.test(r.out)) {
        if (!quedaTiempo()) { marcar(c.id, c.ramo, { estado: 'pendiente' }); return; }
        log(`  límite de uso de Claude (${c.id}): espero 30 minutos.`); await espera(30 * 60e3); continue;
      }
      break;
    }
    const fuera = cambiadosFuera(marca);
    if (fuera.length) { detenido = true; log(`ALTO: ${c.id} cambió archivos fuera de materia/: ${fuera.join(', ')}. Revisa antes de seguir.`); marcar(c.id, c.ramo, { estado: 'error', error: 'cambió archivos fuera de materia/' }); return; }
    if (!existsSync(html)) { prompt = `${prompt}\n\nEl intento anterior no dejó el archivo ${html.slice(RAIZ.length)}. Escríbelo.`; continue; }
    const v = validar(html);
    if (v.ok) {
      hechas++; desdeSubida++;
      marcar(c.id, c.ramo, { estado: 'listo', fin: new Date().toISOString(), intentos: (c.intentos || 0) + 1, validacion: v.txt.trim().split('\n')[0] });
      log(`✓ ${c.ramo}/${c.id} · ${v.txt.trim().split('\n')[0]}`);
      if (desdeSubida >= 5) { desdeSubida = 0; await subir(); }
      return;
    }
    log(`  ${c.id} no pasó la validación (ronda ${ronda}).`);
    prompt = `Lee docs/MASTER_PROMPT_MATERIA.md. La clase ${html.slice(RAIZ.length)} ya existe pero no pasa la validación. Corrige SOLO lo necesario en ese archivo (y su informe) hasta que node scripts/validar-materia.mjs ${html.slice(RAIZ.length)} --navegador diga OK. Errores:\n${v.txt}\n\nDatos de la clase: ${datos}`;
  }
  // Dos rondas sin pasar: se aparta para revisión y no se sube
  mkdirSync(join(RAIZ, 'materia/_fallidas', c.ramo), { recursive: true });
  if (existsSync(html)) renameSync(html, join(RAIZ, 'materia/_fallidas', c.ramo, c.id + '.html'));
  const meta = join(RAIZ, 'materia', c.ramo, c.id + '.meta.json'); if (existsSync(meta)) renameSync(meta, join(RAIZ, 'materia/_fallidas', c.ramo, c.id + '.meta.json'));
  marcar(c.id, c.ramo, { estado: 'error', intentos: (c.intentos || 0) + 1, error: 'no pasó la validación (ver materia/_fallidas y el registro)' });
  log(`✗ ${c.ramo}/${c.id} apartada en materia/_fallidas/`);
}

let i = 0;
const trabajador = async () => {
  while (!detenido && i < cola.length && i < LIMITE && quedaTiempo()) { const c = cola[i++]; await escribir(c); }
};
await Promise.all(Array.from({ length: Math.max(1, PARALELO) }, trabajador));
if (desdeSubida > 0) await subir();

plan = leerPlan();
const cuenta = (e) => plan.clases.filter((c) => c.estado === e).length;
const resumen = `Fin: ${hechas} clases escritas esta noche · listas ${cuenta('listo')} · pendientes ${cuenta('pendiente')} · con error ${cuenta('error')} · de ${plan.clases.length}.${detenido ? ' Se detuvo por seguridad: ver el registro.' : ''}`;
log(resumen);
writeFileSync(join(REG, 'resumen.md'), `# Materia · ${hoy}\n\n${resumen}\n\nErrores:\n${plan.clases.filter((c) => c.estado === 'error').map((c) => `- ${c.ramo}/${c.id}: ${c.error}`).join('\n') || '- ninguno'}\n`);
