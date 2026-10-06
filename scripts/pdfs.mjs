// Genera el PDF de box de cada protocolo desde src/data.js.
// El PDF de box es para ojear durante la atención: una hoja (dos como máximo) con los pasos, el instrumental
// y lo que no te puedes saltar. Las fuentes y el detalle quedan en Criterium: el PDF trae un QR y el enlace al protocolo.
// Uso: npm run pdfs            (todos)
//      npm run pdfs -- resina-clase-i destartraje   (solo esos)
// Usa el Chrome instalado. Si no está en la ruta de macOS, define CHROME_PATH.
// El enlace apunta a CRITERIUM_URL (por defecto el sitio publicado).
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import QRCode from 'qrcode';
import { DATOS, PROTOS } from '../src/data.js';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = (process.env.CRITERIUM_URL || 'https://criterium-e5d90.web.app').replace(/\/$/, '');
const MAX_PAGINAS = 2;

// Lo que se anota a mano en el box. Sin nombre de paciente ni número de ficha (Ley 21.719).
const CAMPOS = {
  'cementado-pmma': ['Pieza', 'Material y lote del bloque', 'Cemento de resina y lote', 'Fecha de recambio'],
  'resina-clase-i': ['Pieza', 'Profundidad de la lesión', 'Color', 'Adhesivo y modo'],
  'exodoncia-18': ['Pieza (1.8 / 2.8)', 'Indicación', 'Tubos de anestesia', 'Comunicación al seno (mm)'],
  'pulpectomia-premolar': ['Pieza (1.4 / 2.4)', 'Dx pulpar', 'LAD · 2/3 LAD', 'LRD V / P', 'LT V / P', 'Lima inicial V / P', 'Lima maestra V / P'],
  'sellantes-ninos': ['Piezas', 'Material (resina / ionómero)', 'Aislamiento', 'Próximo control'],
  'destartraje': ['Cuadrante', 'Estadio y grado', 'Índice de placa', 'Fecha de reevaluación']
};

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const nn = (i) => String(i + 1).padStart(2, '0');
const critico = (s) => /crítico|suele faltar/i.test(s.marca || '');

