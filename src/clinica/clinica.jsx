// Criterium › Clínica: gestión de una clínica odontológica (agenda por box y profesional, pacientes, ficha clínica con
// antecedentes, odontograma, evoluciones firmadas y documentos, presupuestos y pagos, confirmaciones e informes).
// Funciones propias de Criterium inspiradas en lo que hace cualquier software de gestión dental; no copia el diseño,
// el código ni los textos de ningún producto. Datos y reglas en clinica/db.js y firestore.rules (sección Clínica).
// Mientras no exista revisión legal (Ley 20.584, reglamento de ficha clínica, Ley 21.719), solo clínicas de demostración.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../ctx.js';
import { usePacientes, usePaciente, useFicha, useSub, useCitas, useColeccionClinica, guardarPacienteFS, guardarFichaFS, agregarEvolucionFS, emitirDocumentoFS, guardarCitaFS, guardarPresupuestoFS, registrarPagoFS, registrarAccesoFS } from './db.js';
import { Odontograma, cpod } from './odontograma.jsx';
import { PlanTratamiento, PerioFicha, LaboratorioPaciente, ControlPaciente } from './plan.jsx';
import { PLANTILLAS, imprimirHoja, textoHtml, firmasHtml, tablaHtml } from './documentos.js';
import { Ic, Btn, Modal, Field, Seg, Vacio, Avatar, inputCls, cx } from '../ui.jsx';
import { iso, hoy, sumar, lunesDe, fechaCorta, fechaLarga, diasHasta, clp, edad, nombreDe, telefonoWa, ROLES, clinico, ESTADOS_CITA, estadoCita, mins, hhmm, colorProf, profDe, Cabecera, Panel, PanelLateral, Insignia, Kpis, CabTabla, Tarjeta } from './comun.jsx';
export { ESTADOS_CITA } from './comun.jsx';

/* ── Utilidades (las comunes viven en comun.jsx) ── */
const INICIO = 8 * 60, FIN = 20 * 60, PASO = 30, ALTO = 40;
const DURACIONES = [15, 30, 45, 60, 90, 120];

