import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, addDoc, getDocs, setDoc, updateDoc, deleteDoc, getDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, writeBatch, arrayUnion, arrayRemove, increment, deleteField
} from 'firebase/firestore';
import { db, usarStorage } from './firebase.js';

/* ═══════ Rol docente ═══════ */

/** Docente verificado: existe /docentes/{uid}. Solo se agrega a mano desde la consola de Firebase.
 *  Devuelve [esDocente, listo]. Las reglas de Firestore y Storage exigen el mismo documento. */
export function useEsDocente(uid) {
  const [es, setEs] = useState(false);
  const [listo, setListo] = useState(false);
  useEffect(() => {
    if (!uid) { setEs(false); setListo(true); return; }
    setListo(false);
    return onSnapshot(doc(db, 'docentes', uid), (d) => { setEs(d.exists()); setListo(true); }, () => { setEs(false); setListo(true); });
  }, [uid]);
  return [es, listo];
}

/* ═══════ Casos ═══════ */

/** Escucha los casos propios del usuario (autor) */
export function useMisCasos(uid) {
  const [casos, setCasos] = useState([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!uid) { setCasos([]); setListo(true); return; }
    const q = query(collection(db, 'casos'), where('autorUid', '==', uid), orderBy('actualizado', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setCasos(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      setListo(true);
    }, () => setListo(true));
    return unsub;
  }, [uid]);

  return [casos, listo];
}

/** Escucha la cola de revisión (casos enviados, todos los autores). Solo para docentes: activo = esDocente */
export function useColaRevision(activo = true) {
  const [cola, setCola] = useState([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!activo) { setCola([]); setListo(true); return; }
    const q = query(collection(db, 'casos'), where('estado', '==', 'enviado'), orderBy('actualizado', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setCola(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      setListo(true);
    }, () => setListo(true));
    return unsub;
  }, [activo]);

  return [cola, listo];
}

/** Revisores que aprobaron casos con un protocolo (para la mención honrosa). Lee casos aprobados de cualquier autor. */
export function useAprobadoresProtocolo(protocoloId, activo = true) {
  const [lista, setLista] = useState([]);

  useEffect(() => {
    if (!protocoloId || !activo) { setLista([]); return; }
    const q = query(collection(db, 'casos'), where('protocoloId', '==', protocoloId), where('estado', '==', 'aprobado'));
    const unsub = onSnapshot(q, (snap) => {
      const porRevisor = new Map();
      snap.docs.forEach((d) => {
        const revs = d.data().revisiones || [];
        const r = [...revs].reverse().find((x) => x.veredicto === 'aprobado');
        if (!r || !r.revisor) return;
        const k = r.revisor.id || r.revisor.nombre;
        const prev = porRevisor.get(k);
        porRevisor.set(k, { ...r.revisor, casos: (prev ? prev.casos : 0) + 1 });
      });
      setLista([...porRevisor.values()].sort((a, b) => b.casos - a.casos));
    }, () => setLista([]));
    return unsub;
  }, [protocoloId, activo]);

  return lista;
}

/** Guardar o actualizar un caso */
export async function guardarCasoFS(caso, uid) {
  const ahora = new Date().toISOString();
  const data = {
    ...caso,
    autorUid: uid,
    actualizado: ahora
  };
  // Limpiar campo 'id' del objeto (lo maneja Firestore)
  const { id, ...sinId } = data;

  if (caso.id && caso.id.length > 5) {
    // Actualizar existente
    await setDoc(doc(db, 'casos', caso.id), sinId, { merge: true });
    return caso.id;
  } else {
    // Crear nuevo
    sinId.creado = ahora;
    sinId.historial = [...(sinId.historial || []), { fecha: ahora, txt: 'Caso creado' }];
    const docRef = await addDoc(collection(db, 'casos'), sinId);
    return docRef.id;
  }
}

/** Actualizar campos específicos de un caso */
export async function actualizarCasoFS(casoId, cambios) {
  cambios.actualizado = new Date().toISOString();
  await updateDoc(doc(db, 'casos', casoId), cambios);
}

/** Eliminar un caso y sus fotos */
export async function eliminarCasoFS(casoId, fotos = []) {
  // Borrar fotos de Storage
  for (const f of fotos) {
    if (f.storagePath) {
      try { const { deleteObject, ref, storage } = await usarStorage(); await deleteObject(ref(storage, f.storagePath)); } catch (e) {}
    }
  }
  await deleteDoc(doc(db, 'casos', casoId));
}

/** Leer un caso por ID */
export async function leerCasoFS(casoId) {
  const snap = await getDoc(doc(db, 'casos', casoId));
  return snap.exists() ? { ...snap.data(), id: snap.id } : null;
}

/* ═══════ Fotos ═══════ */

/** Subir una foto a Storage y devolver { url, storagePath } */
export async function subirFoto(casoId, fotoId, dataUrl) {
  const blob = dataUrlABlob(dataUrl);
  const path = `casos/${casoId}/fotos/${fotoId}.jpg`;
  const { ref, uploadBytes, getDownloadURL, storage } = await usarStorage();
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  const url = await getDownloadURL(storageRef);
  return { url, storagePath: path };
}

