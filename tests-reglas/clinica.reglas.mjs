// Pruebas de las reglas de la Clínica, Investigaciones y Concursos, con usuarios ficticios, en el emulador (necesita Java).
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, collection, query, where, writeBatch, increment } from 'firebase/firestore';

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

/* ── Evolución con protocolo: evolución + descuento de stock + movimientos en un solo batch ── */
const PROTO = { id: 'resina-clase-i', version: '0.2', sha256: 'abc123', titulo: 'Restauración de resina compuesta clase I oclusal' };
const evoProto = (uid, extra = {}) => ({ nota: 'Resina clase I. Pasos: 9 de 9 hechos.', diente: '3.6', procedimiento: PROTO.titulo, lote: 'L-1', firmada: true, profesional: { uid, nombre: 'O' }, fecha: ahora(), protocolo: PROTO, pasos: [{ i: 0, corto: 'Aísla', estado: 'hecho', nota: '' }], insumos: [{ insumoId: 'res', nombre: 'Resina compuesta A2', cantidad: 1 }, { insumoId: 'aci', nombre: 'Ácido ortofosfórico 37 %', cantidad: 1 }], ...extra });
async function sembrarInventario() {
  await env.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), 'clinicas', C, 'inventario', 'res'), { nombre: 'Resina compuesta A2', stock: 5, minimo: 4 });
    await setDoc(doc(c.firestore(), 'clinicas', C, 'inventario', 'aci'), { nombre: 'Ácido ortofosfórico 37 %', stock: 3, minimo: 3 });
  });
}
function batchFirma(db, eid, uid) {
  const b = writeBatch(db);
  b.set(doc(db, 'clinicas', C, 'pacientes', 'p1', 'evoluciones', eid), evoProto(uid));
  for (const id of ['res', 'aci']) {
    b.update(doc(db, 'clinicas', C, 'inventario', id), { stock: increment(-1) });
    b.set(doc(db, 'clinicas', C, 'inventario', id, 'movimientos', eid + '_' + id), { tipo: 'salida', cantidad: 1, nota: 'Consumo en atención clínica', por: { uid, nombre: 'O' }, evolucionId: eid, fecha: ahora() });
  }
  return b.commit();
}
test('evolución con protocolo: un solo batch firma, descuenta el stock y deja los movimientos', async () => {
  await sembrarInventario();
  await assertSucceeds(batchFirma(como(ODO), 'ev-proto', ODO));
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    const ev = (await getDoc(doc(db, 'clinicas', C, 'pacientes', 'p1', 'evoluciones', 'ev-proto'))).data();
    if (ev.protocolo.sha256 !== 'abc123' || ev.pasos.length !== 1 || ev.insumos.length !== 2) throw new Error('evolución incompleta');
    if ((await getDoc(doc(db, 'clinicas', C, 'inventario', 'res'))).data().stock !== 4) throw new Error('stock de resina');
    if ((await getDoc(doc(db, 'clinicas', C, 'inventario', 'aci'))).data().stock !== 2) throw new Error('stock de ácido');
  });
});
test('el mismo batch repetido (doble clic) falla entero: una evolución y el stock descontado una vez', async () => {
  await sembrarInventario();
  await assertSucceeds(batchFirma(como(ODO), 'ev-doble', ODO));
  await assertFails(batchFirma(como(ODO), 'ev-doble', ODO));
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    if ((await getDoc(doc(db, 'clinicas', C, 'inventario', 'res'))).data().stock !== 4) throw new Error('se descontó dos veces');
    if ((await getDocs(collection(db, 'clinicas', C, 'inventario', 'res', 'movimientos'))).size !== 1) throw new Error('movimiento duplicado');
  });
});
test('evolución con protocolo: no se edita ni se borra, y los campos nuevos se validan', async () => {
  await assertSucceeds(setDoc(doc(como(ODO), 'clinicas', C, 'pacientes', 'p1', 'evoluciones', 'ev2'), evoProto(ODO)));
  await assertFails(updateDoc(doc(como(ODO), 'clinicas', C, 'pacientes', 'p1', 'evoluciones', 'ev2'), { nota: 'cambiada' }));
  await assertFails(deleteDoc(doc(como(ADM), 'clinicas', C, 'pacientes', 'p1', 'evoluciones', 'ev2')));
  await assertFails(setDoc(doc(como(ODO), 'clinicas', C, 'pacientes', 'p1', 'evoluciones', 'ev3'), evoProto(ODO, { protocolo: 'resina-clase-i' })));
  await assertFails(setDoc(doc(como(ODO), 'clinicas', C, 'pacientes', 'p1', 'evoluciones', 'ev4'), evoProto(ODO, { pasos: Array.from({ length: 81 }, (_, i) => ({ i })) })));
  await assertFails(setDoc(doc(como(ODO), 'clinicas', C, 'pacientes', 'p1', 'evoluciones', 'ev5'), evoProto(ODO, { insumos: 'resina' })));
});
test('recepción no lee la evolución, pero sí los movimientos, que no traen datos clínicos', async () => {
  await sembrarInventario();
  await batchFirma(como(ODO), 'ev-rec', ODO);
  await assertFails(getDoc(doc(como(REC), 'clinicas', C, 'pacientes', 'p1', 'evoluciones', 'ev-rec')));
  const m = await assertSucceeds(getDoc(doc(como(REC), 'clinicas', C, 'inventario', 'res', 'movimientos', 'ev-rec_res')));
  const claves = Object.keys(m.data()).sort().join(',');
  if (claves !== 'cantidad,evolucionId,fecha,nota,por,tipo') throw new Error('el movimiento trae otros campos: ' + claves);
});
test('un movimiento con evolucionId que no es texto se rechaza', async () => {
  await sembrarInventario();
  await assertFails(setDoc(doc(como(ODO), 'clinicas', C, 'inventario', 'res', 'movimientos', 'm1'), { tipo: 'salida', cantidad: 1, por: { uid: ODO }, evolucionId: 42, fecha: ahora() }));
  await assertSucceeds(setDoc(doc(como(ODO), 'clinicas', C, 'inventario', 'res', 'movimientos', 'm2'), { tipo: 'salida', cantidad: 1, por: { uid: ODO }, evolucionId: 'ev-x', fecha: ahora() }));
});
