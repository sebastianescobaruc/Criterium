// Ficha clínica, partes de detalle: plan de tratamiento por fases (con sugerencias desde el odontograma y que genera el
// presupuesto), periodontograma guardado en la ficha, órdenes de laboratorio del paciente y próximo control + convenio.
import React, { useEffect, useState } from 'react';
import { useApp } from '../ctx.js';
import { useColeccionClinica, useFicha, crearEn, actualizarEn, guardarFichaFS, guardarPacienteFS, guardarPresupuestoFS } from './db.js';
import { Periodontograma } from '../views/periodontograma.jsx';
import { imprimirHoja, tablaHtml } from './documentos.js';
import { clp, hoy, diasHasta, fechaCorta, nombreDe, clinico, yoComo } from './comun.jsx';
import { Ic, Btn, Modal, Field, Vacio, inputCls, cx } from '../ui.jsx';

const FASES_BASE = ['Fase 1 · Urgencias y control de infección', 'Fase 2 · Periodontal y restauradora', 'Fase 3 · Rehabilitación', 'Mantención'];
export const ESTADOS_PLAN = ['borrador', 'presentado', 'aceptado', 'en curso', 'terminado'];
const nid = () => Math.random().toString(36).slice(2, 9);
const totalPlan = (pl) => (pl.fases || []).flatMap((f) => f.items || []).reduce((s, i) => s + (+i.valor || 0), 0);
const desc = (clinica, p) => (((clinica.convenios || []).find((c) => c.nombre === p.convenio) || {}).descuento || 0);

// Sugerencias desde el odontograma: caries → resina; extracción indicada → exodoncia
function sugerencias(od, arancel) {
  const val = (n) => ((arancel || []).find((a) => a.nombre === n) || {}).valor || '';
  const l = [];
  Object.entries(od || {}).forEach(([d, x]) => {
    const caras = Object.entries(x.caras || {}).filter(([, v]) => v === 'caries').map(([c]) => c);
    const pieza = d.length === 2 ? d[0] + '.' + d[1] : d;
    if (caras.length) { const t = caras.length > 1 ? 'Resina compuesta dos caras' : 'Resina compuesta una cara'; l.push({ diente: pieza, tratamiento: t + ' (' + caras.join('') + ')', valor: val(t) }); }
    if (x.estado === 'extraccion') l.push({ diente: pieza, tratamiento: 'Exodoncia simple', valor: val('Exodoncia simple') });
  });
  return l;
}

export function PlanTratamiento({ p }) {
  const { clinica, rolClinica, pacienteId, myUid, perfil, avisar } = useApp();
  const planes = useColeccionClinica(clinica.id, 'planes', 'pacienteId', pacienteId);
  const ficha = useFicha(clinica.id, pacienteId, clinico(rolClinica));
  const [editar, setEditar] = useState(null);
  const puede = clinico(rolClinica);
  if (planes === null) return <div className="h-40 animate-pulse rounded-[22px] bg-soft" />;
  const nuevo = () => {
    const sug = sugerencias(ficha && ficha.odontograma, clinica.arancel);
    setEditar({ estado: 'borrador', fases: FASES_BASE.map((n, k) => ({ nombre: n, items: k === 1 ? sug.map((x) => ({ ...x, id: nid(), estado: 'pendiente' })) : [] })) });
  };
  return (
    <div className="flex flex-col gap-4">
      {puede && <div className="flex flex-wrap gap-2"><Btn v="primary" icon="plus" onClick={nuevo}>Nuevo plan de tratamiento</Btn></div>}
      {!planes.length ? <Vacio icon="copy" titulo="Sin plan de tratamiento">Arma el plan por fases: Criterium sugiere las prestaciones desde lo marcado en el odontograma (caries y extracciones indicadas), y del plan sale el presupuesto.</Vacio>
        : planes.map((pl) => <PlanCard key={pl.id} pl={pl} p={p} puede={puede} editar={() => setEditar(pl)} />)}
      {editar && <EditorPlan inicial={editar} p={p} cerrar={() => setEditar(null)} ficha={ficha} />}
    </div>
  );
}

