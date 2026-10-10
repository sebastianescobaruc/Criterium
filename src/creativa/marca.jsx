// El logo de la Red. Desde el 2026-10-10 va sin el cartel «RED» (solo el logo de Criterium); CartelRed queda sin uso.
import React from 'react';
import { Logo } from '../ui.jsx';

export const LEMA_RED = 'Odontología basada en evidencia';
export function CartelRed({ size = 26, oscuro = false }) {
  const fs = Math.max(9, Math.round(size * 0.4));
  return (
    <span aria-label="Red" className="relative ml-[0.4em] inline-flex items-center align-baseline font-extrabold leading-none tracking-[.16em]"
      style={{ fontSize: fs, padding: '0.38em 0.6em 0.38em 0.76em', borderRadius: '0.55em', top: '-0.5em',
        background: oscuro ? 'var(--menta)' : 'linear-gradient(135deg, var(--acento), var(--deep))',
        color: oscuro ? 'var(--menta-ink)' : '#fff', boxShadow: oscuro ? 'none' : '0 2px 6px -2px rgba(15,37,48,.45)' }}>
      RED
    </span>
  );
}
export function MarcaRed({ size = 26, oscuro = false }) {
  return <Logo size={size} oscuro={oscuro} />;
}
