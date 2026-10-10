// Pruebas de las reglas de la Clínica, Investigaciones y Concursos, con usuarios ficticios, en el emulador (necesita Java).
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, collection, query, where } from 'firebase/firestore';

let env;
const ADM = 'adm-clinica', ODO = 'odonto', REC = 'recepcion', EXT = 'externo', EQ = 'equipo';
const como = (u) => env.authenticatedContext(u, { email: u + '@correo.cl', email_verified: true }).firestore();
const ahora = () => new Date().toISOString();
const C = 'clinica-demo';

before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-criterium', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 } }); });
after(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    await setDoc(doc(db, 'admins', EQ), { nombre: 'Equipo' });
    await setDoc(doc(db, 'clinicas', C), { nombre: 'Demo', demo: true, miembros: { [ADM]: 'admin', [ODO]: 'odontologo', [REC]: 'recepcion' } });
    await setDoc(doc(db, 'clinicas', C, 'pacientes', 'p1'), { nombres: 'Ficticio', apellidos: 'Uno', ficticio: true });
    await setDoc(doc(db, 'clinicas', C, 'pacientes', 'p1', 'clinico', 'ficha'), { alergias: 'ninguna' });
    await setDoc(doc(db, 'clinicas', C, 'pacientes', 'p1', 'evoluciones', 'e1'), { nota: 'x', profesional: { uid: ODO }, firmada: true, fecha: ahora() });
  });
});