function PlanCard({ pl, p, puede, editar }) {
  const { clinica, myUid, perfil, avisar } = useApp();
  const items = (pl.fases || []).flatMap((f) => f.items || []);
  const hechos = items.filter((i) => i.estado === 'realizado').length;
  const d = desc(clinica, p), total = totalPlan(pl);
  const toggle = async (fi, ii) => {
    const fases = pl.fases.map((f, a) => (a !== fi ? f : { ...f, items: f.items.map((i, b) => (b !== ii ? i : { ...i, estado: i.estado === 'realizado' ? 'pendiente' : 'realizado', realizado: i.estado === 'realizado' ? null : hoy() })) }));
    const todos = fases.flatMap((f) => f.items);
    const estado = todos.length && todos.every((i) => i.estado === 'realizado') ? 'terminado' : todos.some((i) => i.estado === 'realizado') ? 'en curso' : pl.estado;
    try { await actualizarEn(clinica.id, 'planes', pl.id, { fases, estado }); } catch (e) { avisar('No se pudo guardar.', 'warn'); }
  };
  const estado = async (v) => { try { await actualizarEn(clinica.id, 'planes', pl.id, { estado: v }); } catch (e) { avisar('No se pudo cambiar.', 'warn'); } };
  const presupuesto = async () => {
    const pend = items.filter((i) => i.estado !== 'realizado' && i.tratamiento);
    if (!pend.length) { avisar('No quedan prestaciones pendientes.', 'warn'); return; }
    const lista = pend.map((i) => ({ diente: i.diente || '', tratamiento: i.tratamiento, valor: Math.round(+i.valor || 0) }));
    if (d) lista.push({ diente: '', tratamiento: `Descuento convenio ${p.convenio} (${d} %)`, valor: -Math.round(lista.reduce((s, x) => s + x.valor, 0) * d / 100) });
    try {
      await guardarPresupuestoFS(clinica.id, { pacienteId: pl.pacienteId, pacienteNombre: pl.pacienteNombre, planId: pl.id, items: lista, total: lista.reduce((s, x) => s + x.valor, 0), estado: 'propuesto', profesionalId: pl.profesionalId || '', profesional: yoComo(myUid, perfil) });
      avisar('Presupuesto creado desde el plan (pestaña Presupuestos)');
    } catch (e) { avisar('No se pudo crear el presupuesto.', 'warn'); }
  };
  const imprimir = () => imprimirHoja({ clinica: clinica.nombre, demo: clinica.demo, titulo: 'Plan de tratamiento · ' + pl.pacienteNombre,
    cuerpoHtml: (pl.fases || []).filter((f) => (f.items || []).length).map((f) => `<h3 style="font-size:12pt;margin:14px 0 4px">${f.nombre}</h3>` + tablaHtml(f.items.map((i) => ({ ...i, valorTxt: clp(i.valor) })), clp(f.items.reduce((s, i) => s + (+i.valor || 0), 0)))).join('') + `<p style="margin-top:14px"><b>Total del plan: ${clp(total)}</b>${d ? ` · Convenio ${p.convenio}: ${d} % de descuento` : ''}</p>` });
  return (
    <article className="flex flex-col gap-4 rounded-[22px] bg-card p-5 shadow-sh">
      <div className="flex flex-wrap items-center gap-2">
        <b className="text-[16px] text-ink">Plan del {new Date(pl.fecha).toLocaleDateString('es-CL', { dateStyle: 'medium' })}</b>
        <select value={pl.estado || 'borrador'} disabled={!puede} onChange={(e) => estado(e.target.value)} aria-label="Estado del plan" className="rounded-full border border-cardline bg-soft py-1 pl-3 pr-8 text-[12.5px] font-semibold capitalize text-ink2">{ESTADOS_PLAN.map((x) => <option key={x} value={x}>{x}</option>)}</select>
        <span className="ml-auto text-[18px] font-extrabold tabular-nums text-deep">{clp(total)}</span>
      </div>
      <div><div className="flex justify-between text-[12.5px] text-ink3"><span>{hechos} de {items.length} prestaciones realizadas</span>{pl.profesional && <span>{pl.profesional.nombre}</span>}</div><div className="mt-1 h-2 overflow-hidden rounded-full bg-soft"><span className="block h-full rounded-full bg-ok" style={{ width: items.length ? (hechos / items.length) * 100 + '%' : 0 }} /></div></div>
      {(pl.fases || []).filter((f) => (f.items || []).length).map((f, fi) => (
        <div key={fi} className="flex flex-col gap-1">
          <p className="rotulo m-0">{f.nombre}</p>
          {f.items.map((i, ii) => (
            <label key={i.id || ii} className={cx('flex items-center gap-3 rounded-[12px] px-2 py-2 text-[14px]', puede && 'cursor-pointer hover:bg-soft')}>
              <input type="checkbox" checked={i.estado === 'realizado'} disabled={!puede} onChange={() => toggle(pl.fases.indexOf(f), ii)} className="h-[18px] w-[18px] flex-none accent-ok" />
              <span className={cx('min-w-0 flex-1', i.estado === 'realizado' && 'text-ink3 line-through')}>{i.diente ? <b className="mr-1.5 text-ink">{i.diente}</b> : null}{i.tratamiento}</span>
              {i.realizado && <span className="text-[11.5px] text-ok">{fechaCorta(i.realizado)}</span>}
              <span className="tabular-nums text-ink2">{clp(i.valor)}</span>
            </label>
          ))}
        </div>
      ))}
      {d > 0 && <p className="m-0 text-[12.5px] text-ink2">Convenio {p.convenio}: {d} % de descuento al generar el presupuesto.</p>}
      <div className="flex flex-wrap gap-2">
        {puede && <Btn sm icon="edit" onClick={editar}>Editar plan</Btn>}
        {puede && <Btn sm v="soft" icon="dinero" onClick={presupuesto}>Generar presupuesto de lo pendiente</Btn>}
        <Btn sm icon="download" onClick={imprimir}>Imprimir</Btn>
      </div>
    </article>
  );
}