/* ── Sin clínica: qué es y cómo pedirla ── */
export function SinClinica() {
  const { go } = useApp();
  const PARTES = [['calendario', 'Agenda', 'Por box y por profesional, con el estado de cada cita y confirmaciones por WhatsApp.'], ['personas', 'Ficha del paciente', 'Antecedentes, alergias, odontograma, evoluciones firmadas que no se editan y documentos.'], ['dinero', 'Presupuestos y pagos', 'Por pieza y con abonos; el saldo de cada paciente siempre a la vista.'], ['grafico', 'Informes', 'Inasistencias, confirmaciones y producción de la semana o del mes.']];
  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5">
      <header className="overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,var(--deep),var(--acento))] px-5 py-8 text-onc sm:px-8">
        <p className="m-0 text-[12px] font-bold uppercase tracking-[.14em] text-menta">Clínica</p>
        <h1 className="m-0 mt-2 text-[30px] font-bold leading-tight tracking-[-.025em] sm:text-[38px]">La gestión de tu clínica, con el criterio de Criterium</h1>
        <p className="m-0 mt-3 max-w-[56ch] text-[15px] leading-relaxed text-panelink2">Agenda, ficha clínica, odontograma, presupuestos y pagos en el mismo lugar donde está la evidencia. Se activa por clínica y cada integrante entra con su rol.</p>
        <button type="button" onClick={() => go('contacto')} className="mt-5 inline-flex items-center gap-2 rounded-full bg-menta px-5 py-2.5 text-[14px] font-semibold text-mentaink"><Ic n="mail" s={16} />Quiero Criterium para mi clínica</button>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {PARTES.map(([ic, t, d]) => <div key={t} className="flex gap-3 rounded-[22px] bg-card p-5 shadow-sh"><span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-acentosoft text-acento"><Ic n={ic} s={20} /></span><div><b className="text-[15.5px] text-ink">{t}</b><p className="m-0 mt-1 text-[13.5px] leading-relaxed text-ink2">{d}</p></div></div>)}
      </div>
      <p className="m-0 text-[12.5px] text-ink3">Hoy está en etapa de demostración con pacientes ficticios. El uso con pacientes reales requiere un acuerdo con cada clínica y la revisión legal de la ficha clínica electrónica.</p>
    </div>
  );
}

/* ═════════ AGENDA ═════════
   Día por profesional o por box, o semana. Bloques del largo real de la cita, con la barra del color del profesional y
   el fondo según el estado; las citas que se topan van en carriles. Tocar un hueco agenda a esa hora (cada 15 min). */
const ALTO_H = 52; // px por hora
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
// Reparte en carriles las citas que se superponen
function carriles(lista) {
  const ord = lista.slice().sort((a, b) => mins(a.hora) - mins(b.hora));
  const out = []; let grupo = [], fin = -1;
  const cerrar = () => { const lanes = []; grupo.forEach((c) => { const ini = mins(c.hora); let l = lanes.findIndex((f) => f <= ini); if (l < 0) { l = lanes.length; lanes.push(0); } lanes[l] = ini + (c.duracion || 30); out.push({ c, l, n: 0 }); }); out.slice(-grupo.length).forEach((x) => { x.n = lanes.length; }); };
  ord.forEach((c) => { const ini = mins(c.hora), f = ini + (c.duracion || 30); if (grupo.length && ini >= fin) { cerrar(); grupo = []; fin = -1; } grupo.push(c); fin = Math.max(fin, f); });
  if (grupo.length) cerrar();
  return out;
}

function MiniCalendario({ fecha, onChange, marcados }) {
  const [mes, setMes] = useState(fecha.slice(0, 7));
  useEffect(() => { setMes(fecha.slice(0, 7)); }, [fecha.slice(0, 7)]);
  const [a, m] = mes.split('-').map(Number);
  const primero = new Date(a, m - 1, 1), dias = new Date(a, m, 0).getDate(), off = (primero.getDay() + 6) % 7;
  const celdas = [...Array(off).fill(null), ...Array.from({ length: dias }, (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`)];
  const moverMes = (n) => { const d = new Date(a, m - 1 + n, 1); setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };
  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between"><b className="text-[13px] capitalize text-deep">{MESES[m - 1]} {a}</b><span className="flex gap-0.5"><button type="button" onClick={() => moverMes(-1)} aria-label="Mes anterior" className="grid h-6 w-6 place-items-center rounded hover:bg-[var(--cl-hover)]"><Ic n="back" s={13} /></button><button type="button" onClick={() => moverMes(1)} aria-label="Mes siguiente" className="grid h-6 w-6 place-items-center rounded hover:bg-[var(--cl-hover)]"><Ic n="back" s={13} className="rotate-180" /></button></span></div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center text-[11.5px]">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i} className="py-1 font-semibold text-[var(--cl-muted)]">{d}</span>)}
        {celdas.map((f, i) => f ? <button key={f} type="button" onClick={() => onChange(f)} className={cx('relative mx-auto grid h-7 w-7 place-items-center rounded-full tabular-nums', f === fecha ? 'bg-[var(--cl-pri)] font-bold text-onc' : f === hoy() ? 'font-bold text-acento ring-1 ring-acento' : 'text-ink hover:bg-[var(--cl-hover)]')}>{+f.slice(8)}{marcados && marcados.has(f) && f !== fecha && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-acento" />}</button> : <span key={i} />)}
      </div>
    </div>
  );
}

export function Agenda() {
  const { clinica, abrirPaciente } = useApp();
  const PROFS = clinica.profesionales || [];
  const [modo, setModo] = useState('dia');
  const [agrupar, setAgrupar] = useState('prof');
  const [fecha, setFecha] = useState(hoy());
  const [ocultos, setOcultos] = useState([]);
  const [nueva, setNueva] = useState(null);
  const [ver, setVer] = useState(null);
  const [fantasma, setFantasma] = useState(null);
  const ref = useRef(null);
  const lunes = lunesDe(fecha);
  const desde = modo === 'dia' ? fecha : lunes, hasta = modo === 'dia' ? fecha : sumar(lunes, 5);
  const todas = useCitas(clinica.id, desde, hasta) || [];
  const mes = useCitas(clinica.id, fecha.slice(0, 8) + '01', fecha.slice(0, 8) + '31') || [];
  const marcados = useMemo(() => new Set(mes.filter((c) => c.estado !== 'cancelada').map((c) => c.fecha)), [mes]);
  const citas = todas.filter((c) => !ocultos.includes(c.profesionalId));
  const visibles = PROFS.filter((p) => !ocultos.includes(p.id));
  const cols = modo === 'semana' ? Array.from({ length: 6 }, (_, i) => { const f = sumar(lunes, i); return { k: f, fecha: f, filtro: (c) => c.fecha === f, dia: f }; })
    : agrupar === 'box' ? (clinica.boxes || ['Box 1']).map((b) => ({ k: b, fecha, box: b, filtro: (c) => c.box === b, titulo: b }))
    : visibles.map((p) => ({ k: p.id, fecha, prof: p, filtro: (c) => c.profesionalId === p.id }));
  const horas = Array.from({ length: (FIN - INICIO) / 60 }, (_, i) => INICIO + i * 60);
  const altoTotal = ((FIN - INICIO) / 60) * ALTO_H;
  const y = (m) => ((m - INICIO) / 60) * ALTO_H;
  const ahoraMin = (() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); })();
  const verHoy = (modo === 'dia' ? fecha === hoy() : hoy() >= lunes && hoy() <= sumar(lunes, 5)) && ahoraMin > INICIO && ahoraMin < FIN;
  useEffect(() => { if (ref.current) ref.current.scrollTop = Math.max(0, y(verHoy ? ahoraMin - 60 : 8 * 60 + 30) - 10); }, [modo, fecha.slice(0, 7)]);
  const mover = (n) => setFecha(sumar(fecha, modo === 'dia' ? n : n * 7));
  const minDe = (e) => { const r = e.currentTarget.getBoundingClientRect(); return Math.min(FIN - 15, INICIO + Math.floor(((e.clientY - r.top) / ALTO_H) * 4) * 15); };
  const titulo = modo === 'dia' ? fechaLarga(fecha) : `${+lunes.slice(8)} – ${+sumar(lunes, 5).slice(8)} de ${MESES[+sumar(lunes, 5).slice(5, 7) - 1]} ${lunes.slice(0, 4)}`;
  const actual = ver && todas.find((c) => c.id === ver);
  const plantilla = `56px repeat(${Math.max(1, cols.length)}, minmax(${modo === 'semana' ? 128 : 170}px, 1fr))`;
  const conteo = (f) => citas.filter((c) => c.estado !== 'cancelada' && f(c)).length;
  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="m-0 mr-2 text-[22px] font-bold tracking-[-.015em] text-deep">Agenda</h1>
        <div className="flex items-center overflow-hidden rounded-lg border border-[var(--cl-line)] bg-card">
          <button type="button" onClick={() => mover(-1)} aria-label="Anterior" className="grid h-8 w-8 place-items-center hover:bg-[var(--cl-hover)]"><Ic n="back" s={15} /></button>
          <button type="button" onClick={() => setFecha(hoy())} className="h-8 border-x border-[var(--cl-line)] px-3 text-[13px] font-semibold text-ink hover:bg-[var(--cl-hover)]">Hoy</button>
          <button type="button" onClick={() => mover(1)} aria-label="Siguiente" className="grid h-8 w-8 place-items-center hover:bg-[var(--cl-hover)]"><Ic n="back" s={15} className="rotate-180" /></button>
        </div>
        <b className="text-[15px] font-semibold text-ink">{titulo}</b>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-[var(--cl-line)] bg-card p-0.5 text-[12.5px] font-semibold">{[['dia', 'Día'], ['semana', 'Semana']].map(([k, t]) => <button key={k} type="button" onClick={() => setModo(k)} aria-pressed={modo === k} className={cx('rounded-md px-3 py-1', modo === k ? 'bg-[var(--cl-pri)] text-onc' : 'text-ink2 hover:bg-[var(--cl-hover)]')}>{t}</button>)}</div>
          {modo === 'dia' && <div className="flex rounded-lg border border-[var(--cl-line)] bg-card p-0.5 text-[12.5px] font-semibold">{[['prof', 'Por profesional'], ['box', 'Por box']].map(([k, t]) => <button key={k} type="button" onClick={() => setAgrupar(k)} aria-pressed={agrupar === k} className={cx('rounded-md px-3 py-1', agrupar === k ? 'bg-[var(--cl-sel)] text-deep' : 'text-ink2 hover:bg-[var(--cl-hover)]')}>{t}</button>)}</div>}
          <Btn v="primary" icon="plus" onClick={() => setNueva({ fecha, hora: '09:00' })}>Agendar</Btn>
        </div>
      </div>
      <div className="grid gap-3 [&>*]:min-w-0 lg:grid-cols-[236px_minmax(0,1fr)]">
        <aside className="hidden flex-col gap-3 lg:flex">
          <Panel><MiniCalendario fecha={fecha} onChange={setFecha} marcados={marcados} /></Panel>
          <Panel titulo="Profesionales" cuerpo="p-2">
            {PROFS.map((p) => { const on = !ocultos.includes(p.id); return (
              <label key={p.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] hover:bg-[var(--cl-hover)]">
                <input type="checkbox" checked={on} onChange={() => setOcultos(on ? [...ocultos, p.id] : ocultos.filter((x) => x !== p.id))} className="sr-only" />
                <span className="grid h-4 w-4 flex-none place-items-center rounded-[4px] border-2" style={{ borderColor: colorProf(clinica, p.id), background: on ? colorProf(clinica, p.id) : 'transparent' }}>{on && <Ic n="check" s={10} sw={3} className="text-onc" />}</span>
                <span className="min-w-0 flex-1 truncate text-ink">{p.nombre}</span>
                <span className="tabular-nums text-[11.5px] text-[var(--cl-muted)]">{todas.filter((c) => c.profesionalId === p.id && c.estado !== 'cancelada').length}</span>
              </label>
            ); })}
          </Panel>
          <Panel titulo="Estados" cuerpo="p-3">
            <div className="flex flex-col gap-1.5">{ESTADOS_CITA.map((e) => { const n = citas.filter((c) => c.estado === e.v).length; return <div key={e.v} className="flex items-center justify-between text-[12.5px]"><Insignia estado={e.v} /><span className="tabular-nums text-[var(--cl-muted)]">{n}</span></div>; })}</div>
          </Panel>
        </aside>
        <div ref={ref} className="relative max-h-[calc(100vh-150px)] min-h-[420px] overflow-auto rounded-[10px] border border-[var(--cl-line)] bg-card">
          {!cols.length ? <p className="m-0 p-8 text-center text-[13.5px] text-ink3">Elige al menos un profesional.</p> : (
          <div className="grid min-w-max" style={{ gridTemplateColumns: plantilla }}>
            {/* Encabezado */}
            <div className="sticky left-0 top-0 z-[6] border-b border-r border-[var(--cl-line)] bg-card" />
            {cols.map((c) => (
              <div key={c.k} className="sticky top-0 z-[5] flex h-[52px] items-center gap-2 border-b border-l border-[var(--cl-line)] bg-card px-3">
                {c.prof ? (<>
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-full text-[11px] font-bold text-onc" style={{ background: colorProf(clinica, c.prof.id) }}>{c.prof.nombre.replace(/^(Dra?\.)\s*/, '').split(' ').slice(0, 2).map((x) => x[0]).join('')}</span>
                  <span className="min-w-0"><b className="block truncate text-[13px] text-ink">{c.prof.nombre.replace(/\s*\(fictici[oa]\)/, '')}</b><span className="block truncate text-[11.5px] text-[var(--cl-muted)]">{c.prof.especialidad || 'Odontología general'} · {conteo(c.filtro)} citas</span></span>
                </>) : c.dia ? (
                  <button type="button" onClick={() => { setFecha(c.dia); setModo('dia'); }} className="flex items-center gap-2 text-left"><span className={cx('grid h-8 w-8 place-items-center rounded-full text-[15px] font-bold tabular-nums', c.dia === hoy() ? 'bg-[var(--cl-pri)] text-onc' : 'text-ink')}>{+c.dia.slice(8)}</span><span><b className="block text-[12.5px] capitalize text-ink">{new Date(c.dia + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long' })}</b><span className="block text-[11.5px] text-[var(--cl-muted)]">{conteo(c.filtro)} citas</span></span></button>
                ) : (<span><b className="block text-[13px] text-ink">{c.titulo}</b><span className="block text-[11.5px] text-[var(--cl-muted)]">{conteo(c.filtro)} citas</span></span>)}
              </div>
            ))}
            {/* Horas */}
            <div className="sticky left-0 z-[4] border-r border-[var(--cl-line)] bg-card" style={{ height: altoTotal }}>
              {horas.map((m) => <span key={m} className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-[var(--cl-muted)]" style={{ top: y(m) || 8 }}>{hhmm(m)}</span>)}
              {verHoy && <span className="absolute right-1 z-[2] -translate-y-1/2 rounded bg-[var(--cl-ahora)] px-1 text-[10.5px] font-bold tabular-nums text-onc" style={{ top: y(ahoraMin) }}>{hhmm(ahoraMin)}</span>}
            </div>
            {cols.map((col) => {
              const lista = citas.filter((c) => (modo === 'semana' ? c.fecha === col.fecha : c.fecha === fecha) && col.filtro(c));
              return (
                <div key={col.k} className="relative border-l border-[var(--cl-line)]" style={{ height: altoTotal, backgroundImage: `repeating-linear-gradient(to bottom, var(--cl-line) 0 1px, transparent 1px ${ALTO_H / 2}px, var(--cl-line-2) ${ALTO_H / 2}px ${ALTO_H / 2 + 1}px, transparent ${ALTO_H / 2 + 1}px ${ALTO_H}px)` }}
                  onMouseMove={(e) => setFantasma({ k: col.k, m: minDe(e) })} onMouseLeave={() => setFantasma(null)}
                  onClick={(e) => { if (e.target !== e.currentTarget) return; setNueva({ fecha: col.fecha, hora: hhmm(minDe(e)), box: col.box || (clinica.boxes || [])[0], profesionalId: col.prof ? col.prof.id : undefined }); }}>
                  {fantasma && fantasma.k === col.k && <div className="pointer-events-none absolute inset-x-1 rounded-[6px] border border-dashed border-acento bg-[color-mix(in_srgb,var(--acento-soft)_55%,transparent)] px-2 text-[11.5px] font-semibold text-acentodeep" style={{ top: y(fantasma.m) + 1, height: ALTO_H / 2 - 2 }}>+ {hhmm(fantasma.m)}</div>}
                  {carriles(lista).map(({ c, l, n }) => {
                    const top = y(mins(c.hora)), alto = Math.max(20, ((c.duracion || 30) / 60) * ALTO_H - 2), p = profDe(clinica, c.profesionalId), corto = alto < 40;
                    return (
                      <button key={c.id} type="button" onClick={() => setVer(c.id)} onMouseMove={(e) => e.stopPropagation()} data-e={c.estado}
                        className="cl-cita absolute z-[2] overflow-hidden rounded-[6px] px-2 py-1 text-left leading-tight"
                        style={{ top: top + 1, height: alto, left: `calc(${(l / n) * 100}% + 3px)`, width: `calc(${100 / n}% - 6px)`, '--pc': colorProf(clinica, c.profesionalId) }}>
                        <span className="flex items-center gap-1.5"><span className={cx('h-1.5 w-1.5 flex-none rounded-full', estadoCita(c.estado).dot)} /><b className="truncate text-[12px]">{corto ? `${c.hora} ${c.pacienteNombre}` : c.pacienteNombre}</b></span>
                        {!corto && <span className="block truncate text-[11.5px] tabular-nums text-ink3">{c.hora}–{hhmm(mins(c.hora) + (c.duracion || 30))} · {c.motivo || 'Atención'}</span>}
                        {alto > 64 && <span className="block truncate text-[11px] text-ink3">{modo === 'semana' || agrupar === 'box' ? (p ? p.nombre.replace(/\s*\(fictici[oa]\)/, '') : '') : c.box}</span>}
                      </button>
                    );
                  })}
                  {verHoy && (modo === 'dia' || col.fecha === hoy()) && <div className="pointer-events-none absolute inset-x-0 z-[3] h-[2px] bg-[var(--cl-ahora)]" style={{ top: y(ahoraMin) }}><span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-[var(--cl-ahora)]" /></div>}
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>
      {nueva && <ModalCita inicial={nueva} cerrar={() => setNueva(null)} />}
      {actual && <DetalleCita c={actual} cerrar={() => setVer(null)} abrirFicha={() => { setVer(null); abrirPaciente(actual.pacienteId); }} />}
    </div>
  );
}

export function ModalCita({ inicial, cerrar }) {
  const { clinica, avisar } = useApp();
  const pacientes = usePacientes(clinica.id) || [];
  const [f, setF] = useState({ pacienteId: '', profesionalId: (clinica.profesionales || [])[0]?.id || '', box: (clinica.boxes || [])[0], duracion: 30, motivo: '', nota: '', estado: 'agendada', ...Object.fromEntries(Object.entries(inicial).filter(([, v]) => v !== undefined)) });
  const [q, setQ] = useState('');
  const [nuevoP, setNuevoP] = useState(null);
  const [err, setErr] = useState('');
  const calzan = pacientes.filter((p) => !q || (nombreDe(p) + ' ' + (p.rut || '')).toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  const elegido = pacientes.find((p) => p.id === f.pacienteId);
  const guardar = async () => {
    let pid = f.pacienteId, pnombre = elegido ? nombreDe(elegido) : '';
    if (nuevoP) {
      if (!nuevoP.nombres.trim() || !nuevoP.apellidos.trim()) { setErr('Escribe nombre y apellido del paciente.'); return; }
      pid = await guardarPacienteFS(clinica.id, { ...nuevoP, ficticio: !!clinica.demo });
      pnombre = nuevoP.nombres + ' ' + nuevoP.apellidos;
    }
    if (!pid) { setErr('Elige un paciente o crea uno nuevo.'); return; }
    if (!f.fecha || !f.hora) { setErr('Falta la fecha o la hora.'); return; }
    try { await guardarCitaFS(clinica.id, { ...f, pacienteId: pid, pacienteNombre: pnombre || f.pacienteNombre, duracion: +f.duracion }); avisar(inicial.id ? 'Cita actualizada' : 'Cita agendada'); cerrar(); }
    catch (e) { setErr('No se pudo guardar. Revisa tu conexión.'); }
  };
  return (
    <Modal open onClose={cerrar} title={inicial.id ? 'Editar cita' : 'Agendar paciente'}>
      <div className="flex flex-col gap-3">
        {!inicial.id && (nuevoP ? (
          <div className="grid gap-2 rounded-[16px] bg-soft p-3 sm:grid-cols-2">
            <input value={nuevoP.nombres} onChange={(e) => setNuevoP({ ...nuevoP, nombres: e.target.value })} placeholder="Nombres" aria-label="Nombres" className={cx(inputCls, '!bg-card')} />
            <input value={nuevoP.apellidos} onChange={(e) => setNuevoP({ ...nuevoP, apellidos: e.target.value })} placeholder="Apellidos" aria-label="Apellidos" className={cx(inputCls, '!bg-card')} />
            <input value={nuevoP.telefono} onChange={(e) => setNuevoP({ ...nuevoP, telefono: e.target.value })} placeholder="Teléfono" aria-label="Teléfono" className={cx(inputCls, '!bg-card sm:col-span-2')} />
            <button type="button" onClick={() => setNuevoP(null)} className="justify-self-start text-[12.5px] font-semibold text-ink3">Buscar un paciente existente</button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <input value={elegido ? nombreDe(elegido) : q} onChange={(e) => { setQ(e.target.value); setF({ ...f, pacienteId: '' }); }} placeholder="Busca el paciente por nombre o RUT" aria-label="Paciente" className={inputCls} />
            {!elegido && <div className="flex flex-col">{calzan.map((p) => <button key={p.id} type="button" onClick={() => setF({ ...f, pacienteId: p.id })} className="flex items-center gap-2 rounded-[12px] px-2 py-1.5 text-left text-[13.5px] hover:bg-soft"><Avatar nombre={nombreDe(p)} size={26} />{nombreDe(p)}<span className="text-ink3">{p.telefono}</span></button>)}
              <button type="button" onClick={() => setNuevoP({ nombres: '', apellidos: '', telefono: '' })} className="mt-1 self-start rounded-full px-3 py-1.5 text-[13px] font-semibold text-acento hover:bg-soft">+ Paciente nuevo</button></div>}
          </div>
        ))}
        {inicial.id && <p className="m-0 text-[14px] font-semibold text-ink">{f.pacienteNombre}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Fecha" id="ci-f"><input id="ci-f" type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} className={inputCls} /></Field>
          <Field label="Hora" id="ci-h"><input id="ci-h" type="time" step="900" value={f.hora} onChange={(e) => setF({ ...f, hora: e.target.value })} className={inputCls} /></Field>
          <Field label="Profesional" id="ci-p"><select id="ci-p" value={f.profesionalId} onChange={(e) => setF({ ...f, profesionalId: e.target.value })} className={inputCls}>{(clinica.profesionales || []).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></Field>
          <Field label="Box" id="ci-b"><select id="ci-b" value={f.box} onChange={(e) => setF({ ...f, box: e.target.value })} className={inputCls}>{(clinica.boxes || []).map((b) => <option key={b}>{b}</option>)}</select></Field>
          <Field label="Duración" id="ci-d"><select id="ci-d" value={f.duracion} onChange={(e) => setF({ ...f, duracion: +e.target.value })} className={inputCls}>{DURACIONES.map((d) => <option key={d} value={d}>{d} min</option>)}</select></Field>
          <Field label="Motivo" id="ci-m"><input id="ci-m" value={f.motivo} onChange={(e) => setF({ ...f, motivo: e.target.value })} placeholder="Control, urgencia, endodoncia…" className={inputCls} /></Field>
        </div>
        {err && <p className="m-0 text-[13px] font-semibold text-bad">{err}</p>}
        <div className="flex gap-2"><Btn v="primary" onClick={guardar}>Guardar</Btn><Btn onClick={cerrar}>Cancelar</Btn></div>
      </div>
    </Modal>
  );
}

function DetalleCita({ c, cerrar, abrirFicha }) {
  const { clinica, avisar } = useApp();
  const [editar, setEditar] = useState(false);
  const pacientes = usePacientes(clinica.id) || [];
  const pac = pacientes.find((x) => x.id === c.pacienteId);
  const p = profDe(clinica, c.profesionalId);
  const estado = async (v) => {
    const marca = { llego: { llegada: new Date().toISOString() }, 'en-atencion': { inicio: new Date().toISOString() }, atendida: { fin: new Date().toISOString() } }[v] || {};
    try { await guardarCitaFS(clinica.id, { id: c.id, estado: v, ...marca }); avisar(estadoCita(v).t); } catch (e) { avisar('No se pudo cambiar.', 'warn'); }
  };
  if (editar) return <ModalCita inicial={c} cerrar={() => { setEditar(false); cerrar(); }} />;
  const tel = pac && telefonoWa(pac.telefono);
  const msg = `Hola ${c.pacienteNombre.split(' ')[0]}, te recordamos tu hora en ${clinica.nombre} el ${fechaLarga(c.fecha)} a las ${c.hora}. Responde SÍ para confirmar.`;
  const fila = (t, v) => <div className="flex justify-between gap-4 border-b border-[var(--cl-line-2)] py-2 text-[13.5px] last:border-0"><span className="text-[var(--cl-muted)]">{t}</span><span className="text-right text-ink">{v}</span></div>;
  return (
    <PanelLateral titulo="Cita" cerrar={cerrar} pie={<><Btn v="primary" icon="personas" onClick={abrirFicha}>Abrir la ficha</Btn><Btn icon="edit" onClick={() => setEditar(true)}>Editar</Btn>{tel && <a href={`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" className="ui-btn inline-flex items-center gap-2 rounded-lg border border-[var(--cl-line)] px-3 py-2 text-[13px] font-semibold text-ok hover:bg-[var(--cl-hover)]"><Ic n="chat" s={15} />Recordar</a>}</>}>
      <div className="flex items-center gap-3"><Avatar nombre={c.pacienteNombre} size={46} /><div className="min-w-0"><b className="block truncate text-[17px] text-deep">{c.pacienteNombre}</b><span className="text-[13px] text-[var(--cl-muted)]">{pac ? [edad(pac.nacimiento) !== '' ? edad(pac.nacimiento) + ' años' : '', pac.prevision, pac.telefono].filter(Boolean).join(' · ') : ''}</span></div></div>
      <div className="mt-4 rounded-[10px] border border-[var(--cl-line)] px-3.5 py-1">
        {fila('Fecha', <span>{fechaLarga(c.fecha)}</span>)}
        {fila('Hora', <span className="tabular-nums">{c.hora} – {hhmm(mins(c.hora) + (c.duracion || 30))} · {c.duracion || 30} min</span>)}
        {fila('Profesional', p ? <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: colorProf(clinica, c.profesionalId) }} />{p.nombre}</span> : '—')}
        {fila('Box', c.box || '—')}
        {fila('Motivo', c.motivo || 'Atención')}
        {c.llegada && fila('Llegó', new Date(c.llegada).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }))}
      </div>
      <p className="rotulo m-0 mb-2 mt-5">Estado</p>
      <div className="grid grid-cols-2 gap-1.5">{ESTADOS_CITA.map((e) => <button key={e.v} type="button" onClick={() => estado(e.v)} aria-pressed={c.estado === e.v} className={cx('flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] font-semibold', c.estado === e.v ? 'border-[var(--cl-pri)] bg-[var(--cl-sel)] text-deep' : 'border-[var(--cl-line)] text-ink2 hover:bg-[var(--cl-hover)]')}><span className={cx('h-2 w-2 rounded-full', e.dot)} />{e.t}</button>)}</div>
    </PanelLateral>
  );
}

