// Componentes base del sistema de diseño 2026 (tokens --s-* en index.css, clases s-* en tailwind.config.js).
// Solo dependen de React: la portada pública los usa sin cargar Firebase ni el resto de la app.
import React, { useEffect, useRef, useState } from 'react';
import { MARCA_C, MARCA_TRAZO, MARCA_PUNTO, MARCA_CAJA } from '../marca.js';

export const cx = (...a) => a.filter(Boolean).join(' ');

/* ── Estructura ── */
export function Pagina({ className, children }) {
  return <div className={cx('s-pagina', className)}>{children}</div>;
}

const TONO_SECCION = { blanco: 'bg-s-fondo', gris: 'bg-s-fondo-alt', oscuro: 's-oscuro bg-s-marca text-s-sobre-marca' };
// Una sección de la página: blanco, gris (para alternar) u oscuro (marca). `ancho` = sin la columna de 1200 px.
export function Seccion({ id, tono = 'blanco', className, interior, etiqueta, ancho = false, children }) {
  return (
    <section id={id} aria-label={etiqueta} className={cx('s-seccion scroll-mt-16', TONO_SECCION[tono], className)}>
      {ancho ? children : <Pagina className={interior}>{children}</Pagina>}
    </section>
  );
}

/* ── Texto ── */
export function Rotulo({ className, children }) {
  return <p className={cx('s-rotulo m-0', className)}>{children}</p>;
}

const TAM_TITULO = { display: 'text-s-display font-bold', 1: 'text-s-h1 font-bold', 2: 'text-s-h2 font-bold', 3: 'text-s-h3 font-semibold' };
// `nivel` es el h1–h3 del documento (orden de los títulos); `tam` el tamaño visual, si tiene que ser otro.
export function Titulo({ nivel = 2, tam, className, children, ...p }) {
  const Tag = `h${nivel}`;
  return <Tag className={cx('m-0 [text-wrap:balance]', TAM_TITULO[tam || nivel], className)} {...p}>{children}</Tag>;
}

export function Bajada({ className, children }) {
  return <p className={cx('m-0 max-w-s-texto text-s-lead text-s-texto-2 [.s-oscuro_&]:text-s-sobre-marca-2', className)}>{children}</p>;
}

/* ── Íconos: trazo de 1,6 px en una grilla de 24 ── */
const ICONOS = {
  flecha: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  abajo: <path d="M6 9l6 6 6-6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  mas: <path d="M12 5v14M5 12h14" />,
  cerrar: <path d="M6 6l12 12M18 6L6 18" />,
  calendario: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  bandeja: <><path d="M3.5 13.5h4.2l1.6 2.5h5.4l1.6-2.5h4.2" /><path d="M5.6 6.2A2 2 0 0 1 7.5 5h9a2 2 0 0 1 1.9 1.2l2.1 7.3V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-4.5z" /></>,
  evolucion: <><path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z" /><path d="M14 3.5v5h5M8.5 13h7M8.5 16.5h4.5" /></>,
  insumos: <><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M4 7.5l8 4.5 8-4.5M12 12v9" /></>,
  lote: <><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v4h-4" /><path d="M9 12.2l2 2 4-4.2" /></>,
  caja: <><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10.5h18" /><circle cx="12" cy="14.8" r="1.6" /></>,
  ficha: <><rect x="4.5" y="3.5" width="15" height="17" rx="2.5" /><circle cx="12" cy="9.5" r="2.5" /><path d="M8 16.5c.8-1.8 2.2-2.6 4-2.6s3.2.8 4 2.6" /></>,
  libro: <><path d="M4 5.5A2 2 0 0 1 6 3.5h5v17H6a2 2 0 0 1-2-2z" /><path d="M11 3.5h7a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-7" /></>,
  calculadora: <><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M8.5 7h7M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15h.01M8.5 18h.01M12 18h.01M15.5 18h.01" /></>,
  personas: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19.5c.9-3 3-4.6 5.5-4.6s4.6 1.6 5.5 4.6" /><path d="M15.5 5.5a3.2 3.2 0 0 1 0 6.2M17.5 15.3c1.4.6 2.4 2 3 4.2" /></>,
  escudo: <><path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></>,
  candado: <><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" /></>,
  clinica: <><path d="M4 20.5V8l8-4.5L20 8v12.5" /><path d="M3 20.5h18M12 9v5M9.5 11.5h5" /></>,
  birrete: <><path d="M2.5 9.5L12 5l9.5 4.5L12 14z" /><path d="M6.5 11.5v4.2c1.5 1.4 3.4 2.1 5.5 2.1s4-.7 5.5-2.1v-4.2M21.5 9.5v5" /></>,
  fuente: <><path d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5v14.5L12 17l-6.5 3.5V6A1.5 1.5 0 0 1 7 4.5z" /></>,
  revision: <><circle cx="10.5" cy="10.5" r="6" /><path d="M20 20l-5.2-5.2M8 10.5l1.8 1.8 3.2-3.3" /></>,
  diente: <path d="M12 5.2c1.6-1.2 6-1.6 6.3 2.6.2 2.8-1 4.4-1.6 7.2-.5 2.4-1 3.8-1.8 3.8-1.1 0-1.2-3.3-2.9-5.5-1.7 2.2-1.8 5.5-2.9 5.5-.8 0-1.3-1.4-1.8-3.8C6.7 12.2 5.5 10.6 5.7 7.8 6 3.6 10.4 4 12 5.2z" />
};
export function Icono({ n, s = 20, className, grosor = 1.6, titulo }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round"
      className={cx('flex-none', className)} aria-hidden={titulo ? undefined : 'true'} role={titulo ? 'img' : undefined} aria-label={titulo}>
      {ICONOS[n]}
    </svg>
  );
}

