// Pruebas de las reglas de Revisores (borradores, revisiones del panel y tramos), con usuarios ficticios, en el emulador.
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, collection, query, where } from 'firebase/firestore';

let env;
const EST = 'estudiante', DEN = 'dentista', DOC = 'docente', REV = 'rev-endo', REV2 = 'rev-endo-2', PER = 'rev-perio', EQ = 'equipo';
const como = (u) => env.authenticatedContext(u, { email: u + '@correo.cl', email_verified: true }).firestore();
const ahora = () => new Date().toISOString();
const borr = (uid, extra = {}) => ({ tipo: 'protocolo', titulo: 'Pulpotomía en molar temporal', especialidad: 'Endodoncia', autor: { uid, nombre: 'A' }, declaracion: true, estado: 'borrador', ronda: 0, contenido: { pasos: [{ corto: 'Aísla' }, { corto: 'Abre' }] }, creado: ahora(), ...extra });
const revision = (bid, ronda, uid, autorUid, extra = {}) => ({ borradorId: bid, tipo: 'protocolo', ronda, revisor: { uid, nombre: 'R' }, autorUid, puntajes: [{ i: 0, pertinencia: 5, claridad: 4, respaldo: 4 }, { i: 1, pertinencia: 4, claridad: 4, respaldo: 5 }], correcciones: [], comentario: 'Bien fundamentado; aclarar el tiempo de hemostasia en el paso dos.', fecha: ahora(), ...extra });

before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-criterium', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 } }); });
after(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    await setDoc(doc(db, 'admins', EQ), { nombre: 'Equipo' });
    await setDoc(doc(db, 'docentes', DOC), { nombre: 'Docente' });
    await setDoc(doc(db, 'revisores', REV), { nombre: 'Endo 1', especialidades: ['Endodoncia'] });
    await setDoc(doc(db, 'revisores', REV2), { nombre: 'Endo 2', especialidades: ['Endodoncia'] });
    await setDoc(doc(db, 'revisores', PER), { nombre: 'Perio', especialidades: ['Periodoncia'] });
  });
});
const sembrar = (id, datos) => env.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'borradores', id), datos); });

