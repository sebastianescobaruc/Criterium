// Reels: videos cortos en el inicio, al estilo de Instagram (horizontales 16:9 o verticales 9:16, según el archivo).
// En el feed se reproducen solos y sin sonido cuando se ven; tocar prende el sonido, doble toque da «Me sirve».
// Debajo del video: autor, texto (2 líneas, con «Mostrar más» y «Mostrar menos») y acciones.
// «Pantalla completa» abre el visor: todos los reels uno debajo del otro, se pasan deslizando hacia arriba.
// Mientras no esté Firebase Storage, los videos los sube el equipo a public/reels/ y se publican desde «Crear › Reel».
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../ctx.js';
import { toggleLikeFS, responderPostFS } from '../db.js';
import { hace, uid, datosPersonales } from '../logic.js';
import { Ic, Avatar, inputCls, cx } from '../ui.jsx';

// Videos ya alojados en Criterium (public/reels/), listos para publicar. Cada uno se publica una vez.
export const REELS = [
  {
    url: '/reels/rehabilitacion-anterior.mp4', poster: '/reels/rehabilitacion-anterior.jpg', duracion: 114, horizontal: true,
    titulo: 'Rehabilitación del sector anterior, paso a paso',
    txt: 'Mi caso clínico en animación 3D, de la foto inicial a las coronas definitivas.\n\n'
      + 'Tallado 1.1 · poste de fibra personalizado 2.1 · corte de corona 2.1 · exodoncia 2.1 + L-PRF · reinserción del provisorio en cantilever · '
      + 'poste de fibra 1.2 · endodoncia 2.2 · provisorios 1.2, 1.1, 2.1 y 2.2 · destartraje y terapia periodontal de soporte · '
      + 'hilos retractores y escaneo intraoral · diseño digital de provisorios · restauración 1.3 por palatino · retiro de provisorios · coronas definitivas cementadas.\n\n'
      + 'Al final, el antes y después.',
    especialidad: 'Rehabilitación oral', procedimiento: 'Corona'
  }
];
export const videoDe = (p) => (p.adjuntos || []).find((a) => a.tipo === 'video');

// El sonido es uno solo para todos los reels: si lo prendes en uno, el siguiente también suena.
// El volumen se recuerda en este navegador (criterium-reels-volumen).
let conSonido = false;
const VOL = 'criterium-reels-volumen';
let volumen = (() => { try { const v = parseFloat(localStorage.getItem(VOL)); return v >= 0 && v <= 1 ? v : 1; } catch (e) { return 1; } })();
const SONIDO = 'criterium-reels-sonido';
const avisarSonido = () => window.dispatchEvent(new CustomEvent(SONIDO));
const ponerSonido = (v) => { conSonido = v; if (v && volumen === 0) volumen = 0.5; avisarSonido(); };
const ponerVolumen = (v) => { volumen = v; conSonido = v > 0; try { localStorage.setItem(VOL, String(v)); } catch (e) {} avisarSonido(); };
function useSonido() {
  const [s, setS] = useState({ sonido: conSonido, volumen });
  useEffect(() => { const f = () => setS({ sonido: conSonido, volumen }); window.addEventListener(SONIDO, f); return () => window.removeEventListener(SONIDO, f); }, []);
  return s;
}
// En iPhone y iPad el volumen lo manejan solo los botones del equipo: ahí no se muestra la barra
const volumenEditable = (() => { try { const a = document.createElement('audio'); a.volume = 0.5; return a.volume === 0.5; } catch (e) { return false; } })();
// Suena un solo reel a la vez: al empezar uno, los demás se pausan (por ejemplo, el del inicio que queda detrás del visor)
const videos = new Set();
const soloEste = (el) => videos.forEach((x) => { if (x !== el && !x.paused) x.pause(); });
const quieto = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const leerGuardados = () => { try { return JSON.parse(localStorage.getItem('criterium-guardados') || '[]'); } catch (e) { return []; } };
const cuenta = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 1e4 ? 0 : 1).replace('.', ',') + ' mil' : n > 0 ? String(n) : '');

