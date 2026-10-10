// Piezas comunes de la sección Clínica: fechas, plata, nombres, roles, estados de cita, cabecera y pestañas.
import React from 'react';
import { useApp } from '../ctx.js';
import { Ic, cx } from '../ui.jsx';

export const iso = (d) => d.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
export const hoy = () => iso(new Date());
export const sumar = (f, n) => { const d = new Date(f + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
export const lunesDe = (f) => { const d = new Date(f + 'T12:00:00'); const dw = (d.getDay() + 6) % 7; return sumar(f, -dw); };
const may = (t) => t.charAt(0).toUpperCase() + t.slice(1);
export const fechaCorta = (f) => may(new Date(f + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }));
export const fechaLarga = (f) => may(new Date(f + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }));
export const fechaHora = (s) => new Date(s).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
export const diasHasta = (f) => Math.round((new Date(f + 'T12:00:00') - new Date(hoy() + 'T12:00:00')) / 864e5);
export const clp = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);
export const edad = (nac) => { if (!nac) return ''; const d = new Date(nac + 'T12:00:00'), h = new Date(); let e = h.getFullYear() - d.getFullYear(); if (h < new Date(h.getFullYear(), d.getMonth(), d.getDate())) e--; return e >= 0 && e < 120 ? e : ''; };
export const nombreDe = (p) => [p && p.nombres, p && p.apellidos].filter(Boolean).join(' ') || 'Paciente';
export const telefonoWa = (t) => String(t || '').replace(/\D/g, '');
export const ROLES = { admin: 'Administración', odontologo: 'Odontólogo', recepcion: 'Recepción' };
export const clinico = (rol) => rol === 'admin' || rol === 'odontologo';
// Estados de una cita, en el orden del día: agendada → confirmada → llegó (sala de espera) → en atención → atendida
export const ESTADOS_CITA = [
  { v: 'agendada', t: 'Agendada', cls: 'bg-[var(--cl-line-2)] text-ink2', dot: 'bg-ink3' },
  { v: 'confirmada', t: 'Confirmada', cls: 'bg-oksoft text-ok', dot: 'bg-ok' },
  { v: 'llego', t: 'En sala de espera', cls: 'bg-warnsoft text-warn', dot: 'bg-warn' },
  { v: 'en-atencion', t: 'En atención', cls: 'bg-acentosoft text-acentodeep', dot: 'bg-acento' },
  { v: 'atendida', t: 'Atendida', cls: 'bg-[var(--cl-sel)] text-deep', dot: 'bg-deep' },
  { v: 'no-asistio', t: 'No asistió', cls: 'bg-badsoft text-bad', dot: 'bg-bad' },
  { v: 'cancelada', t: 'Cancelada', cls: 'bg-[var(--cl-line-2)] text-ink3 line-through', dot: 'bg-ink3' }
];
export const estadoCita = (v) => ESTADOS_CITA.find((e) => e.v === v) || ESTADOS_CITA[0];
// Color de cada profesional (barra de sus citas en la agenda)
const COLORES_PROF = ['var(--cl-p1)', 'var(--cl-p2)', 'var(--cl-p3)', 'var(--cl-p4)', 'var(--cl-p5)', 'var(--cl-p6)'];
export const colorProf = (clinica, id) => { const i = (clinica.profesionales || []).findIndex((p) => p.id === id); return COLORES_PROF[(i < 0 ? 0 : i) % COLORES_PROF.length]; };
export const profDe = (clinica, id) => (clinica.profesionales || []).find((p) => p.id === id);
export const mins = (h) => { const [a, b] = String(h || '0:0').split(':').map(Number); return a * 60 + (b || 0); };
export const hhmm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
export const yoComo = (myUid, perfil) => ({ uid: myUid, nombre: (perfil && perfil.nombre) || 'Equipo' });

// Encabezado de una pantalla: título, bajada y acciones a la derecha (la clínica ya va en la barra superior)
export function Cabecera({ titulo, sub, acciones, antes }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {antes}
        <h1 className="m-0 text-[22px] font-bold tracking-[-.015em] text-deep">{titulo}</h1>
        {sub && <p className="m-0 mt-0.5 text-[13.5px] text-[var(--cl-muted)] first-letter:uppercase">{sub}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </header>
  );
}

// Pestañas subrayadas: [[clave, texto, número opcional]]
export function Pestanas({ items, valor, onChange }) {
  return (
    <nav className="scroll-x -mx-4 flex gap-5 overflow-x-auto border-b border-[var(--cl-line)] px-4 sm:mx-0 sm:px-0" role="tablist">
      {items.filter(Boolean).map(([k, t, n]) => (
        <button key={k} type="button" role="tab" aria-selected={valor === k} onClick={() => onChange(k)}
          className={cx('-mb-px flex flex-none items-center gap-1.5 border-b-2 pb-2.5 pt-1 text-[13.5px] font-semibold transition-colors', valor === k ? 'border-[var(--cl-pri)] text-deep' : 'border-transparent text-[var(--cl-muted)] hover:text-ink')}>
          {t}{n ? <span className={cx('rounded-full px-1.5 text-[11px] font-bold leading-[18px]', valor === k ? 'bg-[var(--cl-pri)] text-onc' : 'bg-warnsoft text-warn')}>{n}</span> : null}
        </button>
      ))}
    </nav>
  );
}

