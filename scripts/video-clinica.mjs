// node scripts/video-clinica.mjs [--url <sitio>] [--voz Paulina] [--salida videos/clinica-criterium-demo.mp4]
// Graba un video que explica cómo se usa Criterium Clínica (demo con pacientes ficticios): entra con la cuenta del equipo
// (CRITERIUM_ADMIN_EMAIL y CRITERIUM_ADMIN_PASSWORD en .env.local), recorre cada sección con un cursor visible y
// subtítulos, graba la pantalla (Chrome instalado + ffmpeg) y le pone la narración con una voz del sistema (`say`).
// Lo que cambia datos (mover una cita en el flujo de pacientes) se deja como estaba al terminar.
import { readFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import puppeteer from 'puppeteer-core';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const URL_SITIO = arg('--url', 'https://criterium-e5d90--creativa-5za5fsbq.web.app/');
const VOZ = arg('--voz', 'Paulina');
const SALIDA = join(RAIZ, arg('--salida', 'videos/clinica-criterium-demo.mp4'));
const TMP = join(RAIZ, 'videos/_tmp');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const env = {};
for (const f of ['.env', '.env.local']) { if (!existsSync(RAIZ + f)) continue; for (const l of readFileSync(RAIZ + f, 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim(); } }
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── Guion: cada escena tiene su narración, su subtítulo y lo que hace en pantalla ── */
const ESCENAS = [
  { id: 'intro', titulo: 'Criterium Clínica', voz: 'Esto es Criterium Clínica. Te muestro cómo se usa, sección por sección. Todos los pacientes de esta demostración son ficticios.', hacer: async (v) => { await v.portada('Criterium Clínica', 'Cómo se usa · Demostración con pacientes ficticios'); } },
  { id: 'hoy', titulo: 'Hoy', voz: 'Al entrar llegas a Hoy, el tablero del día. Arriba ves las citas, quién está en sala de espera, lo atendido, lo recaudado y lo que falta confirmar para mañana.', hacer: async (v) => { await v.quitarPortada(); await v.apuntar('main .grid > div, main [class*="grid-flow-col"] > *', 0); await v.apuntar('main [class*="grid-flow-col"] > *', 4); } },
  { id: 'flujo', titulo: 'Flujo de pacientes', voz: 'Abajo está el flujo de pacientes. Cuando alguien llega, tocas Llegó y pasa a la sala de espera, con los minutos que lleva esperando. Después, Pasar a box. Al terminar la atención, queda en Atendidos.', hacer: async (v) => { await v.desplazar(260); await v.clic('main button', 'Llegó'); await esperar(1800); await v.clic('main button', 'Pasar a box'); await esperar(1200); } },
  { id: 'alertas', titulo: 'Requiere atención', voz: 'A la derecha aparece lo que requiere atención: un trabajo de laboratorio atrasado, insumos con poco stock y controles vencidos. También tus tareas y los cumpleaños del día, con saludo por WhatsApp.', hacer: async (v) => { await v.apuntarTexto('main h2', 'Requiere atención'); await v.apuntarTexto('main button', 'trabajo de laboratorio'); await v.apuntarTexto('main h2', 'Tus tareas'); await v.desplazar(0); } },
  { id: 'agenda', titulo: 'Agenda', voz: 'En Agenda ves el día por profesional, cada uno con su color. La línea roja marca la hora actual. También puedes verla por box, o la semana completa.', hacer: async (v) => { await v.menu('Agenda'); await v.apuntar('.cl-cita', 0); await v.clic('main button', 'Por box'); await esperar(1500); await v.clic('main button', 'Semana'); await esperar(1800); await v.clic('main button', 'Día'); await v.clic('main button', 'Por profesional'); } },
  { id: 'cita', titulo: 'Detalle de la cita', voz: 'Al tocar una cita se abre su panel: la hora, el profesional, el box y el estado. Desde aquí abres la ficha o le mandas un recordatorio por WhatsApp.', hacer: async (v) => { await v.clicSel('.cl-cita', 0); await esperar(900); await v.apuntarTexto('aside[role="dialog"] button', 'Confirmada'); await v.apuntarTexto('aside[role="dialog"] a, aside[role="dialog"] button', 'Recordar'); await esperar(600); await v.clicSel('aside[role="dialog"] button[aria-label="Cerrar"]', 0); } },
  { id: 'nueva', titulo: 'Agendar una cita', voz: 'Para agendar, tocas un hueco de la agenda o el botón Nueva cita. Buscas al paciente, eliges fecha, hora, profesional, box y duración.', hacer: async (v) => { await v.clic('header button', 'Nueva cita'); await esperar(700); await v.escribir('input[aria-label="Paciente"]', 'Javi'); await esperar(500); await v.clic('.ui-modal button', 'Javiera León Bravo'); await esperar(900); await v.apuntar('.ui-modal select', 0); await v.apuntar('.ui-modal select', 2); await esperar(400); await v.clic('.ui-modal button', 'Cancelar'); } },
  { id: 'buscar', titulo: 'Buscador ⌘K', voz: 'Con comando K, o control K en Windows, buscas cualquier paciente por nombre, RUT o teléfono, desde cualquier pantalla.', hacer: async (v) => { await v.tecla('⌘ K'); await v.p.keyboard.down('Meta'); await v.p.keyboard.press('k'); await v.p.keyboard.up('Meta'); await esperar(700); await v.p.keyboard.type('tom', { delay: 140 }); await esperar(1300); await v.p.keyboard.press('Enter'); await esperar(1500); } },
  { id: 'ficha', titulo: 'Ficha del paciente', voz: 'La ficha muestra arriba lo importante: las alertas médicas, la próxima cita, la última atención y el saldo pendiente. A la izquierda están sus secciones.', hacer: async (v) => { await v.apuntarTexto('main span', 'Diabetes'); await v.apuntarTexto('main span', 'Saldo pendiente'); await v.apuntar('nav[aria-label="Secciones de la ficha"] button', 0); } },
  { id: 'odonto', titulo: 'Odontograma y plan', voz: 'En Odontograma marcas cada pieza y cada cara. En Plan de tratamiento ordenas el trabajo por fases y generas el presupuesto de lo pendiente.', hacer: async (v) => { await v.clic('nav[aria-label="Secciones de la ficha"] button', 'Odontograma'); await esperar(2200); await v.clic('nav[aria-label="Secciones de la ficha"] button', 'Plan de tratamiento'); await esperar(1800); } },
  { id: 'evol', titulo: 'Evoluciones y documentos', voz: 'Las evoluciones se firman con tu nombre y no se pueden editar ni borrar. Puedes anotar el lote de esterilización del instrumental. En Documentos emites consentimientos, recetas y certificados.', hacer: async (v) => { await v.clic('nav[aria-label="Secciones de la ficha"] button', 'Evoluciones'); await esperar(1800); await v.clic('nav[aria-label="Secciones de la ficha"] button', 'Documentos'); await esperar(900); await v.clic('main button', 'Consentimiento'); await esperar(1500); } },
  { id: 'pres', titulo: 'Presupuestos y pagos', voz: 'En Presupuestos y pagos de cada paciente ves los tratamientos, lo pagado y el saldo, y registras los abonos.', hacer: async (v) => { await v.clic('nav[aria-label="Secciones de la ficha"] button', 'Presupuestos y pagos'); await esperar(1500); } },
  { id: 'pacientes', titulo: 'Pacientes', voz: 'En Pacientes está la lista completa, con la próxima cita, el próximo control y el saldo. Los filtros te dicen a quién cobrar o a quién llamar.', hacer: async (v) => { await v.menu('Pacientes'); await v.clic('main button', 'Con saldo'); await esperar(1300); await v.clic('main button', 'Control vencido'); await esperar(1300); await v.clic('main button', 'Todos'); } },
  { id: 'seguimiento', titulo: 'Seguimiento', voz: 'Seguimiento junta las confirmaciones, los controles periódicos y la lista de espera, para que ningún paciente se pierda.', hacer: async (v) => { await v.menu('Seguimiento'); await v.clic('main button', 'Controles periódicos'); await esperar(1500); await v.clic('main button', 'Lista de espera'); await esperar(1200); } },
  { id: 'caja', titulo: 'Caja', voz: 'En Caja ves lo cobrado y lo que falta por cobrar. Haces el cierre del día con el efectivo contado, registras los gastos y calculas los honorarios de cada profesional.', hacer: async (v) => { await v.menu('Caja'); await esperar(600); await v.clic('main button', 'Cierre del día'); await esperar(1500); await v.clic('main button', 'Gastos'); await esperar(1500); await v.clic('main button', 'Honorarios'); await esperar(1300); } },
  { id: 'admin', titulo: 'Laboratorio, inventario y esterilización', voz: 'En Administración controlas los trabajos de laboratorio, el inventario con su stock mínimo y la esterilización: cada ciclo del autoclave recibe un lote, para saber qué instrumental se usó con cada paciente.', hacer: async (v) => { await v.menu('Laboratorio'); await esperar(900); await v.menu('Inventario'); await esperar(900); await v.menu('Esterilización'); await esperar(900); } },
  { id: 'informes', titulo: 'Tareas e informes', voz: 'También tienes las tareas del equipo y los informes de la semana o del mes: citas, inasistencias y producción.', hacer: async (v) => { await v.menu('Tareas'); await esperar(1200); await v.menu('Informes'); await esperar(1200); } },
  { id: 'ajustes', titulo: 'Ajustes', voz: 'En Ajustes defines los profesionales y su porcentaje, el arancel, los convenios, y quién del equipo puede ver qué.', hacer: async (v) => { await v.menu('Ajustes'); await v.clic('main button', 'Profesionales'); await esperar(1400); await v.clic('main button', 'Equipo y permisos'); await esperar(1200); await v.desplazar(500); } },
  { id: 'cierre', titulo: 'Criterium Clínica', voz: 'Agenda, ficha clínica, caja y gestión, en un solo lugar. Eso es Criterium Clínica.', hacer: async (v) => { await v.portada('Criterium Clínica', 'Agenda · Ficha clínica · Caja · Gestión'); } }
];

/* ── Ayudas dentro de la página: cursor, subtítulo, tecla y portada ── */
const AYUDAS = () => {
  if (window.__v) return;
  const css = document.createElement('style');
  css.textContent = `
    #v-cursor{position:fixed;left:50%;top:50%;z-index:2147483646;width:26px;height:26px;pointer-events:none;transition:left .75s cubic-bezier(.4,0,.2,1),top .75s cubic-bezier(.4,0,.2,1);filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))}
    #v-cursor.toca::after{content:'';position:absolute;left:-14px;top:-14px;width:30px;height:30px;border-radius:50%;background:rgba(92,207,192,.55);animation:v-toca .5s ease-out forwards}
    @keyframes v-toca{from{transform:scale(.3);opacity:1}to{transform:scale(1.8);opacity:0}}
    #v-sub{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483645;max-width:1080px;width:calc(100% - 120px);background:rgba(15,37,48,.94);color:#fff;border-radius:16px;padding:14px 22px 16px;font:500 21px/1.4 -apple-system,BlinkMacSystemFont,Inter,sans-serif;box-shadow:0 12px 40px rgba(15,37,48,.3);transition:opacity .3s}
    #v-sub b{display:block;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:#5CCFC0;margin-bottom:4px}
    #v-tecla{position:fixed;left:50%;top:40%;transform:translate(-50%,-50%);z-index:2147483646;background:#0F2530;color:#fff;font:700 44px -apple-system,Inter,sans-serif;padding:18px 34px;border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,.35);opacity:0;transition:opacity .25s}
    #v-portada{position:fixed;inset:0;z-index:2147483644;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:radial-gradient(60% 50% at 50% 40%,#1B3949,#0F2530);color:#fff;transition:opacity .6s;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif}
    #v-portada h1{margin:0;font-size:68px;font-weight:800;letter-spacing:-.03em}#v-portada h1 span{color:#5CCFC0}
    #v-portada p{margin:0;font-size:24px;color:#C6D5DB}`;
  document.head.appendChild(css);
  const c = document.createElement('div'); c.id = 'v-cursor';
  c.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2.5 19.5 12l-6.6 1.6-3.4 6.4z" fill="#fff" stroke="#0F2530" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  document.body.appendChild(c);
  const s = document.createElement('div'); s.id = 'v-sub'; s.style.opacity = '0'; document.body.appendChild(s);
  const k = document.createElement('div'); k.id = 'v-tecla'; document.body.appendChild(k);
  window.__v = {
    sub(t, x) { s.innerHTML = `<b>${t}</b>${x}`; s.style.opacity = '1'; },
    cursor(x, y) { c.style.left = x + 'px'; c.style.top = y + 'px'; },
    toca() { c.classList.remove('toca'); void c.offsetWidth; c.classList.add('toca'); },
    tecla(t) { k.textContent = t; k.style.opacity = '1'; setTimeout(() => { k.style.opacity = '0'; }, 1400); },
    portada(t, x) { let d = document.getElementById('v-portada'); if (!d) { d = document.createElement('div'); d.id = 'v-portada'; document.body.appendChild(d); } d.innerHTML = `<svg width="110" height="110" viewBox="61 60 317 317"><path d="M101 60H338A40 40 0 0 1 378 100V337A40 40 0 0 1 338 377H101A40 40 0 0 1 61 337V100A40 40 0 0 1 101 60Z" fill="#1B3949" stroke="#5CCFC0" stroke-width="6"/><path d="M301.1 151.1A115 115 0 1 0 270.5 324.6L250.0 289.1A74 74 0 1 1 269.7 177.4Z" fill="#fff"/><path d="M266.1 327.0A115 115 0 0 0 323.2 258L279.2 258A74 74 0 0 1 247.2 290.6Z" fill="#5CCFC0"/><path d="M210 194C222 184 252 182 254 212C256 232 246 244 242 264C238 282 234 292 228 292C220 292 219 268 210 252C201 268 200 292 192 292C186 292 182 282 178 264C174 244 164 232 166 212C168 182 198 184 210 194Z" fill="#fff"/></svg><h1>${t.replace('Clínica', '<span>Clínica</span>')}</h1><p>${x}</p>`; d.style.opacity = '1'; s.style.opacity = '0'; },
    quitarPortada() { const d = document.getElementById('v-portada'); if (d) { d.style.opacity = '0'; setTimeout(() => d.remove(), 650); } }
  };
};

async function main() {
  mkdirSync(TMP, { recursive: true }); mkdirSync(dirname(SALIDA), { recursive: true });
  // 1. Narración de cada escena
  for (const e of ESCENAS) {
    const aiff = join(TMP, e.id + '.aiff');
    execFileSync('say', ['-v', VOZ, '-r', '178', '-o', aiff, e.voz]);
    e.dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', aiff]).toString());
  }
  console.log('· narración:', ESCENAS.reduce((s, e) => s + e.dur, 0).toFixed(1), 's');

  // 2. Entrar y llegar a la Clínica (sin grabar)
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1.2 });
  await p.goto(URL_SITIO, { waitUntil: 'networkidle2' }); await esperar(2500);
  await p.evaluate(() => { const el = [...document.querySelectorAll('button,a')].find((x) => x.textContent.trim() === 'Entrar'); el && el.click(); }); await esperar(1200);
  await p.type('input[type=email]', env.CRITERIUM_ADMIN_EMAIL); await p.type('input[type=password]', env.CRITERIUM_ADMIN_PASSWORD); await p.keyboard.press('Enter'); await esperar(7000);
  await p.evaluate(() => { const el = [...document.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === 'Cambiar a Clínica'); el && el.click(); }); await esperar(4500);
  await p.evaluate(AYUDAS);
  // La cita que se mueve en el flujo de pacientes, para dejarla como estaba
  const movida = await p.evaluate(() => { const art = document.querySelector('main article'); if (!art) return null; return { hora: art.querySelector('b')?.textContent, nombre: art.querySelector('button')?.textContent, estado: art.textContent.includes('Confirmada') ? 'Confirmada' : 'Agendada' }; });

  const v = {
    p,
    async buscar(sel, texto, i = 0) {
      return p.evaluate((sel, texto, i) => {
        const l = [...document.querySelectorAll(sel)].filter((x) => x.offsetParent !== null && (!texto || x.textContent.trim().replace(/\s*\d+$/, '').startsWith(texto) || x.textContent.includes(texto)));
        const el = l[i]; if (!el) return null;
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        const r = el.getBoundingClientRect(); window.__vt = el; return { x: r.left + Math.min(r.width / 2, 120), y: r.top + r.height / 2 };
      }, sel, texto || '', i);
    },
    async mover(pos) { if (!pos) return; await p.evaluate((x, y) => window.__v.cursor(x, y), pos.x, pos.y); await esperar(850); },
    async apuntar(sel, i = 0) { await this.mover(await this.buscar(sel, '', i)); await esperar(500); },
    async apuntarTexto(sel, t) { await this.mover(await this.buscar(sel, t)); await esperar(600); },
    async clic(sel, t) { const pos = await this.buscar(sel, t); if (!pos) { console.log('  (no encontré «' + t + '»)'); return; } await this.mover(pos); await p.evaluate(() => { window.__v.toca(); window.__vt.click(); }); await esperar(900); },
    async clicSel(sel, i) { const pos = await this.buscar(sel, '', i); if (!pos) return; await this.mover(pos); await p.evaluate(() => { window.__v.toca(); window.__vt.click(); }); await esperar(900); },
    async menu(t) { const pos = await p.evaluate((t) => { const el = [...document.querySelectorAll('aside[aria-label="Clínica"] button')].find((x) => x.textContent.trim().replace(/\d+$/, '') === t); if (!el) return null; window.__vt = el; const r = el.getBoundingClientRect(); return { x: r.left + 40, y: r.top + r.height / 2 }; }, t); if (!pos) return; await this.mover(pos); await p.evaluate(() => { window.__v.toca(); window.__vt.click(); }); await esperar(1600); await p.evaluate(() => window.scrollTo(0, 0)); },
    async escribir(sel, t) { const pos = await this.buscar(sel); await this.mover(pos); await p.click(sel); await p.keyboard.type(t, { delay: 120 }); },
    async desplazar(y) { await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), y); await esperar(900); },
    async tecla(t) { await p.evaluate((t) => window.__v.tecla(t), t); },
    async portada(t, x) { await p.evaluate((t, x) => window.__v.portada(t, x), t, x); },
    async quitarPortada() { await p.evaluate(() => window.__v.quitarPortada()); await esperar(700); }
  };

  // 3. Grabar: cada cuadro con su hora exacta (el screencast de Puppeteer supone 25 cuadros por segundo y desfasa la voz)
  const CUADROS = join(TMP, 'cuadros-grab');
  if (existsSync(CUADROS)) rmSync(CUADROS, { recursive: true });
  mkdirSync(CUADROS, { recursive: true });
  const cdp = await p.createCDPSession();
  const cuadros = []; const escrituras = [];
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    const f = join(CUADROS, String(cuadros.length).padStart(6, '0') + '.jpg');
    cuadros.push({ f, ts: metadata.timestamp });
    escrituras.push(import('node:fs/promises').then((fs) => fs.writeFile(f, Buffer.from(data, 'base64'))));
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  await esperar(400);
  await p.evaluate(() => { const d = document.createElement('i'); d.id = 'v-latido'; d.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:.01;pointer-events:none'; document.body.appendChild(d); setInterval(() => { d.style.opacity = d.style.opacity === '0.01' ? '0.02' : '0.01'; }, 500); });
  const t0 = Date.now();
  for (const e of ESCENAS) {
    e.inicio = (Date.now() - t0) / 1000;
    if (!['intro', 'cierre'].includes(e.id)) await p.evaluate((t, x) => window.__v.sub(t, x), e.titulo, e.voz);
    const t = Date.now();
    try { await e.hacer(v); } catch (err) { console.log('  escena', e.id, 'con problema:', err.message); }
    const resto = e.dur * 1000 + 700 - (Date.now() - t);
    if (resto > 0) await esperar(resto);
    console.log('· escena', e.id, e.inicio.toFixed(1) + ' s');
  }
  await esperar(1500);
  const tFin = Date.now();
  await cdp.send('Page.stopScreencast');
  await Promise.all(escrituras);
  const total = (tFin - t0) / 1000;
  // Lista de cuadros con su duración real, desde t0 hasta el final
  const base = t0 / 1000;
  const utiles = cuadros.filter((c) => c.ts <= tFin / 1000);
  const lista = utiles.map((c, i) => { const ini = Math.max(c.ts, base), fin = i + 1 < utiles.length ? Math.max(utiles[i + 1].ts, base) : tFin / 1000; return { f: c.f, d: Math.max(0, fin - ini) }; }).filter((c) => c.d > 0);
  const previos = cuadros.filter((c) => c.ts < base);
  if (previos.length && lista.length) lista[0] = { f: previos[previos.length - 1].f, d: lista[0].d }; // lo que se veía al empezar
  const txt = lista.map((c) => `file '${c.f}'\nduration ${c.d.toFixed(4)}`).join('\n') + `\nfile '${lista[lista.length - 1].f}'\n`;
  const { writeFileSync } = await import('node:fs');
  writeFileSync(join(TMP, 'cuadros.txt'), txt);
  console.log('· cuadros:', lista.length);

  // 4. Dejar la cita del flujo como estaba (fuera del video)
  if (movida && movida.nombre) {
    await p.evaluate(() => window.__v.quitarPortada());
    await v.menu('Agenda'); await esperar(1500);
    const ok = await p.evaluate((m) => { const el = [...document.querySelectorAll('.cl-cita')].find((x) => x.textContent.includes(m.nombre)); if (!el) return false; el.click(); return true; }, movida);
    if (ok) { await esperar(1000); await p.evaluate((est) => { const b = [...document.querySelectorAll('aside[role="dialog"] button')].find((x) => x.textContent.trim() === est); b && b.click(); }, movida.estado); await esperar(1500); console.log('· cita de', movida.nombre, 'devuelta a', movida.estado); }
  }
  await b.close();

  // 5. Unir pantalla y narración
  const ins = ['-y', '-f', 'concat', '-safe', '0', '-i', join(TMP, 'cuadros.txt')]; const filtros = [];
  ESCENAS.forEach((e, k) => { ins.push('-i', join(TMP, e.id + '.aiff')); filtros.push(`[${k + 1}:a]aresample=44100,adelay=${Math.round((e.inicio + 0.35) * 1000)}|${Math.round((e.inicio + 0.35) * 1000)}[a${k}]`); });
  const mezcla = filtros.join(';') + ';' + ESCENAS.map((_, k) => `[a${k}]`).join('') + `amix=inputs=${ESCENAS.length}:normalize=0,apad[aout];[0:v]scale=1920:1080:flags=lanczos,fps=30,format=yuv420p[vout]`;
  execFileSync('ffmpeg', [...ins, '-filter_complex', mezcla, '-map', '[vout]', '-map', '[aout]', '-t', total.toFixed(2), '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', SALIDA], { stdio: 'ignore' });
  rmSync(CUADROS, { recursive: true, force: true });
  console.log('· video listo:', SALIDA, `(${total.toFixed(0)} s)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
