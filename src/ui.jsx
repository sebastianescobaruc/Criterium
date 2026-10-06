import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ESTADOS, iniciales } from './logic.js';

export const cx = (...a) => a.filter(Boolean).join(' ');

const PATHS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  home: <><path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19z" /></>,
  book: <><path d="M4 6a2 2 0 0 1 2-2h4v16H6a2 2 0 0 1-2-2z" /><path d="M10 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M17.5 6l2.2 12.3" /></>,
  folder: <><path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h4l2 2.2h7a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /><path d="M8.5 13.5h7M12 10v7" /></>,
  stamp: <><path d="M9.5 3.5h5l-.8 6.2h-3.4z" /><path d="M5 13.2a2.2 2.2 0 0 1 2.2-2.2h9.6a2.2 2.2 0 0 1 2.2 2.2v2.3H5z" /><path d="M5 19.5h14" /></>,
  bot: <><path d="M12 3v2.2" /><rect x="4.5" y="5.2" width="15" height="12.6" rx="3.2" /><circle cx="9" cy="11.5" r="1.1" /><circle cx="15" cy="11.5" r="1.1" /><path d="M9.5 14.8h5" /></>,
  tool: <><path d="M14.5 4.2a4.2 4.2 0 0 0 5.3 5.4l-9 9a2.4 2.4 0 0 1-3.4-3.4z" /><path d="M5 19.5h.01" /></>,
  chat: <><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20.5l1.6-4.9A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z" /></>,
  userCheck: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M17 7.5l1.7 1.7L22 6" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3.8 6.6l8.2 5.8 8.2-5.8" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  x: <><path d="M6 6l12 12M18 6 6 18" /></>,
  check: <><path d="M5 12.5l4.5 4.5L19 7.5" /></>,
  camera: <><path d="M4 8.5A2 2 0 0 1 6 6.5h1.8l1.4-2h5.6l1.4 2H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><circle cx="12" cy="12.5" r="3.4" /></>,
  trash: <><path d="M5 7h14M9.5 7V5h5v2M7 7l.8 12h8.4L17 7" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>,
  send: <><path d="M20.5 3.5 10 14M20.5 3.5l-6.5 17-4-7.5-7.5-4z" /></>,
  back: <><path d="M15 18l-6-6 6-6" /></>,
  moon: <><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></>,
  download: <><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  panel: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><path d="M9.5 4.5v15" /></>,
  panelder: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><path d="M14.5 4.5v15" /></>,
  dots: <><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  alert: <><path d="M12 4 2.8 19.5h18.4z" /><path d="M12 10v4.2M12 17h.01" /></>,
  volumen: <><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" /><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.5a8 8 0 0 1 0 11" /></>,
  red: <><circle cx="6" cy="7" r="2.6" /><circle cx="18" cy="6" r="2.2" /><circle cx="12" cy="17.5" r="3" /><path d="M8.4 8.2l2.4 6.6M15.9 7.3l-2.6 7.7M8.6 6.8l7.2-.6" /></>,
  expand: <><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></>,
  shrink: <><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></>,
  ext: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="M20.5 16.5 15 11l-9.5 8.5" /></>,
  heart: <><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
  sparkle: <><path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z" /><path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" /></>
};

/* Logo: la C de Criterium con una muela al centro y un tramo en verde azulado. Recreado en SVG desde el logo oficial. */
export function Logo({ size = 26, texto = true, oscuro = false, className = '' }) {
  return (
    <span className={cx('inline-flex items-center gap-2', className)}>
      <svg width={size} height={size} viewBox="61 60 317 317" aria-hidden="true" className="flex-none">
        <path d="M101 60H338A40 40 0 0 1 378 100V337A40 40 0 0 1 338 377H101A40 40 0 0 1 61 337V100A40 40 0 0 1 101 60Z" style={{ fill: 'var(--logo-bg)' }} />
        <path d="M301.1 151.1A115 115 0 1 0 270.5 324.6L250.0 289.1A74 74 0 1 1 269.7 177.4Z" fill="#FFFFFF" />
        <path d="M266.1 327.0A115 115 0 0 0 323.2 258L279.2 258A74 74 0 0 1 247.2 290.6Z" style={{ fill: 'var(--logo-acc)' }} />
        <path d="M210 194C222 184 252 182 254 212C256 232 246 244 242 264C238 282 234 292 228 292C220 292 219 268 210 252C201 268 200 292 192 292C186 292 182 282 178 264C174 244 164 232 166 212C168 182 198 184 210 194Z" fill="#FFFFFF" />
      </svg>
      {texto && <span className="font-bold leading-none tracking-[-.025em]" style={{ fontSize: Math.round(size * 0.86) }}><span className={oscuro ? 'text-panelink' : 'text-deep'}>Criter</span><span className={oscuro ? 'text-menta' : 'text-acento'}>ium</span></span>}
    </span>
  );
}

