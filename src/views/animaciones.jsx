// Animación esquemática de cada paso: un corte del diente dibujado en SVG que muestra el gesto del paso, en bucle.
// Cada paso de data.js nombra su escena con `anim` (por ejemplo 'molar.fresa'); las escenas se reutilizan entre
// protocolos (aislar, grabar, fotopolimerizar…). Sin archivos de video: se dibuja en el navegador, pesa casi nada
// y funciona sin internet. Animación con SMIL (<animate>), que no necesita JavaScript para correr.
// Regla: cada escena muestra solo lo que dice el paso, sin técnica nueva. Es un esquema, no a escala.
import React, { useEffect, useRef } from 'react';
import { cx } from '../ui.jsx';
import { ESCENAS_MOLAR } from './anim/molar.jsx';
import { ESCENAS_PERIO } from './anim/perio.jsx';
import { ESCENAS_EXO } from './anim/exo.jsx';
import { ESCENAS_ENDO } from './anim/endo.jsx';
import { ESCENAS_PMMA } from './anim/pmma.jsx';
import { RecetaEscena, validarReceta } from './anim/receta.jsx';

// Todas las escenas, por base: cada archivo de anim/ dibuja una base (molar, premolar, maxilar, periodonto, muñón)
export const ESCENAS = { ...ESCENAS_MOLAR, ...ESCENAS_PERIO, ...ESCENAS_EXO, ...ESCENAS_ENDO, ...ESCENAS_PMMA };

const reducido = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

// La animación de un paso. Se pausa fuera de la pantalla; con «reducir movimiento» queda quieta en su momento clave.
// `id` es el nombre de una escena hecha a mano o una receta (objeto, ver anim/receta.jsx). Una receta con errores no se dibuja.
export function escenaDe(id) {
  if (id && typeof id === 'object') {
    if (validarReceta(id).length) return null;
    return { d: id.duracion || 7, quieto: id.quieto ?? 0.8, alt: id.alt || 'Esquema animado del paso.', C: ({ d }) => <RecetaEscena r={id} d={d} /> };
  }
  return ESCENAS[id] || null;
}
export function Animacion({ id, className = '' }) {
  const e = escenaDe(id);
  const ref = useRef(null);
  useEffect(() => {
    const svg = ref.current; if (!svg || !e || !svg.pauseAnimations) return;
    if (reducido()) { svg.pauseAnimations(); svg.setCurrentTime(e.d * e.quieto); return; }
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([x]) => { if (x.isIntersecting) svg.unpauseAnimations(); else svg.pauseAnimations(); });
    io.observe(svg);
    return () => io.disconnect();
  }, [id]);
  if (!e) return null;
  const { C } = e;
  return (
    <figure className={cx('anim m-0 overflow-hidden rounded-[22px] bg-card shadow-sh', className)}>
      <svg ref={ref} viewBox="40 4 360 180" role="img" aria-label={e.alt} className="block h-auto w-full">
        <C d={e.d} />
      </svg>
      <figcaption className="flex items-center justify-between gap-3 border-t border-line2 px-4 py-2 text-[11.5px] text-ink3">
        <span>Esquema animado · no a escala</span>
      </figcaption>
    </figure>
  );
}
