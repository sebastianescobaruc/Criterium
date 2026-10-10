// Universidad › Revisores: el panel de especialistas que valida los borradores de protocolos, de materia y los casos
// clínicos, de forma asincrónica (cola de revisión) o en vivo (rondas). Todo protocolo y todo material nuevo entra como
// borrador y se publica solo con el consenso del panel (2 rondas, ≥ 80 % de 4 o 5) y el filtro final del equipo.
// Lógica pura en ../revisores.js; datos en ../revisores-db.js; reglas en firestore.rules (sección Revisores).
import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../ctx.js';
import { useMateria } from '../db.js';
import { useRevisorVerificado, useConfigRevisores, useBorradores, useBorrador, useRevisionesBorrador, useMisRevisiones, useTramo, crearBorradorFS, guardarBorradorFS, borrarBorradorFS, enviarARevisionFS, enviarRevisionPanelFS, guardarTramoFS, cerrarRondaFS, publicarBorradorFS } from '../revisores-db.js';
import { TRAMOS_DEF, RONDAS, PANEL, UMBRAL, CRITERIOS, ESTADOS_BORRADOR, estadoBorrador, clp, tramos, consenso, validarRevision, itemsRevision, avanceMes, puedeRevisar } from '../revisores.js';
import { Ic, Btn, Field, Vacio, Seg, Avatar, inputCls, cx } from '../ui.jsx';

export const ESPECIALIDADES_REV = ['Rehabilitación oral', 'Operatoria y cariología', 'Endodoncia', 'Periodoncia', 'Cirugía', 'Odontopediatría', 'Ortodoncia', 'Radiología', 'Patología oral', 'Trastornos temporomandibulares'];
const hoyISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
const fechaCorta = (s) => new Date(s).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
const TIPO = { protocolo: 'Procedimiento', materia: 'Materia', caso: 'Caso clínico' };

// Quién soy frente a los borradores (lo mismo que validan las reglas)
function usePermisos() {
  const { myUid, esDocente, esAdmin } = useApp();
  const rev = useRevisorVerificado(myUid);
  return { uid: myUid, rev, esDocente, esAdmin, esRevisorVerificado: !!rev, veTodo: !!rev || esDocente || esAdmin, especialidades: (rev && rev.especialidades) || [], cargando: rev === undefined };
}

/* ── Pestañas de la sección (también sobre Rondas en vivo) ── */
export function TabsRevisores() {
  const { view, revTab, irRevisores, go } = useApp();
  const p = usePermisos();
  const items = [p.veTodo && ['cola', 'Cola de revisión'], ['rondas', 'Rondas en vivo'], p.esRevisorVerificado && ['tramo', 'Mi tramo'], ['mios', 'Mis borradores'], ['como', 'Cómo funciona']].filter(Boolean);
  const activo = view === 'rondas' || view === 'ronda' ? 'rondas' : view === 'revisores' ? revTab || (p.veTodo ? 'cola' : 'como') : 'mios';
  return (
    <nav className="scroll-x -mx-4 mb-5 flex gap-1 overflow-x-auto px-4" aria-label="Revisores">
      {items.map(([k, t]) => <button key={k} type="button" onClick={() => (k === 'rondas' ? go('rondas') : irRevisores(k))} aria-current={activo === k ? 'page' : undefined} className={cx('flex-none rounded-full px-4 py-2 text-[13.5px] font-semibold', activo === k ? 'bg-deep text-onc' : 'text-ink2 hover:bg-soft')}>{t}</button>)}
    </nav>
  );
}

export function Revisores() {
  const { revTab } = useApp();
  const p = usePermisos();
  if (p.cargando) return <div className="h-64 animate-pulse rounded-[22px] bg-soft" />;
  const tab = revTab || (p.veTodo ? 'cola' : 'como');
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
      <header>
        <p className="rotulo m-0">Universidad</p>
        <h1 className="m-0 mt-1 text-[28px] font-bold tracking-[-.025em] text-deep sm:text-[32px]">Revisores</h1>
        <p className="m-0 mt-1 max-w-[70ch] text-[14.5px] leading-relaxed text-ink2">Especialistas de cualquier lugar validan, en panel y a su ritmo, los borradores de procedimientos, de materia y los casos clínicos. Nada se publica sin su consenso.</p>
      </header>
      <TabsRevisores />
      {tab === 'cola' && (p.veTodo ? <Cola p={p} /> : <ComoFunciona p={p} />)}
      {tab === 'tramo' && (p.esRevisorVerificado ? <MiTramo p={p} /> : <ComoFunciona p={p} />)}
      {tab === 'mios' && <MisBorradores p={p} />}
      {tab === 'como' && <ComoFunciona p={p} />}
    </div>
  );
}

