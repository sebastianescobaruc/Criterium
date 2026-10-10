import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, indexedDBLocalPersistence, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache } from 'firebase/firestore';

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
// Firestore con copia local compartida entre pestañas (la recomendada por Firebase). En Safari la copia local en IndexedDB
// puede quedarse esperando para siempre (sobre todo con varias pestañas abiertas) y la app no pasa de «cargando»: ahí va
// en memoria. Con emuladores, también en memoria, para no mezclar datos.
const emuladores = import.meta.env.VITE_EMULADORES === 'true';
const esSafari = typeof navigator !== 'undefined' && /^((?!chrome|chromium|crios|fxios|edg|android).)*safari/i.test(navigator.userAgent);
const cacheLocal = () => { try { return emuladores || esSafari ? memoryLocalCache() : persistentLocalCache({ tabManager: persistentMultipleTabManager() }); } catch (e) { return memoryLocalCache(); } };
export const db = initializeFirestore(app, { localCache: cacheLocal() });
// Storage (fotos de casos) se carga recién al subir o borrar una foto: no pesa en la carga inicial
export const usarStorage = async () => { const m = await import('firebase/storage'); return { ...m, storage: m.getStorage(app) }; };

// Emuladores locales (npm run emuladores + VITE_EMULADORES=true): para probar el modo piloto con usuarios ficticios
if (emuladores) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

