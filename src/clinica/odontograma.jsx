// Odontograma (notación FDI): dentición permanente o temporal. Cada diente tiene 5 caras (vestibular, lingual o palatino,
// mesial, distal y oclusal o incisal) y un estado del diente completo. Se marca con una herramienta y un toque.
// Datos: { '16': { estado: 'corona' | 'endodoncia' | 'ausente' | 'extraccion' | 'implante', caras: { O: 'caries', M: 'obturacion' } } }.
// Abajo, el COP-D (dientes cariados, perdidos y obturados) calculado del mismo odontograma.
import React, { useState } from 'react';
import { cx } from '../ui.jsx';

const PERMANENTE = [[18, 17, 16, 15, 14, 13, 12, 11], [21, 22, 23, 24, 25, 26, 27, 28], [48, 47, 46, 45, 44, 43, 42, 41], [31, 32, 33, 34, 35, 36, 37, 38]];
const TEMPORAL = [[55, 54, 53, 52, 51], [61, 62, 63, 64, 65], [85, 84, 83, 82, 81], [71, 72, 73, 74, 75]];
export const HERRAMIENTAS = [
  { k: 'caries', t: 'Caries', cara: true, color: 'var(--bad)' },
  { k: 'obturacion', t: 'Obturación', cara: true, color: 'var(--acento)' },
  { k: 'sellante', t: 'Sellante', cara: true, color: 'var(--menta)' },
  { k: 'corona', t: 'Corona', color: 'var(--warn)' },
  { k: 'endodoncia', t: 'Endodoncia', color: 'var(--deep)' },
  { k: 'implante', t: 'Implante', color: 'var(--esp-endo-ink, var(--acento))' },
  { k: 'ausente', t: 'Ausente', color: 'var(--ink-3)' },
  { k: 'extraccion', t: 'Extracción indicada', color: 'var(--bad)' },
  { k: 'sano', t: 'Borrar', color: 'var(--line)' }
];
const COLOR = Object.fromEntries(HERRAMIENTAS.map((h) => [h.k, h.color]));
const anterior = (n) => [1, 2, 3].includes(n % 10);
const superior = (n) => [1, 2, 5, 6].includes(Math.floor(n / 10));
const derechaPaciente = (n) => [1, 4, 5, 8].includes(Math.floor(n / 10)); // se dibuja a la izquierda de la pantalla
// Qué cara anatómica es cada zona del cuadro: arriba, abajo, izquierda, derecha y centro
function caraDe(n, zona) {
  if (zona === 'c') return anterior(n) ? 'I' : 'O';
  if (zona === 't') return superior(n) ? 'V' : 'L';
  if (zona === 'b') return superior(n) ? 'P' : 'V';
  const mesialALaDerecha = derechaPaciente(n);
  if (zona === 'r') return mesialALaDerecha ? 'M' : 'D';
  return mesialALaDerecha ? 'D' : 'M';
}
const NOMBRE_CARA = { V: 'vestibular', L: 'lingual', P: 'palatina', M: 'mesial', D: 'distal', O: 'oclusal', I: 'incisal' };

export function cpod(od) {
  let c = 0, p = 0, o = 0;
  Object.values(od || {}).forEach((d) => {
    const caras = Object.values(d.caras || {});
    if (d.estado === 'ausente' || d.estado === 'extraccion') { p++; return; }
    if (caras.includes('caries')) c++; else if (caras.includes('obturacion') || d.estado === 'corona') o++;
  });
  return { c, p, o, total: c + p + o };
}