/** Convertir data URL base64 a Blob */
function dataUrlABlob(dataUrl) {
  const [meta, base64] = dataUrl.split(',');
  const mime = meta.match(/:(.*?);/)[1];
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/* ═══════ Feed ═══════ */

export function useFeedFS() {
  const [feed, setFeed] = useState([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'feed'), orderBy('fecha', 'desc'));
    // Si Firestore no responde en 6 s, la app se abre igual (el feed llega cuando conecte) en vez de quedar en «cargando»
    const t = setTimeout(() => setListo(true), 6000);
    const unsub = onSnapshot(q, (snap) => {
      setFeed(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      setListo(true);
    }, () => setListo(true));
    return () => { clearTimeout(t); unsub(); };
  }, []);

  return [feed, setFeed, listo];
}

export async function publicarPostFS(post) {
  const { id, ...sinId } = post;
  if (id) {
    await setDoc(doc(db, 'feed', id), sinId, { merge: true });
    return id;
  }
  const docRef = await addDoc(collection(db, 'feed'), sinId);
  return docRef.id;
}

/* ═══════ Postulaciones ═══════ */

export async function guardarPostulacionFS(uid, data) {
  await setDoc(doc(db, 'postulaciones', uid), { ...data, uid, actualizado: new Date().toISOString() });
}

export async function leerPostulacionFS(uid) {
  const snap = await getDoc(doc(db, 'postulaciones', uid));
  return snap.exists() ? snap.data() : null;
}

/* ═══════ Mensajes ═══════ */

export async function enviarMensajeFS(uid, mensaje) {
  await addDoc(collection(db, 'mensajes'), {
    uid,
    ...mensaje,
    fecha: new Date().toISOString()
  });
}

/* ═══════ Migración local → Firestore ═══════ */

/**
 * Migra datos desde IndexedDB al servidor.
 * onProgreso recibe { paso, total, texto } para mostrar una barra.
 */
export async function migrarDatosLocales(uid, datosLocales, onProgreso) {
  // Los ejemplos (ejemplo: true) no se suben: son de autores ficticios y quedarían a nombre del usuario.
  const casos = (datosLocales.casos || []).filter((c) => !c.ejemplo);
  const feed = (datosLocales.feed || []).filter((p) => !p.ejemplo);
  const { perfil, postulacion } = datosLocales;
  const total = casos.length + (casos.reduce((n, c) => n + (c.fotos || []).length, 0)) + feed.length + (perfil ? 1 : 0) + (postulacion ? 1 : 0);
  let paso = 0;
  const avanzar = (texto) => { paso++; onProgreso && onProgreso({ paso, total, texto }); };

  // 1. Perfil
  if (perfil) {
    await setDoc(doc(db, 'usuarios', uid), {
      nombre: perfil.nombre || '',
      email: '',
      rol: perfil.rol || 'Estudiante de pregrado',
      institucion: perfil.institucion || '',
      area: perfil.area || '',
      creadoEn: serverTimestamp()
    }, { merge: true });
    avanzar('Perfil subido');
  }

  // 2. Casos (con fotos)
  for (const caso of casos) {
    avanzar('Subiendo caso: ' + (caso.titulo || 'sin título'));
    const fotosNuevas = [];
    for (const foto of (caso.fotos || [])) {
      avanzar('Subiendo foto ' + (foto.tipo || ''));
      try {
        if (foto.data) {
          const { url, storagePath } = await subirFoto(caso.id, foto.id, foto.data);
          fotosNuevas.push({ ...foto, url, storagePath, data: undefined });
        } else {
          fotosNuevas.push(foto);
        }
      } catch (e) {
        // Si falla una foto, guardar sin ella y seguir
        fotosNuevas.push({ ...foto, data: undefined, url: '', nota: (foto.nota || '') + ' [foto no subida]' });
      }
    }

    const { id, ...sinId } = caso;
    sinId.autorUid = uid;
    sinId.autor = { ...sinId.autor, id: uid };
    sinId.fotos = fotosNuevas;
    sinId.ejemplo = false;
    // Las revisiones hechas en este navegador no valen como revisión real (las reglas del servidor
    // solo aceptan revisiones de revisores verificados). El caso vuelve a borrador y se guardan aparte.
    if ((sinId.revisiones || []).length || !['borrador', 'enviado'].includes(sinId.estado)) {
      sinId.revisionesLocales = sinId.revisiones || [];
      sinId.revisiones = [];
      sinId.estado = 'borrador';
      sinId.historial = [...(sinId.historial || []), { fecha: new Date().toISOString(), txt: 'Importado desde este navegador. Las revisiones locales no se trasladan: hay que enviarlo de nuevo.' }];
    }
    await setDoc(doc(db, 'casos', id), sinId);
  }

  // 3. Feed
  for (const post of feed) {
    avanzar('Subiendo publicación del feed');
    const { id, ...sinId } = post;
    await setDoc(doc(db, 'feed', id), sinId);
  }

  // 4. Postulación
  if (postulacion) {
    await setDoc(doc(db, 'postulaciones', uid), { ...postulacion, uid });
    avanzar('Postulación subida');
  }
}

