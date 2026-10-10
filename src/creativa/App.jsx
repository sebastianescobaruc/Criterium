// Criterium (borrador único, 2026-10-09): la Red como base + los protocolos clínicos de la edición completa.
// Perfiles con currículum, feed, casos con revisión y corrección, chat, Materia, rondas, herramientas y liga, más la
// Biblioteca de protocolos con su modo guiado (los protocolos llegan de Firestore, como en la edición completa).
// Usa las mismas cuentas, perfiles y feed de Firestore que la edición completa.
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Ctx } from '../ctx.js';
import { Ic, Avatar, Lightbox, useToasts, cx } from '../ui.jsx';
import { PROTOS } from '../data.js';
import { suscribirProtocolos } from '../protocolos-remotos.js';
import { usePiloto, useProtocolosRemotos, registrarUso } from '../piloto.js';
import { MarcaRed } from './marca.jsx';
import { IconoRail } from './iconos.jsx';
import { Feed, PerfilPublico, Bienvenida } from '../views/red.jsx';
import { Casos, CasoRed, SubirCaso, Celebracion } from './casos.jsx';
import { PortadaRed } from './portada.jsx';
import { Invitar, Liga, LigaMini } from './crecer.jsx';
import { Hoy, Rondas, Ronda } from './hoy.jsx';
import { Grupos, Grupo } from './grupos.jsx';
const ChatV = lazy(() => import('./chat.jsx').then((m) => ({ default: m.Chat })));
const MateriaV = lazy(() => import('./materia.jsx').then((m) => ({ default: m.Materia })));
const ClaseMateriaV = lazy(() => import('./materia.jsx').then((m) => ({ default: m.ClaseMateria })));
import { useUsuario, cerrarSesion, actualizarPerfil } from '../auth.js';
import { useChats } from '../db.js';
import { useMisClinicas } from '../clinica/db.js';
import { contarNoLeidos } from './chat.jsx';
import { useEsDocente, useEsAdmin, useFeedFS, useCasosRed, useColaCasos, guardarPerfilPublicoFS, useSeguimientos, seguirFS, dejarDeSeguirFS, enviarMensajeFS } from '../db.js';
import AuthGate from '../views/auth.jsx';

const vista = (cargar, nombre) => lazy(() => cargar().then((m) => ({ default: m[nombre] })));
const Privacidad = vista(() => import('../views/privacidad.jsx'), 'Privacidad');
const Contacto = vista(() => import('../views/contacto.jsx'), 'Contacto');
const Herramientas = vista(() => import('../views/herramientas.jsx'), 'Herramientas');
const Biblioteca = vista(() => import('../views/protocolos.jsx'), 'Biblioteca');
const Protocolo = vista(() => import('../views/protocolos.jsx'), 'Protocolo');
const InvestigacionesV = vista(() => import('./investigacion.jsx'), 'Investigaciones');
const ConcursosV = vista(() => import('./concursos.jsx'), 'Concursos');
const AgendaC = vista(() => import('../clinica/clinica.jsx'), 'Agenda');
const PacientesC = vista(() => import('../clinica/clinica.jsx'), 'Pacientes');
const PacienteC = vista(() => import('../clinica/clinica.jsx'), 'Paciente');
const HoyC = vista(() => import('../clinica/hoy.jsx'), 'Hoy');
const SeguimientoC = vista(() => import('../clinica/hoy.jsx'), 'Seguimiento');
const CajaC = vista(() => import('../clinica/caja.jsx'), 'Caja');
const GestionC = vista(() => import('../clinica/gestion.jsx'), 'Gestion');
const AjustesC = vista(() => import('../clinica/ajustes.jsx'), 'Ajustes');
const SinClinicaC = vista(() => import('../clinica/clinica.jsx'), 'SinClinica');
const EspacioC = vista(() => import('../clinica/espacio.jsx'), 'EspacioClinica');

