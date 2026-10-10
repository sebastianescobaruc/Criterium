// Clínica › Caja: presupuestos y pagos, cierre de caja diario (cuadratura por medio de pago), gastos y honorarios
// por profesional (porcentaje sobre lo recaudado). Los gastos y los honorarios solo los ve administración.
import React, { useState } from 'react';
import { useApp } from '../ctx.js';
import { useColeccionClinica, crearEn } from './db.js';
import { CajaPresupuestos } from './clinica.jsx';
import { hoy, sumar, fechaCorta, fechaHora, clp, yoComo, Cabecera, Pestanas, Tarjeta, Fila } from './comun.jsx';
import { Btn, Modal, Field, Seg, Vacio, inputCls, cx } from '../ui.jsx';

export const MEDIOS = ['Efectivo', 'Débito', 'Crédito', 'Transferencia'];
export const CATEGORIAS_GASTO = ['Insumos', 'Laboratorio', 'Arriendo', 'Sueldos', 'Servicios básicos', 'Mantención de equipos', 'Marketing', 'Impuestos y contabilidad', 'Otros'];
const diaDe = (x) => (x.fecha || '').slice(0, 10);
const mesDe = (f) => f.slice(0, 7);
const ultimosMeses = () => [0, 1, 2].map((i) => { const d = new Date(hoy().slice(0, 8) + '15T12:00:00'); d.setMonth(d.getMonth() - i); return d.toISOString().slice(0, 7); });
const nombreMes = (m) => new Date(m + '-15T12:00:00').toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

export function Caja() {
  const { tabClinica, irClinica, rolClinica } = useApp();
  const admin = rolClinica === 'admin';
  const tabs = ['presupuestos', 'cierre', 'gastos', admin && 'honorarios'].filter(Boolean);
  const tab = tabs.includes(tabClinica) ? tabClinica : 'presupuestos';
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
      <Cabecera titulo="Caja" sub="Lo que entra, lo que sale y la cuadratura del día" />
      <Pestanas items={[['presupuestos', 'Presupuestos y pagos'], ['cierre', 'Cierre del día'], ['gastos', 'Gastos'], admin && ['honorarios', 'Honorarios']]} valor={tab} onChange={(k) => irClinica('caja', k)} />
      {tab === 'presupuestos' && <CajaPresupuestos sinCabecera />}
      {tab === 'cierre' && <Cierre />}
      {tab === 'gastos' && <Gastos admin={admin} />}
      {tab === 'honorarios' && <Honorarios />}
    </div>
  );
}

