// Datos de la sección Clínica (gestión clínica dentro de Criterium) y de Universidad › Investigaciones y Concursos.
// Clínica: clinicas/{cid} { nombre, demo, boxes [], profesionales [{ id, nombre, especialidad }], arancel [{ codigo, nombre, valor }],
//   miembros { uid: 'admin' | 'odontologo' | 'recepcion' } }, con subcolecciones:
//   pacientes/{pid}          datos administrativos (nombre, RUT, contacto, previsión, ficticio)
//   pacientes/{pid}/clinico/ficha   antecedentes y odontograma (solo admin y odontólogo)
//   pacientes/{pid}/evoluciones     notas clínicas firmadas: no se editan ni se borran (se corrige con una nueva)
//   pacientes/{pid}/documentos      consentimientos, recetas, certificados e indicaciones emitidos (no se editan)
//   citas, presupuestos, pagos (los pagos no se editan) y accesos (registro de quién abrió cada ficha)
//   planes (plan de tratamiento por fases), laboratorio (órdenes de trabajo), inventario (+ movimientos), esterilizacion
//   (ciclos: no se editan), gastos y cierres de caja (no se editan), tareas y espera (lista de espera)
// Todo lo validan las reglas (firestore.rules · Clínica). Mientras no haya revisión legal, solo clínicas de demostración.
import { useEffect, useState } from 'react';
import { collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, query, where, orderBy, limit, onSnapshot, writeBatch, increment } from 'firebase/firestore';
import { db } from '../firebase.js';

const ahora = () => new Date().toISOString();
const vivo = (ref, set, mapa) => onSnapshot(ref, (s) => set(mapa(s)), () => set(mapa(null)));
const docs = (s) => (s ? s.docs.map((d) => ({ ...d.data(), id: d.id })) : []);