function Diente({ n, d, onZona, soloVer }) {
  const caras = (d && d.caras) || {}, estado = d && d.estado;
  const fill = (zona) => COLOR[caras[caraDe(n, zona)]] || 'var(--card)';
  const zonas = [['t', '0,0 40,0 30,10 10,10'], ['b', '10,30 30,30 40,40 0,40'], ['l', '0,0 10,10 10,30 0,40'], ['r', '40,0 40,40 30,30 30,10'], ['c', '10,10 30,10 30,30 10,30']];
  return (
    <div className="flex flex-col items-center gap-0.5">
      {superior(n) && <span className="text-[10.5px] font-bold tabular-nums text-ink3">{n}</span>}
      <svg viewBox="-3 -3 46 46" className={cx('h-9 w-9 sm:h-10 sm:w-10', !soloVer && 'cursor-pointer')} role="img" aria-label={`Diente ${n}${estado ? ', ' + estado : ''}`}>
        {estado === 'corona' && <circle cx="20" cy="20" r="22" fill="none" stroke={COLOR.corona} strokeWidth="3" />}
        {zonas.map(([z, pts]) => (
          <polygon key={z} points={pts} fill={estado === 'ausente' ? 'var(--soft)' : fill(z)} stroke="var(--line)" strokeWidth="1.2"
            onClick={soloVer ? undefined : () => onZona(n, caraDe(n, z))}><title>{`${n} · ${NOMBRE_CARA[caraDe(n, z)]}`}</title></polygon>
        ))}
        {estado === 'endodoncia' && <path d="M20 -2V42" stroke={COLOR.endodoncia} strokeWidth="3" pointerEvents="none" />}
        {estado === 'implante' && <path d="M14 26h12M15 31h10M16 36h8M20 20v18" stroke={COLOR.implante} strokeWidth="2.4" pointerEvents="none" />}
        {(estado === 'ausente' || estado === 'extraccion') && <path d="M2 2L38 38M38 2L2 38" stroke={estado === 'ausente' ? COLOR.ausente : COLOR.extraccion} strokeWidth="3" strokeLinecap="round" pointerEvents="none" />}
      </svg>
      {!superior(n) && <span className="text-[10.5px] font-bold tabular-nums text-ink3">{n}</span>}
    </div>
  );
}

export function Odontograma({ valor, onChange, soloVer = false }) {
  const [temporal, setTemporal] = useState(false);
  const [herr, setHerr] = useState('caries');
  const od = valor || {};
  const tocar = (n, cara) => {
    const h = HERRAMIENTAS.find((x) => x.k === herr);
    const prev = od[n] || { caras: {} };
    let nuevo;
    if (herr === 'sano') nuevo = null;
    else if (h.cara) nuevo = { ...prev, caras: { ...(prev.caras || {}), [cara]: (prev.caras || {})[cara] === herr ? undefined : herr } };
    else nuevo = { ...prev, estado: prev.estado === herr ? undefined : herr };
    const sig = { ...od };
    if (!nuevo || (!nuevo.estado && !Object.values(nuevo.caras || {}).some(Boolean))) delete sig[n];
    else { nuevo.caras = Object.fromEntries(Object.entries(nuevo.caras || {}).filter(([, v]) => v)); if (!nuevo.estado) delete nuevo.estado; sig[n] = nuevo; }
    onChange(sig);
  };
  const filas = temporal ? TEMPORAL : PERMANENTE;
  const k = cpod(od);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {[['Permanente', false], ['Temporal', true]].map(([t, v]) => <button key={t} type="button" onClick={() => setTemporal(v)} aria-pressed={temporal === v} className={cx('rounded-full px-3 py-1 text-[12.5px] font-semibold', temporal === v ? 'bg-deep text-onc' : 'bg-soft text-ink2')}>{t}</button>)}
      </div>
      {!soloVer && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Herramienta">
          {HERRAMIENTAS.map((h) => (
            <button key={h.k} type="button" onClick={() => setHerr(h.k)} aria-pressed={herr === h.k}
              className={cx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold', herr === h.k ? 'border-deep bg-deep text-onc' : 'border-cardline bg-card text-ink2')}>
              <span className="h-3 w-3 rounded-full border border-cardline" style={{ background: h.color }} aria-hidden="true" />{h.t}
            </button>
          ))}
        </div>
      )}
      <div className="overflow-x-auto rounded-[18px] bg-soft p-3 sm:p-4">
        <div className="mx-auto flex w-max flex-col gap-3">
          {[0, 2].map((f) => (
            <div key={f} className="flex items-end justify-center gap-3">
              <div className="flex gap-1">{filas[f].map((n) => <Diente key={n} n={n} d={od[n]} onZona={tocar} soloVer={soloVer} />)}</div>
              <span className="w-px self-stretch bg-line" aria-hidden="true" />
              <div className="flex gap-1">{filas[f + 1].map((n) => <Diente key={n} n={n} d={od[n]} onZona={tocar} soloVer={soloVer} />)}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-ink2">
        <b className="text-ink">COP-D {k.total}</b><span>Cariados {k.c}</span><span>Perdidos {k.p}</span><span>Obturados {k.o}</span>
        <span className="text-ink3">{soloVer ? '' : 'Toca una cara para marcarla; las herramientas del diente completo (corona, endodoncia…) se aplican tocando cualquier cara.'}</span>
      </div>
    </div>
  );
}
