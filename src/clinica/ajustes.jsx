// Clínica › Ajustes (solo administración): datos de la clínica, boxes, profesionales con su porcentaje de honorario,
// arancel, convenios, laboratorios y equipos de esterilización, y el equipo con sus roles. Todo vive en clinicas/{cid}.
import React, { useState } from 'react';
import { useApp } from '../ctx.js';
import { actualizarClinicaFS } from './db.js';
import { usePerfiles } from '../db.js';
import { clp, ROLES, Cabecera, Pestanas, Tarjeta, Fila } from './comun.jsx';
import { Ic, Btn, Field, Vacio, Avatar, inputCls, cx } from '../ui.jsx';

const nid = () => Math.random().toString(36).slice(2, 8);

export function Ajustes() {
  const { tabClinica, irClinica, rolClinica } = useApp();
  if (rolClinica !== 'admin') return <Vacio icon="alert" titulo="Solo administración">Los ajustes de la clínica los cambia quien la administra.</Vacio>;
  const tab = ['general', 'profesionales', 'arancel', 'equipo'].includes(tabClinica) ? tabClinica : 'general';
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-4">
      <Cabecera titulo="Ajustes" sub="Cómo funciona tu clínica" />
      <Pestanas items={[['general', 'General'], ['profesionales', 'Profesionales'], ['arancel', 'Arancel y convenios'], ['equipo', 'Equipo y permisos']]} valor={tab} onChange={(k) => irClinica('ajustes', k)} />
      {tab === 'general' && <General />}
      {tab === 'profesionales' && <Profesionales />}
      {tab === 'arancel' && <Arancel />}
      {tab === 'equipo' && <Equipo />}
    </div>
  );
}

function useGuardar() {
  const { clinica, avisar } = useApp();
  return async (d, msg = 'Guardado') => { try { await actualizarClinicaFS(clinica.id, d); avisar(msg); return true; } catch (e) { avisar('No se pudo guardar.', 'warn'); return false; } };
}

// Lista editable de textos (boxes, laboratorios, equipos)
function ListaTextos({ titulo, ayuda, valor, onGuardar, placeholder }) {
  const [l, setL] = useState(valor || []);
  const [nuevo, setNuevo] = useState('');
  const cambiado = JSON.stringify(l) !== JSON.stringify(valor || []);
  const agregar = () => { const t = nuevo.trim(); if (t && !l.includes(t)) setL([...l, t]); setNuevo(''); };
  return (
    <section className="flex flex-col gap-2 rounded-[22px] bg-card p-5 shadow-sh">
      <p className="rotulo m-0">{titulo}</p>
      {ayuda && <p className="m-0 text-[12.5px] text-ink3">{ayuda}</p>}
      <div className="flex flex-wrap gap-1.5">{l.map((x) => <span key={x} className="inline-flex items-center gap-1 rounded-full bg-soft py-1 pl-3 pr-1 text-[13px] text-ink">{x}<button type="button" onClick={() => setL(l.filter((y) => y !== x))} aria-label={'Quitar ' + x} className="rounded-full p-1 text-ink3 hover:bg-card"><Ic n="x" s={12} /></button></span>)}</div>
      <div className="flex gap-2"><input value={nuevo} onChange={(e) => setNuevo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && agregar()} placeholder={placeholder} aria-label={titulo} className={cx(inputCls, 'flex-1')} /><Btn onClick={agregar}>Agregar</Btn></div>
      {cambiado && <Btn v="primary" sm className="self-start" onClick={() => onGuardar(l)}>Guardar cambios</Btn>}
    </section>
  );
}

