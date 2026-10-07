// Criterium Red: casos clínicos con revisión y corrección.
// Subes el caso → un revisor (docente o equipo Criterium, nunca el autor) lo puntúa y corrige cada sección →
// lo corriges y reenvías (nueva versión) → al aprobarse se publica en el feed con «Revisado por».
import React, { useState } from 'react';
import { hace, datosPersonales } from '../logic.js';
import { useApp } from '../ctx.js';
import { useCasosRed, useColaCasos, usePendiente, enviarCasoRedFS, corregirCasoRedFS, revisarCasoRedFS, borrarPendienteFS } from '../db.js';
import { INTERESES, SECCIONES_CASO, PROCEDIMIENTOS, EspacioMedios, PillEsp, colorEsp } from '../views/red.jsx';
import { Ic, Pill, Btn, Field, Avatar, Vacio, inputCls, inputErr, cx } from '../ui.jsx';

export const ESTADO_CASO = {
  revision: { t: 'En revisión', tono: 'warn', ic: 'clock' },
  cambios: { t: 'Correcciones pedidas', tono: 'bad', ic: 'edit' },
  aprobado: { t: 'Publicado', tono: 'ok', ic: 'check' },
  rechazado: { t: 'No publicado', tono: 'neutro', ic: 'alert' }
};
const CRITERIOS = [['pertinencia', 'Pertinencia', '¿El plan corresponde al diagnóstico?'], ['claridad', 'Claridad', '¿Se entiende qué se hizo y por qué?'], ['evidencia', 'Respaldo', '¿Se apoya en evidencia o en práctica aceptada?']];
const VEREDICTOS = [['aprobado', 'Aprobar y publicar', 'check'], ['cambios', 'Pedir correcciones', 'edit'], ['rechazado', 'No publicar', 'x']];
const nombreSeccion = (k) => (SECCIONES_CASO.find((x) => x[0] === k) || [k, 'Título'])[1];
// El texto plano del caso (para el filtro de datos personales y para buscar)
const textoCaso = (f) => [f.titulo, ...SECCIONES_CASO.map(([k]) => f.secciones[k]), f.pregunta].filter(Boolean).join('\n\n');

/* ═════════ El camino de un caso (siempre a la vista, corto) ═════════ */
function Camino({ estado }) {
  const pasos = [['Subes el caso', 'folder'], ['Lo revisan', 'stamp'], ['Lo corriges', 'edit'], ['Se publica', 'check']];
  const actual = { revision: 1, cambios: 2, aprobado: 3, rechazado: 1 }[estado] ?? -1;
  return (
    <ol className="m-0 grid list-none grid-cols-4 gap-1 p-0">
      {pasos.map(([t, ic], k) => (
        <li key={t} className="flex flex-col items-center gap-1.5 text-center">
          <span className={cx('grid h-9 w-9 place-items-center rounded-full transition-colors', k < actual || (k === actual && estado === 'aprobado') ? 'bg-acento text-onc' : k === actual ? 'bg-deep text-menta' : 'bg-soft text-ink3')}><Ic n={ic} s={16} /></span>
          <span className={cx('text-[11.5px] font-semibold leading-tight', k === actual ? 'text-ink' : 'text-ink3')}>{t}</span>
        </li>
      ))}
    </ol>
  );
}