export function Ic({ n, s = 17, className = '', sw = 1.7 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={cx('flex-none', className)} aria-hidden="true">
      {PATHS[n]}
    </svg>
  );
}

const TONOS = {
  neutro: 'bg-soft text-ink2',
  acento: 'bg-acentosoft text-acentodeep',
  warn: 'bg-warnsoft text-warn',
  ok: 'bg-oksoft text-ok',
  bad: 'bg-badsoft text-bad'
};
export function Pill({ tono = 'neutro', children, className = '' }) {
  return <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold leading-5 whitespace-nowrap', TONOS[tono], className)}>{children}</span>;
}
export function EstadoPill({ estado }) {
  const e = ESTADOS[estado] || ESTADOS.borrador;
  return <Pill tono={e.tono}><span className="h-1.5 w-1.5 rounded-full bg-current" />{e.txt}</Pill>;
}

const VAR = {
  primary: 'bg-acento text-onc hover:bg-acentodeep border border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_6px_16px_-8px_var(--acento)]',
  outline: 'bg-card text-ink2 border border-cardline shadow-sh hover:bg-soft',
  soft: 'bg-acentosoft text-acentodeep border border-transparent hover:brightness-95',
  ghost: 'bg-transparent text-acentodeep border border-transparent hover:bg-soft',
  danger: 'bg-bad text-onc border border-transparent hover:brightness-95',
  dangerOutline: 'bg-card text-bad border border-cardline shadow-sh hover:bg-badsoft'
};
export function Btn({ v = 'outline', sm, className = '', icon, children, ...p }) {
  return (
    <button type="button" {...p}
      className={cx('inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background-color,box-shadow,transform] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45',
        sm ? 'px-3.5 py-1.5 text-[12.5px]' : 'px-[18px] py-2.5 text-[13.5px]', VAR[v], className)}>
      {icon && <Ic n={icon} s={sm ? 14 : 16} />}{children}
    </button>
  );
}

export const inputCls = 'w-full rounded-rs border border-cardline bg-input px-3.5 py-2.5 text-[14.5px] text-ink placeholder:text-ink3 outline-none transition focus:border-acento focus:bg-card focus:ring-4 focus:ring-acentosoft';
export const inputErr = 'border-bad focus:border-bad';

export function Field({ label, hint, error, id, className = '', children }) {
  return (
    <div className={cx('flex min-w-0 flex-col gap-1.5', className)}>
      {label && <label htmlFor={id} className="text-[12.5px] font-semibold text-ink2">{label}</label>}
      {children}
      {error ? <span className="text-[12px] font-medium leading-snug text-bad" role="alert">{error}</span>
        : hint ? <span className="text-[11.5px] leading-snug text-ink3">{hint}</span> : null}
    </div>
  );
}

