// Criterium Red (Dirección creativa): la red profesional sin protocolos.
// Perfiles, feed (publicaciones, preguntas, planes de tratamiento para votar y casos), y casos con revisión y corrección.
// Usa las mismas cuentas, perfiles y feed de Firestore que la edición completa.
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Ctx } from '../ctx.js';
import { Ic, Avatar, useToasts, cx } from '../ui.jsx';
import { MarcaRed } from './marca.jsx';
import { Feed, PerfilPublico, Bienvenida } from '../views/red.jsx';
import { Casos, CasoRed, SubirCaso, Celebracion } from './casos.jsx';
import { PortadaRed } from './portada.jsx';
import { Invitar, Liga, LigaMini } from './crecer.jsx';
import { Hoy, Rondas, Ronda } from './hoy.jsx';
import { Grupos, Grupo } from './grupos.jsx';
import { useUsuario, cerrarSesion, actualizarPerfil } from '../auth.js';
import { useEsDocente, useEsAdmin, useFeedFS, useCasosRed, useColaCasos, guardarPerfilPublicoFS, useSeguimientos, seguirFS, dejarDeSeguirFS, enviarMensajeFS } from '../db.js';
import AuthGate from '../views/auth.jsx';

const vista = (cargar, nombre) => lazy(() => cargar().then((m) => ({ default: m[nombre] })));
const Privacidad = vista(() => import('../views/privacidad.jsx'), 'Privacidad');
const Contacto = vista(() => import('../views/contacto.jsx'), 'Contacto');
const Herramientas = vista(() => import('../views/herramientas.jsx'), 'Herramientas');

