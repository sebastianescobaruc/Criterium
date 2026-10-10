// Universidad › Investigaciones: cada persona publica sus trabajos (póster, presentación oral, artículo, tesis) con su
// resumen estructurado (introducción, objetivo, metodología, resultados, conclusiones), autores, dónde se presentó y,
// si existe, un enlace. «Me interesa» por uid. Nada de datos de pacientes (se revisa con datosPersonales).
import React, { useMemo, useState } from 'react';
import { useApp } from '../ctx.js';
import { useInvestigaciones, publicarInvestigacionFS, editarInvestigacionFS } from '../clinica/db.js';
import { datosPersonales, hace } from '../logic.js';
import { Ic, Btn, Modal, Field, Seg, Vacio, Avatar, inputCls, cx } from '../ui.jsx';
import { updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase.js';

export const TIPOS_INV = [{ v: 'poster', t: 'Póster' }, { v: 'oral', t: 'Presentación oral' }, { v: 'articulo', t: 'Artículo' }, { v: 'tesis', t: 'Tesis o memoria' }, { v: 'otro', t: 'Otro' }];
const RESUMEN = [['introduccion', 'Introducción'], ['objetivo', 'Objetivo'], ['metodologia', 'Metodología'], ['resultados', 'Resultados'], ['conclusiones', 'Conclusiones']];
const tipoTxt = (v) => (TIPOS_INV.find((x) => x.v === v) || { t: 'Investigación' }).t;

export function Investigaciones() {
  const { myUid } = useApp();
  const lista = useInvestigaciones();
  const [filtro, setFiltro] = useState('todas');
  const [nueva, setNueva] = useState(null);
  const [ver, setVer] = useState(null);
  const ver_ = (lista || []).filter((x) => filtro === 'todas' || (filtro === 'mias' ? x.autorUid === myUid : x.tipo === filtro));
  const actual = ver && (lista || []).find((x) => x.id === ver);
  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5">
      <header className="overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,var(--deep),var(--acento))] px-5 py-7 text-onc sm:px-8">
        <p className="m-0 text-[12px] font-bold uppercase tracking-[.14em] text-menta">Universidad</p>
        <h1 className="m-0 mt-2 text-[30px] font-bold leading-tight tracking-[-.025em] sm:text-[36px]">Investigaciones</h1>
        <p className="m-0 mt-2 max-w-[56ch] text-[14.5px] leading-relaxed text-panelink2">Pósters, presentaciones, artículos y tesis de estudiantes y docentes, con su resumen estructurado. Comparte el tuyo.</p>
        <button type="button" onClick={() => setNueva({})} className="mt-4 inline-flex items-center gap-2 rounded-full bg-menta px-4 py-2.5 text-[14px] font-semibold text-mentaink"><Ic n="plus" s={16} />Publicar una investigación</button>
      </header>
      <Seg opciones={[{ v: 'todas', t: 'Todas', n: (lista || []).length }, ...TIPOS_INV.slice(0, 4).map((x) => ({ ...x, n: (lista || []).filter((y) => y.tipo === x.v).length })), { v: 'mias', t: 'Las mías' }]} valor={filtro} onChange={setFiltro} />
      {lista === null ? <div className="h-40 animate-pulse rounded-[22px] bg-soft" />
        : !ver_.length ? <Vacio icon="sparkle" titulo={filtro === 'mias' ? 'Todavía no publicas investigaciones' : 'Todavía no hay investigaciones aquí'} accion={<Btn v="primary" icon="plus" onClick={() => setNueva({})}>Publicar la primera</Btn>}>Sube tu póster o tu trabajo con su resumen: así otros estudiantes ven qué se investiga.</Vacio>
        : <div className="grid gap-3 sm:grid-cols-2">{ver_.map((x) => <Tarjeta key={x.id} x={x} abrir={() => setVer(x.id)} />)}</div>}
      {nueva && <EditorInv inicial={nueva} cerrar={() => setNueva(null)} />}
      {actual && <Detalle x={actual} cerrar={() => setVer(null)} editar={() => { setNueva(actual); setVer(null); }} />}
    </div>
  );
}

function Tarjeta({ x, abrir }) {
  return (
    <button type="button" onClick={abrir} className="flex flex-col gap-2.5 rounded-[22px] bg-card p-5 text-left shadow-sh transition-shadow hover:shadow-shlg">
      <span className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-acentosoft px-2.5 py-1 text-[11.5px] font-bold text-acentodeep">{tipoTxt(x.tipo)}</span>{x.anio && <span className="text-[12px] font-semibold text-ink3">{x.anio}</span>}</span>
      <b className="text-[16px] leading-snug text-ink [text-wrap:balance]">{x.titulo}</b>
      {x.evento && <span className="text-[13px] text-acentodeep">{x.evento}</span>}
      <span className="line-clamp-2 text-[13px] text-ink2">{(x.autores || []).map((a) => a.nombre).join(', ')}</span>
      <span className="mt-auto flex items-center gap-2 pt-1 text-[12px] text-ink3"><Ic n="heart" s={14} />{(x.likedBy || []).length} · {hace(x.fecha)}</span>
    </button>
  );
}

