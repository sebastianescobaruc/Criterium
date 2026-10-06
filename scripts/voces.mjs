// Genera los audios de voz natural que se leen en el modo guiado.
// Un archivo por texto y por voz en public/voz/<voz>/<clave>.mp3, y la lista en public/voz/manifest.json.
// La app los reproduce sin servidor; si falta alguno, lee con la voz del sistema.
//
// Dos proveedores (se usa el que tenga clave en .env.local; con las dos, se generan todas las voces):
//   · Alejandra, voz chilena (Azure AI Speech, es-CL). Va primera y es la voz por defecto de la app.
//       AZURE_SPEECH_KEY=…        AZURE_SPEECH_REGION=…        Guía: docs/VOZ_ALEJANDRA_AZURE.md
//   · Voces de Google Cloud Text-to-Speech (Chirp 3 HD, español latino es-US).
//       GOOGLE_TTS_API_KEY=…                                    Guía: docs/VOCES_GOOGLE_TTS.md
//
// Uso:   npm run voces
// Las claves van solo en .env.local (nunca en el código ni con prefijo VITE_: no deben llegar al navegador).
// Opcional en .env.local:
//   AZURE_VOZ=es-CL-CatalinaNeural     voz de Azure que se usa para Alejandra
//   AZURE_RAPIDO=1                     sin pausa entre audios (solo con un plan pagado de Azure: el gratis permite 20 por minuto)
//   VOCES_TTS=es-US-Chirp3-HD-Aoede,…  voces exactas de Google
//   IDIOMA_TTS=es-US                   idioma de las voces de Google
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
const env = process.env;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const minutos = (ms) => ms < 90000 ? Math.round(ms / 1000) + ' s' : Math.round(ms / 60000) + ' min';

/* ═══ Azure AI Speech: Alejandra, voz chilena ═══ */

