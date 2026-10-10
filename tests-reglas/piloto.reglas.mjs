// Pruebas de las reglas de Firestore del modo piloto, con usuarios de prueba, en el emulador.
// npm run test:reglas   (necesita Java; ver README: «Probar las reglas del piloto»)
// No usa datos reales: el emulador parte vacío y estas pruebas lo llenan con datos ficticios.
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, setDoc, updateDoc, addDoc, collection, query, where, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';

let env;
const APERTURA = Timestamp.fromDate(new Date('2027-11-01T03:00:00Z'));
const CFG = { apertura: APERTURA, abierto: false, registroUCInvitacion: true, modulosNuevos: false, congelados: true, dominiosInvitacion: ['uc.cl'], estudio: ['resina-clase-i'] };

// Los 5 usuarios del criterio de calidad (+ apoyo)
const U = {
  libre: { uid: 'est-libre', email: 'estudiante@gmail.com' },       // estudiante sin piloto
  dentista: { uid: 'dentista', email: 'dentista@clinica.cl' },       // dentista (sin piloto)
  crit: { uid: 'est-crit', email: 'crit@uc.cl' },                    // estudiante grupo criterium (invitado)
  hab: { uid: 'est-hab', email: 'hab@uc.cl' },                       // estudiante grupo habitual (invitado)
  ucSinInvitacion: { uid: 'uc-sin', email: 'sin@uc.cl' },            // correo UC sin invitación
  docenteUC: { uid: 'docente', email: 'docente@uc.cl' },             // docente con correo UC (exento)
  admin: { uid: 'admin', email: 'equipo@criterium.cl' },
  nuevo: { uid: 'est-nuevo', email: 'nuevo@uc.cl' }                  // se registra con invitación
};
const como = (u) => env.authenticatedContext(u.uid, { email: u.email, email_verified: true }).firestore();
const anonimo = () => env.unauthenticatedContext().firestore();
const proto = (id, estudio) => ({ catalogo: JSON.stringify({ id, t: id, esp: 'X', abre: true }), json: '{}', version: 'v0.1', fecha: '2026-10-07', sha256: 'a'.repeat(64), estudio, publicado: true, orden: 0 });

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-criterium', firestore: { rules: readFileSync(process.env.REGLAS || new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 } });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    await setDoc(doc(db, 'config/piloto'), CFG);
    await setDoc(doc(db, 'admins', U.admin.uid), { nombre: 'Equipo' });
    await setDoc(doc(db, 'docentes', U.docenteUC.uid), { nombre: 'Docente' });
    await setDoc(doc(db, 'protocolos/resina-clase-i'), proto('resina-clase-i', true));
    await setDoc(doc(db, 'protocolos/cementado-pmma'), proto('cementado-pmma', false));
    await setDoc(doc(db, 'protocolos/resina-clase-i/archivos/pdf'), { nombre: 'r.pdf', base64: 'AA==' });
    await setDoc(doc(db, 'protocolos/cementado-pmma/archivos/pdf'), { nombre: 'p.pdf', base64: 'AA==' });
    await setDoc(doc(db, 'participantes', U.crit.uid), { grupo: 'criterium', codigo: 'P-CRIT01' });
    await setDoc(doc(db, 'participantes', U.hab.uid), { grupo: 'habitual', codigo: 'P-HAB001' });
    await setDoc(doc(db, 'identidades/P-CRIT01'), { nombre: 'Ficticia Uno', correo: 'crit@uc.cl' });
    await setDoc(doc(db, 'invitaciones/INVITA01'), { grupo: 'criterium', participante: 'P-NUEVO1', usada: false, usadaPor: '' });
    await setDoc(doc(db, 'feed/post1'), { tipo: 'publicacion', estado: 'publicado', txt: 'Hola', autorUid: U.libre.uid, autor: { uid: U.libre.uid, nombre: 'X' }, likes: 0, likedBy: [], respuestas: [] });
    await setDoc(doc(db, 'comentarios/c1'), { protoId: 'resina-clase-i', paso: 0, txt: 'ok', uid: U.dentista.uid });
    await setDoc(doc(db, 'perfiles', U.libre.uid), { nombre: 'Libre' });
    await setDoc(doc(db, 'eventos_uso/e1'), { codigo: 'P-CRIT01', sesion: 's', tipo: 'sesion_inicio', protoId: '', fecha: Timestamp.now() });
  });
});
const publicados = (db, estudio) => query(collection(db, 'protocolos'), ...[where('publicado', '==', true), ...(estudio ? [where('estudio', '==', true)] : [])]);