function Detalle({ x, cerrar, editar }) {
  const { myUid, verPerfil, avisar } = useApp();
  const mio = x.autorUid === myUid, interesa = (x.likedBy || []).includes(myUid);
  const toggle = async () => { try { await updateDoc(doc(db, 'investigaciones', x.id), { likedBy: interesa ? arrayRemove(myUid) : arrayUnion(myUid) }); } catch (e) { avisar('No se pudo guardar.', 'warn'); } };
  return (
    <Modal open onClose={cerrar} title={tipoTxt(x.tipo)} wide>
      <article className="flex flex-col gap-4">
        <h2 className="m-0 text-[22px] font-bold leading-snug tracking-[-.015em] text-deep [text-wrap:balance]">{x.titulo}</h2>
        <p className="m-0 text-[14px] text-acentodeep">{[x.evento, x.anio].filter(Boolean).join(' · ')}</p>
        {(x.autores || []).length > 0 && (
          <ol className="m-0 flex list-none flex-col gap-1.5 rounded-[16px] bg-soft p-3.5 text-[13.5px]">
            {x.autores.map((a, i) => <li key={i}><b className="text-ink">{a.nombre}</b>{i === 0 ? <span className="ml-1.5 rounded-full bg-card px-2 py-[1px] text-[11px] font-bold text-acento">Autor principal</span> : null}{a.afiliacion ? <span className="text-ink3"> · {a.afiliacion}</span> : null}</li>)}
          </ol>
        )}
        {RESUMEN.filter(([k]) => x.resumen && x.resumen[k]).map(([k, t]) => (
          <section key={k}><p className="rotulo m-0 mb-1">{t}</p><p className="m-0 whitespace-pre-line text-[14.5px] leading-relaxed text-ink">{x.resumen[k]}</p></section>
        ))}
        {(x.palabras || []).length > 0 && <div className="flex flex-wrap gap-1.5">{x.palabras.map((p) => <span key={p} className="rounded-full bg-acentosoft px-2.5 py-1 text-[12px] font-semibold text-acentodeep">{p}</span>)}</div>}
        {x.etica && <p className="m-0 rounded-[14px] bg-soft px-3.5 py-2.5 text-[12.5px] text-ink2"><b className="text-ink">Ética:</b> {x.etica}</p>}
        <div className="flex flex-wrap items-center gap-2 border-t border-line2 pt-4">
          <button type="button" onClick={toggle} aria-pressed={interesa} className={cx('inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13.5px] font-semibold', interesa ? 'bg-acento text-onc' : 'bg-soft text-ink')}><Ic n="heart" s={15} />Me interesa · {(x.likedBy || []).length}</button>
          {x.enlace && <a href={x.enlace} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-soft px-3.5 py-2 text-[13.5px] font-semibold text-acento"><Ic n="ext" s={15} />Ver el trabajo</a>}
          <button type="button" onClick={() => { cerrar(); verPerfil(x.autorUid); }} className="ml-auto inline-flex items-center gap-2 text-[13px] text-ink2"><Avatar nombre={x.autor.nombre} size={26} />{x.autor.nombre}</button>
          {mio && <Btn sm icon="edit" onClick={editar}>Editar</Btn>}
        </div>
      </article>
    </Modal>
  );
}

function EditorInv({ inicial, cerrar }) {
  const { myUid, perfil, avisar, conPerfil } = useApp();
  const [f, setF] = useState(() => ({ tipo: inicial.tipo || 'poster', titulo: inicial.titulo || '', evento: inicial.evento || '', anio: inicial.anio || String(new Date().getFullYear()), enlace: inicial.enlace || '', etica: inicial.etica || '',
    autores: (inicial.autores && inicial.autores.length ? inicial.autores : [{ nombre: (perfil && perfil.nombre) || '', afiliacion: (perfil && perfil.institucion) || '' }]).map((a) => ({ ...a })),
    resumen: { ...Object.fromEntries(RESUMEN.map(([k]) => [k, ''])), ...(inicial.resumen || {}) }, palabras: (inicial.palabras || []).join(', ') }));
  const [err, setErr] = useState(''); const [ocupado, setOcupado] = useState(false);
  const palabrasResumen = useMemo(() => Object.values(f.resumen).join(' ').trim().split(/\s+/).filter(Boolean).length, [f.resumen]);
  const guardar = () => {
    if (f.titulo.trim().length < 5) { setErr('Escribe el título del trabajo.'); return; }
    if (f.enlace && !/^https:\/\//.test(f.enlace.trim())) { setErr('El enlace tiene que empezar con https://'); return; }
    const malos = datosPersonales([f.titulo, ...Object.values(f.resumen)].join(' '));
    if (malos.length) { setErr(`Quita ${malos.join(' y ')}: nada que identifique a un paciente.`); return; }
    conPerfil(async (pf) => {
      setOcupado(true);
      const datos = { tipo: f.tipo, titulo: f.titulo.trim().slice(0, 300), evento: f.evento.trim().slice(0, 160), anio: f.anio.trim().slice(0, 10), enlace: f.enlace.trim().slice(0, 400), etica: f.etica.trim().slice(0, 400),
        autores: f.autores.filter((a) => a.nombre.trim()).slice(0, 20).map((a) => ({ nombre: a.nombre.trim().slice(0, 100), afiliacion: (a.afiliacion || '').trim().slice(0, 200) })),
        resumen: Object.fromEntries(Object.entries(f.resumen).map(([k, v]) => [k, v.trim().slice(0, 2000)])), palabras: f.palabras.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 8) };
      try {
        if (inicial.id) await editarInvestigacionFS(inicial.id, datos);
        else await publicarInvestigacionFS({ ...datos, autorUid: myUid, autor: { uid: myUid, nombre: pf.nombre, institucion: pf.institucion || '' } });
        avisar(inicial.id ? 'Investigación actualizada' : 'Investigación publicada'); cerrar();
      } catch (e) { setErr('No se pudo guardar. Revisa tu conexión.'); }
      setOcupado(false);
    });
  };
  return (
    <Modal open onClose={cerrar} title={inicial.id ? 'Editar investigación' : 'Publicar una investigación'} wide>
      <div className="flex flex-col gap-4">
        <Seg opciones={TIPOS_INV} valor={f.tipo} onChange={(v) => setF({ ...f, tipo: v })} size="sm" />
        <Field label="Título" id="inv-t"><input id="inv-t" value={f.titulo} onChange={(e) => { setF({ ...f, titulo: e.target.value }); setErr(''); }} className={inputCls} /></Field>
        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
          <Field label="Dónde se presentó o publicó" id="inv-e"><input id="inv-e" value={f.evento} onChange={(e) => setF({ ...f, evento: e.target.value })} placeholder="Congreso, jornada o revista" className={inputCls} /></Field>
          <Field label="Año" id="inv-a"><input id="inv-a" value={f.anio} onChange={(e) => setF({ ...f, anio: e.target.value })} className={inputCls} /></Field>
        </div>
        <div><p className="rotulo m-0 mb-2">Autores (el primero es el autor principal)</p>
          <div className="flex flex-col gap-2">
            {f.autores.map((a, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                <input value={a.nombre} onChange={(e) => setF({ ...f, autores: f.autores.map((y, j) => (j === i ? { ...y, nombre: e.target.value } : y)) })} placeholder="Nombre" aria-label={'Autor ' + (i + 1)} className={inputCls} />
                <input value={a.afiliacion} onChange={(e) => setF({ ...f, autores: f.autores.map((y, j) => (j === i ? { ...y, afiliacion: e.target.value } : y)) })} placeholder="Afiliación" aria-label={'Afiliación del autor ' + (i + 1)} className={inputCls} />
                <button type="button" onClick={() => setF({ ...f, autores: f.autores.filter((_, j) => j !== i) })} disabled={f.autores.length === 1} className="rounded-full px-3 text-[12.5px] font-semibold text-bad disabled:opacity-30">Quitar</button>
              </div>
            ))}
            <button type="button" onClick={() => setF({ ...f, autores: [...f.autores, { nombre: '', afiliacion: '' }] })} className="self-start rounded-full px-3 py-1.5 text-[13px] font-semibold text-acento hover:bg-soft">+ Agregar autor</button>
          </div>
        </div>
        <div><p className="rotulo m-0 mb-2">Resumen estructurado <span className="font-normal normal-case tracking-normal text-ink3">· {palabrasResumen} palabras</span></p>
          <div className="flex flex-col gap-2.5">{RESUMEN.map(([k, t]) => <Field key={k} label={t} id={'inv-' + k}><textarea id={'inv-' + k} rows={k === 'metodologia' || k === 'resultados' ? 4 : 3} value={f.resumen[k]} onChange={(e) => setF({ ...f, resumen: { ...f.resumen, [k]: e.target.value } })} className={inputCls} /></Field>)}</div>
        </div>
        <Field label="Palabras clave" id="inv-p" hint="Separadas por coma"><input id="inv-p" value={f.palabras} onChange={(e) => setF({ ...f, palabras: e.target.value })} className={inputCls} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Enlace (opcional)" id="inv-l" hint="Al póster o al artículo, si está publicado"><input id="inv-l" value={f.enlace} onChange={(e) => setF({ ...f, enlace: e.target.value })} placeholder="https://" className={inputCls} /></Field>
          <Field label="Declaración ética (opcional)" id="inv-et" hint="Por ejemplo: aprobado por un comité de ética"><input id="inv-et" value={f.etica} onChange={(e) => setF({ ...f, etica: e.target.value })} className={inputCls} /></Field>
        </div>
        {err && <p className="m-0 text-[13px] font-semibold text-bad">{err}</p>}
        <div className="flex gap-2"><Btn v="primary" onClick={guardar} disabled={ocupado}>{ocupado ? 'Guardando…' : inicial.id ? 'Guardar' : 'Publicar'}</Btn><Btn onClick={cerrar}>Cancelar</Btn></div>
      </div>
    </Modal>
  );
}