function azure() {
  const KEY = env.AZURE_SPEECH_KEY, REGION = env.AZURE_SPEECH_REGION;
  if (!KEY) return null;
  if (!REGION && !env.AZURE_TTS_ENDPOINT) throw new Error('Falta AZURE_SPEECH_REGION en .env.local (la región del recurso de Voz, por ejemplo eastus). Mira docs/VOZ_ALEJANDRA_AZURE.md.');
  const BASE = (env.AZURE_TTS_ENDPOINT || `https://${REGION}.tts.speech.microsoft.com`).replace(/\/$/, '');
  const VOZ = env.AZURE_VOZ || 'es-CL-CatalinaNeural';
  const xml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  async function pedir(ruta, opciones = {}, intento = 0) {
    const r = await fetch(BASE + ruta, { ...opciones, headers: { 'Ocp-Apim-Subscription-Key': KEY, 'User-Agent': 'criterium-voces', ...(opciones.headers || {}) } });
    if (r.status === 429 && intento < 8) {
      // Plan gratis: 20 audios por minuto. Se espera lo que pida Azure y se sigue.
      const s = parseFloat(r.headers.get('retry-after')) || 10;
      await espera(s * 1000 + 500);
      return pedir(ruta, opciones, intento + 1);
    }
    if (!r.ok) {
      const cuerpo = await r.text().catch(() => '');
      const pista = r.status === 401 ? '\n→ La clave o la región no coinciden. Copia de nuevo «Clave 1» y «Ubicación/Región» del recurso de Voz en Azure.'
        : r.status === 403 ? '\n→ El recurso no tiene acceso. Revisa que sea un recurso de «Voz» (Speech) y que esté activo.'
        : r.status === 400 ? '\n→ Azure no entendió el texto. Avísale a quien mantiene la app.' : '';
      throw new Error('Azure respondió ' + r.status + (cuerpo ? ': ' + cuerpo.slice(0, 200) : '') + pista);
    }
    return r;
  }
  return {
    nombre: 'Azure',
    // El plan gratis permite 20 audios por minuto: uno cada 3,1 s, de a uno
    paralelo: 1, pausa: env.AZURE_RAPIDO ? 0 : 3100,
    async voces() {
      const lista = await (await pedir('/cognitiveservices/voices/list')).json();
      const v = lista.find((x) => x.ShortName === VOZ);
      if (!v) {
        const chilenas = lista.filter((x) => x.Locale === 'es-CL').map((x) => x.ShortName);
        throw new Error('Azure no tiene la voz ' + VOZ + ' en esta región.' + (chilenas.length ? '\nVoces de Chile disponibles: ' + chilenas.join(', ') : '\nEsta región no tiene voces de Chile: crea el recurso en otra (por ejemplo eastus).'));
      }
      return [{ id: 'es-CL-Alejandra', nombre: 'Alejandra', etiqueta: 'Alejandra · voz chilena', genero: 'FEMALE', idioma: 'es-CL', origen: VOZ }];
    },
    async sintetizar(texto) {
      // Ritmo apenas más pausado y tono natural: se entiende bien con el ruido del box
      const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-CL"><voice name="${VOZ}"><prosody rate="-4%">${xml(texto)}</prosody></voice></speak>`;
      const r = await pedir('/cognitiveservices/v1', { method: 'POST', headers: { 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-48khz-96kbitrate-mono-mp3' }, body: ssml });
      return Buffer.from(await r.arrayBuffer());
    }
  };
}

/* ═══ Google Cloud Text-to-Speech ═══ */

function google() {
  const KEY = env.GOOGLE_TTS_API_KEY;
  if (!KEY) return null;
  const IDIOMA = env.IDIOMA_TTS || 'es-US';
  const API = (env.TTS_ENDPOINT || 'https://texttospeech.googleapis.com').replace(/\/$/, '');
  async function pedir(url, opciones = {}, intento = 0) {
    const r = await fetch(url, { ...opciones, headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY, ...(opciones.headers || {}) } });
    if (r.status === 429 && intento < 5) { await espera(1500 * 2 ** intento); return pedir(url, opciones, intento + 1); }
    const cuerpo = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = (cuerpo.error && cuerpo.error.message) || r.statusText;
      const pista = r.status === 403 ? '\n→ Revisa que la API «Cloud Text-to-Speech» esté habilitada en el proyecto, que tenga facturación activa y que la clave permita esa API.'
        : r.status === 400 && /API key/i.test(msg) ? '\n→ La clave no es válida. Cópiala de nuevo desde la consola.' : '';
      throw new Error('Google respondió ' + r.status + ': ' + msg + pista);
    }
    return cuerpo;
  }
  const porId = new Map();
  return {
    nombre: 'Google', paralelo: 4, pausa: 0,
    async voces() {
      // Las Chirp 3 HD del idioma (las más naturales); si no hay, Neural2
      const { voices = [] } = await pedir(API + '/v1/voices?languageCode=' + IDIOMA);
      const delIdioma = voices.filter((v) => (v.languageCodes || []).includes(IDIOMA));
      let candidatas = delIdioma.filter((v) => v.name.includes('Chirp3-HD'));
      if (!candidatas.length) candidatas = delIdioma.filter((v) => v.name.includes('Neural2'));
      if (!candidatas.length) throw new Error('Google no ofrece voces Chirp 3 HD ni Neural2 para ' + IDIOMA + '.');
      candidatas.sort((a, b) => a.name.localeCompare(b.name));
      let elegidas;
      if (env.VOCES_TTS) {
        const pedidas = env.VOCES_TTS.split(',').map((x) => x.trim()).filter(Boolean);
        elegidas = pedidas.map((n) => delIdioma.find((v) => v.name === n));
        const faltan = pedidas.filter((n, i) => !elegidas[i]);
        if (faltan.length) throw new Error('Estas voces no existen para ' + IDIOMA + ': ' + faltan.join(', ') + '\nDisponibles: ' + candidatas.map((v) => v.name).join(', '));
      } else {
        // Por defecto, una femenina y una masculina
        elegidas = [candidatas.find((v) => v.ssmlGender === 'FEMALE'), candidatas.find((v) => v.ssmlGender === 'MALE')].filter(Boolean);
        if (!elegidas.length) elegidas = candidatas.slice(0, 2);
      }
      return elegidas.map((v) => ({ id: v.name, nombre: v.name.split('-').pop(), genero: v.ssmlGender, idioma: IDIOMA }));
    },
    async sintetizar(texto, v) {
      const r = await pedir(API + '/v1/text:synthesize', {
        method: 'POST',
        body: JSON.stringify({ input: { text: texto }, voice: { languageCode: IDIOMA, name: v.id }, audioConfig: { audioEncoding: 'MP3' } })
      });
      return Buffer.from(r.audioContent, 'base64');
    }
  };
}

// Cualquier error de los proveedores se muestra como mensaje, sin la traza técnica
try {
  const proveedores = [azure(), google()].filter(Boolean);
  if (!proveedores.length) {
    console.error('No hay claves en .env.local.\n· Para Alejandra (voz chilena): AZURE_SPEECH_KEY y AZURE_SPEECH_REGION. Guía: docs/VOZ_ALEJANDRA_AZURE.md\n· Para las voces de Google: GOOGLE_TTS_API_KEY. Guía: docs/VOCES_GOOGLE_TTS.md');
    process.exit(1);
  }

  // 1 · Voces de cada proveedor (Alejandra primero: es la voz por defecto)
  const elegidas = [];
  for (const p of proveedores) for (const v of await p.voces()) elegidas.push({ ...v, p });
  console.log('Voces: ' + elegidas.map((v) => v.etiqueta || v.id).join(', '));

  // 2 · Textos: todo lo que puede leer cada protocolo, sin repetir
  const textos = new Map();
  [TEXTO_PRUEBA, ...Object.values(DATOS).flatMap(textosDe)].forEach((t) => textos.set(clave(t), t));
  console.log(textos.size + ' textos distintos.');

  // 3 · Audios: solo los que faltan (si un texto cambia, cambia su clave y se genera de nuevo)
  let nuevos = 0, caracteres = 0;
  for (const v of elegidas) {
    const dir = SALIDA + v.id + '/';
    mkdirSync(dir, { recursive: true });
    const pendientes = [...textos].filter(([k]) => !existsSync(dir + k + '.mp3'));
    if (pendientes.length && v.p.pausa) console.log((v.etiqueta || v.id) + ': ' + pendientes.length + ' audios, unos ' + minutos(pendientes.length * v.p.pausa) + ' (el plan gratis de ' + v.p.nombre + ' permite 20 por minuto).');
    let i = 0, hechos = 0;
    const trabajador = async () => {
      while (i < pendientes.length) {
        const [k, texto] = pendientes[i++];
        const t0 = Date.now();
        writeFileSync(dir + k + '.mp3', await v.p.sintetizar(texto, v));
        nuevos++; hechos++; caracteres += texto.length;
        if (process.stdout.isTTY) process.stdout.write('\r' + (v.etiqueta || v.id) + ': ' + hechos + ' / ' + pendientes.length + '   ');
        if (v.p.pausa && i < pendientes.length) await espera(Math.max(0, v.p.pausa - (Date.now() - t0)));
      }
    };
    await Promise.all(Array.from({ length: v.p.paralelo }, trabajador));
    if (pendientes.length) console.log((process.stdout.isTTY ? '\n' : '') + (v.etiqueta || v.id) + ': ' + pendientes.length + ' audios generados.');
    // Borra audios de textos que ya no existen
    for (const f of readdirSync(dir)) if (f.endsWith('.mp3') && !textos.has(f.replace('.mp3', ''))) unlinkSync(dir + f);
  }

  // 4 · Lista que lee la app: voces y claves con audio en todas las voces
  const claves = [...textos.keys()].filter((k) => elegidas.every((v) => existsSync(SALIDA + v.id + '/' + k + '.mp3')));
  writeFileSync(SALIDA + 'manifest.json', JSON.stringify({
    generado: new Date().toISOString(),
    voces: elegidas.map(({ p, ...v }) => v),
    claves
  }, null, 1));
  // Voces que ya no se usan
  for (const d of readdirSync(SALIDA, { withFileTypes: true })) if (d.isDirectory() && !elegidas.some((v) => v.id === d.name)) console.log('Carpeta sin usar (puedes borrarla): public/voz/' + d.name);
  console.log('Listo: ' + nuevos + ' audios nuevos (' + caracteres + ' caracteres enviados), ' + claves.length + ' textos con voz natural.');
} catch (e) {
  console.error('\n' + (e && e.message ? e.message : e));
  process.exit(1);
}
