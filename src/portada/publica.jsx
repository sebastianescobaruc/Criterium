// La portada sin Firebase: main.jsx la muestra cuando index.html marcó la visita como pública (sin sesión guardada,
// sin # ni ?; ver el plugin criterium-pantalla-red de vite.config.js). Si igual hay una sesión de Firebase guardada en
// este navegador (alguien que entró antes de existir la marca), abre la app de inmediato.
import React, { useEffect } from 'react';
import { Portada } from './portada.jsx';

// Firebase Auth guarda la sesión en IndexedDB (firebaseLocalStorageDb) o, si no puede, en localStorage
function haySesionFirebase() {
  return new Promise((res) => {
    try {
      if (Object.keys(localStorage).some((k) => k.startsWith('firebase:authUser:'))) return res(true);
      const pedido = indexedDB.open('firebaseLocalStorageDb');
      pedido.onupgradeneeded = () => { pedido.transaction.abort(); res(false); };
      pedido.onerror = () => res(false);
      pedido.onsuccess = () => {
        const bd = pedido.result;
        try {
          const lista = bd.transaction('firebaseLocalStorage', 'readonly').objectStore('firebaseLocalStorage').getAllKeys();
          lista.onsuccess = () => { bd.close(); res(lista.result.some((k) => String(k).startsWith('firebase:authUser:'))); };
          lista.onerror = () => { bd.close(); res(false); };
        } catch (e) { bd.close(); res(false); }
      };
    } catch (e) { res(false); }
  });
}

export default function Publica({ abrirApp, precargar }) {
  useEffect(() => {
    try { window.criteriumListo && window.criteriumListo(); } catch (e) {}
    let vivo = true;
    haySesionFirebase().then((si) => { if (si && vivo) abrirApp(); });
    return () => { vivo = false; };
  }, []);
  return <Portada entrar={abrirApp} privacidad={() => abrirApp('privacidad')} precargar={precargar} />;
}