// ── Sin cuenta (lo más cercano a un paciente hoy: el rol paciente llega con el módulo E) ──
test('sin cuenta: no lee protocolos, PDF, comentarios ni el feed', async () => {
  const db = anonimo();
  await assertFails(getDoc(doc(db, 'protocolos/resina-clase-i')));
  await assertFails(getDocs(publicados(db)));
  await assertFails(getDoc(doc(db, 'protocolos/resina-clase-i/archivos/pdf')));
  await assertFails(getDocs(collection(db, 'comentarios')));
  await assertFails(getDoc(doc(db, 'feed/post1')));
  await assertSucceeds(getDoc(doc(db, 'config/piloto'))); // la configuración sí (el registro la necesita)
});

// ── Estudiante sin piloto y dentista: todo como hoy ──
for (const k of ['libre', 'dentista']) {
  test(k + ': lee todos los protocolos publicados, su PDF, el feed y los comentarios', async () => {
    const db = como(U[k]);
    const s = await assertSucceeds(getDocs(publicados(db)));
    if (s.size !== 2) throw new Error('esperaba 2 protocolos, llegaron ' + s.size);
    await assertSucceeds(getDoc(doc(db, 'protocolos/cementado-pmma/archivos/pdf')));
    await assertSucceeds(getDoc(doc(db, 'feed/post1')));
    await assertSucceeds(getDocs(collection(db, 'comentarios')));
    await assertFails(addDoc(collection(db, 'eventos_uso'), { codigo: 'P-CRIT01', sesion: 's', tipo: 'sesion_inicio', protoId: '', fecha: serverTimestamp() }));
  });
}

// ── Grupo criterium ──
test('criterium: solo los protocolos del estudio (y su PDF)', async () => {
  const db = como(U.crit);
  const s = await assertSucceeds(getDocs(publicados(db, true)));
  if (s.size !== 1 || s.docs[0].id !== 'resina-clase-i') throw new Error('esperaba solo resina-clase-i');
  await assertSucceeds(getDoc(doc(db, 'protocolos/resina-clase-i/archivos/pdf')));
  await assertFails(getDoc(doc(db, 'protocolos/cementado-pmma')));
  await assertFails(getDoc(doc(db, 'protocolos/cementado-pmma/archivos/pdf')));
  await assertFails(getDocs(publicados(db))); // una consulta que podría traer otros se rechaza entera
});
test('criterium: sin feed, comentarios ni red mientras MODULOS_NUEVOS_EN_PILOTO=false', async () => {
  const db = como(U.crit);
  await assertFails(getDoc(doc(db, 'feed/post1')));
  await assertFails(getDocs(collection(db, 'comentarios')));
  await assertFails(setDoc(doc(db, 'feed/nuevo'), { tipo: 'publicacion', txt: 'x', autorUid: U.crit.uid, autor: { uid: U.crit.uid, nombre: 'X' } }));
});
test('criterium: registra uso solo con su propio código y no lee los eventos ni las identidades', async () => {
  const db = como(U.crit);
  await assertSucceeds(addDoc(collection(db, 'eventos_uso'), { codigo: 'P-CRIT01', sesion: 'abc', tipo: 'protocolo_abierto', protoId: 'resina-clase-i', fecha: serverTimestamp() }));
  await assertFails(addDoc(collection(db, 'eventos_uso'), { codigo: 'P-HAB001', sesion: 'abc', tipo: 'protocolo_abierto', protoId: 'x', fecha: serverTimestamp() }));
  await assertFails(addDoc(collection(db, 'eventos_uso'), { codigo: 'P-CRIT01', sesion: 'abc', tipo: 'protocolo_abierto', protoId: 'x', fecha: serverTimestamp(), uid: U.crit.uid }));
  await assertFails(getDocs(collection(db, 'eventos_uso')));
  await assertFails(getDoc(doc(db, 'identidades/P-CRIT01')));
  await assertSucceeds(getDoc(doc(db, 'participantes', U.crit.uid)));
  await assertFails(updateDoc(doc(db, 'participantes', U.crit.uid), { grupo: 'habitual' }));
});