/** Lee todo lo que hay en IndexedDB local */
export async function leerDatosLocales() {
  // Importar las funciones de lectura de logic.js
  const { leer } = await import('./logic.js');
  const [casos, feed, perfil, postulacion, mensajes] = await Promise.all([
    leer('casos.v1'),
    leer('feed.v1'),
    leer('perfil.v1'),
    leer('postulacion.v1'),
    leer('mensajes.v1')
  ]);
  const hayDatos = (casos && casos.length) || (feed && feed.length) || perfil || postulacion;
  return {
    hayDatos,
    casos: (typeof casos === 'function' ? casos() : casos) || [],
    feed: (typeof feed === 'function' ? feed() : feed) || [],
    perfil: perfil || null,
    postulacion: postulacion || null,
    mensajes: mensajes || []
  };
}

/** Limpia IndexedDB después de migrar */
export async function limpiarDatosLocales() {
  const { escribir } = await import('./logic.js');
  await Promise.all([
    escribir('casos.v1', []),
    escribir('feed.v1', []),
    escribir('perfil.v1', null),
    escribir('postulacion.v1', null),
    escribir('mensajes.v1', [])
  ]);
}


/* ═══════ Red social: likes, respuestas, perfiles públicos y seguimientos ═══════ */

/** Me gusta por persona: guarda quién lo dio en likedBy y ajusta el conteo. */
// Una publicación vive en feed/{id} o, si es de un espacio por curso, en grupos/{g}/posts/{id}: se pasa el id o la ruta completa
const postRef = (x) => (String(x).includes('/') ? doc(db, x) : doc(db, 'feed', x));
export async function toggleLikeFS(postId, uid, yaLeGusta) {
  await updateDoc(postRef(postId), yaLeGusta
    ? { likedBy: arrayRemove(uid), likes: increment(-1) }
    : { likedBy: arrayUnion(uid), likes: increment(1) });
}

/** Agrega una respuesta sin reescribir el resto de la publicación. */
export async function responderPostFS(postId, respuesta) {
  await updateDoc(postRef(postId), { respuestas: arrayUnion(respuesta) });
}

/** Perfil público: solo datos profesionales, nunca el correo.
    rol (etapa: estudiante, egresado, especialista, docente), institucion, anio (año que cursa o de egreso),
    intereses (especialidades) y temas (listas cortas), descripcion y onboarding (terminó la bienvenida).
    tipo 'oficial' y verificado los pone solo el equipo Criterium desde la consola: nadie se los pone a sí mismo. */
export const PERFIL_PUBLICO = ['nombre', 'rol', 'institucion', 'area', 'descripcion', 'anio', 'invitadoPor'];
export const PERFIL_LISTAS = ['intereses', 'temas'];
export async function guardarPerfilPublicoFS(uid, p) {
  const datos = {};
  PERFIL_PUBLICO.forEach((k) => { datos[k] = (p && typeof p[k] === 'string') ? p[k] : ''; });
  PERFIL_LISTAS.forEach((k) => { datos[k] = (p && Array.isArray(p[k])) ? p[k].filter((x) => typeof x === 'string').slice(0, 12) : []; });
  datos.onboarding = !!(p && p.onboarding);
  await setDoc(doc(db, 'perfiles', uid), { ...datos, actualizado: new Date().toISOString() }, { merge: true });
}

/** Personas de la comunidad (para «A quién seguir»). La comunidad es chica: se leen hasta 200 perfiles. */
export function usePerfiles(activo = true) {
  const [lista, setLista] = useState([]);
  useEffect(() => {
    if (!activo) return;
    return onSnapshot(query(collection(db, 'perfiles'), limit(200)), (snap) => setLista(snap.docs.map((d) => ({ ...d.data(), uid: d.id }))), () => setLista([]));
  }, [activo]);
  return lista;
}

/* ═══════ Filtro de publicación (equipo Criterium) ═══════
   Los casos clínicos, borradores y protocolos no van directo al feed: entran a pendientes/{id} con estado 'revision'.
   Los ven solo su autor y el equipo (admins/{uid}, agregado a mano en la consola). Al aprobarse, el equipo copia la
   publicación al feed con el mismo id; si se rechaza, queda con el motivo y el autor lo ve en su perfil. */
