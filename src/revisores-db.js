// Datos de Revisores en Firestore: borradores (protocolos y materia), revisiones del panel, tramos y publicación.
// Reglas en firestore.rules (sección Revisores); lógica pura en revisores.js.
import { useEffect, useState } from 'react';
import { collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, arrayUnion } from 'firebase/firestore';
import { db } from './firebase.js';

const ahora = () => new Date().toISOString();
const docs = (s) => s.docs.map((d) => ({ ...d.data(), id: d.id }));
const vivo = (q, set, orden) => onSnapshot(q, (s) => set(orden ? docs(s).sort(orden) : docs(s)), () => set([]));
const porFecha = (a, b) => String(b.actualizado || b.creado || '').localeCompare(String(a.actualizado || a.creado || ''));

// ¿Es revisor verificado? revisores/{uid} { nombre, especialidades [] } (lo agrega el equipo tras verificar el título)
export function useRevisorVerificado(uid) {
  const [r, set] = useState(undefined);
  useEffect(() => { if (!uid) { set(null); return; } return onSnapshot(doc(db, 'revisores', uid), (s) => set(s.exists() ? { ...s.data(), uid } : null), () => set(null)); }, [uid]);
  return r;
}
// Montos de los tramos (config/revisores); si no existe, se usan los valores por defecto de revisores.js
export function useConfigRevisores() {
  const [c, set] = useState(null);
  useEffect(() => onSnapshot(doc(db, 'config', 'revisores'), (s) => set(s.exists() ? s.data() : null), () => set(null)), []);
  return c;
}
// Todos los borradores (solo quien puede verlos) o solo los míos
export function useBorradores(uid, todos) {
  const [l, set] = useState(null);
  useEffect(() => {
    if (!uid) { set([]); return; }
    return vivo(todos ? collection(db, 'borradores') : query(collection(db, 'borradores'), where('autor.uid', '==', uid)), set, porFecha);
  }, [uid, todos]);
  return l;
}
export function useBorrador(id) {
  const [b, set] = useState(undefined);
  useEffect(() => { if (!id) { set(null); return; } return onSnapshot(doc(db, 'borradores', id), (s) => set(s.exists() ? { ...s.data(), id: s.id } : null), () => set(null)); }, [id]);
  return b;
}
// Revisiones de un borrador: el panel las ve todas; el autor, las de su borrador
export function useRevisionesBorrador(bid, uid, comoAutor) {
  const [l, set] = useState(null);
  useEffect(() => {
    if (!bid || !uid) { set([]); return; }
    const q = comoAutor ? query(collection(db, 'revisionesBorrador'), where('borradorId', '==', bid), where('autorUid', '==', uid)) : query(collection(db, 'revisionesBorrador'), where('borradorId', '==', bid));
    return vivo(q, set, (a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  }, [bid, uid, comoAutor]);
  return l;
}
// Mis revisiones (para «Mi tramo»)
export function useMisRevisiones(uid, activo) {
  const [l, set] = useState(null);
  useEffect(() => { if (!uid || !activo) { set([]); return; } return vivo(query(collection(db, 'revisionesBorrador'), where('revisor.uid', '==', uid)), set); }, [uid, activo]);
  return l;
}
export function useTramo(uid, activo) {
  const [t, set] = useState(undefined);
  useEffect(() => { if (!uid || !activo) { set(null); return; } return onSnapshot(doc(db, 'tramos', uid), (s) => set(s.exists() ? s.data() : null), () => set(null)); }, [uid, activo]);
  return t;
}

export const crearBorradorFS = async (b) => (await addDoc(collection(db, 'borradores'), { ...b, estado: 'borrador', ronda: 0, creado: ahora(), actualizado: ahora() })).id;
export const guardarBorradorFS = (id, cambios) => updateDoc(doc(db, 'borradores', id), { ...cambios, actualizado: ahora() });
export const borrarBorradorFS = (id) => deleteDoc(doc(db, 'borradores', id));
// El autor lo envía a la ronda siguiente (1 o 2)
export const enviarARevisionFS = (b) => updateDoc(doc(db, 'borradores', b.id), { estado: 'revision', ronda: (b.ronda || 0) + 1, actualizado: ahora(), historial: arrayUnion({ fecha: ahora(), txt: `Enviado a la ronda ${(b.ronda || 0) + 1}` }) });
// Una revisión por revisor y ronda (el id lo impide repetir)
export const enviarRevisionPanelFS = (b, revisor, puntajes, correcciones, comentario) => setDoc(doc(db, 'revisionesBorrador', `${b.id}_${b.ronda}_${revisor.uid}`), {
  borradorId: b.id, tipo: b.tipo, especialidad: b.especialidad, ronda: b.ronda, autorUid: b.autor.uid, revisor, puntajes, correcciones, comentario: comentario.trim(), fecha: ahora()
});
export const guardarTramoFS = (uid, t) => setDoc(doc(db, 'tramos', uid), { ...t, actualizado: ahora() });

// Equipo Criterium: cerrar la ronda 1 (vuelve al autor con las correcciones) o dejarla sin acuerdo
export const cerrarRondaFS = (b, estado, txt) => updateDoc(doc(db, 'borradores', b.id), { estado, actualizado: ahora(), historial: arrayUnion({ fecha: ahora(), txt }) });

const sha256 = async (txt) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)))).map((x) => x.toString(16).padStart(2, '0')).join('');
const slug = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'borrador';