function General() {
  const { clinica } = useApp();
  const guardar = useGuardar();
  const [f, setF] = useState({ nombre: clinica.nombre || '', direccion: clinica.direccion || '', telefono: clinica.telefono || '', horario: clinica.horario || 'Lunes a viernes 9:00–19:00 · sábado 9:00–13:00', duracionBase: clinica.duracionBase || 30 });
  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-3 rounded-[22px] bg-card p-5 shadow-sh sm:grid-cols-2">
        <p className="rotulo m-0 sm:col-span-2">Datos de la clínica</p>
        <Field label="Nombre" id="aj-n"><input id="aj-n" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} className={inputCls} /></Field>
        <Field label="Teléfono de la clínica" id="aj-t"><input id="aj-t" value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} className={inputCls} /></Field>
        <Field label="Dirección" id="aj-d" className="sm:col-span-2"><input id="aj-d" value={f.direccion} onChange={(e) => setF({ ...f, direccion: e.target.value })} className={inputCls} /></Field>
        <Field label="Horario de atención" id="aj-h" hint="Sale en los documentos impresos"><input id="aj-h" value={f.horario} onChange={(e) => setF({ ...f, horario: e.target.value })} className={inputCls} /></Field>
        <Field label="Duración base de una cita" id="aj-b"><select id="aj-b" value={f.duracionBase} onChange={(e) => setF({ ...f, duracionBase: +e.target.value })} className={inputCls}>{[15, 30, 45, 60].map((d) => <option key={d} value={d}>{d} min</option>)}</select></Field>
        <Btn v="primary" className="self-start" onClick={() => f.nombre.trim() && guardar({ ...f, nombre: f.nombre.trim() })}>Guardar</Btn>
      </section>
      <ListaTextos titulo="Boxes" ayuda="Son las columnas de la agenda por box." valor={clinica.boxes} placeholder="Ej.: Box 4" onGuardar={(boxes) => guardar({ boxes })} />
      <ListaTextos titulo="Laboratorios con los que trabajas" valor={clinica.laboratorios} placeholder="Nombre del laboratorio" onGuardar={(laboratorios) => guardar({ laboratorios })} />
      <ListaTextos titulo="Equipos de esterilización" ayuda="Cada ciclo se registra por equipo y recibe su código de lote." valor={clinica.equipos} placeholder="Ej.: Autoclave 2" onGuardar={(equipos) => guardar({ equipos })} />
    </div>
  );
}

function Profesionales() {
  const { clinica } = useApp();
  const guardar = useGuardar();
  const [l, setL] = useState(clinica.profesionales || []);
  const equipo = Object.entries(clinica.equipo || {});
  const cambiado = JSON.stringify(l) !== JSON.stringify(clinica.profesionales || []);
  const set = (i, k, v) => setL(l.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-[13px] text-ink2">Quienes atienden: aparecen en la agenda, en los presupuestos y en los honorarios. Unir a una cuenta hace que su agenda se abra filtrada en su nombre.</p>
      {l.map((p, i) => (
        <section key={p.id} className="grid gap-3 rounded-[22px] bg-card p-4 shadow-sh sm:grid-cols-[1.4fr_1fr_110px_1fr_auto] sm:items-end">
          <Field label="Nombre" id={'pf-n' + i}><input id={'pf-n' + i} value={p.nombre} onChange={(e) => set(i, 'nombre', e.target.value)} className={inputCls} /></Field>
          <Field label="Especialidad" id={'pf-e' + i}><input id={'pf-e' + i} value={p.especialidad || ''} onChange={(e) => set(i, 'especialidad', e.target.value)} className={inputCls} /></Field>
          <Field label="% honorario" id={'pf-p' + i}><input id={'pf-p' + i} type="number" min="0" max="100" value={p.porcentaje ?? ''} onChange={(e) => set(i, 'porcentaje', e.target.value === '' ? '' : Math.min(100, Math.max(0, +e.target.value)))} className={inputCls} /></Field>
          <Field label="Cuenta" id={'pf-u' + i}><select id={'pf-u' + i} value={p.uid || ''} onChange={(e) => set(i, 'uid', e.target.value)} className={inputCls}><option value="">Sin unir</option>{equipo.map(([uid, n]) => <option key={uid} value={uid}>{n}</option>)}</select></Field>
          <button type="button" onClick={() => setL(l.filter((_, j) => j !== i))} aria-label="Quitar profesional" className="justify-self-start rounded-full p-2 text-ink3 hover:bg-soft hover:text-bad"><Ic n="trash" s={16} /></button>
        </section>
      ))}
      <div className="flex flex-wrap gap-2">
        <Btn icon="plus" onClick={() => setL([...l, { id: nid(), nombre: '', especialidad: '', porcentaje: 40 }])}>Agregar profesional</Btn>
        {cambiado && <Btn v="primary" onClick={() => guardar({ profesionales: l.filter((p) => p.nombre.trim()).map((p) => ({ ...p, nombre: p.nombre.trim(), porcentaje: p.porcentaje === '' ? 0 : +p.porcentaje })) })}>Guardar profesionales</Btn>}
      </div>
    </div>
  );
}

