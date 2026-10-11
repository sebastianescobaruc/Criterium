// Capturas reales de la app para la portada pública (src/portada/). Entra con la cuenta del equipo
// (CRITERIUM_ADMIN_EMAIL y CRITERIUM_ADMIN_PASSWORD en .env.local) a la clínica de demostración, con datos ficticios,
// y guarda cada pantalla en public/portada/<nombre>-1x.webp y -2x.webp. Solo navega: no cambia datos.
// Uso: npm run build:creativa && npx vite preview --outDir dist-creativa --port 4182 &  →  npm run capturas:portada [-- --url http://…]
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const URL_SITIO = arg('--url', 'http://localhost:4182/');
const SALIDA = RAIZ + 'public/portada/';
const env = {};
for (const f of ['.env', '.env.local']) { if (!existsSync(RAIZ + f)) continue; for (const l of readFileSync(RAIZ + f, 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim(); } }
if (!env.CRITERIUM_ADMIN_EMAIL || !env.CRITERIUM_ADMIN_PASSWORD) { console.error('Faltan CRITERIUM_ADMIN_EMAIL y CRITERIUM_ADMIN_PASSWORD en .env.local'); process.exit(1); }
mkdirSync(SALIDA, { recursive: true });

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });

// Toca el primer botón o enlace visible cuyo texto (o aria-label) empieza con t
async function tocar(p, t, sel = 'button,a,[role=tab]') {
  const ok = await p.evaluate((t, sel) => {
    const el = [...document.querySelectorAll(sel)].find((x) => x.offsetParent !== null && ((x.getAttribute('aria-label') || '').startsWith(t) || x.textContent.trim().replace(/\s*\d+$/, '').startsWith(t)));
    if (el) { el.scrollIntoView({ block: 'center' }); el.click(); }
    return !!el;
  }, t, sel);
  if (!ok) console.log(`  (no encontré «${t}»)`);
  return ok;
}
// La portada no muestra a nadie del equipo: el profesional que es la cuenta del equipo pasa a ser uno ficticio, solo en la captura
async function anonimizar(p) {
  await p.evaluate(() => {
    const CAMBIOS = [[/Sebasti[aá]n Felipe Escobar Prieto/g, 'Dr. Tomás Fuentes (ficticio)'], [/Sebasti[aá]n Escobar Prieto/g, 'Dr. Tomás Fuentes (ficticio)'], [/,\s*Sebasti[aá]n\b/g, ''], [/Sebasti[aá]n/g, 'Tomás']];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { let t = n.nodeValue; for (const [re, x] of CAMBIOS) t = t.replace(re, x); if (/^\s*S[FE]\s*$/.test(t)) t = t.replace(/S[FE]/, 'TF'); if (t !== n.nodeValue) n.nodeValue = t; }
  });
}
// Guarda la pantalla en las dos densidades (el navegador elige con srcset)
async function guardar(p, nombre, { w, h }) {
  await p.evaluate(() => window.scrollTo(0, 0));
  for (const [dpr, suf] of [[1, '1x'], [2, '2x']]) {
    await p.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: w < 600, hasTouch: w < 600 });
    await esperar(800);
    await anonimizar(p);
    await p.screenshot({ path: `${SALIDA}${nombre}-${suf}.webp`, type: 'webp', quality: dpr === 2 ? 70 : 80 });
  }
  console.log('✓', nombre);
}
// Elige en el primer <select> visible la opción cuyo texto contiene t
async function elegir(p, t) {
  const h = await p.evaluateHandle((t) => [...document.querySelectorAll('select')].find((s) => s.offsetParent && [...s.options].some((o) => o.textContent.includes(t))), t);
  const el = h.asElement(); if (!el) { console.log(`  (no encontré la opción «${t}»)`); return false; }
  const v = await el.evaluate((s, t) => [...s.options].find((o) => o.textContent.includes(t)).value, t);
  await el.select(v); return true;
}

const ESC = { w: 1440, h: 900 };
const CEL = { w: 390, h: 844 };
const p = await b.newPage();
await p.setViewport({ width: ESC.w, height: ESC.h, deviceScaleFactor: 1 });
await p.goto(URL_SITIO, { waitUntil: 'networkidle2' }); await esperar(2000);
await tocar(p, 'Entrar'); await esperar(2500);
await p.waitForSelector('input[type=email]', { timeout: 20000 });
await p.type('input[type=email]', env.CRITERIUM_ADMIN_EMAIL); await p.type('input[type=password]', env.CRITERIUM_ADMIN_PASSWORD); await p.keyboard.press('Enter');
await esperar(8000);
await tocar(p, 'Completar después'); await esperar(600);