export const MODERADOS = ['caso', 'borrador', 'protocolo'];
export function useEsAdmin(uid) {
  const [es, setEs] = useState(false);
  useEffect(() => {
    if (!uid) { setEs(false); return; }
    return onSnapshot(doc(db, 'admins', uid), (s) => setEs(s.exists()), () => setEs(false));
  }, [uid]);
  return es;
}
/** Publica: lo simple va al feed; lo que necesita filtro, a pendientes. Devuelve 'feed' o 'revision'. */
export async function publicarFS(post) {
  if (MODERADOS.includes(post.tipo)) {
    await addDoc(collection(db, 'pendientes'), { ...post, estado: 'revision' });
    return 'revision';
  }
  await addDoc(collection(db, 'feed'), { ...post, estado: 'publicado' });
  return 'feed';
}
export function useMisPendientes(uid) {
  const [lista, setLista] = useState([]);
  useEffect(() => {
    if (!uid) { setLista([]); return; }
    return onSnapshot(query(collection(db, 'pendientes'), where('autorUid', '==', uid)),
      (snap) => setLista(snap.docs.map((d) => ({ ...d.data(), id: d.id })).filter((p) => p.estado !== 'aprobado').sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))), () => setLista([]));
  }, [uid]);
  return lista;
}
export function useColaModeracion(activo) {
  const [lista, setLista] = useState([]);
  useEffect(() => {
    if (!activo) { setLista([]); return; }
    return onSnapshot(query(collection(db, 'pendientes'), where('estado', '==', 'revision')),
      (snap) => setLista(snap.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))), () => setLista([]));
  }, [activo]);
  return lista;
}
export async function aprobarFS(p, admin) {
  const { id, estado, ...resto } = p;
  const moderacion = { por: admin, fecha: new Date().toISOString() };
  await setDoc(doc(db, 'feed', id), { ...resto, estado: 'publicado', moderacion });
  await updateDoc(doc(db, 'pendientes', id), { estado: 'aprobado', moderacion });
}
export async function rechazarFS(id, motivo, admin) {
  await updateDoc(doc(db, 'pendientes', id), { estado: 'rechazado', moderacion: { por: admin, fecha: new Date().toISOString(), motivo } });
}
export async function borrarPendienteFS(id) {
  await deleteDoc(doc(db, 'pendientes', id));
}

/* ═══════ Casos con revisión y corrección (Criterium Red) ═══════
   El caso entra a pendientes/{id} (tipo 'caso', estado 'revision', version 1). Un revisor (docente o equipo Criterium,
   nunca el autor) lo puntúa y decide: aprobar (se copia al feed con el mismo id), pedir correcciones (estado 'cambios',
   con cada corrección ligada a un campo) o no publicar ('rechazado'). El autor corrige y reenvía (version + 1).
   revisiones: [{ id, fecha, version, revisor: { uid, nombre, rol }, puntajes: { pertinencia, claridad, evidencia },
     veredicto: 'aprobado' | 'cambios' | 'rechazado', correcciones: [{ campo, txt }], comentario }] */
const porFecha = (a, b) => (b.actualizado || b.fecha || '').localeCompare(a.actualizado || a.fecha || '');
export function useCasosRed(uid) {
  const [lista, setLista] = useState(null);
  useEffect(() => {
    if (!uid) { setLista([]); return; }
    return onSnapshot(query(collection(db, 'pendientes'), where('autorUid', '==', uid)),
      (snap) => setLista(snap.docs.map((d) => ({ ...d.data(), id: d.id })).filter((p) => p.tipo === 'caso').sort(porFecha)), () => setLista([]));
  }, [uid]);
  return lista;
}
export function useColaCasos(activo) {
  const [lista, setLista] = useState([]);
  useEffect(() => {
    if (!activo) { setLista([]); return; }
    return onSnapshot(query(collection(db, 'pendientes'), where('estado', '==', 'revision')),
      (snap) => setLista(snap.docs.map((d) => ({ ...d.data(), id: d.id })).filter((p) => p.tipo === 'caso').sort((a, b) => -porFecha(a, b))), () => setLista([]));
  }, [activo]);
  return lista;
}
export function usePendiente(id) {
  const [p, setP] = useState(undefined); // undefined = cargando, null = no existe o no se puede ver
  useEffect(() => {
    if (!id) { setP(null); return; }
    setP(undefined);
    return onSnapshot(doc(db, 'pendientes', id), (s) => setP(s.exists() ? { ...s.data(), id: s.id } : null), () => setP(null));
  }, [id]);
  return p;
}
export async function enviarCasoRedFS(caso) {
  const ahora = new Date().toISOString();
  const r = await addDoc(collection(db, 'pendientes'), { ...caso, tipo: 'caso', estado: 'revision', version: 1, revisiones: [], historial: [{ fecha: ahora, txt: 'Enviado a revisión' }], fecha: ahora, actualizado: ahora });
  return r.id;
}
export async function corregirCasoRedFS(caso, cambios, nota) {
  const ahora = new Date().toISOString();
  await updateDoc(doc(db, 'pendientes', caso.id), {
    ...cambios, estado: 'revision', version: (caso.version || 1) + 1, actualizado: ahora,
    historial: [...(caso.historial || []), { fecha: ahora, txt: 'Versión ' + ((caso.version || 1) + 1) + ' reenviada: ' + nota }]
  });
}
/** Firma una revisión. Si aprueba, el caso se copia al feed (mismo id) en la misma escritura. */
export async function revisarCasoRedFS(caso, rev) {
  const ahora = new Date().toISOString();
  const txt = { aprobado: 'Aprobado y publicado', cambios: 'Correcciones pedidas', rechazado: 'No se publica' }[rev.veredicto] + ' por ' + rev.revisor.nombre;
  const b = writeBatch(db);
  b.update(doc(db, 'pendientes', caso.id), { estado: rev.veredicto, revisiones: [...(caso.revisiones || []), rev], historial: [...(caso.historial || []), { fecha: ahora, txt }], actualizado: ahora });
  if (rev.veredicto === 'aprobado') {
    const { id, estado, revisiones, historial, ...publico } = caso;
    b.set(doc(db, 'feed', caso.id), {
      ...publico, estado: 'publicado', fecha: ahora, likes: 0, likedBy: [], respuestas: [],
      revisado: { por: { uid: rev.revisor.uid, nombre: rev.revisor.nombre }, version: caso.version || 1, rondas: (revisiones || []).length + 1, fecha: ahora }
    });
  }
  await b.commit();
}