function Arancel() {
  const { clinica } = useApp();
  const guardar = useGuardar();
  const [l, setL] = useState(clinica.arancel || []);
  const [conv, setConv] = useState(clinica.convenios || []);
  const [q, setQ] = useState('');
  const set = (i, k, v) => setL(l.map((a, j) => (j === i ? { ...a, [k]: v } : a)));
  const cambiado = JSON.stringify(l) !== JSON.stringify(clinica.arancel || []);
  const cambiadoC = JSON.stringify(conv) !== JSON.stringify(clinica.convenios || []);
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="rotulo m-0">Arancel · {l.length} prestaciones</p><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" aria-label="Buscar prestación" className={cx(inputCls, 'max-w-[220px]')} /></div>
        <Tarjeta>{l.map((a, i) => (!q || a.nombre.toLowerCase().includes(q.toLowerCase())) && (
          <Fila key={i}>
            <input value={a.codigo} onChange={(e) => set(i, 'codigo', e.target.value.toUpperCase())} aria-label="Código" className={cx(inputCls, 'w-20 flex-none !px-2 !py-1.5 text-[13px]')} />
            <input value={a.nombre} onChange={(e) => set(i, 'nombre', e.target.value)} aria-label="Prestación" className={cx(inputCls, 'min-w-0 flex-1 !px-2 !py-1.5 text-[13.5px]')} />
            <input type="number" value={a.valor} onChange={(e) => set(i, 'valor', Math.max(0, Math.round(+e.target.value)))} aria-label="Valor" className={cx(inputCls, 'w-28 flex-none !px-2 !py-1.5 text-right text-[13.5px] tabular-nums')} />
            <button type="button" onClick={() => setL(l.filter((_, j) => j !== i))} aria-label="Quitar prestación" className="rounded-full p-1.5 text-ink3 hover:bg-soft hover:text-bad"><Ic n="trash" s={15} /></button>
          </Fila>
        ))}</Tarjeta>
        <div className="flex flex-wrap gap-2">
          <Btn icon="plus" onClick={() => setL([...l, { codigo: '', nombre: '', valor: 0 }])}>Agregar prestación</Btn>
          {cambiado && <Btn v="primary" onClick={() => guardar({ arancel: l.filter((a) => a.nombre.trim()) })}>Guardar arancel</Btn>}
        </div>
      </section>
      <section className="flex flex-col gap-2 rounded-[22px] bg-card p-5 shadow-sh">
        <p className="rotulo m-0">Convenios</p>
        <p className="m-0 text-[12.5px] text-ink3">Descuento que se aplica al generar el presupuesto desde el plan de tratamiento del paciente con ese convenio.</p>
        {conv.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={c.nombre} onChange={(e) => setConv(conv.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))} placeholder="Empresa, caja o institución" aria-label="Convenio" className={cx(inputCls, 'flex-1')} />
            <input type="number" min="0" max="100" value={c.descuento} onChange={(e) => setConv(conv.map((x, j) => (j === i ? { ...x, descuento: Math.min(100, Math.max(0, +e.target.value)) } : x)))} aria-label="Descuento" className={cx(inputCls, 'w-20 text-right')} /><span className="text-[13px] text-ink3">%</span>
            <button type="button" onClick={() => setConv(conv.filter((_, j) => j !== i))} aria-label="Quitar convenio" className="rounded-full p-1.5 text-ink3 hover:bg-soft"><Ic n="trash" s={15} /></button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Btn sm icon="plus" onClick={() => setConv([...conv, { nombre: '', descuento: 10 }])}>Agregar convenio</Btn>
          {cambiadoC && <Btn sm v="primary" onClick={() => guardar({ convenios: conv.filter((c) => c.nombre.trim()) })}>Guardar convenios</Btn>}
        </div>
      </section>
    </div>
  );
}

const PERMISOS = [
  ['Agenda, pacientes (datos administrativos), confirmaciones, lista de espera', true, true, true],
  ['Ficha clínica: antecedentes, odontograma, evoluciones, documentos', true, true, false],
  ['Plan de tratamiento y presupuestos (crear)', true, true, false],
  ['Pagos, cierre de caja, inventario, esterilización, tareas', true, true, true],
  ['Gastos, honorarios, registro de accesos y ajustes', true, false, false]
];