/* ═════════ PACIENTES ═════════ */
export function Pacientes() {
  const { clinica, abrirPaciente, rolClinica } = useApp();
  const pacientes = usePacientes(clinica.id);
  const proximas = useCitas(clinica.id, hoy(), sumar(hoy(), 90)) || [];
  const pres = useColeccionClinica(clinica.id, 'presupuestos') || [];
  const pagos = useColeccionClinica(clinica.id, 'pagos') || [];
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [nuevo, setNuevo] = useState(false);
  const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const prox = (pid) => proximas.filter((c) => c.pacienteId === pid && !['cancelada', 'atendida', 'no-asistio'].includes(c.estado)).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0];
  const saldo = (pid) => pres.filter((x) => x.pacienteId === pid && x.estado === 'aceptado').reduce((s, x) => s + (x.total || 0) - pagadoDe(pagos, x.id), 0);
  const filas = (pacientes || []).map((p) => ({ p, prox: prox(p.id), saldo: saldo(p.id), venc: p.control && p.control.fecha && diasHasta(p.control.fecha) < 0 }));
  const FILTROS = [['todos', 'Todos', filas.length], ['saldo', 'Con saldo', filas.filter((f) => f.saldo > 0).length], ['control', 'Control vencido', filas.filter((f) => f.venc).length], ['sincita', 'Sin próxima cita', filas.filter((f) => !f.prox).length]];
  const lista = filas.filter((f) => (filtro === 'todos' || (filtro === 'saldo' ? f.saldo > 0 : filtro === 'control' ? f.venc : !f.prox)) && (!q || norm(nombreDe(f.p) + ' ' + (f.p.rut || '') + ' ' + (f.p.telefono || '')).includes(norm(q))));
  const PL = 'minmax(220px,2fr) 70px minmax(130px,1.1fr) minmax(120px,1fr) minmax(130px,1fr) minmax(120px,1fr) 110px';
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
      <Cabecera titulo="Pacientes" sub={`${(pacientes || []).length} pacientes registrados`} acciones={<Btn v="primary" icon="plus" onClick={() => setNuevo(true)}>Paciente nuevo</Btn>} />
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-9 w-full max-w-[360px] items-center gap-2 rounded-lg border border-[var(--cl-line)] bg-card px-3"><Ic n="search" s={15} className="text-ink3" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, RUT o teléfono" aria-label="Buscar paciente" className="w-full bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink3" /></label>
        <div className="flex flex-wrap gap-1">{FILTROS.map(([k, t, n]) => <button key={k} type="button" onClick={() => setFiltro(k)} aria-pressed={filtro === k} className={cx('rounded-md border px-2.5 py-1.5 text-[12.5px] font-semibold', filtro === k ? 'border-[var(--cl-pri)] bg-[var(--cl-sel)] text-deep' : 'border-[var(--cl-line)] bg-card text-ink2 hover:bg-[var(--cl-hover)]')}>{t} <span className="tabular-nums text-[var(--cl-muted)]">{n}</span></button>)}</div>
      </div>
      {pacientes === null ? <div className="h-40 animate-pulse rounded-[10px] bg-[var(--cl-line-2)]" /> : !lista.length ? <Vacio icon="personas" titulo={q || filtro !== 'todos' ? 'Sin resultados' : 'Todavía no hay pacientes'} accion={<Btn v="primary" icon="plus" onClick={() => setNuevo(true)}>Paciente nuevo</Btn>} /> : (
        <Tarjeta>
          <CabTabla plantilla={PL} cols={['Paciente', 'Edad', 'Contacto', 'Previsión', 'Próxima cita', 'Próximo control', '>Saldo']} />
          {lista.map(({ p, prox: pc, saldo: sd, venc }) => (
            <button key={p.id} type="button" onClick={() => abrirPaciente(p.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 border-b border-[var(--cl-line-2)] px-4 py-2.5 text-left text-[13.5px] last:border-0 hover:bg-[var(--cl-hover)] md:[grid-template-columns:var(--pl)]" style={{ '--pl': PL }}>
              <span className="flex min-w-0 items-center gap-2.5"><Avatar nombre={nombreDe(p)} size={32} /><span className="min-w-0"><b className="block truncate font-semibold text-ink">{nombreDe(p)}</b><span className="block truncate text-[12px] text-ink3">{p.rut || (p.ficticio ? 'Paciente ficticio · sin RUT' : 'Sin RUT')}</span></span></span>
              <span className="hidden tabular-nums text-ink2 md:block">{edad(p.nacimiento) !== '' ? edad(p.nacimiento) : '—'}</span>
              <span className="hidden truncate tabular-nums text-ink2 md:block">{p.telefono || '—'}</span>
              <span className="hidden truncate text-ink2 md:block">{p.prevision || '—'}{p.convenio ? <span className="block truncate text-[11.5px] text-acento">{p.convenio}</span> : null}</span>
              <span className="hidden text-ink2 md:block">{pc ? <><span>{fechaCorta(pc.fecha)}</span> <span className="tabular-nums text-ink3">{pc.hora}</span></> : <span className="text-ink3">—</span>}</span>
              <span className={cx('hidden md:block', venc ? 'font-semibold text-bad' : 'text-ink2')}>{p.control && p.control.fecha ? (venc ? 'Vencido · ' : '') + fechaCorta(p.control.fecha) : <span className="text-ink3">—</span>}</span>
              <span className={cx('text-right tabular-nums', sd > 0 ? 'font-semibold text-warn' : 'text-ink3')}>{sd > 0 ? clp(sd) : '—'}</span>
              <span className="col-span-2 truncate text-[12px] text-ink3 md:hidden">{[edad(p.nacimiento) !== '' ? edad(p.nacimiento) + ' años' : '', p.prevision, pc ? 'Próxima: ' + fechaCorta(pc.fecha) : ''].filter(Boolean).join(' · ')}</span>
            </button>
          ))}
        </Tarjeta>
      )}
      {nuevo && <ModalPaciente cerrar={() => setNuevo(false)} alGuardar={(id) => { setNuevo(false); abrirPaciente(id); }} />}
    </div>
  );
}