const VISTAS_CLINICA = ['clinica', 'hoy', 'agenda', 'pacientes', 'paciente', 'seguimiento', 'caja', 'gestion', 'ajustes'];
// Universidad › Investigaciones reúne publicaciones, casos, concursos y rondas en vivo (pestañas arriba)
const HUB_INV = [['investigaciones', 'Publicaciones'], ['casos', 'Casos'], ['concursos', 'Concursos'], ['rondas', 'Rondas en vivo']];
const EN_INV = ['investigaciones', 'casos', 'caso', 'subir', 'concursos', 'rondas', 'ronda'];
const VISTAS = ['feed', 'biblioteca', 'proto', 'casos', 'caso', 'subir', 'chat', 'materia', 'clase', 'herramientas', 'investigaciones', 'concursos', ...VISTAS_CLINICA, 'grupos', 'grupo', 'rondas', 'ronda', 'perfil', 'privacidad', 'contacto'];
// Invita a tu curso: el enlace trae ?i=<uid de quien invita>; se guarda hasta que la persona tenga perfil
try { const g = new URLSearchParams(location.search).get('g'); if (g && /^[\w-]{4,128}$/.test(g)) { sessionStorage.setItem('criterium-grupo', g); history.replaceState(null, '', location.pathname + location.hash); } } catch (e) {}
// El espacio al que lleva el enlace (?g=): se abre después de entrar o crear la cuenta
const GRUPO_INICIAL = (() => { try { return sessionStorage.getItem('criterium-grupo'); } catch (e) { return null; } })();
try { const i = new URLSearchParams(location.search).get('i'); if (i && /^[\w-]{4,128}$/.test(i)) { sessionStorage.setItem('criterium-invita', i); history.replaceState(null, '', location.pathname + location.hash); } } catch (e) {}
// Dos áreas: Universidad (aprender, investigar, concursar) y Clínica (gestión clínica, solo para miembros de una clínica)
const NAV_GENERAL = [['feed', 'home', 'Inicio'], ['chat', 'chat', 'Chat']];
const NAV_UNI = [['biblioteca', 'book', 'Protocolos'], ['materia', 'birrete', 'Materia'], ['herramientas', 'tool', 'Herramientas'], ['investigaciones', 'sparkle', 'Investigaciones']];
const NAV_CLINICA = [['hoy', 'home', 'Hoy'], ['agenda', 'calendario', 'Agenda'], ['pacientes', 'personas', 'Pacientes'], ['seguimiento', 'send', 'Seguimiento'], ['caja', 'dinero', 'Caja'], ['gestion', 'grafico', 'Gestión']];
const NAV_AJUSTES = [['ajustes', 'edit', 'Ajustes']];
// Barra lateral de escritorio (íconos de creativa/iconos.jsx)
const RAIL_UNI = [['feed', 'inicio', 'Inicio'], ['biblioteca', 'protocolos', 'Protocolos'], ['materia', 'materia', 'Materia'], ['herramientas', 'herramientas', 'Herramientas'], ['investigaciones', 'investigaciones', 'Investigaciones'], ['chat', 'chat', 'Chat']];
const RAIL_CLINICA = [['hoy', 'hoy', 'Hoy'], ['agenda', 'agenda', 'Agenda'], ['pacientes', 'pacientes', 'Pacientes'], ['seguimiento', 'seguimiento', 'Seguimiento'], ['caja', 'caja', 'Caja'], ['gestion', 'gestion', 'Gestión']];
const NAV_SIN_CLINICA = [['clinica', 'diente', 'Para clínicas']];
const NAV_SECUNDARIO = [['contacto', 'Contáctanos'], ['privacidad', 'Privacidad']];
const activo = (view, v) => view === v || (v === 'investigaciones' && EN_INV.includes(view)) || (v === 'hoy' && view === 'clinica') || (v === 'casos' && (view === 'caso' || view === 'subir')) || (v === 'grupos' && view === 'grupo') || (v === 'rondas' && view === 'ronda') || (v === 'materia' && view === 'clase') || (v === 'biblioteca' && view === 'proto') || (v === 'pacientes' && view === 'paciente');

export default function AppRed() {
  const { usuario, perfil, setPerfil, cargando } = useUsuario();
  return (
    <AuthGate usuario={usuario} cargando={cargando} portada={PortadaRed}>
      <Red usuario={usuario} perfilAuth={perfil} setPerfilAuth={setPerfil} />
    </AuthGate>
  );
}