/* ── Botón: <a> si trae href, <button> si no ── */
const VARIANTE = {
  primario: 'bg-s-primario text-s-sobre-primario hover:bg-s-primario-hover',
  secundario: 'border border-s-borde-fuerte bg-s-superficie text-s-texto shadow-s-1 hover:border-s-borde-campo hover:bg-s-fondo-alt',
  fantasma: 'text-s-enlace hover:bg-s-primario-suave',
  claro: 'bg-s-superficie text-s-marca hover:bg-s-primario-suave',
  menta: 'bg-s-destaque text-s-sobre-destaque hover:brightness-105',
  'contorno-oscuro': 'border border-s-borde-marca text-s-sobre-marca hover:bg-[rgba(255,255,255,.06)]'
};
const TAM_BOTON = { sm: 'h-9 gap-1.5 px-3.5 text-[14px]', md: 'h-11 gap-2 px-5 text-[15px]', lg: 'h-12 gap-2 px-6 text-[16px]' };
export function Boton({ variante = 'primario', tam = 'md', href, icono, iconoFin, className, children, type = 'button', ...p }) {
  const cls = cx('inline-flex select-none items-center justify-center whitespace-nowrap rounded-[10px] font-semibold no-underline',
    'transition-[background-color,border-color,color,filter,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
    VARIANTE[variante], TAM_BOTON[tam], className);
  const dentro = <>{icono && <Icono n={icono} s={tam === 'sm' ? 16 : 18} />}{children}{iconoFin && <Icono n={iconoFin} s={tam === 'sm' ? 16 : 18} />}</>;
  return href ? <a href={href} className={cls} {...p}>{dentro}</a> : <button type={type} className={cls} {...p}>{dentro}</button>;
}

/* ── Insignia: estado o categoría, siempre con texto (el color nunca va solo) ── */
const TONO_INSIGNIA = {
  neutro: 'bg-s-hundido text-s-texto-2',
  primario: 'bg-s-primario-suave text-s-enlace',
  ok: 'bg-s-ok-fondo text-s-ok',
  aviso: 'bg-s-aviso-fondo text-s-aviso',
  error: 'bg-s-error-fondo text-s-error',
  oscuro: 'bg-s-marca-2 text-s-destaque'
};
export function Insignia({ tono = 'neutro', punto = false, className, children }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold leading-5', TONO_INSIGNIA[tono], className)}>
      {punto && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}{children}
    </span>
  );
}

/* ── Tarjeta: borde fino; la sombra solo al pasar el mouse si es interactiva ── */
export function Tarjeta({ como: Tag = 'div', interactiva = false, oscura = false, className, children, ...p }) {
  return (
    <Tag className={cx('rounded-tarjeta border p-6',
      oscura ? 'border-s-borde-marca bg-s-marca-2 text-s-sobre-marca' : 'border-s-borde bg-s-superficie',
      interactiva && 'transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-s-borde-fuerte hover:shadow-s-2',
      className)} {...p}>
      {children}
    </Tag>
  );
}

/* ── Campo de formulario con etiqueta visible, ayuda y error anunciado ── */
export function Campo({ id, etiqueta, ayuda, error, como = 'input', opcional = false, className, children, ...p }) {
  const Tag = como;
  const desc = [ayuda && `${id}-ayuda`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[14px] font-semibold text-s-texto">
        {etiqueta}{opcional && <span className="font-normal text-s-texto-3"> · opcional</span>}
      </label>
      <Tag id={id} aria-invalid={error ? 'true' : undefined} aria-describedby={desc}
        className={cx('w-full rounded-campo border bg-s-superficie px-3.5 text-[16px] text-s-texto placeholder:text-s-texto-3',
          'transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-[3px] focus:ring-[color-mix(in_srgb,var(--s-foco)_22%,transparent)]',
          como === 'textarea' ? 'min-h-[96px] py-2.5' : 'h-11',
          error ? 'border-s-error focus:border-s-error' : 'border-s-borde-campo focus:border-s-foco')} {...p}>
        {children}
      </Tag>
      {ayuda && !error && <p id={`${id}-ayuda`} className="m-0 text-s-chico text-s-texto-3">{ayuda}</p>}
      {error && <p id={`${id}-error`} role="alert" className="m-0 text-s-chico font-medium text-s-error">{error}</p>}
    </div>
  );
}