const VISTAS = ['feed', 'casos', 'caso', 'subir', 'herramientas', 'liga', 'grupos', 'grupo', 'rondas', 'ronda', 'perfil', 'privacidad', 'contacto'];
// Invita a tu curso: el enlace trae ?i=<uid de quien invita>; se guarda hasta que la persona tenga perfil
try { const g = new URLSearchParams(location.search).get('g'); if (g && /^[\w-]{4,128}$/.test(g)) { sessionStorage.setItem('criterium-grupo', g); history.replaceState(null, '', location.pathname + location.hash); } } catch (e) {}
// El espacio al que lleva el enlace (?g=): se abre después de entrar o crear la cuenta
const GRUPO_INICIAL = (() => { try { return sessionStorage.getItem('criterium-grupo'); } catch (e) { return null; } })();
try { const i = new URLSearchParams(location.search).get('i'); if (i && /^[\w-]{4,128}$/.test(i)) { sessionStorage.setItem('criterium-invita', i); history.replaceState(null, '', location.pathname + location.hash); } } catch (e) {}
const NAV = [['feed', 'home', 'Inicio'], ['casos', 'folder', 'Casos'], ['grupos', 'personas', 'Espacios'], ['rondas', 'video', 'Rondas en vivo'], ['herramientas', 'tool', 'Herramientas'], ['liga', 'edificio', 'Liga']];
const NAV_SECUNDARIO = [['contacto', 'Contáctanos'], ['privacidad', 'Privacidad']];
// En el celular, «Más» suma la liga
const NAV_MAS = [['grupos', 'Espacios por curso'], ['rondas', 'Rondas en vivo'], ['liga', 'Liga de universidades'], ...NAV_SECUNDARIO];
const activo = (view, v) => view === v || (v === 'casos' && (view === 'caso' || view === 'subir')) || (v === 'grupos' && view === 'grupo') || (v === 'rondas' && view === 'ronda');

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
  const { siguiendo } = useSeguimientos(myUid);
  const perfil = perfilAuth;

  const ini = (() => { try { const h = (location.hash || '').slice(1); return ['feed', 'casos', 'herramientas', 'liga', 'grupos', 'rondas', 'privacidad', 'contacto'].includes(h) ? h : 'feed'; } catch (e) { return 'feed'; } })();
  const [view, setView] = useState(GRUPO_INICIAL ? 'grupo' : ini);
  useEffect(() => { try { sessionStorage.removeItem('criterium-grupo'); } catch (e) {} }, []);
  const [perfilUid, setPerfilUid] = useState(null);
  const [casoRedId, setCasoRedId] = useState(null);
  const [corrigiendo, setCorrigiendo] = useState(null);
  const [menu, setMenu] = useState(false);
  const [herrTab, setHerrTab] = useState('perio');
  const [grupoId, setGrupoId] = useState(GRUPO_INICIAL);
  const [rondaId, setRondaId] = useState(null);
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

  const go = (v) => {
    if (!VISTAS.includes(v)) v = 'feed';
    setView(v); setMenu(false);
    try { history.replaceState(null, '', '#' + (['caso', 'subir'].includes(v) ? 'casos' : v === 'grupo' ? 'grupos' : v === 'ronda' ? 'rondas' : v === 'perfil' ? 'feed' : v)); } catch (e) {}
    try { window.scrollTo(0, 0); } catch (e) {}
  };
  const verPerfil = (uid) => { if (!uid) return; setPerfilUid(uid); go('perfil'); };
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

  const badge = { casos: misCasos.filter((c) => c.estado === 'cambios').length + cola.length };
  const ctx = {
    view, go, myUid, usuario, perfil, setPerfil, conPerfil, avisar, logout,
    feed, feedProto: '', setFeedProto: () => {}, abrirProto: () => {},
    feedProc, setFeedProc: (v) => { setFeedProcRaw(v); if (v) go('feed'); },
    perfilUid, verPerfil, siguiendo, toggleSeguir, editarPerfil: () => setBienvenida('editar'),
    herrTab, setHerrTab, grupoId, abrirGrupo: (id) => { setGrupoId(id); go('grupo'); }, rondaId, abrirRonda: (id) => { setRondaId(id); go('ronda'); },
    esDocente, esAdmin, esRevisor, casoRedId, abrirCasoRed, subirCaso, corregirCaso,
    setMensajes: guardarMensaje, mensajes: []
  };

  const pantalla = !feedListo ? <div className="h-64 animate-pulse rounded-[22px] bg-soft" /> : ({
    feed: <Feed saludo={false} arriba={<Hoy />} lado={<><Invitar compacto /><LigaMini /></>} movil={<Invitar />} />, grupos: <Grupos />, grupo: <Grupo key={grupoId} />, rondas: <Rondas />, ronda: <Ronda key={rondaId} />, liga: <Liga />, casos: <Casos />, caso: <CasoRed key={casoRedId} />, subir: <SubirCaso key={corrigiendo ? corrigiendo.id + (corrigiendo.version || 1) : 'nuevo'} caso={corrigiendo} />,
    herramientas: <Herramientas />, perfil: <PerfilPublico key={perfilUid} />, privacidad: <Privacidad />, contacto: <Contacto />
  })[view];

  const navBtn = (v, icon, t) => (
    <button key={v} type="button" onClick={() => go(v)} aria-current={activo(view, v) ? 'page' : undefined}
      className={cx('flex items-center gap-3 rounded-rs px-3 py-2.5 text-left text-[14.5px] transition-colors', activo(view, v) ? 'bg-navact font-semibold text-panelink shadow-[inset_3px_0_0_var(--menta)]' : 'text-navink hover:bg-navline hover:text-panelink')}>
      <Ic n={icon} className={activo(view, v) ? 'text-menta' : ''} /><span className="flex-1">{t}</span>
      {badge[v] > 0 && <span className="rounded-full bg-menta px-1.5 text-[11px] font-bold tabular-nums text-mentaink">{badge[v]}</span>}
    </button>
  );
  const yoActivo = view === 'perfil' && perfilUid === myUid;

  return (
    <Ctx.Provider value={ctx}>
      <div className="fondo min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen flex-col gap-1 overflow-auto bg-nav px-4 pb-5 pt-7 lg:flex">
          <button type="button" onClick={() => go('feed')} className="mb-6 px-3 text-left" aria-label="Criterium, ir al inicio"><MarcaRed size={26} oscuro /></button>
          <nav className="flex flex-col gap-0.5">
            {NAV.map(([v, i, t]) => navBtn(v, i, t))}
            <button type="button" onClick={() => verPerfil(myUid)} aria-current={yoActivo ? 'page' : undefined}
              className={cx('flex items-center gap-3 rounded-rs px-3 py-2.5 text-left text-[14.5px] transition-colors', yoActivo ? 'bg-navact font-semibold text-panelink shadow-[inset_3px_0_0_var(--menta)]' : 'text-navink hover:bg-navline hover:text-panelink')}>
              <Ic n="userCheck" className={yoActivo ? 'text-menta' : ''} />Perfil
            </button>
          </nav>
          <button type="button" onClick={subirCaso} className="mt-5 flex items-center justify-center gap-2 rounded-full bg-menta px-4 py-3 text-[14px] font-semibold text-mentaink"><Ic n="plus" s={16} />Subir un caso</button>
          <div className="mt-auto flex flex-col gap-0.5 px-3 pt-5">
            {NAV_SECUNDARIO.map(([v, t]) => <button key={v} type="button" onClick={() => go(v)} className={cx('py-1 text-left text-[13px]', view === v ? 'text-panelink' : 'text-navink3 hover:text-panelink')}>{t}</button>)}
          </div>
        </aside>

        <div className="min-w-0 pb-[84px] lg:pb-0">
          <div className="sticky z-30 border-b border-cardline bg-[color-mix(in_srgb,var(--bg)_72%,transparent)] backdrop-blur-xl lg:hidden" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
            <div className="flex items-center gap-3 px-4 py-3">
              <button type="button" onClick={() => go('feed')} aria-label="Criterium, ir al inicio"><MarcaRed size={24} /></button>
              <div className="ml-auto">{perfil && <button type="button" onClick={() => verPerfil(myUid)} aria-label="Tu perfil"><Avatar nombre={perfil.nombre} size={32} /></button>}</div>
            </div>
          </div>
          <main className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10"><Suspense fallback={<div className="h-64 animate-pulse rounded-[22px] bg-soft" />}>{pantalla}</Suspense></main>
        </div>
      </div>

      {/* Barra inferior del celular: Inicio, Casos, Subir (al centro), Herramientas, Más. El perfil va en la foto de arriba */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-cardline bg-[color-mix(in_srgb,var(--card)_82%,transparent)] backdrop-blur-xl lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} aria-label="Navegación principal">
        <div className="mx-auto grid max-w-lg grid-cols-5 items-center">
          {[['feed', 'home', 'Inicio'], ['casos', 'folder', 'Casos'], ['subir', 'plus', 'Subir'], ['herramientas', 'tool', 'Herramientas']].map(([v, i, t]) => {
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
          <button type="button" onClick={() => setMenu(true)} className={cx('flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold', ['privacidad', 'contacto', 'liga', 'grupos', 'grupo', 'rondas', 'ronda'].includes(view) ? 'text-ink' : 'text-ink3')}><Ic n="menu" s={21} />Más</button>
        </div>
      </nav>

      {menu && (
        <div className="fixed inset-0 z-50 bg-[rgba(18,17,12,.5)] lg:hidden" onMouseDown={(e) => { if (e.target === e.currentTarget) setMenu(false); }}>
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 rounded-t-[22px] bg-card px-4 pt-4" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
            <div className="mb-2 flex items-center justify-between"><MarcaRed size={24} /><button type="button" onClick={() => setMenu(false)} className="rounded-full p-2 text-ink3 hover:bg-soft" aria-label="Cerrar menú"><Ic n="x" /></button></div>
            {NAV_MAS.map(([v, t]) => <button key={v} type="button" onClick={() => go(v)} className="rounded-rs px-3 py-3 text-left text-[15px] font-semibold text-ink hover:bg-soft">{t}</button>)}
            <button type="button" onClick={() => { setMenu(false); logout(); }} className="rounded-rs px-3 py-3 text-left text-[15px] text-ink2 hover:bg-soft">Cerrar sesión</button>
          </div>
        </div>
      )}

      {(bienvenida || (perfil && perfil.onboarding !== true && !bienvenidaDespues)) && <Bienvenida editar={bienvenida === 'editar'} cerrar={() => { setBienvenida(null); setBienvenidaDespues(true); }} />}
      {celebrar && <Celebracion caso={celebrar} cerrar={cerrarCelebracion} ver={() => { cerrarCelebracion(); go('feed'); }} />}
      {toasts}
    </Ctx.Provider>
  );
}
