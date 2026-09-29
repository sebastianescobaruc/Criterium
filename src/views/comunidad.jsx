import React, { useState, useRef } from 'react';
import { AREAS, protoPorId, protosAbiertos, hace, fecha, uid } from '../logic.js';
import { useApp } from '../ctx.js';
import { PROTOS } from '../data.js';
import { TuDia } from './protocolos.jsx';
import { Ic, Pill, Btn, Field, Seg, Aviso, PageHead, Avatar, Modal, inputCls, inputErr, cx } from '../ui.jsx';

const ROLES = ['Estudiante de pregrado', 'Cirujano dentista general', 'Especialista', 'Docente de clínica'];
const esEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((s || '').trim());

/* ═════════ PERFIL ═════════ */
export function PerfilModal({ open, onClose }) {
  const { perfil, setPerfil, avisar, perfilCallback, usuario, logout } = useApp();
  const [f, setF] = useState(() => perfil || { nombre: '', rol: ROLES[0], institucion: '', area: '' });
  const [intento, setIntento] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const errNombre = f.nombre.trim().length < 3 ? 'Escribe tu nombre y apellido.' : '';
  const guardar = async (e) => {
    e && e.preventDefault(); setIntento(true);
    if (errNombre) return;
    setGuardando(true);
    const p = { ...f, nombre: f.nombre.trim(), institucion: f.institucion.trim() };
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
function Historias() {
  const { abrirProto, nuevoCaso } = useApp();
  const lista = [...PROTOS].sort((a, b) => (b.abre ? 1 : 0) - (a.abre ? 1 : 0));
  const circulo = (contenido, activo) => (
    <span className="block rounded-full p-[2.5px]" style={{ background: activo ? 'var(--ring)' : 'var(--line)' }}>
      <span className="block rounded-full bg-card p-[3px]">
        <span className="grid h-[58px] w-[58px] place-items-center rounded-full bg-soft">{contenido}</span>
      </span>
    </span>
  );
  return (
    <section aria-label="Protocolos" className="-mx-4 sm:mx-0">
      <div className="scroll-x flex items-start gap-3.5 overflow-x-auto px-4 pb-1 sm:px-0">
        <button type="button" onClick={() => nuevoCaso()} className="flex w-[74px] flex-none flex-col items-center gap-1.5">
          {circulo(<Ic n="plus" s={22} className="text-acento" sw={2} />, false)}
          <span className="w-full text-center text-[11px] leading-tight text-ink2">Nuevo caso</span>
        </button>
        {lista.map((p) => (
          <button key={p.id} type="button" onClick={() => abrirProto(p.id)} disabled={!p.abre} title={p.t + (p.abre ? '' : ' · planificado')}
            className={cx('flex w-[74px] flex-none flex-col items-center gap-1.5', !p.abre && 'cursor-default opacity-55')}>
            {circulo(<span className="font-display text-[26px] italic leading-none text-deep">{p.t.charAt(0)}</span>, p.abre)}
            <span className="line-clamp-2 w-full text-center text-[11px] leading-tight text-ink2">{p.t}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Post({ p }) {
  const { setFeed, conPerfil, perfil, abrirProto } = useApp();
  const [resp, setResp] = useState(false);
  const [txt, setTxt] = useState('');
  const [err, setErr] = useState('');
  const proto = p.protocoloId && protoPorId(p.protocoloId);
  const like = () => setFeed((l) => l.map((x) => x.id === p.id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x));
  const responder = (e) => {
    e.preventDefault();
    if (txt.trim().length < 5) { setErr('Escribe una respuesta un poco más larga.'); return; }
    conPerfil((pf) => {
      setFeed((l) => l.map((x) => x.id === p.id ? { ...x, respuestas: [...x.respuestas, { id: uid(), autor: { nombre: pf.nombre, rol: pf.rol, verificado: false }, fecha: new Date().toISOString(), txt: txt.trim() }] } : x));
      setTxt(''); setResp(false); setErr('');
    });
  };
  const sinResp = !p.respuestas.length && !p.autor.verificado;
  return (
    <article className="-mx-4 border-y border-line bg-card sm:mx-0 sm:rounded-r sm:border-x">
      <header className="flex items-center gap-3 px-4 pb-2 pt-3.5">
        <span className="rounded-full p-[2px]" style={{ background: p.autor.verificado ? 'var(--ring)' : 'transparent' }}>
          <span className="block rounded-full bg-card p-[2px]"><Avatar nombre={p.autor.nombre} verificado={p.autor.verificado} size={36} /></span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[14px] font-semibold leading-tight">
            <span className="truncate">{p.autor.nombre}</span>
            {p.autor.verificado && <span className="grid h-4 w-4 flex-none place-items-center rounded-full bg-acento text-onc" title="Revisor verificado"><Ic n="check" s={10} sw={3} /></span>}
          </div>
          <p className="m-0 truncate text-[12.5px] text-ink3">{p.autor.rol} · {hace(p.fecha)}</p>
        </div>
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
        <button type="button" onClick={like} aria-pressed={!!p.liked} aria-label="Me pasó lo mismo" className={cx('rounded-full p-2 transition-transform active:scale-90', p.liked ? 'text-bad' : 'text-ink hover:text-ink2')}>
          <Ic n="heart" s={23} className={p.liked ? 'fill-current' : ''} />
        </button>
        <button type="button" onClick={() => setResp(!resp)} aria-label="Responder" className="rounded-full p-2 text-ink hover:text-ink2"><Ic n="chat" s={22} /></button>
        {proto && <button type="button" onClick={() => abrirProto(proto.id)} aria-label="Abrir el protocolo" className="ml-auto rounded-full p-2 text-ink hover:text-ink2"><Ic n="book" s={22} /></button>}
      </div>
      <div className="px-4 pb-3.5">
        <p className="m-0 text-[13.5px] font-semibold">{p.likes === 1 ? 'A 1 persona le pasó lo mismo' : 'A ' + p.likes + ' personas les pasó lo mismo'}</p>
        {p.respuestas.length > 0 && (
          <div className="mt-2.5 flex flex-col gap-2.5">
            {p.respuestas.map((r) => (
              <div key={r.id} className={cx(r.autor.verificado && 'rounded-rs border-l-[3px] border-ok bg-oksoft py-2.5 pl-3 pr-3')}>
                <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
                  <b className="font-semibold">{r.autor.nombre}</b>
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
  const { feed, setFeed, conPerfil, feedProto, setFeedProto, go, postulacion, avisar, perfil } = useApp();
  const [txt, setTxt] = useState('');
  const [proto, setProto] = useState(feedProto || '');
  const [filtro, setFiltro] = useState('Todo');
  const [err, setErr] = useState('');
  const publicar = () => {
    if (txt.trim().length < 10) { setErr('Cuenta un poco más: qué pasó, en qué paso y qué dudas tienes.'); return; }
    conPerfil((pf) => {
      setFeed((l) => [{ id: uid(), autor: { nombre: pf.nombre, rol: pf.rol, verificado: false }, protocoloId: proto, fecha: new Date().toISOString(), txt: txt.trim(), likes: 0, liked: false, respuestas: [] }, ...l]);
      setTxt(''); setErr(''); setFiltro('Todo'); avisar('Publicado');
    });
  };
  const sinResp = (p) => !p.respuestas.length && !p.autor.verificado;
  const deRev = (p) => p.autor.verificado || p.respuestas.some((r) => r.autor.verificado);
  const lista = feed.filter((p) => (filtro === 'Todo' || (filtro === 'Sin responder' ? sinResp(p) : deRev(p))) && (!feedProto || p.protocoloId === feedProto))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const abiertas = feed.filter(sinResp).length;
  const fp = feedProto && protoPorId(feedProto);
  return (
    <div className="mx-auto grid max-w-[980px] grid-cols-[minmax(0,1fr)] items-start gap-10 xl:grid-cols-[minmax(0,600px)_300px] xl:justify-between">
      <div className="mx-auto flex w-full min-w-0 max-w-[600px] flex-col gap-4">
        <h1 className="sr-only">Inicio</h1>
        <Historias />
        <div className="-mx-4 border-y border-line bg-card px-4 py-3.5 sm:mx-0 sm:rounded-r sm:border-x">
          <div className="flex gap-3">
            <Avatar nombre={(perfil && perfil.nombre) || '?'} size={36} />
            <textarea id="feed-txt" value={txt} onChange={(e) => { setTxt(e.target.value); setErr(''); }} rows={2} placeholder="¿Qué te pasó en el box?" aria-label="Escribe tu pregunta o aporte" className="min-w-0 flex-1 resize-y bg-transparent pt-1.5 text-[15px] leading-normal text-ink outline-none placeholder:text-ink3" />
          </div>
          {err && <p className="m-0 mb-1 ml-12 text-[12px] text-bad">{err}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2.5 pl-12">
            <select id="feed-proto" value={proto} onChange={(e) => setProto(e.target.value)} aria-label="Sobre qué protocolo" className={cx(inputCls, '!w-auto min-w-0 max-w-full flex-1 !rounded-full !py-1.5 !text-[13px] sm:flex-none')}>
              <option value="">Sin protocolo asociado</option>{protosAbiertos().map((p) => <option key={p.id} value={p.id}>{p.t}</option>)}
            </select>
            <Btn v="primary" sm className="ml-auto" onClick={publicar}>Publicar</Btn>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Seg size="sm" valor={filtro} onChange={setFiltro} opciones={['Todo', 'Sin responder', 'De revisores']} />
          {fp && <button type="button" onClick={() => setFeedProto('')} className="inline-flex items-center gap-1.5 rounded-full bg-acentosoft px-3 py-1 text-[12px] font-semibold text-acentodeep">Sobre: {fp.t}<Ic n="x" s={13} /></button>}
        </div>
        {abiertas > 0 && filtro !== 'De revisores' && <p className="m-0 text-[13px] leading-normal text-ink3"><b className="text-ink2">{abiertas === 1 ? 'Una pregunta sigue' : abiertas + ' preguntas siguen'} sin respuesta.</b> Cada plaza de revisor que se llena es un área menos con preguntas huérfanas.</p>}
        {lista.length === 0 ? <p className="m-0 text-[13.5px] text-ink3">No hay publicaciones con este filtro.</p> : lista.map((p) => <Post key={p.id} p={p} />)}
      </div>
      <aside className="hidden flex-col gap-4 xl:sticky xl:top-[76px] xl:flex">
        {perfil && (
          <div className="flex items-center gap-3 px-1">
            <Avatar nombre={perfil.nombre} size={44} />
            <div className="min-w-0"><p className="m-0 truncate text-[14px] font-semibold">{perfil.nombre}</p><p className="m-0 truncate text-[12.5px] text-ink3">{perfil.rol}</p></div>
          </div>
        )}
        <TuDia />
        <div className="flex flex-col gap-2 px-1">
          <div className="flex items-baseline justify-between"><h2 className="m-0 text-[13px] font-semibold text-ink3">Áreas sin revisor</h2><button type="button" onClick={() => go('postular')} className="text-[12.5px] font-semibold text-acentodeep hover:underline">Postular</button></div>
          {AREAS.map((a) => <div key={a} className="flex items-center justify-between gap-2 text-[13px]"><span className="text-ink2">{a}</span><span className="text-[11.5px] font-semibold text-ink3">{postulacion && postulacion.area === a ? 'Postulaste' : 'Libre'}</span></div>)}
        </div>
        <p className="m-0 px-1 text-[11px] leading-normal text-ink3">Borradores sin revisión de especialista. No deben usarse como estándar de atención.</p>
      </aside>
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
      <PageHead eyebrow="Criterium · panel de revisores" titulo="Postular a revisor">Ocho plazas, una por área. Ningún protocolo se publica como validado sin la firma de un especialista del área que corresponde.</PageHead>
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
          <div key={t} className="rounded-r border border-line bg-card p-5 sm:p-6">
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
        <form onSubmit={enviar} noValidate className="max-w-[960px] rounded-r border border-line bg-card p-5 shadow-sh sm:p-7">
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
export function Contacto() {
  const { mensajes, setMensajes, avisar, perfil } = useApp();
  const MOTIVOS_C = ['Encontré un error en un protocolo', 'Quiero proponer un protocolo', 'Consulta sobre el proyecto', 'Soy docente y quiero saber más', 'Otro'];
  const [f, setF] = useState({ motivo: MOTIVOS_C[0], nombre: (perfil && perfil.nombre) || '', correo: '', msg: '' });
  const [intento, setIntento] = useState(false);
  const [listo, setListo] = useState(null);
  const pre = useRef(null);
  const e = { nombre: f.nombre.trim().length < 2 ? 'Escribe tu nombre.' : '', correo: !esEmail(f.correo) ? 'Escribe un correo válido para poder responderte.' : '', msg: f.msg.trim().length < 15 ? 'Cuéntanos un poco más (al menos 15 caracteres).' : '' };
  const enviar = (ev) => {
    ev.preventDefault(); setIntento(true);
    if (Object.values(e).some(Boolean)) return;
    const m = { id: uid(), ...f, fecha: new Date().toISOString() };
    setMensajes((l) => [m, ...l]); setListo(m); setIntento(false); setF({ ...f, msg: '' });
  };
  const texto = (m) => 'Motivo: ' + m.motivo + '\nNombre: ' + m.nombre + '\nCorreo: ' + m.correo + '\n\n' + m.msg;
  const copiar = async (m) => {
    try { await navigator.clipboard.writeText(texto(m)); avisar('Mensaje copiado'); }
    catch (err) { if (pre.current) { const r = document.createRange(); r.selectNodeContents(pre.current); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } avisar('Selecciónalo y cópialo a mano', 'warn'); }
  };
  const ic = (k) => cx(inputCls, intento && e[k] && inputErr);
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,.9fr)]">
      <div className="flex min-w-0 flex-col gap-5">
        <header className="max-w-[62ch]">
          <h1 className="m-0 mb-2 text-[30px] font-extrabold tracking-[-.03em] text-deep sm:text-[36px]">Contáctanos</h1>
          <p className="m-0 font-serif text-[17px] leading-relaxed text-ink2">Criterium lo desarrollan dos estudiantes de quinto año de Odontología. Si algo está mal en un protocolo, queremos saberlo.</p>
        </header>
        <Aviso><b>Este sitio está en desarrollo.</b> Los protocolos son borradores sin revisión de especialista y no deben usarse como estándar de atención.</Aviso>
        {listo ? (
          <div className="flex flex-col gap-3 rounded-r border-2 border-acento bg-card p-5 sm:p-6">
            <Pill tono="acento" className="self-start"><Ic n="check" s={13} sw={2.4} />Mensaje guardado</Pill>
            <p className="m-0 text-[13.5px] leading-relaxed text-ink2">El correo del equipo todavía no está definido, así que tu mensaje queda guardado en este navegador. Cópialo si quieres enviarlo por otra vía.</p>
            <pre ref={pre} className="m-0 whitespace-pre-wrap rounded-rs bg-soft p-4 font-sans text-[13.5px] leading-relaxed text-ink">{texto(listo)}</pre>
            <div className="flex flex-wrap gap-2"><Btn icon="copy" onClick={() => copiar(listo)}>Copiar mensaje</Btn><Btn v="ghost" onClick={() => setListo(null)}>Escribir otro</Btn></div>
          </div>
        ) : (
          <form onSubmit={enviar} noValidate className="grid gap-4 rounded-r border border-line bg-card p-5 shadow-sh sm:p-6">
            <Field label="Motivo" id="c-motivo"><select id="c-motivo" value={f.motivo} onChange={(x) => setF({ ...f, motivo: x.target.value })} className={inputCls}>{MOTIVOS_C.map((m) => <option key={m}>{m}</option>)}</select></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" id="c-nombre" error={intento ? e.nombre : ''}><input id="c-nombre" value={f.nombre} onChange={(x) => setF({ ...f, nombre: x.target.value })} placeholder="Tu nombre" className={ic('nombre')} /></Field>
              <Field label="Correo" id="c-correo" error={intento ? e.correo : ''}><input id="c-correo" type="email" value={f.correo} onChange={(x) => setF({ ...f, correo: x.target.value })} placeholder="tucorreo@ejemplo.cl" className={ic('correo')} /></Field>
            </div>
            <Field label="Mensaje" id="c-msg" error={intento ? e.msg : ''}><textarea id="c-msg" rows={5} value={f.msg} onChange={(x) => setF({ ...f, msg: x.target.value })} placeholder="Cuéntanos qué pasa. Si es un error en un protocolo, di cuál y en qué paso." className={cx(ic('msg'), 'resize-y leading-relaxed')} /></Field>
            <Btn v="primary" type="submit" className="justify-self-start" onClick={enviar}>Enviar mensaje</Btn>
          </form>
        )}
        {mensajes.length > 0 && (
          <details className="rounded-r border border-line bg-card px-5 py-3.5">
            <summary className="text-[13px] font-semibold text-acentodeep">{mensajes.length === 1 ? '1 mensaje guardado' : mensajes.length + ' mensajes guardados'} en este navegador</summary>
            <div className="flex flex-col gap-2 pt-3">
              {mensajes.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line2 pt-2 text-[13px]">
                  <span className="min-w-0 text-ink2"><b className="text-ink">{m.motivo}</b> · {fecha(m.fecha)}</span>
                  <span className="flex gap-2"><Btn sm onClick={() => setListo(m)}>Ver</Btn><Btn sm v="dangerOutline" onClick={() => setMensajes((l) => l.filter((x) => x.id !== m.id))}>Borrar</Btn></span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
      <div className="rounded-r border border-line bg-card px-5 py-2">
        {[['mail', 'Correo', null], ['pin', 'Institución', null], ['userCheck', 'Equipo', 'Dos estudiantes de quinto año de Odontología'], ['clock', 'Respuesta', 'Dentro de una semana. Somos dos y estamos en clínica.']].map(([i, t, d]) => (
          <div key={t} className="grid grid-cols-[20px_minmax(0,1fr)] gap-3 border-b border-line2 py-4 last:border-0">
            <Ic n={i} s={18} className="text-acento" />
            <div><p className="m-0 mb-1 text-[13px] font-semibold">{t}</p>{d ? <p className="m-0 text-[13.5px] leading-normal text-ink2">{d}</p> : <Pill tono="warn">pendiente de definir</Pill>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