test('subir borrador de protocolo: cualquiera que declare haberlo hecho; materia solo especialistas o docentes', async () => {
  await assertSucceeds(setDoc(doc(como(EST), 'borradores', 'b1'), borr(EST)));
  await assertFails(setDoc(doc(como(DEN), 'borradores', 'b2'), borr(DEN, { declaracion: false })));
  await assertFails(setDoc(doc(como(DEN), 'borradores', 'b3'), borr(EST)));
  await assertFails(setDoc(doc(como(DEN), 'borradores', 'b4'), borr(DEN, { estado: 'aprobado' })));
  const mat = (uid) => ({ ...borr(uid), tipo: 'materia', declaracion: false, contenido: { html: '<p>clase</p>' } });
  await assertFails(setDoc(doc(como(EST), 'borradores', 'm1'), mat(EST)));
  await assertSucceeds(setDoc(doc(como(DOC), 'borradores', 'm2'), mat(DOC)));
  await assertSucceeds(setDoc(doc(como(REV), 'borradores', 'm3'), mat(REV)));
});
test('ver borradores: solo especialistas verificados, docentes, el equipo y su autor', async () => {
  await sembrar('b1', borr(EST));
  await assertSucceeds(getDoc(doc(como(EST), 'borradores', 'b1')));
  await assertFails(getDoc(doc(como(DEN), 'borradores', 'b1')));
  await assertSucceeds(getDoc(doc(como(DOC), 'borradores', 'b1')));
  await assertSucceeds(getDoc(doc(como(PER), 'borradores', 'b1')));
  await assertSucceeds(getDoc(doc(como(EQ), 'borradores', 'b1')));
  await assertFails(getDocs(collection(como(DEN), 'borradores')));
  await assertSucceeds(getDocs(query(collection(como(DEN), 'borradores'), where('autor.uid', '==', DEN))));
});
test('el autor envía a revisión (ronda +1, máximo 2) y no puede aprobarse solo', async () => {
  await sembrar('b1', borr(EST));
  await assertFails(updateDoc(doc(como(EST), 'borradores', 'b1'), { estado: 'aprobado' }));
  await assertFails(updateDoc(doc(como(EST), 'borradores', 'b1'), { estado: 'revision', ronda: 2 }));
  await assertSucceeds(updateDoc(doc(como(EST), 'borradores', 'b1'), { estado: 'revision', ronda: 1 }));
  await assertFails(updateDoc(doc(como(EST), 'borradores', 'b1'), { titulo: 'Cambio durante la revisión' }));
  await assertSucceeds(updateDoc(doc(como(EQ), 'borradores', 'b1'), { estado: 'correcciones' }));
  await assertSucceeds(updateDoc(doc(como(EST), 'borradores', 'b1'), { titulo: 'Corregido', estado: 'revision', ronda: 2 }));
  await assertSucceeds(updateDoc(doc(como(EQ), 'borradores', 'b1'), { estado: 'correcciones' }));
  await assertFails(updateDoc(doc(como(EST), 'borradores', 'b1'), { estado: 'revision', ronda: 3 }));
  await assertFails(updateDoc(doc(como(DEN), 'borradores', 'b1'), { titulo: 'Ajeno' }));
});
test('revisar: solo revisores de esa especialidad, nunca el autor, una vez por ronda y sin editar', async () => {
  await sembrar('b1', borr(EST, { estado: 'revision', ronda: 1 }));
  await assertSucceeds(setDoc(doc(como(REV), 'revisionesBorrador', 'b1_1_' + REV), revision('b1', 1, REV, EST)));
  await assertFails(setDoc(doc(como(PER), 'revisionesBorrador', 'b1_1_' + PER), revision('b1', 1, PER, EST)));
  await assertFails(setDoc(doc(como(DOC), 'revisionesBorrador', 'b1_1_' + DOC), revision('b1', 1, DOC, EST)));
  await assertFails(setDoc(doc(como(REV2), 'revisionesBorrador', 'b1_2_' + REV2), revision('b1', 2, REV2, EST)));
  await assertFails(setDoc(doc(como(REV2), 'revisionesBorrador', 'otro-id'), revision('b1', 1, REV2, EST)));
  await assertFails(setDoc(doc(como(REV2), 'revisionesBorrador', 'b1_1_' + REV2), revision('b1', 1, REV2, EST, { comentario: 'corto' })));
  await assertFails(updateDoc(doc(como(REV), 'revisionesBorrador', 'b1_1_' + REV), { comentario: 'Cambio el comentario después de enviarlo, no se puede.' }));
  await assertFails(deleteDoc(doc(como(EQ), 'revisionesBorrador', 'b1_1_' + REV)));
  await sembrar('b2', borr(REV, { estado: 'revision', ronda: 1 }));
  await assertFails(setDoc(doc(como(REV), 'revisionesBorrador', 'b2_1_' + REV), revision('b2', 1, REV, REV)));
});
test('el autor lee las revisiones de su borrador; otros sin rol no', async () => {
  await sembrar('b1', borr(EST, { estado: 'revision', ronda: 1 }));
  await setDoc(doc(como(REV), 'revisionesBorrador', 'b1_1_' + REV), revision('b1', 1, REV, EST));
  await assertSucceeds(getDocs(query(collection(como(EST), 'revisionesBorrador'), where('borradorId', '==', 'b1'), where('autorUid', '==', EST))));
  await assertFails(getDocs(query(collection(como(DEN), 'revisionesBorrador'), where('borradorId', '==', 'b1'))));
});
test('tramos: cada revisor verificado elige el suyo, con valores válidos', async () => {
  await assertSucceeds(setDoc(doc(como(REV), 'tramos', REV), { protocolo: 5, materia: 1, cicloInicio: '2026-10-01' }));
  await assertFails(setDoc(doc(como(REV), 'tramos', REV), { protocolo: 4, materia: 1, cicloInicio: '2026-10-01' }));
  await assertFails(setDoc(doc(como(DEN), 'tramos', DEN), { protocolo: 3, materia: 0, cicloInicio: '2026-10-01' }));
  await assertFails(getDoc(doc(como(REV2), 'tramos', REV)));
});