/** Caso de la semana: un docente o el equipo lo destaca (o lo quita con por = null). */
export async function destacarFS(postId, por) {
  await updateDoc(postRef(postId), { destacado: por ? { ...por, fecha: new Date().toISOString() } : deleteField() });
}

/** Discusión de un plan de tratamiento: cada persona vota un plan (o retira su voto). */
export async function votarFS(postId, uid, opcion) {
  await updateDoc(postRef(postId), { ['votos.' + uid]: opcion === null ? deleteField() : opcion });
}

export function usePerfilPublico(uid) {
  const [perfil, setPerfil] = useState(undefined); // undefined = cargando, null = no existe
  useEffect(() => {
    if (!uid) { setPerfil(null); return; }
    setPerfil(undefined);
    return onSnapshot(doc(db, 'perfiles', uid), (snap) => setPerfil(snap.exists() ? { ...snap.data(), uid } : null), () => setPerfil(null));
  }, [uid]);
  return perfil;
}

/** Publicaciones de una persona (ordenadas en el navegador para no exigir un índice compuesto). */
export function usePostsDe(uid) {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    if (!uid) { setPosts([]); return; }
    return onSnapshot(query(collection(db, 'feed'), where('autorUid', '==', uid)),
      (snap) => setPosts(snap.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))),
      () => setPosts([]));
  }, [uid]);
  return posts;
}

/** A quién sigue (siguiendo) y quién lo sigue (seguidores), como listas de uid. */
export function useSeguimientos(uid) {
  const [siguiendo, setSiguiendo] = useState([]);
  const [seguidores, setSeguidores] = useState([]);
  useEffect(() => {
    if (!uid) { setSiguiendo([]); setSeguidores([]); return; }
    const a = onSnapshot(query(collection(db, 'seguimientos'), where('de', '==', uid)), (s) => setSiguiendo(s.docs.map((d) => d.data().a)), () => {});
    const b = onSnapshot(query(collection(db, 'seguimientos'), where('a', '==', uid)), (s) => setSeguidores(s.docs.map((d) => d.data().de)), () => {});
    return () => { a(); b(); };
  }, [uid]);
  return { siguiendo, seguidores };
}

export async function seguirFS(de, a) {
  await setDoc(doc(db, 'seguimientos', de + '_' + a), { de, a, fecha: new Date().toISOString() });
}
export async function dejarDeSeguirFS(de, a) {
  await deleteDoc(doc(db, 'seguimientos', de + '_' + a));
}

/* ═══════ Agenda (citas), evaluación y calificaciones ═══════
   citas/{id}: { estudianteUid, estudiante: { uid, nombre }, docenteUid, docente: { uid, nombre },
     fecha 'AAAA-MM-DD', hora 'HH:MM', paciente (solo iniciales), pieza, protocoloId, nota (texto libre del estudiante),
     estado: 'agendada' | 'cancelada' | 'terminada', creado, actualizado,
     evaluacion?: { terminado: true, nota (1 a 7), comentario, pasosBien: [índices], pasosTotal, fecha, docente: { uid, nombre } } }
   Las consultas no ordenan en el servidor (así no piden índices compuestos): se ordenan en el navegador. */
const porFechaHora = (a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora);

/** Citas del estudiante (las suyas) o del docente (las que debe evaluar). campo: 'estudianteUid' | 'docenteUid' */
export function useCitas(uid, campo = 'estudianteUid') {
  const [citas, setCitas] = useState([]);
  const [listo, setListo] = useState(false);
  useEffect(() => {
    if (!uid) { setCitas([]); setListo(true); return; }
    const q = query(collection(db, 'citas'), where(campo, '==', uid));
    return onSnapshot(q, (snap) => { setCitas(snap.docs.map((d) => ({ ...d.data(), id: d.id })).sort(porFechaHora)); setListo(true); }, () => setListo(true));
  }, [uid, campo]);
  return [citas, listo];
}
export async function crearCitaFS(cita) {
  const ahora = new Date().toISOString();
  return addDoc(collection(db, 'citas'), { ...cita, estado: 'agendada', creado: ahora, actualizado: ahora });
}
export async function editarCitaFS(id, cambios) {
  return updateDoc(doc(db, 'citas', id), { ...cambios, actualizado: new Date().toISOString() });
}
export async function eliminarCitaFS(id) { return deleteDoc(doc(db, 'citas', id)); }
/** El docente marca la T de terminado y pone la nota. Solo cambia estado, evaluacion y actualizado. */
export async function evaluarCitaFS(id, evaluacion) {
  return updateDoc(doc(db, 'citas', id), { estado: 'terminada', evaluacion, actualizado: new Date().toISOString() });
}