const PREVISIONES = ['Fonasa', 'Isapre', 'Particular', 'Otra'];
export function ModalPaciente({ inicial = {}, cerrar, alGuardar }) {
  const { clinica, avisar } = useApp();
  const [f, setF] = useState({ nombres: '', apellidos: '', rut: '', nacimiento: '', sexo: '', telefono: '', correo: '', prevision: 'Fonasa', direccion: '', ...inicial });
  const [err, setErr] = useState('');
  const guardar = async () => {
    if (!f.nombres.trim() || !f.apellidos.trim()) { setErr('Escribe nombres y apellidos.'); return; }
    try { const { id, ...resto } = f; const nid = await guardarPacienteFS(clinica.id, { ...resto, id: inicial.id, ficticio: inicial.id ? !!inicial.ficticio : !!clinica.demo }); avisar('Paciente guardado'); alGuardar && alGuardar(nid); cerrar(); }
    catch (e) { setErr('No se pudo guardar. Revisa tu conexión.'); }
  };
  const campo = (k, t, props = {}) => <Field label={t} id={'pa-' + k}><input id={'pa-' + k} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={inputCls} {...props} /></Field>;
  return (
    <Modal open onClose={cerrar} title={inicial.id ? 'Datos del paciente' : 'Paciente nuevo'}>
      <div className="flex flex-col gap-3">
        {clinica.demo && <p className="m-0 rounded-[14px] bg-warnsoft px-3.5 py-2.5 text-[12.5px] font-semibold text-warn">Clínica de demostración: no ingreses datos de personas reales.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {campo('nombres', 'Nombres')}{campo('apellidos', 'Apellidos')}{campo('rut', 'RUT')}{campo('nacimiento', 'Fecha de nacimiento', { type: 'date' })}
          <Field label="Sexo" id="pa-sexo"><select id="pa-sexo" value={f.sexo} onChange={(e) => setF({ ...f, sexo: e.target.value })} className={inputCls}><option value="">—</option><option>Femenino</option><option>Masculino</option><option>Otro</option></select></Field>
          <Field label="Previsión" id="pa-prev"><select id="pa-prev" value={f.prevision} onChange={(e) => setF({ ...f, prevision: e.target.value })} className={inputCls}>{PREVISIONES.map((x) => <option key={x}>{x}</option>)}</select></Field>
          {campo('telefono', 'Teléfono', { type: 'tel' })}{campo('correo', 'Correo', { type: 'email' })}
        </div>
        {err && <p className="m-0 text-[13px] font-semibold text-bad">{err}</p>}
        <div className="flex gap-2"><Btn v="primary" onClick={guardar}>Guardar</Btn><Btn onClick={cerrar}>Cancelar</Btn></div>
      </div>
    </Modal>
  );
}

/* ═════════ FICHA DEL PACIENTE ═════════
   Cabecera fija con los datos clave y las alertas médicas (alergias, condiciones, embarazo), saldo y próxima cita;
   las secciones de la ficha a la izquierda. Cada apertura queda en el registro de accesos. */
const SECCIONES_FICHA = [['resumen', 'Resumen', 'personas', false], ['odontograma', 'Odontograma', 'diente', true], ['perio', 'Periodontograma', 'grafico', true], ['plan', 'Plan de tratamiento', 'folder', false], ['evoluciones', 'Evoluciones', 'edit', true], ['documentos', 'Documentos', 'copy', true], ['laboratorio', 'Laboratorio', 'tool', true], ['imagenes', 'Imágenes', 'image', true], ['presupuestos', 'Presupuestos y pagos', 'dinero', false], ['citas', 'Citas', 'calendario', false]];
const sinDato = (t) => !t || !String(t).trim() || /^(no\b|ningun[oa]?\b|niega|sin\b)/i.test(String(t).trim());
export function Paciente() {
  const { clinica, rolClinica, pacienteId, go, myUid, perfil, tabClinica, irClinica } = useApp();
  const p = usePaciente(clinica.id, pacienteId);
  const esClinico = clinico(rolClinica);
  const ficha = useFicha(clinica.id, pacienteId, esClinico);
  const secciones = SECCIONES_FICHA.filter(([, , , c]) => !c || esClinico);
  const [tab, setTab] = useState(secciones.some(([k]) => k === tabClinica) ? tabClinica : 'resumen');
  const [editarDatos, setEditarDatos] = useState(false);
  const [agendar, setAgendar] = useState(false);
  const citas = useColeccionClinica(clinica.id, 'citas', 'pacienteId', pacienteId) || [];
  const pres = useColeccionClinica(clinica.id, 'presupuestos', 'pacienteId', pacienteId) || [];
  const pagos = useColeccionClinica(clinica.id, 'pagos', 'pacienteId', pacienteId) || [];
  useEffect(() => { if (pacienteId) registrarAccesoFS(clinica.id, { uid: myUid, nombre: (perfil && perfil.nombre) || '', pacienteId, accion: 'abrir ficha' }); }, [pacienteId]);
  if (p === undefined) return <div className="h-64 animate-pulse rounded-[10px] bg-[var(--cl-line-2)]" />;
  if (p === null) return <Vacio icon="personas" titulo="No encontramos este paciente" accion={<Btn onClick={() => go('pacientes')}>Volver a pacientes</Btn>} />;
  const alertas = ficha ? [
    !sinDato(ficha.alergias) && ['bad', 'Alergia: ' + ficha.alergias],
    !sinDato(ficha.enfermedades) && ['warn', ficha.enfermedades],
    !sinDato(ficha.medicamentos) && ['warn', 'Usa ' + ficha.medicamentos],
    !sinDato(ficha.embarazo) && ['warn', ficha.embarazo]
  ].filter(Boolean) : [];
  const ahoraKey = hoy() + ' 00:00';
  const proxima = citas.filter((c) => (c.fecha + ' ' + c.hora) >= ahoraKey && !['cancelada', 'atendida', 'no-asistio'].includes(c.estado)).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0];
  const ultima = citas.filter((c) => c.estado === 'atendida').sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora))[0];
  const saldo = pres.filter((x) => x.estado === 'aceptado').reduce((s, x) => s + (x.total || 0) - pagadoDe(pagos, x.id), 0);
  const dato = (t, v, tono) => <div className="min-w-0 border-l border-[var(--cl-line-2)] px-4 first:border-0 first:pl-0"><span className="block text-[11px] font-semibold uppercase tracking-[.05em] text-[var(--cl-muted)]">{t}</span><b className={cx('block truncate text-[13.5px] font-semibold', tono || 'text-ink')}>{v}</b></div>;
  const ir = (k) => { setTab(k); try { window.scrollTo(0, 0); } catch (e) {} };
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
      <nav className="flex items-center gap-1.5 text-[12.5px] text-[var(--cl-muted)]"><button type="button" onClick={() => go('pacientes')} className="hover:text-ink hover:underline">Pacientes</button><Ic n="back" s={12} className="rotate-180" /><span className="truncate text-ink">{nombreDe(p)}</span></nav>
      <section className="overflow-hidden rounded-[10px] border border-[var(--cl-line)] bg-card">
        <div className="flex flex-wrap items-center gap-4 px-5 py-4">
          <Avatar nombre={nombreDe(p)} size={52} />
          <div className="min-w-0 flex-1">
            <h1 className="m-0 flex flex-wrap items-center gap-2 text-[21px] font-bold tracking-[-.015em] text-deep">{nombreDe(p)}{p.ficticio && <span className="rounded-md bg-warnsoft px-2 py-0.5 text-[11px] font-bold text-warn">Ficticio</span>}</h1>
            <p className="m-0 mt-0.5 text-[13px] text-[var(--cl-muted)]">{[edad(p.nacimiento) !== '' ? edad(p.nacimiento) + ' años' : '', p.sexo, p.rut ? 'RUT ' + p.rut : '', p.prevision, p.convenio, p.telefono].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn icon="calendario" onClick={() => setAgendar(true)}>Agendar</Btn>
            {esClinico && <Btn icon="edit" onClick={() => ir('evoluciones')}>Evolución</Btn>}
            <Btn icon="dinero" onClick={() => ir('presupuestos')}>Cobrar</Btn>
            <Btn v="ghost" onClick={() => setEditarDatos(true)}>Datos</Btn>
          </div>
        </div>
        {alertas.length > 0 && <div className="flex flex-wrap gap-1.5 border-t border-[var(--cl-line-2)] bg-[color-mix(in_srgb,var(--bad-soft)_30%,#fff)] px-5 py-2.5">{alertas.map(([tono, t], k) => <span key={k} className={cx('inline-flex max-w-full items-center gap-1.5 truncate rounded-md px-2 py-1 text-[12.5px] font-semibold', tono === 'bad' ? 'bg-bad text-onc' : 'bg-warnsoft text-warn')}><Ic n="alert" s={13} />{t}</span>)}</div>}
        {!esClinico && <div className="border-t border-[var(--cl-line-2)] px-5 py-2 text-[12px] text-[var(--cl-muted)]">Las alertas médicas y la ficha clínica las ven solo los odontólogos y la administración.</div>}
        <div className="grid grid-cols-2 gap-y-3 border-t border-[var(--cl-line-2)] px-5 py-3 sm:flex">
          {dato('Próxima cita', proxima ? <span>{fechaCorta(proxima.fecha)} · {proxima.hora}</span> : 'Sin agendar', proxima ? '' : 'text-ink3')}
          {dato('Última atención', ultima ? <span>{fechaCorta(ultima.fecha)}</span> : '—')}
          {dato('Próximo control', p.control && p.control.fecha ? fechaCorta(p.control.fecha) : '—', p.control && p.control.fecha && diasHasta(p.control.fecha) < 0 ? 'text-bad' : '')}
          {dato('Saldo pendiente', clp(saldo), saldo > 0 ? 'text-warn' : 'text-ok')}
        </div>
      </section>
      <div className="grid gap-4 [&>*]:min-w-0 lg:grid-cols-[208px_minmax(0,1fr)]">
        <nav className="scroll-x -mx-4 flex gap-1 overflow-x-auto px-4 lg:sticky lg:top-[76px] lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:px-0" aria-label="Secciones de la ficha">
          {secciones.map(([k, t, ic]) => <button key={k} type="button" onClick={() => ir(k)} aria-current={tab === k ? 'page' : undefined} className={cx('flex flex-none items-center gap-2.5 rounded-[7px] px-3 py-2 text-left text-[13.5px]', tab === k ? 'bg-card font-semibold text-deep shadow-[inset_0_0_0_1px_var(--cl-line)]' : 'text-ink2 hover:bg-[var(--cl-hover)]')}><Ic n={ic} s={16} className={tab === k ? 'text-[var(--cl-pri)]' : 'text-[var(--cl-muted)]'} />{t}</button>)}
        </nav>
        <div className="min-w-0">
          {tab === 'resumen' && <Resumen p={p} ficha={ficha} esClinico={esClinico} />}
          {tab === 'odontograma' && <OdontogramaFicha ficha={ficha} />}
          {tab === 'perio' && <PerioFicha />}
          {tab === 'plan' && <PlanTratamiento p={p} />}
          {tab === 'laboratorio' && <LaboratorioPaciente p={p} />}
          {tab === 'evoluciones' && <Evoluciones p={p} />}
          {tab === 'documentos' && <Documentos p={p} />}
          {tab === 'imagenes' && <Vacio icon="image" titulo="Radiografías y fotos clínicas">Se guardan en Firebase Storage, que todavía no está activado en el proyecto (exige el plan Blaze). Cuando se active, aquí se suben y se ven completas, sin recortar, por fecha y tipo.</Vacio>}
          {tab === 'presupuestos' && <PresupuestosPaciente p={p} />}
          {tab === 'citas' && <CitasPaciente p={p} />}
        </div>
      </div>
      {editarDatos && <ModalPaciente inicial={p} cerrar={() => setEditarDatos(false)} />}
      {agendar && <ModalCita inicial={{ pacienteId: p.id, pacienteNombre: nombreDe(p), fecha: sumar(hoy(), 1), hora: '09:00' }} cerrar={() => setAgendar(false)} />}
    </div>
  );
}