/* ── Clínica ── */
// Las clínicas donde soy miembro (el mapa miembros lleva mi uid como clave)
export function useMisClinicas(uid) {
  const [l, set] = useState(null);
  useEffect(() => {
    if (!uid) { set([]); return; }
    return onSnapshot(query(collection(db, 'clinicas'), where('miembros.' + uid, 'in', ['admin', 'odontologo', 'recepcion'])), (s) => set(docs(s)), () => set([]));
  }, [uid]);
  return l;
}
export function usePacientes(cid) {
  const [l, set] = useState(null);
  useEffect(() => { if (!cid) { set([]); return; } return vivo(collection(db, 'clinicas', cid, 'pacientes'), set, (s) => docs(s).sort((a, b) => (a.apellidos || '').localeCompare(b.apellidos || ''))); }, [cid]);
  return l;
}
export function usePaciente(cid, pid) {
  const [p, set] = useState(undefined);
  useEffect(() => { if (!cid || !pid) { set(null); return; } return onSnapshot(doc(db, 'clinicas', cid, 'pacientes', pid), (s) => set(s.exists() ? { ...s.data(), id: s.id } : null), () => set(null)); }, [cid, pid]);
  return p;
}
export function useFicha(cid, pid, activo = true) {
  const [f, set] = useState(undefined);
  useEffect(() => { if (!cid || !pid || !activo) { set(null); return; } return onSnapshot(doc(db, 'clinicas', cid, 'pacientes', pid, 'clinico', 'ficha'), (s) => set(s.exists() ? s.data() : {}), () => set(null)); }, [cid, pid, activo]);
  return f;
}
export function useSub(cid, pid, sub, activo = true) {
  const [l, set] = useState(null);
  useEffect(() => { if (!cid || !pid || !activo) { set([]); return; } return vivo(query(collection(db, 'clinicas', cid, 'pacientes', pid, sub), orderBy('fecha', 'desc'), limit(200)), set, docs); }, [cid, pid, sub, activo]);
  return l;
}
// Citas entre dos fechas 'AAAA-MM-DD' (incluidas)
export function useCitas(cid, desde, hasta) {
  const [l, set] = useState(null);
  useEffect(() => { if (!cid) { set([]); return; } return vivo(query(collection(db, 'clinicas', cid, 'citas'), where('fecha', '>=', desde), where('fecha', '<=', hasta)), set, docs); }, [cid, desde, hasta]);
  return l;
}
export function useColeccionClinica(cid, col, campo, valor) {
  const [l, set] = useState(null);
  useEffect(() => {
    if (!cid || !col) { set([]); return; }
    const q = campo ? query(collection(db, 'clinicas', cid, col), where(campo, '==', valor)) : collection(db, 'clinicas', cid, col);
    return vivo(q, set, (s) => docs(s).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')));
  }, [cid, col, campo, valor]);
  return l;
}
export const guardarPacienteFS = async (cid, p) => {
  const { id, ...datos } = p;
  if (id) { await updateDoc(doc(db, 'clinicas', cid, 'pacientes', id), { ...datos, actualizado: ahora() }); return id; }
  return (await addDoc(collection(db, 'clinicas', cid, 'pacientes'), { ...datos, creado: ahora(), actualizado: ahora() })).id;
};
export const guardarFichaFS = (cid, pid, f) => setDoc(doc(db, 'clinicas', cid, 'pacientes', pid, 'clinico', 'ficha'), { ...f, actualizado: ahora() }, { merge: true });
export const agregarEvolucionFS = (cid, pid, e) => addDoc(collection(db, 'clinicas', cid, 'pacientes', pid, 'evoluciones'), { ...e, fecha: ahora(), firmada: true });
export const emitirDocumentoFS = (cid, pid, d) => addDoc(collection(db, 'clinicas', cid, 'pacientes', pid, 'documentos'), { ...d, fecha: ahora() });
export const guardarCitaFS = async (cid, c) => {
  const { id, ...datos } = c;
  if (id) { await updateDoc(doc(db, 'clinicas', cid, 'citas', id), { ...datos, actualizado: ahora() }); return id; }
  return (await addDoc(collection(db, 'clinicas', cid, 'citas'), { ...datos, creado: ahora(), actualizado: ahora() })).id;
};
export const guardarPresupuestoFS = async (cid, p) => {
  const { id, ...datos } = p;
  if (id) { await updateDoc(doc(db, 'clinicas', cid, 'presupuestos', id), { ...datos, actualizado: ahora() }); return id; }
  return (await addDoc(collection(db, 'clinicas', cid, 'presupuestos'), { ...datos, fecha: ahora(), actualizado: ahora() })).id;
};
export const registrarPagoFS = (cid, p) => addDoc(collection(db, 'clinicas', cid, 'pagos'), { ...p, fecha: ahora() });
export const registrarAccesoFS = (cid, a) => addDoc(collection(db, 'clinicas', cid, 'accesos'), { ...a, fecha: ahora() }).catch(() => {});
export const leerClinicaFS = async (cid) => { const s = await getDoc(doc(db, 'clinicas', cid)); return s.exists() ? { ...s.data(), id: s.id } : null; };

/* ── Universidad › Investigaciones: investigaciones/{id} ── */
export function useInvestigaciones() {
  const [l, set] = useState(null);
  useEffect(() => vivo(query(collection(db, 'investigaciones'), orderBy('fecha', 'desc'), limit(200)), set, docs), []);
  return l;
}
export const publicarInvestigacionFS = (inv) => addDoc(collection(db, 'investigaciones'), { ...inv, likedBy: [], fecha: ahora() });
export const editarInvestigacionFS = (id, inv) => updateDoc(doc(db, 'investigaciones', id), { ...inv, actualizado: ahora() });

/* ── Universidad › Concursos: convocatorias/{id} (las publica el equipo Criterium) ── */
export function useConvocatorias() {
  const [l, set] = useState(null);
  useEffect(() => vivo(query(collection(db, 'convocatorias'), orderBy('cierre', 'asc'), limit(200)), set, docs), []);
  return l;
}
export const publicarConvocatoriaFS = (c) => addDoc(collection(db, 'convocatorias'), { ...c, fecha: ahora() });

/* ── Genéricos para las colecciones de una clínica ── */
export const crearEn = (cid, col, d) => addDoc(collection(db, 'clinicas', cid, col), { ...d, fecha: d.fecha || ahora() });
export const actualizarEn = (cid, col, id, d) => updateDoc(doc(db, 'clinicas', cid, col, id), { ...d, actualizado: ahora() });
export const borrarEn = (cid, col, id) => deleteDoc(doc(db, 'clinicas', cid, col, id));
export const actualizarClinicaFS = (cid, d) => updateDoc(doc(db, 'clinicas', cid), d);
// Movimiento de inventario: suma o resta al stock y deja el movimiento registrado (no se edita)
export async function moverStockFS(cid, itemId, tipo, cantidad, nota, por) {
  const b = writeBatch(db);
  b.update(doc(db, 'clinicas', cid, 'inventario', itemId), { stock: increment(tipo === 'entrada' ? cantidad : -cantidad), actualizado: ahora() });
  b.set(doc(collection(db, 'clinicas', cid, 'inventario', itemId, 'movimientos')), { tipo, cantidad, nota, por, fecha: ahora() });
  await b.commit();
}
export function useMovimientos(cid, itemId) {
  const [l, set] = useState(null);
  useEffect(() => { if (!cid || !itemId) { set([]); return; } return vivo(query(collection(db, 'clinicas', cid, 'inventario', itemId, 'movimientos'), orderBy('fecha', 'desc'), limit(50)), set, docs); }, [cid, itemId]);
  return l;
}
