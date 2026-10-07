import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { PROTOS } from './data.js';
import { ESTADOS, chequeoCaso, leer, escribir, uid } from './logic.js';
import { casosIniciales } from './seeds.js';
import { Ctx } from './ctx.js';
import { Ic, Avatar, Lightbox, Logo, useToasts, cx } from './ui.jsx';
import { Inicio, Biblioteca, Protocolo, TuDia } from './views/protocolos.jsx';
import { casoVacio } from './views/casos-vacio.js';
import { PerfilModal } from './views/comunidad.jsx';
// Secciones que se descargan al entrar (el inicio, la biblioteca y el perfil van en la carga inicial)
const vista = (cargar, nombre) => lazy(() => cargar().then((m) => ({ default: m[nombre] })));
const CasosLista = vista(() => import('./views/casos.jsx'), 'CasosLista');
const CasoDetalle = vista(() => import('./views/casos.jsx'), 'CasoDetalle');
const CasoEditor = vista(() => import('./views/casos.jsx'), 'CasoEditor');
const Revision = vista(() => import('./views/revision.jsx'), 'Revision');
const Herramientas = vista(() => import('./views/herramientas.jsx'), 'Herramientas');
const Postular = vista(() => import('./views/comunidad.jsx'), 'Postular');
const Contacto = vista(() => import('./views/comunidad.jsx'), 'Contacto');
const Privacidad = vista(() => import('./views/privacidad.jsx'), 'Privacidad');
import { Feed, PerfilPublico, Bienvenida, Moderacion } from './views/red.jsx';
import { useUsuario, cerrarSesion, actualizarPerfil } from './auth.js';
import { useEsDocente, useMisCasos, useColaRevision, useFeedFS, guardarCasoFS, actualizarCasoFS, eliminarCasoFS, subirFoto, publicarPostFS, guardarPostulacionFS, leerPostulacionFS, enviarMensajeFS, guardarPerfilPublicoFS, useSeguimientos, seguirFS, dejarDeSeguirFS, useEsAdmin, useColaModeracion } from './db.js';
import AuthGate from './views/auth.jsx';
import { Portada } from './views/portada.jsx';
import { Mapa } from './views/mapa.jsx';
import Migracion from './views/migracion.jsx';

const VISTAS = ['inicio', 'biblioteca', 'proto', 'casos', 'caso', 'editor', 'revision', 'herramientas', 'feed', 'postular', 'contacto', 'perfil', 'moderacion', 'privacidad'];
// Secciones guardadas para más adelante (el código sigue en views/): no aparecen en el menú y go() las manda al inicio
const OCULTAS = ['mapa', 'agenda', 'calificaciones', 'evaluaciones', 'asistente'];
const RUTAS = { inicio: 'Sobre Criterium', biblioteca: 'Biblioteca', mapa: 'Biblioteca · Mapa', agenda: 'Mi agenda', calificaciones: 'Calificaciones', evaluaciones: 'Evaluaciones', proto: 'Biblioteca · Protocolo', casos: 'Mis casos', caso: 'Mis casos · Caso', editor: 'Mis casos · Editar',
  revision: 'Revisión', asistente: 'Asistente', herramientas: 'Herramientas', feed: 'Inicio', postular: 'Postular a revisor', contacto: 'Contáctanos', perfil: 'Perfil', moderacion: 'Filtro de publicación', privacidad: 'Privacidad y términos' };

// Menú principal: tres lugares. Lo demás va abajo, como enlaces chicos.
const NAV_DIARIO = [['feed', 'home', 'Inicio'], ['biblioteca', 'book', 'Biblioteca'], ['herramientas', 'tool', 'Herramientas']];
// Portal docente: solo para quien está en /docentes (se agrega a mano en la consola de Firebase)
const NAV_DOCENTE = [['casos', 'folder', 'Mis casos'], ['revision', 'stamp', 'Revisión de casos']];
const VISTAS_DOCENTE = ['casos', 'caso', 'editor', 'revision'];
// Equipo Criterium: el filtro de lo que se publica (admins/{uid}, agregado a mano en la consola)
const NAV_EQUIPO = [['moderacion', 'stamp', 'Filtro de publicación']];
const NAV_SECUNDARIO = [['inicio', 'Sobre Criterium'], ['postular', 'Postular a revisor'], ['contacto', 'Contáctanos'], ['privacidad', 'Privacidad']];
const activo = (view, v) => view === v || (v === 'biblioteca' && view === 'proto') || (v === 'casos' && (view === 'caso' || view === 'editor'));