/* ── Marcos de dispositivo. La captura va COMPLETA (object-contain), nunca recortada. ──
   Con `ancho` y `alto` el navegador reserva el espacio y la página no salta al cargar. */
// `srcSet`: «… 1x, … 2x»; `prioridad`: la imagen se pide de inmediato (solo la primera que se ve al abrir la página)
export function MarcoNavegador({ src, srcSet, alt, ancho = 1440, alto = 900, direccion = 'criterium · clínica', prioridad = false, children, className }) {
  return (
    <figure className={cx('m-0 overflow-hidden rounded-marco bg-s-superficie shadow-s-3', className)}>
      <div className="flex h-9 items-center gap-3 border-b border-s-borde-suave bg-s-fondo-alt px-3.5" aria-hidden="true">
        <span className="flex gap-1.5">{[0, 1, 2].map((k) => <i key={k} className="h-2.5 w-2.5 rounded-full bg-s-borde-fuerte" />)}</span>
        <span className="mx-auto flex h-6 min-w-0 max-w-[60%] items-center gap-1.5 truncate rounded-md bg-s-superficie px-3 text-[11.5px] text-s-texto-3">
          <Icono n="candado" s={11} />{direccion}
        </span>
        <span className="w-[42px]" />
      </div>
      <div className="relative bg-s-fondo-alt" style={{ aspectRatio: `${ancho} / ${alto}` }}>
        {src ? <Imagen src={src} srcSet={srcSet} alt={alt} ancho={ancho} alto={alto} prioridad={prioridad} /> : children}
      </div>
    </figure>
  );
}

function Imagen({ src, srcSet, alt, ancho, alto, prioridad }) {
  return <img src={src} srcSet={srcSet} alt={alt} width={ancho} height={alto} loading={prioridad ? 'eager' : 'lazy'} fetchpriority={prioridad ? 'high' : undefined} decoding="async" className="absolute inset-0 h-full w-full object-contain" />;
}

export function MarcoTelefono({ src, srcSet, alt, ancho = 390, alto = 844, prioridad = false, children, className }) {
  return (
    <figure className={cx('m-0 rounded-[44px] bg-s-marca p-[9px] shadow-s-3', className)}>
      <div className="overflow-hidden rounded-[36px] bg-s-superficie">
        {/* Franja de estado con la isla: la captura empieza debajo y no queda tapada */}
        <div className="flex h-[30px] items-center justify-center" aria-hidden="true"><span className="h-[18px] w-[34%] rounded-full bg-s-marca" /></div>
        <div className="relative bg-s-fondo-alt" style={{ aspectRatio: `${ancho} / ${alto}` }}>
          {src ? <Imagen src={src} srcSet={srcSet} alt={alt} ancho={ancho} alto={alto} prioridad={prioridad} /> : children}
        </div>
      </div>
    </figure>
  );
}

/* ── Logo liviano (la geometría de src/marca.js), para no cargar ui.jsx en la portada ── */
export function Logo({ alto = 26, oscuro = false, texto = true, className }) {
  return (
    <span className={cx('inline-flex items-center', className)} style={{ gap: Math.round(alto * 0.36) }}>
      <svg width={alto} height={alto} viewBox={MARCA_CAJA} aria-hidden="true" className="flex-none">
        <path d={MARCA_C} fill="none" strokeWidth={MARCA_TRAZO} stroke={oscuro ? '#FFFFFF' : 'var(--logo-c)'} />
        <circle {...MARCA_PUNTO} fill={oscuro ? 'var(--menta)' : 'var(--logo-punto)'} />
      </svg>
      {texto && <span className={cx('font-bold leading-none tracking-[-.032em]', oscuro ? 'text-white' : 'text-[color:var(--logo-c)]')} style={{ fontSize: Math.round(alto * 0.86) }}>Criterium</span>}
    </span>
  );
}

/* ── Espacio marcado: lo que todavía no existe (prueba social, capturas). Nunca se rellena con algo inventado. ── */
export function Pendiente({ className, children }) {
  return (
    <div className={cx('flex min-h-[96px] items-center justify-center rounded-tarjeta border border-dashed border-s-borde-campo bg-s-fondo-alt p-5 text-center text-s-chico text-s-texto-3', className)}>
      <span><b className="font-semibold text-s-aviso">[PENDIENTE]</b> {children}</span>
    </div>
  );
}

/* ── Aparición al entrar en pantalla. Con «reducir movimiento» el CSS la deja quieta. ── */
export function useRevela() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);
  return [ref, visible];
}
export function Revela({ como: Tag = 'div', retraso = 0, className, children, ...p }) {
  const [ref, visible] = useRevela();
  return <Tag ref={ref} data-visible={visible ? '' : undefined} className={cx('s-revela', className)} style={retraso ? { '--s-retraso': `${retraso}ms` } : undefined} {...p}>{children}</Tag>;
}