/* ═════════ CASOS: los míos y los que puedo revisar ═════════ */
export function Casos() {
  const { myUid, esRevisor, subirCaso, abrirCasoRed } = useApp();
  const mios = useCasosRed(myUid);
  const cola = useColaCasos(esRevisor).filter((c) => c.autorUid !== myUid);
  const [tab, setTab] = useState('mios');
  const lista = tab === 'mios' ? (mios || []) : cola;
  const porCorregir = (mios || []).filter((c) => c.estado === 'cambios').length;
  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="rotulo m-0 mb-1.5">Casos clínicos</p>
          <h1 className="m-0 text-[28px] font-bold tracking-[-.025em] text-deep sm:text-[32px]">Revisados antes de publicarse</h1>
        </div>
        <Btn v="primary" icon="plus" onClick={() => subirCaso()}>Subir un caso</Btn>
      </header>
      <section className="rounded-[22px] bg-card px-4 py-5 shadow-sh sm:px-6"><Camino estado="revision" />
        <p className="m-0 mt-4 text-center text-[13px] leading-snug text-ink3">Un docente o el equipo Criterium revisa cada caso, corrige lo que haga falta y recién ahí se publica.</p>
      </section>
      <nav className="flex gap-1" aria-label="Filtrar casos">
        {[['mios', 'Mis casos', porCorregir], ...(esRevisor ? [['revisar', 'Por revisar', cola.length]] : [])].map(([k, t, n]) => (
          <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k} className={cx('flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-semibold', tab === k ? 'bg-deep text-onc' : 'text-ink2 hover:bg-soft')}>
            {t}{n > 0 && <span className={cx('rounded-full px-1.5 text-[11px] font-bold', tab === k ? 'bg-menta text-mentaink' : k === 'mios' ? 'bg-bad text-onc' : 'bg-acento text-onc')}>{n}</span>}
          </button>
        ))}
      </nav>
      {tab === 'mios' && mios === null ? <div className="h-40 animate-pulse rounded-[22px] bg-soft" />
        : lista.length === 0 ? (
          tab === 'mios'
            ? <Vacio icon="folder" titulo="Todavía no subes casos" accion={<Btn v="primary" icon="plus" onClick={() => subirCaso()}>Subir mi primer caso</Btn>}>Comparte un caso que hayas tratado. Lo revisan antes de que lo vea la comunidad.</Vacio>
            : <Vacio icon="check" titulo="Nada por revisar">Cuando alguien suba un caso, aparece aquí.</Vacio>
        ) : (
          <div className="flex flex-col gap-3">
            {lista.map((c) => {
              const E = ESTADO_CASO[c.estado] || ESTADO_CASO.revision;
              return (
                <button key={c.id} type="button" onClick={() => abrirCasoRed(c.id)} className="flex items-start gap-3.5 rounded-[20px] bg-card p-4 text-left shadow-sh transition-shadow hover:shadow-shlg">
                  <span style={c.estado === 'revision' ? colorEsp(c.especialidad) || undefined : undefined} className={cx('grid h-11 w-11 flex-none place-items-center rounded-[14px]', c.estado === 'cambios' ? 'bg-badsoft text-bad' : c.estado === 'aprobado' ? 'bg-oksoft text-ok' : 'bg-acentosoft text-acento')}><Ic n={E.ic} s={20} /></span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-[15.5px] leading-snug text-ink">{c.titulo}</b>
                    <span className="mt-0.5 block truncate text-[12.5px] text-ink3">{[tab === 'revisar' ? c.autor && c.autor.nombre : null, c.especialidad, c.diente && 'Diente ' + c.diente, 'Versión ' + (c.version || 1), hace(c.actualizado || c.fecha)].filter(Boolean).join(' · ')}</span>
                  </span>
                  <Pill tono={E.tono} className="flex-none">{E.t}</Pill>
                </button>
              );
            })}
          </div>
        )}
    </div>
  );
}