function lsGet(k, d) { try { const x = localStorage.getItem(k); return x ? JSON.parse(x) : d; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

/* ═══════ Wrapper con Auth ═══════ */
function AppWrapper() {
  const { usuario, perfil: perfilAuth, setPerfil: setPerfilAuth, cargando } = useUsuario();

  return (
    <AuthGate usuario={usuario} cargando={cargando} portada={Portada}>
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
  const [esDocente, rolListo] = useEsDocente(myUid);
  const esAdmin = useEsAdmin(myUid);
  const colaModeracion = useColaModeracion(esAdmin);
  const [casosPropios, casosPropiosListo] = useMisCasos(rolListo && esDocente ? myUid : null);
  const [colaRevision, colaRevisionListo] = useColaRevision(rolListo && esDocente);
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

  const listo = rolListo && casosPropiosListo && feedListo && postCargado;

  /* ── Perfil (viene de auth) ── */
  const perfil = perfilAuth;
  const setPerfil = useCallback(async (p) => {
    if (!myUid) return;
    setPerfilAuth(p);
    await actualizarPerfil(myUid, p);
    // El perfil público se reintenta al volver a entrar (efecto de abajo); si falla ahora, no bloquea el ingreso
    try { await guardarPerfilPublicoFS(myUid, p); } catch (e) { console.warn('Perfil público pendiente:', e && e.code); }
  }, [myUid]);

  /* ── Perfil público: se crea o actualiza al iniciar sesión (solo datos profesionales) ── */
  useEffect(() => {
    if (myUid && perfil && perfil.nombre) guardarPerfilPublicoFS(myUid, perfil).catch(() => {});
  }, [myUid, perfil && perfil.nombre]);

  /* ── Seguimientos del usuario ── */
  const { siguiendo } = useSeguimientos(myUid);

  /* ── Navegación ── */
  // Enlace directo a un protocolo (#proto/<id>): lo usan los PDF de box para llevar a las fuentes
  const protoHash = (() => { try { const m = (location.hash || '').match(/^#proto\/([\w-]+)/); return m && PROTOS.some((p) => p.id === m[1] && p.abre) ? m[1] : null; } catch (e) { return null; } })();
  const hashIni = (() => { try { const h = (location.hash || '').slice(1); if (protoHash) return 'proto'; return VISTAS.includes(h) && !['proto', 'caso', 'editor', 'perfil'].includes(h) ? h : 'feed'; } catch (e) { return 'feed'; } })();
  const [view, setView] = useState(hashIni);
  const [protoId, setProtoId] = useState(protoHash || 'cementado-pmma');
  const [protoTodo, setProtoTodo] = useState(!!protoHash); // llegó por enlace: se abre con todo a la vista (fuentes incluidas)
  const [protoFoco, setProtoFoco] = useState(null); // protocolo a destacar al llegar a la Biblioteca (desde el mapa del inicio)
  const [protoLibre, setProtoLibre] = useState(false); // desde la Biblioteca el protocolo se abre en manos libres
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
  const [lateral, setLateralRaw] = useState(() => lsGet('criterium-lateral', true));
  const setLateral = (v) => { setLateralRaw(v); lsSet('criterium-lateral', v); };
  const [foto, setFoto] = useState(null);
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [bienvenida, setBienvenida] = useState(null); // null | 'nuevo' | 'editar'
  // La bienvenida se abre sola mientras el perfil no está completo, salvo que en esta sesión eligió «completar después»
  const [bienvenidaDespues, setBienvenidaDespues] = useState(() => { try { return sessionStorage.getItem('criterium-bienvenida') === 'despues'; } catch (e) { return false; } });
  const perfilCallback = useRef(null);
  const [checks, setChecksRaw] = useState(() => lsGet('criterium-checks', {}));
  const setChecks = (fn) => setChecksRaw((c) => { const n = typeof fn === 'function' ? fn(c) : fn; lsSet('criterium-checks', n); return n; });
  const [modoRevisor, setModoRevisorRaw] = useState(() => lsGet('criterium-revisor', false));
  const setModoRevisor = (v) => { setModoRevisorRaw(v); lsSet('criterium-revisor', v); setRevisando(null); };

  /* ── Tema: solo claro (el modo oscuro se eliminó). Se borra la preferencia antigua si quedó guardada. ── */
  useEffect(() => { document.documentElement.setAttribute('data-theme', 'light'); try { localStorage.removeItem('criterium-tema'); } catch (e) {} }, []);

  /* ── Acciones ── */
  const go = (v, extra = {}) => {
    if (VISTAS_DOCENTE.includes(v) && !esDocente) v = 'feed'; // las secciones del portal docente no existen para estudiantes
    if (OCULTAS.includes(v) || (v === 'moderacion' && !esAdmin)) v = 'feed';
    setView(v); setMenu(false); setBuscarMovil(false);
    if (v === 'revision' && !('revisando' in extra)) setRevisando(null);
    if ('filtroCasos' in extra) setFiltroCasos(extra.filtroCasos);
    setProtoFoco(extra.foco || null);
    if (extra.foco) { setQ(''); setEsp('todas'); } // que el protocolo destacado no quede oculto por la búsqueda o el filtro
    if ('feedProto' in extra) setFeedProto(extra.feedProto); else if (v === 'feed') setFeedProto('');
    if (v !== 'proto') { try { history.replaceState(null, '', ['caso', 'editor', 'perfil'].includes(v) ? '#' + (v === 'perfil' ? 'feed' : 'casos') : '#' + v); } catch (e) {} }
    if (!extra.foco) { try { window.scrollTo(0, 0); } catch (e) {} }
  };
  useEffect(() => { if (rolListo && !esDocente && VISTAS_DOCENTE.includes(view)) setView('feed'); }, [rolListo, esDocente, view]);
  const abrirProto = (id, opc = {}) => { const p = PROTOS.find((x) => x.id === id); if (!p || !p.abre) return; setProtoId(id); setProtoLibre(!!opc.libre); setProtoTodo(false); go('proto'); try { history.replaceState(null, '', '#proto/' + id); } catch (e) {} };
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
  // El mensaje va a Firestore (mensajes/); si falla, el error llega al formulario para avisar
  const guardarMensaje = useCallback(async (msg) => {
    if (!myUid) throw new Error('sin sesión');
    await enviarMensajeFS(myUid, msg);
    setMensajes((l) => [...l, msg]);
  }, [myUid]);

  /* ── Cerrar sesión ── */
  const logout = async () => {
    try { await cerrarSesion(); } catch (e) { avisar('No se pudo cerrar la sesión.', 'warn'); }
  };

  /* ── Conteo y badges ── */
  const mios = todos.filter((c) => c.autorUid === myUid);
  const badge = { casos: mios.filter((c) => c.estado === 'cambios').length, revision: modoRevisor ? colaRevision.length : 0, moderacion: colaModeracion.length };

  /* ── Contexto ── */
  // Para compatibilidad con el código existente, 'casos' incluye todos (propios + cola de revisión)
  const setCasos = () => {}; // No-op: los datos vienen de Firestore ahora
  const ctx = {
    view, go, protoId, protoLibre, protoTodo, protoFoco, abrirProto, casoId, abrirCaso, desde, editando, nuevoCaso, editarCaso, guardarCaso, actualizarCaso, enviarCaso, retirarCaso, eliminarCaso, duplicarCaso,
    esDocente, revisando, setRevisando, firmarRevision, modoRevisor, setModoRevisor, quitarEjemplos,
    q, setQ, esp, setEsp, filtroCasos, setFiltroCasos, feedProto, setFeedProto, asisTab, setAsisTab, herrTab, setHerrTab,
    casos: todos, setCasos, feed, setFeed, perfil, setPerfil, conPerfil, perfilCallback, postulacion, setPostulacion: guardarPostulacion, mensajes, setMensajes: guardarMensaje,
    checks, setChecks, avisar, verFoto: setFoto,
    usuario, myUid, logout, perfilUid, verPerfil, siguiendo, toggleSeguir, editarPerfil: () => setBienvenida('editar'), esAdmin
  };

  /* ── Render ── */
  // oscuro: la barra lateral de escritorio va en azul petróleo profundo, como la portada de la presentación
  const navBtn = (v, icon, t, oscuro) => (
    <button key={v} type="button" onClick={() => go(v)} aria-current={activo(view, v) ? 'page' : undefined}
      className={cx('flex items-center gap-3 rounded-rs px-3 py-2.5 text-left text-[14px] transition-colors',
        oscuro ? (activo(view, v) ? 'bg-navact font-semibold text-panelink shadow-[inset_3px_0_0_var(--menta)]' : 'text-navink hover:bg-navline hover:text-panelink')
          : (activo(view, v) ? 'bg-card font-semibold text-ink shadow-sh ring-1 ring-cardline' : 'text-ink2 hover:bg-[color-mix(in_srgb,var(--soft)_70%,transparent)] hover:text-ink'))}>
      <Ic n={icon} className={oscuro && activo(view, v) ? 'text-menta' : ''} /><span className="flex-1">{t}</span>
      {badge[v] > 0 && <span className={cx('rounded-full px-1.5 text-[11px] font-bold tabular-nums', v === 'casos' ? 'bg-warn text-onc' : oscuro ? 'bg-menta text-mentaink' : 'bg-acento text-onc')}>{badge[v]}</span>}
    </button>
  );
  const navegacion = (oscuro) => (
    <nav className="flex flex-col gap-0.5">
      {NAV_DIARIO.map(([v, i, t]) => navBtn(v, i, t, oscuro))}
      {esDocente && <>
        <div className={cx('rotulo px-3 pb-1.5 pt-4', oscuro && '!text-navink3')}>Portal docente</div>
        {NAV_DOCENTE.map(([v, i, t]) => navBtn(v, i, t, oscuro))}
      </>}
      {esAdmin && <>
        <div className={cx('rotulo px-3 pb-1.5 pt-4', oscuro && '!text-navink3')}>Equipo Criterium</div>
        {NAV_EQUIPO.map(([v, i, t]) => navBtn(v, i, t, oscuro))}
      </>}
    </nav>
  );
  // Enlaces secundarios: chicos, al pie
  const navSecundario = (oscuro) => (
    <div className="flex flex-col gap-0.5 px-3">
      {NAV_SECUNDARIO.map(([v, t]) => (
        <button key={v} type="button" onClick={() => go(v)} aria-current={view === v ? 'page' : undefined}
          className={cx('py-1 text-left text-[13px] transition-colors', oscuro ? (view === v ? 'text-panelink' : 'text-navink3 hover:text-panelink') : (view === v ? 'font-semibold text-ink' : 'text-ink3 hover:text-ink'))}>{t}</button>
      ))}
    </div>
  );
  const marca = (oscuro) => (
    <button type="button" onClick={() => go('feed')} className="text-left" aria-label="Criterium, ir al inicio">
      <Logo size={26} oscuro={oscuro} />
    </button>
  );
  const perfilBtn = (compacto) => perfil ? (
    <button type="button" onClick={() => verPerfil(myUid)} className="flex items-center gap-2 rounded-full border border-cardline bg-card shadow-sh py-1 pl-1 pr-3 text-[13px] font-semibold text-ink2 hover:bg-soft" aria-label="Tu perfil">
      <Avatar nombre={perfil.nombre} size={28} />{!compacto && <span className="max-w-[140px] truncate">{perfil.nombre.split(' ')[0]}</span>}
    </button>
  ) : <button type="button" onClick={() => setPerfilOpen(true)} className="whitespace-nowrap rounded-full bg-acento px-4 py-2 text-[13px] font-semibold text-onc hover:bg-acentodeep">Mi perfil</button>;

  /* Migración al primer login */
  // La migración sube casos locales: solo tiene sentido para docentes (los estudiantes ya no registran casos)
  if (mostrarMigracion && !migrado && rolListo && esDocente) {
    return (
      <>
        <Migracion uid={myUid} onTerminar={() => { setMigrado(true); setMostrarMigracion(false); }} />
        {toasts}
      </>
    );
  }

  const pantalla = !listo ? (
    <div className="flex flex-col gap-4 pt-8"><div className="h-8 w-64 animate-pulse rounded-rs bg-soft" /><div className="h-4 w-96 max-w-full animate-pulse rounded-rs bg-soft" /><div className="h-48 animate-pulse rounded-r bg-soft" /></div>
  ) : ({
    inicio: <Inicio />, biblioteca: <Biblioteca />, proto: <Protocolo />, casos: <CasosLista />, caso: <CasoDetalle />,
    editor: editando ? <CasoEditor key={editando.id} /> : <CasosLista />, revision: <Revision />, herramientas: <Herramientas />,
    feed: <Feed key={feedProto} arriba={<Mapa incrustado />} lado={<TuDia />} />, postular: <Postular />, contacto: <Contacto />, perfil: <PerfilPublico key={perfilUid} />, moderacion: <Moderacion />, privacidad: <Privacidad />
  })[view];

  return (
    <Ctx.Provider value={ctx}>
      <div className={cx('fondo min-h-screen', lateral && 'lg:grid lg:grid-cols-[256px_minmax(0,1fr)]')}>
        <aside className={cx('sticky top-0 hidden h-screen flex-col gap-1 overflow-auto bg-nav px-4 pb-5 pt-7', lateral && 'lg:flex')}>
          <div className="px-3 pb-5">
            <div className="flex items-center justify-between gap-2">
              {marca(true)}
              <button type="button" onClick={() => setLateral(false)} className="-mr-2 rounded-full p-2 text-navink3 hover:bg-navline hover:text-panelink" aria-label="Ocultar barra lateral" title="Ocultar barra lateral"><Ic n="panel" s={18} /></button>
            </div>
          </div>
          {navegacion(true)}
          <div className="mt-auto flex flex-col gap-4 pt-5">
            {navSecundario(true)}
            <p className="m-0 px-3 text-[11px] leading-normal text-navink3">Borradores sin revisión de especialista.</p>
          </div>
        </aside>

        <div className="min-w-0 pb-[84px] lg:pb-0">
          <div className="sticky z-30 border-b border-cardline bg-[color-mix(in_srgb,var(--bg)_72%,transparent)] backdrop-blur-xl" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
            <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
              {!lateral && (
                <button type="button" onClick={() => setLateral(true)} className="hidden rounded-full p-2 text-ink2 hover:bg-soft hover:text-ink lg:inline-flex" aria-label="Mostrar barra lateral" title="Mostrar barra lateral"><Ic n="panel" s={18} /></button>
              )}
              <div className={cx(lateral && 'lg:hidden')}>{marca()}</div>
              <form onSubmit={(e) => { e.preventDefault(); go('biblioteca'); }} className="ml-2 hidden max-w-[440px] flex-1 items-center gap-2 rounded-full border border-cardline bg-card px-4 shadow-sh focus-within:border-acento md:flex">
                <Ic n="search" s={15} className="text-ink3" />
                <input id="busqueda-top" type="search" value={q} onChange={(e) => { setQ(e.target.value); if (view !== 'biblioteca' && e.target.value) go('biblioteca'); }} aria-label="Buscar un protocolo" placeholder="Buscar protocolo: cementar, exodoncia del 1.8…" className="min-w-0 flex-1 bg-transparent py-2 text-[13.5px] text-ink outline-none placeholder:text-ink3" />
              </form>
              <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={() => setBuscarMovil(!buscarMovil)} className="rounded-full p-2 text-ink2 hover:bg-soft md:hidden" aria-label="Buscar"><Ic n="search" /></button>
                {esDocente && <button type="button" onClick={() => nuevoCaso()} className="hidden items-center gap-1.5 rounded-full border border-cardline bg-card px-3.5 py-2 shadow-sh text-[13px] font-semibold text-acentodeep hover:bg-soft sm:inline-flex"><Ic n="plus" s={15} />Nuevo caso</button>}
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
          <main className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10"><Suspense fallback={<div className="h-64 animate-pulse rounded-[22px] bg-soft" />}>{pantalla}</Suspense></main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-cardline bg-[color-mix(in_srgb,var(--card)_82%,transparent)] backdrop-blur-xl lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} aria-label="Navegación principal">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {(esDocente ? [['feed', 'home', 'Inicio'], ['biblioteca', 'book', 'Biblioteca'], ['casos', 'folder', 'Casos'], ['revision', 'stamp', 'Revisar']]
            : [['feed', 'home', 'Inicio'], ['biblioteca', 'book', 'Biblioteca'], ['herramientas', 'tool', 'Herramientas'], ['perfil', 'userCheck', 'Perfil']]).map(([v, i, t]) => (
            <button key={v} type="button" onClick={() => (v === 'perfil' ? verPerfil(myUid) : go(v))} aria-current={activo(view, v) ? 'page' : undefined}
              className={cx('relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold', activo(view, v) ? 'text-ink' : 'text-ink3')}>
              {activo(view, v) && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-menta" aria-hidden="true" />}
              <Ic n={i} s={21} sw={activo(view, v) ? 2.2 : 1.7} className={activo(view, v) ? 'text-acento' : ''} />{t}
              {badge[v] > 0 && <span className={cx('absolute left-1/2 top-1.5 ml-2 min-w-[16px] rounded-full px-1 text-[10px] font-bold leading-4 text-onc', v === 'casos' ? 'bg-warn' : 'bg-acento')}>{badge[v]}</span>}
            </button>
          ))}
          <button type="button" onClick={() => setMenu(true)} className={cx('flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold', ['herramientas', 'inicio', 'postular', 'contacto', 'moderacion', 'privacidad'].includes(view) ? 'text-ink' : 'text-ink3')}><Ic n="menu" s={21} />Más</button>
        </div>
      </nav>

      {menu && (
        <div className="fixed inset-0 z-50 bg-[rgba(18,17,12,.5)] lg:hidden" onMouseDown={(e) => { if (e.target === e.currentTarget) setMenu(false); }}>
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col gap-3 overflow-auto rounded-t-[22px] bg-card px-4 pb-6 pt-4" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
            <div className="flex items-center justify-between">{marca()}<button type="button" onClick={() => setMenu(false)} className="rounded-full p-2 text-ink3 hover:bg-soft" aria-label="Cerrar menú"><Ic n="x" /></button></div>
            {navegacion()}
            {navSecundario()}
            <div className="flex flex-wrap gap-2 pt-2">
              {esDocente && <button type="button" onClick={() => { setMenu(false); nuevoCaso(); }} className="flex items-center gap-2 rounded-full bg-acento px-4 py-2 text-[13px] font-semibold text-onc"><Ic n="plus" s={15} />Nuevo caso</button>}
              <button type="button" onClick={() => { setMenu(false); logout(); }} className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-[13px] text-ink2 hover:bg-soft"><Ic n="back" s={15} />Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}

      {perfilOpen && <PerfilModal open={perfilOpen} onClose={() => setPerfilOpen(false)} />}
      {(bienvenida || (perfil && perfil.onboarding !== true && !bienvenidaDespues)) && <Bienvenida editar={bienvenida === 'editar'} cerrar={() => { setBienvenida(null); setBienvenidaDespues(true); }} />}
      <Lightbox foto={foto} onClose={() => setFoto(null)} />
      {toasts}
    </Ctx.Provider>
  );
}

export default AppWrapper;