function html(id, d, qr, enlace) {
  const p = PROTOS.find((x) => x.id === id) || {};
  const version = (d.tags || []).find((t) => /^v\d/.test(t)) || '';
  const campos = d.campos || CAMPOS[id] || ['Pieza']; // los borradores nuevos traen sus campos en data.js
  const noSaltar = d.pasos.map((s, i) => ({ s, i })).filter(({ s }) => critico(s));
  const disputa = d.pasos.map((s, i) => ({ s, i })).filter(({ s }) => s.marca === 'en disputa');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(d.titulo)}</title><style>
  @page { size: A4; margin: 9mm 10mm 10mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #132630; font-size: 8.4pt; line-height: 1.32; margin: 0; }
  .cab { display: grid; grid-template-columns: 1fr auto; gap: 10pt; align-items: start; padding-bottom: 6pt; border-bottom: 2pt solid #0F2530; }
  .rot { font-size: 6.6pt; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: #2F7F8A; }
  h1 { margin: 2pt 0 0; font-size: 15pt; line-height: 1.12; letter-spacing: -.02em; color: #0F2530; }
  .sub { margin-top: 2pt; color: #5C727D; font-size: 7.6pt; }
  .qr { display: flex; gap: 6pt; align-items: center; text-align: right; }
  .qr svg { width: 19mm; height: 19mm; }
  .qr small { display: block; font-size: 6.6pt; color: #5C727D; max-width: 34mm; line-height: 1.3; }
  .qr b { display: block; font-size: 7pt; color: #2F6A78; word-break: break-all; }
  .campos { display: grid; grid-template-columns: repeat(${Math.min(campos.length, 4)}, 1fr); margin: 6pt 0 7pt; border: .7pt solid #CFDDE2; border-radius: 4pt; overflow: hidden; }
  .campos div { padding: 2.5pt 5pt 10pt; font-size: 6pt; letter-spacing: .08em; text-transform: uppercase; color: #6B7E86; border-right: .7pt solid #CFDDE2; border-bottom: .7pt solid #CFDDE2; }
  .cuerpo { display: grid; grid-template-columns: 1.65fr 1fr; gap: 11pt; }
  h2 { margin: 0 0 4pt; font-size: 7pt; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: #0F2530; }
  ol.pasos { list-style: none; margin: 0; padding: 0; }
  ol.pasos li { display: grid; grid-template-columns: 15pt 8pt 1fr; gap: 3pt; padding: 3.2pt 0; border-bottom: .5pt solid #E3ECEF; break-inside: avoid; }
  .n { font-weight: 800; color: #2F6A78; font-size: 9pt; line-height: 1.15; }
  .caja { width: 7pt; height: 7pt; border: .9pt solid #2F6A78; border-radius: 1.5pt; margin-top: 2pt; }
  .t { font-weight: 700; color: #0F2530; }
  .tag { display: inline-block; margin-left: 3pt; padding: 0 4pt; border-radius: 6pt; font-size: 6.2pt; font-weight: 700; vertical-align: 1pt; background: #F7EEDC; color: #8A6326; }
  .tag.crit { background: #F7E4E2; color: #A24A48; }
  .h { color: #33454C; }
  .c { color: #6B7E86; font-style: italic; }
  .lado > div { margin-bottom: 8pt; }
  .fase { break-inside: avoid; margin-bottom: 4pt; }
  .fase b { display: block; font-size: 6.6pt; letter-spacing: .1em; text-transform: uppercase; color: #2F6A78; margin-bottom: 1pt; }
  .it { display: grid; grid-template-columns: 8pt 1fr; gap: 2pt; font-size: 7.6pt; line-height: 1.28; }
  .it .caja { width: 6pt; height: 6pt; margin-top: 1.6pt; }
  .alerta { background: #F7E4E2; border-radius: 4pt; padding: 5pt 6pt; }
  .alerta h2 { color: #A24A48; }
  .alerta p, .disenso p { margin: 0 0 2pt; font-size: 7.6pt; }
  .disenso { background: #F7EEDC; border-radius: 4pt; padding: 5pt 6pt; }
  .disenso h2 { color: #8A6326; }
  .pie { margin-top: 7pt; padding-top: 4pt; border-top: .7pt solid #CFDDE2; display: flex; justify-content: space-between; gap: 8pt; font-size: 6.6pt; color: #6B7E86; }
  </style></head><body>
  <div class="cab">
    <div>
      <div class="rot">Criterium · ${esc(d.esp)} · protocolo de box</div>
      <h1>${esc(p.t || d.titulo)}</h1>
      <div class="sub">${esc(version)} · borrador sin revisión de especialista · ${new Date().toISOString().slice(0, 10)}</div>
    </div>
    <div class="qr"><div><small>Fuentes, el porqué de cada paso y la versión vigente</small><b>${esc(enlace.replace(/^https?:\/\//, ''))}</b></div>${qr}</div>
  </div>
  <div class="campos">${campos.map((c) => `<div>${esc(c)}</div>`).join('')}</div>
  <div class="cuerpo">
    <div>
      <h2>Paso a paso</h2>
      <ol class="pasos">${d.pasos.map((s, i) => `<li><span class="n">${nn(i)}</span><span class="caja"></span><span>
        <span class="t">${esc(s.corto)}</span>${s.marca && s.marca !== '✓' && !/sin evidencia/.test(s.marca) ? `<span class="tag${critico(s) ? ' crit' : ''}">${esc(s.marca)}</span>` : ''}<br>
        <span class="h">${esc(s.hacer)}</span>${s.cond ? ` <span class="c">${esc(s.cond)}</span>` : ''}</span></li>`).join('')}</ol>
    </div>
    <div class="lado">
      ${noSaltar.length ? `<div class="alerta"><h2>No te lo saltes</h2>${noSaltar.map(({ s, i }) => `<p><b>${nn(i)}</b> ${esc(s.listo)}</p>`).join('')}</div>` : ''}
      <div>
        <h2>Instrumental</h2>
        ${d.bandeja.map((b) => `<div class="fase"><b>${esc(b.fase)}</b>${b.items.map((x) => `<div class="it"><span class="caja"></span><span>${esc(x)}</span></div>`).join('')}</div>`).join('')}
      </div>
      ${disputa.length ? `<div class="disenso"><h2>En disputa</h2>${disputa.map(({ s, i }) => `<p><b>${nn(i)}</b> ${esc(s.disputa || s.corto)}</p>`).join('')}</div>` : ''}
    </div>
  </div>
  <div class="pie"><span>${esc(d.bandera)}. Apoyo para el box: no reemplaza la indicación de tu docente.</span><span>Criterium</span></div>
  </body></html>`;
}

// Páginas: se mide el alto del contenido con el ancho imprimible de A4 (190 mm) contra el alto imprimible (278 mm)
const MM = 96 / 25.4;

const pedidos = process.argv.slice(2);
const ids = Object.keys(DATOS).filter((id) => DATOS[id].pdf && (!pedidos.length || pedidos.includes(id)));
if (!ids.length) { console.log('No hay protocolos para generar.'); process.exit(0); }
const nav = await puppeteer.launch({ executablePath: CHROME, headless: true });
let error = false;
try {
  const pag = await nav.newPage();
  for (const id of ids) {
    const d = DATOS[id];
    const enlace = BASE + '/#proto/' + id;
    const qr = await QRCode.toString(enlace, { type: 'svg', margin: 0, color: { dark: '#0F2530', light: '#FFFFFF00' } });
    await pag.setViewport({ width: Math.round(190 * MM), height: 800 });
    await pag.emulateMediaType('print');
    await pag.setContent(html(id, d, qr, enlace), { waitUntil: 'load' });
    const alto = await pag.evaluate(() => document.documentElement.scrollHeight);
    // Si se pasa de una hoja por poco, se achica la escala (hasta 85 %) para que quepa en una; si no, quedan dos
    const hoja = 278 * MM;
    const escala = alto <= hoja ? 1 : alto * 0.85 <= hoja ? Math.floor((hoja / alto) * 100) / 100 : 1;
    const n = Math.max(1, Math.ceil((alto * escala) / hoja - 0.01));
    const pdf = await pag.pdf({ format: 'A4', printBackground: true, scale: escala, margin: { top: '9mm', bottom: '10mm', left: '10mm', right: '10mm' } });
    writeFileSync(RAIZ + 'public/' + d.pdf, pdf);
    console.log((n > MAX_PAGINAS ? '✗' : '✓'), d.pdf, '·', n, n === 1 ? 'página' : 'páginas', escala < 1 ? '· escala ' + Math.round(escala * 100) + ' %' : '', '·', Math.round(pdf.length / 1024) + ' KB');
    if (n > MAX_PAGINAS) error = true;
  }
} finally { await nav.close(); }
if (error) { console.error('Hay PDF de más de ' + MAX_PAGINAS + ' páginas: acorta el contenido.'); process.exit(1); }
