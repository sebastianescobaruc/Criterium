import React, { useState, useRef } from 'react';
import { AREAS, protoPorId, protosAbiertos, hace, fecha, uid } from '../logic.js';
import { useApp } from '../ctx.js';
import { PROTOS } from '../data.js';
import { TuDia } from './protocolos.jsx';
import { MapaInicio } from './mapa.jsx';
import { toggleLikeFS, responderPostFS, publicarPostFS, usePerfilPublico, usePostsDe, useSeguimientos } from '../db.js';
import { Ic, Pill, Btn, Field, Seg, Aviso, PageHead, Avatar, Modal, Vacio, Logo, inputCls, inputErr, cx } from '../ui.jsx';

const ROLES = ['Estudiante de pregrado', 'Cirujano dentista general', 'Especialista', 'Docente de clínica'];
const esEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((s || '').trim());

/* ═════════ PERFIL ═════════ */
export function PerfilModal({ open, onClose }) {
  const { perfil, setPerfil, avisar, perfilCallback, usuario, logout } = useApp();
  const [f, setF] = useState(() => ({ nombre: '', rol: ROLES[0], institucion: '', area: '', descripcion: '', ...(perfil || {}) }));
  const [intento, setIntento] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const errNombre = f.nombre.trim().length < 3 ? 'Escribe tu nombre y apellido.' : '';
  const guardar = async (e) => {
    e && e.preventDefault(); setIntento(true);
    if (errNombre) return;
    setGuardando(true);
    const p = { ...f, nombre: f.nombre.trim(), institucion: (f.institucion || '').trim(), descripcion: (f.descripcion || '').trim().slice(0, 300) };
    try {
      await setPerfil(p);
      avisar('Perfil actualizado');
      onClose(); perfilCallback.current && perfilCallback.current(p); perfilCallback.current = null;
    } catch (err) {
      avisar('No se pudo guardar el perfil.', 'warn');
    }
    setGuardando(false);
  };
  return (
    <Modal open={open} onClose={() => { perfilCallback.current = null; onClose(); }} title="Tu perfil">
      <form onSubmit={guardar} className="flex flex-col gap-4 p-5">
        {usuario?.email && <p className="m-0 text-[13px] text-ink3">Sesión con <b className="text-ink2">{usuario.email}</b></p>}
        <Field label="Nombre y apellido" id="perfil-nombre" error={intento ? errNombre : ''}>
          <input id="perfil-nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Nombre y apellido" className={cx(inputCls, intento && errNombre && inputErr)} />
        </Field>
        <Field label="Qué eres" id="perfil-rol" hint="Especialistas y docentes pueden entrar al modo revisor.">
          <select id="perfil-rol" value={f.rol} onChange={(e) => setF({ ...f, rol: e.target.value })} className={inputCls}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
        </Field>
        <Field label="Facultad o lugar de trabajo" id="perfil-inst"><input id="perfil-inst" value={f.institucion} onChange={(e) => setF({ ...f, institucion: e.target.value })} placeholder="Facultad o lugar de trabajo" className={inputCls} /></Field>
        <Field label="Área (opcional)" id="perfil-area">
          <select id="perfil-area" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} className={inputCls}><option value="">Sin área</option>{AREAS.map((a) => <option key={a}>{a}</option>)}</select>
        </Field>
        <Field label="Descripción (opcional)" id="perfil-desc" hint={(f.descripcion || '').length + ' de 300 · Se ve en tu perfil público. No pongas datos de pacientes.'}>
          <textarea id="perfil-desc" rows={3} maxLength={300} value={f.descripcion || ''} onChange={(e) => setF({ ...f, descripcion: e.target.value })} placeholder="Qué estudias o en qué trabajas, qué te interesa de la clínica…" className={cx(inputCls, 'resize-y')} />
        </Field>
        <div className="flex flex-wrap gap-2 pt-1">
          <Btn v="primary" type="submit" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</Btn>
          <Btn onClick={onClose}>Cancelar</Btn>
        </div>
        {logout && (
          <button type="button" onClick={() => { onClose(); logout(); }} className="mt-1 text-left text-[13px] font-semibold text-bad hover:underline">
            Cerrar sesión
          </button>
        )}
      </form>
    </Modal>
  );
}

/* ═════════ FEED (inicio) ═════════ */
/* ═════════ GUÍA: qué se puede hacer en Criterium ═════════ */
const PASOS_GUIA = [
  { n: 1, icon: 'book', t: 'Aprende', d: 'Busca un protocolo. Cada paso dice qué hacer, cuándo está listo y con qué evidencia.', cta: 'Ver la biblioteca', ir: (a) => a.go('biblioteca') },
  { n: 2, icon: 'folder', t: 'Registra', d: 'Sube tu caso sin datos del paciente, con fotos y cómo seguiste cada paso.', cta: 'Nuevo caso', ir: (a) => a.nuevoCaso() },
  { n: 3, icon: 'stamp', t: 'Valida', d: 'Un revisor del área lo puntúa y lo aprueba, pide cambios o lo deniega. Siempre justificado.', cta: 'Ver revisión', ir: (a) => a.go('revision') },
  { n: 4, icon: 'chat', t: 'Conversa', d: 'Pregunta lo que te pasó en el box, responde a otros y sigue a tus colegas.', cta: 'Escribir', ir: () => { const el = document.getElementById('feed-txt'); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.focus({ preventScroll: true }); } } }
];
// Para estudiantes: sin registrar ni validar casos (eso es del portal docente)
const PASOS_GUIA_EST = [
  PASOS_GUIA[0],
  { n: 2, icon: 'check', t: 'Practica', d: 'Abre un protocolo y síguelo paso a paso, con la bandeja y la voz si quieres.', cta: 'Elegir protocolo', ir: (a) => a.go('biblioteca') },
  { n: 3, icon: 'red', t: 'Explora', d: 'Mira en el mapa cómo se conectan los protocolos: técnicas, materiales y derivaciones.', cta: 'Ver el mapa', ir: (a) => a.go('mapa') },
  PASOS_GUIA[3]
];
const leerGuia = () => { try { return localStorage.getItem('criterium-guia') === 'oculta'; } catch (e) { return false; } };
const guardarGuia = (oculta) => { try { oculta ? localStorage.setItem('criterium-guia', 'oculta') : localStorage.removeItem('criterium-guia'); } catch (e) {} };


