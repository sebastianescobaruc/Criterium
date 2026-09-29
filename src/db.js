import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, writeBatch, arrayUnion, arrayRemove, increment
} from 'firebase/firestore';
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from 'firebase/storage';
import { db, storage } from './firebase.js';

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

/** Escucha la cola de revisión (casos enviados, todos los autores) */
export function useColaRevision() {
  const [cola, setCola] = useState([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'casos'), where('estado', '==', 'enviado'), orderBy('actualizado', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setCola(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      setListo(true);
    }, () => setListo(true));
    return unsub;
  }, []);

  return [cola, listo];
}

/** Revisores que aprobaron casos con un protocolo (para la mención honrosa). Lee casos aprobados de cualquier autor. */
export function useAprobadoresProtocolo(protocoloId) {
  const [lista, setLista] = useState([]);

  useEffect(() => {
    if (!protocoloId) return;
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
  }, [protocoloId]);

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
      try { await deleteObject(ref(storage, f.storagePath)); } catch (e) {}
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
    const unsub = onSnapshot(q, (snap) => {
      setFeed(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      setListo(true);
    }, () => setListo(true));
    return unsub;
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
export async function toggleLikeFS(postId, uid, yaLeGusta) {
  await updateDoc(doc(db, 'feed', postId), yaLeGusta
    ? { likedBy: arrayRemove(uid), likes: increment(-1) }
    : { likedBy: arrayUnion(uid), likes: increment(1) });
}

/** Agrega una respuesta sin reescribir el resto de la publicación. */
export async function responderPostFS(postId, respuesta) {
  await updateDoc(doc(db, 'feed', postId), { respuestas: arrayUnion(respuesta) });
}

/** Perfil público: solo datos profesionales, nunca el correo. */
export const PERFIL_PUBLICO = ['nombre', 'rol', 'institucion', 'area', 'descripcion'];
export async function guardarPerfilPublicoFS(uid, p) {
  const datos = {};
  PERFIL_PUBLICO.forEach((k) => { datos[k] = (p && typeof p[k] === 'string') ? p[k] : ''; });
  await setDoc(doc(db, 'perfiles', uid), { ...datos, actualizado: new Date().toISOString() }, { merge: true });
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
