import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PROTOS } from './data.js';
import { ESTADOS, chequeoCaso, leer, escribir, uid } from './logic.js';
import { casosIniciales, feedInicial } from './seeds.js';
import { Ctx } from './ctx.js';
import { Ic, Avatar, Lightbox, useToasts, cx } from './ui.jsx';
import { Inicio, Biblioteca, Protocolo } from './views/protocolos.jsx';
import { CasosLista, CasoDetalle, CasoEditor, casoVacio } from './views/casos.jsx';
import { Revision } from './views/revision.jsx';
import { Asistente, Herramientas } from './views/trabajo.jsx';
import { Feed, Postular, Contacto, PerfilModal } from './views/comunidad.jsx';

const VISTAS = ['inicio', 'biblioteca', 'proto', 'casos', 'caso', 'editor', 'revision', 'asistente', 'herramientas', 'feed', 'postular', 'contacto'];
const RUTAS = { inicio: 'Inicio', biblioteca: 'Biblioteca', proto: 'Biblioteca · Protocolo', casos: 'Mis casos', caso: 'Mis casos · Caso', editor: 'Mis casos · Editar',
  revision: 'Revisión', asistente: 'Asistente', herramientas: 'Herramientas', feed: 'Feed', postular: 'Postular a revisor', contacto: 'Contáctanos' };

const NAV_DIARIO = [['inicio', 'home', 'Inicio'], ['casos', 'folder', 'Mis casos'], ['revision', 'stamp', 'Revisión'], ['herramientas', 'tool', 'Herramientas'], ['asistente', 'bot', 'Asistente']];
const NAV_BIBLIO = [['biblioteca', 'book', 'Biblioteca'], ['feed', 'chat', 'Feed'], ['postular', 'userCheck', 'Postular a revisor'], ['contacto', 'mail', 'Contáctanos']];
const activo = (view, v) => view === v || (v === 'biblioteca' && view === 'proto') || (v === 'casos' && (view === 'caso' || view === 'editor'));

function conTiempo(p, ms = 1800) { return Promise.race([p, new Promise((r) => setTimeout(() => r(undefined), ms))]); }

function usePersistente(clave, inicial, alFallar) {
  const [v, setV] = useState(inicial);
  const [listo, setListo] = useState(false);
  useEffect(() => { conTiempo(leer(clave)).then((x) => { if (x !== undefined && x !== null) setV(x); setListo(true); }); }, []);
  useEffect(() => { if (listo) escribir(clave, v).then((ok) => { if (!ok) alFallar(); }); }, [v, listo]);
  return [v, setV, listo];
}

