// node scripts/validar-materia.mjs materia/<ramo>/<clase>.html [--navegador] [--sin-red]
// Revisa una clase de Materia contra docs/MASTER_PROMPT_MATERIA.md. Termina con código 1 si hay errores.
// - Estructura: título, cabecera con versión y «N fuentes» igual al número real, aviso de revisión, autoevaluación.
// - Citas: toda cita tiene su fuente y toda fuente se cita.
// - Fuentes: cada PMID existe en PubMed, su título calza con la cita y el DOI coincide (salvo --sin-red).
// - Prohibido: nombres de la universidad, sigla del ramo, «Dr./Dra.», frases que delatan la clase, recursos externos,
//   localStorage, alert/confirm/prompt, scrollIntoView.
// - JavaScript que compila. Con --navegador: lo abre en Chrome dentro de un iframe aislado (como en la app), a 390 y
//   1200 px, y revisa que no haya errores ni desplazamiento horizontal.
import { readFileSync, existsSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { datosPubmed } from './pubmed.mjs';

const args = process.argv.slice(2);
const ruta = args.find((a) => !a.startsWith('--'));
if (!ruta || !existsSync(ruta)) { console.error('Uso: node scripts/validar-materia.mjs <archivo.html> [--navegador] [--sin-red]'); process.exit(2); }
const html = readFileSync(ruta, 'utf8');
const errores = [], avisos = [];
const err = (m) => errores.push(m), av = (m) => avisos.push(m);
const texto = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

// Estructura
const titulo = (html.match(/<title>([^<]+)<\/title>/) || [])[1];
if (!titulo) err('Falta <title>.');
if (!/<html lang="es">/.test(html)) err('Falta <html lang="es">.');
if (!/<span>v\d+\.\d+ · \d{1,2} de [a-záéíóú]+ de \d{4}<\/span>/.test(html)) err('La cabecera no tiene «vX.Y · D de mes de AAAA».');
if (!/Sin revisión de especialista todavía/.test(html)) err('Falta el aviso «Sin revisión de especialista todavía».');
if (!/id="fuentes"/.test(html)) err('Falta la sección de fuentes (id="fuentes").');
if (!/id="s-quiz"|class="quiz"/.test(html)) err('Falta la autoevaluación.');
if (!/no reemplaza el juicio clínico/.test(html)) av('Falta el pie «no reemplaza el juicio clínico…».');
if (/@media \(prefers-color-scheme: dark\)|data-theme="dark"/.test(html)) err('Tiene tema oscuro: Materia es solo tema claro.');
const kb = Math.round(html.length / 1024);
if (kb > 880) err(`Pesa ${kb} KB: el máximo es 880 KB.`); else if (kb < 20) av(`Pesa solo ${kb} KB: ¿está completa?`);

// Fuentes y citas
const refs = [...html.matchAll(/<li id="f(\d+)">([\s\S]*?)<\/li>/g)].map((m) => ({ n: +m[1], li: m[2] }));
const defin = new Set(refs.map((r) => r.n));
const decla = +((html.match(/<span>(\d+) fuentes<\/span>/) || [])[1] || -1);
if (refs.length < 8) err(`Tiene ${refs.length} fuentes: el mínimo es 8.`);
if (decla !== refs.length) err(`La cabecera dice ${decla} fuentes y la lista tiene ${refs.length}.`);
refs.forEach((r, i) => { if (r.n !== i + 1) err(`Las fuentes no van seguidas: en la posición ${i + 1} está la ${r.n}.`); });
const usadas = new Set();
for (const m of html.matchAll(/href="#f(\d+)"/g)) usadas.add(+m[1]);
const js = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
for (const m of js.matchAll(/\bc\(([\d,\s]+)\)/g)) m[1].split(',').map((x) => +x.trim()).filter(Boolean).forEach((x) => usadas.add(x));
for (const m of js.matchAll(/\bf:\s*\[([\d,\s]+)\]/g)) m[1].split(',').map((x) => +x.trim()).filter(Boolean).forEach((x) => usadas.add(x));
for (const m of js.matchAll(/,\s*\[([\d,\s]+)\]\s*\]/g)) m[1].split(',').map((x) => +x.trim()).filter(Boolean).forEach((x) => usadas.add(x));
// Tablas de datos con la fuente como último número: ['texto', 'valor', 14]
for (const m of js.matchAll(/['"`]\s*,\s*(\d{1,3})\s*\]/g)) if (defin.has(+m[1])) usadas.add(+m[1]);
const sinDef = [...usadas].filter((x) => !defin.has(x)), sinUso = [...defin].filter((x) => !usadas.has(x));
if (sinDef.length) err('Citas sin fuente en la lista: ' + sinDef.join(', '));
if (sinUso.length) err('Fuentes que no se citan en ninguna parte: ' + sinUso.join(', '));
for (const r of refs) if (!/href="https?:\/\//.test(r.li)) err(`La fuente ${r.n} no tiene enlace (DOI, PubMed o documento).`);

// Contenido prohibido
const PROHIBIDO = [
  [/\b(UC|PUC)\b/, 'menciona «UC» o «PUC»'], [/Pontificia|Universidad Cat[oó]lica|la Cat[oó]lica\b/i, 'nombra la universidad'],
  [/\b(GER|CIA|CIN)\b/, 'usa la sigla de un ramo'], [/\bDra?\.\s+[A-ZÁÉÍÓÚ]/, 'nombra a un docente («Dr./Dra. …»)'],
  [/\b(el|la) profe(sor|sora)?\b|\b(en|de) (la )?clase anterior\b|\bel apunte\b|transcripci[oó]n|\bel programa (del curso|del ramo)\b|\bas[ií] viene en el programa\b|paciente del docente/i, 'tiene frases que delatan la clase'],
];
for (const [re, m] of PROHIBIDO) { const x = texto.match(re); if (x) err(`El texto ${m}: «…${texto.slice(Math.max(0, x.index - 40), x.index + 50).trim()}…»`); }
if (/<script[^>]*\bsrc=|<link[^>]+href="https?:|@import|<img[^>]+src="https?:|url\(https?:/i.test(html)) err('Carga recursos externos (scripts, fuentes, estilos o imágenes).');
if (/\b(localStorage|sessionStorage)\b/.test(js)) err('Usa localStorage o sessionStorage: en el visor aislado fallan.');
if (/\b(alert|confirm|prompt)\s*\(/.test(js)) err('Usa alert/confirm/prompt.');
if (/scrollIntoView/.test(js)) err('Usa scrollIntoView: mueve la página de Criterium. Usa window.scrollTo como la referencia.');
if (/href="#/.test(html) && !/a\[href\^="#"\]/.test(js)) err('Tiene enlaces internos (href="#…") sin el manejador de clics de la referencia.');
if (/\beval\s*\(|new Function/.test(js)) err('Usa eval o new Function.');

// JavaScript que compila
try { new Function(js); } catch (e) { err('El JavaScript no compila: ' + e.message); }

// Fuentes en PubMed
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/<[^>]+>/g, ' ').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3);
if (!args.includes('--sin-red')) {
  const conPmid = refs.map((r) => ({ ...r, pmid: (r.li.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/) || [])[1], doi: ((r.li.match(/doi\.org\/([^"]+)"/) || [])[1] || '').toLowerCase() })).filter((r) => r.pmid);
  for (let i = 0; i < conPmid.length; i += 50) {
    const lote = conPmid.slice(i, i + 50);
    let d; try { d = await datosPubmed(lote.map((r) => r.pmid)); } catch (e) { av('No se pudo consultar PubMed: ' + e.message); break; }
    for (const r of lote) {
      const x = d[r.pmid];
      if (!x || x.error || !x.title) { err(`Fuente ${r.n}: el PMID ${r.pmid} no existe en PubMed.`); continue; }
      const t = norm(x.title), li = new Set(norm(r.li));
      const calce = t.filter((w) => li.has(w)).length / Math.max(1, t.length);
      if (calce < 0.6) err(`Fuente ${r.n}: el título de la cita no calza con el PMID ${r.pmid} («${x.title}»).`);
      const doi = (((x.articleids || []).find((a) => a.idtype === 'doi') || {}).value || '').toLowerCase();
      if (r.doi && doi && decodeURIComponent(r.doi) !== doi) err(`Fuente ${r.n}: el DOI ${r.doi} no es el del PMID ${r.pmid} (${doi}).`);
      const anio = (x.pubdate || '').slice(0, 4);
      if (anio && !r.li.includes(anio)) av(`Fuente ${r.n}: el año de PubMed (${anio}) no aparece en la cita.`);
    }
  }
  const sinPm = refs.filter((r) => !/pubmed\.ncbi/.test(r.li));
  if (sinPm.length > Math.ceil(refs.length / 3)) av(`${sinPm.length} de ${refs.length} fuentes no están en PubMed: revísalas a mano.`);
}

// Navegador
if (args.includes('--navegador')) {
  try {
    const { default: puppeteer } = await import('puppeteer-core');
    const nav = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
    for (const w of [390, 1200]) {
      const page = await nav.newPage(); const fallos = [];
      page.on('pageerror', (e) => fallos.push(String(e).slice(0, 200)));
      await page.setViewport({ width: w, height: 900 });
      await page.setContent('<html><body style="margin:0"><iframe id="fr" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" style="width:100%;height:880px;border:0"></iframe></body></html>');
      await page.$eval('#fr', (el, h) => { el.srcdoc = h; }, html);
      await new Promise((r) => setTimeout(r, 1500));
      const fr = page.frames().find((x) => x !== page.mainFrame());
      const ancho = await fr.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (ancho > 2) err(`A ${w} px la página se desplaza ${ancho} px hacia el lado.`);
      // Toca todos los botones para encontrar errores en los interactivos
      await fr.evaluate(() => { document.querySelectorAll('button').forEach((b) => { try { b.click(); } catch (e) {} }); });
      await new Promise((r) => setTimeout(r, 500));
      const afuera = await page.evaluate(() => scrollY);
      if (afuera > 0) err('Al usar la clase se movió la página que la contiene (scrollIntoView o similar).');
      if (fallos.length) err(`Errores de JavaScript a ${w} px: ${[...new Set(fallos)].join(' | ')}`);
      await page.close();
    }
    await nav.close();
  } catch (e) { av('No se pudo abrir Chrome para la prueba: ' + e.message); }
}

const nombre = basename(dirname(ruta)) + '/' + basename(ruta);
if (!errores.length) console.log(`OK ${nombre} · ${refs.length} fuentes · ${kb} KB${avisos.length ? ' · ' + avisos.length + ' avisos' : ''}`);
else console.log(`ERRORES en ${nombre}:`);
errores.forEach((m) => console.log('  ✗ ' + m));
avisos.forEach((m) => console.log('  · ' + m));
process.exit(errores.length ? 1 : 0);
