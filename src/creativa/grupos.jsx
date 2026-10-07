// Criterium Red · Espacios por curso: un grupo con su propio feed, que solo ven sus miembros.
// Cualquiera con cuenta ve los espacios de su universidad y entra con un toque (o con el enlace ?g=<id>).
import React, { useMemo, useState } from 'react';
import { useApp } from '../ctx.js';
import { datosPersonales, uid as nuevoId } from '../logic.js';
import { useGrupos, usePostsGrupo, crearGrupoFS, unirseGrupoFS, borrarGrupoFS, publicarEnGrupoFS, usePerfiles } from '../db.js';
import { Publicacion } from '../views/red.jsx';
import { normInst } from './crecer.jsx';
import { Ic, Btn, Field, Modal, Avatar, Vacio, inputCls, cx } from '../ui.jsx';

// Cada espacio tiene su portada de color, estable según su nombre
const PORTADAS = ['linear-gradient(135deg,var(--acento),var(--deep))', 'linear-gradient(135deg,var(--menta),var(--acento))', 'linear-gradient(135deg,var(--esp-ciru-ink),var(--deep))', 'linear-gradient(135deg,var(--esp-perio-ink),var(--acento))', 'linear-gradient(135deg,var(--esp-endo-ink),var(--deep))', 'linear-gradient(135deg,var(--esp-orto-ink),var(--deep))'];
const portada = (g) => PORTADAS[[...(g.nombre || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % PORTADAS.length];

export function Grupos() {
  const { myUid, perfil, abrirGrupo } = useApp();
  const grupos = useGrupos(true);
  const [crear, setCrear] = useState(false);
  const inst = normInst(perfil && perfil.institucion);
  const mios = (grupos || []).filter((g) => (g.miembros || []).includes(myUid));
  const deMiU = (grupos || []).filter((g) => !(g.miembros || []).includes(myUid) && inst && normInst(g.institucion) === inst);
  const tarjeta = (g) => (
    <button key={g.id} type="button" onClick={() => abrirGrupo(g.id)} className="flex flex-col overflow-hidden rounded-[22px] bg-card text-left shadow-sh transition-shadow hover:shadow-shlg">
      <span className="flex h-20 items-end px-4 pb-2.5" style={{ background: portada(g) }}><b className="text-[11.5px] font-bold uppercase tracking-[.12em] text-onc opacity-80">{g.institucion}</b></span>
      <span className="flex flex-col gap-1 px-4 py-3.5">
        <b className="text-[16px] leading-snug text-deep">{g.nombre}</b>
        <span className="text-[12.5px] text-ink3">{(g.miembros || []).length} {(g.miembros || []).length === 1 ? 'miembro' : 'miembros'}{g.curso ? ' · ' + g.curso : ''}</span>
      </span>
    </button>
  );
  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="rotulo m-0 mb-1.5">Espacios por curso</p><h1 className="m-0 text-[28px] font-bold tracking-[-.025em] text-deep sm:text-[32px]">Tu curso, en un solo lugar</h1>
          <p className="m-0 mt-1.5 max-w-[56ch] text-[14.5px] text-ink2">Un feed propio para tu curso o tu ramo. Lo que se publica ahí lo ven solo sus miembros.</p></div>
        <Btn v="primary" icon="plus" onClick={() => setCrear(true)}>Crear un espacio</Btn>
      </header>
      {grupos === null ? <div className="h-40 animate-pulse rounded-[22px] bg-soft" /> : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="m-0 text-[15px] font-bold text-ink">Tus espacios</h2>
            {mios.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{mios.map(tarjeta)}</div>
              : <Vacio icon="personas" titulo="Todavía no estás en ningún espacio" accion={<Btn v="primary" icon="plus" onClick={() => setCrear(true)}>Crear el de tu curso</Btn>}>Crea el de tu curso y comparte el enlace por WhatsApp, o entra a uno de tu universidad.</Vacio>}
          </section>
          {deMiU.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="m-0 text-[15px] font-bold text-ink">De tu universidad</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{deMiU.map(tarjeta)}</div>
            </section>
          )}
        </>
      )}
      {crear && <CrearGrupo cerrar={() => setCrear(false)} />}
    </div>
  );
}