function Red({ usuario, perfilAuth, setPerfilAuth }) {
  const myUid = usuario && usuario.uid;
  const [avisar, toasts] = useToasts();
  const [esDocente] = useEsDocente(myUid);
  const esAdmin = useEsAdmin(myUid);
  const esRevisor = esDocente || esAdmin;
  const [feed, , feedListo] = useFeedFS();
  const misCasosRaw = useCasosRed(myUid);
  const misCasos = misCasosRaw || [];
  const cola = useColaCasos(esRevisor).filter((c) => c.autorUid !== myUid);
  const { siguiendo, seguidores } = useSeguimientos(myUid);
  const chats = useChats(myUid);
  const perfil = perfilAuth;

  const protoHash = (() => { try { const m = (location.hash || '').match(/^#proto\/([\w-]+)/); return m ? m[1] : null; } catch (e) { return null; } })();
  const perfilHash = (() => { try { const m = (location.hash || '').match(/^#perfil\/([\w-]{6,128})/); return m ? m[1] : null; } catch (e) { return null; } })();
  const ini = (() => { try { if (protoHash) return 'proto'; if (perfilHash) return 'perfil'; const h = (location.hash || '').slice(1); return VISTAS.includes(h) && !['proto', 'caso', 'subir', 'perfil', 'paciente', 'clase', 'grupo', 'ronda'].includes(h) ? h : 'feed'; } catch (e) { return 'feed'; } })();
  const [view, setView] = useState(GRUPO_INICIAL ? 'grupo' : ini);
  useEffect(() => { try { sessionStorage.removeItem('criterium-grupo'); } catch (e) {} }, []);
  const [perfilUid, setPerfilUid] = useState(perfilHash);
  const [casoRedId, setCasoRedId] = useState(null);
  const [corrigiendo, setCorrigiendo] = useState(null);
  const [menu, setMenu] = useState(false);
  const [masAbierto, setMasAbierto] = useState(false);
  const [herrTab, setHerrTab] = useState('perio');
  const [grupoId, setGrupoId] = useState(GRUPO_INICIAL);
  const [rondaId, setRondaId] = useState(null);
  const [materiaSel, setMateriaSel] = useState(null);
  const [chatCon, setChatCon] = useState(null);
  // Clínica: las clínicas donde soy miembro; trabajo en la primera (o la que elegí en este navegador)
  const misClinicas = useMisClinicas(myUid) || [];
  const [clinicaSel, setClinicaSel] = useState(() => { try { return localStorage.getItem('criterium-clinica'); } catch (e) { return null; } });
  const clinica = misClinicas.find((c) => c.id === clinicaSel) || misClinicas[0] || null;
  const rolClinica = clinica && myUid ? (clinica.miembros || {})[myUid] : null;
  const [pacienteId, setPacienteId] = useState(null);
  const [tabClinica, setTabClinica] = useState('');
  // Protocolos (de la edición completa): llegan de Firestore según lo que cada persona puede ver (modo piloto)
  const piloto = usePiloto(myUid);
  const protosListo = useProtocolosRemotos(myUid, piloto);
  const [, setVueltaProtos] = useState(0);
  useEffect(() => suscribirProtocolos(setVueltaProtos), []);
  const [protoId, setProtoId] = useState(protoHash || 'resina-clase-i');
  const [protoTodo, setProtoTodo] = useState(!!protoHash);
  const [protoFoco, setProtoFoco] = useState(null);
  const [protoLibre, setProtoLibre] = useState(false);
  const [q, setQ] = useState('');
  const [esp, setEsp] = useState('todas');
  const [foto, setFoto] = useState(null);
  const lsGet = (k, d) => { try { const x = localStorage.getItem(k); return x ? JSON.parse(x) : d; } catch (e) { return d; } };
  const [checks, setChecksRaw] = useState(() => lsGet('criterium-checks', {}));
  const setChecks = (fn) => setChecksRaw((c) => { const n = typeof fn === 'function' ? fn(c) : fn; try { localStorage.setItem('criterium-checks', JSON.stringify(n)); } catch (e) {} return n; });
  const [feedProc, setFeedProcRaw] = useState('');
  // Celebrar la aprobación: un caso propio publicado en los últimos 7 días que todavía no se celebró en este navegador
  const [celebrar, setCelebrar] = useState(null);
  const celebrados = () => { try { return JSON.parse(localStorage.getItem('criterium-celebrados') || '[]'); } catch (e) { return []; } };
  useEffect(() => {
    if (celebrar || !misCasosRaw) return;
    const vistos = celebrados();
    const c = misCasosRaw.find((x) => x.estado === 'aprobado' && !vistos.includes(x.id) && Date.now() - new Date(x.actualizado || x.fecha).getTime() < 7 * 864e5);
    if (c) setCelebrar(c);
  }, [misCasosRaw]);
  const cerrarCelebracion = () => { try { localStorage.setItem('criterium-celebrados', JSON.stringify([...celebrados(), celebrar.id].slice(-50))); } catch (e) {} setCelebrar(null); };
  const [bienvenida, setBienvenida] = useState(null);
  const [bienvenidaDespues, setBienvenidaDespues] = useState(() => { try { return sessionStorage.getItem('criterium-bienvenida') === 'despues'; } catch (e) { return false; } });

  useEffect(() => { document.documentElement.setAttribute('data-theme', 'light'); }, []);

  const setPerfil = useCallback(async (p) => {
    if (!myUid) return;
    setPerfilAuth(p);
    await actualizarPerfil(myUid, p);
    try { await guardarPerfilPublicoFS(myUid, p); } catch (e) { console.warn('Perfil público pendiente:', e && e.code); }
  }, [myUid]);
  useEffect(() => { if (myUid && perfil && perfil.nombre) guardarPerfilPublicoFS(myUid, perfil).catch(() => {}); }, [myUid, perfil && perfil.nombre]);
  // Quién te invitó: se anota una vez en tu perfil (si llegaste por un enlace de invitación)
  useEffect(() => {
    let i = null; try { i = sessionStorage.getItem('criterium-invita'); } catch (e) {}
    if (!i || !myUid || !perfil || !perfil.nombre) return;
    try { sessionStorage.removeItem('criterium-invita'); } catch (e) {}
    if (i !== myUid && !perfil.invitadoPor) setPerfil({ ...perfil, invitadoPor: i }).catch(() => {});
  }, [myUid, perfil && perfil.nombre]);

  const go = (v, extra = {}) => {
    if (v === 'liga') v = 'concursos';
    if (v === 'confirmaciones') { v = 'seguimiento'; extra = { tab: 'confirmaciones', ...extra }; }
    if (v === 'informes') { v = 'gestion'; extra = { tab: 'informes', ...extra }; }
    setTabClinica(extra.tab || '');
    if (!VISTAS.includes(v)) v = 'feed';
    if (v === 'chat') setChatCon(null);
    setView(v); setMenu(false);
    setProtoFoco(extra.foco || null);
    if (extra.foco) { setQ(''); setEsp('todas'); }
    if (v !== 'proto' && v !== 'perfil') { try { history.replaceState(null, '', '#' + (['caso', 'subir'].includes(v) ? 'casos' : v === 'grupo' ? 'grupos' : v === 'ronda' ? 'rondas' : v === 'clase' ? 'materia' : v)); } catch (e) {} }
    if (!extra.foco) { try { window.scrollTo(0, 0); } catch (e) {} }
  };
  const verPerfil = (uid) => { if (!uid) return; setPerfilUid(uid); go('perfil'); try { history.replaceState(null, '', '#perfil/' + uid); } catch (e) {} };
  const abrirProto = (id, opc = {}) => { const p = PROTOS.find((x) => x.id === id); if (!p || !p.abre) return; registrarUso('protocolo_abierto', id); setProtoId(id); setProtoLibre(!!opc.libre); setProtoTodo(false); go('proto'); try { history.replaceState(null, '', '#proto/' + id); } catch (e) {} };
  const abrirCasoRed = (id) => { setCasoRedId(id); go('caso'); };
  const subirCaso = () => { setCorrigiendo(null); go('subir'); };
  const corregirCaso = (c) => { setCorrigiendo(c); go('subir'); };
  const toggleSeguir = async (uid) => {
    if (!myUid || !uid || uid === myUid) return;
    try { siguiendo.includes(uid) ? await dejarDeSeguirFS(myUid, uid) : await seguirFS(myUid, uid); }
    catch (e) { avisar('No se pudo actualizar. Revisa tu conexión.', 'warn'); }
  };
  const conPerfil = (cb) => { if (perfil && perfil.nombre) cb(perfil); else setBienvenida('editar'); };
  const logout = async () => { try { await cerrarSesion(); } catch (e) { avisar('No se pudo cerrar la sesión.', 'warn'); } };
  const guardarMensaje = async (msg) => { if (!myUid) throw new Error('sin sesión'); await enviarMensajeFS(myUid, msg); };

  const badgeCasos = misCasos.filter((c) => c.estado === 'cambios').length + cola.length;
  const badge = { casos: badgeCasos, investigaciones: badgeCasos, chat: contarNoLeidos(chats, myUid) };
  const ctx = {
    view, go, myUid, usuario, perfil, setPerfil, conPerfil, avisar, logout,
    feed, feedProto: '', setFeedProto: () => {}, abrirProto, protoId, protoLibre, protoTodo, protoFoco, q, setQ, esp, setEsp, checks, setChecks, verFoto: setFoto, piloto,
    casos: [], modoRevisor: false, abrirCaso: () => go('casos'), nuevoCaso: () => { setCorrigiendo(null); go('subir'); },
    feedProc, setFeedProc: (v) => { setFeedProcRaw(v); if (v) go('feed'); },
    perfilUid, verPerfil, siguiendo, toggleSeguir, editarPerfil: () => setBienvenida('editar'),
    herrTab, setHerrTab, grupoId, abrirGrupo: (id) => { setGrupoId(id); go('grupo'); }, rondaId, abrirRonda: (id) => { setRondaId(id); go('ronda'); },
    materiaSel, abrirClase: (ramo, id) => { setMateriaSel([ramo, id]); go('clase'); },
    clinica, rolClinica, misClinicas, tabClinica, irClinica: (v, tab) => go(v, { tab }), elegirClinica: (id) => { setClinicaSel(id); try { localStorage.setItem('criterium-clinica', id); } catch (e) {} }, pacienteId, abrirPaciente: (pid, tab) => { if (!pid) return; setPacienteId(pid); go('paciente', { tab }); },
    seguidores, chats, chatCon, setChatCon, abrirChat: (uid) => { if (!uid || uid === myUid) return; go('chat'); setChatCon(uid); },
    esDocente, esAdmin, esRevisor, casoRedId, abrirCasoRed, subirCaso, corregirCaso,
    setMensajes: guardarMensaje, mensajes: []
  };

  const pantalla = !feedListo ? <div className="h-64 animate-pulse rounded-[22px] bg-soft" /> : ({
    feed: <Feed saludo={false} arriba={<Hoy />} lado={<><Invitar compacto /><LigaMini /></>} movil={<Invitar />} />, grupos: <Grupos />, grupo: <Grupo key={grupoId} />, rondas: <Rondas />, ronda: <Ronda key={rondaId} />, concursos: <ConcursosV />, investigaciones: <InvestigacionesV />, chat: <ChatV />,
    ...(clinica ? { clinica: <HoyC />, hoy: <HoyC />, agenda: <AgendaC />, pacientes: <PacientesC />, paciente: <PacienteC key={pacienteId} />, seguimiento: <SeguimientoC />, caja: <CajaC />, gestion: <GestionC />, ajustes: <AjustesC /> } : Object.fromEntries(VISTAS_CLINICA.map((v) => [v, <SinClinicaC key={v} />]))), materia: <MateriaV />, clase: <ClaseMateriaV key={materiaSel ? materiaSel.join('/') : ''} />, casos: <Casos />, caso: <CasoRed key={casoRedId} />, subir: <SubirCaso key={corrigiendo ? corrigiendo.id + (corrigiendo.version || 1) : 'nuevo'} caso={corrigiendo} />,
    herramientas: <Herramientas />, perfil: <PerfilPublico key={perfilUid} />, privacidad: <Privacidad />, contacto: <Contacto />,
    biblioteca: protosListo ? <Biblioteca /> : <div className="h-64 animate-pulse rounded-[22px] bg-soft" />, proto: protosListo ? <Protocolo key={protoId} /> : <div className="h-64 animate-pulse rounded-[22px] bg-soft" />
  })[view];

  const navBtn = (v, icon, t) => (
    <button key={v} type="button" onClick={() => go(v)} aria-current={activo(view, v) ? 'page' : undefined}
      className={cx('flex items-center gap-3 rounded-rs px-3 py-2.5 text-left text-[14.5px] transition-colors', activo(view, v) ? 'bg-navact font-semibold text-panelink shadow-[inset_3px_0_0_var(--menta)]' : 'text-navink hover:bg-navline hover:text-panelink')}>
      <Ic n={icon} className={activo(view, v) ? 'text-menta' : ''} /><span className="flex-1">{t}</span>
      {badge[v] > 0 && <span className="rounded-full bg-menta px-1.5 text-[11px] font-bold tabular-nums text-mentaink">{badge[v]}</span>}
    </button>
  );
  const yoActivo = view === 'perfil' && perfilUid === myUid;
  const area = VISTAS_CLINICA.includes(view) ? 'clinica' : 'uni';
  const railCls = 'relative flex h-12 w-full items-center gap-4 rounded-[14px] px-2.5 text-left text-[15px] text-navink transition-colors hover:bg-navline hover:text-panelink';
  const railTxt = 'whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100';
  const railBtn = (v, icon, t, onClick) => {
    const on = v === 'subir' ? view === 'subir' : activo(view, v) && !(v === 'investigaciones' && view === 'subir');
    return (
      <button key={v} type="button" onClick={onClick || (() => go(v))} aria-current={on ? 'page' : undefined} aria-label={t} className={cx(railCls, on && 'bg-navact font-bold text-panelink')}>
        <span className={cx('relative flex-none', on && 'text-menta')}><IconoRail n={icon} on={on} fondo="var(--nav)" />
          {badge[v] > 0 && <span className="absolute -right-2 -top-1.5 min-w-[20px] rounded-full bg-[#E5484D] px-1 text-center text-[11px] font-bold leading-5 text-white ring-2 ring-nav">{badge[v]}</span>}
        </span>
        <span className={railTxt}>{t}</span>
      </button>
    );
  };

  // La Clínica es otro espacio de trabajo: cambia toda la pantalla (clinica/espacio.jsx)
  if (clinica && VISTAS_CLINICA.includes(view)) return (
    <Ctx.Provider value={ctx}>
      <Suspense fallback={<div className="min-h-screen bg-[var(--cl-bg)]" />}>
        <EspacioC><Suspense fallback={<div className="h-64 animate-pulse rounded-[10px] bg-[var(--cl-line-2)]" />}>{pantalla}</Suspense></EspacioC>
      </Suspense>
      {toasts}
    </Ctx.Provider>
  );
  return (
    <Ctx.Provider value={ctx}>
      <div className="fondo min-h-screen lg:grid lg:grid-cols-[76px_minmax(0,1fr)]">
        {/* Barra lateral angosta con íconos propios; al acercar el mouse se despliega con los nombres. El ícono de abajo cambia de área */}
        <aside className="group/rail sticky top-0 z-40 hidden h-screen lg:block" onMouseLeave={() => setMasAbierto(false)}>
          <div className="absolute inset-y-0 left-0 flex w-[76px] flex-col overflow-hidden bg-nav px-3 pb-4 pt-6 transition-[width,box-shadow] duration-200 ease-out group-hover/rail:w-[248px] group-hover/rail:shadow-[8px_0_32px_rgba(15,37,48,.28)] group-focus-within/rail:w-[248px]">
            <button type="button" onClick={() => go('feed')} className="mb-7 flex h-11 items-center gap-3 px-2.5" aria-label="Criterium, ir al inicio">
              <span className="whitespace-nowrap [&>span>span]:opacity-0 [&>span>span]:transition-opacity [&>span>span]:duration-150 group-hover/rail:[&>span>span]:opacity-100 group-focus-within/rail:[&>span>span]:opacity-100"><MarcaRed size={28} oscuro /></span>
            </button>
            <nav className="flex flex-1 flex-col gap-1" aria-label={area === 'clinica' ? 'Clínica' : 'Universidad'}>
              {(area === 'clinica' ? (clinica ? [...RAIL_CLINICA, ...(rolClinica === 'admin' ? [['ajustes', 'ajustes', 'Ajustes']] : []), ['chat', 'chat', 'Chat']] : [['clinica', 'clinica', 'Para clínicas'], ['chat', 'chat', 'Chat']]) : RAIL_UNI).map(([v, i, t]) => railBtn(v, i, t))}
              {area !== 'clinica' && railBtn('subir', 'subir', 'Subir un caso', subirCaso)}
              <button type="button" onClick={() => verPerfil(myUid)} aria-current={yoActivo ? 'page' : undefined} className={cx(railCls, yoActivo && 'bg-navact font-bold text-panelink')}>
                <span className={cx('grid h-[26px] w-[26px] flex-none place-items-center rounded-full', yoActivo && 'ring-2 ring-menta ring-offset-2 ring-offset-nav')}>{perfil ? <Avatar nombre={perfil.nombre} size={26} /> : <IconoRail n="pacientes" />}</span>
                <span className={railTxt}>Perfil</span>
              </button>
            </nav>
            <div className="relative flex flex-col gap-1">
              {masAbierto && (
                <div className="absolute bottom-full left-0 mb-2 flex w-[224px] flex-col rounded-[18px] bg-card p-2 shadow-[0_12px_40px_rgba(15,37,48,.18)]">
                  {NAV_SECUNDARIO.map(([v, t]) => <button key={v} type="button" onClick={() => { setMasAbierto(false); go(v); }} className="rounded-[12px] px-3 py-2.5 text-left text-[14px] text-ink hover:bg-soft">{t}</button>)}
                  <div className="my-1 h-px bg-line2" />
                  <button type="button" onClick={() => { setMasAbierto(false); logout(); }} className="rounded-[12px] px-3 py-2.5 text-left text-[14px] text-ink hover:bg-soft">Cerrar sesión</button>
                </div>
              )}
              <button type="button" onClick={() => setMasAbierto((x) => !x)} aria-expanded={masAbierto} className={cx(railCls, masAbierto && 'font-bold text-panelink')}><IconoRail n="mas" on={masAbierto} /><span className={railTxt}>Más</span></button>
              <button type="button" onClick={() => go(area === 'clinica' ? 'feed' : 'hoy')} className={railCls} aria-label={area === 'clinica' ? 'Cambiar a Universidad' : 'Cambiar a Clínica'}>
                <IconoRail n="areas" />
                <span className={railTxt}>{area === 'clinica' ? 'Ir a Universidad' : 'Ir a Clínica'}</span>
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 pb-[84px] lg:pb-0">
          <div className="sticky z-30 border-b border-cardline bg-[color-mix(in_srgb,var(--bg)_72%,transparent)] backdrop-blur-xl lg:hidden" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
            <div className="flex items-center gap-3 px-4 py-3">
              <button type="button" onClick={() => go('feed')} aria-label="Criterium, ir al inicio"><MarcaRed size={24} /></button>
              <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={() => go('chat')} aria-label={badge.chat ? `Chat, ${badge.chat} sin leer` : 'Chat'} className={cx('relative grid h-9 w-9 place-items-center rounded-full', view === 'chat' ? 'bg-deep text-onc' : 'text-ink hover:bg-soft')}>
                  <Ic n="chat" s={21} />
                  {badge.chat > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-acento px-1 text-center text-[10.5px] font-bold leading-[18px] text-onc ring-2 ring-card">{badge.chat}</span>}
                </button>
                {perfil && <button type="button" onClick={() => verPerfil(myUid)} aria-label="Tu perfil"><Avatar nombre={perfil.nombre} size={32} /></button>}
              </div>
            </div>
          </div>
          <main className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10"><Suspense fallback={<div className="h-64 animate-pulse rounded-[22px] bg-soft" />}>
            {HUB_INV.some(([v]) => v === view) && (
              <nav className="scroll-x -mx-4 mb-5 flex gap-1 overflow-x-auto px-4" aria-label="Investigaciones">
                {HUB_INV.map(([v, t]) => <button key={v} type="button" onClick={() => go(v)} aria-current={view === v ? 'page' : undefined} className={cx('relative flex-none rounded-full px-4 py-2 text-[13.5px] font-semibold', view === v ? 'bg-deep text-onc' : 'text-ink2 hover:bg-soft')}>{t}{badge[v] > 0 && v !== 'investigaciones' && <span className="ml-1.5 rounded-full bg-menta px-1.5 text-[11px] font-bold text-mentaink">{badge[v]}</span>}</button>)}
              </nav>
            )}
            {pantalla}
          </Suspense></main>
        </div>
      </div>

      {/* Barra inferior del celular: Inicio, Casos, Subir (al centro), Herramientas, Más. El perfil va en la foto de arriba */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-cardline bg-[color-mix(in_srgb,var(--card)_82%,transparent)] backdrop-blur-xl lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} aria-label="Navegación principal">
        <div className="mx-auto grid max-w-lg grid-cols-5 items-center">
          {[['feed', 'home', 'Inicio'], ['biblioteca', 'book', 'Protocolos'], ['subir', 'plus', 'Subir'], clinica ? ['hoy', 'calendario', 'Clínica'] : ['investigaciones', 'sparkle', 'Investigar']].map(([v, i, t]) => {
            const on = v === 'perfil' ? yoActivo : v === 'subir' ? view === 'subir' : activo(view, v) && view !== 'subir';
            if (v === 'subir') return (
              <button key={v} type="button" onClick={subirCaso} className="flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-semibold text-ink3" aria-label="Subir un caso">
                <span className={cx('grid h-10 w-10 place-items-center rounded-full', on ? 'bg-deep text-menta' : 'bg-acento text-onc')}><Ic n="plus" s={20} sw={2.2} /></span>
              </button>
            );
            return (
              <button key={v} type="button" onClick={() => (v === 'perfil' ? verPerfil(myUid) : go(v))} aria-current={on ? 'page' : undefined}
                className={cx('relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold', on ? 'text-ink' : 'text-ink3')}>
                {on && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-menta" aria-hidden="true" />}
                <Ic n={i} s={21} sw={on ? 2.2 : 1.7} className={on ? 'text-acento' : ''} />{t}
                {badge[v] > 0 && <span className="absolute left-1/2 top-1.5 ml-2 min-w-[16px] rounded-full bg-acento px-1 text-[10px] font-bold leading-4 text-onc">{badge[v]}</span>}
              </button>
            );
          })}
          <button type="button" onClick={() => setMenu(true)} className={cx('flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold', ['privacidad', 'contacto', 'concursos', 'investigaciones', 'materia', 'clase', 'herramientas', 'rondas', 'ronda', 'chat', ...VISTAS_CLINICA].includes(view) && !(clinica && view === 'hoy') ? 'text-ink' : 'text-ink3')}><Ic n="menu" s={21} />Más</button>
        </div>
      </nav>

      {menu && (
        <div className="fixed inset-0 z-50 bg-[rgba(18,17,12,.5)] lg:hidden" onMouseDown={(e) => { if (e.target === e.currentTarget) setMenu(false); }}>
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 rounded-t-[22px] bg-card px-4 pt-4" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
            <div className="mb-2 flex items-center justify-between"><MarcaRed size={24} /><button type="button" onClick={() => setMenu(false)} className="rounded-full p-2 text-ink3 hover:bg-soft" aria-label="Cerrar menú"><Ic n="x" /></button></div>
            <div className="flex max-h-[62vh] flex-col overflow-y-auto">
              {[['', NAV_GENERAL], ['Universidad', NAV_UNI], ['Clínica', clinica ? [...NAV_CLINICA, ...(rolClinica === 'admin' ? NAV_AJUSTES : [])] : NAV_SIN_CLINICA], ['', NAV_SECUNDARIO.map(([v, t]) => [v, null, t])]].map(([g, l], k) => (
                <div key={k} className="flex flex-col">
                  {g && <p className="rotulo m-0 px-3 pb-1 pt-3">{g}</p>}
                  {l.map(([v, i, t]) => <button key={v} type="button" onClick={() => go(v)} className={cx('flex items-center gap-3 rounded-rs px-3 py-2.5 text-left text-[15px] font-semibold hover:bg-soft', activo(view, v) ? 'text-acento' : 'text-ink', !i && '!py-2 text-[14px] font-normal text-ink2')}>{i && <Ic n={i} s={19} />}{t}</button>)}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => { setMenu(false); logout(); }} className="rounded-rs px-3 py-3 text-left text-[15px] text-ink2 hover:bg-soft">Cerrar sesión</button>
          </div>
        </div>
      )}

      {(bienvenida || (perfil && perfil.onboarding !== true && !bienvenidaDespues)) && <Bienvenida editar={bienvenida === 'editar'} cerrar={() => { setBienvenida(null); setBienvenidaDespues(true); }} />}
      {celebrar && <Celebracion caso={celebrar} cerrar={cerrarCelebracion} ver={() => { cerrarCelebracion(); go('feed'); }} />}
      <Lightbox foto={foto} onClose={() => setFoto(null)} />
      {toasts}
    </Ctx.Provider>
  );
}