// Fila de una tabla simple
export function Fila({ children, onClick, className = '' }) {
  const C = onClick ? 'button' : 'div';
  return <C type={onClick ? 'button' : undefined} onClick={onClick} className={cx('flex w-full items-center gap-3 border-b border-[var(--cl-line-2)] px-4 py-2.5 text-left last:border-0', onClick && 'hover:bg-[var(--cl-hover)]', className)}>{children}</C>;
}
export const Tarjeta = ({ children, className = '' }) => <section className={cx('overflow-hidden rounded-[10px] border border-[var(--cl-line)] bg-card', className)}>{children}</section>;
// Recuadro con título (y acciones) arriba
export function Panel({ titulo, acciones, children, className = '', cuerpo = 'p-4' }) {
  return (
    <section className={cx('flex min-w-0 flex-col overflow-hidden rounded-[10px] border border-[var(--cl-line)] bg-card', className)}>
      {titulo && <div className="flex min-h-[44px] items-center justify-between gap-2 border-b border-[var(--cl-line-2)] px-4 py-2"><h2 className="m-0 text-[13.5px] font-bold text-deep">{titulo}</h2>{acciones}</div>}
      <div className={cuerpo}>{children}</div>
    </section>
  );
}
export function Alerta({ ic = 'alert', tono = 'warn', children, onClick }) {
  const T = { warn: 'text-warn', bad: 'text-bad', ok: 'text-ok', info: 'text-acento' }[tono];
  const C = onClick ? 'button' : 'div';
  return <C type={onClick ? 'button' : undefined} onClick={onClick} className={cx('flex w-full items-center gap-2.5 border-b border-[var(--cl-line-2)] px-4 py-2.5 text-left text-[13.5px] text-ink last:border-0', onClick && 'hover:bg-[var(--cl-hover)]')}><span className={cx('grid h-7 w-7 flex-none place-items-center rounded-full', { warn: 'bg-warnsoft', bad: 'bg-badsoft', ok: 'bg-oksoft', info: 'bg-acentosoft' }[tono], T)}><Ic n={ic} s={14} /></span><span className="min-w-0 flex-1">{children}</span>{onClick && <Ic n="back" s={14} className="rotate-180 text-ink3" />}</C>;
}
// Insignia de estado con punto
export function Insignia({ estado, children, cls, dot }) {
  const e = estado ? estadoCita(estado) : { t: children, cls, dot };
  return <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-[2px] text-[11.5px] font-semibold', e.cls)}><span className={cx('h-1.5 w-1.5 rounded-full', e.dot)} />{children || e.t}</span>;
}
// Fila de indicadores divididos (como el encabezado de un tablero)
export function Kpis({ items }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-[10px] border border-[var(--cl-line)] bg-card sm:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
      {items.filter(Boolean).map(([t, v, s, tono, onClick]) => {
        const C = onClick ? 'button' : 'div';
        return (
          <C key={t} type={onClick ? 'button' : undefined} onClick={onClick} className={cx('flex flex-col gap-0.5 border-b border-r border-[var(--cl-line-2)] px-4 py-3 text-left', onClick && 'hover:bg-[var(--cl-hover)]')}>
            <span className="text-[12px] font-semibold text-[var(--cl-muted)]">{t}</span>
            <b className={cx('text-[22px] font-bold leading-tight tabular-nums', tono || 'text-deep')}>{v}</b>
            {s && <span className="truncate text-[11.5px] text-ink3">{s}</span>}
          </C>
        );
      })}
    </div>
  );
}
// Panel que entra desde la derecha (detalle de una cita, de un insumo…)
export function PanelLateral({ titulo, cerrar, children, pie }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(15,37,48,.28)]" onMouseDown={(e) => { if (e.target === e.currentTarget) cerrar(); }} onKeyDown={(e) => e.key === 'Escape' && cerrar()}>
      <aside role="dialog" aria-modal="true" aria-label={titulo} className="cl-drawer flex h-full w-full max-w-[440px] flex-col border-l border-[var(--cl-line)] bg-card shadow-[-12px_0_40px_rgba(15,37,48,.12)]">
        <div className="flex h-14 flex-none items-center justify-between gap-2 border-b border-[var(--cl-line)] px-5"><h2 className="m-0 truncate text-[15px] font-bold text-deep">{titulo}</h2><button type="button" onClick={cerrar} aria-label="Cerrar" className="rounded-md p-1.5 text-ink3 hover:bg-[var(--cl-hover)]"><Ic n="x" s={18} /></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {pie && <div className="flex flex-none flex-wrap gap-2 border-t border-[var(--cl-line)] px-5 py-3">{pie}</div>}
      </aside>
    </div>
  );
}
// Cabecera de columnas de una tabla
export function CabTabla({ cols, plantilla }) {
  return <div className="hidden gap-3 border-b border-[var(--cl-line)] bg-[var(--cl-nav)] px-4 py-2 text-[11px] font-bold uppercase tracking-[.06em] text-[var(--cl-muted)] md:grid" style={{ gridTemplateColumns: plantilla }}>{cols.map((c, i) => <span key={i} className={c.startsWith('>') ? 'text-right' : ''}>{c.replace(/^>/, '')}</span>)}</div>;
}