/* ── Cierre de caja: lo cobrado hoy por medio, el efectivo contado y la diferencia; queda registrado y no se edita ── */
function Cierre() {
  const { clinica, myUid, perfil, avisar } = useApp();
  const [dia, setDia] = useState(hoy());
  const pagos = (useColeccionClinica(clinica.id, 'pagos') || []).filter((x) => diaDe(x) === dia);
  const cierres = useColeccionClinica(clinica.id, 'cierres') || [];
  const yaCerrado = cierres.find((c) => c.dia === dia);
  const [contado, setContado] = useState('');
  const [nota, setNota] = useState('');
  const porMedio = Object.fromEntries(MEDIOS.map((m) => [m, pagos.filter((x) => (x.medio || 'Efectivo') === m).reduce((s, x) => s + x.monto, 0)]));
  const total = pagos.reduce((s, x) => s + x.monto, 0);
  const dif = contado === '' ? null : Math.round(+contado) - porMedio.Efectivo;
  const cerrar = async () => {
    if (contado === '') { avisar('Escribe el efectivo que contaste en la caja.', 'warn'); return; }
    try {
      await crearEn(clinica.id, 'cierres', { dia, total, porMedio, pagos: pagos.length, efectivoContado: Math.round(+contado), diferencia: dif, nota: nota.trim(), por: yoComo(myUid, perfil) });
      setContado(''); setNota(''); avisar('Caja cerrada');
    } catch (e) { avisar('No se pudo cerrar la caja.', 'warn'); }
  };
  return (
    <div className="flex flex-col gap-4">
      <Seg opciones={[{ v: hoy(), t: 'Hoy' }, { v: sumar(hoy(), -1), t: 'Ayer' }]} valor={dia} onChange={setDia} size="sm" />
      <div className="grid gap-4 [&>*]:min-w-0 lg:grid-cols-[1fr_1fr]">
        <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5 shadow-sh">
          <p className="rotulo m-0">Cobrado · {fechaCorta(dia)}</p>
          {MEDIOS.map((m) => <div key={m} className="flex items-center justify-between text-[14px]"><span className="text-ink2">{m}</span><b className="tabular-nums text-ink">{clp(porMedio[m])}</b></div>)}
          <div className="flex items-center justify-between border-t border-line2 pt-3 text-[15px]"><b className="text-deep">Total · {pagos.length} pagos</b><b className="text-[20px] tabular-nums text-deep">{clp(total)}</b></div>
        </section>
        <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5 shadow-sh">
          <p className="rotulo m-0">Cuadratura</p>
          {yaCerrado ? (
            <div className="flex flex-col gap-1.5 text-[14px]">
              <b className="text-ok">Caja cerrada por {yaCerrado.por && yaCerrado.por.nombre}</b>
              <span className="text-ink2">{fechaHora(yaCerrado.fecha)}</span>
              <span className="text-ink2">Efectivo contado {clp(yaCerrado.efectivoContado)} · diferencia <b className={yaCerrado.diferencia ? 'text-bad' : 'text-ok'}>{clp(yaCerrado.diferencia)}</b></span>
              {yaCerrado.nota && <span className="text-ink2">«{yaCerrado.nota}»</span>}
            </div>
          ) : (<>
            <Field label="Efectivo contado en la caja" id="cc-e"><input id="cc-e" type="number" inputMode="numeric" value={contado} onChange={(e) => setContado(e.target.value)} className={inputCls} /></Field>
            {dif !== null && <p className={cx('m-0 text-[14px] font-semibold', dif === 0 ? 'text-ok' : 'text-bad')}>{dif === 0 ? 'Cuadra exacto' : dif > 0 ? `Sobran ${clp(dif)}` : `Faltan ${clp(-dif)}`}</p>}
            <Field label="Nota (opcional)" id="cc-n"><input id="cc-n" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej.: vuelto pendiente a un paciente" className={inputCls} /></Field>
            <Btn v="primary" className="self-start" onClick={cerrar}>Cerrar la caja</Btn>
            <p className="m-0 text-[12px] text-ink3">El cierre queda registrado con tu nombre y no se puede editar.</p>
          </>)}
        </section>
      </div>
      {pagos.length > 0 && <Tarjeta>{pagos.map((x) => <Fila key={x.id}><span className="w-14 flex-none text-[13px] tabular-nums text-ink3">{new Date(x.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span><span className="min-w-0 flex-1 truncate text-[14px] text-ink">{x.pacienteNombre}</span><span className="text-[13px] text-ink3">{x.medio}</span><b className="w-24 text-right text-[14px] tabular-nums text-ok">{clp(x.monto)}</b></Fila>)}</Tarjeta>}
      {cierres.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="rotulo m-0">Cierres anteriores</p>
          <Tarjeta>{cierres.slice(0, 10).map((c) => <Fila key={c.id}><span className="w-28 flex-none text-[13px] text-ink2">{fechaCorta(c.dia)}</span><span className="min-w-0 flex-1 truncate text-[13px] text-ink3">{c.por && c.por.nombre}</span><span className={cx('text-[13px] font-semibold', c.diferencia ? 'text-bad' : 'text-ok')}>{c.diferencia ? clp(c.diferencia) : 'Cuadró'}</span><b className="w-24 text-right text-[14px] tabular-nums text-ink">{clp(c.total)}</b></Fila>)}</Tarjeta>
        </section>
      )}
    </div>
  );
}

/* ── Gastos: cualquiera los registra (las reglas exigen monto entero > 0 a su nombre); administración ve el detalle y el balance ── */
function Gastos({ admin }) {
  const { clinica, myUid, perfil, avisar } = useApp();
  const gastos = useColeccionClinica(clinica.id, admin ? 'gastos' : null);
  const pagos = useColeccionClinica(clinica.id, admin ? 'pagos' : null) || [];
  const [mes, setMes] = useState(mesDe(hoy()));
  const [nuevo, setNuevo] = useState(null);
  const guardar = async () => {
    const monto = Math.round(+nuevo.monto);
    if (!nuevo.concepto.trim() || !(monto > 0)) { avisar('Falta el concepto o el monto.', 'warn'); return; }
    try { await crearEn(clinica.id, 'gastos', { ...nuevo, concepto: nuevo.concepto.trim(), monto, registradoPor: yoComo(myUid, perfil) }); setNuevo(null); avisar('Gasto registrado'); }
    catch (e) { avisar('No se pudo registrar.', 'warn'); }
  };
  const delMes = (gastos || []).filter((g) => (g.dia || diaDe(g)).startsWith(mes));
  const ingresos = pagos.filter((x) => diaDe(x).startsWith(mes)).reduce((s, x) => s + x.monto, 0);
  const egresos = delMes.reduce((s, g) => s + g.monto, 0);
  const porCat = CATEGORIAS_GASTO.map((c) => [c, delMes.filter((g) => g.categoria === c).reduce((s, g) => s + g.monto, 0)]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...porCat.map(([, v]) => v));
  const meses = ultimosMeses();
  return (
    <div className="flex flex-col gap-4">
      <Btn v="primary" icon="plus" className="self-start" onClick={() => setNuevo({ concepto: '', categoria: 'Insumos', monto: '', proveedor: '', documento: '', dia: hoy() })}>Registrar un gasto</Btn>
      {!admin ? <p className="m-0 text-[13.5px] text-ink2">Lo que registres queda a tu nombre. El detalle y el balance los ve administración.</p> : (<>
        <Seg opciones={meses.map((m) => ({ v: m, t: nombreMes(m) }))} valor={mes} onChange={setMes} size="sm" />
        <div className="grid grid-cols-3 gap-3">
          {[['Ingresos', ingresos, 'text-ok'], ['Gastos', egresos, 'text-bad'], ['Resultado', ingresos - egresos, ingresos - egresos >= 0 ? 'text-deep' : 'text-bad']].map(([t, v, c]) => <div key={t} className="flex flex-col gap-1 rounded-[20px] bg-card p-4 shadow-sh"><span className="text-[12.5px] font-semibold text-ink3">{t}</span><b className={cx('text-[20px] font-extrabold tabular-nums sm:text-[24px]', c)}>{clp(v)}</b></div>)}
        </div>
        {porCat.length > 0 && <section className="flex flex-col gap-2 rounded-[22px] bg-card p-5 shadow-sh"><p className="rotulo m-0">Por categoría</p>{porCat.map(([c, v]) => <div key={c} className="flex items-center gap-3 text-[13px]"><span className="w-40 flex-none truncate text-ink2">{c}</span><span className="h-2.5 flex-1 overflow-hidden rounded-full bg-soft"><span className="block h-full rounded-full bg-acento" style={{ width: (v / max) * 100 + '%' }} /></span><b className="w-24 text-right tabular-nums text-ink">{clp(v)}</b></div>)}</section>}
        {gastos === null ? <div className="h-32 animate-pulse rounded-[22px] bg-soft" /> : !delMes.length ? <Vacio icon="dinero" titulo="Sin gastos este mes" /> : (
          <Tarjeta>{delMes.map((g) => <Fila key={g.id}><span className="w-24 flex-none text-[13px] text-ink3">{fechaCorta(g.dia || diaDe(g))}</span><span className="min-w-0 flex-1"><b className="block truncate text-[14px] text-ink">{g.concepto}</b><span className="block truncate text-[12px] text-ink3">{g.categoria}{g.proveedor ? ' · ' + g.proveedor : ''}{g.documento ? ' · ' + g.documento : ''}</span></span><b className="w-24 text-right text-[14px] tabular-nums text-bad">{clp(g.monto)}</b></Fila>)}</Tarjeta>
        )}
      </>)}
      {nuevo && (
        <Modal open onClose={() => setNuevo(null)} title="Registrar un gasto">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Concepto" id="gs-c" className="sm:col-span-2"><input id="gs-c" value={nuevo.concepto} onChange={(e) => setNuevo({ ...nuevo, concepto: e.target.value })} placeholder="Ej.: guantes de nitrilo, 10 cajas" className={inputCls} /></Field>
            <Field label="Categoría" id="gs-k"><select id="gs-k" value={nuevo.categoria} onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })} className={inputCls}>{CATEGORIAS_GASTO.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Monto" id="gs-m"><input id="gs-m" type="number" inputMode="numeric" value={nuevo.monto} onChange={(e) => setNuevo({ ...nuevo, monto: e.target.value })} className={inputCls} /></Field>
            <Field label="Proveedor" id="gs-p"><input id="gs-p" value={nuevo.proveedor} onChange={(e) => setNuevo({ ...nuevo, proveedor: e.target.value })} className={inputCls} /></Field>
            <Field label="Boleta o factura" id="gs-d"><input id="gs-d" value={nuevo.documento} onChange={(e) => setNuevo({ ...nuevo, documento: e.target.value })} placeholder="Ej.: factura 10234" className={inputCls} /></Field>
            <Field label="Fecha" id="gs-f"><input id="gs-f" type="date" value={nuevo.dia} onChange={(e) => setNuevo({ ...nuevo, dia: e.target.value })} className={inputCls} /></Field>
            <div className="flex gap-2 sm:col-span-2"><Btn v="primary" onClick={guardar}>Registrar</Btn><Btn onClick={() => setNuevo(null)}>Cancelar</Btn></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Honorarios: lo recaudado por cada profesional en el mes (según el presupuesto del pago) por su porcentaje ── */
function Honorarios() {
  const { clinica } = useApp();
  const [mes, setMes] = useState(mesDe(hoy()));
  const pagos = (useColeccionClinica(clinica.id, 'pagos') || []).filter((x) => diaDe(x).startsWith(mes));
  const pres = useColeccionClinica(clinica.id, 'presupuestos') || [];
  const lab = (useColeccionClinica(clinica.id, 'laboratorio') || []).filter((o) => (o.envio || '').startsWith(mes) && o.estado !== 'anulado');
  const profDe = (x) => x.profesionalId || ((pres.find((p) => p.id === x.presupuestoId) || {}).profesionalId) || '';
  const presPac = (pid) => pres.filter((p) => p.pacienteId === pid).map((p) => p.profesionalId);
  const filas = (clinica.profesionales || []).map((p) => {
    const recaudado = pagos.filter((x) => profDe(x) === p.id).reduce((s, x) => s + x.monto, 0);
    const laboratorio = lab.filter((o) => (o.profesionalId || presPac(o.pacienteId)[0]) === p.id).reduce((s, o) => s + (o.costo || 0), 0);
    const pct = +p.porcentaje || 0;
    return { p, recaudado, laboratorio, pct, honorario: Math.round(Math.max(0, recaudado - laboratorio) * pct / 100) };
  });
  const sin = pagos.filter((x) => !profDe(x)).reduce((s, x) => s + x.monto, 0);
  const meses = ultimosMeses();
  return (
    <div className="flex flex-col gap-4">
      <Seg opciones={meses.map((m) => ({ v: m, t: nombreMes(m) }))} valor={mes} onChange={setMes} size="sm" />
      <Tarjeta>
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_.6fr_1fr] gap-3 border-b border-line2 px-4 py-2.5 text-[12px] font-bold uppercase tracking-wide text-ink3 sm:grid"><span>Profesional</span><span className="text-right">Recaudado</span><span className="text-right">Laboratorio</span><span className="text-right">%</span><span className="text-right">Honorario</span></div>
        {filas.map(({ p, recaudado, laboratorio, pct, honorario }) => (
          <div key={p.id} className="grid grid-cols-2 gap-x-3 gap-y-1 border-b border-line2 px-4 py-3 text-[14px] last:border-0 sm:grid-cols-[1.4fr_1fr_1fr_.6fr_1fr]">
            <span className="col-span-2 sm:col-span-1"><b className="text-ink">{p.nombre}</b><span className="block text-[12px] text-ink3">{p.especialidad || 'Odontología general'}</span></span>
            <span className="text-ink2 sm:text-right"><span className="text-ink3 sm:hidden">Recaudado </span>{clp(recaudado)}</span>
            <span className="text-right text-ink2"><span className="text-ink3 sm:hidden">Lab. </span>−{clp(laboratorio)}</span>
            <span className="text-ink2 sm:text-right">{pct ? pct + ' %' : <span className="text-warn">Sin %</span>}</span>
            <b className="text-right tabular-nums text-deep">{clp(honorario)}</b>
          </div>
        ))}
      </Tarjeta>
      {sin > 0 && <p className="m-0 text-[13px] text-warn">{clp(sin)} cobrados sin profesional asignado en el presupuesto.</p>}
      <p className="m-0 text-[12.5px] text-ink3">Honorario = (recaudado − costo de laboratorio) × porcentaje. El porcentaje de cada profesional se define en Ajustes › Profesionales. Es una estimación para conversar; la liquidación formal la hace la contabilidad.</p>
    </div>
  );
}