function Equipo() {
  const { clinica, myUid } = useApp();
  const guardar = useGuardar();
  const perfiles = usePerfiles(true);
  const [q, setQ] = useState('');
  const [quitar, setQuitar] = useState(null);
  const miembros = clinica.miembros || {}, equipo = clinica.equipo || {};
  const lista = Object.entries(miembros).map(([uid, rol]) => ({ uid, rol, nombre: equipo[uid] || (perfiles.find((p) => p.uid === uid) || {}).nombre || 'Miembro' }));
  const admins = lista.filter((m) => m.rol === 'admin').length;
  const calzan = q.trim().length < 2 ? [] : perfiles.filter((p) => !miembros[p.uid] && (p.nombre || '').toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  const cambiar = (uid, rol, nombre) => guardar({ ['miembros.' + uid]: rol, ['equipo.' + uid]: nombre }, 'Equipo actualizado');
  const sacar = async (m) => {
    const nm = { ...miembros }; delete nm[m.uid];
    const ne = { ...equipo }; delete ne[m.uid];
    if (await guardar({ miembros: nm, equipo: ne }, 'Quitado del equipo')) setQuitar(null);
  };
  return (
    <div className="flex flex-col gap-4">
      <Tarjeta>{lista.map((m) => (
        <Fila key={m.uid}>
          <Avatar nombre={m.nombre} size={34} />
          <b className="min-w-0 flex-1 truncate text-[14.5px] text-ink">{m.nombre}{m.uid === myUid && <span className="ml-1.5 text-[12px] font-normal text-ink3">(tú)</span>}</b>
          <select value={m.rol} disabled={m.uid === myUid && admins === 1} onChange={(e) => cambiar(m.uid, e.target.value, m.nombre)} aria-label={'Rol de ' + m.nombre} className={cx(inputCls, 'w-40 !py-1.5 text-[13px]')}>{Object.entries(ROLES).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
          {m.uid !== myUid && (quitar === m.uid
            ? <span className="flex gap-1"><Btn sm onClick={() => sacar(m)}>Quitar</Btn><Btn sm onClick={() => setQuitar(null)}>No</Btn></span>
            : <button type="button" onClick={() => setQuitar(m.uid)} aria-label={'Quitar a ' + m.nombre} className="rounded-full p-1.5 text-ink3 hover:bg-soft hover:text-bad"><Ic n="x" s={15} /></button>)}
        </Fila>
      ))}</Tarjeta>
      <section className="flex flex-col gap-2 rounded-[22px] bg-card p-5 shadow-sh">
        <p className="rotulo m-0">Sumar a alguien</p>
        <p className="m-0 text-[12.5px] text-ink3">Busca a la persona por su nombre en Criterium (necesita tener cuenta). Entra como recepción; cambia el rol después.</p>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre" aria-label="Buscar persona" className={inputCls} />
        {calzan.map((p) => <div key={p.uid} className="flex items-center gap-2 text-[14px]"><Avatar nombre={p.nombre} size={28} /><span className="min-w-0 flex-1 truncate">{p.nombre}<span className="ml-1.5 text-[12px] text-ink3">{p.institucion}</span></span><Btn sm v="soft" onClick={() => { cambiar(p.uid, 'recepcion', p.nombre); setQ(''); }}>Sumar</Btn></div>)}
      </section>
      <section className="flex flex-col gap-2">
        <p className="rotulo m-0">Qué puede hacer cada rol</p>
        <Tarjeta>
          <div className="grid grid-cols-[1fr_repeat(3,64px)] gap-2 border-b border-line2 px-4 py-2 text-[11.5px] font-bold uppercase tracking-wide text-ink3"><span /><span className="text-center">Adm.</span><span className="text-center">Odont.</span><span className="text-center">Recep.</span></div>
          {PERMISOS.map(([t, ...v]) => <div key={t} className="grid grid-cols-[1fr_repeat(3,64px)] items-center gap-2 border-b border-line2 px-4 py-2.5 text-[13px] text-ink2 last:border-0"><span>{t}</span>{v.map((x, i) => <span key={i} className={cx('grid place-items-center', x ? 'text-ok' : 'text-ink3')}>{x ? <Ic n="check" s={15} /> : '—'}</span>)}</div>)}
        </Tarjeta>
        <p className="m-0 text-[12px] text-ink3">Los permisos los hacen cumplir las reglas del servidor, no solo la pantalla.</p>
      </section>
    </div>
  );
}