// ── Grupo habitual ──
test('habitual: ningún protocolo ni PDF antes de la apertura, aunque llame directo', async () => {
  const db = como(U.hab);
  await assertFails(getDoc(doc(db, 'protocolos/resina-clase-i')));
  await assertFails(getDoc(doc(db, 'protocolos/cementado-pmma')));
  await assertFails(getDocs(publicados(db)));
  await assertFails(getDocs(publicados(db, true)));
  await assertFails(getDoc(doc(db, 'protocolos/resina-clase-i/archivos/pdf')));
  await assertFails(getDoc(doc(db, 'feed/post1')));
});
test('«Abrir todo»: el habitual ve todo y los dos grupos recuperan la red', async () => {
  await env.withSecurityRulesDisabled(async (c) => updateDoc(doc(c.firestore(), 'config/piloto'), { abierto: true }));
  const hab = como(U.hab);
  const s = await assertSucceeds(getDocs(publicados(hab)));
  if (s.size !== 2) throw new Error('esperaba 2');
  await assertSucceeds(getDoc(doc(hab, 'protocolos/cementado-pmma/archivos/pdf')));
  await assertSucceeds(getDoc(doc(hab, 'feed/post1')));
  await assertSucceeds(getDoc(doc(como(U.crit), 'feed/post1')));
});
test('al llegar la fecha de apertura se abre igual que con el botón', async () => {
  await env.withSecurityRulesDisabled(async (c) => updateDoc(doc(c.firestore(), 'config/piloto'), { apertura: Timestamp.fromDate(new Date('2020-01-01')) }));
  await assertSucceeds(getDoc(doc(como(U.hab), 'protocolos/cementado-pmma')));
});