// Clínica (demo con datos ficticios). Agenda en vista semanal: la demo tiene citas de lunes a sábado.
await tocar(p, 'Cambiar a Clínica'); await esperar(5000);
await tocar(p, 'Agenda', 'aside button'); await esperar(2500);
await tocar(p, 'Semana'); await esperar(2500);
await guardar(p, 'clinica-agenda', ESC);
await tocar(p, 'Caja', 'aside button'); await esperar(3000);
await guardar(p, 'clinica-caja', ESC);
await tocar(p, 'Pacientes', 'aside button'); await esperar(2500);
await p.evaluate(() => { const f = [...document.querySelectorAll('main tbody tr, main [role=row], main button')].find((x) => x.offsetParent && /\d+ años/.test(x.textContent)); f && f.click(); }); await esperar(3000);
await tocar(p, 'Odontograma'); await esperar(2000);
await guardar(p, 'clinica-ficha', ESC);
await tocar(p, 'Evoluciones'); await esperar(1500);
if (await tocar(p, 'Evolución con guía')) {
  await esperar(2000);
  // Guía de la resina y el primer lote de esterilización: así se ve la cadena guía → evolución → lote
  await p.evaluate(() => { const s = document.querySelector('#ep-p'); return s && [...s.options].map((o) => o.value); }).then(async (ops) => { if (ops && ops.includes('resina-clase-i')) await p.select('#ep-p', 'resina-clase-i'); else if (ops && ops[1]) await p.select('#ep-p', ops[1]); });
  await esperar(1500);
  await p.evaluate(() => { const s = document.querySelector('#ep-l'); return s && [...s.options].map((o) => o.value); }).then(async (ops) => { if (ops && ops[1]) await p.select('#ep-l', ops[1]); });
  await esperar(1500);
  await guardar(p, 'clinica-evolucion', ESC);
}

// Celular: agenda de la clínica (lunes, con citas) y un paso de un procedimiento en modo guiado
await p.setViewport({ width: CEL.w, height: CEL.h, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await p.goto(URL_SITIO, { waitUntil: 'networkidle2' }); await esperar(6000);
await tocar(p, 'Clínica'); await esperar(4000);
await tocar(p, 'Agenda'); await esperar(2500);
await tocar(p, 'Siguiente'); await esperar(2000);
await guardar(p, 'clinica-agenda-celular', CEL);
await p.goto(URL_SITIO, { waitUntil: 'networkidle2' }); await esperar(6000);
await tocar(p, 'Procedimientos'); await esperar(3000);
await p.evaluate(() => { const c = [...document.querySelectorAll('main *')].filter((x) => x.offsetParent && /Resina/i.test(x.textContent) && x.querySelector && [...x.querySelectorAll('button,a')].some((y) => y.textContent.trim() === 'Abrir')).pop(); const a = c && [...c.querySelectorAll('button,a')].find((y) => y.textContent.trim() === 'Abrir'); a && a.click(); }); await esperar(3500);
await tocar(p, 'Empezar'); await esperar(2000);
await tocar(p, 'Terminé'); await esperar(1500);
await tocar(p, 'Terminé'); await esperar(2500);
await guardar(p, 'universidad-paso-celular', CEL);

// Universidad en escritorio: una clase de Materia y las calculadoras
await p.setViewport({ width: ESC.w, height: ESC.h, deviceScaleFactor: 1 });
await p.goto(URL_SITIO, { waitUntil: 'networkidle2' }); await esperar(6000);
await tocar(p, 'Materia', 'aside button'); await esperar(3500);
await p.evaluate(() => { const b = [...document.querySelectorAll('main button')].find((x) => x.textContent.includes('Oclusión')); b && b.click(); }); await esperar(5000);
await guardar(p, 'universidad-materia', ESC);
await tocar(p, 'Herramientas', 'aside button'); await esperar(3000);
await guardar(p, 'universidad-herramientas', ESC);

await b.close();