/** Docentes verificados con su nombre público, para elegir quién evalúa una cita */
export function useDocentes(activo = true) {
  const [lista, setLista] = useState([]);
  useEffect(() => {
    if (!activo) return;
    return onSnapshot(collection(db, 'docentes'), async (snap) => {
      const ids = snap.docs.map((d) => d.id);
      const perfiles = await Promise.all(ids.map((id) => getDoc(doc(db, 'perfiles', id)).then((p) => (p.exists() ? p.data() : {})).catch(() => ({}))));
      setLista(ids.map((id, i) => ({ uid: id, nombre: perfiles[i].nombre || 'Docente', area: perfiles[i].area || '' })).sort((a, b) => a.nombre.localeCompare(b.nombre)));
    }, () => setLista([]));
  }, [activo]);
  return lista;
}

/* ═══════ Solicitudes de protocolos ═══════
   solicitudes/{id}: { uid, nombre, procedimiento, especialidad, detalle, fecha, plazo 'AAAA-MM-DD', estado: 'recibida' | 'en preparación' | 'publicada' }
   El equipo de Criterium las ve y cambia su estado desde la consola de Firebase. */
export function useMisSolicitudes(uid) {
  const [lista, setLista] = useState([]);
  useEffect(() => {
    if (!uid) { setLista([]); return; }
    const q = query(collection(db, 'solicitudes'), where('uid', '==', uid));
    return onSnapshot(q, (snap) => setLista(snap.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => b.fecha.localeCompare(a.fecha))), () => setLista([]));
  }, [uid]);
  return lista;
}
export async function crearSolicitudFS(s) {
  return addDoc(collection(db, 'solicitudes'), { ...s, estado: 'recibida', fecha: new Date().toISOString() });
}

/* ═══════ Comentarios en cada paso de un protocolo ═══════
   comentarios/{id}: { protoId, paso (índice), pasoCorto, version, uid, autor: { uid, nombre, rol, docente },
                       tipo: 'comentario' | 'correccion', txt, fecha }
   Hoy los escribe y los lee cualquiera con sesión. Más adelante: correcciones de los expertos que validan
   el protocolo y comentarios de docentes para sus estudiantes (por eso se guardan el tipo y si el autor es docente). */
export function useComentariosProto(protoId, activo = true) {
  const [lista, setLista] = useState([]);
  useEffect(() => {
    if (!protoId || !activo) { setLista([]); return; }
    const q = query(collection(db, 'comentarios'), where('protoId', '==', protoId));
    return onSnapshot(q, (snap) => setLista(snap.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => a.fecha.localeCompare(b.fecha))), () => setLista([]));
  }, [protoId, activo]);
  return lista;
}
export async function comentarPasoFS(c) {
  return addDoc(collection(db, 'comentarios'), { ...c, fecha: new Date().toISOString() });
}
export async function borrarComentarioFS(id) {
  return deleteDoc(doc(db, 'comentarios', id));
}

/* ═══════ Borrar mi cuenta (privacidad) ═══════
   Borra lo que es de la persona: perfil público y privado, postulación, a quién sigue, sus publicaciones,
   lo que tiene en revisión y sus comentarios. Después auth.js borra la cuenta de acceso. */
export async function borrarMisDatosFS(uid) {
  const de = async (col, campo) => (await getDocs(query(collection(db, col), where(campo, '==', uid)))).docs;
  const docs = [...await de('seguimientos', 'de'), ...await de('feed', 'autorUid'), ...await de('pendientes', 'autorUid'), ...await de('comentarios', 'uid')];
  for (const d of docs) await deleteDoc(d.ref).catch(() => {});
  for (const ruta of ['perfiles', 'usuarios', 'postulaciones', 'curriculum']) await deleteDoc(doc(db, ruta, uid)).catch(() => {});
}


/* ═══════ Criterium Red · Bloque 3: Hoy (desafío, videos, rondas) y espacios por curso ═══════ */
const lista = (q, set, orden) => onSnapshot(q, (snap) => { const l = snap.docs.map((d) => ({ ...d.data(), id: d.id })); set(orden ? l.sort(orden) : l); }, () => set([]));
const ahoraISO = () => new Date().toISOString();

/** Desafío del día: desafios/{id} { fecha 'AAAA-MM-DD', pregunta, opciones[2-4], correcta, explicacion, especialidad, autor }.
 *  Respuestas en desafios/{id}/respuestas/{uid} (una por persona). Racha en rachas/{uid} { dias, mejor, ultimo }. */
