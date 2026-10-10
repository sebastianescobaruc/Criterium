// npm run protocolos:subir
// Sube los protocolos de src/data.js a Firestore (protocolos/{id}) con su versión, fecha y huella SHA-256, y el PDF de box
// (protocolos-pdf/) en protocolos/{id}/archivos/pdf. La app ya no lleva los protocolos dentro del código: los baja de ahí.
// - Si el contenido no cambió, no hace nada.
// - Si cambió y el protocolo está congelado (piloto: config/piloto.congelados y es del estudio), lo guarda como versión
//   nueva sin publicar en protocolos/{id}/versiones/ y deja intacto lo publicado.
// - Si config/piloto no existe, lo crea con los valores por defecto (PILOTO_* en .env.local).
// - Reescribe src/muestra.js: el paso de muestra y la lista de la portada pública (que se ve sin cuenta).
// Entra con una cuenta del equipo Criterium (admins/{uid}): CRITERIUM_ADMIN_EMAIL y CRITERIUM_ADMIN_PASSWORD en .env.local,
// o los pide en la terminal. Corre las reglas nuevas (firestore.rules) antes de la primera subida.
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, doc, getDoc, setDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { PROTOS, DATOS } from '../src/data.js';

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

// ── Portada pública: un paso de muestra y la lista de protocolos (sin el resto del contenido) ──
function escribirMuestra() {
  const MUESTRA = { proto: 'resina-clase-i', paso: 2 };
  const d = DATOS[MUESTRA.proto]; const s = d.pasos[MUESTRA.paso];
  const muestra = {
    titulo: d.titulo, paso: MUESTRA.paso, total: d.pasos.length, anim: s.anim || null, hacer: s.hacer, listo: s.listo || '',
    porque: (s.porque || [])[0] || '', grado: ((s.sub || []).flatMap((x) => x.fuentes || [])[0] || {}).grado || ''
  };
  const lista = PROTOS.filter((p) => p.abre && DATOS[p.id]).map((p) => ({ id: p.id, t: p.t, esp: p.esp }));
  writeFileSync(RAIZ + 'src/muestra.js', '// Lo genera `npm run protocolos:subir` desde src/data.js: no editar a mano.\n'
    + '// Es lo único de los protocolos que se ve sin cuenta (portada pública): un paso de muestra y los títulos.\n'
    + 'export const MUESTRA = ' + JSON.stringify(muestra, null, 2) + ';\n\nexport const LISTA = ' + JSON.stringify(lista, null, 2) + ';\n');
  console.log('· src/muestra.js actualizado');
}

escribirMuestra();
if (process.argv.includes('--solo-muestra')) process.exit(0);

const app = initializeApp({
  apiKey: env.VITE_FB_API_KEY, authDomain: env.VITE_FB_AUTH_DOMAIN, projectId: env.VITE_FB_PROJECT_ID,
  storageBucket: env.VITE_FB_STORAGE_BUCKET, messagingSenderId: env.VITE_FB_MESSAGING_SENDER_ID, appId: env.VITE_FB_APP_ID
});
const db = initializeFirestore(app, { experimentalForceLongPolling: true });
const correo = env.CRITERIUM_ADMIN_EMAIL || await preguntar('Correo de tu cuenta del equipo Criterium: ');
const clave = env.CRITERIUM_ADMIN_PASSWORD || await preguntar('Contraseña: ', true);
const { user } = await signInWithEmailAndPassword(getAuth(app), correo, clave);
if (!(await getDoc(doc(db, 'admins', user.uid))).exists()) { console.error('Esa cuenta no es del equipo Criterium (falta admins/' + user.uid + ').'); process.exit(1); }

// Configuración del piloto: se crea una vez con los valores por defecto
const refCfg = doc(db, 'config', 'piloto');
let cfg = (await getDoc(refCfg)).data();
if (!cfg) {
  cfg = {
    apertura: Timestamp.fromDate(new Date((env.PILOTO_APERTURA || '2027-11-01') + 'T00:00:00-03:00')),
    abierto: false,
    registroUCInvitacion: env.REGISTRO_UC_POR_INVITACION === 'true',
    modulosNuevos: env.MODULOS_NUEVOS_EN_PILOTO === 'true',
    congelados: env.PROTOCOLOS_CONGELADOS === 'true',
    dominiosInvitacion: (env.DOMINIOS_INVITACION || 'uc.cl').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean),
    estudio: PROTOS.filter((p) => p.estudio).map((p) => p.id),
    actualizado: serverTimestamp()
  };
  await setDoc(refCfg, cfg);
  console.log('· config/piloto creado (apertura ' + (env.PILOTO_APERTURA || '2027-11-01') + ', registro UC por invitación ' + (cfg.registroUCInvitacion ? 'sí' : 'no') + ', congelados ' + (cfg.congelados ? 'sí' : 'no') + ')');
}

for (const [orden, p] of PROTOS.entries()) {
  const d = DATOS[p.id];
  if (!d) { console.log('— ' + p.id + ': sin contenido en data.js, se omite'); continue; }
  const catalogo = JSON.stringify(p); const json = JSON.stringify(d);
  const huella = sha(json);
  const version = ((p.estadoTxt || '').match(/v\d+(\.\d+)*/) || [''])[0];
  const ref = doc(db, 'protocolos', p.id);
  const previo = (await getDoc(ref)).data();
  const congelado = cfg.congelados === true && !!p.estudio && !!previo;
  const datos = { catalogo, json, version, sha256: huella, estudio: !!p.estudio, publicado: p.abre !== false, orden };
  if (previo && previo.sha256 === huella && previo.catalogo === catalogo && previo.orden === orden) console.log('= ' + p.id + ' ' + version + ' sin cambios');
  else if (congelado) {
    await addDoc(collection(ref, 'versiones'), { ...datos, publicado: false, fecha: hoy(), creado: serverTimestamp() });
    console.log('❄ ' + p.id + ': congelado por el piloto. El cambio quedó como versión nueva sin publicar (versiones/).');
  } else {
    await setDoc(ref, { ...datos, fecha: previo && previo.sha256 === huella ? previo.fecha : hoy(), actualizado: serverTimestamp() });
    console.log((previo ? '↑ ' : '+ ') + p.id + ' ' + version + ' · ' + huella.slice(0, 12) + '…');
  }
  // PDF de box
  if (d.pdf) {
    const ruta = RAIZ + 'protocolos-pdf/' + d.pdf;
    if (!existsSync(ruta)) { console.log('  ! falta ' + 'protocolos-pdf/' + d.pdf + ' (npm run pdfs)'); continue; }
    const buf = readFileSync(ruta); const hp = sha(buf);
    const refPdf = doc(db, 'protocolos', p.id, 'archivos', 'pdf');
    const pdfPrevio = (await getDoc(refPdf)).data();
    if (pdfPrevio && pdfPrevio.sha256 === hp) continue;
    if (pdfPrevio && congelado) { console.log('  ❄ PDF congelado, no se reemplaza'); continue; }
    await setDoc(refPdf, { nombre: d.pdf, base64: buf.toString('base64'), sha256: hp, actualizado: serverTimestamp() });
    console.log('  · PDF ' + d.pdf + ' (' + Math.round(buf.length / 1024) + ' KB)');
  }
}
console.log('Listo.');
process.exit(0);
