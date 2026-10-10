// Motor de los videos de Criterium (scripts/video-clinica.mjs, scripts/video-criterium.mjs): entra con la cuenta del
// equipo (CRITERIUM_ADMIN_EMAIL y CRITERIUM_ADMIN_PASSWORD en .env.local), recorre las escenas con un cursor visible y
// subtítulos, graba cada cuadro con su hora exacta (CDP) y mezcla la narración (`say`). Requiere Chrome y ffmpeg.
import { readFileSync, mkdirSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import puppeteer from 'puppeteer-core';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
export const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const env = {};
for (const f of ['.env', '.env.local']) { if (!existsSync(RAIZ + f)) continue; for (const l of readFileSync(RAIZ + f, 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim(); } }

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

// escenas: [{ id, titulo, voz, hacer(v) }]; area: 'clinica' | 'universidad' (dónde empieza); antes/despues(p, v): sin grabar
export async function grabarVideo({ escenas: ESCENAS, salida, area = 'clinica', antes, despues }) {
  const URL_SITIO = arg('--url', 'https://criterium-e5d90--creativa-5za5fsbq.web.app/');
  const VOZ = arg('--voz', 'Paulina');
  const SALIDA = join(RAIZ, arg('--salida', salida));
  const TMP = join(RAIZ, 'videos/_tmp');
  mkdirSync(TMP, { recursive: true }); mkdirSync(dirname(SALIDA), { recursive: true });
  // 1. Narración de cada escena
  for (const e of ESCENAS) {
    const aiff = join(TMP, e.id + '.aiff');
    execFileSync('say', ['-v', VOZ, '-r', '178', '-o', aiff, e.voz]);
    e.dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', aiff]).toString());
  }
  console.log('· narración:', ESCENAS.reduce((s, e) => s + e.dur, 0).toFixed(1), 's');

  // 2. Entrar (sin grabar)
  // Micrófono de prueba en silencio (el de Chrome emite un pitido que el reconocimiento toma como órdenes)
  const silencio = join(TMP, 'silencio.wav');
  if (!existsSync(silencio)) execFileSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', '30', silencio], { stdio: 'ignore' });
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + silencio, '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage();
  // Sin pantalla completa al grabar (cambia el tamaño de la página y recorta la imagen): la app sigue como en el iPhone
  await p.evaluateOnNewDocument(() => { try { Element.prototype.requestFullscreen = undefined; Element.prototype.webkitRequestFullscreen = undefined; } catch (e) {} });
  await p.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1.2 });
  await p.goto(URL_SITIO, { waitUntil: 'networkidle2' }); await esperar(2500);
  await p.evaluate(() => { const el = [...document.querySelectorAll('button,a')].find((x) => x.textContent.trim() === 'Entrar'); el && el.click(); }); await esperar(1200);
  await p.type('input[type=email]', env.CRITERIUM_ADMIN_EMAIL); await p.type('input[type=password]', env.CRITERIUM_ADMIN_PASSWORD); await p.keyboard.press('Enter'); await esperar(7000);
  await p.evaluate(() => { const el = [...document.querySelectorAll('button,a')].find((x) => x.textContent.trim() === 'Completar después'); el && el.click(); }); await esperar(500);
  if (area === 'clinica') { await p.evaluate(() => { const el = [...document.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === 'Cambiar a Clínica'); el && el.click(); }); await esperar(4500); }
  await p.evaluate(AYUDAS);

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
    async quitarPortada() { await p.evaluate(() => window.__v.quitarPortada()); await esperar(700); },
    // Un botón dentro de la clase de Materia (iframe): baja hasta él dentro de la clase, mueve el cursor y lo toca
    async clicIframe(texto) {
      const h = await p.$('main iframe'); const fr = h && await h.contentFrame(); if (!fr) { console.log('  (no hay clase abierta)'); return; }
      const hay = await fr.evaluate((t) => { const el = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith(t)); if (!el) return false; window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 160, behavior: 'smooth' }); return true; }, texto);
      if (!hay) { console.log('  (no encontré «' + texto + '» en la clase)'); return; }
      await esperar(800);
      const pos = await fr.evaluate((t) => { const r = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith(t)).getBoundingClientRect(); return { x: r.left + Math.min(r.width / 2, 90), y: r.top + r.height / 2 }; }, texto);
      const caja = await h.boundingBox();
      await this.mover({ x: caja.x + pos.x, y: caja.y + pos.y });
      await p.evaluate(() => window.__v.toca());
      await fr.evaluate((t) => { [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith(t)).click(); }, texto);
      await esperar(1100);
    },
    // El botón (por su texto) de la tarjeta que contiene un título
    async clicEn(titulo, boton) {
      const pos = await p.evaluate((titulo, boton) => {
        const tit = [...document.querySelectorAll('main *')].filter((x) => x.children.length === 0 && x.textContent.includes(titulo))[0]; if (!tit) return null;
        let n = tit; while (n && n !== document.body) { const bt = [...n.querySelectorAll('button,a')].find((x) => x.textContent.trim() === boton); if (bt) { bt.scrollIntoView({ block: 'center' }); window.__vt = bt; const r = bt.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; } n = n.parentElement; }
        return null;
      }, titulo, boton);
      if (!pos) { console.log('  (no encontré «' + boton + '» de «' + titulo + '»)'); return; }
      await this.mover(pos); await p.evaluate(() => { window.__v.toca(); window.__vt.click(); }); await esperar(1000);
    },
    // Barra lateral de Universidad (íconos con aria-label); al acercar el cursor se despliega con los nombres
    async rail(t) { const pos = await p.evaluate((t) => { const el = [...document.querySelectorAll('aside button')].find((x) => x.offsetParent && (x.getAttribute('aria-label') === t || x.textContent.trim() === t || x.textContent.trim().endsWith(t))); if (!el) return null; window.__vt = el; const r = el.getBoundingClientRect(); return { x: r.left + 34, y: r.top + r.height / 2 }; }, t); if (!pos) { console.log('  (no encontré «' + t + '» en la barra)'); return; } await p.mouse.move(pos.x, pos.y); await this.mover(pos); await p.evaluate(() => { window.__v.toca(); window.__vt.click(); }); await esperar(700); await p.mouse.move(1500, 450); await esperar(900); await p.evaluate(() => window.scrollTo(0, 0)); }
  };
  const estado = antes ? await antes(p, v) : null;

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
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
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
  writeFileSync(join(TMP, 'cuadros.txt'), txt);
  console.log('· cuadros:', lista.length);

  // 4. Lo que haya que dejar como estaba (fuera del video)
  if (despues) await despues(p, v, estado);
  await b.close();

  // 5. Unir pantalla y narración
  const ins = ['-y', '-f', 'concat', '-safe', '0', '-i', join(TMP, 'cuadros.txt')]; const filtros = [];
  ESCENAS.forEach((e, k) => { ins.push('-i', join(TMP, e.id + '.aiff')); filtros.push(`[${k + 1}:a]aresample=44100,adelay=${Math.round((e.inicio + 0.35) * 1000)}|${Math.round((e.inicio + 0.35) * 1000)}[a${k}]`); });
  const mezcla = filtros.join(';') + ';' + ESCENAS.map((_, k) => `[a${k}]`).join('') + `amix=inputs=${ESCENAS.length}:normalize=0,apad[aout];[0:v]scale=1920:1080:flags=lanczos,fps=30,format=yuv420p[vout]`;
  execFileSync('ffmpeg', [...ins, '-filter_complex', mezcla, '-map', '[vout]', '-map', '[aout]', '-t', total.toFixed(2), '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', SALIDA], { stdio: 'ignore' });
  rmSync(CUADROS, { recursive: true, force: true });
  console.log('· video listo:', SALIDA, `(${total.toFixed(0)} s)`);
}