test('solo los miembros ven la clínica y sus pacientes', async () => {
  await assertSucceeds(getDoc(doc(como(REC), 'clinicas', C)));
  await assertSucceeds(getDoc(doc(como(REC), 'clinicas', C, 'pacientes', 'p1')));
  await assertFails(getDoc(doc(como(EXT), 'clinicas', C)));
  await assertFails(getDoc(doc(como(EXT), 'clinicas', C, 'pacientes', 'p1')));
});
test('cada uno lista solo las clínicas donde es miembro', async () => {
  await assertSucceeds(getDocs(query(collection(como(ODO), 'clinicas'), where('miembros.' + ODO, 'in', ['admin', 'odontologo', 'recepcion']))));
  await assertFails(getDocs(query(collection(como(EXT), 'clinicas'), where('miembros.' + ODO, 'in', ['admin', 'odontologo', 'recepcion']))));
});
test('recepción no ve lo clínico; el odontólogo sí', async () => {
  await assertFails(getDoc(doc(como(REC), 'clinicas', C, 'pacientes', 'p1', 'clinico', 'ficha')));
  await assertFails(getDocs(collection(como(REC), 'clinicas', C, 'pacientes', 'p1', 'evoluciones')));
  await assertSucceeds(getDoc(doc(como(ODO), 'clinicas', C, 'pacientes', 'p1', 'clinico', 'ficha')));
});
test('las evoluciones se firman a nombre propio y no se editan ni se borran', async () => {
  await assertSucceeds(addDoc(collection(como(ODO), 'clinicas', C, 'pacientes', 'p1', 'evoluciones'), { nota: 'control', profesional: { uid: ODO }, firmada: true, fecha: ahora() }));
  await assertFails(addDoc(collection(como(ODO), 'clinicas', C, 'pacientes', 'p1', 'evoluciones'), { nota: 'suplantada', profesional: { uid: ADM }, firmada: true, fecha: ahora() }));
  await assertFails(updateDoc(doc(como(ODO), 'clinicas', C, 'pacientes', 'p1', 'evoluciones', 'e1'), { nota: 'cambiada' }));
  await assertFails(deleteDoc(doc(como(ADM), 'clinicas', C, 'pacientes', 'p1', 'evoluciones', 'e1')));
});
test('nadie borra pacientes; recepción agenda citas pero no crea presupuestos', async () => {
  await assertFails(deleteDoc(doc(como(ADM), 'clinicas', C, 'pacientes', 'p1')));
  await assertSucceeds(addDoc(collection(como(REC), 'clinicas', C, 'citas'), { pacienteId: 'p1', fecha: '2026-10-12', hora: '10:00', estado: 'agendada' }));
  await assertFails(addDoc(collection(como(REC), 'clinicas', C, 'presupuestos'), { pacienteId: 'p1', items: [], total: 0 }));
  await assertSucceeds(addDoc(collection(como(ODO), 'clinicas', C, 'presupuestos'), { pacienteId: 'p1', items: [], total: 0 }));
});
test('los pagos van a nombre propio, con monto positivo, y no se editan', async () => {
  await assertSucceeds(addDoc(collection(como(REC), 'clinicas', C, 'pagos'), { pacienteId: 'p1', monto: 15000, registradoPor: { uid: REC }, fecha: ahora() }));
  await assertFails(addDoc(collection(como(REC), 'clinicas', C, 'pagos'), { pacienteId: 'p1', monto: -5, registradoPor: { uid: REC }, fecha: ahora() }));
  await assertFails(addDoc(collection(como(EXT), 'clinicas', C, 'pagos'), { pacienteId: 'p1', monto: 100, registradoPor: { uid: EXT }, fecha: ahora() }));
});
test('el registro de accesos lo lee solo el administrador', async () => {
  await assertSucceeds(addDoc(collection(como(REC), 'clinicas', C, 'accesos'), { uid: REC, pacienteId: 'p1', fecha: ahora() }));
  await assertFails(getDocs(collection(como(REC), 'clinicas', C, 'accesos')));
  await assertSucceeds(getDocs(collection(como(ADM), 'clinicas', C, 'accesos')));
});
test('las clínicas las crea solo el equipo Criterium', async () => {
  await assertFails(setDoc(doc(como(ADM), 'clinicas', 'otra'), { nombre: 'X', miembros: { [ADM]: 'admin' } }));
  await assertSucceeds(setDoc(doc(como(EQ), 'clinicas', 'otra'), { nombre: 'X', demo: true, miembros: { [ADM]: 'admin' } }));
});
test('investigaciones: a nombre propio; «Me interesa» solo con el propio uid', async () => {
  const inv = { autorUid: ODO, autor: { uid: ODO, nombre: 'O' }, titulo: 'Un trabajo de prueba', likedBy: [], fecha: ahora() };
  await assertFails(setDoc(doc(como(EXT), 'investigaciones', 'i1'), inv));
  await assertSucceeds(setDoc(doc(como(ODO), 'investigaciones', 'i1'), inv));
  await assertSucceeds(updateDoc(doc(como(EXT), 'investigaciones', 'i1'), { likedBy: [EXT] }));
  await assertFails(updateDoc(doc(como(EXT), 'investigaciones', 'i1'), { titulo: 'Cambiado por otro' }));
});
test('convocatorias: solo el equipo publica', async () => {
  await assertFails(addDoc(collection(como(ODO), 'convocatorias'), { titulo: 'X', cierre: '2026-11-01' }));
  await assertSucceeds(addDoc(collection(como(EQ), 'convocatorias'), { titulo: 'X', cierre: '2026-11-01' }));
});
test('esterilización y cierres de caja: a nombre propio y sin editar', async () => {
  await assertSucceeds(addDoc(collection(como(REC), 'clinicas', C, 'esterilizacion'), { ciclo: 12, responsable: { uid: REC }, quimico: 'ok', fecha: ahora() }));
  await assertFails(addDoc(collection(como(REC), 'clinicas', C, 'esterilizacion'), { ciclo: 13, responsable: { uid: ODO }, fecha: ahora() }));
  await env.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'clinicas', C, 'esterilizacion', 'e1'), { ciclo: 1, responsable: { uid: REC } }); });
  await assertFails(updateDoc(doc(como(ADM), 'clinicas', C, 'esterilizacion', 'e1'), { quimico: 'falla' }));
  await assertSucceeds(addDoc(collection(como(REC), 'clinicas', C, 'cierres'), { fecha: '2026-10-10', total: 100, por: { uid: REC } }));
});
test('gastos: cualquier miembro registra, solo administración los ve', async () => {
  await assertSucceeds(addDoc(collection(como(REC), 'clinicas', C, 'gastos'), { monto: 12000, concepto: 'Insumos', registradoPor: { uid: REC }, fecha: ahora() }));
  await assertFails(getDocs(collection(como(REC), 'clinicas', C, 'gastos')));
  await assertSucceeds(getDocs(collection(como(ADM), 'clinicas', C, 'gastos')));
});
test('plan de tratamiento: recepción lo ve pero no lo arma', async () => {
  await assertFails(addDoc(collection(como(REC), 'clinicas', C, 'planes'), { pacienteId: 'p1', fases: [] }));
  await assertSucceeds(addDoc(collection(como(ODO), 'clinicas', C, 'planes'), { pacienteId: 'p1', fases: [] }));
  await assertSucceeds(getDocs(collection(como(REC), 'clinicas', C, 'planes')));
});
test('inventario: movimientos a nombre propio, con cantidad positiva, y un externo no entra', async () => {
  await env.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'clinicas', C, 'inventario', 'i1'), { nombre: 'Guantes', stock: 10 }); });
  await assertSucceeds(addDoc(collection(como(REC), 'clinicas', C, 'inventario', 'i1', 'movimientos'), { tipo: 'salida', cantidad: 2, por: { uid: REC }, fecha: ahora() }));
  await assertFails(addDoc(collection(como(REC), 'clinicas', C, 'inventario', 'i1', 'movimientos'), { tipo: 'salida', cantidad: 0, por: { uid: REC }, fecha: ahora() }));
  await assertFails(getDoc(doc(como(EXT), 'clinicas', C, 'inventario', 'i1')));
});
