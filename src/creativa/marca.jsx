// El logo de Criterium Red con su cartel «FREE» al lado. El logo no se toca: el cartel va aparte.
import React from 'react';
import { Logo, cx } from '../ui.jsx';

export function Free({ oscuro = false, className = '' }) {
  return <span className={cx('inline-flex flex-none items-center rounded-full px-2 py-[3px] text-[10.5px] font-extrabold leading-none tracking-[.14em]', oscuro ? 'bg-menta text-mentaink' : 'bg-acento text-onc', className)}>FREE</span>;
}
export function MarcaRed({ size = 26, oscuro = false }) {
  return <span className="inline-flex items-center gap-2"><Logo size={size} oscuro={oscuro} /><Free oscuro={oscuro} /></span>;
}
