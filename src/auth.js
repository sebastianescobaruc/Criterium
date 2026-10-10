import { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase.js';

/* ═══ Hook: escucha el estado de sesión ═══ */
export function useUsuario() {
  const [usuario, setUsuario] = useState(undefined); // undefined = cargando, null = sin sesión
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUsuario(user);
      if (user) {
        // El perfil no puede dejar pegada la pantalla de carga: se espera a lo más 2,5 s y, si llega después, se usa igual
        const leer = getDoc(doc(db, 'usuarios', user.uid)).then((snap) => { setPerfil(snap.exists() ? snap.data() : null); }).catch(() => setPerfil(null));
        await Promise.race([leer, new Promise((r) => setTimeout(r, 2500))]);
      } else {
        setPerfil(null);
      }
      setCargando(false);
    });
    return unsub;
  }, []);

  return { usuario, perfil, setPerfil, cargando };
}

/* ═══ Registro ═══ */
// invitacion: código del modo piloto (correos de dominios por invitación). Se valida antes de crear la cuenta y se usa
// apenas existe; si falla, la cuenta recién creada se borra para no dejarla a medias.
export async function registrar(email, password, datosExtra, invitacion) {
  if (invitacion) {
    const { invitacionValida } = await import('./piloto.js');
    if (!(await invitacionValida(invitacion))) { const e = new Error('invitacion'); e.code = 'criterium/invitacion'; throw e; }
  }
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  if (invitacion) {
    try { const { canjearInvitacion } = await import('./piloto.js'); await canjearInvitacion(user.uid, invitacion); }
    catch (er) {
      try { sessionStorage.setItem('criterium-error-registro', 'criterium/invitacion'); } catch (x) {}
      await deleteUser(user).catch(() => signOut(auth));
      const e = new Error('invitacion'); e.code = 'criterium/invitacion'; throw e;
    }
  }

  // Guardar display name en Auth
  await updateProfile(user, { displayName: datosExtra.nombre });

  // Crear documento de perfil en Firestore
  const perfilDoc = {
    nombre: datosExtra.nombre,
    email: email,
    // El resto del perfil profesional (etapa, institución, año, intereses) lo completa la bienvenida
    rol: datosExtra.rol || 'Estudiante de pregrado',
    institucion: datosExtra.institucion || '',
    area: datosExtra.area || '',
    onboarding: false,
    creadoEn: serverTimestamp()
  };
  await setDoc(doc(db, 'usuarios', user.uid), perfilDoc);

  return { user, perfil: perfilDoc };
}

/* ═══ Iniciar sesión ═══ */
export async function iniciarSesion(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, 'usuarios', cred.user.uid));
  return { user: cred.user, perfil: snap.exists() ? snap.data() : null };
}

/* ═══ Cerrar sesión ═══ */
export async function cerrarSesion() {
  await signOut(auth);
}

/* ═══ Recuperar contraseña ═══ */
export async function recuperarPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/* ═══ Actualizar perfil ═══ */
export async function actualizarPerfil(uid, datos) {
  await setDoc(doc(db, 'usuarios', uid), datos, { merge: true });
  if (datos.nombre) {
    await updateProfile(auth.currentUser, { displayName: datos.nombre });
  }
}

/* ═══ Traducir errores de Firebase Auth al español ═══ */
export function errorAuth(code) {
  const mapa = {
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/operation-not-allowed': 'El registro con correo no está habilitado.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/user-disabled': 'Esta cuenta fue deshabilitada.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos. Espera un momento y vuelve a intentar.',
    'auth/network-request-failed': 'Sin conexión a internet.',
    'auth/missing-password': 'Escribe tu contraseña.',
    'criterium/invitacion': 'Ese código de invitación no existe o ya se usó. Revísalo o pídele uno nuevo al equipo del estudio.'
  };
  return mapa[code] || 'Ocurrió un error. Intenta de nuevo.';
}

/* ═══ Borrar la cuenta: confirma con la contraseña, borra los datos (borrarDatos) y después la cuenta de acceso ═══ */
export async function borrarCuenta(password, borrarDatos) {
  const u = auth.currentUser;
  if (!u) throw new Error('sin sesión');
  await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, password));
  await borrarDatos(u.uid);
  await deleteUser(u);
}