export function useDesafios(activo = true) {
  const [l, set] = useState([]);
  useEffect(() => { if (!activo) return; return lista(query(collection(db, 'desafios'), orderBy('fecha', 'desc'), limit(30)), set); }, [activo]);
  return l;
}
export function useRespuestasDesafio(id) {
  const [l, set] = useState([]);
  useEffect(() => { if (!id) { set([]); return; } return lista(collection(db, 'desafios', id, 'respuestas'), set); }, [id]);
  return l;
}
export async function crearDesafioFS(d) { await addDoc(collection(db, 'desafios'), { ...d, creado: ahoraISO() }); }
export async function borrarDesafioFS(id) { await deleteDoc(doc(db, 'desafios', id)); }
export async function responderDesafioFS(id, uid, opcion, correcta) {
  await setDoc(doc(db, 'desafios', id, 'respuestas', uid), { uid, opcion, correcta, fecha: ahoraISO() });
}
export function useRacha(uid) {
  const [r, set] = useState(null);
  useEffect(() => { if (!uid) return; return onSnapshot(doc(db, 'rachas', uid), (s) => set(s.exists() ? s.data() : { dias: 0, mejor: 0, ultimo: '' }), () => set({ dias: 0, mejor: 0, ultimo: '' })); }, [uid]);
  return r;
}
export async function guardarRachaFS(uid, r) { await setDoc(doc(db, 'rachas', uid), r); }

/** Caso en 60 segundos: videos/{id} { url, plataforma 'youtube'|'vimeo', vid, titulo, paso, especialidad, autor, fecha, likedBy } */
export function useVideos(activo = true) {
  const [l, set] = useState([]);
  useEffect(() => { if (!activo) return; return lista(query(collection(db, 'videos'), orderBy('fecha', 'desc'), limit(40)), set); }, [activo]);
  return l;
}
export async function subirVideoFS(v) { await addDoc(collection(db, 'videos'), { ...v, fecha: ahoraISO(), likedBy: [] }); }
export async function borrarVideoFS(id) { await deleteDoc(doc(db, 'videos', id)); }
export async function meSirveVideoFS(id, uid, ya) { await updateDoc(doc(db, 'videos', id), { likedBy: ya ? arrayRemove(uid) : arrayUnion(uid) }); }

/** Ronda clínica en vivo: rondas/{id} { titulo, descripcion, especialidad, inicio ISO, duracion (min), enlace, autor, asistentes[uid], mensajes[] } */
export function useRondas(activo = true) {
  const [l, set] = useState([]);
  useEffect(() => { if (!activo) return; return lista(query(collection(db, 'rondas'), orderBy('inicio', 'desc'), limit(20)), set); }, [activo]);
  return l;
}
export async function crearRondaFS(r) { const x = await addDoc(collection(db, 'rondas'), { ...r, asistentes: [], mensajes: [], creado: ahoraISO() }); return x.id; }
export async function borrarRondaFS(id) { await deleteDoc(doc(db, 'rondas', id)); }
export async function avisameRondaFS(id, uid, ya) { await updateDoc(doc(db, 'rondas', id), { asistentes: ya ? arrayRemove(uid) : arrayUnion(uid) }); }
export async function mensajeRondaFS(id, m) { await updateDoc(doc(db, 'rondas', id), { mensajes: arrayUnion(m) }); }

/** Espacios por curso: grupos/{id} { nombre, descripcion, institucion, curso, creador { uid, nombre }, miembros [uid], creado }.
 *  Sus publicaciones viven en grupos/{id}/posts y solo las leen sus miembros. */
export function useGrupos(activo = true) {
  const [l, set] = useState(null);
  useEffect(() => { if (!activo) return; return lista(query(collection(db, 'grupos'), limit(200)), set, (a, b) => (b.creado || '').localeCompare(a.creado || '')); }, [activo]);
  return l;
}
export function usePostsGrupo(gid, activo = true) {
  const [l, set] = useState([]);
  useEffect(() => {
    if (!gid || !activo) { set([]); return; }
    return onSnapshot(collection(db, 'grupos', gid, 'posts'), (snap) => set(snap.docs.map((d) => ({ ...d.data(), id: d.id, _ruta: 'grupos/' + gid + '/posts/' + d.id })).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))), () => set([]));
  }, [gid, activo]);
  return l;
}
export async function crearGrupoFS(g) { const x = await addDoc(collection(db, 'grupos'), { ...g, creado: ahoraISO() }); return x.id; }
export async function unirseGrupoFS(gid, uid, salir) { await updateDoc(doc(db, 'grupos', gid), { miembros: salir ? arrayRemove(uid) : arrayUnion(uid) }); }
export async function borrarGrupoFS(gid) { await deleteDoc(doc(db, 'grupos', gid)); }
export async function publicarEnGrupoFS(gid, post) { await addDoc(collection(db, 'grupos', gid, 'posts'), { ...post, estado: 'publicado' }); }
export async function borrarPostGrupoFS(ruta) { await deleteDoc(doc(db, ruta)); }

/** Materia (Criterium Red): materia/{ramo} { nombre, descripcion, orden, paleta, clases [{ id, titulo, resumen, version, fecha, fuentes }] }
 *  y materia/{ramo}/clases/{id} { titulo, html, version, fecha, sha256, fuentes }. Las sube el equipo con npm run materia:subir. */
