// Genera con Google Cloud Text-to-Speech los audios que se leen en el modo guiado.
// Un archivo por texto y por voz en public/voz/<voz>/<clave>.mp3, y la lista en public/voz/manifest.json.
// La app los reproduce sin servidor; si falta alguno, lee con la voz del sistema.
//
// Uso:   npm run voces
// Clave: GOOGLE_TTS_API_KEY en .env.local (nunca en el código ni con prefijo VITE_: no debe llegar al navegador).
// Opcional en .env.local:
//   VOCES_TTS=es-US-Chirp3-HD-Aoede,es-US-Chirp3-HD-Charon   voces exactas a usar
//   IDIOMA_TTS=es-US                                          idioma de las voces (es-US = español latino)
// Guía paso a paso: docs/VOCES_GOOGLE_TTS.md
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DATOS } from '../src/data.js';
import { textosDe, TEXTO_PRUEBA, clave } from '../src/lectura.js';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const SALIDA = RAIZ + 'public/voz/';

// Lee .env.local y .env sin dependencias (lo que ya esté en el entorno manda)
for (const f of ['.env.local', '.env']) {
  if (!existsSync(RAIZ + f)) continue;
  for (const l of readFileSync(RAIZ + f, 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const KEY = process.env.GOOGLE_TTS_API_KEY;
const IDIOMA = process.env.IDIOMA_TTS || 'es-US';
const API = (process.env.TTS_ENDPOINT || 'https://texttospeech.googleapis.com').replace(/\/$/, '');
if (!KEY) {
  console.error('Falta GOOGLE_TTS_API_KEY en .env.local. Sigue la guía en docs/VOCES_GOOGLE_TTS.md.');
  process.exit(1);
}

async function pedir(url, opciones = {}, intento = 0) {
  const r = await fetch(url, { ...opciones, headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY, ...(opciones.headers || {}) } });
  if (r.status === 429 && intento < 5) { await new Promise((x) => setTimeout(x, 1500 * 2 ** intento)); return pedir(url, opciones, intento + 1); }
  const cuerpo = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (cuerpo.error && cuerpo.error.message) || r.statusText;
    const pista = r.status === 403 ? '\n→ Revisa que la API «Cloud Text-to-Speech» esté habilitada en el proyecto, que tenga facturación activa y que la clave permita esa API.'
      : r.status === 400 && /API key/i.test(msg) ? '\n→ La clave no es válida. Cópiala de nuevo desde la consola.' : '';
    throw new Error('Google respondió ' + r.status + ': ' + msg + pista);
  }
  return cuerpo;
}

// Cualquier error de Google se muestra como mensaje, sin la traza técnica
try {

// 1 · Voces: las Chirp 3 HD del idioma (las más naturales); si no hay, Neural2
const { voices = [] } = await pedir(API + '/v1/voices?languageCode=' + IDIOMA);
const delIdioma = voices.filter((v) => (v.languageCodes || []).includes(IDIOMA));
let candidatas = delIdioma.filter((v) => v.name.includes('Chirp3-HD'));
if (!candidatas.length) candidatas = delIdioma.filter((v) => v.name.includes('Neural2'));
if (!candidatas.length) { console.error('Google no ofrece voces Chirp 3 HD ni Neural2 para ' + IDIOMA + '.'); process.exit(1); }
candidatas.sort((a, b) => a.name.localeCompare(b.name));
let elegidas;
if (process.env.VOCES_TTS) {
  const pedidas = process.env.VOCES_TTS.split(',').map((x) => x.trim()).filter(Boolean);
  elegidas = pedidas.map((n) => delIdioma.find((v) => v.name === n));
  const faltan = pedidas.filter((n, i) => !elegidas[i]);
  if (faltan.length) { console.error('Estas voces no existen para ' + IDIOMA + ': ' + faltan.join(', ') + '\nDisponibles: ' + candidatas.map((v) => v.name).join(', ')); process.exit(1); }
} else {
  // Por defecto, una femenina y una masculina
  elegidas = [candidatas.find((v) => v.ssmlGender === 'FEMALE'), candidatas.find((v) => v.ssmlGender === 'MALE')].filter(Boolean);
  if (!elegidas.length) elegidas = candidatas.slice(0, 2);
}
console.log('Voces: ' + elegidas.map((v) => v.name).join(', '));

// 2 · Textos: todo lo que puede leer cada protocolo, sin repetir
const textos = new Map();
[TEXTO_PRUEBA, ...Object.values(DATOS).flatMap(textosDe)].forEach((t) => textos.set(clave(t), t));
console.log(textos.size + ' textos distintos.');

// 3 · Audios: solo los que faltan (si un texto cambia, cambia su clave y se genera de nuevo)
let nuevos = 0, caracteres = 0;
for (const v of elegidas) {
  const dir = SALIDA + v.name + '/';
  mkdirSync(dir, { recursive: true });
  const pendientes = [...textos].filter(([k]) => !existsSync(dir + k + '.mp3'));
  let i = 0;
  const trabajador = async () => {
    while (i < pendientes.length) {
      const [k, texto] = pendientes[i++];
      const r = await pedir(API + '/v1/text:synthesize', {
        method: 'POST',
        body: JSON.stringify({ input: { text: texto }, voice: { languageCode: IDIOMA, name: v.name }, audioConfig: { audioEncoding: 'MP3' } })
      });
      writeFileSync(dir + k + '.mp3', Buffer.from(r.audioContent, 'base64'));
      nuevos++; caracteres += texto.length;
      if (process.stdout.isTTY) process.stdout.write('\r' + v.name + ': ' + i + ' / ' + pendientes.length + '   ');
    }
  };
  await Promise.all([trabajador(), trabajador(), trabajador(), trabajador()]);
  if (pendientes.length) console.log((process.stdout.isTTY ? '\n' : '') + v.name + ': ' + pendientes.length + ' audios generados.');
  // Borra audios de textos que ya no existen
  for (const f of readdirSync(dir)) if (f.endsWith('.mp3') && !textos.has(f.replace('.mp3', ''))) unlinkSync(dir + f);
}

// 4 · Lista que lee la app: voces y claves con audio en todas las voces
const claves = [...textos.keys()].filter((k) => elegidas.every((v) => existsSync(SALIDA + v.name + '/' + k + '.mp3')));
const nombre = (n) => n.split('-').pop();
writeFileSync(SALIDA + 'manifest.json', JSON.stringify({
  generado: new Date().toISOString(), idioma: IDIOMA,
  voces: elegidas.map((v) => ({ id: v.name, nombre: nombre(v.name), genero: v.ssmlGender, idioma: IDIOMA })),
  claves
}, null, 1));
// Voces que ya no se usan
for (const d of readdirSync(SALIDA, { withFileTypes: true })) if (d.isDirectory() && !elegidas.some((v) => v.name === d.name)) console.log('Carpeta sin usar (puedes borrarla): public/voz/' + d.name);
console.log('Listo: ' + nuevos + ' audios nuevos (' + caracteres + ' caracteres enviados a Google), ' + claves.length + ' textos con voz natural.');
} catch (e) {
  console.error('\n' + (e && e.message ? e.message : e));
  process.exit(1);
}
