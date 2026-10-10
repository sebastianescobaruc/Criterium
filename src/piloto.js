// Modo piloto START MEDUC: configuración (config/piloto), grupo del participante, carga de protocolos según el grupo,
// registro de uso seudonimizado e invitaciones. Las reglas de Firestore son las que de verdad bloquean; esto solo
// ordena la interfaz para que coincida con ellas.
import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, onSnapshot, query, where, addDoc, setDoc, deleteDoc, updateDoc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase.js';
import { cargarProtocolos } from './protocolos-remotos.js';

const env = import.meta.env;
// Valores por defecto (solo para la interfaz mientras no exista config/piloto; las reglas leen el documento)
export const PILOTO_DEFECTO = {
  apertura: env.VITE_PILOTO_APERTURA || '2027-11-01',
  registroUCInvitacion: env.VITE_REGISTRO_UC_POR_INVITACION === 'true',
  modulosNuevos: env.VITE_MODULOS_NUEVOS_EN_PILOTO === 'true',
  congelados: env.VITE_PROTOCOLOS_CONGELADOS === 'true',
  dominiosInvitacion: (env.VITE_DOMINIOS_INVITACION || 'uc.cl').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean),
  estudio: ['resina-clase-i', 'exodoncia-18', 'pulpectomia-premolar', 'destartraje', 'sellantes-ninos']
};
export const GRUPOS = { criterium: 'Criterium (con protocolos)', habitual: 'Habitual (sin protocolos hasta la apertura)' };
export const PROTOCOLOS_LOCALES = env.VITE_PROTOCOLOS_LOCALES === 'true';

const aFecha = (x) => (!x ? null : x.toDate ? x.toDate() : new Date(x));
export const fechaApertura = (cfg) => aFecha((cfg && cfg.apertura) || PILOTO_DEFECTO.apertura + 'T00:00:00-03:00');
export const estaAbierto = (cfg) => !cfg || cfg.abierto === true || Date.now() >= fechaApertura(cfg).getTime();
export const fechaTxt = (d) => (d ? d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

// Configuración del piloto (la lee cualquiera, también antes de tener cuenta)
export function useConfigPiloto() {
  const [cfg, setCfg] = useState(undefined);
  useEffect(() => onSnapshot(doc(db, 'config', 'piloto'), (s) => setCfg(s.exists() ? s.data() : null), () => setCfg(null)), []);
  return cfg;
}
export const leerConfigPiloto = async () => { try { const s = await getDoc(doc(db, 'config', 'piloto')); return s.exists() ? s.data() : null; } catch (e) { return null; } };

// Configuración + participante: { cfg, part, listo, abierto, bloqueados }
export function usePiloto(uid) {
  const cfg = useConfigPiloto();
  const [part, setPart] = useState(undefined);
  useEffect(() => {
    if (!uid) { setPart(null); return; }
    return onSnapshot(doc(db, 'participantes', uid), (s) => setPart(s.exists() ? s.data() : null), () => setPart(null));
  }, [uid]);
  const listo = cfg !== undefined && part !== undefined;
  const abierto = estaAbierto(cfg);
  const bloqueados = !!part && !abierto && !(cfg && cfg.modulosNuevos);
  useEffect(() => { participanteUso = listo && part ? part.codigo : null; }, [listo, part]);
  return { cfg, part, listo, abierto, bloqueados, apertura: fechaApertura(cfg) };
}

// Protocolos desde Firestore, según el grupo. Devuelve true cuando ya llegaron.
export function useProtocolosRemotos(uid, piloto) {
  const [listo, setListo] = useState(PROTOCOLOS_LOCALES);
  const grupo = piloto.part ? piloto.part.grupo : null;
  useEffect(() => {
    if (PROTOCOLOS_LOCALES || !uid || !piloto.listo) return;
    // El grupo habitual no recibe nada hasta la apertura (la regla tampoco se lo daría)
    if (grupo === 'habitual' && !piloto.abierto) { cargarProtocolos([]); setListo(true); return; }
    const filtros = [where('publicado', '==', true)];
    if (grupo === 'criterium' && !piloto.abierto) filtros.push(where('estudio', '==', true));
    return onSnapshot(query(collection(db, 'protocolos'), ...filtros), (s) => {
      cargarProtocolos(s.docs.map((d) => ({ ...d.data(), id: d.id })));
      setListo(true);
    }, (e) => { console.warn('Protocolos:', e && e.code); cargarProtocolos([]); setListo(true); });
  }, [uid, piloto.listo, grupo, piloto.abierto]);
  return listo;
}

// PDF de box: va en protocolos/{id}/archivos/pdf (base64), con las mismas reglas que el protocolo
export async function leerPdfProtocolo(id) {
  const s = await getDoc(doc(db, 'protocolos', id, 'archivos', 'pdf'));
  if (!s.exists()) throw new Error('sin pdf');
  const { nombre, base64 } = s.data();
  const bin = atob(base64); const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { nombre, blob: new Blob([bytes], { type: 'application/pdf' }) };
}

/* ═══ Registro de uso (solo participantes, con su código; nunca uid, nombre ni correo) ═══ */
let participanteUso = null;
const TIPOS_USO = ['sesion_inicio', 'protocolo_abierto', 'nivel_2_abierto', 'nivel_3_abierto', 'pdf_descargado'];
const sesionUso = () => {
  try {
    let s = sessionStorage.getItem('criterium-sesion-uso');
    if (!s) { s = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); sessionStorage.setItem('criterium-sesion-uso', s); }
    return s;
  } catch (e) { return 'sin-sesion'; }
};
export function registrarUso(tipo, protoId = '') {
  if (!participanteUso || !TIPOS_USO.includes(tipo)) return;
  addDoc(collection(db, 'eventos_uso'), { codigo: participanteUso, sesion: sesionUso(), tipo, protoId: String(protoId || '').slice(0, 80), fecha: serverTimestamp() })
    .catch((e) => console.warn('Registro de uso:', e && e.code));
}
// Una vez por visita
export function inicioDeSesionUso() {
  if (!participanteUso) return;
  try { if (sessionStorage.getItem('criterium-sesion-uso-ok') === participanteUso) return; sessionStorage.setItem('criterium-sesion-uso-ok', participanteUso); } catch (e) {}
  registrarUso('sesion_inicio');
}