function Silencio({ s = 18 }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" /><path d="M16 9.5l5 5M21 9.5l-5 5" /></svg>;
}
function Play({ s = 30 }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>;
}

// Botón de la fila de acciones (corazón, comentarios, compartir, guardar)
function Accion({ ic, n, label, activo, onClick, claro, children, className = '' }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={activo}
      className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-[13px] font-semibold tabular-nums transition-[transform,background-color] active:scale-90', claro ? 'text-onc hover:bg-[color-mix(in_srgb,var(--onc)_12%,transparent)]' : 'text-ink2 hover:bg-soft', className)}>
      {children || <Ic n={ic} s={22} sw={1.8} />}{n}
    </button>
  );
}

// El reel: video arriba (horizontal 16:9, o vertical si el archivo lo es) y debajo autor, texto y acciones.
// pantalla = dentro del visor a pantalla completa (fondo oscuro).
function ReelCuerpo({ p, pantalla = false, activo = true, abrir, comentar }) {
  const { myUid, verPerfil, siguiendo, toggleSeguir, avisar } = useApp();
  const v = videoDe(p);
  const ref = useRef(null);
  const caja = useRef(null);
  const toque = useRef(null);
  const reloj = useRef(null);
  const { sonido, volumen: vol } = useSonido();
  const [visible, setVisible] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [avance, setAvance] = useState(0);
  const [corazon, setCorazon] = useState(0);
  const [aviso, setAviso] = useState(null);
  const [mas, setMas] = useState(false);
  // La forma la dice el archivo: mientras carga se usa la del catálogo
  const [vertical, setVertical] = useState(() => { const r = REELS.find((x) => v && x.url === v.url); return r ? !r.horizontal : !!(v && v.vertical); });
  const [guardado, setGuardado] = useState(() => leerGuardados().includes(p.id));
  const autorUid = p.autorUid || (p.autor && p.autor.uid) || '';
  const likedBy = p.likedBy || [];
  const meGusta = likedBy.includes(myUid);
  const likes = Math.max(p.likes || 0, likedBy.length);
  const respuestas = p.respuestas || [];
  const txt = p.txt || '';
  const largo = txt.length > 110 || txt.includes('\n');
  const claro = pantalla;

  // Se reproduce cuando se ve al menos el 60 %; fuera de la pantalla se pausa
  useEffect(() => {
    const el = caja.current; if (!el || !window.IntersectionObserver) { setVisible(true); return; }
    const io = new IntersectionObserver(([e]) => setVisible(e.intersectionRatio >= 0.6), { threshold: [0, 0.6, 1] });
    io.observe(el); return () => io.disconnect();
  }, []);
  useEffect(() => { const el = ref.current; if (!el) return; videos.add(el); return () => { videos.delete(el); }; }, []);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.muted = !sonido;
    el.volume = vol;
    if (visible && activo && !pausado && !(quieto() && !pantalla)) { const pr = el.play(); if (pr && pr.catch) pr.catch(() => { el.muted = true; ponerSonido(false); el.play().catch(() => setPausado(true)); }); }
    else el.pause();
  }, [visible, activo, pausado, sonido, vol, pantalla]);
  useEffect(() => { if (quieto() && !pantalla) setPausado(true); }, [pantalla]);

  const like = async (soloDar) => {
    if (soloDar && meGusta) return;
    try { await toggleLikeFS(p._ruta || p.id, myUid, meGusta); } catch (e) { avisar('No se pudo guardar tu «me sirve».', 'warn'); }
  };
  const flash = (x) => { setAviso(x); clearTimeout(reloj.current); reloj.current = setTimeout(() => setAviso(null), 700); };
  // Un toque: sonido (o seguir si estaba en pausa). Doble toque: «Me sirve» con el corazón grande.
  const tocar = () => {
    if (toque.current) { clearTimeout(toque.current); toque.current = null; setCorazon((c) => c + 1); like(true); return; }
    toque.current = setTimeout(() => {
      toque.current = null;
      if (pausado) { setPausado(false); flash('play'); return; }
      const n = !conSonido; ponerSonido(n); flash(n ? 'sonido' : 'silencio');
    }, 240);
  };
  const guardar = () => {
    const l = leerGuardados(); const n = l.includes(p.id) ? l.filter((x) => x !== p.id) : [...l, p.id];
    try { localStorage.setItem('criterium-guardados', JSON.stringify(n)); } catch (e) {}
    setGuardado(!guardado); avisar(guardado ? 'Quitado de guardados' : 'Guardado');
  };
  const compartir = async () => {
    const datos = { title: p.titulo || 'Reel en Criterium', text: (p.titulo ? p.titulo + ' · ' : '') + 'Míralo en Criterium', url: location.origin };
    try {
      if (navigator.share) await navigator.share(datos);
      else { await navigator.clipboard.writeText(datos.url); avisar('Enlace copiado'); }
    } catch (e) {}
  };
  const velo = 'bg-[color-mix(in_srgb,var(--deep)_50%,transparent)] backdrop-blur-md';
  if (!v) return null;
  return (
    <div className={cx('flex w-full flex-col', pantalla && 'mx-auto max-w-[1100px]')}>
      {/* El video */}
      <div ref={caja} className={cx('relative w-full select-none overflow-hidden bg-deep', vertical ? 'mx-auto aspect-[9/16]' : 'aspect-video', vertical && (pantalla ? 'max-w-[calc(70dvh*0.5625)]' : 'max-w-[calc(min(70vh,640px)*0.5625)]'), pantalla && 'sm:rounded-[18px]')}>
        <video ref={ref} src={v.url} poster={v.poster} playsInline loop muted preload="metadata" className="absolute inset-0 h-full w-full object-contain"
          onPlay={(e) => soloEste(e.currentTarget)}
          onLoadedMetadata={(e) => { const el = e.currentTarget; if (el.videoWidth && el.videoHeight) setVertical(el.videoHeight > el.videoWidth); }}
          onTimeUpdate={(e) => setAvance(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)} />
        <button type="button" onClick={tocar} aria-label={sonido ? 'Silenciar' : 'Activar el sonido'} className="absolute inset-0 z-[1] cursor-pointer" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-16 bg-gradient-to-b from-[color-mix(in_srgb,var(--deep)_45%,transparent)] to-transparent" />
        <div className="absolute inset-x-0 top-0 z-[3] flex items-center gap-2 px-3 pt-2.5 text-onc">
          <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold', velo)}><Ic n="video" s={14} />Reel</span>
          {p.revisado && <span className="inline-flex items-center gap-1 rounded-full bg-menta px-2.5 py-1 text-[11.5px] font-bold text-mentaink"><Ic n="stamp" s={13} />Revisado</span>}
          <span className="flex-1" />
          <div className={cx('flex h-9 items-center rounded-full', velo)}>
            {volumenEditable && sonido && <input type="range" min="0" max="1" step="0.05" value={vol} onChange={(e) => ponerVolumen(parseFloat(e.target.value))} aria-label="Volumen" className="ml-3 h-1 w-20 cursor-pointer accent-menta sm:w-24" />}
            <button type="button" onClick={() => ponerSonido(!sonido)} aria-label={sonido ? 'Silenciar' : 'Activar el sonido'} className="grid h-9 w-9 place-items-center rounded-full">{sonido && vol > 0 ? <Ic n="volumen" s={18} /> : <Silencio />}</button>
          </div>
          {abrir && <button type="button" onClick={() => { ponerSonido(true); abrir(); }} aria-label="Ver en pantalla completa" className={cx('grid h-9 w-9 place-items-center rounded-full', velo)}><Ic n="expand" s={17} /></button>}
        </div>
        {pausado && <span className={cx('pointer-events-none absolute left-1/2 top-1/2 z-[3] grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-onc', velo)}><Play /></span>}
        {aviso && !pausado && <span key={aviso + avance} className={cx('aparece pointer-events-none absolute left-1/2 top-1/2 z-[3] grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-onc', velo)}>{aviso === 'silencio' ? <Silencio s={24} /> : aviso === 'play' ? <Play s={24} /> : <Ic n="volumen" s={24} />}</span>}
        {corazon > 0 && <span key={corazon} className="reel-corazon pointer-events-none absolute left-1/2 top-1/2 z-[3] text-onc"><svg width="88" height="88" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" fill="currentColor" /></svg></span>}
        <div className="absolute inset-x-0 bottom-0 z-[4] h-[3px] bg-[color-mix(in_srgb,var(--onc)_20%,transparent)]"><div className="h-full bg-menta" style={{ width: (avance * 100).toFixed(2) + '%' }} /></div>
      </div>

      {/* Debajo: autor, texto y acciones */}
      <div className={cx('flex flex-col gap-2 px-4 pb-2 pt-3.5', claro ? 'text-onc' : 'text-ink')}>
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={() => autorUid && verPerfil(autorUid)} className="flex-none rounded-full"><Avatar nombre={p.autor.nombre} verificado={p.autor.verificado} size={38} /></button>
          <div className="min-w-0 flex-1">
            <button type="button" onClick={() => autorUid && verPerfil(autorUid)} className="block max-w-full truncate text-left text-[14.5px] font-semibold leading-tight hover:underline">{p.autor.nombre}</button>
            <p className={cx('m-0 truncate text-[12.5px]', claro ? 'text-panelink2' : 'text-ink3')}>{[p.autor.rol, p.autor.institucion].filter(Boolean).join(' · ')}{p.fecha ? ' · ' + hace(p.fecha) : ''}</p>
          </div>
          {autorUid && autorUid !== myUid && !siguiendo.includes(autorUid) && <button type="button" onClick={() => toggleSeguir(autorUid)} className={cx('flex-none rounded-full px-3 py-1.5 text-[13px] font-semibold', claro ? 'text-menta hover:bg-[color-mix(in_srgb,var(--onc)_12%,transparent)]' : 'text-acento hover:bg-soft')}>+ Seguir</button>}
        </div>
        {p.titulo && <h3 className={cx('m-0 text-[17px] font-bold leading-snug', claro ? 'text-onc' : 'text-deep')}>{p.titulo}</h3>}
        {txt && (
          <div>
            <p className={cx('m-0 text-[14.5px] leading-[1.55]', claro ? 'text-panelink' : 'text-ink2', mas || !largo ? 'whitespace-pre-line' : 'line-clamp-2')}>{mas || !largo ? txt : txt.replace(/\s*\n+\s*/g, ' ')}</p>
            {largo && <button type="button" onClick={() => setMas(!mas)} aria-expanded={mas} className={cx('mt-1 text-[13px] font-semibold', claro ? 'text-menta' : 'text-acento')}>{mas ? 'Mostrar menos' : 'Mostrar más'}</button>}
          </div>
        )}
        {(p.especialidad || p.procedimiento) && (
          <div className="flex flex-wrap gap-1.5 text-[11.5px] font-semibold">
            {p.especialidad && <span className={cx('rounded-full px-2.5 py-[3px]', claro ? 'bg-[color-mix(in_srgb,var(--onc)_14%,transparent)]' : 'bg-soft text-acentodeep')}>{p.especialidad}</span>}
            {p.procedimiento && <span className={cx('rounded-full px-2.5 py-[3px]', claro ? 'bg-[color-mix(in_srgb,var(--onc)_14%,transparent)]' : 'bg-soft text-acentodeep')}># {p.procedimiento}</span>}
          </div>
        )}
      </div>
      <div className={cx('flex items-center gap-0.5 px-2 pb-2', !claro && 'border-t border-line2 pt-1')}>
        <Accion claro={claro} label={meGusta ? 'Quitar «me sirve»' : 'Me sirve'} activo={meGusta} n={cuenta(likes)} onClick={() => like(false)} className={meGusta ? '!text-bad' : ''}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className={cx(meGusta && 'salta')}><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" fill={meGusta ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        </Accion>
        <Accion claro={claro} ic="chat" label="Comentarios" n={cuenta(respuestas.length)} onClick={() => comentar(p)} />
        <Accion claro={claro} ic="compartir" label="Compartir" n="" onClick={compartir} />
        <Accion claro={claro} label={guardado ? 'Quitar de guardados' : 'Guardar'} activo={guardado} n="" onClick={guardar} className={cx('ml-auto', guardado && (claro ? '!text-menta' : '!text-acento'))}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4h11a1 1 0 0 1 1 1v15l-6.5-4-6.5 4V5a1 1 0 0 1 1-1z" fill={guardado ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        </Accion>
      </div>
    </div>
  );
}

// Comentarios de un reel: hoja desde abajo (en escritorio, centrada)
function Comentarios({ p, cerrar }) {
  const { myUid, conPerfil, verPerfil } = useApp();
  const [txt, setTxt] = useState('');
  const [err, setErr] = useState('');
  const respuestas = p.respuestas || [];
  useEffect(() => { const f = (e) => e.key === 'Escape' && cerrar(); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); }, [cerrar]);
  const enviar = (e) => {
    e.preventDefault();
    if (txt.trim().length < 2) { setErr('Escribe un comentario.'); return; }
    if (datosPersonales(txt).length) { setErr('El comentario trae datos que identifican a alguien. Quítalos.'); return; }
    conPerfil(async (pf) => {
      try { await responderPostFS(p._ruta || p.id, { id: uid(), autor: { uid: myUid, nombre: pf.nombre, rol: pf.rol, verificado: false }, fecha: new Date().toISOString(), txt: txt.trim() }); setTxt(''); setErr(''); }
      catch (er) { setErr('No se pudo publicar. Revisa tu conexión.'); }
    });
  };
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[color-mix(in_srgb,var(--deep)_45%,transparent)] sm:items-center" onClick={cerrar} role="dialog" aria-modal="true" aria-label="Comentarios">
      <div onClick={(e) => e.stopPropagation()} className="hoja flex max-h-[75dvh] w-full max-w-[520px] flex-col rounded-t-[24px] bg-card pb-[env(safe-area-inset-bottom,0px)] shadow-shlg sm:rounded-[24px]">
        <div className="flex items-center px-5 pb-2 pt-4"><b className="flex-1 text-center text-[15px] text-ink">Comentarios</b><button type="button" onClick={cerrar} aria-label="Cerrar" className="rounded-full p-1.5 text-ink3 hover:bg-soft"><Ic n="x" s={18} /></button></div>
        <div className="min-h-[120px] flex-1 overflow-y-auto px-5 py-2">
          {respuestas.length === 0 ? <p className="m-0 py-8 text-center text-[14px] text-ink3">Todavía no hay comentarios. Sé el primero.</p> : respuestas.map((r) => (
            <div key={r.id} className="flex gap-2.5 py-2">
              <Avatar nombre={r.autor.nombre} verificado={r.autor.verificado} size={32} />
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[12.5px]"><button type="button" onClick={() => r.autor.uid && verPerfil(r.autor.uid)} className="font-semibold text-ink hover:underline">{r.autor.nombre}</button> <span className="text-ink3">{hace(r.fecha)}</span></p>
                <p className="m-0 mt-0.5 text-[14px] leading-relaxed text-ink2">{r.txt}</p>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={enviar} className="flex flex-col gap-1 border-t border-line2 px-4 py-3">
          <div className="flex gap-2"><input value={txt} onChange={(e) => { setTxt(e.target.value); setErr(''); }} placeholder="Agrega un comentario…" aria-label="Comentario" className={cx(inputCls, '!rounded-full !py-2')} /><button type="submit" className="flex-none rounded-full px-3 text-[14px] font-semibold text-acento disabled:opacity-40" disabled={!txt.trim()}>Publicar</button></div>
          {err && <p className="m-0 text-[12.5px] font-semibold text-bad">{err}</p>}
        </form>
      </div>
    </div>, document.body);
}

// Visor a pantalla completa: un reel por pantalla, se desliza hacia arriba como en Instagram
function VisorReels({ reels, inicio, cerrar }) {
  const lista = useRef(null);
  const [actual, setActual] = useState(inicio);
  const [coment, setComent] = useState(null);
  useEffect(() => {
    const el = lista.current; if (el) el.scrollTop = inicio * el.clientHeight;
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const tecla = (e) => {
      if (e.key === 'Escape' && !coment) cerrar();
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && lista.current) { e.preventDefault(); lista.current.scrollBy({ top: (e.key === 'ArrowDown' ? 1 : -1) * lista.current.clientHeight, behavior: 'smooth' }); }
    };
    window.addEventListener('keydown', tecla);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', tecla); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const alDeslizar = (e) => { const h = e.currentTarget.clientHeight; if (h) setActual(Math.round(e.currentTarget.scrollTop / h)); };
  return createPortal(
    <div className="fixed inset-0 z-[110] bg-deep" role="dialog" aria-modal="true" aria-label="Reels">
      <div ref={lista} onScroll={alDeslizar} className="h-[100dvh] snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none]">
        {reels.map((p, k) => (
          <section key={p.id} className="flex h-[100dvh] snap-start snap-always flex-col justify-center overflow-y-auto pb-[env(safe-area-inset-bottom,0px)] pt-[calc(64px+env(safe-area-inset-top,0px))] sm:px-6 sm:pb-6">
            <ReelCuerpo p={p} pantalla activo={k === actual} comentar={setComent} />
          </section>
        ))}
      </div>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[5] flex items-center gap-3 px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] text-onc sm:px-6">
        <button type="button" onClick={cerrar} aria-label="Cerrar los reels" className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-[color-mix(in_srgb,var(--deep)_50%,transparent)] backdrop-blur-md"><Ic n="x" s={20} /></button>
        <b className="text-[17px] [text-shadow:0_1px_3px_rgba(0,0,0,.4)] sm:hidden">Reels</b>
      </div>
      {reels.length > 1 && <p className="pointer-events-none fixed bottom-4 left-1/2 z-[5] m-0 hidden -translate-x-1/2 text-[12px] text-panelink2 sm:block">↑ ↓ para pasar de reel · Esc para salir</p>}
      {coment && <Comentarios p={reels.find((x) => x.id === coment.id) || coment} cerrar={() => setComent(null)} />}
    </div>, document.body);
}

// La tarjeta del reel en el inicio
export function ReelTarjeta({ p }) {
  const { feed } = useApp();
  const [visor, setVisor] = useState(null);
  const [coment, setComent] = useState(null);
  const reels = (feed || []).filter((x) => x.tipo === 'reel' && videoDe(x) && (x.estado || 'publicado') === 'publicado');
  const todos = reels.some((x) => x.id === p.id) ? reels : [p, ...reels];
  return (
    <article className="overflow-hidden rounded-[22px] bg-card shadow-sh" aria-label={'Reel de ' + p.autor.nombre}>
      <ReelCuerpo p={p} activo={visor === null} abrir={() => setVisor(todos.findIndex((x) => x.id === p.id))} comentar={setComent} />
      {visor !== null && <VisorReels reels={todos} inicio={Math.max(0, visor)} cerrar={() => setVisor(null)} />}
      {coment && <Comentarios p={(feed || []).find((x) => x.id === coment.id) || coment} cerrar={() => setComent(null)} />}
    </article>
  );
}