/* ═════════ SUBIR o CORREGIR un caso ═════════ */
export function SubirCaso({ caso }) {
  const { myUid, perfil, avisar, abrirCasoRed, go } = useApp();
  const corrigiendo = !!caso;
  const ultima = caso && (caso.revisiones || []).slice(-1)[0];
  const correcciones = (ultima && ultima.correcciones) || [];
  const [f, setF] = useState(() => ({
    titulo: (caso && caso.titulo) || '', especialidad: (caso && caso.especialidad) || '', procedimiento: (caso && caso.procedimiento) || '', diente: (caso && caso.diente) || '', edad: (caso && caso.edad) || '',
    secciones: { motivo: '', diagnostico: '', plan: '', realizado: '', ...((caso && caso.secciones) || {}) }, pregunta: (caso && caso.pregunta) || '',
    sinDatos: corrigiendo, nota: ''
  }));
  const [err, setErr] = useState({});
  const [enviando, setEnviando] = useState(false);
  const sec = (k, v) => { setF({ ...f, secciones: { ...f.secciones, [k]: v } }); setErr({}); };
  const enviar = async () => {
    const e = {};
    if (f.titulo.trim().length < 6) e.titulo = 'Ponle un título: qué se hizo y en qué diente.';
    if (f.secciones.diagnostico.trim().length < 10) e.diagnostico = 'Escribe el diagnóstico.';
    if (f.secciones.plan.trim().length < 10) e.plan = 'Escribe el plan de tratamiento.';
    if (f.diente && !/^[1-8]\.[1-8](\s*,\s*[1-8]\.[1-8])*$/.test(f.diente.trim())) e.diente = 'Usa notación FDI: 3.6 o 1.6, 1.7';
    if (f.edad && !(+f.edad >= 1 && +f.edad <= 110)) e.edad = 'Solo la edad en años.';
    if (!f.sinDatos) e.sinDatos = 'Confírmalo para enviar.';
    if (corrigiendo && f.nota.trim().length < 10) e.nota = 'Cuenta en una frase qué cambiaste.';
    const dp = datosPersonales(textoCaso(f) + ' ' + f.nota);
    if (dp.length) e.general = 'El caso trae ' + dp.join(', ') + '. Quítalo: nunca datos que identifiquen al paciente.';
    setErr(e); if (Object.keys(e).length) { try { document.querySelector('[data-error]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {} return; }
    const datos = {
      titulo: f.titulo.trim(), especialidad: f.especialidad, procedimiento: f.procedimiento, diente: f.diente.trim(), edad: f.edad ? String(+f.edad) : '',
      secciones: Object.fromEntries(SECCIONES_CASO.map(([k]) => [k, f.secciones[k].trim()])), pregunta: f.pregunta.trim(), txt: textoCaso(f).slice(0, 10000)
    };
    setEnviando(true);
    try {
      if (corrigiendo) { await corregirCasoRedFS(caso, datos, f.nota.trim()); avisar('Versión ' + ((caso.version || 1) + 1) + ' enviada a revisión'); abrirCasoRed(caso.id); }
      else {
        const id = await enviarCasoRedFS({ ...datos, sinDatos: true, adjuntos: [], autorUid: myUid, autor: { uid: myUid, nombre: perfil.nombre, rol: perfil.rol || '', institucion: perfil.institucion || '', verificado: false } });
        avisar('Caso enviado a revisión'); abrirCasoRed(id);
      }
    } catch (x) { setErr({ general: 'No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.' }); }
    setEnviando(false);
  };
  // La corrección que pidió el revisor, junto al campo que corrige
  const pedido = (k) => correcciones.filter((c) => c.campo === k).map((c, i) => (
    <p key={i} className="m-0 mb-2 flex items-start gap-2 rounded-rs bg-badsoft px-3 py-2 text-[13px] leading-snug text-bad"><Ic n="edit" s={14} className="mt-[2px] flex-none" /><span><b>Corrección:</b> {c.txt}</span></p>
  ));
  const campoSeccion = (k, t, ph, req) => (
    <div key={k} {...(err[k] ? { 'data-error': true } : {})}>
      {pedido(k)}
      <Field label={t + (req ? '' : ' (opcional)')} id={'cs-' + k} error={err[k]}>
        <textarea id={'cs-' + k} rows={k === 'plan' || k === 'realizado' ? 4 : 3} value={f.secciones[k]} onChange={(e) => sec(k, e.target.value)} placeholder={ph} className={cx(inputCls, 'resize-y', err[k] && inputErr)} />
      </Field>
    </div>
  );
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-5">
      <button type="button" onClick={() => (caso ? abrirCasoRed(caso.id) : go('casos'))} className="inline-flex items-center gap-1.5 self-start rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] text-ink2 hover:bg-soft"><Ic n="back" s={14} />{caso ? 'Volver al caso' : 'Casos'}</button>
      <header>
        <p className="rotulo m-0 mb-1.5">{corrigiendo ? 'Versión ' + ((caso.version || 1) + 1) : 'Nuevo caso clínico'}</p>
        <h1 className="m-0 text-[28px] font-bold tracking-[-.025em] text-deep">{corrigiendo ? 'Corrige y reenvía' : 'Sube un caso'}</h1>
        <p className="m-0 mt-1.5 text-[14.5px] leading-relaxed text-ink2">{corrigiendo ? 'Las correcciones del revisor van junto a cada sección.' : 'Lo revisa un docente o el equipo Criterium antes de publicarse. Nunca datos del paciente.'}</p>
      </header>
      {corrigiendo && ultima && ultima.comentario && <div className="rounded-[18px] bg-soft p-4 text-[14px] leading-relaxed text-ink2"><b className="text-ink">{ultima.revisor.nombre}:</b> {ultima.comentario}</div>}
      <section className="flex flex-col gap-4 rounded-[22px] bg-card p-5 shadow-sh sm:p-6">
        <div {...(err.titulo ? { 'data-error': true } : {})}>
          {pedido('titulo')}
          <Field label="Título" id="cs-titulo" error={err.titulo}><input id="cs-titulo" value={f.titulo} onChange={(e) => { setF({ ...f, titulo: e.target.value }); setErr({}); }} placeholder="Ej.: Endodoncia en 2.4 con dos conductos" className={cx(inputCls, err.titulo && inputErr)} /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Especialidad" id="cs-esp"><select id="cs-esp" value={f.especialidad} onChange={(e) => setF({ ...f, especialidad: e.target.value })} className={inputCls}><option value="">Elige</option>{INTERESES.map((a) => <option key={a}>{a}</option>)}</select></Field>
          <Field label="Procedimiento" id="cs-proc" hint="Sirve para encontrar casos del mismo procedimiento."><select id="cs-proc" value={f.procedimiento} onChange={(e) => { const v = e.target.value; const g = PROCEDIMIENTOS.find(([, l]) => l.includes(v)); setF({ ...f, procedimiento: v, especialidad: f.especialidad || (g && g[0] !== 'Otros' ? g[0] : '') }); }} className={inputCls}><option value="">Elige</option>{PROCEDIMIENTOS.map(([g, l]) => <optgroup key={g} label={g}>{l.map((x) => <option key={x}>{x}</option>)}</optgroup>)}</select></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Diente (FDI)" id="cs-diente" error={err.diente}><input id="cs-diente" value={f.diente} onChange={(e) => { setF({ ...f, diente: e.target.value }); setErr({}); }} placeholder="3.6" className={cx(inputCls, err.diente && inputErr)} /></Field>
          <Field label="Edad (años)" id="cs-edad" error={err.edad}><input id="cs-edad" inputMode="numeric" maxLength={3} value={f.edad} onChange={(e) => { setF({ ...f, edad: e.target.value.replace(/\D/g, '') }); setErr({}); }} placeholder="34" className={cx(inputCls, err.edad && inputErr)} /></Field>
        </div>
      </section>
      <section className="flex flex-col gap-4 rounded-[22px] bg-card p-5 shadow-sh sm:p-6">
        {campoSeccion('motivo', 'Motivo de consulta', 'Qué le pasaba al paciente, en sus palabras.')}
        {campoSeccion('diagnostico', 'Diagnóstico', 'Hallazgos clínicos y radiográficos, y el diagnóstico.', true)}
        {campoSeccion('plan', 'Plan de tratamiento', 'Qué decidiste hacer y por qué. Si consideraste otras opciones, cuéntalas.', true)}
        {campoSeccion('realizado', 'Qué se hizo y cómo resultó', 'Los pasos, materiales, complicaciones y el resultado o el control.')}
        <Field label="¿Qué quieres que revisen? (opcional)" id="cs-preg"><input id="cs-preg" value={f.pregunta} onChange={(e) => setF({ ...f, pregunta: e.target.value })} placeholder="Ej.: ¿Era mejor una incrustación?" className={inputCls} /></Field>
        <EspacioMedios caso />
      </section>
      {corrigiendo && (
        <div {...(err.nota ? { 'data-error': true } : {})}>
          <Field label="¿Qué cambiaste?" id="cs-nota" error={err.nota}><input id="cs-nota" value={f.nota} onChange={(e) => { setF({ ...f, nota: e.target.value }); setErr({}); }} placeholder="Ej.: corregí el diagnóstico pulpar y agregué el control a los 3 meses" className={cx(inputCls, err.nota && inputErr)} /></Field>
        </div>
      )}
      <label className="flex items-start gap-2.5 text-[13.5px] leading-snug text-ink2" {...(err.sinDatos ? { 'data-error': true } : {})}>
        <input type="checkbox" checked={f.sinDatos} onChange={(e) => { setF({ ...f, sinDatos: e.target.checked }); setErr({}); }} className="mt-0.5 accent-[var(--acento)]" />
        <span>El caso no trae nombre, RUT, ficha, fecha de nacimiento ni fotos que identifiquen al paciente.{err.sinDatos && <b className="block text-bad">{err.sinDatos}</b>}</span>
      </label>
      {err.general && <p className="m-0 rounded-rs bg-badsoft px-3.5 py-2.5 text-[13px] font-semibold text-bad" data-error>{err.general}</p>}
      <div className="flex gap-2"><Btn v="primary" icon="send" onClick={enviar} disabled={enviando}>{enviando ? 'Enviando…' : corrigiendo ? 'Reenviar a revisión' : 'Enviar a revisión'}</Btn></div>
    </div>
  );
}

/* ═════════ UN CASO: el caso, su historia, las revisiones y (si toca) el formulario del revisor ═════════ */
export function CasoRed() {
  const { casoRedId, myUid, esRevisor, go, corregirCaso, avisar } = useApp();
  const c = usePendiente(casoRedId);
  const [borrar, setBorrar] = useState(false);
  const volver = <button type="button" onClick={() => go('casos')} className="inline-flex items-center gap-1.5 self-start rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] text-ink2 hover:bg-soft"><Ic n="back" s={14} />Casos</button>;
  if (c === undefined) return <div className="mx-auto flex max-w-[760px] flex-col gap-4">{volver}<div className="h-72 animate-pulse rounded-[22px] bg-soft" /></div>;
  if (c === null) return <div className="mx-auto flex max-w-[760px] flex-col gap-4">{volver}<Vacio icon="folder" titulo="Este caso no está disponible">Puede que se haya retirado.</Vacio></div>;
  const E = ESTADO_CASO[c.estado] || ESTADO_CASO.revision;
  const yo = c.autorUid === myUid;
  const revisiones = c.revisiones || [];
  const puedeRevisar = esRevisor && !yo && c.estado === 'revision';
  const ultima = revisiones.slice(-1)[0];
  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5">
      {volver}
      <section className="overflow-hidden rounded-[24px] bg-card shadow-sh">
        <div className="flex flex-col gap-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tono={E.tono}><Ic n={E.ic} s={12} />{E.t}</Pill>
            <Pill>Versión {c.version || 1}</Pill>
            {c.especialidad && <PillEsp esp={c.especialidad} />}
            {c.procedimiento && <Pill># {c.procedimiento}</Pill>}
            {c.diente && <Pill>Diente {c.diente}</Pill>}
            {c.edad && <Pill>{c.edad} años</Pill>}
          </div>
          <h1 className="m-0 text-[26px] font-bold leading-tight tracking-[-.02em] text-deep sm:text-[30px]">{c.titulo}</h1>
          <div className="flex items-center gap-2.5"><Avatar nombre={c.autor.nombre} size={34} /><span className="min-w-0 text-[13px] text-ink3"><b className="block text-ink">{yo ? 'Tú' : c.autor.nombre}</b>{[c.autor.rol, c.autor.institucion].filter(Boolean).join(' · ')}</span></div>
          <Camino estado={c.estado} />
        </div>
        {yo && c.estado === 'cambios' && (
          <div className="flex flex-wrap items-center gap-3 border-t border-line2 bg-badsoft px-5 py-4 sm:px-7">
            <span className="min-w-0 flex-1 text-[14px] font-semibold text-bad">{ultima ? ultima.revisor.nombre + ' pidió ' + ((ultima.correcciones || []).length || 'algunas') + ((ultima.correcciones || []).length === 1 ? ' corrección' : ' correcciones') + '.' : 'Te pidieron correcciones.'}</span>
            <Btn v="primary" icon="edit" onClick={() => corregirCaso(c)}>Corregir y reenviar</Btn>
          </div>
        )}
        {c.estado === 'aprobado' && <div className="flex items-center gap-2 border-t border-line2 bg-oksoft px-5 py-3.5 text-[14px] font-semibold text-ok sm:px-7"><Ic n="check" s={16} />Publicado en el feed{ultima ? ' · revisado por ' + ultima.revisor.nombre : ''}.</div>}
        {c.estado === 'rechazado' && ultima && <div className="border-t border-line2 bg-soft px-5 py-3.5 text-[14px] text-ink2 sm:px-7"><b className="text-ink">No se publica.</b> {ultima.comentario}</div>}
      </section>

      <section className="flex flex-col gap-4 rounded-[22px] bg-card p-5 shadow-sh sm:p-7">
        {SECCIONES_CASO.filter(([k]) => c.secciones && c.secciones[k]).map(([k, t]) => (
          <div key={k}>
            <p className="m-0 text-[11.5px] font-semibold uppercase tracking-[.1em] text-rotulo">{t}</p>
            <p className="m-0 mt-1 whitespace-pre-line text-[15px] leading-[1.6] text-ink">{c.secciones[k]}</p>
          </div>
        ))}
        {c.pregunta && <div className="rounded-[16px] bg-soft px-4 py-3"><p className="m-0 text-[11.5px] font-semibold uppercase tracking-[.1em] text-rotulo">Quiere que revisen</p><p className="m-0 mt-1 text-[14.5px] text-ink">{c.pregunta}</p></div>}
        <EspacioMedios caso />
      </section>

      {puedeRevisar && <FormRevisionCaso c={c} />}
      {esRevisor && yo && c.estado === 'revision' && <p className="m-0 rounded-rs bg-soft px-4 py-3 text-[13px] text-ink3">Es tu caso: lo revisa otra persona. Nadie revisa lo suyo.</p>}

      {revisiones.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-[17px] font-bold text-deep">Revisiones</h2>
          {[...revisiones].reverse().map((r) => <TarjetaRevision key={r.id} r={r} />)}
        </section>
      )}

      {(c.historial || []).length > 0 && (
        <section className="rounded-[22px] bg-card p-5 shadow-sh sm:p-6">
          <h2 className="m-0 mb-3 text-[15px] font-bold text-ink">Historia del caso</h2>
          <ol className="m-0 flex list-none flex-col gap-2.5 border-l-2 border-line2 p-0 pl-4">
            {[...c.historial].reverse().map((h, k) => <li key={k} className="relative text-[13.5px] text-ink2"><span className="absolute -left-[22px] top-[6px] h-2.5 w-2.5 rounded-full bg-acento ring-4 ring-card" />{h.txt}<span className="ml-2 text-[12px] text-ink3">{hace(h.fecha)}</span></li>)}
          </ol>
        </section>
      )}

      {yo && c.estado !== 'aprobado' && (
        <div className="flex gap-3 text-[13px] font-semibold">
          {borrar
            ? <><span className="text-bad">¿Borrar el caso para siempre?</span><button type="button" onClick={async () => { try { await borrarPendienteFS(c.id); avisar('Caso borrado'); go('casos'); } catch (e) { avisar('No se pudo borrar.', 'warn'); } }} className="text-bad underline">Borrar</button><button type="button" onClick={() => setBorrar(false)} className="text-ink3 underline">No</button></>
            : <button type="button" onClick={() => setBorrar(true)} className="text-ink3 hover:text-bad">{c.estado === 'revision' ? 'Retirar y borrar el caso' : 'Borrar el caso'}</button>}
        </div>
      )}
    </div>
  );
}

function TarjetaRevision({ r }) {
  const V = { aprobado: ['ok', 'Aprobó y publicó'], cambios: ['bad', 'Pidió correcciones'], rechazado: ['neutro', 'No publicó'] }[r.veredicto] || ['neutro', r.veredicto];
  return (
    <article className="rounded-[20px] bg-card p-4 shadow-sh sm:p-5">
      <header className="flex flex-wrap items-center gap-2.5">
        <Avatar nombre={r.revisor.nombre} size={34} />
        <span className="min-w-0 flex-1 text-[13px] text-ink3"><b className="block text-[14px] text-ink">{r.revisor.nombre}</b>{[r.revisor.rol, 'versión ' + r.version, hace(r.fecha)].filter(Boolean).join(' · ')}</span>
        <Pill tono={V[0]}>{V[1]}</Pill>
      </header>
      <div className="mt-3 flex flex-wrap gap-2">
        {CRITERIOS.map(([k, t]) => <span key={k} className="inline-flex items-center gap-1.5 rounded-full bg-soft px-3 py-1 text-[12.5px] text-ink2">{t}<b className="tabular-nums text-ink">{r.puntajes[k]}/5</b></span>)}
      </div>
      {(r.correcciones || []).length > 0 && (
        <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
          {r.correcciones.map((c, k) => <li key={k} className="rounded-rs bg-badsoft px-3 py-2 text-[13.5px] leading-snug text-bad"><b>{nombreSeccion(c.campo)}:</b> {c.txt}</li>)}
        </ul>
      )}
      {r.comentario && <p className="m-0 mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink2">{r.comentario}</p>}
    </article>
  );
}

/* ═════════ El formulario del revisor ═════════
   Reglas: los tres puntajes son obligatorios; el comentario pide al menos 40 caracteres;
   aprobar exige respaldo ≥ 3 y ninguna corrección pendiente; pedir correcciones exige al menos una. */
function FormRevisionCaso({ c }) {
  const { myUid, perfil, avisar } = useApp();
  const [puntajes, setPuntajes] = useState({});
  const [correcciones, setCorrecciones] = useState([]);
  const [nueva, setNueva] = useState({ campo: 'diagnostico', txt: '' });
  const [veredicto, setVeredicto] = useState('');
  const [comentario, setComentario] = useState('');
  const [err, setErr] = useState('');
  const [enviando, setEnviando] = useState(false);
  const campos = [['titulo', 'Título'], ...SECCIONES_CASO.filter(([k]) => k === 'diagnostico' || k === 'plan' || (c.secciones && c.secciones[k]))];
  const agregar = () => {
    if (nueva.txt.trim().length < 8) { setErr('Escribe la corrección: qué cambiar y por qué.'); return; }
    setCorrecciones([...correcciones, { campo: nueva.campo, txt: nueva.txt.trim() }]); setNueva({ ...nueva, txt: '' }); setErr('');
    if (!veredicto || veredicto === 'aprobado') setVeredicto('cambios');
  };
  const firmar = async () => {
    if (CRITERIOS.some(([k]) => !puntajes[k])) { setErr('Pon los tres puntajes.'); return; }
    if (!veredicto) { setErr('Elige qué pasa con el caso.'); return; }
    if (veredicto === 'aprobado' && correcciones.length) { setErr('Hay correcciones pendientes: pide correcciones o quítalas para aprobar.'); return; }
    if (veredicto === 'aprobado' && puntajes.evidencia < 3) { setErr('Con respaldo bajo 3 no se puede aprobar: pide correcciones.'); return; }
    if (veredicto === 'cambios' && !correcciones.length) { setErr('Agrega al menos una corrección, ligada a la sección que hay que cambiar.'); return; }
    if (comentario.trim().length < 40) { setErr('Justifica tu decisión en al menos 40 caracteres. El autor lo lee.'); return; }
    if (datosPersonales(comentario + ' ' + correcciones.map((x) => x.txt).join(' ')).length) { setErr('Tu revisión trae datos que identifican a alguien. Quítalos.'); return; }
    setEnviando(true); setErr('');
    try {
      await revisarCasoRedFS(c, {
        id: Date.now().toString(36), fecha: new Date().toISOString(), version: c.version || 1,
        revisor: { uid: myUid, nombre: (perfil && perfil.nombre) || 'Revisor', rol: (perfil && perfil.rol) || '' },
        puntajes, veredicto, correcciones: veredicto === 'cambios' ? correcciones : [], comentario: comentario.trim()
      });
      avisar(veredicto === 'aprobado' ? 'Caso aprobado y publicado en el feed' : veredicto === 'cambios' ? 'Correcciones enviadas al autor' : 'Caso no publicado', veredicto === 'aprobado' ? 'ok' : 'warn');
    } catch (e) { setErr('No se pudo firmar la revisión. Revisa tu conexión.'); }
    setEnviando(false);
  };
  return (
    <section className="flex flex-col gap-5 rounded-[22px] bg-deep p-5 text-panelink sm:p-7" aria-label="Revisar el caso">
      <div><p className="m-0 text-[11.5px] font-semibold uppercase tracking-[.12em] text-menta">Tu revisión</p><h2 className="m-0 mt-1 text-[21px] font-bold text-onc">Puntúa, corrige y decide</h2></div>
      <div className="flex flex-col gap-3">
        {CRITERIOS.map(([k, t, ayuda]) => (
          <div key={k} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="min-w-0 flex-1"><b className="block text-[14.5px] text-onc">{t}</b><span className="block text-[12.5px] text-panelink2">{ayuda}</span></span>
            <div className="flex gap-1.5" role="group" aria-label={t}>
              {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" onClick={() => { setPuntajes({ ...puntajes, [k]: n }); setErr(''); }} aria-pressed={puntajes[k] === n} className={cx('h-10 w-10 rounded-full text-[14px] font-bold transition-colors', puntajes[k] === n ? 'bg-menta text-mentaink' : 'bg-[color-mix(in_srgb,var(--card)_12%,transparent)] text-panelink hover:bg-[color-mix(in_srgb,var(--card)_22%,transparent)]')}>{n}</button>)}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2.5 rounded-[18px] bg-[color-mix(in_srgb,var(--card)_8%,transparent)] p-4">
        <b className="text-[14.5px] text-onc">Correcciones</b>
        <span className="text-[12.5px] leading-snug text-panelink2">Cada corrección va a una sección. El autor la ve junto a ese campo cuando corrige.</span>
        {correcciones.map((x, k) => (
          <div key={k} className="flex items-start gap-2 rounded-rs bg-card px-3 py-2 text-[13.5px] text-ink"><span className="min-w-0 flex-1"><b>{nombreSeccion(x.campo)}:</b> {x.txt}</span><button type="button" onClick={() => setCorrecciones(correcciones.filter((_, i) => i !== k))} className="rounded-full p-1 text-ink3 hover:bg-soft" aria-label="Quitar esta corrección"><Ic n="x" s={14} /></button></div>
        ))}
        <div className="flex flex-col gap-2 sm:flex-row">
          <select value={nueva.campo} onChange={(e) => setNueva({ ...nueva, campo: e.target.value })} aria-label="Sección a corregir" className={cx(inputCls, 'sm:w-[200px]')}>{campos.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
          <input value={nueva.txt} onChange={(e) => { setNueva({ ...nueva, txt: e.target.value }); setErr(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } }} placeholder="Qué cambiar y por qué" aria-label="Corrección" className={cx(inputCls, 'flex-1')} />
          <Btn onClick={agregar} icon="plus">Agregar</Btn>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Qué pasa con el caso">
        {VEREDICTOS.map(([k, t, ic]) => (
          <button key={k} type="button" role="radio" aria-checked={veredicto === k} onClick={() => { setVeredicto(k); setErr(''); }} className={cx('flex items-center gap-2 rounded-[16px] px-4 py-3 text-left text-[14px] font-semibold transition-colors', veredicto === k ? 'bg-menta text-mentaink' : 'bg-[color-mix(in_srgb,var(--card)_10%,transparent)] text-panelink hover:bg-[color-mix(in_srgb,var(--card)_18%,transparent)]')}><Ic n={ic} s={16} />{t}</button>
        ))}
      </div>
      <Field label={<span className="text-panelink">Justificación para el autor</span>} id="rv-com" hint={<span className="text-panelink2">{comentario.trim().length} de 40 como mínimo</span>}>
        <textarea id="rv-com" rows={4} value={comentario} onChange={(e) => { setComentario(e.target.value); setErr(''); }} placeholder="Qué está bien, qué falta y por qué decides esto. Si te apoyas en evidencia, cítala." className={cx(inputCls, 'resize-y')} />
      </Field>
      {err && <p className="m-0 rounded-rs bg-badsoft px-3.5 py-2.5 text-[13px] font-semibold text-bad">{err}</p>}
      <div><button type="button" onClick={firmar} disabled={enviando} className="h-12 rounded-full bg-menta px-7 text-[15px] font-semibold text-mentaink disabled:opacity-50">{enviando ? 'Firmando…' : 'Firmar la revisión'}</button></div>
    </section>
  );
}

/* ═════════ Celebrar la aprobación: la primera vez que el autor vuelve después de que publican su caso ═════════ */
const PIEZAS = Array.from({ length: 16 }, (_, i) => ({ left: (i * 61) % 100, d: ((i * 37) % 70) / 100, r: (i % 2 ? 1 : -1) * (120 + ((i * 53) % 200)), c: i % 3 === 0 ? 'var(--acento)' : 'var(--menta)' }));
export function Celebracion({ caso, cerrar, ver }) {
  const ultima = (caso.revisiones || []).slice(-1)[0];
  React.useEffect(() => { const k = (e) => { if (e.key === 'Escape') cerrar(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  return (
    <div className="celebra-velo" role="dialog" aria-modal="true" aria-label="Tu caso se publicó" onMouseDown={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
      <div className="celebra-caja">
        {PIEZAS.map((x, i) => <span key={i} className="celebra-pieza" style={{ left: x.left + '%', background: x.c, '--d': x.d + 's', '--r': x.r + 'deg' }} aria-hidden="true" />)}
        <div className="celebra-sello"><Ic n="check" s={40} sw={2.6} /></div>
        <p className="m-0 mt-5 text-[12px] font-bold uppercase tracking-[.14em] text-rotulo">Tu caso se publicó</p>
        <h2 className="m-0 mt-1.5 text-[22px] font-bold leading-snug tracking-[-.02em] text-deep [text-wrap:balance]">{caso.titulo}</h2>
        {ultima && <p className="m-0 mt-2 text-[14px] text-ink2">Revisado por {ultima.revisor.nombre}{(caso.revisiones || []).length > 1 ? ' en ' + caso.revisiones.length + ' rondas' : ''}. Ya está en el inicio.</p>}
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" autoFocus onClick={ver} className="h-12 rounded-full bg-acento text-[15px] font-semibold text-onc hover:bg-acentodeep">Verlo en el inicio</button>
          <button type="button" onClick={cerrar} className="h-11 rounded-full text-[14px] font-semibold text-ink3 hover:text-ink">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
