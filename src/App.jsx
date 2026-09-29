import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PROTOS } from './data.js';
import { ESTADOS, chequeoCaso, leer, escribir, uid } from './logic.js';
import { casosIniciales, feedInicial } from './seeds.js';
import { Ctx } from './ctx.js';
import { Ic, Avatar, Lightbox, Logo, useToasts, cx } from './ui.jsx';
import { Inicio, Biblioteca, Protocolo } from './views/protocolos.jsx';
import { CasosLista, CasoDetalle, CasoEditor, casoVacio } from './views/casos.jsx';
import { Revision } from './views/revision.jsx';
import { Asistente, Herramientas } from './views/trabajo.jsx';
import { Feed, Postular, Contacto, PerfilModal, PerfilPublico } from './views/comunidad.jsx';
import { useUsuario, cerrarSesion, actualizarPerfil } from './auth.js';
import { useMisCasos, useColaRevision, useFeedFS, guardarCasoFS, actualizarCasoFS, eliminarCasoFS, subirFoto, publicarPostFS, guardarPostulacionFS, leerPostulacionFS, enviarMensajeFS, guardarPerfilPublicoFS, useSeguimientos, seguirFS, dejarDeSeguirFS } from './db.js';
import AuthGate from './views/auth.jsx';
import Migracion from './views/migracion.jsx';

const VISTAS = ['inicio', 'biblioteca', 'proto', 'casos', 'caso', 'editor', 'revision', 'asistente', 'herramientas', 'feed', 'postular', 'contacto', 'perfil'];
const RUTAS = { inicio: 'Sobre Criterium', biblioteca: 'Biblioteca', proto: 'Biblioteca · Protocolo', casos: 'Mis casos', caso: 'Mis casos · Caso', editor: 'Mis casos · Editar',
  revision: 'Revisión', asistente: 'Asistente', herramientas: 'Herramientas', feed: 'Inicio', postular: 'Postular a revisor', contacto: 'Contáctanos', perfil: 'Perfil' };

const NAV_DIARIO = [['feed', 'home', 'Inicio'], ['casos', 'folder', 'Mis casos'], ['revision', 'stamp', 'Revisión'], ['herramientas', 'tool', 'Herramientas'], ['asistente', 'bot', 'Asistente']];
const NAV_BIBLIO = [['biblioteca', 'book', 'Biblioteca'], ['inicio', 'sparkle', 'Sobre Criterium'], ['postular', 'userCheck', 'Postular a revisor'], ['contacto', 'mail', 'Contáctanos']];
const activo = (view, v) => view === v || (v === 'biblioteca' && view === 'proto') || (v === 'casos' && (view === 'caso' || view === 'editor'));