/* ═══ Invitaciones ═══ */
export const correoPideInvitacion = (cfg, correo) => {
  const c = (cfg || {}).registroUCInvitacion ? cfg : null;
  const dom = (String(correo || '').toLowerCase().split('@')[1] || '').trim();
  return !!c && !!dom && (c.dominiosInvitacion || PILOTO_DEFECTO.dominiosInvitacion).includes(dom);
};
export async function invitacionValida(codigo) {
  try { const s = await getDoc(doc(db, 'invitaciones', String(codigo || '').trim().toUpperCase())); return s.exists() && !s.data().usada; } catch (e) { return false; }
}
// Usa la invitación: queda gastada y la persona queda como participante con el grupo y el código de la invitación
export async function canjearInvitacion(uid, codigo) {
  const cod = String(codigo || '').trim().toUpperCase();
  const s = await getDoc(doc(db, 'invitaciones', cod));
  if (!s.exists() || s.data().usada) throw new Error('invitacion');
  const inv = s.data();
  const b = writeBatch(db);
  b.update(doc(db, 'invitaciones', cod), { usada: true, usadaPor: uid, fechaUso: serverTimestamp() });
  b.set(doc(db, 'participantes', uid), { grupo: inv.grupo, codigo: inv.participante, invitacion: cod, fecha: serverTimestamp() });
  await b.commit();
}

/* ═══ Panel del equipo ═══ */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const azar = (n) => { const a = new Uint32Array(n); crypto.getRandomValues(a); return Array.from(a, (x) => ALFABETO[x % ALFABETO.length]).join(''); };
const nuevoCodigo = () => 'P-' + azar(6);

export async function guardarConfigPiloto(cambios) {
  const actual = (await leerConfigPiloto()) || {};
  const base = { ...PILOTO_DEFECTO, apertura: Timestamp.fromDate(fechaApertura(null)), abierto: false, ...actual };
  const n = { ...base, ...cambios, actualizado: serverTimestamp() };
  if (typeof n.apertura === 'string') n.apertura = Timestamp.fromDate(new Date(n.apertura + 'T00:00:00-03:00'));
  await setDoc(doc(db, 'config', 'piloto'), n);
}
export const abrirTodo = () => guardarConfigPiloto({ abierto: true, fechaAbierto: new Date().toISOString() });

export async function generarInvitaciones(n, grupo) {
  const hechas = [];
  for (let i = 0; i < n; i++) {
    const cod = azar(8); const participante = nuevoCodigo();
    await setDoc(doc(db, 'invitaciones', cod), { grupo, participante, usada: false, usadaPor: '', creado: serverTimestamp() });
    await setDoc(doc(db, 'identidades', participante), { nombre: '', correo: '', consentimiento: '', invitacion: cod, uid: '' });
    hechas.push({ cod, participante, grupo });
  }
  return hechas;
}
// Asignar grupo a una cuenta que ya existe (por ejemplo, de otra universidad o creada antes del piloto)
export async function asignarGrupo(uid, grupo, nombre, consentimiento) {
  const s = await getDoc(doc(db, 'participantes', uid));
  const codigo = s.exists() ? s.data().codigo : nuevoCodigo();
  await setDoc(doc(db, 'participantes', uid), { grupo, codigo, invitacion: s.exists() ? s.data().invitacion || '' : '', fecha: serverTimestamp() });
  await setDoc(doc(db, 'identidades', codigo), { nombre: nombre || '', uid, consentimiento: consentimiento || '' }, { merge: true });
  return codigo;
}
export const quitarDelPiloto = (uid) => deleteDoc(doc(db, 'participantes', uid));
export const guardarIdentidad = (codigo, datos) => updateDoc(doc(db, 'identidades', codigo), datos);

export async function leerDatosPiloto() {
  const [p, inv, ids, ev] = await Promise.all([
    getDocs(collection(db, 'participantes')), getDocs(collection(db, 'invitaciones')), getDocs(collection(db, 'identidades')), getDocs(collection(db, 'eventos_uso'))
  ]);
  return {
    participantes: p.docs.map((d) => ({ uid: d.id, ...d.data() })),
    invitaciones: inv.docs.map((d) => ({ cod: d.id, ...d.data() })),
    identidades: ids.docs.map((d) => ({ codigo: d.id, ...d.data() })),
    eventos: ev.docs.map((d) => { const x = d.data(); return { codigo: x.codigo, sesion: x.sesion, tipo: x.tipo, protoId: x.protoId || '', fecha: aFecha(x.fecha) }; })
  };
}

// El indicador y el CSV son funciones puras (piloto-datos.js), así se prueban sin Firebase
export { indicadorPiloto, csvEventos } from './piloto-datos.js';