// ── Registro UC por invitación ──
test('correo UC sin invitación: la cuenta existe pero no recibe nada', async () => {
  const db = como(U.ucSinInvitacion);
  await assertFails(getDocs(publicados(db)));
  await assertFails(getDoc(doc(db, 'perfiles', U.libre.uid)));
  await assertFails(setDoc(doc(db, 'usuarios', U.ucSinInvitacion.uid), { nombre: 'X' }));
  await assertSucceeds(getDoc(doc(como(U.docenteUC), 'perfiles', U.libre.uid))); // docentes y equipo quedan exentos
});
test('invitación: se usa una vez y deja a la persona en el grupo que trae', async () => {
  const db = como(U.nuevo);
  const b = writeBatch(db);
  b.update(doc(db, 'invitaciones/INVITA01'), { usada: true, usadaPor: U.nuevo.uid, fechaUso: serverTimestamp() });
  b.set(doc(db, 'participantes', U.nuevo.uid), { grupo: 'criterium', codigo: 'P-NUEVO1', invitacion: 'INVITA01', fecha: serverTimestamp() });
  await assertSucceeds(b.commit());
  await assertSucceeds(setDoc(doc(db, 'usuarios', U.nuevo.uid), { nombre: 'Nuevo' })); // ya habilitado
  // Nadie más puede reutilizarla
  const otro = como(U.ucSinInvitacion); const b2 = writeBatch(otro);
  b2.update(doc(otro, 'invitaciones/INVITA01'), { usada: true, usadaPor: U.ucSinInvitacion.uid, fechaUso: serverTimestamp() });
  b2.set(doc(otro, 'participantes', U.ucSinInvitacion.uid), { grupo: 'criterium', codigo: 'P-NUEVO1', invitacion: 'INVITA01', fecha: serverTimestamp() });
  await assertFails(b2.commit());
});
test('invitación: no se puede elegir otro grupo ni otro código', async () => {
  const db = como(U.nuevo); const b = writeBatch(db);
  b.update(doc(db, 'invitaciones/INVITA01'), { usada: true, usadaPor: U.nuevo.uid, fechaUso: serverTimestamp() });
  b.set(doc(db, 'participantes', U.nuevo.uid), { grupo: 'habitual', codigo: 'P-NUEVO1', invitacion: 'INVITA01', fecha: serverTimestamp() });
  await assertFails(b.commit());
});
test('nadie se asigna un grupo sin invitación', async () => {
  await assertFails(setDoc(doc(como(U.libre), 'participantes', U.libre.uid), { grupo: 'criterium', codigo: 'P-X' }));
});

// ── Versión congelada ──
test('congelados: el equipo no edita los protocolos del estudio, pero guarda versiones sin publicar', async () => {
  const db = como(U.admin);
  await assertFails(updateDoc(doc(db, 'protocolos/resina-clase-i'), { json: '{"cambio":1}' }));
  await assertFails(setDoc(doc(db, 'protocolos/resina-clase-i/archivos/pdf'), { nombre: 'r.pdf', base64: 'BB==' }));
  await assertSucceeds(addDoc(collection(db, 'protocolos/resina-clase-i/versiones'), { json: '{"cambio":1}', publicado: false }));
  await assertFails(addDoc(collection(db, 'protocolos/resina-clase-i/versiones'), { json: '{"cambio":1}', publicado: true }));
  await assertSucceeds(updateDoc(doc(db, 'protocolos/cementado-pmma'), { json: '{"cambio":1}' })); // no es del estudio
});
test('nadie fuera del equipo escribe protocolos ni la configuración', async () => {
  const db = como(U.dentista);
  await assertFails(updateDoc(doc(db, 'protocolos/cementado-pmma'), { json: '{}' }));
  await assertFails(updateDoc(doc(db, 'config/piloto'), { abierto: true }));
});
test('el equipo lee los eventos y las identidades', async () => {
  const db = como(U.admin);
  await assertSucceeds(getDocs(collection(db, 'eventos_uso')));
  await assertSucceeds(getDoc(doc(db, 'identidades/P-CRIT01')));
});

// ── Lo de siempre sigue igual para quien no participa ──
test('sin piloto: publica, da «me sirve» y responde como antes', async () => {
  const db = como(U.libre);
  await assertSucceeds(setDoc(doc(db, 'feed/nuevo'), { tipo: 'publicacion', estado: 'publicado', txt: 'Hola a todos', autorUid: U.libre.uid, autor: { uid: U.libre.uid, nombre: 'Libre', verificado: false }, likes: 0, likedBy: [], respuestas: [], fecha: '2026-10-07' }));
  await assertSucceeds(updateDoc(doc(db, 'feed/post1'), { likes: 1, likedBy: [U.libre.uid] }));
  await assertSucceeds(updateDoc(doc(como(U.dentista), 'feed/post1'), { respuestas: [{ id: 'r1', autor: { uid: U.dentista.uid, nombre: 'D', verificado: false }, txt: 'Bien', fecha: '2026-10-07' }] }));
  await assertSucceeds(setDoc(doc(db, 'usuarios', U.libre.uid), { nombre: 'Libre' }));
});
