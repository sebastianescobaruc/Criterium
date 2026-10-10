// npm run materia:subir
// Sube la sección Materia (Criterium Red) a Firestore desde la carpeta materia/:
//   materia/ramos.json             los ramos, su orden y su paleta
//   materia/<ramo>/<clase>.html    cada clase, un HTML autocontenido con sus fuentes (+ <clase>.meta.json: resumen y orden)
// Solo sube las clases que pasan scripts/validar-materia.mjs. Un ramo sin clases no se sube.
// Escribe materia/{ramo} (datos del ramo + índice de clases, sin el HTML) y materia/{ramo}/clases/{id} (el HTML, versión,
// fecha y huella SHA-256). Si el HTML no cambió, no lo vuelve a subir. Solo la lee quien tiene sesión (firestore.rules).
// Entra con una cuenta del equipo Criterium (admins/{uid}): CRITERIUM_ADMIN_EMAIL y CRITERIUM_ADMIN_PASSWORD en .env.local,
// o los pide en la terminal.
// --borrador: lo sube marcado como borrador (se ve en Materia con la etiqueta «Borrador»). Sin la marca, queda publicado.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const env = {};
for (const f of ['.env', '.env.local']) {
  if (!existsSync(RAIZ + f)) continue;
  for (const l of readFileSync(RAIZ + f, 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
}
const sha = (x) => createHash('sha256').update(x).digest('hex');
const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
async function preguntar(t, oculto) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  if (oculto) { const w = rl._writeToOutput.bind(rl); rl._writeToOutput = (s) => w(s.startsWith(t) ? s : '*'); }
  const r = await rl.question(t); rl.close(); if (oculto) process.stdout.write('\n'); return r.trim();
}

// Lee y revisa todo antes de entrar: si algo falla, no se sube nada
const BORRADOR = process.argv.includes('--borrador');
const RAMOS = JSON.parse(readFileSync(RAIZ + 'materia/ramos.json', 'utf8'));
const subir = [];
for (const [ramoId, ramo] of Object.entries(RAMOS)) {
  const dir = RAIZ + 'materia/' + ramoId;
  const htmls = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.html')) : [];
  for (const archivo of htmls) {
    const ruta = `materia/${ramoId}/${archivo}`;
    const id = archivo.replace(/\.html$/, '');
    const metaRuta = RAIZ + `materia/${ramoId}/${id}.meta.json`;
    const cl = { id, archivo, ...(existsSync(metaRuta) ? JSON.parse(readFileSync(metaRuta, 'utf8')) : {}) };
    try { execFileSync('node', [RAIZ + 'scripts/validar-materia.mjs', RAIZ + ruta], { stdio: 'pipe' }); }
    catch (e) { console.warn(`· ${ruta} no pasa la validación: no se sube`); continue; }
    const html = readFileSync(RAIZ + ruta, 'utf8');
    const titulo = (html.match(/<title>([^<]+)<\/title>/) || [])[1];
    const version = (html.match(/<span>v([\d.]+) · /) || [])[1];
    const fuentes = (html.match(/<li id="f\d+"/g) || []).length;
    if (!titulo || !version) throw new Error(ruta + ': falta <title> o la versión (v1.0 · …) en la cabecera');
    if (!fuentes) throw new Error(ruta + ': no tiene fuentes');
    if (html.length > 900000) throw new Error(ruta + ': pasa de 900 KB (Firestore acepta hasta 1 MB por documento)');
    subir.push({ ramoId, cl: { ...cl, titulo, version, fuentes }, html, huella: sha(html) });
  }
}
console.log(`· ${subir.length} clases en ${new Set(subir.map((x) => x.ramoId)).size} ramo(s)`);

const app = initializeApp({
  apiKey: env.VITE_FB_API_KEY, authDomain: env.VITE_FB_AUTH_DOMAIN, projectId: env.VITE_FB_PROJECT_ID,
  storageBucket: env.VITE_FB_STORAGE_BUCKET, messagingSenderId: env.VITE_FB_MESSAGING_SENDER_ID, appId: env.VITE_FB_APP_ID
});
const db = initializeFirestore(app, { experimentalForceLongPolling: true });
const correo = env.CRITERIUM_ADMIN_EMAIL || await preguntar('Correo de tu cuenta del equipo Criterium: ');
const clave = env.CRITERIUM_ADMIN_PASSWORD || await preguntar('Contraseña: ', true);
const { user } = await signInWithEmailAndPassword(getAuth(app), correo, clave);
if (!(await getDoc(doc(db, 'admins', user.uid))).exists()) { console.error('Esa cuenta no es del equipo Criterium (falta admins/' + user.uid + ').'); process.exit(1); }

for (const [ramoId, ramo] of Object.entries(RAMOS)) {
  if (!subir.some((x) => x.ramoId === ramoId)) continue;
  const indice = [];
  for (const s of subir.filter((x) => x.ramoId === ramoId)) {
    const ref = doc(db, 'materia', ramoId, 'clases', s.cl.id);
    const prev = (await getDoc(ref)).data();
    const fecha = prev && prev.sha256 === s.huella ? prev.fecha : hoy();
    if (!prev || prev.sha256 !== s.huella) {
      await setDoc(ref, { titulo: s.cl.titulo, version: s.cl.version, fecha, sha256: s.huella, fuentes: s.cl.fuentes, html: s.html });
      console.log(`· ${ramoId}/${s.cl.id} subida (v${s.cl.version}, ${s.cl.fuentes} fuentes)`);
    } else console.log(`· ${ramoId}/${s.cl.id} sin cambios`);
    indice.push({ id: s.cl.id, borrador: BORRADOR, titulo: s.cl.titulo, resumen: s.cl.resumen || '', orden: s.cl.orden || 0, version: s.cl.version, fecha, fuentes: s.cl.fuentes });
  }
  await setDoc(doc(db, 'materia', ramoId), {
    nombre: ramo.nombre, descripcion: ramo.descripcion || '', orden: ramo.orden || 0, borrador: BORRADOR, paleta: ramo.paleta || {},
    clases: indice.sort((a, b) => a.orden - b.orden), actualizado: hoy()
  });
  console.log(`· ramo ${ramoId} actualizado${BORRADOR ? ' (borrador)' : ''}`);
}
console.log('Listo.');
process.exit(0);
