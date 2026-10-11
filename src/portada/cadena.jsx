// «Cómo funciona»: la guía del procedimiento recorre la atención, de la cita a la caja.
// Al entrar en pantalla los eslabones se encienden uno tras otro y después laten en secuencia (clases .cadena-* en index.css).
// Con «reducir movimiento» quedan encendidos y quietos. Cada texto describe algo que la Clínica ya hace (src/clinica/).
import React from 'react';
import { Icono, useRevela } from './base.jsx';

const ESLABONES = [
  ['calendario', 'Cita', 'Agendas la prestación con su guía clínica, la pieza y quién asiste.'],
  ['bandeja', 'Bandeja', 'Quien asiste prepara la bandeja de la guía y marca lo que puso.'],
  ['evolucion', 'Evolución', 'La nota se redacta con los pasos hechos. Tú la revisas y la firmas.'],
  ['insumos', 'Insumos', 'Al firmar, lo que se usó se descuenta del inventario.'],
  ['lote', 'Lote', 'El lote de esterilización del instrumental queda en la evolución.'],
  ['caja', 'Caja', 'La cita queda atendida y lista para cobrar.']
];

export function Cadena() {
  const [ref, visible] = useRevela();
  return (
    <ol ref={ref} data-visible={visible ? '' : undefined} className="cadena m-0 grid list-none p-0 lg:grid-cols-6">
      {ESLABONES.map(([ic, t, x], i) => (
        <li key={t} className="relative flex gap-4 pb-9 last:pb-0 lg:flex-col lg:items-center lg:px-3 lg:pb-0 lg:text-center" style={{ '--i': i }}>
          {i < ESLABONES.length - 1 && <span className="cadena-tramo" aria-hidden="true"><span /></span>}
          <span className="cadena-nodo relative z-[1] grid h-14 w-14 flex-none place-items-center rounded-full border"><Icono n={ic} s={22} /></span>
          <div className="min-w-0 pt-1 lg:pt-0">
            <p className="m-0 text-[12px] font-semibold tracking-[.06em] text-s-destaque">0{i + 1}</p>
            <h3 className="m-0 text-[18px] font-semibold leading-snug">{t}</h3>
            <p className="m-0 mt-1 text-s-chico text-s-sobre-marca-2 lg:mx-auto lg:max-w-[22ch]">{x}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
