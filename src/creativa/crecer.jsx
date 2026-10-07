// Criterium Red · crecer: Invita a tu curso y la Liga de universidades.
// La liga cuenta casos publicados después de la revisión de un docente: gana la calidad, no el volumen de publicaciones.
import React, { useMemo, useState } from 'react';
import { useApp } from '../ctx.js';
import { usePerfiles } from '../db.js';
import { Ic, Avatar, Btn, Vacio, cx } from '../ui.jsx';

// Mismo nombre de institución aunque se escriba distinto («U. de Chile», «u de chile»)
export const normInst = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\buniversidad\b|\buniv\b|\bu\b/g, 'u').replace(/[^a-z0-9]+/g, ' ').trim();
const ESTUDIANTE = 'Estudiante de pregrado';

/* ═════════ Invita a tu curso ═════════ */
export function Invitar({ compacto = false }) {
  const { myUid, perfil, avisar } = useApp();
  const personas = usePerfiles(true);
  const enlace = (typeof location !== 'undefined' ? location.origin + location.pathname : '') + '?i=' + myUid;
  const inst = normInst(perfil && perfil.institucion);
  const curso = !!(perfil && perfil.rol === ESTUDIANTE && perfil.anio);
  const mios = useMemo(() => personas.filter((x) => x.uid !== myUid && inst && normInst(x.institucion) === inst && (!curso || x.anio === perfil.anio)), [personas, inst, curso, myUid]);
  const invitados = personas.filter((x) => x.invitadoPor === myUid).length;
  const donde = curso ? 'de tu curso' : 'de tu institución';
  const copiar = async () => {
    try { await navigator.clipboard.writeText(enlace); avisar('Enlace copiado'); }
    catch (e) { avisar('No se pudo copiar. Mantén presionado el enlace para copiarlo.', 'warn'); }
  };
  const compartir = async () => {
    const texto = 'Te invito a Criterium, la red de casos clínicos de Odontología revisados por docentes. Es gratis.';
    if (navigator.share) { try { await navigator.share({ title: 'Criterium', text: texto, url: enlace }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    copiar();
  };
  return (
    <section className={cx('flex flex-col gap-3 rounded-[22px] bg-card shadow-sh', compacto ? 'p-4' : 'p-5')} aria-label="Invita a tu curso">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-menta text-mentaink"><Ic n="personas" s={19} /></span>
        <div className="min-w-0 flex-1">
          <b className="block text-[15px] leading-snug text-ink">Invita a tu curso</b>
          <span className="block text-[12.5px] leading-snug text-ink3">{mios.length ? (mios.length === 1 ? 'Ya está 1 persona ' : 'Ya están ' + mios.length + ' personas ') + donde + '.' : 'Sé la primera persona ' + donde + ' en Criterium.'}{invitados ? ' Invitaste a ' + invitados + '.' : ''}</span>
        </div>
      </div>
      {mios.length > 0 && (
        <div className="flex items-center">
          {mios.slice(0, 6).map((x, k) => <span key={x.uid} className={cx('rounded-full ring-2 ring-card', k && '-ml-2')}><Avatar nombre={x.nombre} size={30} /></span>)}
          {mios.length > 6 && <span className="ml-2 text-[12px] font-semibold text-ink3">+{mios.length - 6}</span>}
        </div>
      )}
      <div className="flex min-w-0 items-center gap-2 rounded-rs bg-soft px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink2 [user-select:all]">{enlace}</span>
        <button type="button" onClick={copiar} className="flex-none rounded-full px-2 py-1 text-[12.5px] font-semibold text-acento hover:bg-card">Copiar</button>
      </div>
      <Btn v="primary" icon="compartir" onClick={compartir}>Invitar por WhatsApp o donde quieras</Btn>
    </section>
  );
}

/* ═════════ Liga de universidades ═════════ */
// Semestre académico chileno: 1.º de marzo a julio; 2.º de agosto a febrero
export function semestreActual(hoy = new Date()) {
  const m = hoy.getMonth(), a = hoy.getFullYear();
  if (m >= 2 && m <= 6) return { n: 1, anio: a, desde: new Date(a, 2, 1) };
  return { n: 2, anio: m >= 7 ? a : a - 1, desde: new Date(m >= 7 ? a : a - 1, 7, 1) };
}
function useLiga() {
  const { feed } = useApp();
  const personas = usePerfiles(true);
  const sem = semestreActual();
  return useMemo(() => {
    const tabla = new Map();
    const fila = (nombre) => {
      const k = normInst(nombre); if (!k) return null;
      if (!tabla.has(k)) tabla.set(k, { k, nombres: {}, casos: 0, planes: 0, miembros: 0 });
      const f = tabla.get(k); f.nombres[nombre.trim()] = (f.nombres[nombre.trim()] || 0) + 1; return f;
    };
    personas.forEach((x) => { const f = x.institucion && fila(x.institucion); if (f) f.miembros++; });
    feed.forEach((p) => {
      const inst = p.autor && p.autor.institucion; if (!inst || (p.estado || 'publicado') !== 'publicado' || new Date(p.fecha) < sem.desde) return;
      const f = fila(inst); if (!f) return;
      if (p.tipo === 'caso' && p.revisado) f.casos++;
      if (p.tipo === 'discusion') f.planes++;
    });
    return [...tabla.values()]
      .map((f) => ({ ...f, nombre: Object.entries(f.nombres).sort((a, b) => b[1] - a[1])[0][0] }))
      .filter((f) => f.casos || f.planes)
      .sort((a, b) => b.casos - a.casos || b.planes - a.planes || b.miembros - a.miembros);
  }, [feed, personas, sem.desde.getTime()]);
}
const titSem = (s) => (s.n === 1 ? '1.er' : '2.º') + ' semestre ' + s.anio;

export function Liga() {
  const { perfil, subirCaso } = useApp();
  const liga = useLiga();
  const sem = semestreActual();
  const mia = normInst(perfil && perfil.institucion);
  const max = Math.max(1, ...liga.map((f) => f.casos));
  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5">
      <header className="overflow-hidden rounded-[26px] bg-deep px-5 py-7 text-onc sm:px-8">
        <p className="m-0 text-[12px] font-bold uppercase tracking-[.14em] text-menta">{titSem(sem)}</p>
        <h1 className="m-0 mt-2 text-[30px] font-bold leading-tight tracking-[-.025em] sm:text-[36px]">Liga de universidades</h1>
        <p className="m-0 mt-2 max-w-[52ch] text-[14.5px] leading-relaxed text-panelink2">Cuenta los casos que se publicaron después de la revisión de un docente. Un caso suma solo si lo aprobaron: gana la calidad.</p>
      </header>
      {liga.length === 0 ? (
        <Vacio icon="edificio" titulo="Todavía no hay casos publicados este semestre" accion={<Btn v="primary" icon="plus" onClick={() => subirCaso()}>Subir un caso</Btn>}>Sube el primero y pon a tu universidad en la tabla.</Vacio>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
          {liga.map((f, i) => (
            <li key={f.k} className={cx('flex items-center gap-4 rounded-[20px] bg-card px-4 py-3.5 shadow-sh', f.k === mia && 'ring-2 ring-menta')}>
              <b className={cx('w-8 flex-none text-center text-[22px] font-extrabold tabular-nums', i === 0 ? 'text-acento' : 'text-ink3')}>{i + 1}</b>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><b className="truncate text-[15.5px] text-ink">{f.nombre}</b>{f.k === mia && <span className="rounded-full bg-menta px-2 py-[1px] text-[10.5px] font-bold text-mentaink">Tu universidad</span>}</div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-soft"><span className="block h-full rounded-full bg-acento" style={{ width: Math.max(4, (f.casos / max) * 100) + '%' }} /></div>
                <span className="mt-1 block text-[12px] text-ink3">{f.planes} {f.planes === 1 ? 'plan discutido' : 'planes discutidos'} · {f.miembros} {f.miembros === 1 ? 'miembro' : 'miembros'}</span>
              </div>
              <div className="flex-none text-right"><b className="block text-[24px] font-extrabold leading-none tabular-nums text-deep">{f.casos}</b><span className="text-[11.5px] text-ink3">{f.casos === 1 ? 'caso' : 'casos'}</span></div>
            </li>
          ))}
        </ol>
      )}
      <p className="m-0 text-[12.5px] leading-snug text-ink3">La institución sale de lo que cada persona escribió en su perfil. Si tu universidad aparece dos veces con nombres distintos, corrige el nombre en tu perfil.</p>
    </div>
  );
}

export function LigaMini() {
  const { go } = useApp();
  const liga = useLiga().slice(0, 3);
  return (
    <button type="button" onClick={() => go('liga')} className="flex flex-col gap-2.5 rounded-[22px] bg-card p-4 text-left shadow-sh transition-shadow hover:shadow-shlg">
      <span className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-deep text-menta"><Ic n="edificio" s={16} /></span><b className="text-[14px] text-ink">Liga de universidades</b><span className="ml-auto text-[12px] font-semibold text-acento">Ver</span></span>
      {liga.length === 0 ? <span className="text-[12.5px] leading-snug text-ink3">Todavía nadie suma casos este semestre. El primero pone a su universidad arriba.</span>
        : liga.map((f, i) => <span key={f.k} className="flex items-center gap-2.5 text-[13px]"><b className="w-4 text-ink3 tabular-nums">{i + 1}</b><span className="min-w-0 flex-1 truncate text-ink">{f.nombre}</span><b className="tabular-nums text-deep">{f.casos}</b></span>)}
    </button>
  );
}