function CrearGrupo({ cerrar }) {
  const { myUid, perfil, avisar, abrirGrupo } = useApp();
  const [f, setF] = useState({ nombre: '', institucion: (perfil && perfil.institucion) || '', curso: (perfil && perfil.anio) || '', descripcion: '' });
  const [err, setErr] = useState('');
  const enviar = async () => {
    if (f.nombre.trim().length < 3) return setErr('Ponle un nombre, por ejemplo «4.º año · Operatoria».');
    if (f.institucion.trim().length < 3) return setErr('Escribe la universidad.');
    if (datosPersonales(f.nombre + ' ' + f.descripcion).length) return setErr('El texto trae datos personales. Quítalos.');
    try { const id = await crearGrupoFS({ nombre: f.nombre.trim().slice(0, 60), institucion: f.institucion.trim(), curso: f.curso.trim(), descripcion: f.descripcion.trim().slice(0, 300), creador: { uid: myUid, nombre: (perfil && perfil.nombre) || '' }, miembros: [myUid] }); avisar('Espacio creado. Comparte el enlace con tu curso.'); cerrar(); abrirGrupo(id); }
    catch (e) { setErr('No se pudo crear. Revisa tu conexión.'); }
  };
  return (
    <Modal open onClose={cerrar} title="Crear un espacio">
      <div className="flex flex-col gap-3.5 p-4 sm:p-5">
        <Field label="Nombre" id="cg-nom"><input id="cg-nom" maxLength={60} value={f.nombre} onChange={(e) => { setF({ ...f, nombre: e.target.value }); setErr(''); }} placeholder="4.º año · Operatoria" className={inputCls} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Universidad" id="cg-inst"><input id="cg-inst" value={f.institucion} onChange={(e) => setF({ ...f, institucion: e.target.value })} className={inputCls} /></Field>
          <Field label="Curso o año (opcional)" id="cg-curso"><input id="cg-curso" value={f.curso} onChange={(e) => setF({ ...f, curso: e.target.value })} placeholder="4.º año" className={inputCls} /></Field>
        </div>
        <Field label="Para qué es (opcional)" id="cg-desc"><textarea id="cg-desc" rows={2} maxLength={300} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} placeholder="Dudas de clínica, casos del semestre y avisos del ramo." className={cx(inputCls, 'resize-y')} /></Field>
        {err && <p className="m-0 text-[12.5px] font-semibold text-bad">{err}</p>}
        <div className="flex gap-2"><Btn v="primary" icon="check" onClick={enviar}>Crear</Btn><Btn onClick={cerrar}>Cancelar</Btn></div>
      </div>
    </Modal>
  );
}