const ANTECEDENTES = [['enfermedades', 'Enfermedades y condiciones'], ['medicamentos', 'Medicamentos que usa'], ['alergias', 'Alergias'], ['habitos', 'Hábitos (tabaco, bruxismo, otros)'], ['embarazo', 'Embarazo o lactancia'], ['observaciones', 'Observaciones']];
function Resumen({ p, ficha, esClinico }) {
  const { clinica, pacienteId, avisar } = useApp();
  const [f, setF] = useState(null);
  useEffect(() => { if (ficha && f === null) setF(Object.fromEntries(ANTECEDENTES.map(([k]) => [k, ficha[k] || '']))); }, [ficha]);
  const guardar = async () => { try { await guardarFichaFS(clinica.id, pacienteId, f); avisar('Antecedentes guardados'); } catch (e) { avisar('No se pudo guardar.', 'warn'); } };
  return (
    <div className="grid gap-4 [&>*]:min-w-0 lg:grid-cols-[1fr_1.3fr]">
      <section className="flex flex-col gap-2 rounded-[22px] bg-card p-5 shadow-sh">
        <p className="rotulo m-0">Datos</p>
        {[['RUT', p.rut], ['Nacimiento', p.nacimiento], ['Sexo', p.sexo], ['Previsión', p.prevision], ['Teléfono', p.telefono], ['Correo', p.correo]].map(([t, v]) => <div key={t} className="flex justify-between gap-3 border-b border-line2 py-1.5 text-[14px] last:border-0"><span className="text-ink3">{t}</span><span className="text-right text-ink">{v || '—'}</span></div>)}
      </section>
      {esClinico ? (
        <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5 shadow-sh">
          <p className="rotulo m-0">Anamnesis y antecedentes</p>
          {f === null ? <div className="h-32 animate-pulse rounded-[16px] bg-soft" /> : ANTECEDENTES.map(([k, t]) => <Field key={k} label={t} id={'an-' + k}><textarea id={'an-' + k} rows={k === 'enfermedades' || k === 'observaciones' ? 2 : 1} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={inputCls} /></Field>)}
          {f && <Btn v="primary" className="self-start" onClick={guardar}>Guardar antecedentes</Btn>}
        </section>
      ) : <section className="rounded-[22px] bg-soft p-5 text-[13.5px] text-ink2">Los antecedentes clínicos, el odontograma, las evoluciones y los documentos los ven solo los odontólogos y la administración.</section>}
      <ControlPaciente p={p} />
    </div>
  );
}

function OdontogramaFicha({ ficha }) {
  const { clinica, pacienteId, avisar } = useApp();
  const [od, setOd] = useState(null);
  const [cambios, setCambios] = useState(false);
  useEffect(() => { if (ficha && od === null) setOd(ficha.odontograma || {}); }, [ficha]);
  if (od === null) return <div className="h-64 animate-pulse rounded-[22px] bg-soft" />;
  const guardar = async () => { try { await guardarFichaFS(clinica.id, pacienteId, { odontograma: od }); setCambios(false); avisar('Odontograma guardado'); } catch (e) { avisar('No se pudo guardar.', 'warn'); } };
  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5 shadow-sh">
      <Odontograma valor={od} onChange={(v) => { setOd(v); setCambios(true); }} />
      <div className="flex gap-2"><Btn v="primary" disabled={!cambios} onClick={guardar}>{cambios ? 'Guardar odontograma' : 'Guardado'}</Btn></div>
    </section>
  );
}