function EditorPlan({ inicial, p, cerrar, ficha }) {
  const { clinica, pacienteId, myUid, perfil, avisar } = useApp();
  const [fases, setFases] = useState(() => (inicial.fases || []).map((f) => ({ ...f, items: (f.items || []).map((i) => ({ id: i.id || nid(), estado: 'pendiente', ...i })) })));
  const [prof, setProf] = useState(inicial.profesionalId || ((clinica.profesionales || []).find((x) => x.uid === myUid) || (clinica.profesionales || [])[0] || {}).id || '');
  const valorDe = (n) => ((clinica.arancel || []).find((a) => a.nombre === n) || {}).valor;
  const setItem = (fi, ii, c) => setFases(fases.map((f, a) => (a !== fi ? f : { ...f, items: f.items.map((i, b) => (b !== ii ? i : { ...i, ...c })) })));
  const guardar = async () => {
    const limpias = fases.map((f) => ({ nombre: f.nombre.trim() || 'Fase', items: f.items.filter((i) => i.tratamiento.trim()).map((i) => ({ id: i.id, diente: (i.diente || '').trim(), tratamiento: i.tratamiento.trim(), valor: Math.round(+i.valor || 0), estado: i.estado || 'pendiente', realizado: i.realizado || null })) }));
    const datos = { fases: limpias, profesionalId: prof, total: limpias.flatMap((f) => f.items).reduce((s, i) => s + i.valor, 0) };
    try {
      if (inicial.id) await actualizarEn(clinica.id, 'planes', inicial.id, datos);
      else await crearEn(clinica.id, 'planes', { ...datos, pacienteId, pacienteNombre: nombreDe(p), estado: inicial.estado || 'borrador', profesional: yoComo(myUid, perfil) });
      avisar('Plan guardado'); cerrar();
    } catch (e) { avisar('No se pudo guardar.', 'warn'); }
  };
  const sug = sugerencias(ficha && ficha.odontograma, clinica.arancel).filter((s) => !fases.some((f) => f.items.some((i) => i.diente === s.diente && i.tratamiento === s.tratamiento)));
  return (
    <Modal open onClose={cerrar} title={inicial.id ? 'Editar plan de tratamiento' : 'Nuevo plan de tratamiento'} wide>
      <div className="flex flex-col gap-4">
        <Field label="Profesional tratante" id="pl-prof"><select id="pl-prof" value={prof} onChange={(e) => setProf(e.target.value)} className={inputCls}>{(clinica.profesionales || []).map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select></Field>
        {sug.length > 0 && (
          <div className="flex flex-col gap-2 rounded-[16px] bg-acentosoft p-3">
            <p className="m-0 text-[13px] font-semibold text-acentodeep">Desde el odontograma ({sug.length})</p>
            <div className="flex flex-wrap gap-1.5">{sug.map((s, k) => <button key={k} type="button" onClick={() => setFases(fases.map((f, a) => (a !== 1 ? f : { ...f, items: [...f.items, { ...s, id: nid(), estado: 'pendiente' }] })))} className="rounded-full bg-card px-3 py-1.5 text-[12.5px] font-semibold text-ink">+ {s.diente} · {s.tratamiento}</button>)}</div>
          </div>
        )}
        {fases.map((f, fi) => (
          <section key={fi} className="flex flex-col gap-2 rounded-[16px] bg-soft p-3">
            <div className="flex gap-2"><input value={f.nombre} onChange={(e) => setFases(fases.map((x, a) => (a === fi ? { ...x, nombre: e.target.value } : x)))} aria-label="Nombre de la fase" className={cx(inputCls, '!bg-card font-semibold')} /><button type="button" onClick={() => setFases(fases.filter((_, a) => a !== fi))} className="rounded-full px-3 text-[12.5px] font-semibold text-bad">Quitar fase</button></div>
            {f.items.map((i, ii) => (
              <div key={i.id} className="grid gap-2 sm:grid-cols-[80px_1fr_120px_auto]">
                <input value={i.diente} onChange={(e) => setItem(fi, ii, { diente: e.target.value })} placeholder="Pieza" aria-label="Pieza" className={cx(inputCls, '!bg-card')} />
                <input list="arancel-plan" value={i.tratamiento} onChange={(e) => { const v = e.target.value; setItem(fi, ii, { tratamiento: v, ...(valorDe(v) !== undefined ? { valor: valorDe(v) } : {}) }); }} placeholder="Prestación" aria-label="Prestación" className={cx(inputCls, '!bg-card')} />
                <input type="number" value={i.valor} onChange={(e) => setItem(fi, ii, { valor: e.target.value })} placeholder="Valor" aria-label="Valor" className={cx(inputCls, '!bg-card')} />
                <button type="button" onClick={() => setFases(fases.map((x, a) => (a !== fi ? x : { ...x, items: x.items.filter((_, b) => b !== ii) })))} className="rounded-full px-3 text-[12.5px] font-semibold text-bad">Quitar</button>
              </div>
            ))}
            <button type="button" onClick={() => setFases(fases.map((x, a) => (a !== fi ? x : { ...x, items: [...x.items, { id: nid(), diente: '', tratamiento: '', valor: '', estado: 'pendiente' }] })))} className="self-start rounded-full px-3 py-1 text-[13px] font-semibold text-acento hover:bg-card">+ Prestación</button>
          </section>
        ))}
        <datalist id="arancel-plan">{(clinica.arancel || []).map((a) => <option key={a.codigo} value={a.nombre} />)}</datalist>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setFases([...fases, { nombre: 'Fase ' + (fases.length + 1), items: [] }])} className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-acento hover:bg-soft">+ Fase</button>
          <b className="ml-auto text-[16px] tabular-nums text-deep">{clp(fases.flatMap((f) => f.items).reduce((s, i) => s + (+i.valor || 0), 0))}</b>
          <Btn v="primary" onClick={guardar}>Guardar plan</Btn><Btn onClick={cerrar}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ── Periodontograma de la ficha (el mismo de Herramientas, guardado en clinico/ficha.perio) ── */
export function PerioFicha() {
  const { clinica, pacienteId, avisar } = useApp();
  const ficha = useFicha(clinica.id, pacienteId, true);
  const [chart, setChart] = useState(null);
  const [cambios, setCambios] = useState(false);
  useEffect(() => { if (ficha && chart === null) setChart(ficha.perio || {}); }, [ficha]);
  if (chart === null) return <div className="h-64 animate-pulse rounded-[22px] bg-soft" />;
  const guardar = async () => { try { await guardarFichaFS(clinica.id, pacienteId, { perio: chart, perioFecha: new Date().toISOString() }); setCambios(false); avisar('Periodontograma guardado'); } catch (e) { avisar('No se pudo guardar.', 'warn'); } };
  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-card p-4 shadow-sh sm:p-5">
      <div className="flex flex-wrap items-center gap-2"><Btn v="primary" disabled={!cambios} onClick={guardar}>{cambios ? 'Guardar periodontograma' : 'Guardado'}</Btn>{ficha && ficha.perioFecha && <span className="text-[12.5px] text-ink3">Último registro: {new Date(ficha.perioFecha).toLocaleDateString('es-CL', { dateStyle: 'medium' })}</span>}</div>
      <Periodontograma chart={chart} setChart={(fn) => { setChart(fn); setCambios(true); }} onUsar={() => avisar('Para el estadio y grado, abre Herramientas › Periodoncia.')} />
    </section>
  );
}

/* ── Laboratorio: órdenes de trabajo (en la ficha y en Gestión) ── */
export const ESTADOS_LAB = [['por enviar', 'Por enviar', 'bg-soft text-ink2'], ['enviado', 'En el laboratorio', 'bg-warnsoft text-warn'], ['recibido', 'Recibido', 'bg-acentosoft text-acentodeep'], ['instalado', 'Instalado', 'bg-oksoft text-ok'], ['repetir', 'Repetir', 'bg-badsoft text-bad'], ['anulado', 'Anulado', 'bg-soft text-ink3 line-through']];
export const estLab = (v) => ESTADOS_LAB.find((e) => e[0] === v) || ESTADOS_LAB[0];
export const labAtrasado = (o) => o.entrega && ['por enviar', 'enviado', 'repetir'].includes(o.estado) && diasHasta(o.entrega) < 0;
const TRABAJOS = ['Corona', 'Incrustación', 'Carilla', 'Prótesis parcial removible', 'Prótesis total', 'Placa de relajación', 'Provisorio', 'Modelo de estudio', 'Puente'];

export function TarjetaLab({ o, mostrarPaciente }) {
  const { clinica, avisar } = useApp();
  const est = async (v) => { try { await actualizarEn(clinica.id, 'laboratorio', o.id, { estado: v, ...(v === 'recibido' ? { recibido: hoy() } : {}) }); } catch (e) { avisar('No se pudo cambiar.', 'warn'); } };
  const sig = { 'por enviar': 'enviado', enviado: 'recibido', recibido: 'instalado', repetir: 'enviado' }[o.estado];
  return (
    <article className={cx('flex flex-col gap-2 rounded-[18px] bg-card p-4 shadow-sh', labAtrasado(o) && 'ring-2 ring-bad')}>
      <div className="flex flex-wrap items-center gap-2">
        <b className="text-[15px] text-ink">{o.trabajo}{o.diente ? ' · ' + o.diente : ''}</b>
        <span className={cx('rounded-full px-2.5 py-1 text-[11.5px] font-bold', estLab(o.estado)[2])}>{estLab(o.estado)[1]}</span>
        {labAtrasado(o) && <span className="rounded-full bg-bad px-2.5 py-1 text-[11.5px] font-bold text-onc">Atrasado {-diasHasta(o.entrega)} d</span>}
      </div>
      <p className="m-0 text-[13px] text-ink2">{mostrarPaciente ? o.pacienteNombre + ' · ' : ''}{o.laboratorio}{o.color ? ' · color ' + o.color : ''}</p>
      <p className="m-0 text-[12.5px] text-ink3">Envío {o.envio ? fechaCorta(o.envio) : '—'} · Entrega {o.entrega ? fechaCorta(o.entrega) : '—'}{o.costo ? ' · ' + clp(o.costo) : ''}</p>
      {o.nota && <p className="m-0 text-[13px] text-ink2">{o.nota}</p>}
      <div className="flex flex-wrap gap-1.5">
        {sig && <Btn sm v="soft" onClick={() => est(sig)}>Marcar «{estLab(sig)[1].toLowerCase()}»</Btn>}
        {o.estado === 'recibido' && <Btn sm onClick={() => est('repetir')}>Repetir</Btn>}
        {!['instalado', 'anulado'].includes(o.estado) && <Btn sm onClick={() => est('anulado')}>Anular</Btn>}
      </div>
    </article>
  );
}

export function ModalLab({ cerrar, paciente }) {
  const { clinica, myUid, perfil, avisar } = useApp();
  const [f, setF] = useState({ trabajo: 'Corona', diente: '', laboratorio: (clinica.laboratorios || [])[0] || '', color: '', envio: hoy(), entrega: '', costo: '', nota: '', estado: 'por enviar', pacienteId: paciente ? paciente.id : '', pacienteNombre: paciente ? nombreDe(paciente) : '' });
  const guardar = async () => {
    if (!f.pacienteId) { avisar('Abre la orden desde la ficha del paciente.', 'warn'); return; }
    try { await crearEn(clinica.id, 'laboratorio', { ...f, costo: Math.round(+f.costo || 0), creadoPor: yoComo(myUid, perfil) }); avisar('Orden de laboratorio creada'); cerrar(); }
    catch (e) { avisar('No se pudo crear.', 'warn'); }
  };
  return (
    <Modal open onClose={cerrar} title="Orden de laboratorio">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Trabajo" id="lb-t"><input id="lb-t" list="trabajos" value={f.trabajo} onChange={(e) => setF({ ...f, trabajo: e.target.value })} className={inputCls} /><datalist id="trabajos">{TRABAJOS.map((t) => <option key={t} value={t} />)}</datalist></Field>
        <Field label="Pieza(s)" id="lb-d"><input id="lb-d" value={f.diente} onChange={(e) => setF({ ...f, diente: e.target.value })} className={inputCls} /></Field>
        <Field label="Laboratorio" id="lb-l"><input id="lb-l" list="labs" value={f.laboratorio} onChange={(e) => setF({ ...f, laboratorio: e.target.value })} className={inputCls} /><datalist id="labs">{(clinica.laboratorios || []).map((t) => <option key={t} value={t} />)}</datalist></Field>
        <Field label="Color o tono" id="lb-c"><input id="lb-c" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} placeholder="Ej.: A2" className={inputCls} /></Field>
        <Field label="Envío" id="lb-e"><input id="lb-e" type="date" value={f.envio} onChange={(e) => setF({ ...f, envio: e.target.value })} className={inputCls} /></Field>
        <Field label="Entrega comprometida" id="lb-r"><input id="lb-r" type="date" value={f.entrega} onChange={(e) => setF({ ...f, entrega: e.target.value })} className={inputCls} /></Field>
        <Field label="Costo del laboratorio" id="lb-$"><input id="lb-$" type="number" value={f.costo} onChange={(e) => setF({ ...f, costo: e.target.value })} className={inputCls} /></Field>
        <Field label="Indicaciones" id="lb-n" className="sm:col-span-2"><textarea id="lb-n" rows={3} value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} className={inputCls} /></Field>
        <div className="flex gap-2 sm:col-span-2"><Btn v="primary" onClick={guardar}>Crear orden</Btn><Btn onClick={cerrar}>Cancelar</Btn></div>
      </div>
    </Modal>
  );
}