export function Grupo() {
  const { grupoId, myUid, go, avisar } = useApp();
  const grupos = useGrupos(true);
  const g = (grupos || []).find((x) => x.id === grupoId);
  const miembro = !!g && (g.miembros || []).includes(myUid);
  const posts = usePostsGrupo(grupoId, miembro);
  const personas = usePerfiles(true);
  const [salir, setSalir] = useState(false);
  const enlace = (typeof location !== 'undefined' ? location.origin + location.pathname : '') + '?g=' + grupoId;
  const volver = <button type="button" onClick={() => go('grupos')} className="inline-flex items-center gap-1.5 self-start rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] text-ink2 hover:bg-soft"><Ic n="back" s={14} />Espacios</button>;
  if (grupos === null) return <div className="mx-auto flex max-w-[720px] flex-col gap-4">{volver}<div className="h-60 animate-pulse rounded-[22px] bg-soft" /></div>;
  if (!g) return <div className="mx-auto flex max-w-[720px] flex-col gap-4">{volver}<Vacio icon="personas" titulo="Este espacio ya no existe">Puede que lo haya borrado quien lo creó.</Vacio></div>;
  const creador = g.creador && g.creador.uid === myUid;
  const caras = (g.miembros || []).map((u) => personas.find((x) => x.uid === u) || { uid: u, nombre: '·' });
  const unirse = async () => { try { await unirseGrupoFS(g.id, myUid, false); avisar('Entraste a ' + g.nombre); } catch (e) { avisar('No se pudo entrar.', 'warn'); } };
  const invitar = async () => {
    const texto = 'Únete a «' + g.nombre + '» en Criterium:';
    if (navigator.share) { try { await navigator.share({ title: g.nombre, text: texto, url: enlace }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(enlace); avisar('Enlace del espacio copiado'); } catch (e) { avisar('Copia el enlace: ' + enlace, 'warn'); }
  };
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-5">
      {volver}
      <section className="overflow-hidden rounded-[26px] bg-card shadow-sh">
        <div className="relative h-32 sm:h-36" style={{ background: portada(g) }}>
          <span className="absolute bottom-3 left-5 text-[12px] font-bold uppercase tracking-[.12em] text-onc opacity-85">{g.institucion}{g.curso ? ' · ' + g.curso : ''}</span>
        </div>
        <div className="flex flex-col gap-3 px-5 pb-5 pt-4 sm:px-6">
          <h1 className="m-0 text-[26px] font-bold leading-tight tracking-[-.02em] text-deep">{g.nombre}</h1>
          {g.descripcion && <p className="m-0 text-[14.5px] leading-relaxed text-ink2">{g.descripcion}</p>}
          <div className="flex items-center gap-2.5">
            <span className="flex">{caras.slice(0, 7).map((x, k) => <span key={x.uid} className={cx('rounded-full ring-2 ring-card', k && '-ml-2')}><Avatar nombre={x.nombre} size={30} /></span>)}</span>
            <span className="text-[13px] text-ink3">{caras.length} {caras.length === 1 ? 'miembro' : 'miembros'} · creado por {g.creador.nombre}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {miembro ? <Btn v="primary" icon="compartir" onClick={invitar}>Invitar a mi curso</Btn> : <Btn v="primary" icon="plus" onClick={unirse}>Unirme</Btn>}
            {miembro && !creador && (salir
              ? <span className="flex items-center gap-2 text-[13px] font-semibold"><button type="button" onClick={async () => { await unirseGrupoFS(g.id, myUid, true).catch(() => {}); setSalir(false); }} className="text-bad underline">Salir</button><button type="button" onClick={() => setSalir(false)} className="text-ink3 underline">No</button></span>
              : <Btn onClick={() => setSalir(true)}>Salir</Btn>)}
            {creador && (salir
              ? <span className="flex items-center gap-2 text-[13px] font-semibold"><span className="text-bad">¿Borrar el espacio?</span><button type="button" onClick={async () => { try { await borrarGrupoFS(g.id); go('grupos'); } catch (e) { avisar('No se pudo borrar.', 'warn'); } }} className="text-bad underline">Borrar</button><button type="button" onClick={() => setSalir(false)} className="text-ink3 underline">No</button></span>
              : <Btn v="dangerOutline" onClick={() => setSalir(true)}>Borrar el espacio</Btn>)}
          </div>
        </div>
      </section>
      {!miembro ? (
        <div className="flex flex-col items-center gap-3 rounded-[22px] border-2 border-dashed border-line px-6 py-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-soft text-acento"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" /><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2.2" /></svg></span>
          <b className="text-[15.5px] text-deep">Lo que se publica aquí lo ven solo sus miembros</b>
          <Btn v="primary" icon="plus" onClick={unirse}>Unirme a {g.nombre}</Btn>
        </div>
      ) : (
        <>
          <CrearEnGrupo g={g} />
          <div className="flex flex-col gap-4">
            {posts.length === 0 ? <p className="m-0 rounded-[22px] border border-dashed border-line px-6 py-10 text-center text-[14px] text-ink3">Todavía nadie publica en este espacio. Rompe el hielo: una duda de clínica, un aviso o un dato útil.</p>
              : posts.map((p) => <Publicacion key={p.id} p={p} />)}
          </div>
        </>
      )}
    </div>
  );
}

function CrearEnGrupo({ g }) {
  const { myUid, perfil, avisar } = useApp();
  const [tipo, setTipo] = useState('publicacion');
  const [txt, setTxt] = useState('');
  const [err, setErr] = useState('');
  const [enviando, setEnviando] = useState(false);
  const publicar = async () => {
    if (txt.trim().length < 5) return setErr('Escribe un poco más.');
    const dp = datosPersonales(txt); if (dp.length) return setErr('El texto trae ' + dp.join(', ') + '. Quítalo.');
    setEnviando(true);
    try {
      await publicarEnGrupoFS(g.id, { tipo, txt: txt.trim(), titulo: '', especialidad: '', adjuntos: [], autorUid: myUid, autor: { uid: myUid, nombre: (perfil && perfil.nombre) || '', rol: (perfil && perfil.rol) || '', institucion: (perfil && perfil.institucion) || '', verificado: false }, fecha: new Date().toISOString(), likes: 0, likedBy: [], respuestas: [] });
      setTxt(''); setErr(''); avisar('Publicado en ' + g.nombre);
    } catch (e) { setErr('No se pudo publicar. Revisa tu conexión.'); }
    setEnviando(false);
  };
  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-card p-4 shadow-sh" aria-label={'Publicar en ' + g.nombre}>
      <div className="flex gap-1.5">{[['publicacion', 'Publicación'], ['pregunta', 'Pregunta']].map(([k, t]) => <button key={k} type="button" onClick={() => setTipo(k)} aria-pressed={tipo === k} className={cx('rounded-full px-3.5 py-1.5 text-[13px] font-semibold', tipo === k ? 'bg-deep text-onc' : 'bg-soft text-ink2')}>{t}</button>)}</div>
      <textarea value={txt} rows={3} onChange={(e) => { setTxt(e.target.value); setErr(''); }} placeholder={tipo === 'pregunta' ? '¿Qué duda tienes? Solo la ve tu curso.' : 'Comparte algo con tu curso.'} aria-label="Texto" className="w-full resize-y bg-transparent text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink3" />
      {err && <p className="m-0 text-[12.5px] font-semibold text-bad">{err}</p>}
      <div className="flex justify-end border-t border-line2 pt-3"><Btn v="primary" sm onClick={publicar} disabled={enviando}>{enviando ? 'Publicando…' : 'Publicar'}</Btn></div>
    </section>
  );
}