function lsGet(k, d) { try { const x = localStorage.getItem(k); return x ? JSON.parse(x) : d; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

function temaEfectivo() {
  const a = document.documentElement.getAttribute('data-theme');
  if (a === 'dark' || a === 'light') return a;
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { return 'light'; }
}

/* ═══════ Wrapper con Auth ═══════ */
function AppWrapper() {
  const { usuario, perfil: perfilAuth, setPerfil: setPerfilAuth, cargando } = useUsuario();

  return (
    <AuthGate usuario={usuario} cargando={cargando}>
      <AppConUsuario usuario={usuario} perfilAuth={perfilAuth} setPerfilAuth={setPerfilAuth} />
    </AuthGate>
  );
}

/* ═══════ App principal (solo si hay sesión) ═══════ */
function AppConUsuario({ usuario, perfilAuth, setPerfilAuth }) {
  const myUid = usuario?.uid;
  const [avisar, toasts] = useToasts();

  /* ── Migración ── */
  const [migrado, setMigrado] = useState(false);
  const [mostrarMigracion, setMostrarMigracion] = useState(true);

  /* ── Datos de Firestore ── */
  const [casosPropios, casosPropiosListo] = useMisCasos(myUid);
  const [colaRevision, colaRevisionListo] = useColaRevision();
  const [feedFS, setFeedFS, feedListo] = useFeedFS();

  // Combinar: casos propios + cola de revisión (sin duplicados)
  const todos = useMemo(() => {
    const ids = new Set(casosPropios.map((c) => c.id));
    return [...casosPropios, ...colaRevision.filter((c) => !ids.has(c.id))];
  }, [casosPropios, colaRevision]);

  // Postulación y mensajes (se cargan una vez)
  const [postulacion, setPostulacion] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [postCargado, setPostCargado] = useState(false);

  useEffect(() => {
    if (!myUid) return;
    leerPostulacionFS(myUid).then((p) => { setPostulacion(p); setPostCargado(true); });
  }, [myUid]);

  const listo = casosPropiosListo && feedListo && postCargado;

  /* ── Perfil (viene de auth) ── */
  const perfil = perfilAuth;
  const setPerfil = useCallback(async (p) => {
    if (!myUid) return;
    setPerfilAuth(p);
    await actualizarPerfil(myUid, p);
    await guardarPerfilPublicoFS(myUid, p);
  }, [myUid]);

  /* ── Perfil público: se crea o actualiza al iniciar sesión (solo datos profesionales) ── */
  useEffect(() => {
    if (myUid && perfil && perfil.nombre) guardarPerfilPublicoFS(myUid, perfil).catch(() => {});
  }, [myUid, perfil && perfil.nombre]);

  /* ── Seguimientos del usuario ── */
  const { siguiendo } = useSeguimientos(myUid);

  /* ── Navegación ── */
  const hashIni = (() => { try { const h = (location.hash || '').slice(1); return VISTAS.includes(h) && !['proto', 'caso', 'editor', 'perfil'].includes(h) ? h : 'feed'; } catch (e) { return 'feed'; } })();
  const [view, setView] = useState(hashIni);
  const [protoId, setProtoId] = useState('cementado-pmma');
  const [casoId, setCasoId] = useState(null);
  const [perfilUid, setPerfilUid] = useState(null);
  const [desde, setDesde] = useState('casos');
  const [editando, setEditando] = useState(null);
  const [revisando, setRevisando] = useState(null);
  const [q, setQ] = useState('');
  const [esp, setEsp] = useState('todas');
  const [filtroCasos, setFiltroCasos] = useState('todos');
  const [feedProto, setFeedProto] = useState('');
  const [asisTab, setAsisTab] = useState('preguntar');
  const [herrTab, setHerrTab] = useState('perio');
  const [menu, setMenu] = useState(false);
  const [buscarMovil, setBuscarMovil] = useState(false);
  const [foto, setFoto] = useState(null);
  const [perfilOpen, setPerfilOpen] = useState(false);
  const perfilCallback = useRef(null);
  const [tema, setTema] = useState('light');
  const [checks, setChecksRaw] = useState(() => lsGet('criterium-checks', {}));
  const setChecks = (fn) => setChecksRaw((c) => { const n = typeof fn === 'function' ? fn(c) : fn; lsSet('criterium-checks', n); return n; });
  const [modoRevisor, setModoRevisorRaw] = useState(() => lsGet('criterium-revisor', false));
  const setModoRevisor = (v) => { setModoRevisorRaw(v); lsSet('criterium-revisor', v); setRevisando(null); };

  /* ── Tema ── */
  useEffect(() => {
    const t = lsGet('criterium-tema', null);
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
    setTema(temaEfectivo());
    let mq; try { mq = window.matchMedia('(prefers-color-scheme: dark)'); const f = () => setTema(temaEfectivo()); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); } catch (e) {}
  }, []);
  const toggleTema = () => { const t = temaEfectivo() === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', t); lsSet('criterium-tema', t); setTema(t); };

  /* ── Acciones ── */
  const go = (v, extra = {}) => {
    setView(v); setMenu(false); setBuscarMovil(false);
    if (v === 'revision' && !('revisando' in extra)) setRevisando(null);
    if ('filtroCasos' in extra) setFiltroCasos(extra.filtroCasos);
    if ('feedProto' in extra) setFeedProto(extra.feedProto); else if (v === 'feed') setFeedProto('');
    try { history.replaceState(null, '', ['proto', 'caso', 'editor', 'perfil'].includes(v) ? '#' + (v === 'proto' ? 'biblioteca' : v === 'perfil' ? 'feed' : 'casos') : '#' + v); } catch (e) {}
    try { window.scrollTo(0, 0); } catch (e) {}
  };
  const abrirProto = (id) => { const p = PROTOS.find((x) => x.id === id); if (!p || !p.abre) return; setProtoId(id); go('proto'); };
  const abrirCaso = (id) => { setDesde(view === 'revision' ? 'revision' : 'casos'); setCasoId(id); go('caso'); };
  const verPerfil = (uid) => { if (!uid) return; setPerfilUid(uid); go('perfil'); };
  const toggleSeguir = async (uid) => {
    if (!myUid || !uid || uid === myUid) return;
    try { siguiendo.includes(uid) ? await dejarDeSeguirFS(myUid, uid) : await seguirFS(myUid, uid); }
    catch (e) { avisar('No se pudo actualizar. Revisa tu conexión.', 'warn'); }
  };
  const nuevoCaso = (preset) => { setEditando(casoVacio(preset)); go('editor'); };
  const editarCaso = (id) => { const c = todos.find((x) => x.id === id); if (c) { setEditando(c); go('editor'); } };
  const ahora = () => new Date().toISOString();

  const guardarCaso = useCallback(async (c) => {
    try {
      const nuevoId = await guardarCasoFS({ ...c, autor: { id: myUid, nombre: perfil?.nombre || 'Tú', rol: perfil?.rol || '' } }, myUid);
      if (!c.id || c.id.length <= 5) {
        // Caso nuevo: redirigir
        setCasoId(nuevoId);
      }
      avisar('Caso guardado');
    } catch (e) {
      avisar('No se pudo guardar el caso: ' + (e.message || ''), 'warn');
    }
  }, [myUid, perfil]);

  const actualizarCaso = useCallback(async (id, fn) => {
    const c = todos.find((x) => x.id === id);
    if (!c) return;
    const actualizado = fn(c);
    const { id: _, ...sinId } = actualizado;
    try {
      await actualizarCasoFS(id, sinId);
    } catch (e) {
      avisar('No se pudo actualizar el caso.', 'warn');
    }
  }, [todos]);

  const enviarCaso = useCallback(async (id, override) => {
    const c = override || todos.find((x) => x.id === id); if (!c) return;
    if (!chequeoCaso(c).puedeEnviar) { avisar('El caso todavía no pasa el chequeo para enviarlo.', 'warn'); return; }
    const re = c.estado === 'cambios';
    try {
      await actualizarCasoFS(id, {
        estado: 'enviado',
        historial: [...(c.historial || []), { fecha: ahora(), txt: re ? 'Reenviado a revisión' : 'Enviado a revisión' }]
      });
      avisar(re ? 'Caso reenviado a revisión' : 'Caso enviado a revisión');
    } catch (e) {
      avisar('No se pudo enviar el caso.', 'warn');
    }
  }, [todos]);

  const retirarCaso = useCallback(async (id) => {
    const c = todos.find((x) => x.id === id); if (!c) return;
    try {
      await actualizarCasoFS(id, {
        estado: c.revisiones && c.revisiones.length ? 'cambios' : 'borrador',
        historial: [...(c.historial || []), { fecha: ahora(), txt: 'Retirado de revisión por el autor' }]
      });
      avisar('Caso retirado de revisión');
    } catch (e) {
      avisar('No se pudo retirar el caso.', 'warn');
    }
  }, [todos]);

  const eliminarCaso = useCallback(async (id) => {
    const c = todos.find((x) => x.id === id);
    try {
      await eliminarCasoFS(id, c?.fotos || []);
      go('casos');
      avisar('Caso eliminado');
    } catch (e) {
      avisar('No se pudo eliminar el caso.', 'warn');
    }
  }, [todos]);

  const duplicarCaso = useCallback(async (id) => {
    const c = todos.find((x) => x.id === id); if (!c) return;
    const n = { ...JSON.parse(JSON.stringify(c)), id: uid(), ejemplo: false, estado: 'borrador', titulo: c.titulo + ' (copia)', revisiones: [], sesiones: [], historial: [], creado: ahora(), autor: { id: myUid, nombre: perfil?.nombre || 'Tú', rol: perfil?.rol || '' } };
    n.fotos = n.fotos.map((f) => ({ ...f, postEnvio: false }));
    setEditando(n); go('editor');
  }, [todos, myUid, perfil]);

  const firmarRevision = useCallback(async (id, rev) => {
    const c = todos.find((x) => x.id === id); if (!c) return;
    try {
      await actualizarCasoFS(id, {
        estado: rev.veredicto,
        revisiones: [...(c.revisiones || []), rev],
        historial: [...(c.historial || []), { fecha: ahora(), txt: ESTADOS[rev.veredicto].txt + ' por ' + rev.revisor.nombre }]
      });
      setRevisando(null);
      avisar(rev.veredicto === 'aprobado' ? 'Caso aprobado y firmado' : rev.veredicto === 'cambios' ? 'Cambios pedidos al autor' : 'Caso denegado', rev.veredicto === 'denegado' ? 'bad' : rev.veredicto === 'cambios' ? 'warn' : 'ok');
    } catch (e) {
      avisar('No se pudo firmar la revisión.', 'warn');
    }
  }, [todos]);

  const quitarEjemplos = useCallback(async () => {
    const ejemplos = todos.filter((x) => x.ejemplo);
    for (const c of ejemplos) {
      try { await eliminarCasoFS(c.id, c.fotos || []); } catch (e) {}
    }
    avisar('Ejemplos quitados');
  }, [todos]);

  const conPerfil = (cb) => { if (perfil) cb(perfil); else { perfilCallback.current = cb; setPerfilOpen(true); } };

  /* ── Feed (sync con Firestore) ── */
  const feed = feedFS;
  const setFeed = useCallback(async (fnOrVal) => {
    const nuevoFeed = typeof fnOrVal === 'function' ? fnOrVal(feedFS) : fnOrVal;
    setFeedFS(nuevoFeed);
    // Sincronizar cambios individuales con Firestore
    for (const post of nuevoFeed) {
      try { await publicarPostFS(post); } catch (e) {}
    }
  }, [feedFS]);

  /* ── Postulación (sync) ── */
  const guardarPostulacion = useCallback(async (data) => {
    setPostulacion(data);
    if (myUid) await guardarPostulacionFS(myUid, data);
  }, [myUid]);

  /* ── Mensajes (sync) ── */
  const guardarMensaje = useCallback(async (msg) => {
    setMensajes((l) => [...l, msg]);
    if (myUid) await enviarMensajeFS(myUid, msg);
  }, [myUid]);

  /* ── Cerrar sesión ── */
  const logout = async () => {
    try { await cerrarSesion(); } catch (e) { avisar('No se pudo cerrar la sesión.', 'warn'); }
  };

  /* ── Conteo y badges ── */
  const mios = todos.filter((c) => c.autorUid === myUid);
  const badge = { casos: mios.filter((c) => c.estado === 'cambios').length, revision: modoRevisor ? colaRevision.length : 0 };

  /* ── Contexto ── */
  // Para compatibilidad con el código existente, 'casos' incluye todos (propios + cola de revisión)
  const setCasos = () => {}; // No-op: los datos vienen de Firestore ahora
  const ctx = {
    view, go, protoId, abrirProto, casoId, abrirCaso, desde, editando, nuevoCaso, editarCaso, guardarCaso, actualizarCaso, enviarCaso, retirarCaso, eliminarCaso, duplicarCaso,
    revisando, setRevisando, firmarRevision, modoRevisor, setModoRevisor, quitarEjemplos,
    q, setQ, esp, setEsp, filtroCasos, setFiltroCasos, feedProto, setFeedProto, asisTab, setAsisTab, herrTab, setHerrTab,
    casos: todos, setCasos, feed, setFeed, perfil, setPerfil, conPerfil, perfilCallback, postulacion, setPostulacion: guardarPostulacion, mensajes, setMensajes: guardarMensaje,
    checks, setChecks, avisar, verFoto: setFoto,
    usuario, myUid, logout, perfilUid, verPerfil, siguiendo, toggleSeguir, editarPerfil: () => setPerfilOpen(true)
  };

  /* ── Render ── */
  const navBtn = (v, icon, t) => (
    <button key={v} type="button" onClick={() => go(v)} aria-current={activo(view, v) ? 'page' : undefined}
      className={cx('flex items-center gap-3 rounded-rs px-3 py-2.5 text-left text-[14px] transition-colors', activo(view, v) ? 'bg-soft font-semibold text-ink' : 'text-ink2 hover:bg-soft hover:text-ink')}>
      <Ic n={icon} /><span className="flex-1">{t}</span>
      {badge[v] > 0 && <span className={cx('rounded-full px-1.5 text-[11px] font-bold tabular-nums', v === 'casos' ? 'bg-warn text-onc' : 'bg-acento text-onc')}>{badge[v]}</span>}
    </button>
  );
  const navegacion = () => (
    <nav className="flex flex-col gap-0.5">
      <div className="px-3 pb-1.5 pt-1 text-[10.5px] font-bold uppercase tracking-[.07em] text-ink3">Trabajo diario</div>
      {NAV_DIARIO.map(([v, i, t]) => navBtn(v, i, t))}
      <div className="px-3 pb-1.5 pt-4 text-[10.5px] font-bold uppercase tracking-[.07em] text-ink3">Biblioteca y comunidad</div>
      {NAV_BIBLIO.map(([v, i, t]) => navBtn(v, i, t))}
    </nav>
  );
  const marca = () => (
    <button type="button" onClick={() => go('feed')} className="text-left" aria-label="Criterium, ir al inicio">
      <Logo size={26} />
    </button>
  );
  const temaBtn = () => (
    <button type="button" onClick={toggleTema} className="flex items-center gap-2.5 rounded-full border border-line bg-card px-3.5 py-2 text-[13px] text-ink2 hover:bg-soft">
      <Ic n={tema === 'dark' ? 'sun' : 'moon'} s={15} />{tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    </button>
  );
  const perfilBtn = (compacto) => perfil ? (
    <button type="button" onClick={() => verPerfil(myUid)} className="flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-3 text-[13px] font-semibold text-ink2 hover:bg-soft" aria-label="Tu perfil">
      <Avatar nombre={perfil.nombre} size={28} />{!compacto && <span className="max-w-[140px] truncate">{perfil.nombre.split(' ')[0]}</span>}
    </button>
  ) : <button type="button" onClick={() => setPerfilOpen(true)} className="whitespace-nowrap rounded-full bg-acento px-4 py-2 text-[13px] font-semibold text-onc hover:bg-acentodeep">Mi perfil</button>;

  /* Migración al primer login */
  if (mostrarMigracion && !migrado) {
    return (
      <>
        <Migracion uid={myUid} onTerminar={() => { setMigrado(true); setMostrarMigracion(false); }} />
        {toasts}
      </>
    );
  }

  const vista = !listo ? (
    <div className="flex flex-col gap-4 pt-8"><div className="h-8 w-64 animate-pulse rounded-rs bg-soft" /><div className="h-4 w-96 max-w-full animate-pulse rounded-rs bg-soft" /><div className="h-48 animate-pulse rounded-r bg-soft" /></div>
  ) : ({
    inicio: <Inicio />, biblioteca: <Biblioteca />, proto: <Protocolo />, casos: <CasosLista />, caso: <CasoDetalle />,
    editor: editando ? <CasoEditor key={editando.id} /> : <CasosLista />, revision: <Revision />, asistente: <Asistente />, herramientas: <Herramientas />,
    feed: <Feed key={feedProto} />, postular: <Postular />, contacto: <Contacto />, perfil: <PerfilPublico key={perfilUid} />
  })[view];

  return (
    <Ctx.Provider value={ctx}>
      <div className="min-h-screen bg-bg lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen flex-col gap-1 overflow-auto border-r border-line bg-card px-3.5 pb-5 pt-6 lg:flex">
          <div className="px-3 pb-5">{marca()}<div className="mt-1.5 text-[11.5px] leading-snug text-ink3">Procedimientos clínicos basados en la evidencia</div></div>
          {navegacion()}
          <div className="mt-5 rounded-r bg-soft p-3.5">
            <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[.07em] text-ink3">Estado del proyecto</div>
            {[['Protocolos validados', '0'], ['Borradores publicados', String(PROTOS.filter((p) => p.abre).length)], ['Revisores', '0 / 8'], ['Tus casos', String(mios.length)]].map(([a, b]) => (
              <div key={a} className="flex justify-between py-0.5 text-[12.5px]"><span className="text-ink2">{a}</span><b className="tabular-nums">{b}</b></div>
            ))}
          </div>
          <div className="mt-auto flex flex-col gap-2.5 pt-5">
            {temaBtn()}
            <button type="button" onClick={logout} className="flex items-center gap-2.5 rounded-full border border-line bg-card px-3.5 py-2 text-[13px] text-ink2 hover:bg-soft">
              <Ic n="back" s={15} />Cerrar sesión
            </button>
            <p className="m-0 text-[11px] leading-normal text-ink3">Borradores sin revisión de especialista. No deben usarse como estándar de atención.</p>
          </div>
        </aside>

        <div className="min-w-0 pb-[84px] lg:pb-0">
          <div className="sticky z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
            <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="lg:hidden">{marca()}</div>
              <div className="hidden whitespace-nowrap text-[12.5px] text-ink3 lg:block">{RUTAS[view]}</div>
              <form onSubmit={(e) => { e.preventDefault(); go('biblioteca'); }} className="ml-2 hidden max-w-[440px] flex-1 items-center gap-2 rounded-full border border-line bg-card px-4 focus-within:border-acento md:flex">
                <Ic n="search" s={15} className="text-ink3" />
                <input id="busqueda-top" type="search" value={q} onChange={(e) => { setQ(e.target.value); if (view !== 'biblioteca' && e.target.value) go('biblioteca'); }} aria-label="Buscar un protocolo" placeholder="Buscar protocolo: cementar, exodoncia del 1.8…" className="min-w-0 flex-1 bg-transparent py-2 text-[13.5px] text-ink outline-none placeholder:text-ink3" />
              </form>
              <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={() => setBuscarMovil(!buscarMovil)} className="rounded-full p-2 text-ink2 hover:bg-soft md:hidden" aria-label="Buscar"><Ic n="search" /></button>
                <button type="button" onClick={() => nuevoCaso()} className="hidden items-center gap-1.5 rounded-full border border-line bg-card px-3.5 py-2 text-[13px] font-semibold text-acentodeep hover:bg-soft sm:inline-flex"><Ic n="plus" s={15} />Nuevo caso</button>
                {perfilBtn(false)}
              </div>
            </div>
            {buscarMovil && (
              <form onSubmit={(e) => { e.preventDefault(); go('biblioteca'); }} className="flex items-center gap-2 border-t border-line px-4 py-2.5 md:hidden">
                <Ic n="search" s={15} className="text-ink3" />
                <input id="busqueda-movil" type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar protocolo…" aria-label="Buscar un protocolo" className="min-w-0 flex-1 bg-transparent py-1.5 text-[15px] text-ink outline-none placeholder:text-ink3" />
                <button type="submit" className="rounded-full bg-acento px-3.5 py-1.5 text-[13px] font-semibold text-onc">Buscar</button>
              </form>
            )}
          </div>
          <main className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{vista}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} aria-label="Navegación principal">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {[['feed', 'home', 'Inicio'], ['biblioteca', 'book', 'Biblioteca'], ['casos', 'folder', 'Casos'], ['revision', 'stamp', 'Revisión']].map(([v, i, t]) => (
            <button key={v} type="button" onClick={() => go(v)} aria-current={activo(view, v) ? 'page' : undefined}
              className={cx('relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold', activo(view, v) ? 'text-ink' : 'text-ink3')}>
              <Ic n={i} s={21} sw={activo(view, v) ? 2.2 : 1.7} />{t}
              {badge[v] > 0 && <span className={cx('absolute left-1/2 top-1.5 ml-2 min-w-[16px] rounded-full px-1 text-[10px] font-bold leading-4 text-onc', v === 'casos' ? 'bg-warn' : 'bg-acento')}>{badge[v]}</span>}
            </button>
          ))}
          <button type="button" onClick={() => setMenu(true)} className={cx('flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold', ['asistente', 'herramientas', 'inicio', 'postular', 'contacto'].includes(view) ? 'text-ink' : 'text-ink3')}><Ic n="menu" s={21} />Más</button>
        </div>
      </nav>

      {menu && (
        <div className="fixed inset-0 z-50 bg-[rgba(18,17,12,.5)] lg:hidden" onMouseDown={(e) => { if (e.target === e.currentTarget) setMenu(false); }}>
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col gap-3 overflow-auto rounded-t-[22px] bg-card px-4 pb-6 pt-4" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
            <div className="flex items-center justify-between">{marca()}<button type="button" onClick={() => setMenu(false)} className="rounded-full p-2 text-ink3 hover:bg-soft" aria-label="Cerrar menú"><Ic n="x" /></button></div>
            {navegacion()}
            <div className="flex flex-wrap gap-2 pt-2">
              {temaBtn()}
              <button type="button" onClick={() => { setMenu(false); nuevoCaso(); }} className="flex items-center gap-2 rounded-full bg-acento px-4 py-2 text-[13px] font-semibold text-onc"><Ic n="plus" s={15} />Nuevo caso</button>
              <button type="button" onClick={() => { setMenu(false); logout(); }} className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-[13px] text-ink2 hover:bg-soft"><Ic n="back" s={15} />Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}

      {perfilOpen && <PerfilModal open={perfilOpen} onClose={() => setPerfilOpen(false)} />}
      <Lightbox foto={foto} onClose={() => setFoto(null)} />
      {toasts}
    </Ctx.Provider>
  );
}

export default AppWrapper;
