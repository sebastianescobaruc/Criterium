import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { CREATIVA } from './edicion.js';
import './index.css';

// Dos ediciones con el mismo código base: la completa y Criterium Red (Dirección creativa, sin protocolos)
const App = lazy(() => (CREATIVA ? import('./creativa/App.jsx') : import('./App.jsx')));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={null}><App /></Suspense>
  </React.StrictMode>
);