export function useMateria(activo = true) {
  const [l, set] = useState(null);
  useEffect(() => { if (!activo) return; return lista(collection(db, 'materia'), set, (a, b) => (a.orden || 0) - (b.orden || 0)); }, [activo]);
  return l;
}
export function useClaseMateria(ramo, id) {
  const [c, set] = useState(null);
  useEffect(() => {
    if (!ramo || !id) { set(false); return; }
    let vivo = true; set(null);
    getDoc(doc(db, 'materia', ramo, 'clases', id)).then((s) => { if (vivo) set(s.exists() ? { ...s.data(), id: s.id } : false); }, () => { if (vivo) set(false); });
    return () => { vivo = false; };
  }, [ramo, id]);
  return c;
}

/** Chat (Criterium Red): chats/{a_b} con uids ordenados, miembros, estado 'abierto' | 'solicitud' | 'rechazado',
 *  iniciadoPor, ultimo { txt, autor, fecha }, leido { uid: fecha }, actualizado; mensajes en chats/{id}/mensajes.
 *  Con quien sigues o te sigue nace abierto; si no, es una solicitud de un solo mensaje (ver firestore.rules). */
export const idChat = (a, b) => [a, b].sort().join('_');
export function useChats(uid) {
  const [l, set] = useState(null);
  useEffect(() => {
    if (!uid) { set([]); return; }
    return onSnapshot(query(collection(db, 'chats'), where('miembros', 'array-contains', uid)),
      (snap) => set(snap.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => (b.actualizado || '').localeCompare(a.actualizado || ''))), () => set([]));
  }, [uid]);
  return l;
}
export function useMensajesChat(cid, activo = true) {
  const [l, set] = useState(null);
  useEffect(() => {
    if (!cid || !activo) { set([]); return; }
    set(null);
    return onSnapshot(query(collection(db, 'chats', cid, 'mensajes'), orderBy('fecha', 'desc'), limit(300)),
      (snap) => set(snap.docs.map((d) => ({ ...d.data(), id: d.id })).reverse()), () => set([]));
  }, [cid, activo]);
  return l;
}
// Un mensaje: si el chat no existe, nace con él (abierto o como solicitud); si era una solicitud y respondes, se abre
export async function enviarMensajeChatFS({ yo, otro, txt, chat, relacion }) {
  const cid = idChat(yo, otro), fecha = new Date().toISOString();
  const b = writeBatch(db), ref = doc(db, 'chats', cid);
  const ultimo = { txt: txt.length > 140 ? txt.slice(0, 137) + '…' : txt, autor: yo, fecha };
  if (!chat) b.set(ref, { miembros: [yo, otro].sort(), estado: relacion ? 'abierto' : 'solicitud', iniciadoPor: yo, ultimo, leido: { [yo]: fecha }, actualizado: fecha });
  else b.update(ref, { ultimo, actualizado: fecha, ['leido.' + yo]: fecha, ...(chat.estado === 'solicitud' ? { estado: 'abierto' } : {}) });
  b.set(doc(collection(db, 'chats', cid, 'mensajes')), { autor: yo, txt, fecha });
  await b.commit();
  return cid;
}
export async function marcarLeidoChatFS(cid, yo) { await updateDoc(doc(db, 'chats', cid), { ['leido.' + yo]: new Date().toISOString() }); }
export async function rechazarSolicitudFS(cid) { await updateDoc(doc(db, 'chats', cid), { estado: 'rechazado' }); }
export function useBloqueos(uid) {
  const [l, set] = useState([]);
  useEffect(() => { if (!uid) { set([]); return; } return onSnapshot(query(collection(db, 'bloqueos'), where('de', '==', uid)), (s) => set(s.docs.map((d) => d.data().a)), () => set([])); }, [uid]);
  return l;
}
export async function meBloqueoFS(yo, otro) { try { return (await getDoc(doc(db, 'bloqueos', otro + '_' + yo))).exists(); } catch (e) { return false; } }
export async function bloquearFS(de, a) { await setDoc(doc(db, 'bloqueos', de + '_' + a), { de, a, fecha: new Date().toISOString() }); }
export async function desbloquearFS(de, a) { await deleteDoc(doc(db, 'bloqueos', de + '_' + a)); }

/** Currículum: curriculum/{uid} { resumen, formacion, investigacion, clinica, voluntariados, ayudantias, cursos, premios,
 *  idiomas: [{ t, l, p, d }], habilidades: [string], actualizado }. Lo lee cualquiera con sesión; lo escribe solo su dueño. */
export function useCurriculum(uid) {
  const [cv, set] = useState(undefined);
  useEffect(() => {
    if (!uid) { set(null); return; }
    set(undefined);
    return onSnapshot(doc(db, 'curriculum', uid), (s) => set(s.exists() ? s.data() : null), () => set(null));
  }, [uid]);
  return cv;
}
export async function guardarCurriculumFS(uid, cv) { await setDoc(doc(db, 'curriculum', uid), { ...cv, actualizado: new Date().toISOString() }); }
