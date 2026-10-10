// Criterium Red · Materia: clases de estudio por ramo, cada una un HTML propio con sus fuentes.
// Solo con sesión (firestore.rules). Cada ramo trae su paleta (materia/ramos.json): la usan su tarjeta y su HTML.
// La clase se abre en un iframe aislado (sin acceso a la app ni a la sesión): solo corre sus propios scripts.
import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../ctx.js';
import { useMateria, useClaseMateria } from '../db.js';
import { Ic, Vacio, cx } from '../ui.jsx';

const fechaCorta = (f) => { try { return new Date(f + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return f; } };

// Subido con npm run materia:subir -- --borrador: se ve, pero avisa que todavía no está publicado
function Borrador() { return <span className="inline-flex rounded-full bg-warnsoft px-2 py-0.5 align-middle text-[11px] font-bold uppercase tracking-[.06em] text-warn">Borrador</span>; }

export function Materia() {
  const { abrirClase } = useApp();
  const ramos = useMateria(true);
  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-6">
      <header>
        <p className="rotulo m-0 mb-1.5">Materia</p>
        <h1 className="m-0 text-[28px] font-bold tracking-[-.025em] text-deep sm:text-[32px]">Tus ramos, con sus fuentes</h1>
        <p className="m-0 mt-1.5 max-w-[60ch] text-[14.5px] text-ink2">Clases para estudiar, interactivas. Cada afirmación lleva su fuente y lo que no tiene estudio detrás se marca como práctica habitual.</p>
      </header>
      {ramos === null ? <div className="h-40 animate-pulse rounded-[22px] bg-soft" />
        : !ramos.length ? <Vacio icon="book" titulo="Todavía no hay clases publicadas">Las primeras clases llegan pronto.</Vacio>
        : ramos.map((r) => {
          const p = r.paleta || {};
          return (
            <section key={r.id} className="overflow-hidden rounded-[22px] bg-card shadow-sh">
              <div className="flex flex-col gap-1 px-5 pb-4 pt-5" style={{ background: p.suave, color: p.texto }}>
                <b className="text-[11.5px] font-bold uppercase tracking-[.12em]" style={{ color: p.acento }}>Ramo</b>
                <h2 className="m-0 flex flex-wrap items-center gap-2 text-[22px] font-bold tracking-[-.015em]" style={{ color: p.acento }}>{r.nombre}{r.borrador && <Borrador />}</h2>
                {r.descripcion && <p className="m-0 text-[14px] opacity-80">{r.descripcion}</p>}
              </div>
              <div className="flex flex-col divide-y divide-line2">
                {(r.clases || []).map((c, i) => (
                  <button key={c.id} type="button" onClick={() => abrirClase(r.id, c.id)} className="flex items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-soft">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-full text-[14px] font-extrabold" style={{ background: p.suave, color: p.acento }}>{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-[15.5px] leading-snug text-ink">{c.titulo}{c.borrador && <> <Borrador /></>}</b>
                      {c.resumen && <span className="mt-0.5 block text-[13.5px] leading-snug text-ink2">{c.resumen}</span>}
                      <span className="mt-1 flex flex-wrap gap-x-3 text-[12px] text-ink3"><span className="inline-flex items-center gap-1"><Ic n="book" s={13} />{c.fuentes} fuentes</span><span>v{c.version}</span>{c.fecha && <span>{fechaCorta(c.fecha)}</span>}</span>
                    </span>
                    <Ic n="back" s={18} className="flex-none rotate-180 text-ink3" />
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      <p className="m-0 text-[12.5px] text-ink3">Material de estudio escrito por Criterium desde fuentes publicadas. No reemplaza el juicio clínico ni las indicaciones de tu docente.</p>
    </div>
  );
}

// Pantalla completa: el mismo iframe pasa a cubrir toda la pantalla (no se recarga, así no pierde dónde ibas).
// Donde el navegador lo permite, además se pide la pantalla completa del sistema; en iPhone queda la capa fija.
export function ClaseMateria() {
  const { go, materiaSel } = useApp();
  const [ramo, id] = materiaSel || [];
  const ramos = useMateria(true);
  const r = (ramos || []).find((x) => x.id === ramo);
  const clase = useClaseMateria(ramo, id);
  const p = (r && r.paleta) || {};
  const caja = useRef(null);
  const [completa, setCompleta] = useState(false);
  const entrar = () => {
    setCompleta(true);
    try { const el = caja.current; const pedir = el && (el.requestFullscreen || el.webkitRequestFullscreen); if (pedir) { const x = pedir.call(el); if (x && x.catch) x.catch(() => {}); } } catch (e) {}
  };
  const salir = () => {
    setCompleta(false);
    try { const fs = document.fullscreenElement || document.webkitFullscreenElement; if (fs) (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {}
  };
  useEffect(() => {
    if (!completa) return;
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const tecla = (e) => { if (e.key === 'Escape') salir(); };
    // Si se sale de la pantalla completa del sistema (Esc, gesto), también se cierra la capa
    const cambio = () => { if (!(document.fullscreenElement || document.webkitFullscreenElement)) setCompleta(false); };
    window.addEventListener('keydown', tecla);
    document.addEventListener('fullscreenchange', cambio); document.addEventListener('webkitfullscreenchange', cambio);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', tecla); document.removeEventListener('fullscreenchange', cambio); document.removeEventListener('webkitfullscreenchange', cambio); };
  }, [completa]);
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button type="button" onClick={() => go('materia')} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13.5px] font-semibold text-acento hover:bg-soft"><Ic n="back" s={16} />{r ? r.nombre : 'Materia'}</button>
        {r && (r.clases || []).some((x) => x.id === id && x.borrador) && <Borrador />}
        {clase && <span className="text-[12.5px] text-ink3">v{clase.version} · {fechaCorta(clase.fecha)} · {clase.fuentes} fuentes · huella {String(clase.sha256 || '').slice(0, 8)}</span>}
        {clase && <button type="button" onClick={entrar} className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-[13px] font-semibold text-acento shadow-sh hover:bg-soft"><Ic n="expand" s={15} />Pantalla completa</button>}
      </div>
      {clase === null ? <div className="h-[60vh] animate-pulse rounded-[22px] bg-soft" />
        : clase === false ? <Vacio icon="book" titulo="No encontramos esta clase">Vuelve a Materia y elígela de nuevo.</Vacio>
        : (
          <div ref={caja} className={completa ? 'fixed inset-0 z-[120]' : 'relative'} style={{ background: p.fondo || 'var(--card)' }}
            role={completa ? 'dialog' : undefined} aria-modal={completa || undefined} aria-label={completa ? clase.titulo : undefined}>
            <iframe title={clase.titulo} srcDoc={clase.html} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
              className={completa ? 'block h-full w-full border-0' : 'block h-[calc(100dvh-210px)] min-h-[480px] w-full rounded-[22px] border-0 shadow-sh lg:h-[calc(100dvh-150px)]'}
              style={{ background: p.fondo || 'var(--card)', paddingTop: completa ? 'env(safe-area-inset-top, 0px)' : undefined }} />
            {completa && (
              <button type="button" onClick={salir} aria-label="Salir de la pantalla completa"
                className="fixed right-4 z-[121] inline-flex items-center gap-1.5 rounded-full bg-deep px-4 py-2.5 text-[13.5px] font-semibold text-onc shadow-shlg"
                style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}><Ic n="shrink" s={16} />Salir</button>
            )}
          </div>
        )}
    </div>
  );
}
