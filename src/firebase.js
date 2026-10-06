import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, indexedDBLocalPersistence, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID
};

export const app = initializeApp(firebaseConfig);
// Dentro de la app de iOS (Capacitor), getAuth se queda esperando el resolvedor de ventanas emergentes:
// ahí se inicializa con persistencia en IndexedDB y sin popups. En el navegador sigue igual.
const nativa = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
export const auth = nativa ? initializeAuth(app, { persistence: indexedDBLocalPersistence }) : getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/* Persistencia offline de Firestore — falla silenciosamente en incógnito */
enableIndexedDbPersistence(db).catch(() => {});