export function LaboratorioPaciente({ p }) {
  const { clinica, pacienteId } = useApp();
  const lista = useColeccionClinica(clinica.id, 'laboratorio', 'pacienteId', pacienteId);
  const [nueva, setNueva] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <Btn v="primary" icon="plus" className="self-start" onClick={() => setNueva(true)}>Nueva orden de laboratorio</Btn>
      {lista === null ? <div className="h-32 animate-pulse rounded-[22px] bg-soft" /> : !lista.length ? <Vacio icon="diente" titulo="Sin órdenes de laboratorio" /> : <div className="grid gap-3 [&>*]:min-w-0 md:grid-cols-2">{lista.map((o) => <TarjetaLab key={o.id} o={o} />)}</div>}
      {nueva && <ModalLab paciente={p} cerrar={() => setNueva(false)} />}
    </div>
  );
}

/* ── Próximo control y convenio (en el resumen de la ficha) ── */
export function ControlPaciente({ p }) {
  const { clinica, avisar } = useApp();
  const [f, setF] = useState({ fecha: (p.control || {}).fecha || '', motivo: (p.control || {}).motivo || '', convenio: p.convenio || '' });
  const guardar = async () => { try { await guardarPacienteFS(clinica.id, { id: p.id, control: f.fecha ? { fecha: f.fecha, motivo: f.motivo.trim() } : null, convenio: f.convenio }); avisar('Guardado'); } catch (e) { avisar('No se pudo guardar.', 'warn'); } };
  const d = f.fecha ? diasHasta(f.fecha) : null;
  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5 shadow-sh">
      <p className="rotulo m-0">Próximo control y convenio</p>
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <Field label="Control" id="ct-f"><input id="ct-f" type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} className={inputCls} /></Field>
        <Field label="Motivo" id="ct-m"><input id="ct-m" value={f.motivo} onChange={(e) => setF({ ...f, motivo: e.target.value })} placeholder="Mantención periodontal, control de endodoncia…" className={inputCls} /></Field>
      </div>
      {d !== null && <p className={cx('m-0 text-[12.5px] font-semibold', d < 0 ? 'text-bad' : d <= 14 ? 'text-warn' : 'text-ink3')}>{d < 0 ? `Control vencido hace ${-d} días` : d === 0 ? 'El control es hoy' : `Faltan ${d} días`}</p>}
      <Field label="Convenio" id="ct-c"><select id="ct-c" value={f.convenio} onChange={(e) => setF({ ...f, convenio: e.target.value })} className={inputCls}><option value="">Sin convenio</option>{(clinica.convenios || []).map((c) => <option key={c.nombre} value={c.nombre}>{c.nombre} · {c.descuento} %</option>)}</select></Field>
      <Btn v="primary" className="self-start" onClick={guardar}>Guardar</Btn>
    </section>
  );
}