function Evoluciones({ p }) {
  const { clinica, pacienteId, myUid, perfil, avisar } = useApp();
  const lista = useSub(clinica.id, pacienteId, 'evoluciones');
  const ciclos = (useColeccionClinica(clinica.id, 'esterilizacion') || []).filter((c) => c.quimico === 'ok' && c.biologico !== 'falla').slice(0, 15);
  const [f, setF] = useState({ diente: '', procedimiento: '', nota: '', lote: '' });
  const [err, setErr] = useState('');
  const firmar = async () => {
    if (f.nota.trim().length < 5) { setErr('Escribe la evolución.'); return; }
    try { await agregarEvolucionFS(clinica.id, pacienteId, { ...f, nota: f.nota.trim(), profesional: { uid: myUid, nombre: (perfil && perfil.nombre) || 'Profesional' } }); setF({ diente: '', procedimiento: '', nota: '', lote: '' }); setErr(''); avisar('Evolución firmada'); }
    catch (e) { setErr('No se pudo guardar. Revisa tu conexión.'); }
  };
  return (
    <div className="grid gap-4 [&>*]:min-w-0 lg:grid-cols-[1fr_1.2fr]">
      <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5 shadow-sh">
        <p className="rotulo m-0">Nueva evolución</p>
        <div className="grid gap-3 sm:grid-cols-[100px_1fr]">
          <Field label="Pieza" id="ev-d"><input id="ev-d" value={f.diente} onChange={(e) => setF({ ...f, diente: e.target.value })} placeholder="1.6" className={inputCls} /></Field>
          <Field label="Procedimiento" id="ev-p"><input id="ev-p" list="arancel" value={f.procedimiento} onChange={(e) => setF({ ...f, procedimiento: e.target.value })} className={inputCls} /><datalist id="arancel">{(clinica.arancel || []).map((a) => <option key={a.codigo} value={a.nombre} />)}</datalist></Field>
        </div>
        <Field label="Lote de esterilización del instrumental" id="ev-l" hint="Trazabilidad: queda unido a esta atención"><select id="ev-l" value={f.lote} onChange={(e) => setF({ ...f, lote: e.target.value })} className={inputCls}><option value="">Sin registrar</option>{ciclos.map((c) => <option key={c.id} value={c.lote || ('Ciclo ' + c.ciclo)}>{(c.lote || 'Ciclo ' + c.ciclo) + ' · ' + c.equipo + ' · ' + new Date(c.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</option>)}</select></Field>
        <Field label="Qué se hizo y cómo quedó" id="ev-n"><textarea id="ev-n" rows={5} value={f.nota} onChange={(e) => { setF({ ...f, nota: e.target.value }); setErr(''); }} className={inputCls} /></Field>
        {err && <p className="m-0 text-[13px] font-semibold text-bad">{err}</p>}
        <Btn v="primary" icon="check" className="self-start" onClick={firmar}>Firmar evolución</Btn>
        <p className="m-0 text-[12px] text-ink3">Al firmarla queda a tu nombre con fecha y hora, y no se puede editar ni borrar. Para corregir, agrega una evolución nueva.</p>
      </section>
      <section className="flex flex-col gap-3">
        {lista === null ? <div className="h-40 animate-pulse rounded-[22px] bg-soft" /> : !lista.length ? <Vacio icon="edit" titulo="Sin evoluciones todavía" /> : lista.map((e) => (
          <article key={e.id} className="rounded-[18px] bg-card p-4 shadow-sh">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><b className="text-[14.5px] text-ink">{[e.diente && 'Pieza ' + e.diente, e.procedimiento].filter(Boolean).join(' · ') || 'Evolución'}</b><span className="text-[12px] text-ink3">{new Date(e.fecha).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
            <p className="m-0 mt-1.5 whitespace-pre-line text-[14px] leading-relaxed text-ink2">{e.nota}</p>
            <p className="m-0 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold"><span className="inline-flex items-center gap-1.5 text-ok"><Ic n="check" s={13} />Firmada por {e.profesional && e.profesional.nombre}</span>{e.lote && <span className="text-ink3">Instrumental: {e.lote}</span>}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

function Documentos({ p }) {
  const { clinica, pacienteId, myUid, perfil, avisar } = useApp();
  const lista = useSub(clinica.id, pacienteId, 'documentos');
  const [tipo, setTipo] = useState(null);
  const [texto, setTexto] = useState('');
  const elegir = (k) => { const pl = PLANTILLAS.find((x) => x.k === k); setTipo(k); setTexto(pl.texto({ paciente: nombreDe(p), rut: p.rut, edad: edad(p.nacimiento), profesional: (perfil && perfil.nombre) || 'el profesional', clinica: clinica.nombre, fecha: new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) })); };
  const imprimir = (d) => imprimirHoja({ clinica: clinica.nombre, demo: clinica.demo, titulo: d.titulo, cuerpoHtml: textoHtml(d.texto), pie: d.tipo === 'consentimiento' ? firmasHtml('Firma del paciente', 'Firma del profesional · ' + (d.profesional && d.profesional.nombre || '')) : firmasHtml('', 'Firma y timbre · ' + (d.profesional && d.profesional.nombre || '')) });
  const emitir = async () => {
    const pl = PLANTILLAS.find((x) => x.k === tipo);
    const d = { tipo, titulo: pl.t, texto: texto.trim(), profesional: { uid: myUid, nombre: (perfil && perfil.nombre) || 'Profesional' } };
    try { await emitirDocumentoFS(clinica.id, pacienteId, d); avisar('Documento emitido'); imprimir(d); setTipo(null); }
    catch (e) { avisar('No se pudo emitir.', 'warn'); }
  };
  return (
    <div className="grid gap-4 [&>*]:min-w-0 lg:grid-cols-[1.2fr_1fr]">
      <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5 shadow-sh">
        <p className="rotulo m-0">Emitir un documento</p>
        <div className="flex flex-wrap gap-1.5">{PLANTILLAS.map((pl) => <button key={pl.k} type="button" onClick={() => elegir(pl.k)} aria-pressed={tipo === pl.k} className={cx('rounded-full border px-3 py-1.5 text-[12.5px] font-semibold', tipo === pl.k ? 'border-deep bg-deep text-onc' : 'border-cardline bg-card text-ink2')}>{pl.t}</button>)}</div>
        {tipo ? <>
          <textarea rows={14} value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Texto del documento" className={inputCls} />
          <p className="m-0 text-[12px] text-ink3">Plantilla de ejemplo: la clínica debe revisarla con su asesoría legal antes de usarla con pacientes reales. Al emitirlo queda guardado y no se edita.</p>
          <div className="flex gap-2"><Btn v="primary" icon="download" onClick={emitir}>Emitir e imprimir</Btn><Btn onClick={() => setTipo(null)}>Cancelar</Btn></div>
        </> : <p className="m-0 text-[13.5px] text-ink2">Elige una plantilla: se completa con los datos del paciente y la editas antes de emitir.</p>}
      </section>
      <section className="flex flex-col gap-2">
        {lista === null ? <div className="h-32 animate-pulse rounded-[22px] bg-soft" /> : !lista.length ? <Vacio icon="copy" titulo="Sin documentos emitidos" /> : lista.map((d) => (
          <button key={d.id} type="button" onClick={() => imprimir(d)} className="flex items-center gap-3 rounded-[18px] bg-card p-4 text-left shadow-sh hover:bg-soft">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-acentosoft text-acento"><Ic n="copy" s={17} /></span>
            <span className="min-w-0 flex-1"><b className="block text-[14.5px] text-ink">{d.titulo}</b><span className="block text-[12px] text-ink3">{new Date(d.fecha).toLocaleDateString('es-CL', { dateStyle: 'medium' })} · {d.profesional && d.profesional.nombre}</span></span>
            <Ic n="download" s={16} className="text-ink3" />
          </button>
        ))}
      </section>
    </div>
  );
}

/* ── Presupuestos y pagos ── */
export const pagadoDe = (pagos, presId) => (pagos || []).filter((x) => x.presupuestoId === presId).reduce((s, x) => s + (x.monto || 0), 0);
export function PresupuestoCard({ pr, pagos, paciente }) {
  const { clinica, rolClinica, avisar, myUid, perfil } = useApp();
  const [pago, setPago] = useState(null);
  const pagado = pagadoDe(pagos, pr.id), saldo = (pr.total || 0) - pagado;
  const estado = async (v) => { try { await guardarPresupuestoFS(clinica.id, { id: pr.id, estado: v }); avisar('Presupuesto ' + v); } catch (e) { avisar('No se pudo cambiar.', 'warn'); } };
  const pagar = async () => {
    const monto = Math.round(+pago.monto || 0);
    if (monto <= 0) { avisar('Escribe el monto.', 'warn'); return; }
    try { await registrarPagoFS(clinica.id, { pacienteId: pr.pacienteId, pacienteNombre: pr.pacienteNombre, presupuestoId: pr.id, monto, medio: pago.medio, registradoPor: { uid: myUid, nombre: (perfil && perfil.nombre) || '' } }); setPago(null); avisar('Pago registrado'); }
    catch (e) { avisar('No se pudo registrar.', 'warn'); }
  };
  const imprimir = () => imprimirHoja({ clinica: clinica.nombre, demo: clinica.demo, titulo: 'Presupuesto · ' + pr.pacienteNombre, cuerpoHtml: tablaHtml((pr.items || []).map((i) => ({ ...i, valorTxt: clp(i.valor) })), clp(pr.total)), pie: `<p style="margin-top:14px">Pagado: ${clp(pagado)} · Saldo: ${clp(saldo)}</p>` });
  return (
    <article className="flex flex-col gap-3 rounded-[20px] bg-card p-4 shadow-sh">
      <div className="flex flex-wrap items-center gap-2">
        <b className="text-[15px] text-ink">{paciente ? pr.pacienteNombre : new Date(pr.fecha).toLocaleDateString('es-CL', { dateStyle: 'medium' })}</b>
        <span className={cx('rounded-full px-2.5 py-1 text-[11.5px] font-bold', pr.estado === 'aceptado' ? 'bg-oksoft text-ok' : pr.estado === 'rechazado' ? 'bg-soft text-ink3' : 'bg-warnsoft text-warn')}>{pr.estado || 'propuesto'}</span>
        <span className="ml-auto text-[18px] font-extrabold tabular-nums text-deep">{clp(pr.total)}</span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13.5px]">{(pr.items || []).map((i, k) => <li key={k} className="flex justify-between gap-3"><span className="text-ink2">{i.diente ? <b className="mr-1.5 text-ink">{i.diente}</b> : null}{i.tratamiento}</span><span className="tabular-nums text-ink">{clp(i.valor)}</span></li>)}</ul>
      <div className="h-2 overflow-hidden rounded-full bg-soft"><span className="block h-full rounded-full bg-ok" style={{ width: Math.min(100, pr.total ? (pagado / pr.total) * 100 : 0) + '%' }} /></div>
      <p className="m-0 text-[12.5px] text-ink2">Pagado <b className="text-ink">{clp(pagado)}</b> · Saldo <b className={saldo > 0 ? 'text-warn' : 'text-ok'}>{clp(saldo)}</b></p>
      <div className="flex flex-wrap gap-1.5">
        {pr.estado !== 'aceptado' && <Btn sm v="soft" onClick={() => estado('aceptado')}>Aceptado</Btn>}
        {pr.estado !== 'rechazado' && pr.estado !== 'aceptado' && <Btn sm onClick={() => estado('rechazado')}>Rechazado</Btn>}
        {pr.estado === 'aceptado' && saldo > 0 && <Btn sm v="primary" icon="dinero" onClick={() => setPago({ monto: saldo, medio: 'Débito' })}>Registrar pago</Btn>}
        <Btn sm icon="download" onClick={imprimir}>Imprimir</Btn>
      </div>
      {pago && (
        <div className="flex flex-wrap items-end gap-2 rounded-[14px] bg-soft p-3">
          <Field label="Monto" id={'pg-' + pr.id}><input id={'pg-' + pr.id} type="number" min="1" value={pago.monto} onChange={(e) => setPago({ ...pago, monto: e.target.value })} className={cx(inputCls, '!w-36 !bg-card')} /></Field>
          <Field label="Medio" id={'pm-' + pr.id}><select id={'pm-' + pr.id} value={pago.medio} onChange={(e) => setPago({ ...pago, medio: e.target.value })} className={cx(inputCls, '!bg-card')}>{['Efectivo', 'Débito', 'Crédito', 'Transferencia'].map((m) => <option key={m}>{m}</option>)}</select></Field>
          <Btn v="primary" onClick={pagar}>Registrar</Btn><Btn onClick={() => setPago(null)}>Cancelar</Btn>
        </div>
      )}
      {!clinico(rolClinica) && pr.estado !== 'aceptado' && <p className="m-0 text-[11.5px] text-ink3">Recepción puede marcar la respuesta del paciente y registrar pagos.</p>}
    </article>
  );
}

function PresupuestosPaciente({ p }) {
  const { clinica, rolClinica, pacienteId, myUid, perfil, avisar } = useApp();
  const lista = useColeccionClinica(clinica.id, 'presupuestos', 'pacienteId', pacienteId);
  const pagos = useColeccionClinica(clinica.id, 'pagos', 'pacienteId', pacienteId);
  const [nuevo, setNuevo] = useState(null);
  const total = (nuevo || []).reduce((s, i) => s + (+i.valor || 0), 0);
  const crear = async () => {
    const items = nuevo.filter((i) => i.tratamiento.trim()).map((i) => ({ diente: i.diente.trim(), tratamiento: i.tratamiento.trim(), valor: Math.round(+i.valor || 0) }));
    if (!items.length) { avisar('Agrega al menos un tratamiento.', 'warn'); return; }
    const profId = ((clinica.profesionales || []).find((x) => x.uid === myUid) || (clinica.profesionales || [])[0] || {}).id || '';
    try { await guardarPresupuestoFS(clinica.id, { pacienteId, pacienteNombre: nombreDe(p), items, total: items.reduce((s, i) => s + i.valor, 0), estado: 'propuesto', profesionalId: profId, profesional: { uid: myUid, nombre: (perfil && perfil.nombre) || '' } }); setNuevo(null); avisar('Presupuesto creado'); }
    catch (e) { avisar('No se pudo crear.', 'warn'); }
  };
  const valorDe = (nombre) => ((clinica.arancel || []).find((a) => a.nombre === nombre) || {}).valor;
  return (
    <div className="flex flex-col gap-3">
      {clinico(rolClinica) && !nuevo && <Btn v="primary" icon="plus" className="self-start" onClick={() => setNuevo([{ diente: '', tratamiento: '', valor: '' }])}>Nuevo presupuesto</Btn>}
      {nuevo && (
        <section className="flex flex-col gap-2 rounded-[20px] bg-card p-4 shadow-sh">
          {nuevo.map((i, k) => (
            <div key={k} className="grid gap-2 sm:grid-cols-[90px_1fr_130px_auto]">
              <input value={i.diente} onChange={(e) => setNuevo(nuevo.map((x, j) => (j === k ? { ...x, diente: e.target.value } : x)))} placeholder="Pieza" aria-label="Pieza" className={inputCls} />
              <input list="arancel-p" value={i.tratamiento} onChange={(e) => { const v = e.target.value; setNuevo(nuevo.map((x, j) => (j === k ? { ...x, tratamiento: v, valor: valorDe(v) !== undefined ? valorDe(v) : x.valor } : x))); }} placeholder="Tratamiento" aria-label="Tratamiento" className={inputCls} />
              <input type="number" value={i.valor} onChange={(e) => setNuevo(nuevo.map((x, j) => (j === k ? { ...x, valor: e.target.value } : x)))} placeholder="Valor" aria-label="Valor" className={inputCls} />
              <button type="button" onClick={() => setNuevo(nuevo.filter((_, j) => j !== k))} className="rounded-full px-3 text-[12.5px] font-semibold text-bad">Quitar</button>
            </div>
          ))}
          <datalist id="arancel-p">{(clinica.arancel || []).map((a) => <option key={a.codigo} value={a.nombre} />)}</datalist>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button type="button" onClick={() => setNuevo([...nuevo, { diente: '', tratamiento: '', valor: '' }])} className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-acento hover:bg-soft">+ Tratamiento</button>
            <b className="ml-auto text-[16px] tabular-nums text-deep">{clp(total)}</b><Btn v="primary" onClick={crear}>Crear</Btn><Btn onClick={() => setNuevo(null)}>Cancelar</Btn>
          </div>
        </section>
      )}
      {lista === null ? <div className="h-32 animate-pulse rounded-[22px] bg-soft" /> : !lista.length ? <Vacio icon="dinero" titulo="Sin presupuestos" /> : lista.map((pr) => <PresupuestoCard key={pr.id} pr={pr} pagos={pagos} />)}
    </div>
  );
}

function CitasPaciente({ p }) {
  const { clinica, pacienteId } = useApp();
  const lista = useColeccionClinica(clinica.id, 'citas', 'pacienteId', pacienteId);
  const ord = (lista || []).slice().sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  return lista === null ? <div className="h-32 animate-pulse rounded-[22px] bg-soft" /> : !ord.length ? <Vacio icon="calendario" titulo="Sin citas" /> : (
    <div className="overflow-hidden rounded-[22px] bg-card shadow-sh">{ord.map((c) => <div key={c.id} className="flex items-center gap-3 border-b border-line2 px-4 py-3 last:border-0"><span className="w-28 flex-none text-[13px] font-semibold text-ink">{fechaCorta(c.fecha)}</span><span className="w-12 flex-none text-[13px] tabular-nums text-ink2">{c.hora}</span><span className="min-w-0 flex-1 truncate text-[13.5px] text-ink2">{c.motivo || 'Atención'} · {c.box}</span><span className={cx('rounded-full border px-2.5 py-[2px] text-[11.5px] font-semibold', estadoCita(c.estado).cls)}>{estadoCita(c.estado).t}</span></div>)}</div>
  );
}

/* ═════════ PRESUPUESTOS Y PAGOS (toda la clínica) ═════════ */
export function CajaPresupuestos({ sinCabecera }) {
  const { clinica, abrirPaciente } = useApp();
  const lista = useColeccionClinica(clinica.id, 'presupuestos');
  const pagos = useColeccionClinica(clinica.id, 'pagos');
  const [filtro, setFiltro] = useState('saldo');
  const [abierto, setAbierto] = useState(null);
  const conSaldo = (pr) => pr.estado === 'aceptado' && pr.total - pagadoDe(pagos, pr.id) > 0;
  const FIL = [['saldo', 'Con saldo pendiente', conSaldo], ['propuesto', 'Por responder', (pr) => (pr.estado || 'propuesto') === 'propuesto'], ['aceptado', 'Aceptados', (pr) => pr.estado === 'aceptado'], ['todos', 'Todos', () => true]];
  const ver = (lista || []).filter(FIL.find((f) => f[0] === filtro)[2]);
  const hoyPagos = (pagos || []).filter((x) => (x.fecha || '').slice(0, 10) === hoy());
  const porCobrar = (lista || []).filter(conSaldo).reduce((s, pr) => s + pr.total - pagadoDe(pagos, pr.id), 0);
  const porResponder = (lista || []).filter((pr) => (pr.estado || 'propuesto') === 'propuesto').reduce((s, pr) => s + (pr.total || 0), 0);
  const mesPagos = (pagos || []).filter((x) => (x.fecha || '').slice(0, 7) === hoy().slice(0, 7));
  const PL = 'minmax(200px,1.6fr) 110px minmax(160px,1.4fr) 110px 110px 110px 120px';
  const actual = abierto && (lista || []).find((x) => x.id === abierto);
  return (
    <div className="flex flex-col gap-4">
      {!sinCabecera && <Cabecera titulo="Presupuestos y pagos" />}
      <Kpis items={[['Cobrado hoy', clp(hoyPagos.reduce((s, x) => s + x.monto, 0)), `${hoyPagos.length} pagos`, 'text-ok'], ['Cobrado este mes', clp(mesPagos.reduce((s, x) => s + x.monto, 0)), `${mesPagos.length} pagos`], ['Por cobrar', clp(porCobrar), 'Saldo de presupuestos aceptados', porCobrar ? 'text-warn' : ''], ['Por responder', clp(porResponder), 'Presupuestos sin respuesta del paciente']]} />
      <div className="flex flex-wrap gap-1">{FIL.map(([k, t, f]) => <button key={k} type="button" onClick={() => setFiltro(k)} aria-pressed={filtro === k} className={cx('rounded-md border px-2.5 py-1.5 text-[12.5px] font-semibold', filtro === k ? 'border-[var(--cl-pri)] bg-[var(--cl-sel)] text-deep' : 'border-[var(--cl-line)] bg-card text-ink2 hover:bg-[var(--cl-hover)]')}>{t} <span className="tabular-nums text-[var(--cl-muted)]">{(lista || []).filter(f).length}</span></button>)}</div>
      {lista === null ? <div className="h-40 animate-pulse rounded-[10px] bg-[var(--cl-line-2)]" /> : !ver.length ? <Vacio icon="dinero" titulo="Nada aquí" /> : (
        <Tarjeta>
          <CabTabla plantilla={PL} cols={['Paciente', 'Fecha', 'Tratamientos', '>Total', '>Pagado', '>Saldo', 'Estado']} />
          {ver.map((pr) => { const pg = pagadoDe(pagos, pr.id), sd = (pr.total || 0) - pg; return (
            <button key={pr.id} type="button" onClick={() => setAbierto(pr.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 border-b border-[var(--cl-line-2)] px-4 py-2.5 text-left text-[13.5px] last:border-0 hover:bg-[var(--cl-hover)] md:[grid-template-columns:var(--pl)]" style={{ '--pl': PL }}>
              <b className="truncate font-semibold text-ink">{pr.pacienteNombre}</b>
              <span className="hidden tabular-nums text-ink2 md:block">{new Date(pr.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</span>
              <span className="hidden truncate text-ink2 md:block">{(pr.items || []).map((i) => (i.diente ? i.diente + ' ' : '') + i.tratamiento).join(' · ')}</span>
              <span className="hidden text-right tabular-nums text-ink md:block">{clp(pr.total)}</span>
              <span className="hidden text-right tabular-nums text-ok md:block">{clp(pg)}</span>
              <span className={cx('text-right tabular-nums', sd > 0 && pr.estado === 'aceptado' ? 'font-semibold text-warn' : 'text-ink3')}>{clp(sd)}</span>
              <span className="hidden md:block"><Insignia cls={pr.estado === 'aceptado' ? 'bg-oksoft text-ok' : pr.estado === 'rechazado' ? 'bg-[var(--cl-line-2)] text-ink3' : 'bg-warnsoft text-warn'} dot={pr.estado === 'aceptado' ? 'bg-ok' : pr.estado === 'rechazado' ? 'bg-ink3' : 'bg-warn'}>{pr.estado === 'aceptado' ? 'Aceptado' : pr.estado === 'rechazado' ? 'Rechazado' : 'Por responder'}</Insignia></span>
            </button>
          ); })}
        </Tarjeta>
      )}
      <Panel titulo="Últimos pagos" cuerpo="p-0">
        {!(pagos || []).length ? <p className="m-0 px-4 py-4 text-[13.5px] text-ink3">Todavía no hay pagos.</p> : (<>
          <CabTabla plantilla="110px minmax(160px,1fr) 140px minmax(140px,1fr) 120px" cols={['Fecha', 'Paciente', 'Medio', 'Registró', '>Monto']} />
          {(pagos || []).slice(0, 15).map((x) => <div key={x.id} className="grid grid-cols-[1fr_auto] gap-x-3 border-b border-[var(--cl-line-2)] px-4 py-2.5 text-[13.5px] last:border-0 md:[grid-template-columns:110px_minmax(160px,1fr)_140px_minmax(140px,1fr)_120px]"><span className="hidden tabular-nums text-ink2 md:block">{new Date(x.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</span><span className="truncate text-ink">{x.pacienteNombre}</span><span className="hidden text-ink2 md:block">{x.medio}</span><span className="hidden truncate text-ink3 md:block">{x.registradoPor && x.registradoPor.nombre}</span><b className="text-right tabular-nums text-ok">{clp(x.monto)}</b></div>)}
        </>)}
      </Panel>
      {actual && (
        <PanelLateral titulo={'Presupuesto · ' + actual.pacienteNombre} cerrar={() => setAbierto(null)} pie={<Btn icon="personas" onClick={() => { setAbierto(null); abrirPaciente(actual.pacienteId, 'presupuestos'); }}>Abrir la ficha</Btn>}>
          <PresupuestoCard pr={actual} pagos={pagos} />
        </PanelLateral>
      )}
    </div>
  );
}

/* ═════════ CONFIRMACIONES ═════════ */
export function Confirmaciones({ sinCabecera }) {
  const { clinica, avisar } = useApp();
  const [dia, setDia] = useState(sumar(hoy(), 1));
  const citas = (useCitas(clinica.id, dia, dia) || []).filter((c) => c.estado !== 'cancelada').sort((a, b) => a.hora.localeCompare(b.hora));
  const pacientes = usePacientes(clinica.id) || [];
  const tel = (pid) => ((pacientes.find((p) => p.id === pid) || {}).telefono || '').replace(/\D/g, '');
  const mensaje = (c) => `Hola ${c.pacienteNombre.split(' ')[0]}, te recordamos tu hora en ${clinica.nombre} el ${fechaLarga(c.fecha)} a las ${c.hora}. Responde SÍ para confirmar o avísanos si necesitas cambiarla.`;
  const marcar = async (c, v) => { try { await guardarCitaFS(clinica.id, { id: c.id, estado: v }); avisar(v === 'confirmada' ? 'Confirmada' : 'Cancelada'); } catch (e) { avisar('No se pudo cambiar.', 'warn'); } };
  const porConfirmar = citas.filter((c) => c.estado === 'agendada').length;
  return (
    <div className={cx('flex flex-col gap-4', !sinCabecera && 'mx-auto max-w-[880px]')}>
      {!sinCabecera && <Cabecera titulo="Confirmaciones" />}
      <p className="m-0 text-[13.5px] text-ink2">{fechaLarga(dia)} · {porConfirmar} por confirmar de {citas.length}</p>
      <Seg opciones={[{ v: hoy(), t: 'Hoy' }, { v: sumar(hoy(), 1), t: 'Mañana' }, { v: sumar(hoy(), 2), t: 'Pasado mañana' }]} valor={dia} onChange={setDia} size="sm" />
      {!citas.length ? <Vacio icon="send" titulo="No hay citas ese día" /> : (
        <div className="flex flex-col gap-2">{citas.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-[18px] bg-card px-4 py-3 shadow-sh">
            <b className="w-12 text-[15px] tabular-nums text-deep">{c.hora}</b>
            <span className="min-w-0 flex-1"><b className="block truncate text-[14.5px] text-ink">{c.pacienteNombre}</b><span className="block truncate text-[12.5px] text-ink3">{c.motivo || 'Atención'} · {c.box}</span></span>
            <span className={cx('rounded-full border px-2.5 py-[2px] text-[11.5px] font-semibold', estadoCita(c.estado).cls)}>{estadoCita(c.estado).t}</span>
            {c.estado === 'agendada' && <div className="flex gap-1.5">
              {tel(c.pacienteId) && <a href={`https://wa.me/${tel(c.pacienteId)}?text=${encodeURIComponent(mensaje(c))}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-ok px-3 py-1.5 text-[12.5px] font-semibold text-onc"><Ic n="chat" s={14} />WhatsApp</a>}
              <Btn sm v="soft" onClick={() => marcar(c, 'confirmada')}>Confirmó</Btn><Btn sm onClick={() => marcar(c, 'cancelada')}>Canceló</Btn>
            </div>}
          </div>
        ))}</div>
      )}
      <p className="m-0 text-[12px] text-ink3">«WhatsApp» abre el chat del paciente con el mensaje listo; se envía desde el teléfono de la clínica.</p>
    </div>
  );
}

/* ═════════ INFORMES ═════════ */
export function Informes({ sinCabecera }) {
  const { clinica } = useApp();
  const [periodo, setPeriodo] = useState('semana');
  const desde = periodo === 'semana' ? lunesDe(hoy()) : hoy().slice(0, 8) + '01', hasta = periodo === 'semana' ? sumar(lunesDe(hoy()), 6) : sumar(sumar(hoy().slice(0, 8) + '01', 32).slice(0, 8) + '01', -1);
  const citas = useCitas(clinica.id, desde, hasta) || [];
  const pagos = (useColeccionClinica(clinica.id, 'pagos') || []).filter((x) => (x.fecha || '').slice(0, 10) >= desde && (x.fecha || '').slice(0, 10) <= hasta);
  const pres = (useColeccionClinica(clinica.id, 'presupuestos') || []).filter((x) => (x.fecha || '').slice(0, 10) >= desde && (x.fecha || '').slice(0, 10) <= hasta);
  const n = (e) => citas.filter((c) => c.estado === e).length;
  const pasadas = citas.filter((c) => ['atendida', 'no-asistio'].includes(c.estado)).length;
  const inasist = pasadas ? Math.round((n('no-asistio') / pasadas) * 100) : 0;
  const tile = (t, v, s, tono) => <div className="flex flex-col gap-1 rounded-[20px] bg-card p-4 shadow-sh"><span className="text-[12.5px] font-semibold text-ink3">{t}</span><b className={cx('text-[28px] font-extrabold leading-none tabular-nums', tono || 'text-deep')}>{v}</b>{s && <span className="text-[12px] text-ink3">{s}</span>}</div>;
  const porProf = (clinica.profesionales || []).map((p) => ({ p, total: citas.filter((c) => c.profesionalId === p.id && c.estado !== 'cancelada').length, atendidas: citas.filter((c) => c.profesionalId === p.id && c.estado === 'atendida').length }));
  const max = Math.max(1, ...porProf.map((x) => x.total));
  return (
    <div className={cx('flex flex-col gap-4', !sinCabecera && 'mx-auto max-w-[980px]')}>
      {!sinCabecera && <Cabecera titulo="Informes" />}
      <p className="m-0 text-[13.5px] text-ink2">Del {fechaCorta(desde)} al {fechaCorta(hasta)}</p>
      <Seg opciones={[{ v: 'semana', t: 'Esta semana' }, { v: 'mes', t: 'Este mes' }]} valor={periodo} onChange={setPeriodo} size="sm" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tile('Citas', citas.filter((c) => c.estado !== 'cancelada').length, `${n('cancelada')} canceladas`)}
        {tile('Atendidas', n('atendida'), `${n('confirmada') + n('agendada')} por venir`, 'text-ok')}
        {tile('Inasistencia', inasist + ' %', `${n('no-asistio')} de ${pasadas} citas pasadas`, inasist > 15 ? 'text-bad' : 'text-deep')}
        {tile('Recaudado', clp(pagos.reduce((s, x) => s + x.monto, 0)), `${pagos.length} pagos`)}
      </div>
      <div className="grid gap-3 [&>*]:min-w-0 md:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5 shadow-sh">
          <p className="rotulo m-0">Citas por profesional</p>
          {porProf.map(({ p, total, atendidas }) => <div key={p.id}><div className="flex justify-between text-[13.5px]"><span className="text-ink">{p.nombre}</span><span className="tabular-nums text-ink2">{atendidas} de {total}</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-soft"><span className="block h-full rounded-full bg-acento" style={{ width: (total / max) * 100 + '%' }} /></div></div>)}
        </section>
        <section className="flex flex-col gap-2 rounded-[22px] bg-card p-5 shadow-sh">
          <p className="rotulo m-0">Presupuestos del período</p>
          {[['propuesto', 'Por responder'], ['aceptado', 'Aceptados'], ['rechazado', 'Rechazados']].map(([k, t]) => { const l = pres.filter((x) => (x.estado || 'propuesto') === k); return <div key={k} className="flex justify-between border-b border-line2 py-1.5 text-[13.5px] last:border-0"><span className="text-ink2">{t} · {l.length}</span><b className="tabular-nums text-ink">{clp(l.reduce((s, x) => s + (x.total || 0), 0))}</b></div>; })}
        </section>
      </div>
    </div>
  );
}