// Equipo Criterium: publicar un borrador aprobado. Protocolo → protocolos/{id} (con versión y huella, como npm run
// protocolos:subir); materia → materia/{ramo}/clases/{id} y su índice. Firma visible: los nombres del panel.
export async function publicarBorradorFS(b, { validadoPor, ramo }) {
  const fecha = ahora().slice(0, 10);
  if (b.tipo === 'protocolo') {
    const id = slug(b.titulo);
    const c = b.contenido || {};
    const datos = { esp: b.especialidad, titulo: b.titulo, bandera: 'GUÍA VALIDADA POR PANEL DE ESPECIALISTAS', tags: [b.especialidad, 'v1.0'], alcance: c.alcance || '', bandeja: c.bandeja || [], evidencia: [], nota: c.nota || '', validadoPor, pasos: (c.pasos || []).map((p) => ({ corto: p.corto, hacer: p.hacer || '', listo: p.listo || '', porque: p.porque ? [p.porque] : [], ...(p.fuentes ? { sub: [{ titulo: 'ver fuentes', fuentes: String(p.fuentes).split('\n').filter((x) => x.trim()).map((cita) => ({ grado: 'Sin grado asignado', cita: cita.trim(), loc: '' })) }] } : { sinEv: 'Práctica habitual · sin estudio que la compare' }) })) };
    const catalogo = { id, corto: b.titulo.slice(0, 40), esp: b.especialidad, t: b.titulo, s: c.alcance || '', estadoTxt: 'Validado v1.0', abre: true, estudio: false };
    const json = JSON.stringify(datos);
    await setDoc(doc(db, 'protocolos', id), { catalogo: JSON.stringify(catalogo), json, version: 'v1.0', sha256: await sha256(json), estudio: false, publicado: true, orden: 90, fecha, origen: { borradorId: b.id, autor: b.autor } });
    await updateDoc(doc(db, 'borradores', b.id), { estado: 'aprobado', publicadoId: id, aprobadoPor: validadoPor, actualizado: ahora(), historial: arrayUnion({ fecha: ahora(), txt: 'Aprobado y publicado' }) });
    return id;
  }
  const id = slug(b.titulo);
  const html = (b.contenido && b.contenido.html) || '';
  const huella = await sha256(html);
  await setDoc(doc(db, 'materia', ramo, 'clases', id), { titulo: b.titulo, version: '1.0', fecha, sha256: huella, fuentes: (b.contenido && b.contenido.fuentes) || 0, html, validadoPor });
  const r = (await getDoc(doc(db, 'materia', ramo))).data() || {};
  const clases = (r.clases || []).filter((x) => x.id !== id).concat({ id, titulo: b.titulo, resumen: (b.contenido && b.contenido.resumen) || '', orden: 900, version: '1.0', fecha, fuentes: (b.contenido && b.contenido.fuentes) || 0, validadoPor });
  await updateDoc(doc(db, 'materia', ramo), { clases, actualizado: fecha });
  await updateDoc(doc(db, 'borradores', b.id), { estado: 'aprobado', publicadoId: ramo + '/' + id, aprobadoPor: validadoPor, actualizado: ahora(), historial: arrayUnion({ fecha: ahora(), txt: 'Aprobado y publicado' }) });
  return id;
}