export function Seg({ opciones, valor, onChange, size = 'md', className = '' }) {
  return (
    <div className={cx('flex flex-wrap gap-1.5', className)} role="group">
      {opciones.map((o) => {
        const val = typeof o === 'string' ? o : o.v; const txt = typeof o === 'string' ? o : o.t;
        const on = valor === val;
        return (
          <button key={val} type="button" aria-pressed={on} onClick={() => onChange(val)}
            className={cx('flex-none whitespace-nowrap rounded-full border font-semibold transition-colors', size === 'sm' ? 'px-3 py-1 text-[12px]' : 'px-3.5 py-1.5 text-[12.5px]',
              on ? (o.tono === 'bad' ? 'border-bad bg-bad text-onc' : o.tono === 'warn' ? 'border-warn bg-warn text-onc' : o.tono === 'ok' ? 'border-ok bg-ok text-onc' : 'border-acento bg-acento text-onc')
                : 'border-cardline bg-card text-ink2 shadow-sh hover:border-acento')}>
            {txt}{o.n !== undefined && <span className={cx('ml-1.5 tabular-nums', on ? 'opacity-80' : 'text-ink3')}>{o.n}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide, bare }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    const t = setTimeout(() => { const el = ref.current && ref.current.querySelector('input,textarea,select,button'); el && el.focus(); }, 30);
    return () => { window.removeEventListener('keydown', k); clearTimeout(t); };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(18,17,12,.5)] p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title}
        className={cx('max-h-[92vh] w-full overflow-auto border border-cardline bg-card shadow-shlg rounded-t-[24px] sm:rounded-[24px]', wide ? 'sm:max-w-4xl' : 'sm:max-w-lg')}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {!bare && (
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line2 bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-6 py-4 backdrop-blur-xl">
            <h2 className="text-[16px] font-bold text-deep">{title}</h2>
            <button type="button" onClick={onClose} className="rounded-full p-1.5 text-ink3 hover:bg-soft hover:text-ink" aria-label="Cerrar"><Ic n="x" /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Avatar({ nombre, verificado, size = 36 }) {
  return (
    <div className={cx('grid flex-none place-items-center rounded-full font-bold ring-1 ring-inset ring-cardline', verificado ? 'bg-ok text-onc' : 'text-acentodeep')}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.33), background: verificado ? undefined : 'linear-gradient(145deg,var(--acento-soft),var(--soft))' }}>{iniciales(nombre)}</div>
  );
}

/* Foto clínica: siempre completa dentro de su marco, nunca recortada. */
const fotoSrc = (foto) => foto.url || foto.data || '';
export function Foto({ foto, onOpen, alto = 'aspect-[4/3]', children }) {
  return (
    <figure className="m-0 flex min-w-0 flex-col gap-1.5">
      <button type="button" onClick={onOpen} className={cx('group relative w-full overflow-hidden rounded-rs border border-cardline shadow-sh', alto)} style={{ background: 'radial-gradient(circle at 50% 40%,var(--card),var(--soft))' }} aria-label={'Ver foto ' + (foto.tipo || '')}>
        <img src={fotoSrc(foto)} alt={(foto.tipo || 'Foto') + (foto.nota ? ': ' + foto.nota : '')} className="absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]" />
      </button>
      <figcaption className="flex items-center justify-between gap-2 text-[11.5px] text-ink3">
        <span className="truncate"><b className="font-semibold text-ink2">{foto.tipo}</b>{foto.nota ? ' · ' + foto.nota : ''}</span>
        {children}
      </figcaption>
    </figure>
  );
}

export function Lightbox({ foto, onClose }) {
  useEffect(() => {
    if (!foto) return;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [foto]);
  if (!foto) return null;
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[rgba(12,11,8,.94)]" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white" style={{ paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))' }}>
        <span className="text-[13px]"><b>{foto.tipo}</b>{foto.nota ? ' · ' + foto.nota : ''}</span>
        <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Cerrar"><Ic n="x" s={20} /></button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <img src={fotoSrc(foto)} alt={foto.tipo} className="max-h-full max-w-full object-contain" />
      </div>
    </div>
  );
}

export function Vacio({ icon = 'folder', titulo, children, accion }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-r border-2 border-dashed border-line bg-[color-mix(in_srgb,var(--card)_70%,transparent)] px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-card text-acento shadow-sh ring-1 ring-cardline"><Ic n={icon} s={22} /></div>
      <h3 className="m-0 text-[15.5px] font-bold text-deep">{titulo}</h3>
      {children && <p className="m-0 max-w-[52ch] text-[13.5px] leading-relaxed text-ink2">{children}</p>}
      {accion}
    </div>
  );
}

const NIVEL = {
  falla: { t: 'Bloquea', cls: 'bg-badsoft text-bad', dot: 'bg-bad' },
  revisar: { t: 'Revisar', cls: 'bg-warnsoft text-warn', dot: 'bg-warn' },
  info: { t: 'Info', cls: 'bg-soft text-ink2', dot: 'bg-ink3' }
};
export function Chequeo({ ch, titulo = 'Chequeo de evidencia', compacto }) {
  const items = ch.items;
  return (
    <div className="tarjeta">
      <div className="flex items-center justify-between gap-3 border-b border-line2 px-4 py-3">
        <h3 className="m-0 rotulo">{titulo}</h3>
        <div className="flex gap-1.5">
          {ch.fallas.length > 0 && <Pill tono="bad">{ch.fallas.length} bloquea{ch.fallas.length > 1 ? 'n' : ''}</Pill>}
          {ch.revisar.length > 0 && <Pill tono="warn">{ch.revisar.length} a revisar</Pill>}
          {!ch.fallas.length && !ch.revisar.length && <Pill tono="ok">Sin observaciones</Pill>}
        </div>
      </div>
      {items.length === 0 ? <p className="m-0 px-4 py-3 text-[13px] text-ink2">Pasa todas las reglas automáticas.</p> : (
        <ul className={cx('m-0 list-none p-0', compacto && 'max-h-[260px] overflow-auto')}>
          {items.map((x, i) => (
            <li key={i} className="grid grid-cols-[62px_minmax(0,1fr)] items-start gap-2.5 border-b border-line2 px-4 py-2.5 last:border-0">
              <span className={cx('rounded-full px-2 py-0.5 text-center text-[10.5px] font-bold uppercase tracking-[.03em]', NIVEL[x.nivel].cls)}>{NIVEL[x.nivel].t}</span>
              <span className="text-[13px] leading-snug text-ink2">{x.txt}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function useToasts() {
  const [lista, setLista] = useState([]);
  const avisar = useCallback((txt, tono = 'ok') => {
    const id = Math.random();
    setLista((l) => [...l, { id, txt, tono }]);
    setTimeout(() => setLista((l) => l.filter((x) => x.id !== id)), 3800);
  }, []);
  const vista = (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[70] flex flex-col items-center gap-2 px-4 lg:top-6" aria-live="polite">
      {lista.map((t) => (
        <div key={t.id} className={cx('pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full px-4 py-2.5 text-[13.5px] font-semibold shadow-shlg',
          t.tono === 'warn' ? 'bg-warn text-onc' : t.tono === 'bad' ? 'bg-bad text-onc' : 'bg-toast text-toastink')}>
          <Ic n={t.tono === 'ok' ? 'check' : 'alert'} s={16} />{t.txt}
        </div>
      ))}
    </div>
  );
  return [avisar, vista];
}

export function Seccion({ titulo, extra, children, className = '' }) {
  return (
    <section className={cx('flex flex-col gap-3', className)}>
      {(titulo || extra) && (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          {titulo && <h2 className="m-0 rotulo">{titulo}</h2>}
          {extra}
        </div>
      )}
      {children}
    </section>
  );
}

export function Aviso({ tono = 'warn', children, className = '' }) {
  return <div className={cx('rounded-rs px-4 py-3 text-[12.5px] font-semibold leading-relaxed', TONOS[tono], className)}>{children}</div>;
}

export function PageHead({ eyebrow, titulo, children, acciones }) {
  return (
    <header className="flex flex-col gap-4 border-b border-line2 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-[68ch]">
        {eyebrow && <p className="rotulo m-0 mb-2.5">{eyebrow}</p>}
        <h1 className="m-0 text-[28px] font-extrabold leading-[1.1] tracking-[-.03em] text-deep [text-wrap:balance] sm:text-[34px]">{titulo}</h1>
        {children && <p className="m-0 mt-2.5 font-serif text-[16px] leading-relaxed text-ink2">{children}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </header>
  );
}

/* ═══════ Componentes Rediseño - Fase 2 ═══════ */

export function ChipEstadoProtocolo({ estado }) {
  const config = {
    borrador: { txt: 'Borrador', icon: 'edit', cls: 'bg-[var(--estado-borrador-bg)] text-[var(--estado-borrador)]' },
    disputa: { txt: 'En disputa', icon: 'alert', cls: 'bg-[var(--estado-borrador-bg)] text-[var(--estado-borrador)]' },
    validado: { txt: 'Validado', icon: 'check', cls: 'bg-[var(--estado-validado-bg)] text-[var(--estado-validado)]' },
    planificado: { txt: 'Planificado', icon: 'clock', cls: 'bg-[var(--estado-planificado-bg)] text-[var(--estado-planificado)]' }
  };
  const c = config[estado] || config.borrador;
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold tracking-tight', c.cls)}>
      <Ic n={c.icon} s={14} sw={2.5} />
      {c.txt}
    </span>
  );
}

export function ChipEvidencia({ fuente, año, onClick }) {
  if (!fuente) return null;
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick && onClick(); }} className="inline-flex items-center gap-1 rounded bg-soft px-2 py-0.5 text-[11px] font-semibold text-ink2 transition-colors hover:bg-line hover:text-ink">
      <Ic n="book" s={10} />
      <span className="truncate max-w-[120px]">{fuente}</span>
      {año && <span className="opacity-75">{año}</span>}
    </button>
  );
}

export function TarjetaResumenProtocolo({ tiempo, instrumental, fuentes, estado }) {
  return (
    <div className="tarjeta flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-4 text-[13.5px] font-medium text-ink2">
        <div className="flex items-center gap-1.5"><Ic n="clock" s={16} className="text-ink3" /> {tiempo} min</div>
        <div className="h-4 w-px bg-line" />
        <div className="flex items-center gap-1.5"><Ic n="tool" s={16} className="text-ink3" /> {instrumental} clave</div>
        <div className="h-4 w-px bg-line" />
        <div className="flex items-center gap-1.5"><Ic n="book" s={16} className="text-ink3" /> {fuentes} fuentes</div>
      </div>
      <ChipEstadoProtocolo estado={estado} />
    </div>
  );
}

export function LineaTiempoPasos({ pasos, pasoActivo, onPasoClick, onPorQue }) {
  return (
    <div className="relative flex flex-col gap-0 py-2">
      <div className="absolute top-4 bottom-4 left-[23px] w-0.5 bg-line2" />
      {pasos.map((paso, i) => {
        const activo = i === pasoActivo;
        const pasado = i < pasoActivo;
        return (
          <div key={i} className={cx('relative flex items-start gap-4 p-2 transition-opacity', activo ? 'opacity-100' : 'opacity-60 hover:opacity-100')} onClick={() => onPasoClick(i)} style={{ cursor: 'pointer' }}>
            <div className={cx('z-10 grid h-8 w-8 flex-none place-items-center rounded-full border-2 text-[13px] font-bold transition-colors', 
              activo ? 'border-acento bg-acento text-onc ring-4 ring-acentosoft' : pasado ? 'border-acento bg-card text-acento' : 'border-line bg-card text-ink3')}>
              {pasado ? <Ic n="check" s={16} sw={2.5} /> : (i + 1)}
            </div>
            <div className="pt-1.5 pb-6">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h4 className={cx('m-0 text-[15px] font-bold', activo ? 'text-deep' : 'text-ink2')}>{paso.titulo}</h4>
                {paso.evidencia && <ChipEvidencia fuente={paso.evidencia.fuente} año={paso.evidencia.año} onClick={() => onPorQue(i)} />}
              </div>
              {activo && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col gap-3">
                  <p className="m-0 text-[14.5px] leading-relaxed text-ink">{paso.txt}</p>
                  {paso.clave && (
                    <div className="rounded-rs bg-warnsoft px-3 py-2 text-[13px] text-warn">
                      <b className="font-bold">Terminaste cuando:</b> {paso.clave}
                    </div>
                  )}
                  {paso.por_que && !paso.evidencia && (
                     <button type="button" onClick={(e) => { e.stopPropagation(); onPorQue(i); }} className="self-start text-[12.5px] font-semibold text-acento hover:underline">¿Por qué?</button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