/* ── Cola: borradores en revisión (por especialidad) y casos clínicos por revisar ── */
function Cola({ p }) {
  const { abrirBorrador, colaCasos, abrirCasoRed } = useApp();
  const borradores = useBorradores(p.uid, true);
  const [tipo, setTipo] = useState('todos');
  const [esp, setEsp] = useState(p.especialidades.length ? 'mias' : 'todas');
  const enRevision = (borradores || []).filter((b) => b.estado === 'revision' || b.estado === 'correcciones');
  const filtrada = enRevision.filter((b) => (tipo === 'todos' || b.tipo === tipo) && (esp === 'todas' || (esp === 'mias' ? p.especialidades.includes(b.especialidad) : b.especialidad === esp)));
  const casos = (colaCasos || []).filter(() => tipo === 'todos' || tipo === 'caso');
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Seg size="sm" valor={tipo} onChange={setTipo} opciones={[{ v: 'todos', t: 'Todo' }, { v: 'protocolo', t: 'Procedimientos' }, { v: 'materia', t: 'Materia' }, { v: 'caso', t: 'Casos clínicos' }]} />
        <select value={esp} onChange={(e) => setEsp(e.target.value)} aria-label="Especialidad" className={cx(inputCls, 'max-w-[260px] !py-1.5 text-[13px]')}>
          {p.especialidades.length > 0 && <option value="mias">Mis especialidades ({p.especialidades.join(', ')})</option>}
          <option value="todas">Todas las especialidades</option>
          {ESPECIALIDADES_REV.map((x) => <option key={x}>{x}</option>)}
        </select>
      </div>
      {borradores === null ? <div className="h-40 animate-pulse rounded-[22px] bg-soft" /> : (
        <div className="flex flex-col gap-2">
          {tipo !== 'caso' && filtrada.map((b) => (
            <button key={b.id} type="button" onClick={() => abrirBorrador(b.id)} className="flex flex-wrap items-center gap-3 rounded-[18px] bg-card px-4 py-3 text-left shadow-sh hover:bg-soft">
              <span className="rounded-full bg-acentosoft px-2.5 py-1 text-[11.5px] font-bold text-acentodeep">{TIPO[b.tipo]}</span>
              <span className="min-w-0 flex-1"><b className="block truncate text-[15px] text-ink">{b.titulo}</b><span className="block truncate text-[12.5px] text-ink3">{b.especialidad} · de {b.autor && b.autor.nombre} · ronda {b.ronda} de {RONDAS}</span></span>
              <EstadoPastilla estado={b.estado} />
              <Ic n="back" s={15} className="rotate-180 text-ink3" />
            </button>
          ))}
          {tipo !== 'caso' && !filtrada.length && <p className="m-0 rounded-[16px] bg-soft px-4 py-4 text-[13.5px] text-ink2">No hay borradores en revisión con este filtro.</p>}
          {(tipo === 'todos' || tipo === 'caso') && casos.map((c) => (
            <button key={c.id} type="button" onClick={() => abrirCasoRed(c.id)} className="flex flex-wrap items-center gap-3 rounded-[18px] bg-card px-4 py-3 text-left shadow-sh hover:bg-soft">
              <span className="rounded-full bg-warnsoft px-2.5 py-1 text-[11.5px] font-bold text-warn">Caso clínico</span>
              <span className="min-w-0 flex-1"><b className="block truncate text-[15px] text-ink">{c.titulo || 'Caso clínico'}</b><span className="block truncate text-[12.5px] text-ink3">{c.especialidad || ''} · de {c.autor && c.autor.nombre}</span></span>
              <Ic n="back" s={15} className="rotate-180 text-ink3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EstadoPastilla({ estado }) {
  const cls = { borrador: 'bg-soft text-ink2', revision: 'bg-warnsoft text-warn', correcciones: 'bg-badsoft text-bad', aprobado: 'bg-oksoft text-ok' }[estado] || 'bg-soft text-ink2';
  return <span className={cx('rounded-full px-2.5 py-1 text-[11.5px] font-bold', cls)}>{estadoBorrador(estado).t}</span>;
}

/* ── Mi tramo: tramo elegido, avance del mes, días que quedan y pago estimado (pago mensual, sin ciclos) ── */
function MiTramo({ p }) {
  const { avisar } = useApp();
  const config = useConfigRevisores();
  const tramo = useTramo(p.uid, true);
  const mias = useMisRevisiones(p.uid, true);
  const hoy = hoyISO();
  const [edit, setEdit] = useState(null);
  if (tramo === undefined || mias === null) return <div className="h-40 animate-pulse rounded-[22px] bg-soft" />;
  const t = tramo || { protocolo: 0, materia: 0 };
  const guardar = async () => {
    try { await guardarTramoFS(p.uid, { protocolo: +edit.protocolo, materia: +edit.materia }); setEdit(null); avisar('Tramo guardado'); }
    catch (e) { avisar('No se pudo guardar el tramo.', 'warn'); }
  };
  const tarjeta = (tipo, titulo, unidad) => {
    const n = t[tipo] || 0;
    const a = avanceMes({ tipo, n, revisiones: (mias || []).map((r) => ({ ...r, fecha: r.fecha.slice(0, 10) })), hoy, config });
    return (
      <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5 shadow-sh">
        <div className="flex items-baseline justify-between gap-2"><p className="rotulo m-0">{titulo}</p><b className="text-[13px] text-ink2">{n ? `Tramo ${n} al mes · ${clp(a.montoTramo)}` : 'Sin tramo'}</b></div>
        {!n ? <p className="m-0 text-[13.5px] text-ink2">Sin tramo pagado. Igual puedes revisar como voluntario y recibir tu certificado.</p> : (<>
          <div className="flex items-end justify-between gap-3"><b className="text-[34px] font-extrabold leading-none tabular-nums text-deep">{a.hechos}<span className="text-[16px] font-semibold text-ink3"> / {n}</span></b><span className="text-right text-[12.5px] text-ink3">{unidad} completados este mes<br />{a.diasRestantes} días para cerrar el mes</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-soft"><span className={cx('block h-full rounded-full', a.cumplido ? 'bg-ok' : 'bg-acento')} style={{ width: Math.min(100, (a.hechos / Math.max(1, n)) * 100) + '%' }} /></div>
          <p className="m-0 text-[13.5px] text-ink2">Pago estimado de este mes: <b className="text-ink">{clp(a.monto)}</b>{a.cumplido ? ' · tramo cumplido.' : a.hechos < a.minimo ? ` · desde ${a.minimo} ${unidad} se paga.` : ` · si completas los ${n}, cobras ${clp(a.montoTramo)}.`}</p>
        </>)}
      </section>
    );
  };
  const tabla = (tipo) => tramos(tipo, config);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 [&>*]:min-w-0 md:grid-cols-2">{tarjeta('protocolo', 'Procedimientos', 'procedimientos')}{tarjeta('materia', 'Materia', 'materiales')}</div>
      <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5 shadow-sh">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="rotulo m-0">Tu compromiso del mes</p>{!edit && <Btn sm icon="edit" onClick={() => setEdit({ protocolo: t.protocolo || 0, materia: t.materia || 0 })}>Cambiar tramo</Btn>}</div>
        {edit ? (<>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Procedimientos al mes" id="tr-p"><select id="tr-p" value={edit.protocolo} onChange={(e) => setEdit({ ...edit, protocolo: e.target.value })} className={inputCls}><option value={0}>Sin tramo (voluntario)</option>{tabla('protocolo').map((x) => <option key={x.n} value={x.n}>{x.n} al mes · {clp(x.monto)}</option>)}</select></Field>
            <Field label="Materiales al mes" id="tr-m"><select id="tr-m" value={edit.materia} onChange={(e) => setEdit({ ...edit, materia: e.target.value })} className={inputCls}><option value={0}>Sin tramo (voluntario)</option>{tabla('materia').map((x) => <option key={x.n} value={x.n}>{x.n} al mes · {clp(x.monto)}</option>)}</select></Field>
          </div>
          <div className="flex gap-2"><Btn v="primary" onClick={guardar}>Guardar</Btn><Btn onClick={() => setEdit(null)}>Cancelar</Btn></div>
        </>) : <p className="m-0 text-[13.5px] text-ink2">Se paga por mes. Si completas tu tramo, cobras su monto fijo. Si no llegas, cobras justo los que revisaste, a la tarifa del tramo que alcanzaste. Bajo el mínimo no se paga.</p>}
      </section>
    </div>
  );
}

/* ── Mis borradores: los que subí, y subir uno nuevo ── */
function MisBorradores({ p }) {
  const { abrirBorrador, editarBorrador } = useApp();
  const mios = useBorradores(p.uid, false);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Btn v="primary" icon="plus" onClick={() => editarBorrador({ tipo: 'protocolo' })}>Subir borrador de procedimiento</Btn>
        {(p.esRevisorVerificado || p.esDocente) && <Btn icon="plus" onClick={() => editarBorrador({ tipo: 'materia' })}>Subir borrador de materia</Btn>}
      </div>
      <p className="m-0 text-[13px] text-ink2">Un borrador de procedimiento lo puede subir cualquier estudiante, dentista o especialista que haya hecho ese procedimiento. La materia la suben especialistas y docentes. Lo ven solo los especialistas y docentes hasta que el panel lo apruebe.</p>
      {mios === null ? <div className="h-32 animate-pulse rounded-[22px] bg-soft" /> : !mios.length ? <Vacio icon="folder" titulo="Todavía no subes borradores" /> : mios.map((b) => (
        <button key={b.id} type="button" onClick={() => abrirBorrador(b.id)} className="flex flex-wrap items-center gap-3 rounded-[18px] bg-card px-4 py-3 text-left shadow-sh hover:bg-soft">
          <span className="rounded-full bg-acentosoft px-2.5 py-1 text-[11.5px] font-bold text-acentodeep">{TIPO[b.tipo]}</span>
          <span className="min-w-0 flex-1"><b className="block truncate text-[15px] text-ink">{b.titulo}</b><span className="block text-[12.5px] text-ink3">{b.especialidad} · ronda {b.ronda} de {RONDAS}</span></span>
          <EstadoPastilla estado={b.estado} />
        </button>
      ))}
    </div>
  );
}

/* ── Cómo funciona: el camino de un borrador, quién hace qué y los tramos ── */
function ComoFunciona({ p }) {
  const { go } = useApp();
  const config = useConfigRevisores();
  const PERM = [['Subir un borrador de procedimiento', 'Estudiantes, dentistas y especialistas que hayan hecho ese procedimiento'], ['Subir un borrador de materia', 'Especialistas y docentes'], ['Ver los borradores', 'Solo especialistas y docentes verificados'], ['Revisar, corregir y validar', 'Revisores verificados de la especialidad (nunca el autor)'], ['Ver lo publicado', 'Estudiantes y profesionales suscritos, clínicas e investigaciones que contratan Criterium']];
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5 shadow-sh">
        <p className="rotulo m-0">El camino de un borrador</p>
        <ol className="m-0 grid list-none gap-2 p-0 sm:grid-cols-4">{ESTADOS_BORRADOR.map((e, k) => <li key={e.v} className="rounded-[14px] bg-soft px-3 py-3"><b className="block text-[22px] font-extrabold text-acento">{k + 1}</b><b className="block text-[14px] text-ink">{e.t}</b><span className="text-[12.5px] text-ink2">{['Lo sube quien hizo el procedimiento.', `Ronda 1: el panel puntúa cada paso.`, 'El autor corrige y va a la ronda 2.', 'Con consenso, el equipo lo publica.'][k]}</span></li>)}</ol>
        <p className="m-0 text-[13px] text-ink2">Panel de {PANEL.protocolo} especialistas por procedimiento y {PANEL.materia} por material. Siempre {RONDAS} rondas. Un paso se aprueba si al menos el {Math.round(UMBRAL * 100)} % pone 4 o 5 en pertinencia, claridad y respaldo. Las rondas pueden ser a distancia o en vivo.</p>
      </section>
      <section className="overflow-hidden rounded-[22px] bg-card shadow-sh">
        <p className="rotulo m-0 px-5 pb-2 pt-4">Quién puede hacer qué</p>
        {PERM.map(([a, q]) => <div key={a} className="grid gap-1 border-t border-line2 px-5 py-2.5 text-[13.5px] sm:grid-cols-[1fr_1.4fr]"><b className="text-ink">{a}</b><span className="text-ink2">{q}</span></div>)}
      </section>
      <section className="grid gap-4 [&>*]:min-w-0 md:grid-cols-2">
        {[['protocolo', 'Procedimientos al mes', 'Cada procedimiento son 2 rondas (60 a 90 min en total).'], ['materia', 'Materiales al mes', 'Cada material toma unos 240 min.']].map(([tipo, t, nota]) => (
          <div key={tipo} className="flex flex-col gap-2 rounded-[22px] bg-card p-5 shadow-sh">
            <p className="rotulo m-0">Tramos · {t}</p>
            {tramos(tipo, config).map((x) => <div key={x.n} className="flex justify-between border-b border-line2 py-1.5 text-[14px] last:border-0"><span className="text-ink2">{x.n} al mes</span><b className="tabular-nums text-ink">{clp(x.monto)} / mes</b></div>)}
            <p className="m-0 text-[12px] text-ink3">{nota} Se paga por mes: si no completas el tramo, cobras justo los que revisaste. Bajo el mínimo no se paga.</p>
          </div>
        ))}
      </section>
      <section className="flex flex-col gap-2 rounded-[22px] bg-acentosoft p-5">
        <b className="text-[15px] text-acentodeep">Además del pago</b>
        <p className="m-0 text-[13.5px] leading-relaxed text-ink2">Tu firma en cada procedimiento validado, certificado por revisión, insignia de revisor en tu perfil y ranking por especialidad.</p>
        {!p.veTodo && <Btn v="primary" className="self-start" onClick={() => go('contacto')}>Postular como revisor</Btn>}
        {!p.veTodo && <p className="m-0 text-[12px] text-ink3">El equipo verifica tu título de especialista o tu cargo docente antes de darte acceso.</p>}
      </section>
    </div>
  );
}

/* ── Subir o editar un borrador ── */
const bandejaATexto = (b) => (b || []).map((f) => `# ${f.fase}\n${(f.items || []).join('\n')}`).join('\n');
const textoABandeja = (t) => { const out = []; String(t || '').split('\n').forEach((l) => { const x = l.trim(); if (!x) return; if (x.startsWith('#')) out.push({ fase: x.replace(/^#+\s*/, ''), items: [] }); else { if (!out.length) out.push({ fase: 'Bandeja', items: [] }); out[out.length - 1].items.push(x); } }); return out; };
const pasoVacio = () => ({ corto: '', hacer: '', listo: '', porque: '', fuentes: '' });

export function EditarBorrador() {
  const { borradorId, borradorTipo, myUid, perfil, avisar, abrirBorrador, irRevisores } = useApp();
  const previo = useBorrador(borradorId);
  const tipo = (previo && previo.tipo) || borradorTipo || 'protocolo';
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');
  const [guardando, setGuardando] = useState(false);
  useEffect(() => {
    if (borradorId && previo === undefined) return;
    const c = (previo && previo.contenido) || {};
    setF({ titulo: (previo && previo.titulo) || '', especialidad: (previo && previo.especialidad) || ESPECIALIDADES_REV[0], declaracion: !!(previo && previo.declaracion), alcance: c.alcance || '', bandeja: bandejaATexto(c.bandeja), pasos: (c.pasos && c.pasos.length ? c.pasos : [pasoVacio()]).map((p) => ({ ...pasoVacio(), ...p })), resumen: c.resumen || '', fuentes: c.fuentes || 0, html: c.html || '', archivo: '' });
  }, [previo]);
  if (!f) return <div className="h-64 animate-pulse rounded-[22px] bg-soft" />;
  const set = (k, v) => setF({ ...f, [k]: v });
  const setPaso = (i, k, v) => setF({ ...f, pasos: f.pasos.map((p, j) => (j === i ? { ...p, [k]: v } : p)) });
  const leerHtml = (file) => { if (!file) return; if (file.size > 880000) { setErr('El archivo pesa más de 880 KB: aligéralo (sin imágenes incrustadas pesadas).'); return; } const r = new FileReader(); r.onload = () => setF((x) => ({ ...x, html: String(r.result), archivo: file.name })); r.readAsText(file); };
  const datos = () => ({
    tipo, titulo: f.titulo.trim(), especialidad: f.especialidad, declaracion: tipo === 'protocolo' ? f.declaracion : false,
    autor: { uid: myUid, nombre: (perfil && perfil.nombre) || 'Autor', rol: (perfil && perfil.rol) || '' },
    contenido: tipo === 'protocolo'
      ? { alcance: f.alcance.trim(), bandeja: textoABandeja(f.bandeja), pasos: f.pasos.filter((p) => p.corto.trim()).map((p) => ({ corto: p.corto.trim(), hacer: p.hacer.trim(), listo: p.listo.trim(), porque: p.porque.trim(), fuentes: p.fuentes.trim() })) }
      : { resumen: f.resumen.trim(), fuentes: Math.max(0, Math.round(+f.fuentes || 0)), html: f.html }
  });
  const validar = () => {
    if (f.titulo.trim().length < 6) return 'Escribe un título.';
    if (tipo === 'protocolo' && !f.declaracion) return 'Para subir un procedimiento tienes que haber hecho ese procedimiento.';
    if (tipo === 'protocolo' && !datos().contenido.pasos.length) return 'Agrega al menos un paso.';
    if (tipo === 'materia' && !f.html) return 'Sube el archivo HTML de la clase.';
    return '';
  };
  const guardar = async (enviar) => {
    const e = validar(); if (e) { setErr(e); return; }
    setErr(''); setGuardando(true);
    try {
      const d = datos();
      let id = borradorId;
      if (id) { const { autor, tipo: _t, ...resto } = d; await guardarBorradorFS(id, resto); } else id = await crearBorradorFS(d);
      if (enviar) await enviarARevisionFS({ id, ronda: (previo && previo.ronda) || 0 });
      avisar(enviar ? `Enviado a la ronda ${((previo && previo.ronda) || 0) + 1}` : 'Borrador guardado');
      abrirBorrador(id);
    } catch (x) { setErr('No se pudo guardar. Revisa tu conexión.'); setGuardando(false); }
  };
  const ronda = (previo && previo.ronda) || 0;
  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-4">
      <button type="button" onClick={() => irRevisores('mios')} className="inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1.5 text-[13.5px] font-semibold text-acento hover:bg-soft"><Ic n="back" s={16} />Mis borradores</button>
      <h1 className="m-0 text-[26px] font-bold tracking-[-.02em] text-deep">{borradorId ? 'Editar borrador' : tipo === 'protocolo' ? 'Subir borrador de procedimiento' : 'Subir borrador de materia'}</h1>
      {previo && previo.estado === 'correcciones' && <p className="m-0 rounded-[14px] bg-warnsoft px-4 py-3 text-[13.5px] text-warn">El panel pidió correcciones: revísalas en el borrador, corrige aquí y envíalo a la ronda 2.</p>}
      <section className="grid gap-3 rounded-[22px] bg-card p-5 shadow-sh sm:grid-cols-2">
        <Field label="Título" id="bo-t" className="sm:col-span-2"><input id="bo-t" value={f.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder={tipo === 'protocolo' ? 'Ej.: Pulpotomía en molar temporal' : 'Ej.: Oclusión en prótesis total'} className={inputCls} /></Field>
        <Field label="Especialidad" id="bo-e"><select id="bo-e" value={f.especialidad} onChange={(e) => set('especialidad', e.target.value)} className={inputCls}>{ESPECIALIDADES_REV.map((x) => <option key={x}>{x}</option>)}</select></Field>
        {tipo === 'materia' && <Field label="Número de fuentes citadas" id="bo-f"><input id="bo-f" type="number" min="0" value={f.fuentes} onChange={(e) => set('fuentes', e.target.value)} className={inputCls} /></Field>}
      </section>
      {tipo === 'protocolo' ? (<>
        <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5 shadow-sh">
          <Field label="Alcance: para qué caso sirve y para cuál no" id="bo-a"><textarea id="bo-a" rows={3} value={f.alcance} onChange={(e) => set('alcance', e.target.value)} className={inputCls} /></Field>
          <Field label="Bandeja: un material por línea; las fases empiezan con #" id="bo-b"><textarea id="bo-b" rows={6} value={f.bandeja} onChange={(e) => set('bandeja', e.target.value)} placeholder={'# Aislamiento\nDique de goma\nClamps\n# Restauración\nResina compuesta'} className={inputCls} /></Field>
        </section>
        {f.pasos.map((p, i) => (
          <section key={i} className="flex flex-col gap-2.5 rounded-[22px] bg-card p-5 shadow-sh">
            <div className="flex items-center justify-between"><p className="rotulo m-0">Paso {i + 1}</p>{f.pasos.length > 1 && <button type="button" onClick={() => setF({ ...f, pasos: f.pasos.filter((_, j) => j !== i) })} className="text-[12.5px] font-semibold text-bad">Quitar</button>}</div>
            <Field label="Nombre corto" id={'bp-c' + i}><input id={'bp-c' + i} value={p.corto} onChange={(e) => setPaso(i, 'corto', e.target.value)} placeholder="Ej.: Aísla con dique de goma" className={inputCls} /></Field>
            <Field label="Qué hacer" id={'bp-h' + i}><textarea id={'bp-h' + i} rows={2} value={p.hacer} onChange={(e) => setPaso(i, 'hacer', e.target.value)} className={inputCls} /></Field>
            <Field label="Terminaste cuando" id={'bp-l' + i}><input id={'bp-l' + i} value={p.listo} onChange={(e) => setPaso(i, 'listo', e.target.value)} className={inputCls} /></Field>
            <Field label="¿Por qué?" id={'bp-p' + i}><textarea id={'bp-p' + i} rows={2} value={p.porque} onChange={(e) => setPaso(i, 'porque', e.target.value)} className={inputCls} /></Field>
            <Field label="Fuentes (una por línea, con DOI o PMID si lo tienes)" id={'bp-f' + i} hint="Sin fuente, el paso queda como práctica habitual · sin estudio que la compare"><textarea id={'bp-f' + i} rows={2} value={p.fuentes} onChange={(e) => setPaso(i, 'fuentes', e.target.value)} className={inputCls} /></Field>
          </section>
        ))}
        <Btn icon="plus" className="self-start" onClick={() => setF({ ...f, pasos: [...f.pasos, pasoVacio()] })}>Agregar paso</Btn>
        <label className="flex items-start gap-3 rounded-[18px] bg-card p-4 shadow-sh"><input type="checkbox" checked={f.declaracion} onChange={(e) => set('declaracion', e.target.checked)} className="mt-0.5 h-4 w-4 flex-none accent-[var(--acento)]" /><span className="text-[13.5px] text-ink">Declaro que he realizado este procedimiento y que este borrador no incluye datos de pacientes.</span></label>
      </>) : (
        <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5 shadow-sh">
          <Field label="Resumen" id="bo-r"><textarea id="bo-r" rows={3} value={f.resumen} onChange={(e) => set('resumen', e.target.value)} className={inputCls} /></Field>
          <Field label="Archivo HTML de la clase" id="bo-h" hint="Una clase autocontenida e interactiva, con sus fuentes. Máximo 880 KB."><input id="bo-h" type="file" accept=".html,text/html" onChange={(e) => leerHtml(e.target.files[0])} className="text-[13.5px]" /></Field>
          {f.html && <><p className="m-0 text-[12.5px] text-ink3">{f.archivo || 'Archivo cargado'} · vista previa:</p><iframe title="Vista previa" srcDoc={f.html} sandbox="allow-scripts" className="h-[420px] w-full rounded-[14px] border border-line" /></>}
        </section>
      )}
      {err && <p className="m-0 rounded-[12px] bg-badsoft px-4 py-2.5 text-[13.5px] font-semibold text-bad">{err}</p>}
      <div className="flex flex-wrap gap-2">
        <Btn disabled={guardando} onClick={() => guardar(false)}>Guardar borrador</Btn>
        {ronda < RONDAS && <Btn v="primary" icon="send" disabled={guardando} onClick={() => guardar(true)}>Enviar a la ronda {ronda + 1}</Btn>}
      </div>
    </div>
  );
}

/* ── Un borrador: contenido, consenso por ronda, revisión del panel y acciones del equipo ── */
export function VistaBorrador() {
  const { borradorId, myUid, perfil, avisar, editarBorrador, irRevisores, abrirProto } = useApp();
  const p = usePermisos();
  const b = useBorrador(borradorId);
  const esAutor = !!(b && b.autor && b.autor.uid === myUid);
  const revs = useRevisionesBorrador(b && b.id, myUid, !p.veTodo && esAutor);
  const ramos = useMateria(!!(p.esAdmin && b && b.tipo === 'materia'));
  if (b === undefined || p.cargando) return <div className="h-64 animate-pulse rounded-[22px] bg-soft" />;
  if (!b) return <Vacio icon="folder" titulo="No encontramos este borrador, o no tienes acceso" accion={<Btn onClick={() => irRevisores()}>Volver a Revisores</Btn>}>Los borradores los ven solo los especialistas y docentes verificados, y su autor.</Vacio>;
  const mia = (revs || []).find((r) => r.revisor.uid === myUid && r.ronda === b.ronda);
  const revisa = puedeRevisar(b, { uid: myUid, especialidades: p.especialidades }) && !mia;
  const c = b.contenido || {};
  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-4">
      <button type="button" onClick={() => irRevisores(esAutor && !p.veTodo ? 'mios' : undefined)} className="inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1.5 text-[13.5px] font-semibold text-acento hover:bg-soft"><Ic n="back" s={16} />Revisores</button>
      <header className="flex flex-col gap-3 rounded-[24px] bg-card p-5 shadow-sh">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-acentosoft px-2.5 py-1 text-[11.5px] font-bold text-acentodeep">{TIPO[b.tipo]} · borrador</span><EstadoPastilla estado={b.estado} /><span className="text-[12.5px] text-ink3">{b.especialidad} · ronda {b.ronda} de {RONDAS}</span></div>
        <h1 className="m-0 text-[24px] font-bold tracking-[-.02em] text-deep">{b.titulo}</h1>
        <p className="m-0 flex items-center gap-2 text-[13px] text-ink2"><Avatar nombre={b.autor.nombre} size={26} />Subido por {b.autor.nombre}{b.autor.rol ? ' · ' + b.autor.rol : ''}{b.declaracion ? ' · declara haber hecho el procedimiento' : ''}</p>
        <ol className="m-0 flex list-none flex-wrap gap-1.5 p-0">{ESTADOS_BORRADOR.map((e) => { const orden = ESTADOS_BORRADOR.findIndex((x) => x.v === b.estado), k = ESTADOS_BORRADOR.findIndex((x) => x.v === e.v); return <li key={e.v} className={cx('rounded-full px-3 py-1 text-[12px] font-semibold', k < orden ? 'bg-oksoft text-ok' : k === orden ? 'bg-deep text-onc' : 'bg-soft text-ink3')}>{e.t}</li>; })}</ol>
        {esAutor && ['borrador', 'correcciones'].includes(b.estado) && <div className="flex flex-wrap gap-2"><Btn v="primary" icon="edit" onClick={() => editarBorrador({ id: b.id })}>{b.estado === 'correcciones' ? 'Corregir y enviar a la ronda 2' : 'Editar y enviar a revisión'}</Btn>{b.estado === 'borrador' && <Btn v="ghost" onClick={async () => { await borrarBorradorFS(b.id); avisar('Borrador eliminado'); irRevisores('mios'); }}>Eliminar</Btn>}</div>}
        {b.estado === 'aprobado' && b.tipo === 'protocolo' && b.publicadoId && <Btn v="primary" icon="book" className="self-start" onClick={() => abrirProto(b.publicadoId)}>Ver el procedimiento publicado</Btn>}
      </header>

      {b.tipo === 'protocolo' ? (
        <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5 shadow-sh">
          {c.alcance && <p className="m-0 text-[14px] leading-relaxed text-ink2"><b className="text-ink">Alcance:</b> {c.alcance}</p>}
          {(c.bandeja || []).length > 0 && <details className="rounded-[12px] bg-soft px-3 py-2 text-[13px]"><summary className="cursor-pointer font-semibold text-acento">Bandeja</summary>{c.bandeja.map((f, k) => <p key={k} className="m-0 mt-1.5 text-ink2"><b className="text-ink">{f.fase}:</b> {f.items.join(', ')}</p>)}</details>}
          <ol className="m-0 flex list-none flex-col gap-2 p-0">{(c.pasos || []).map((x, i) => (
            <li key={i} className="rounded-[14px] border border-line2 px-3.5 py-3">
              <b className="text-[14.5px] text-ink">{i + 1}. {x.corto}</b>
              {x.hacer && <p className="m-0 mt-1 text-[13.5px] text-ink2">{x.hacer}</p>}
              {x.listo && <p className="m-0 mt-1 text-[13px] text-ok"><b>Terminaste cuando:</b> {x.listo}</p>}
              {x.porque && <p className="m-0 mt-1 text-[13px] text-ink2"><b>¿Por qué?</b> {x.porque}</p>}
              <p className="m-0 mt-1 text-[12px] text-ink3">{x.fuentes ? 'Fuentes: ' + x.fuentes.split('\n').join(' · ') : 'Sin fuente: práctica habitual · sin estudio que la compare'}</p>
            </li>
          ))}</ol>
        </section>
      ) : (
        <section className="flex flex-col gap-2 rounded-[22px] bg-card p-5 shadow-sh">
          {c.resumen && <p className="m-0 text-[14px] text-ink2">{c.resumen}</p>}
          <p className="m-0 text-[12.5px] text-ink3">{c.fuentes || 0} fuentes citadas</p>
          {c.html ? <iframe title={b.titulo} srcDoc={c.html} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" className="h-[70vh] w-full rounded-[14px] border border-line" /> : <p className="m-0 text-[13px] text-ink3">Sin archivo.</p>}
        </section>
      )}

      {(p.veTodo || esAutor) && revs && Array.from({ length: RONDAS }, (_, k) => k + 1).filter((r) => r <= b.ronda).map((r) => <PanelRonda key={r} b={b} revs={revs} ronda={r} />)}
      {revisa && <FormRevisionBorrador b={b} />}
      {mia && <p className="m-0 rounded-[14px] bg-oksoft px-4 py-3 text-[13.5px] text-ok">Ya enviaste tu revisión de la ronda {b.ronda}. Cuenta para tu tramo cuando completes las 2 rondas.</p>}
      {!revisa && !mia && p.esRevisorVerificado && b.estado === 'revision' && !p.especialidades.includes(b.especialidad) && <p className="m-0 text-[13px] text-ink3">Este borrador es de {b.especialidad}: lo revisan los especialistas de esa área.</p>}
      {p.esAdmin && <AccionesEquipo b={b} revs={revs || []} ramos={ramos || []} />}
    </div>
  );
}

function PanelRonda({ b, revs, ronda }) {
  const cs = consenso(b, revs, ronda);
  const delaRonda = revs.filter((r) => r.ronda === ronda);
  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5 shadow-sh">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><p className="rotulo m-0">Ronda {ronda} · panel {cs.n} de {cs.minimo}</p><b className={cx('text-[13px]', cs.aprobado ? 'text-ok' : cs.completo ? 'text-bad' : 'text-ink3')}>{cs.aprobado ? 'Consenso alcanzado' : cs.completo ? 'Sin consenso en todos los pasos' : 'Esperando al panel'}</b></div>
      {cs.n > 0 && <div className="flex flex-col gap-1.5">{cs.items.map((it) => <div key={it.i} className="flex items-center gap-3 text-[13px]"><span className="min-w-0 flex-1 truncate text-ink">{it.t}</span><span className="h-2 w-32 overflow-hidden rounded-full bg-soft"><span className={cx('block h-full rounded-full', it.ok ? 'bg-ok' : 'bg-warn')} style={{ width: it.acuerdo * 100 + '%' }} /></span><b className={cx('w-12 text-right tabular-nums', it.ok ? 'text-ok' : 'text-warn')}>{Math.round(it.acuerdo * 100)} %</b></div>)}</div>}
      {delaRonda.map((r) => (
        <article key={r.id} className="rounded-[14px] bg-soft px-3.5 py-3">
          <p className="m-0 text-[12.5px] font-semibold text-ink2">{r.revisor.nombre} · {fechaCorta(r.fecha)}</p>
          <p className="m-0 mt-1 text-[13.5px] text-ink">{r.comentario}</p>
          {(r.correcciones || []).filter((x) => x.txt).map((x, k) => <p key={k} className="m-0 mt-1 text-[13px] text-warn"><b>{(itemsRevision(b).find((it) => it.i === x.i) || {}).t}:</b> {x.txt}</p>)}
        </article>
      ))}
    </section>
  );
}

function FormRevisionBorrador({ b }) {
  const { myUid, perfil, avisar } = useApp();
  const items = itemsRevision(b);
  const [puntajes, setPuntajes] = useState(items.map((it) => ({ i: it.i, pertinencia: 0, claridad: 0, respaldo: 0 })));
  const [corr, setCorr] = useState({});
  const [comentario, setComentario] = useState('');
  const [err, setErr] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const setP = (i, k, v) => setPuntajes(puntajes.map((p) => (p.i === i ? { ...p, [k]: +v } : p)));
  const enviar = async () => {
    const e = validarRevision(b, puntajes, comentario); setErr(e); if (e.length) return;
    setEnviando(true);
    try { await enviarRevisionPanelFS(b, { uid: myUid, nombre: (perfil && perfil.nombre) || 'Revisor' }, puntajes, Object.entries(corr).filter(([, t]) => t.trim()).map(([i, txt]) => ({ i: +i, txt: txt.trim() })), comentario); avisar('Revisión enviada'); }
    catch (x) { setErr(['No se pudo enviar: puede que ya la hayas enviado o que la ronda haya cerrado.']); setEnviando(false); }
  };
  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5 shadow-sh ring-2 ring-acentosoft">
      <p className="rotulo m-0">Tu revisión · ronda {b.ronda}</p>
      <p className="m-0 text-[13px] text-ink2">Puntúa cada {b.tipo === 'protocolo' ? 'paso' : 'criterio'} de 1 a 5. Con 4 o 5 en los tres, el paso cuenta como aprobado. Si algo hay que corregir, escríbelo junto al paso.</p>
      {items.map((it) => (
        <div key={it.i} className="flex flex-col gap-2 rounded-[14px] border border-line2 px-3.5 py-3">
          <b className="text-[14px] text-ink">{it.t}</b>
          {CRITERIOS.map(([k, t]) => <div key={k} className="flex flex-wrap items-center gap-2"><span className="w-44 text-[12.5px] text-ink2">{t}</span><Seg size="sm" valor={(puntajes.find((p) => p.i === it.i) || {})[k]} onChange={(v) => setP(it.i, k, v)} opciones={[1, 2, 3, 4, 5].map((n) => ({ v: n, t: String(n) }))} /></div>)}
          <input value={corr[it.i] || ''} onChange={(e) => setCorr({ ...corr, [it.i]: e.target.value })} placeholder="Corrección (opcional)" aria-label={'Corrección de ' + it.t} className={inputCls} />
        </div>
      ))}
      <Field label="Comentario general (mínimo 40 caracteres)" id="rv-c"><textarea id="rv-c" rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)} className={inputCls} /></Field>
      {err.map((x) => <p key={x} className="m-0 text-[13px] font-semibold text-bad">{x}</p>)}
      <Btn v="primary" icon="send" className="self-start" disabled={enviando} onClick={enviar}>Enviar revisión</Btn>
      <p className="m-0 text-[12px] text-ink3">Queda a tu nombre y no se puede editar. Tu firma aparecerá en el procedimiento si se publica.</p>
    </section>
  );
}

function AccionesEquipo({ b, revs, ramos }) {
  const { avisar } = useApp();
  const [ramo, setRamo] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const cs = consenso(b, revs, b.ronda);
  const validadoPor = [...new Set(revs.filter((r) => r.ronda === RONDAS).map((r) => r.revisor.nombre))];
  const hacer = async (fn, msg) => { setTrabajando(true); try { await fn(); avisar(msg); } catch (e) { avisar('No se pudo: ' + (e.code || e.message), 'warn'); } setTrabajando(false); };
  if (b.estado !== 'revision') return null;
  return (
    <section className="flex flex-col gap-3 rounded-[22px] border-2 border-dashed border-line bg-card p-5">
      <p className="rotulo m-0">Equipo Criterium · filtro final</p>
      <p className="m-0 text-[13px] text-ink2">Ronda {b.ronda}: {cs.n} de {cs.minimo} revisiones. {cs.aprobado ? 'El panel alcanzó consenso.' : cs.completo ? 'El panel no alcanzó consenso en todos los pasos.' : 'Faltan revisiones del panel.'}</p>
      <div className="flex flex-wrap items-end gap-2">
        {b.ronda < RONDAS && <Btn disabled={trabajando} onClick={() => hacer(() => cerrarRondaFS(b, 'correcciones', `Ronda ${b.ronda} cerrada: vuelve al autor con las correcciones`), 'Ronda cerrada: vuelve al autor')}>Cerrar la ronda {b.ronda} y enviar correcciones</Btn>}
        {b.ronda === RONDAS && b.tipo === 'materia' && <select value={ramo} onChange={(e) => setRamo(e.target.value)} aria-label="Ramo donde publicar" className={cx(inputCls, 'max-w-[240px]')}><option value="">Elige el ramo…</option>{ramos.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}</select>}
        {b.ronda === RONDAS && <Btn v="primary" disabled={trabajando || !cs.aprobado || (b.tipo === 'materia' && !ramo)} onClick={() => hacer(() => publicarBorradorFS(b, { validadoPor, ramo }), 'Aprobado y publicado')}>Aprobar y publicar</Btn>}
        {b.ronda === RONDAS && <Btn v="ghost" disabled={trabajando} onClick={() => hacer(() => cerrarRondaFS(b, 'correcciones', 'Sin acuerdo experto tras 2 rondas'), 'Cerrado sin acuerdo')}>Cerrar sin acuerdo</Btn>}
      </div>
      {b.ronda === RONDAS && !cs.aprobado && <p className="m-0 text-[12px] text-ink3">«Aprobar y publicar» se activa con el consenso del panel ({PANEL[b.tipo]} revisiones y ≥ {Math.round(UMBRAL * 100)} % en cada paso).</p>}
    </section>
  );
}