function Guia() {
  const app = useApp();
  const [oculta, setOculta] = useState(leerGuia);
  const cambiar = (v) => { setOculta(v); guardarGuia(v); };
  if (oculta) return null;
  
  return (
    <section aria-labelledby="guia-titulo" className="panel mb-2 p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="m-0 mb-1 text-[11.5px] font-bold uppercase tracking-[.13em] text-menta">Qué puedes hacer en Criterium</p>
          <h2 id="guia-titulo" className="m-0 text-[19px] font-bold leading-snug text-panelink">{app.esDocente ? 'Cuatro pasos: aprende, registra, valida y conversa.' : 'Cuatro pasos: aprende, practica, explora y conversa.'}</h2>
        </div>
        <button type="button" onClick={() => cambiar(true)} className="flex-none rounded-full bg-panel2 p-1.5 text-panelink2 hover:text-panelink" aria-label="Ocultar la guía"><Ic n="x" s={14} /></button>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {(app.esDocente ? PASOS_GUIA : PASOS_GUIA_EST).map((p, k) => (
          <button key={p.n || k} type="button" onClick={() => p.ir(app)} className="flex flex-col items-start gap-1 rounded-rs bg-panel2 p-3.5 text-left transition-[transform,background-color] hover:-translate-y-0.5">
            <b className="text-[26px] font-extrabold leading-none tabular-nums text-menta">{k + 1}</b>
            <span className="mt-1.5 text-[13.5px] font-bold text-panelink">{p.t}</span>
            <span className="text-[11.5px] leading-snug text-panelink2">{p.d}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
function TarjetaMini({ p }) {
  const { abrirProto } = useApp();
  return (
    <button type="button" onClick={() => abrirProto(p.id)} disabled={!p.abre} title={p.t + (p.abre ? '' : ' · planificado')}
      className={cx('flex w-[120px] flex-none flex-col gap-2 rounded-rs bg-card p-3 text-left shadow-sh transition-shadow sm:w-[140px]', p.abre ? 'hover:shadow-shlg' : 'cursor-default opacity-55')}>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-soft text-[15px] font-semibold text-deep">{p.t.charAt(0)}</span>
      <span className="line-clamp-2 min-h-[30px] text-[12px] font-semibold leading-tight text-ink">{p.t}</span>
      <span className="truncate text-[11px] text-ink3">{p.abre ? p.esp : 'Planificado'}</span>
    </button>
  );
}

function Historias() {
  const { nuevoCaso, esDocente } = useApp();
  const lista = [...PROTOS].sort((a, b) => (b.abre ? 1 : 0) - (a.abre ? 1 : 0)).slice(0, 10);
  
  return (
    <section aria-label="Protocolos recientes" className="-mx-4 sm:mx-0">
      <div className="flex items-center justify-between px-4 sm:px-0 mb-3">
        <h2 className="text-[14px] font-bold text-ink">Protocolos recientes</h2>
      </div>
      <div className="scroll-x flex items-start gap-3.5 overflow-x-auto px-4 pb-4 sm:px-0">
        {esDocente && <button type="button" onClick={() => nuevoCaso()} className="flex w-[120px] sm:w-[140px] flex-none flex-col gap-2 rounded-rs bg-acentosoft p-3 shadow-sh transition-shadow hover:shadow-shlg text-left border border-acento/20">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-acento text-onc">
            <Ic n="plus" s={16} />
          </div>
          <span className="text-[12px] font-semibold leading-tight text-acentodeep min-h-[30px]">Registrar nuevo caso</span>
        </button>}
        {lista.map((p) => (
          <TarjetaMini key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}
function Post({ p }) {
  const { conPerfil, perfil, abrirProto, myUid, verPerfil, siguiendo, toggleSeguir, avisar } = useApp();
  const [resp, setResp] = useState(false);
  const [txt, setTxt] = useState('');
  const [err, setErr] = useState('');
  const proto = p.protocoloId && protoPorId(p.protocoloId);
  const autorUid = p.autorUid || (p.autor && p.autor.uid) || '';
  const likedBy = p.likedBy || [];
  const meGusta = likedBy.includes(myUid);
  const likes = Math.max(p.likes || 0, likedBy.length);
  const like = async () => {
    try { await toggleLikeFS(p.id, myUid, meGusta); } catch (e) { avisar('No se pudo guardar tu me gusta.', 'warn'); }
  };
  const responder = (e) => {
    e.preventDefault();
    if (txt.trim().length < 5) { setErr('Escribe una respuesta un poco más larga.'); return; }
    conPerfil(async (pf) => {
      try {
        await responderPostFS(p.id, { id: uid(), autor: { uid: myUid, nombre: pf.nombre, rol: pf.rol, verificado: false }, fecha: new Date().toISOString(), txt: txt.trim() });
        setTxt(''); setResp(false); setErr('');
      } catch (er) { setErr('No se pudo publicar la respuesta. Revisa tu conexión.'); }
    });
  };
  const nombreBtn = (uidX, contenido, cls = '') => uidX
    ? <button type="button" onClick={() => verPerfil(uidX)} className={cx('text-left hover:underline', cls)}>{contenido}</button>
    : <span className={cls}>{contenido}</span>;
  const sinResp = !p.respuestas.length && !p.autor.verificado;
  return (
    <article className="-mx-4 border-y border-cardline bg-card shadow-sh sm:mx-0 sm:rounded-r sm:border-x">
      <header className="flex items-center gap-3 px-4 pb-2 pt-3.5">
        <span className="rounded-full p-[2px]" style={{ background: p.autor.verificado ? 'var(--ring)' : 'transparent' }}>
          <span className="block rounded-full bg-card p-[2px]">{autorUid ? <button type="button" onClick={() => verPerfil(autorUid)} aria-label={'Ver el perfil de ' + p.autor.nombre} className="block rounded-full"><Avatar nombre={p.autor.nombre} verificado={p.autor.verificado} size={36} /></button> : <Avatar nombre={p.autor.nombre} verificado={p.autor.verificado} size={36} />}</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[14px] font-semibold leading-tight">
            {nombreBtn(autorUid, p.autor.nombre, 'truncate')}
            {p.autor.verificado && <span className="grid h-4 w-4 flex-none place-items-center rounded-full bg-acento text-onc" title="Revisor verificado"><Ic n="check" s={10} sw={3} /></span>}
          </div>
          <p className="m-0 truncate text-[12.5px] text-ink3">{p.autor.rol} · {hace(p.fecha)}</p>
        </div>
        {autorUid && autorUid !== myUid && !siguiendo.includes(autorUid) && (
          <button type="button" onClick={() => toggleSeguir(autorUid)} className="flex-none text-[13px] font-semibold text-acento hover:text-acentodeep">Seguir</button>
        )}
      </header>
      {(proto || sinResp || p.ejemplo) && (
        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-1">
          {proto && (
            <button type="button" onClick={() => abrirProto(proto.id)} className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-acentosoft px-2.5 py-1 text-[12px] font-semibold text-acentodeep hover:brightness-95">
              <Ic n="book" s={13} /><span className="truncate">{proto.t}</span>
            </button>
          )}
          {sinResp && <Pill tono="warn">sin responder</Pill>}{p.ejemplo && <Pill>ejemplo</Pill>}
        </div>
      )}
      <p className="m-0 whitespace-pre-line px-4 pb-1 pt-1.5 text-[15.5px] leading-[1.55] text-ink">{p.txt}</p>
      <div className="flex items-center gap-1 px-2.5 pt-1">
        <button type="button" onClick={like} aria-pressed={meGusta} aria-label="Me pasó lo mismo" className={cx('rounded-full p-2 transition-transform active:scale-90', meGusta ? 'text-bad' : 'text-ink hover:text-ink2')}>
          <Ic n="heart" s={23} className={meGusta ? 'fill-current' : ''} />
        </button>
        <button type="button" onClick={() => setResp(!resp)} aria-label="Responder" className="rounded-full p-2 text-ink hover:text-ink2"><Ic n="chat" s={22} /></button>
        {proto && <button type="button" onClick={() => abrirProto(proto.id)} aria-label="Abrir el protocolo" className="ml-auto rounded-full p-2 text-ink hover:text-ink2"><Ic n="book" s={22} /></button>}
      </div>
      <div className="px-4 pb-3.5">
        {likes > 0 && <p className="m-0 text-[13.5px] font-semibold">{likes === 1 ? 'A 1 persona le pasó lo mismo' : 'A ' + likes + ' personas les pasó lo mismo'}</p>}
        {p.respuestas.length > 0 && (
          <div className="mt-2.5 flex flex-col gap-2.5">
            {p.respuestas.map((r) => (
              <div key={r.id} className={cx(r.autor.verificado && 'rounded-rs border-l-[3px] border-ok bg-oksoft py-2.5 pl-3 pr-3')}>
                <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
                  {nombreBtn(r.autor.uid, r.autor.nombre, 'font-semibold')}
                  {r.autor.verificado && <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-ok text-onc"><Ic n="check" s={9} sw={3} /></span>}
                  <span className={cx('text-[12px]', r.autor.verificado ? 'font-medium text-ok' : 'text-ink3')}>{r.autor.rol}</span>
                  <span className="text-[12px] text-ink3">· {hace(r.fecha)}</span>
                </div>
                <p className="m-0 mt-0.5 font-serif text-[15px] leading-relaxed text-ink2">{r.txt}</p>
              </div>
            ))}
          </div>
        )}
        {!resp && (
          <button type="button" onClick={() => setResp(true)} className="mt-2 text-[13px] text-ink3 hover:text-ink2">
            {p.respuestas.length ? 'Responder…' : 'Sé el primero en responder…'}
          </button>
        )}
        {resp && (
          <form onSubmit={responder} className="mt-3 flex flex-col gap-2">
            <textarea value={txt} autoFocus onChange={(e) => { setTxt(e.target.value); setErr(''); }} rows={2} placeholder={perfil ? 'Tu respuesta. Si te apoyas en evidencia, cítala.' : 'Para responder necesitas un perfil.'} aria-label="Tu respuesta" className={cx(inputCls, 'resize-y !text-[14px]', err && inputErr)} />
            {err && <span className="text-[12px] text-bad">{err}</span>}
            <div className="flex gap-2"><Btn sm v="primary" type="submit" onClick={responder}>Responder</Btn><Btn sm onClick={() => setResp(false)}>Cancelar</Btn></div>
          </form>
        )}
      </div>
    </article>
  );
}


export function Feed() {
  const { feed, conPerfil, feedProto, setFeedProto, go, postulacion, avisar, perfil, myUid, siguiendo, verPerfil, q, setQ } = useApp();
  const [txt, setTxt] = useState('');
  const [proto, setProto] = useState(feedProto || '');
  const [filtro, setFiltro] = useState('Todo');
  const [err, setErr] = useState('');
  const publicar = () => {
    if (txt.trim().length < 10) { setErr('Cuenta un poco más: qué pasó, en qué paso y qué dudas tienes.'); return; }
    conPerfil(async (pf) => {
      try {
        await publicarPostFS({ autorUid: myUid, autor: { uid: myUid, nombre: pf.nombre, rol: pf.rol, verificado: false }, protocoloId: proto, fecha: new Date().toISOString(), txt: txt.trim(), likes: 0, likedBy: [], respuestas: [] });
        setTxt(''); setErr(''); setFiltro('Todo'); avisar('Publicado');
      } catch (e) { setErr('No se pudo publicar. Revisa tu conexión.'); }
    });
  };
  const sinResp = (p) => !p.respuestas.length && !p.autor.verificado;
  const deRev = (p) => p.autor.verificado || p.respuestas.some((r) => r.autor.verificado);
  const deSeguidos = (p) => siguiendo.includes(p.autorUid || (p.autor && p.autor.uid));
  const lista = feed.filter((p) => (filtro === 'Todo' || (filtro === 'Siguiendo' ? deSeguidos(p) : filtro === 'Sin responder' ? sinResp(p) : deRev(p))) && (!feedProto || p.protocoloId === feedProto))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const abiertas = feed.filter(sinResp).length;
  const fp = feedProto && protoPorId(feedProto);

  /* Columna derecha: se pliega hacia el borde y deja una pestaña "Tu día" */
  const [derecha, setDerechaRaw] = useState(() => { try { return localStorage.getItem('criterium-derecha') !== 'oculta'; } catch (e) { return true; } });
  const btnOcultar = useRef(null);
  const btnPestana = useRef(null);
  const setDerecha = (v) => {
    setDerechaRaw(v);
    try { localStorage.setItem('criterium-derecha', v ? 'visible' : 'oculta'); } catch (e) {}
    setTimeout(() => (v ? btnOcultar : btnPestana).current?.focus({ preventScroll: true }), v ? 500 : 800);
  };

  return (
    <>
    <div className="feed-layout" data-derecha={derecha ? 'visible' : 'oculta'}>
      <div className="feed-centro mx-auto flex w-full min-w-0 flex-col gap-6">
        <h1 className="sr-only">Inicio</h1>

        <MapaInicio />

        <Guia />
        
        {/* Buscador Principal */}
        <form onSubmit={(e) => { e.preventDefault(); go('biblioteca'); }} className="flex w-full items-center gap-2.5 rounded-full border border-line bg-card py-2 pl-5 pr-2 shadow-sh focus-within:border-acento">
          <Ic n="search" s={18} className="text-acento" sw={1.9} />
          <input id="busqueda-inicio" type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="¿Qué vas a hacer hoy?"
            placeholder="Buscar protocolo: cementar, exodoncia del 1.8…" className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-ink outline-none placeholder:text-ink3" />
          <button type="submit" className="hidden sm:block flex-none rounded-full bg-acento px-5 py-2.5 text-[14px] font-semibold text-onc hover:bg-acentodeep">Buscar</button>
        </form>

        {/* Continuar donde quedaste (TuDia) solo en movil/tablet, en desktop esta en el sidebar */}
        <div className="xl:hidden">
          <TuDia />
        </div>

        <Historias />
        
        <div className="-mx-4 border-y border-cardline bg-card shadow-sh px-4 py-3.5 sm:mx-0 sm:rounded-r sm:border-x">
          <div className="flex gap-3">
            <Avatar nombre={(perfil && perfil.nombre) || '?'} size={36} />
            <textarea id="feed-txt" value={txt} onChange={(e) => { setTxt(e.target.value); setErr(''); }} rows={2} placeholder="¿Qué te pasó en el box?" aria-label="Escribe tu pregunta o aporte" className="min-w-0 flex-1 resize-y bg-transparent pt-1.5 text-[15px] leading-normal text-ink outline-none placeholder:text-ink3" />
          </div>
          {err && <p className="m-0 mb-1 ml-12 text-[12px] text-bad">{err}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2.5 pl-12">
            <label className={cx('relative inline-flex min-w-0 max-w-full flex-1 items-center rounded-full transition-colors sm:max-w-[320px] sm:flex-none', proto ? 'bg-acentosoft text-acentodeep' : 'bg-input text-ink2 ring-1 ring-inset ring-cardline hover:text-ink')}>
              <Ic n="book" s={14} className="pointer-events-none absolute left-3" />
              <select id="feed-proto" value={proto} onChange={(e) => setProto(e.target.value)} aria-label="Sobre qué protocolo" className="w-full min-w-0 truncate rounded-full border-0 bg-transparent py-1.5 pl-8 text-[13px] font-semibold text-current outline-none focus-visible:ring-2 focus-visible:ring-acento">
                <option value="">Agregar protocolo</option>{protosAbiertos().map((p) => <option key={p.id} value={p.id}>{p.t}</option>)}
              </select>
            </label>
            <Btn v="primary" sm className="ml-auto" onClick={publicar}>Publicar</Btn>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Seg size="sm" valor={filtro} onChange={setFiltro} opciones={['Todo', 'Siguiendo', 'Sin responder', 'De revisores']} />
            {fp && <button type="button" onClick={() => setFeedProto('')} className="inline-flex items-center gap-1.5 rounded-full bg-acentosoft px-3 py-1 text-[12px] font-semibold text-acentodeep">Sobre: {fp.t}<Ic n="x" s={13} /></button>}
          </div>
          
          {abiertas > 0 && filtro !== 'De revisores' && <p className="m-0 text-[13px] leading-normal text-ink3"><b className="text-ink2">{abiertas === 1 ? 'Una pregunta sigue' : abiertas + ' preguntas siguen'} sin respuesta.</b> Cada plaza de revisor que se llena es un área menos con preguntas huérfanas.</p>}
          
          <div className="flex flex-col gap-5">
            {lista.length === 0 ? (
              <div className="text-center py-8 rounded-rs border border-dashed border-line bg-[color-mix(in_srgb,var(--soft)_40%,transparent)]">
                <p className="m-0 text-[14px] text-ink3">
                  {filtro === 'Siguiendo' ? (siguiendo.length ? 'Las personas que sigues todavía no publican.' : 'Todavía no sigues a nadie. Toca el nombre de alguien para ver su perfil y seguirlo.') 
                  : 'No hay publicaciones con este filtro. Sé el primero en escribir algo.'}
                </p>
              </div>
            ) : (
              lista.map((p) => <Post key={p.id} p={p} />)
            )}
          </div>
        </div>
      </div>
      
      <aside className="feed-derecha hidden w-[300px] flex-col gap-4 xl:sticky xl:top-[76px] xl:flex" aria-hidden={!derecha}>
        <div className="flex items-center gap-3" style={{ '--i': 0 }}>
          {perfil ? (
            <button type="button" onClick={() => verPerfil(myUid)} className="flex min-w-0 flex-1 items-center gap-3 rounded-r px-1 text-left hover:bg-soft">
              <Avatar nombre={perfil.nombre} size={44} />
              <div className="min-w-0"><p className="m-0 truncate text-[14px] font-semibold">{perfil.nombre}</p><p className="m-0 truncate text-[12.5px] text-ink3">{perfil.rol}</p></div>
            </button>
          ) : <div className="flex-1" />}
          <button ref={btnOcultar} type="button" onClick={() => setDerecha(false)} tabIndex={derecha ? 0 : -1} className="flex-none rounded-full p-2 text-ink3 hover:bg-soft hover:text-ink" aria-label="Ocultar columna Tu día" title="Ocultar y leer a pantalla completa"><Ic n="panelder" s={18} /></button>
        </div>
        <div style={{ '--i': 1 }}><TuDia /></div>
        <div className="flex flex-col gap-2 px-1" style={{ '--i': 2 }}>
          <div className="flex items-baseline justify-between"><h2 className="m-0 text-[13px] font-semibold text-ink3">Áreas sin revisor</h2><button type="button" onClick={() => go('postular')} className="text-[12.5px] font-semibold text-acentodeep hover:underline">Postular</button></div>
          {AREAS.map((a) => <div key={a} className="flex items-center justify-between gap-2 text-[13px]"><span className="text-ink2">{a}</span><span className="text-[11.5px] font-semibold text-ink3">{postulacion && postulacion.area === a ? 'Postulaste' : 'Libre'}</span></div>)}
        </div>
        <p className="m-0 px-1 text-[11px] leading-normal text-ink3" style={{ '--i': 3 }}>Borradores sin revisión de especialista. No deben usarse como estándar de atención.</p>
      </aside>
    </div>

    <button ref={btnPestana} type="button" onClick={() => setDerecha(true)} tabIndex={derecha ? -1 : 0} aria-hidden={derecha}
      className="pestana-dia" data-visible={derecha ? 'no' : 'si'} aria-label="Mostrar columna Tu día" title="Mostrar Tu día">
      <span className="pestana-dia-borde" />
      <Ic n="clock" s={16} />
      <span className="[writing-mode:vertical-rl] rotate-180 text-[12.5px] font-bold tracking-[.06em]">Tu día</span>
    </button>
    </>
  );
}
export function PerfilPublico() {
  const { perfilUid, myUid, siguiendo, toggleSeguir, editarPerfil, go } = useApp();
  const pf = usePerfilPublico(perfilUid);
  const posts = usePostsDe(perfilUid);
  const { siguiendo: suyos, seguidores } = useSeguimientos(perfilUid);
  const yo = perfilUid === myUid;
  const loSigo = siguiendo.includes(perfilUid);
  const volver = <button type="button" onClick={() => go('feed')} className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] text-ink2 hover:bg-soft"><Ic n="back" s={14} />Inicio</button>;
  if (pf === undefined) return <div className="mx-auto max-w-[600px]">{volver}<div className="h-40 animate-pulse rounded-r bg-soft" /></div>;
  if (pf === null) return <div className="mx-auto max-w-[600px]">{volver}<Vacio icon="userCheck" titulo="Este perfil no está disponible">La persona todavía no entra con la versión nueva de Criterium.</Vacio></div>;
  const stat = (n, t) => <div className="flex flex-col items-center"><b className="text-[17px] font-semibold tabular-nums text-ink">{n}</b><span className="text-[12px] text-ink3">{t}</span></div>;
  return (
    <div className="mx-auto flex max-w-[600px] flex-col gap-5">
      <div>{volver}</div>
      <section className="-mx-4 border-y border-cardline bg-card shadow-sh px-4 py-5 sm:mx-0 sm:rounded-r sm:border-x sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <Avatar nombre={pf.nombre} size={76} />
          <div className="grid flex-1 grid-cols-3 gap-2">
            {stat(posts.length, posts.length === 1 ? 'publicación' : 'publicaciones')}
            {stat(seguidores.length, seguidores.length === 1 ? 'seguidor' : 'seguidores')}
            {stat(suyos.length, 'siguiendo')}
          </div>
        </div>
        <h1 className="m-0 mt-4 text-[24px]">{pf.nombre}</h1>
        <p className="m-0 mt-0.5 text-[13.5px] text-ink3">{[pf.rol, pf.area, pf.institucion].filter(Boolean).join(' · ')}</p>
        {pf.descripcion ? <p className="m-0 mt-3 whitespace-pre-line font-serif text-[15.5px] leading-relaxed text-ink">{pf.descripcion}</p>
          : <p className="m-0 mt-3 text-[13.5px] text-ink3">{yo ? 'Todavía no tienes descripción. Cuéntale a los demás qué estudias o en qué trabajas.' : 'Sin descripción.'}</p>}
        <div className="mt-4 flex gap-2">
          {yo ? <Btn icon="edit" className="flex-1" onClick={editarPerfil}>Editar perfil</Btn>
            : <Btn v={loSigo ? 'outline' : 'primary'} className="flex-1" onClick={() => toggleSeguir(perfilUid)}>{loSigo ? 'Siguiendo' : 'Seguir'}</Btn>}
        </div>
      </section>
      <h2 className="m-0 text-[13px] font-semibold text-ink3">Publicaciones</h2>
      {posts.length === 0 ? <p className="m-0 text-[13.5px] text-ink3">{yo ? 'Todavía no publicas nada. Escribe tu primera pregunta desde el inicio.' : 'Todavía no publica nada.'}</p>
        : posts.map((p) => <Post key={p.id} p={p} />)}
    </div>
  );
}

/* ═════════ POSTULAR ═════════ */
export function Postular() {
  const { postulacion, setPostulacion, avisar, perfil } = useApp();
  const vacio = { nombre: (perfil && perfil.nombre) || '', area: '', titulo: '', institucion: (perfil && perfil.institucion) || '', anos: '', correo: '', nota: '' };
  const [f, setF] = useState(vacio);
  const [editando, setEditando] = useState(!postulacion);
  const [intento, setIntento] = useState(false);
  const [retirar, setRetirar] = useState(false);
  const e = {
    nombre: f.nombre.trim().length < 3 ? 'Escribe tu nombre y apellido.' : '',
    area: !f.area ? 'Elige un área.' : '',
    titulo: f.titulo.trim().length < 6 ? 'Escribe tu título y especialidad.' : '',
    institucion: f.institucion.trim().length < 3 ? 'Indica tu institución.' : '',
    anos: !f.anos ? 'Elige un rango.' : (f.anos === 'Menos de 5 años' ? 'El criterio de inclusión es cinco años de ejercicio o docencia. Con menos, todavía no calificas.' : ''),
    correo: !esEmail(f.correo) ? 'Escribe un correo válido.' : ''
  };
  const enviar = (ev) => {
    ev.preventDefault(); setIntento(true);
    if (Object.values(e).some(Boolean)) { avisar('Revisa los campos marcados.', 'warn'); return; }
    setPostulacion({ ...f, fecha: new Date().toISOString(), estado: 'enviada' }); setEditando(false); setIntento(false);
    avisar('Postulación guardada');
  };
  const campo = (k, label, input, hint) => <Field label={label} id={'post-' + k} error={intento ? e[k] : ''} hint={hint}>{input}</Field>;
  const ic = (k) => cx(inputCls, intento && e[k] && inputErr);
  return (
    <div className="flex flex-col gap-7">
      <PageHead eyebrow="Criterium · panel de revisores" titulo="Postular a revisor">Ocho áreas. El revisor puntúa los casos clínicos que registran los usuarios y los aprueba, pide cambios o los deniega. La validación de los protocolos es otra cosa: la hace un juicio de expertos, al menos 5 especialistas por protocolo.</PageHead>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {AREAS.map((a) => {
          const mia = postulacion && postulacion.area === a;
          return (
            <div key={a} className={cx('flex items-center gap-2.5 rounded-rs border bg-card px-4 py-3', mia ? 'border-acento' : 'border-line')}>
              <span className={cx('h-2.5 w-2.5 flex-none rounded-full border-[1.5px] border-acento', mia && 'bg-acento')} />
              <span className="flex-1 text-[13.5px]">{a}</span>
              <span className="text-[11px] font-semibold text-acentodeep">{mia ? 'Tu postulación' : 'Libre'}</span>
            </div>
          );
        })}
      </div>
      <div className="grid gap-3.5 md:grid-cols-2">
        {[['Lo que se te pide', [['De 30 a 60 minutos por ronda.', 'Dos rondas, con fechas avisadas con anticipación.'], ['Puntuar cada paso', 'en pertinencia, claridad y suficiencia de la evidencia, y comentar lo que esté mal.'], ['Respuestas anónimas entre revisores', ', para que el resultado no lo determine la jerarquía.']]],
          ['Lo que recibes', [['Tu nombre como revisor', 'en cada protocolo que firmes.'], ['Coautoría en el artículo de consenso', 'si cumples los criterios ICMJE.'], ['El material disponible para tus estudiantes', ', con la evidencia trazada.']]]].map(([t, l]) => (
          <div key={t} className="tarjeta p-5 sm:p-6">
            <h3 className="m-0 mb-3 text-[17px] font-bold text-deep">{t}</h3>
            <ul className="m-0 flex flex-col gap-2 pl-5 font-serif text-[14.5px] leading-relaxed text-ink2">{l.map(([b, r]) => <li key={b}><b className="font-sans text-[13.5px] text-ink">{b}</b> {r}</li>)}</ul>
          </div>
        ))}
      </div>

      {!editando && postulacion ? (
        <div className="max-w-[760px] rounded-r border-2 border-acento bg-card p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2"><Pill tono="acento"><Ic n="check" s={13} sw={2.4} />Postulación enviada</Pill><span className="text-[12.5px] text-ink3">{fecha(postulacion.fecha)}</span></div>
          <h2 className="m-0 mb-1 text-[20px] font-extrabold text-deep">{postulacion.nombre} · {postulacion.area}</h2>
          <p className="m-0 text-[13.5px] leading-relaxed text-ink2">{postulacion.titulo} · {postulacion.institucion} · {postulacion.anos} · {postulacion.correo}</p>
          {postulacion.nota && <p className="m-0 mt-3 font-serif text-[14.5px] leading-relaxed text-ink">{postulacion.nota}</p>}
          <p className="m-0 mt-4 text-[12px] leading-relaxed text-ink3">Queda guardada en este navegador. El sitio todavía no tiene servidor, así que el equipo no la recibe de forma automática: cuando lo tenga, se enviará.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn icon="edit" onClick={() => { setF({ ...vacio, ...postulacion }); setEditando(true); }}>Editar</Btn>
            {retirar ? <><Btn v="danger" onClick={() => { setPostulacion(null); setRetirar(false); setF(vacio); setEditando(true); avisar('Postulación retirada'); }}>Sí, retirar</Btn><Btn onClick={() => setRetirar(false)}>Cancelar</Btn></>
              : <Btn v="dangerOutline" onClick={() => setRetirar(true)}>Retirar postulación</Btn>}
          </div>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="max-w-[960px] tarjeta p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            {campo('nombre', 'Nombre y apellido', <input id="post-nombre" value={f.nombre} onChange={(x) => setF({ ...f, nombre: x.target.value })} placeholder="Dra. Rosa Sepúlveda" className={ic('nombre')} />)}
            {campo('area', 'Área a la que postulas', <select id="post-area" value={f.area} onChange={(x) => setF({ ...f, area: x.target.value })} className={ic('area')}><option value="">Elige un área</option>{AREAS.map((a) => <option key={a}>{a}</option>)}</select>)}
            {campo('titulo', 'Título y especialidad', <input id="post-titulo" value={f.titulo} onChange={(x) => setF({ ...f, titulo: x.target.value })} placeholder="Cirujano dentista, especialista en…" className={ic('titulo')} />, 'Tal como aparece en tu certificado. Lo verificamos antes de publicar tu nombre.')}
            {campo('institucion', 'Institución', <input id="post-institucion" value={f.institucion} onChange={(x) => setF({ ...f, institucion: x.target.value })} placeholder="Facultad o lugar de trabajo" className={ic('institucion')} />)}
            {campo('anos', 'Años de ejercicio o de docencia clínica', <select id="post-anos" value={f.anos} onChange={(x) => setF({ ...f, anos: x.target.value })} className={ic('anos')}><option value="">Elige un rango</option>{['Menos de 5 años', 'Entre 5 y 10 años', 'Entre 10 y 20 años', 'Más de 20 años'].map((a) => <option key={a}>{a}</option>)}</select>, 'El criterio de inclusión es cinco años en al menos una de las dos.')}
            {campo('correo', 'Correo institucional', <input id="post-correo" type="email" value={f.correo} onChange={(x) => setF({ ...f, correo: x.target.value })} placeholder="nombre@universidad.cl" className={ic('correo')} />)}
            <Field label="Algo que quieras decirnos (opcional)" id="post-nota" className="sm:col-span-2">
              <textarea id="post-nota" rows={3} value={f.nota} onChange={(x) => setF({ ...f, nota: x.target.value })} placeholder="Si ya viste algo en un protocolo que te parece mal, este es un buen lugar para decirlo." className={cx(inputCls, 'resize-y')} />
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Btn v="primary" type="submit" onClick={enviar}>Enviar postulación</Btn>
            {postulacion && <Btn onClick={() => setEditando(false)}>Cancelar</Btn>}
            <span className="text-[12px] text-ink3">Te respondemos en un plazo de una semana. No hay compromiso hasta que aceptes la primera ronda.</span>
          </div>
        </form>
      )}
    </div>
  );
}

/* ═════════ CONTACTO ═════════ */
// Datos públicos del equipo. Sin nombre ni marca de la universidad.
const EQUIPO = [
  { nombre: 'Jorge Baeza Santibáñez', titulo: 'Co-Founder' },
  { nombre: 'Sebastián Escobar Prieto', titulo: 'Co-Founder' }
];
const CONTACTO = {
  correo: '',                 // correo de Criterium: pendiente (mientras esté vacío no se muestra)
  whatsapp: '+56998215701'
};
const telefonoVisible = (t) => t.replace(/^\+56(9)(\d{4})(\d{4})$/, '+56 $1 $2 $3');

export function Contacto() {
  const { setMensajes, avisar, perfil, usuario } = useApp();
  const MOTIVOS_C = ['Encontré un error en un protocolo', 'Quiero proponer un protocolo', 'Consulta sobre el proyecto', 'Soy docente y quiero saber más', 'Otro'];
  const [f, setF] = useState({ motivo: MOTIVOS_C[0], nombre: (perfil && perfil.nombre) || '', correo: (usuario && usuario.email) || '', msg: '' });
  const [intento, setIntento] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(null);
  const e = { nombre: f.nombre.trim().length < 2 ? 'Escribe tu nombre.' : '', correo: !esEmail(f.correo) ? 'Escribe un correo válido para poder responderte.' : '', msg: f.msg.trim().length < 15 ? 'Cuéntanos un poco más (al menos 15 caracteres).' : '' };
  const enviar = async (ev) => {
    ev.preventDefault(); setIntento(true);
    if (Object.values(e).some(Boolean) || enviando) return;
    const m = { id: uid(), motivo: f.motivo, nombre: f.nombre.trim(), correo: f.correo.trim(), msg: f.msg.trim() };
    setEnviando(true);
    try { await setMensajes(m); setListo(m); setIntento(false); setF({ ...f, msg: '' }); }
    catch (err) { avisar('No se pudo enviar el mensaje. Revisa tu conexión e inténtalo de nuevo.', 'warn'); }
    setEnviando(false);
  };
  const ic = (k) => cx(inputCls, intento && e[k] && inputErr);
  const wa = CONTACTO.whatsapp.replace(/\D/g, '');
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,.9fr)]">
      <div className="flex min-w-0 flex-col gap-5">
        <header className="max-w-[62ch]">
          <h1 className="m-0 mb-2 text-[30px] font-extrabold tracking-[-.03em] text-deep sm:text-[36px]">Contáctanos</h1>
          <p className="m-0 font-serif text-[17px] leading-relaxed text-ink2">Criterium lo hacen dos estudiantes de Odontología. Si algo está mal en un protocolo, falta uno que necesitas o quieres sumarte, escríbenos.</p>
        </header>
        <Aviso><b>Este sitio está en desarrollo.</b> Los protocolos son borradores sin revisión de especialista y no deben usarse como estándar de atención.</Aviso>
        {listo ? (
          <div className="flex flex-col gap-3 rounded-r border-2 border-acento bg-card p-5 sm:p-6">
            <Pill tono="acento" className="self-start"><Ic n="check" s={13} sw={2.4} />Mensaje enviado</Pill>
            <p className="m-0 text-[14px] leading-relaxed text-ink2">Gracias, {listo.nombre.split(' ')[0]}. Tu mensaje le llegó al equipo y te respondemos a <b className="text-ink">{listo.correo}</b> dentro de una semana.</p>
            <Btn v="ghost" className="self-start" onClick={() => setListo(null)}>Escribir otro</Btn>
          </div>
        ) : (
          <form onSubmit={enviar} noValidate className="grid gap-4 tarjeta p-5 sm:p-6">
            <Field label="Motivo" id="c-motivo"><select id="c-motivo" value={f.motivo} onChange={(x) => setF({ ...f, motivo: x.target.value })} className={inputCls}>{MOTIVOS_C.map((m) => <option key={m}>{m}</option>)}</select></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" id="c-nombre" error={intento ? e.nombre : ''}><input id="c-nombre" value={f.nombre} onChange={(x) => setF({ ...f, nombre: x.target.value })} placeholder="Tu nombre" className={ic('nombre')} /></Field>
              <Field label="Correo" id="c-correo" error={intento ? e.correo : ''}><input id="c-correo" type="email" value={f.correo} onChange={(x) => setF({ ...f, correo: x.target.value })} placeholder="tucorreo@ejemplo.cl" className={ic('correo')} /></Field>
            </div>
            <Field label="Mensaje" id="c-msg" error={intento ? e.msg : ''}><textarea id="c-msg" rows={5} value={f.msg} onChange={(x) => setF({ ...f, msg: x.target.value })} placeholder="Cuéntanos qué pasa. Si es un error en un protocolo, di cuál y en qué paso. No escribas datos de pacientes." className={cx(ic('msg'), 'resize-y leading-relaxed')} /></Field>
            <Btn v="primary" type="submit" className="justify-self-start" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar mensaje'}</Btn>
          </form>
        )}
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        <div className="tarjeta p-5">
          <h2 className="rotulo m-0 mb-3">El equipo</h2>
          <div className="flex flex-col">
            {EQUIPO.map((p, k) => (
              <div key={p.nombre} className={cx('grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 py-3', k > 0 && 'border-t border-line2')}>
                <Avatar nombre={p.nombre} size={44} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><b className="text-[15px] text-ink">{p.nombre}</b><Pill tono="acento">{p.titulo}</Pill></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="tarjeta px-5 py-1">
          {CONTACTO.correo && (
            <a href={'mailto:' + CONTACTO.correo} className="grid grid-cols-[20px_minmax(0,1fr)] gap-3 border-b border-line2 py-4 last:border-0">
              <Ic n="mail" s={18} className="text-acento" />
              <div><p className="m-0 mb-0.5 text-[13px] font-semibold">Correo</p><p className="m-0 text-[14px] text-acento [overflow-wrap:anywhere]">{CONTACTO.correo}</p></div>
            </a>
          )}
          {CONTACTO.whatsapp && (
            <a href={'https://wa.me/' + wa} target="_blank" rel="noopener noreferrer" className="grid grid-cols-[20px_minmax(0,1fr)] gap-3 border-b border-line2 py-4 last:border-0">
              <Ic n="chat" s={18} className="text-acento" />
              <div><p className="m-0 mb-0.5 text-[13px] font-semibold">WhatsApp</p><p className="m-0 text-[14px] tabular-nums text-acento">{telefonoVisible(CONTACTO.whatsapp)}</p></div>
            </a>
          )}
          <div className="grid grid-cols-[20px_minmax(0,1fr)] gap-3 border-b border-line2 py-4 last:border-0">
            <Ic n="clock" s={18} className="text-acento" />
            <div><p className="m-0 mb-0.5 text-[13px] font-semibold">Respuesta</p><p className="m-0 text-[13.5px] leading-normal text-ink2">Dentro de una semana. Somos dos y estamos en clínica.</p></div>
          </div>
        </div>
      </aside>
    </div>
  );
}
