import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { CREATIVA } from './edicion.js';
import './index.css';

// Dos ediciones con el mismo código base: la completa y Criterium Red (Dirección creativa, sin protocolos)
// Si un archivo de la app no carga (una pestaña abierta antes de publicar una versión nueva, una red que se cortó), se recarga
// la página una sola vez para traer la versión vigente en vez de quedar en la pantalla de carga
const recargarUnaVez = () => { try { if (sessionStorage.getItem('criterium-recargada')) return false; sessionStorage.setItem('criterium-recargada', '1'); } catch (e) { return false; } location.reload(); return true; };
window.addEventListener('vite:preloadError', (e) => { if (recargarUnaVez()) e.preventDefault(); });
window.addEventListener('load', () => setTimeout(() => { try { sessionStorage.removeItem('criterium-recargada'); } catch (e) {} }, 10000));
const App = lazy(() => (CREATIVA ? import('./creativa/App.jsx') : import('./App.jsx')).catch((e) => { if (recargarUnaVez()) return new Promise(() => {}); throw e; }));

// Si algo falla al dibujar, en vez de una página en blanco se ve qué pasó y cómo seguir (recargar, o borrar lo guardado
// en este navegador: preferencias y la copia local de Firestore, sin tocar la cuenta ni los datos en la nube)
async function borrarLocalYRecargar() {
  try { Object.keys(localStorage).filter((k) => k.startsWith('criterium-')).forEach((k) => localStorage.removeItem(k)); sessionStorage.clear(); } catch (e) {}
  try { const dbs = indexedDB.databases ? await indexedDB.databases() : []; dbs.filter((d) => d.name && d.name.startsWith('firestore/')).forEach((d) => indexedDB.deleteDatabase(d.name)); } catch (e) {}
  location.reload();
}
class Protector extends React.Component {
  constructor(p) { super(p); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Criterium:', error, info && info.componentStack); try { window.criteriumListo && window.criteriumListo(); } catch (e) {} }
  render() {
    if (!this.state.error) return this.props.children;
    const msg = String((this.state.error && (this.state.error.message || this.state.error)) || 'Error desconocido').slice(0, 300);
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16, background: '#F2F6F7', fontFamily: '-apple-system,BlinkMacSystemFont,Inter,sans-serif' }}>
        <div style={{ maxWidth: 440, width: '100%', background: '#fff', border: '1px solid #DCE7EA', borderRadius: 14, padding: 24, color: '#132630' }}>
          <h1 style={{ margin: 0, fontSize: 19 }}>Algo falló al abrir Criterium</h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, color: '#3B5260' }}>Recarga la página. Si vuelve a pasar, borra lo guardado en este navegador: tu cuenta y tus datos en la nube no se tocan.</p>
          <p style={{ margin: '12px 0 0', padding: '8px 10px', background: '#F5F9FA', borderRadius: 8, fontSize: 12, color: '#5C727D', wordBreak: 'break-word' }}>Detalle: {msg}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => location.reload()} style={{ font: 'inherit', fontWeight: 600, fontSize: 14, border: 0, borderRadius: 999, padding: '10px 18px', background: '#2F6A78', color: '#fff', cursor: 'pointer' }}>Recargar</button>
            <button type="button" onClick={borrarLocalYRecargar} style={{ font: 'inherit', fontWeight: 600, fontSize: 14, border: '1px solid #DCE7EA', borderRadius: 999, padding: '10px 18px', background: '#fff', color: '#132630', cursor: 'pointer' }}>Borrar lo guardado y recargar</button>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Protector><Suspense fallback={null}><App /></Suspense></Protector>
  </React.StrictMode>
);