function lsGet(k, d) { try { const x = localStorage.getItem(k); return x ? JSON.parse(x) : d; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

function temaEfectivo() {
  const a = document.documentElement.getAttribute('data-theme');
  if (a === 'dark' || a === 'light') return a;
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { return 'light'; }
}

function App() {
  const [avisar, toasts] = useToasts();
  const falloAviso = useRef(false);
  const alFallar = useCallback(() => { if (!falloAviso.current) { falloAviso.current = true; avisar('Este navegador no deja guardar: los cambios se pierden al cerrar.', 'warn'); } }, []);

  const hashIni = (() => { try { const h = (location.hash || '').slice(1); return VISTAS.includes(h) && !['proto', 'caso', 'editor'].includes(h) ? h : 'inicio'; } catch (e) { return 'inicio'; } })();
  const [view, setView] = useState(hashIni);
  const [protoId, setProtoId] = useState('cementado-pmma');
  const [casoId, setCasoId] = useState(null);
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

  const [casos, setCasos, l1] = usePersistente('casos.v1', casosIniciales, alFallar);
  const [feed, setFeed, l2] = usePersistente('feed.v1', feedInicial, alFallar);
  const [perfil, setPerfil, l3] = usePersistente('perfil.v1', null, alFallar);
  const [postulacion, setPostulacion, l4] = usePersistente('postulacion.v1', null, alFallar);
  const [mensajes, setMensajes, l5] = usePersistente('mensajes.v1', [], alFallar);
  const listo = l1 && l2 && l3 && l4 && l5;

  useEffect(() => {
    const t = lsGet('criterium-tema', null);
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
    setTema(temaEfectivo());
    let mq; try { mq = window.matchMedia('(prefers-color-scheme: dark)'); const f = () => setTema(temaEfectivo()); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); } catch (e) {}
  }, []);
  const toggleTema = () => { const t = temaEfectivo() === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', t); lsSet('criterium-tema', t); setTema(t); };

  const go = (v, extra = {}) => {
    setView(v); setMenu(false); setBuscarMovil(false);
    if (v === 'revision' && !('revisando' in extra)) setRevisando(null);
    if ('filtroCasos' in extra) setFiltroCasos(extra.filtroCasos);
    if ('feedProto' in extra) setFeedProto(extra.feedProto); else if (v === 'feed') setFeedProto('');
    try { history.replaceState(null, '', ['proto', 'caso', 'editor'].includes(v) ? '#' + (v === 'proto' ? 'biblioteca' : 'casos') : '#' + v); } catch (e) {}
    try { window.scrollTo(0, 0); } catch (e) {}
  };
  const abrirProto = (id) => { const p = PROTOS.find((x) => x.id === id); if (!p || !p.abre) return; setProtoId(id); go('proto'); };
  const abrirCaso = (id) => { setDesde(view === 'revision' ? 'revision' : 'casos'); setCasoId(id); go('caso'); };
  const nuevoCaso = (preset) => { setEditando(casoVacio(preset)); go('editor'); };
  const editarCaso = (id) => { const c = casos.find((x) => x.id === id); if (c) { setEditando(c); go('editor'); } };
  const ahora = () => new Date().toISOString();
  const guardarCaso = (c) => setCasos((l) => {
    const existe = l.some((x) => x.id === c.id);
    const n = { ...c, actualizado: ahora(), historial: existe ? c.historial : [...(c.historial || []), { fecha: ahora(), txt: 'Caso creado' }] };
    return existe ? l.map((x) => x.id === c.id ? n : x) : [n, ...l];
  });
  const actualizarCaso = (id, fn) => setCasos((l) => l.map((x) => x.id === id ? { ...fn(x), actualizado: ahora() } : x));
  const enviarCaso = (id, override) => {
    const c = override || casos.find((x) => x.id === id); if (!c) return;
    if (!chequeoCaso(c).puedeEnviar) { avisar('El caso todavía no pasa el chequeo para enviarlo.', 'warn'); return; }
    const re = c.estado === 'cambios';
    setCasos((l) => l.map((x) => x.id === id ? { ...x, estado: 'enviado', actualizado: ahora(), historial: [...(x.historial || []), { fecha: ahora(), txt: re ? 'Reenviado a revisión' : 'Enviado a revisión' }] } : x));
    avisar(re ? 'Caso reenviado a revisión' : 'Caso enviado a revisión');
  };
  const retirarCaso = (id) => { actualizarCaso(id, (x) => ({ ...x, estado: x.revisiones && x.revisiones.length ? 'cambios' : 'borrador', historial: [...x.historial, { fecha: ahora(), txt: 'Retirado de revisión por el autor' }] })); avisar('Caso retirado de revisión'); };
  const eliminarCaso = (id) => { setCasos((l) => l.filter((x) => x.id !== id)); go('casos'); avisar('Caso eliminado'); };
  const duplicarCaso = (id) => {
    const c = casos.find((x) => x.id === id); if (!c) return;
    const n = { ...JSON.parse(JSON.stringify(c)), id: uid(), ejemplo: false, estado: 'borrador', titulo: c.titulo + ' (copia)', revisiones: [], sesiones: [], historial: [], creado: ahora(), autor: { id: 'yo', nombre: 'Tú', rol: '' } };
    n.fotos = n.fotos.map((f) => ({ ...f, postEnvio: false }));
    setEditando(n); go('editor');
  };
  const firmarRevision = (id, rev) => {
    setCasos((l) => l.map((x) => x.id === id ? { ...x, estado: rev.veredicto, actualizado: ahora(), revisiones: [...(x.revisiones || []), rev], historial: [...(x.historial || []), { fecha: ahora(), txt: ESTADOS[rev.veredicto].txt + ' por ' + rev.revisor.nombre }] } : x));
    setRevisando(null);
    avisar(rev.veredicto === 'aprobado' ? 'Caso aprobado y firmado' : rev.veredicto === 'cambios' ? 'Cambios pedidos al autor' : 'Caso denegado', rev.veredicto === 'denegado' ? 'bad' : rev.veredicto === 'cambios' ? 'warn' : 'ok');
  };
  const quitarEjemplos = () => { setCasos((l) => l.filter((x) => !x.ejemplo)); avisar('Ejemplos quitados'); };
  const conPerfil = (cb) => { if (perfil) cb(perfil); else { perfilCallback.current = cb; setPerfilOpen(true); } };

  const mios = casos.filter((c) => c.autor.id === 'yo');
  const badge = { casos: mios.filter((c) => c.estado === 'cambios').length, revision: modoRevisor ? casos.filter((c) => c.estado === 'enviado').length : 0 };

  const ctx = {
    view, go, protoId, abrirProto, casoId, abrirCaso, desde, editando, nuevoCaso, editarCaso, guardarCaso, actualizarCaso, enviarCaso, retirarCaso, eliminarCaso, duplicarCaso,
    revisando, setRevisando, firmarRevision, modoRevisor, setModoRevisor, quitarEjemplos,
    q, setQ, esp, setEsp, filtroCasos, setFiltroCasos, feedProto, setFeedProto, asisTab, setAsisTab, herrTab, setHerrTab,
    casos, setCasos, feed, setFeed, perfil, setPerfil, conPerfil, perfilCallback, postulacion, setPostulacion, mensajes, setMensajes,
    checks, setChecks, avisar, verFoto: setFoto
  };

  const navBtn = (v, icon, t) => (
    <button key={v} type="button" onClick={() => go(v)} aria-current={activo(view, v) ? 'page' : undefined}
      className={cx('flex items-center gap-3 rounded-rs px-3 py-2.5 text-left text-[14px] transition-colors', activo(view, v) ? 'bg-acentosoft font-semibold text-acentodeep' : 'text-ink2 hover:bg-soft hover:text-ink')}>
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
    <button type="button" onClick={() => go('inicio')} className="text-left">
      <div className="text-[23px] font-extrabold leading-none tracking-[-.03em] text-deep">Criter<span className="text-acento">ium</span></div>
    </button>
  );
  const temaBtn = () => (
    <button type="button" onClick={toggleTema} className="flex items-center gap-2.5 rounded-full border border-line bg-card px-3.5 py-2 text-[13px] text-ink2 hover:bg-soft">
      <Ic n={tema === 'dark' ? 'sun' : 'moon'} s={15} />{tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    </button>
  );
  const perfilBtn = (compacto) => perfil ? (
    <button type="button" onClick={() => setPerfilOpen(true)} className="flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-3 text-[13px] font-semibold text-ink2 hover:bg-soft" aria-label="Tu perfil">
      <Avatar nombre={perfil.nombre} size={28} />{!compacto && <span className="max-w-[140px] truncate">{perfil.nombre.split(' ')[0]}</span>}
    </button>
  ) : <button type="button" onClick={() => setPerfilOpen(true)} className="whitespace-nowrap rounded-full bg-acento px-4 py-2 text-[13px] font-semibold text-onc hover:bg-acentodeep">Crear cuenta</button>;

  const vista = !listo ? (
    <div className="flex flex-col gap-4 pt-8"><div className="h-8 w-64 animate-pulse rounded-rs bg-soft" /><div className="h-4 w-96 max-w-full animate-pulse rounded-rs bg-soft" /><div className="h-48 animate-pulse rounded-r bg-soft" /></div>
  ) : ({
    inicio: <Inicio />, biblioteca: <Biblioteca />, proto: <Protocolo />, casos: <CasosLista />, caso: <CasoDetalle />,
    editor: editando ? <CasoEditor key={editando.id} /> : <CasosLista />, revision: <Revision />, asistente: <Asistente />, herramientas: <Herramientas />,
    feed: <Feed key={feedProto} />, postular: <Postular />, contacto: <Contacto />
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
            <p className="m-0 text-[11px] leading-normal text-ink3">Borradores sin revisión de especialista. No deben usarse como estándar de atención.</p>
          </div>
        </aside>

        <div className="min-w-0 pb-[84px] lg:pb-0">
          <div className="sticky z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
            <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="lg:hidden">{marca()}</div>
              <div className="hidden whitespace-nowrap text-[12.5px] text-ink3 lg:block">{RUTAS[view]}</div>
              <form onSubmit={(e) => { e.preventDefault(); if (view !== 'inicio') go('biblioteca'); }} className="ml-2 hidden max-w-[440px] flex-1 items-center gap-2 rounded-full border border-line bg-card px-4 focus-within:border-acento md:flex">
                <Ic n="search" s={15} className="text-ink3" />
                <input id="busqueda-top" type="search" value={q} onChange={(e) => { setQ(e.target.value); if (!['inicio', 'biblioteca'].includes(view) && e.target.value) go('biblioteca'); }} aria-label="Buscar un protocolo" placeholder="Buscar protocolo: cementar, exodoncia del 1.8…" className="min-w-0 flex-1 bg-transparent py-2 text-[13.5px] text-ink outline-none placeholder:text-ink3" />
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
          {[['inicio', 'home', 'Inicio'], ['biblioteca', 'book', 'Biblioteca'], ['casos', 'folder', 'Casos'], ['revision', 'stamp', 'Revisión']].map(([v, i, t]) => (
            <button key={v} type="button" onClick={() => go(v)} aria-current={activo(view, v) ? 'page' : undefined}
              className={cx('relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold', activo(view, v) ? 'text-acentodeep' : 'text-ink3')}>
              <Ic n={i} s={20} />{t}
              {badge[v] > 0 && <span className={cx('absolute left-1/2 top-1.5 ml-2 min-w-[16px] rounded-full px-1 text-[10px] font-bold leading-4 text-onc', v === 'casos' ? 'bg-warn' : 'bg-acento')}>{badge[v]}</span>}
            </button>
          ))}
          <button type="button" onClick={() => setMenu(true)} className={cx('flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold', ['asistente', 'herramientas', 'feed', 'postular', 'contacto'].includes(view) ? 'text-acentodeep' : 'text-ink3')}><Ic n="menu" s={20} />Más</button>
        </div>
      </nav>

      {menu && (
        <div className="fixed inset-0 z-50 bg-[rgba(4,20,26,.55)] lg:hidden" onMouseDown={(e) => { if (e.target === e.currentTarget) setMenu(false); }}>
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col gap-3 overflow-auto rounded-t-[22px] bg-card px-4 pb-6 pt-4" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
            <div className="flex items-center justify-between">{marca()}<button type="button" onClick={() => setMenu(false)} className="rounded-full p-2 text-ink3 hover:bg-soft" aria-label="Cerrar menú"><Ic n="x" /></button></div>
            {navegacion()}
            <div className="flex flex-wrap gap-2 pt-2">{temaBtn()}<button type="button" onClick={() => { setMenu(false); nuevoCaso(); }} className="flex items-center gap-2 rounded-full bg-acento px-4 py-2 text-[13px] font-semibold text-onc"><Ic n="plus" s={15} />Nuevo caso</button></div>
          </div>
        </div>
      )}

      {perfilOpen && <PerfilModal open={perfilOpen} onClose={() => setPerfilOpen(false)} />}
      <Lightbox foto={foto} onClose={() => setFoto(null)} />
      {toasts}
    </Ctx.Provider>
  );
}

export default App;
