// node scripts/revisores-demo.mjs
// Prepara Revisores para mostrar cómo funciona: deja a la cuenta del equipo (CRITERIUM_ADMIN_EMAIL de .env.local) como
// revisor verificado de todas las especialidades y crea, desde una CUENTA DE EJEMPLO rotulada como tal, un borrador de
// ejemplo en revisión (ronda 1), para que el panel tenga algo que revisar. El contenido del borrador se copia tal cual
// del protocolo de destartraje de src/data.js (no se inventa contenido clínico). Se puede correr varias veces.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, doc, getDoc, setDoc, addDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { DATOS } from '../src/data.js';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const env = {};
for (const f of ['.env', '.env.local']) { if (!existsSync(RAIZ + f)) continue; for (const l of readFileSync(RAIZ + f, 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim(); } }
const cfg = { apiKey: env.VITE_FB_API_KEY, authDomain: env.VITE_FB_AUTH_DOMAIN, projectId: env.VITE_FB_PROJECT_ID, appId: env.VITE_FB_APP_ID };
const ESPECIALIDADES = ['Rehabilitación oral', 'Operatoria y cariología', 'Endodoncia', 'Periodoncia', 'Cirugía', 'Odontopediatría', 'Ortodoncia', 'Radiología', 'Patología oral', 'Trastornos temporomandibulares'];
const ahora = () => new Date().toISOString();
const TITULO = 'Destartraje y pulido radicular por cuadrante · borrador de ejemplo';

// 1. La cuenta del equipo como revisor verificado
const app = initializeApp(cfg, 'equipo');
const db = initializeFirestore(app, { experimentalForceLongPolling: true });
const { user } = await signInWithEmailAndPassword(getAuth(app), env.CRITERIUM_ADMIN_EMAIL, env.CRITERIUM_ADMIN_PASSWORD);
const perfil = (await getDoc(doc(db, 'perfiles', user.uid))).data() || {};
await setDoc(doc(db, 'revisores', user.uid), { nombre: perfil.nombre || 'Equipo Criterium', especialidades: ESPECIALIDADES, verificado: ahora(), nota: 'Revisor de demostración (equipo)' }, { merge: true });
console.log('· revisor verificado:', perfil.nombre, '·', ESPECIALIDADES.length, 'especialidades');

// 2. Un borrador de ejemplo en revisión, subido por una cuenta de ejemplo
const ya = (await getDocs(collection(db, 'borradores'))).docs.find((d) => d.data().titulo === TITULO);
if (ya) console.log('· el borrador de ejemplo ya existe:', ya.id, '·', ya.data().estado);
else {
  const app2 = initializeApp(cfg, 'ejemplo');
  const db2 = initializeFirestore(app2, { experimentalForceLongPolling: true });
  const correo = 'cuenta.ejemplo.' + Date.now() + '@ejemplo.criterium.cl';
  const clave = Math.random().toString(36).slice(2) + 'Aa1!' + Math.random().toString(36).slice(2);
  const { user: u2 } = await createUserWithEmailAndPassword(getAuth(app2), correo, clave);
  const nombre = 'Cuenta de ejemplo Criterium';
  await setDoc(doc(db2, 'usuarios', u2.uid), { nombre, rol: 'Cirujano dentista general', ejemplo: true, creado: ahora() }).catch(() => {});
  await setDoc(doc(db2, 'perfiles', u2.uid), { nombre, rol: 'Cirujano dentista general', descripcion: 'Cuenta de ejemplo para mostrar cómo funciona la revisión de borradores.', onboarding: true, actualizado: ahora() }).catch(() => {});
  const d = DATOS.destartraje;
  const contenido = { alcance: d.alcance, bandeja: d.bandeja, pasos: d.pasos.map((p) => ({ corto: p.corto, hacer: p.hacer, listo: p.listo, porque: (p.porque || [])[0] || '', fuentes: '' })) };
  const ref = await addDoc(collection(db2, 'borradores'), { tipo: 'protocolo', titulo: TITULO, especialidad: 'Periodoncia', declaracion: true, ejemplo: true, autor: { uid: u2.uid, nombre, rol: 'Cirujano dentista general' }, contenido, estado: 'borrador', ronda: 0, creado: ahora(), actualizado: ahora() });
  await updateDoc(ref, { estado: 'revision', ronda: 1, actualizado: ahora() });
  console.log('· borrador de ejemplo en revisión (ronda 1):', ref.id, '· autor:', nombre);
  await deleteApp(app2);
}
process.exit(0);
