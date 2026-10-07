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
        try {
          const snap = await getDoc(doc(db, 'usuarios', user.uid));
          setPerfil(snap.exists() ? snap.data() : null);
        } catch (e) { setPerfil(null); }
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
export async function registrar(email, password, datosExtra) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

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
    'auth/missing-password': 'Escribe tu contraseña.'
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
