// Agenda del estudiante, evaluación del docente, calificaciones y solicitudes de protocolos.
// Flujo: el estudiante agenda un paciente con el protocolo a realizar y el docente que lo evalúa →
// al terminar, el docente marca la T de terminado y pone la nota → la nota aparece en Calificaciones.
// Del paciente solo se guardan las iniciales y la pieza (Ley 21.719: datos mínimos).
import React, { useMemo, useState } from 'react';
import { PROTOS, DATOS } from '../data.js';
import { ORDEN_ESP, nn, fechaLocal, sumarDiasHabiles, PLAZO_SOLICITUD, leerNota, notaValida, notaTxt, promedioNotas, NOTA_APRUEBA, NOTA_MAX, chequeoCita, BOXES, DURACIONES, HORARIO, aMinutos, deMinutos, choques } from '../logic.js';
import { useApp } from '../ctx.js';
import { Btn, Field, Modal, Aviso, inputCls, cx } from '../ui.jsx';
import { useCitas, crearCitaFS, editarCitaFS, eliminarCitaFS, evaluarCitaFS, useDocentes, useMisSolicitudes, crearSolicitudFS } from '../db.js';

const protosAbiertos = () => PROTOS.filter((p) => p.abre && DATOS[p.id]);
const nombreProto = (id) => { const p = PROTOS.find((x) => x.id === id); return p ? p.corto || p.t : 'Protocolo'; };
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const diaLargo = (iso) => { const d = new Date(iso + 'T12:00:00'); return ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]; };

function Encabezado({ rotulo, titulo, children, accion }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-[62ch]">
        <p className="rotulo m-0 mb-1.5">{rotulo}</p>
        <h1 className="m-0 text-[28px] font-extrabold leading-[1.1] tracking-[-.03em] text-deep sm:text-[34px]">{titulo}</h1>
        {children && <p className="m-0 mt-2 text-[14.5px] leading-relaxed text-ink2">{children}</p>}
      </div>
      {accion}
    </header>
  );
}

function EstadoCita({ c }) {
  if (c.estado === 'terminada' && c.evaluacion) {
    const ok = c.evaluacion.nota >= NOTA_APRUEBA;
    return <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold', ok ? 'bg-oksoft text-ok' : 'bg-badsoft text-bad')}>T · nota {notaTxt(c.evaluacion.nota)}</span>;
  }
  if (c.estado === 'cancelada') return <span className="rounded-full bg-soft px-2.5 py-1 text-[12px] font-semibold text-ink3">Cancelada</span>;
  const pasada = c.fecha < fechaLocal();
  return <span className={cx('rounded-full px-2.5 py-1 text-[12px] font-semibold', pasada ? 'bg-warnsoft text-warn' : 'bg-acentosoft text-acentodeep')}>{pasada ? 'Por evaluar' : 'Agendada'}</span>;
}

/* ═══ Grilla horaria (como una agenda dental): columnas por día o por box, una fila cada 30 minutos ═══ */
const FILA = 30;          // alto en px de 30 minutos
const lunes = (iso) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return fechaLocal(d); };
const sumarDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return fechaLocal(d); };
const tono = (c, hoy) => c.estado === 'cancelada' ? 'cita-cancelada' : c.evaluacion ? (c.evaluacion.nota >= NOTA_APRUEBA ? 'cita-ok' : 'cita-mal') : c.fecha < hoy ? 'cita-pendiente' : 'cita-agendada';

function Grilla({ columnas, citas, alVacio, alCita, sel, mostrar }) {
  const hoy = fechaLocal();
  const desde = HORARIO.desde * 60, hasta = HORARIO.hasta * 60, filas = (hasta - desde) / 30;
  return (
    <div className="grilla -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="grid" style={{ gridTemplateColumns: `52px repeat(${columnas.length}, minmax(${columnas.length > 4 ? 120 : 150}px, 1fr))` }}>
        <span />
        {columnas.map((col) => (
          <div key={col.id} className={cx('sticky top-0 z-[1] border-b border-line bg-bg px-2 pb-2 text-center', col.hoy && 'text-acento')}>
            <span className="block text-[10.5px] font-bold uppercase tracking-[.14em] text-rotulo">{col.arriba}</span>
            <span className={cx('text-[15px] font-extrabold', col.hoy ? 'text-acento' : 'text-deep')}>{col.t}</span>
          </div>
        ))}
        {/* Horas */}
        <div className="relative" style={{ height: filas * FILA }}>
          {Array.from({ length: filas / 2 + 1 }, (_, k) => <span key={k} className="absolute right-2 -translate-y-1/2 text-[10.5px] font-semibold tabular-nums text-ink3" style={{ top: k * 2 * FILA }}>{HORARIO.desde + k}:00</span>)}
        </div>
        {columnas.map((col) => {
          const deCol = citas.filter((c) => col.filtro(c));
          // Citas que se pisan en la misma columna van lado a lado
          const carril = {}; const fin = [];
          deCol.slice().sort((a, b) => aMinutos(a.hora) - aMinutos(b.hora)).forEach((c) => {
            const ini = aMinutos(c.hora); let k = fin.findIndex((f) => f <= ini); if (k === -1) { k = fin.length; fin.push(0); }
            fin[k] = ini + (c.duracion || 60); carril[c.id] = k;
          });
          const ancho = Math.max(1, fin.length);
          return (
            <div key={col.id} className="relative border-l border-line2" style={{ height: filas * FILA }}>
              {Array.from({ length: filas }, (_, k) => (
                <button key={k} type="button" aria-label={'Agendar ' + col.t + ' ' + deMinutos(desde + k * 30)} onClick={() => alVacio(col, deMinutos(desde + k * 30))}
                  className={cx('absolute inset-x-0 border-t hover:bg-acentosoft', k % 2 ? 'border-line2 border-dashed' : 'border-line2')} style={{ top: k * FILA, height: FILA }} />
              ))}
              {deCol.map((c) => {
                const top = (aMinutos(c.hora) - desde) / 30 * FILA, alto = (c.duracion || 60) / 30 * FILA;
                return (
                  <button key={c.id} type="button" onClick={() => alCita(c)} aria-pressed={sel === c.id}
                    className={cx('cita absolute overflow-hidden rounded-[8px] px-2 py-1 text-left', tono(c, hoy), sel === c.id && 'cita-sel')}
                    style={{ top: top + 1, height: alto - 2, left: `calc(${(carril[c.id] / ancho) * 100}% + 2px)`, width: `calc(${100 / ancho}% - 4px)` }}>
                    <span className="block text-[11px] font-bold tabular-nums">{c.hora}{mostrar === 'box' ? ' · ' + c.box : ''}</span>
                    <span className="block truncate text-[12px] font-bold leading-tight">{mostrar === 'estudiante' ? c.estudiante?.nombre : nombreProto(c.protocoloId)}</span>
                    {alto > 44 && <span className="block truncate text-[11px] opacity-80">{mostrar === 'estudiante' ? nombreProto(c.protocoloId) : 'Paciente ' + c.paciente}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Barra de la agenda: ‹ Hoy › y la vista (semana por días, día por boxes)
function BarraAgenda({ vista, setVista, fecha, setFecha }) {
  const paso = vista === 'semana' ? 7 : 1;
  const ini = vista === 'semana' ? lunes(fecha) : fecha;
  const t0 = vista === 'semana' ? 'Semana del ' + diaLargo(ini).replace(/^\S+ /, '') : diaLargo(fecha);
  const titulo = t0.charAt(0).toUpperCase() + t0.slice(1);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => setFecha(sumarDias(fecha, -paso))} aria-label="Anterior" className="grid h-9 w-9 place-items-center rounded-full bg-soft text-[18px] text-acento">‹</button>
        <button type="button" onClick={() => setFecha(fechaLocal())} className="h-9 rounded-full bg-soft px-4 text-[13px] font-semibold text-acentodeep">Hoy</button>
        <button type="button" onClick={() => setFecha(sumarDias(fecha, paso))} aria-label="Siguiente" className="grid h-9 w-9 place-items-center rounded-full bg-soft text-[18px] text-acento">›</button>
        <p className="m-0 ml-2 text-[15px] font-bold text-deep">{titulo}</p>
      </div>
      <div className="flex rounded-full bg-soft p-1" role="radiogroup" aria-label="Vista">
        {[['semana', 'Semana'], ['dia', 'Día por box']].map(([v, t]) => (
          <button key={v} type="button" role="radio" aria-checked={vista === v} onClick={() => setVista(v)} className={cx('rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold', vista === v ? 'bg-acento text-onc' : 'text-ink2')}>{t}</button>
        ))}
      </div>
    </div>
  );
}
const columnasDe = (vista, fecha) => {
  const hoy = fechaLocal();
  if (vista === 'dia') return BOXES.map((b) => ({ id: b, t: b.replace('Box ', ''), arriba: 'Box', hoy: false, dia: fecha, box: b, filtro: (c) => c.fecha === fecha && c.box === b }));
  const ini = lunes(fecha);
  return Array.from({ length: 6 }, (_, k) => { const d = sumarDias(ini, k); return { id: d, t: String(+d.slice(8)), arriba: ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][k], hoy: d === hoy, dia: d, filtro: (c) => c.fecha === d }; });
};

/* ═══ Mi agenda (estudiante) ═══ */
export function Agenda() {
  const { myUid, perfil, abrirProto, avisar } = useApp();
  const [citas] = useCitas(myUid, 'estudianteUid');
  const docentes = useDocentes();
  const hoy = fechaLocal();
  const [vista, setVista] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 'dia' : 'semana'));
  const [fecha, setFecha] = useState(hoy);
  const [form, setForm] = useState(null);
  const [selId, setSelId] = useState(null);
  const [quitar, setQuitar] = useState(false);
  const sel = citas.find((c) => c.id === selId);
  const nueva = (dia, hora, box) => setForm({ fecha: dia, hora, box: box || BOXES[0], duracion: 60, paciente: '', pieza: '', protocoloId: '', docenteUid: '', nota: '' });
  const proximas = citas.filter((c) => c.fecha >= hoy && c.estado === 'agendada').slice(0, 4);

  const cancelar = async (c) => { try { await editarCitaFS(c.id, { estado: 'cancelada' }); avisar('Cita cancelada'); } catch (e) { avisar('No se pudo cancelar.', 'warn'); } setQuitar(false); };
  const eliminar = async (c) => { try { await eliminarCitaFS(c.id); avisar('Cita eliminada'); setSelId(null); } catch (e) { avisar('No se pudo eliminar.', 'warn'); } setQuitar(false); };

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
      <Encabezado rotulo="Mi agenda" titulo="Tus pacientes, con el protocolo de cada cita."
        accion={<Btn v="primary" icon="plus" onClick={() => nueva(fecha >= hoy ? fecha : hoy, '09:00')}>Agendar paciente</Btn>}>
        Toca un horario libre para agendar. Cada cita lleva su box, el protocolo y el docente que te evalúa. Del paciente se guardan solo sus iniciales.
      </Encabezado>
      {!docentes.length && <Aviso tono="neutro" className="!text-[12.5px]">Todavía no hay docentes verificados en Criterium. Para agendar, tu docente tiene que estar en la lista: pídeselo al equipo de Criterium.</Aviso>}
      <BarraAgenda vista={vista} setVista={setVista} fecha={fecha} setFecha={setFecha} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Grilla columnas={columnasDe(vista, fecha)} citas={citas} sel={selId} mostrar={vista === 'semana' ? 'box' : 'proto'}
          alVacio={(col, hora) => nueva(col.dia, hora, col.box)} alCita={(c) => { setSelId(c.id); setQuitar(false); }} />

        {/* Detalle de la cita elegida, o las próximas */}
        <aside className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
          {sel ? (
            <div className="tarjeta flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="rotulo m-0 mb-1">{diaLargo(sel.fecha)}</p>
                  <p className="m-0 text-[24px] font-extrabold tabular-nums tracking-[-.03em] text-deep">{sel.hora} <span className="text-[13px] font-semibold text-ink3">· {sel.duracion || 60} min · {sel.box}</span></p>
                </div>
                <button type="button" onClick={() => setSelId(null)} aria-label="Cerrar" className="rounded-full px-2 text-[18px] text-ink3 hover:bg-soft">×</button>
              </div>
              <p className="m-0 text-[16px] font-bold leading-snug text-deep">{nombreProto(sel.protocoloId)}</p>
              <p className="m-0 text-[13px] text-ink2">Paciente {sel.paciente}{sel.pieza ? ' · pieza ' + sel.pieza : ''}<br />Evalúa {sel.docente?.nombre || 'docente'}</p>
              <EstadoCita c={sel} />
              {sel.nota && <p className="m-0 text-[13px] text-ink2">{sel.nota}</p>}
              {sel.evaluacion?.comentario && <p className="m-0 border-l-2 border-menta pl-3 text-[13px] text-ink2">{sel.evaluacion.comentario}</p>}
              {quitar ? (
                <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink2">{sel.estado === 'cancelada' ? '¿Eliminar la cita?' : '¿Cancelar la cita?'}
                  <Btn sm v="danger" onClick={() => (sel.estado === 'cancelada' ? eliminar(sel) : cancelar(sel))}>Sí</Btn><Btn sm v="ghost" onClick={() => setQuitar(false)}>No</Btn>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sel.estado !== 'cancelada' && DATOS[sel.protocoloId] && <Btn sm v="primary" icon="book" onClick={() => abrirProto(sel.protocoloId)}>Abrir el protocolo</Btn>}
                  {sel.estado === 'agendada' && <Btn sm onClick={() => setForm(sel)}>Editar</Btn>}
                  {sel.estado !== 'terminada' && <Btn sm v="ghost" onClick={() => setQuitar(true)}>{sel.estado === 'cancelada' ? 'Eliminar' : 'Cancelar'}</Btn>}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="rotulo m-0 mb-2">Próximas citas</p>
              {!proximas.length && <p className="m-0 text-[13.5px] text-ink3">No tienes citas por delante.</p>}
              <ul className="m-0 flex list-none flex-col p-0">
                {proximas.map((c) => (
                  <li key={c.id}><button type="button" onClick={() => { setFecha(c.fecha); setSelId(c.id); }} className="w-full border-b border-line2 py-2.5 text-left hover:bg-soft">
                    <span className="block text-[12px] font-bold tabular-nums text-acentodeep">{diaLargo(c.fecha)} · {c.hora} · {c.box}</span>
                    <span className="block truncate text-[13.5px] text-ink2"><b className="font-semibold text-ink">{nombreProto(c.protocoloId)}</b> · {c.paciente}</span>
                  </button></li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-ink3" aria-hidden="true">
            {[['cita-agendada', 'Agendada'], ['cita-pendiente', 'Por evaluar'], ['cita-ok', 'Aprobada'], ['cita-mal', 'Bajo 4,0'], ['cita-cancelada', 'Cancelada']].map(([c, t]) => <span key={c} className="flex items-center gap-1.5"><i className={cx('cita inline-block h-3 w-3 rounded-[3px]', c)} />{t}</span>)}
          </div>
        </aside>
      </div>

      {form && <FormCita inicial={form} docentes={docentes} citas={citas} onClose={() => setForm(null)}
        onGuardar={async (c) => {
          const docente = docentes.find((d) => d.uid === c.docenteUid);
          const datos = { fecha: c.fecha, hora: c.hora, duracion: Number(c.duracion), box: c.box, paciente: c.paciente.trim().toUpperCase(), pieza: c.pieza.trim(), protocoloId: c.protocoloId, nota: (c.nota || '').trim(),
            docenteUid: c.docenteUid, docente: { uid: c.docenteUid, nombre: docente ? docente.nombre : 'Docente' } };
          try {
            if (form.id) await editarCitaFS(form.id, datos);
            else await crearCitaFS({ ...datos, estudianteUid: myUid, estudiante: { uid: myUid, nombre: (perfil && perfil.nombre) || 'Estudiante' } });
            avisar(form.id ? 'Cita actualizada' : 'Paciente agendado'); setFecha(c.fecha); setForm(null);
          } catch (e) { avisar('No se pudo guardar. Revisa tu conexión.', 'warn'); }
        }} />}
    </div>
  );
}

function FormCita({ inicial, docentes, citas, onClose, onGuardar }) {
  const [c, setC] = useState(inicial);
  const [err, setErr] = useState({});
  const [guardando, setGuardando] = useState(false);
  const f = (k) => (e) => setC({ ...c, [k]: e.target.value });
  const pisa = choques({ ...c, duracion: Number(c.duracion) }, citas);
  const guardar = async () => {
    const e = chequeoCita(c); setErr(e);
    if (Object.keys(e).length) return;
    setGuardando(true); await onGuardar(c); setGuardando(false);
  };
  return (
    <Modal open onClose={onClose} title={inicial.id ? 'Editar cita' : 'Agendar paciente'}>
      <div className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha" id="c-fecha" error={err.fecha}><input id="c-fecha" type="date" value={c.fecha} onChange={f('fecha')} className={inputCls} /></Field>
          <Field label="Hora" id="c-hora" error={err.hora}><input id="c-hora" type="time" step="900" value={c.hora} onChange={f('hora')} className={inputCls} /></Field>
          <Field label="Box" id="c-box" error={err.box}>
            <select id="c-box" value={c.box} onChange={f('box')} className={inputCls}>{BOXES.map((b) => <option key={b}>{b}</option>)}</select>
          </Field>
          <Field label="Duración" id="c-dur" error={err.duracion}>
            <select id="c-dur" value={c.duracion} onChange={f('duracion')} className={inputCls}>{DURACIONES.map((d) => <option key={d} value={d}>{d} minutos</option>)}</select>
          </Field>
        </div>
        {pisa.length > 0 && <Aviso tono="warn" className="!text-[12.5px]">Ya tienes en {c.box} a las {pisa[0].hora} «{nombreProto(pisa[0].protocoloId)}». Revisa la hora o el box.</Aviso>}
        <Field label="Protocolo a realizar" id="c-proto" error={err.protocoloId}>
          <select id="c-proto" value={c.protocoloId} onChange={f('protocoloId')} className={inputCls}>
            <option value="">Elige un protocolo</option>
            {protosAbiertos().map((p) => <option key={p.id} value={p.id}>{p.t}</option>)}
          </select>
        </Field>
        <Field label="Docente que te evalúa" id="c-doc" error={err.docenteUid} hint={!docentes.length ? 'Todavía no hay docentes verificados.' : ''}>
          <select id="c-doc" value={c.docenteUid} onChange={f('docenteUid')} className={inputCls}>
            <option value="">Elige al docente</option>
            {docentes.map((d) => <option key={d.uid} value={d.uid}>{d.nombre}{d.area ? ' · ' + d.area : ''}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Iniciales del paciente" id="c-pac" error={err.paciente} hint="Sin nombre ni RUT."><input id="c-pac" value={c.paciente} maxLength={4} onChange={f('paciente')} placeholder="JPR" className={inputCls + ' uppercase'} /></Field>
          <Field label="Pieza (FDI)" id="c-pieza" error={err.pieza} hint="Opcional."><input id="c-pieza" value={c.pieza} onChange={f('pieza')} placeholder="1.8" className={inputCls} /></Field>
        </div>
        <Field label="Nota para ti" id="c-nota" hint="Opcional. Sin datos que identifiquen al paciente."><textarea id="c-nota" rows={2} value={c.nota} onChange={f('nota')} className={inputCls} /></Field>
        <div className="flex justify-end gap-2"><Btn v="ghost" onClick={onClose}>Volver</Btn><Btn v="primary" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : inicial.id ? 'Guardar cambios' : 'Agendar'}</Btn></div>
      </div>
    </Modal>
  );
}

/* ═══ Calificaciones (estudiante), como un libro de notas: grupos por especialidad, promedio por grupo y nota final ═══ */
export function Calificaciones() {
  const { myUid, abrirProto } = useApp();
  const [citas, listo] = useCitas(myUid, 'estudianteUid');
  const [abierta, setAbierta] = useState(null);
  const vigentes = citas.filter((c) => c.estado !== 'cancelada');
  const evaluadas = vigentes.filter((c) => c.evaluacion);
  const final = promedioNotas(evaluadas.map((c) => c.evaluacion));
  const espDe = (c) => (PROTOS.find((p) => p.id === c.protocoloId) || {}).esp || 'Otra';
  const grupos = [...ORDEN_ESP, 'Otra'].map((e) => ({ esp: e, filas: vigentes.filter((c) => espDe(c) === e).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora)) })).filter((g) => g.filas.length);
  const conPasos = evaluadas.filter((c) => c.evaluacion.pasosTotal);
  const pctPasos = conPasos.length ? Math.round(conPasos.reduce((s, c) => s + c.evaluacion.pasosBien.length / c.evaluacion.pasosTotal, 0) / conPasos.length * 100) : null;
  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <Encabezado rotulo="Calificaciones" titulo="Tus notas, protocolo por protocolo.">Cada nota la pone el docente que te evaluó, al marcar la T de terminado. Toca una fila para ver el comentario.</Encabezado>
        <div className="flex gap-6">
          <div className="text-right"><p className="m-0 text-[10.5px] font-bold uppercase tracking-[.14em] text-rotulo">Pasos bien hechos</p><p className="m-0 text-[28px] font-extrabold tabular-nums text-deep">{pctPasos === null ? '—' : pctPasos + ' %'}</p></div>
          <div className="rounded-[18px] bg-panel px-5 py-3 text-right">
            <p className="m-0 text-[10.5px] font-bold uppercase tracking-[.14em] text-panelink2">Nota final</p>
            <p className={cx('m-0 text-[40px] font-extrabold leading-none tabular-nums tracking-[-.04em]', final !== null && final < NOTA_APRUEBA ? 'text-bad' : 'text-menta')}>{notaTxt(final)}</p>
            <p className="m-0 mt-1 text-[11px] text-panelink2">{evaluadas.length} {evaluadas.length === 1 ? 'evaluación' : 'evaluaciones'}</p>
          </div>
        </div>
      </div>
      {listo && !vigentes.length && <p className="m-0 text-[14px] text-ink3">Todavía no tienes notas. Agenda un paciente con un protocolo y aparecerá aquí cuando tu docente lo evalúe.</p>}
      {grupos.map((g) => {
        const prom = promedioNotas(g.filas.filter((c) => c.evaluacion).map((c) => c.evaluacion));
        return (
          <section key={g.esp} className="tarjeta overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-line bg-soft px-5 py-3">
              <p className="m-0 text-[12px] font-bold uppercase tracking-[.14em] text-rotulo">{g.esp}</p>
              <p className="m-0 text-[13px] text-ink2">Promedio <b className={cx('text-[16px] tabular-nums', prom !== null && prom < NOTA_APRUEBA ? 'text-bad' : 'text-deep')}>{notaTxt(prom)}</b></p>
            </div>
            <table className="w-full border-collapse text-left">
              <thead className="hidden sm:table-header-group"><tr className="text-[10.5px] font-bold uppercase tracking-[.12em] text-ink3">
                <th className="px-5 py-2 font-bold">Protocolo</th><th className="px-3 py-2 font-bold">Fecha</th><th className="px-3 py-2 font-bold">Estado</th><th className="px-5 py-2 text-right font-bold">Nota</th>
              </tr></thead>
              <tbody>
                {g.filas.map((c) => {
                  const e = c.evaluacion; const abre = abierta === c.id;
                  return (
                    <React.Fragment key={c.id}>
                      <tr onClick={() => setAbierta(abre ? null : c.id)} className="cursor-pointer border-t border-line2 hover:bg-soft">
                        <td className="px-5 py-3"><span className="block text-[14.5px] font-semibold text-deep">{nombreProto(c.protocoloId)}</span><span className="text-[12px] text-ink3 sm:hidden">{diaLargo(c.fecha)}</span></td>
                        <td className="hidden px-3 py-3 text-[13px] text-ink2 sm:table-cell">{diaLargo(c.fecha)}</td>
                        <td className="hidden px-3 py-3 sm:table-cell"><EstadoCita c={c} /></td>
                        <td className="px-5 py-3 text-right"><b className={cx('text-[18px] tabular-nums', e && e.nota < NOTA_APRUEBA ? 'text-bad' : 'text-deep')}>{e ? notaTxt(e.nota) : '—'}</b><span className="text-[12px] text-ink3"> / {notaTxt(NOTA_MAX)}</span></td>
                      </tr>
                      {abre && (
                        <tr className="bg-soft"><td colSpan={4} className="px-5 pb-4 pt-1">
                          <p className="m-0 text-[12.5px] text-ink3">Paciente {c.paciente}{c.pieza ? ' · pieza ' + c.pieza : ''} · {c.box} · {e ? 'evaluó ' + (e.docente?.nombre || 'docente') : 'evalúa ' + (c.docente?.nombre || 'docente')}</p>
                          {e && e.pasosTotal > 0 && (
                            <div className="mt-2 flex items-center gap-2.5"><div className="h-2 flex-1 overflow-hidden rounded-full bg-card"><span className="block h-full rounded-full bg-menta" style={{ width: (e.pasosBien.length / e.pasosTotal) * 100 + '%' }} /></div>
                              <span className="text-[12px] font-semibold tabular-nums text-ink2">{e.pasosBien.length} de {e.pasosTotal} pasos bien</span></div>
                          )}
                          {e && e.comentario && <p className="m-0 mt-2 border-l-2 border-menta pl-3 text-[13.5px] leading-relaxed text-ink2">{e.comentario}</p>}
                          {!e && <p className="m-0 mt-1 text-[13px] text-ink2">Todavía sin evaluar.</p>}
                          {DATOS[c.protocoloId] && <button type="button" onClick={() => abrirProto(c.protocoloId)} className="mt-2 text-[12.5px] font-semibold text-acento hover:underline">Repasar el protocolo ›</button>}
                        </td></tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}

/* ═══ Evaluaciones (docente): por evaluar, agenda de sus estudiantes y libro de notas ═══ */
export function Evaluaciones() {
  const { myUid, perfil, avisar } = useApp();
  const [citas, listo] = useCitas(myUid, 'docenteUid');
  const [tab, setTab] = useState('pendientes');
  const [evaluando, setEvaluando] = useState(null);
  const [vista, setVista] = useState('dia');
  const [fecha, setFecha] = useState(fechaLocal());
  const hoy = fechaLocal();
  const propias = citas.filter((c) => c.estudianteUid !== myUid); // nadie evalúa su propia cita
  const pendientes = propias.filter((c) => c.estado === 'agendada');
  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
      <Encabezado rotulo="Portal docente · evaluaciones" titulo="Marca la T y pon la nota.">Aquí están las citas en que un estudiante te eligió como docente. Al terminar el protocolo, márcalo terminado, califica de 1,0 a 7,0 y, si quieres, marca los pasos bien hechos.</Encabezado>
      <div className="flex flex-wrap gap-2" role="tablist">
        {[['pendientes', 'Por evaluar · ' + pendientes.length], ['agenda', 'Agenda'], ['libro', 'Libro de notas']].map(([v, t]) => (
          <button key={v} type="button" role="tab" aria-selected={tab === v} onClick={() => setTab(v)}
            className={cx('rounded-full px-4 py-2 text-[13.5px] font-semibold', tab === v ? 'bg-panel text-panelink' : 'bg-soft text-ink2')}>{t}</button>
        ))}
      </div>

      {tab === 'pendientes' && <>
        {listo && !pendientes.length && <p className="m-0 text-[14px] text-ink3">No tienes citas por evaluar.</p>}
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {pendientes.map((c) => (
            <li key={c.id} className="tarjeta flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
              <div className="min-w-0">
                <p className="m-0 text-[16px] font-bold leading-snug text-deep">{c.estudiante?.nombre || 'Estudiante'} · {nombreProto(c.protocoloId)}</p>
                <p className="m-0 text-[12.5px] text-ink3">{diaLargo(c.fecha)} · {c.hora} · {c.box} · paciente {c.paciente}{c.pieza ? ' · pieza ' + c.pieza : ''}{c.fecha > hoy ? ' · todavía no llega la fecha' : ''}</p>
              </div>
              <Btn v="primary" sm onClick={() => setEvaluando(c)}>Evaluar</Btn>
            </li>
          ))}
        </ol>
      </>}

      {tab === 'agenda' && <>
        <BarraAgenda vista={vista} setVista={setVista} fecha={fecha} setFecha={setFecha} />
        <Grilla columnas={columnasDe(vista, fecha)} citas={propias} mostrar="estudiante" alVacio={() => {}} alCita={(c) => (c.estado === 'agendada' ? setEvaluando(c) : null)} />
        <p className="m-0 text-[12px] text-ink3">Toca una cita agendada para evaluarla.</p>
      </>}

      {tab === 'libro' && <LibroNotas citas={propias} />}

      {evaluando && <FormEvaluacion cita={evaluando} onClose={() => setEvaluando(null)} onGuardar={async (ev) => {
        try { await evaluarCitaFS(evaluando.id, { ...ev, fecha: new Date().toISOString(), docente: { uid: myUid, nombre: (perfil && perfil.nombre) || 'Docente' } }); avisar('Evaluación guardada'); setEvaluando(null); }
        catch (e) { avisar('No se pudo guardar la evaluación.', 'warn'); }
      }} />}
    </div>
  );
}

// Libro de notas del docente: una fila por estudiante, una columna por protocolo (la última nota) y el promedio
function LibroNotas({ citas }) {
  const evaluadas = citas.filter((c) => c.evaluacion);
  const estudiantes = [...new Map(evaluadas.map((c) => [c.estudianteUid, c.estudiante?.nombre || 'Estudiante'])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const protos = [...new Set(evaluadas.map((c) => c.protocoloId))];
  if (!evaluadas.length) return <p className="m-0 text-[14px] text-ink3">El libro se llena a medida que evalúas.</p>;
  const ultima = (uid, pid) => evaluadas.filter((c) => c.estudianteUid === uid && c.protocoloId === pid).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora))[0];
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="tarjeta w-full min-w-[560px] border-collapse overflow-hidden text-left">
        <thead><tr className="bg-soft text-[10.5px] font-bold uppercase tracking-[.12em] text-rotulo">
          <th className="sticky left-0 bg-soft px-4 py-3">Estudiante</th>
          {protos.map((p) => <th key={p} className="px-3 py-3 text-center">{nombreProto(p)}</th>)}
          <th className="px-4 py-3 text-right">Promedio</th>
        </tr></thead>
        <tbody>
          {estudiantes.map(([uid, nombre]) => {
            const prom = promedioNotas(evaluadas.filter((c) => c.estudianteUid === uid).map((c) => c.evaluacion));
            return (
              <tr key={uid} className="border-t border-line2">
                <th className="sticky left-0 bg-card px-4 py-3 text-[14px] font-semibold text-deep">{nombre}</th>
                {protos.map((p) => { const c = ultima(uid, p); return <td key={p} className="px-3 py-3 text-center"><b className={cx('text-[15px] tabular-nums', c && c.evaluacion.nota < NOTA_APRUEBA ? 'text-bad' : 'text-deep')}>{c ? notaTxt(c.evaluacion.nota) : '—'}</b></td>; })}
                <td className="px-4 py-3 text-right"><b className={cx('text-[17px] tabular-nums', prom !== null && prom < NOTA_APRUEBA ? 'text-bad' : 'text-acentodeep')}>{notaTxt(prom)}</b></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FormEvaluacion({ cita, onClose, onGuardar }) {
  const d = DATOS[cita.protocoloId];
  const [terminado, setTerminado] = useState(false);
  const [nota, setNota] = useState('');
  const [comentario, setComentario] = useState('');
  const [bien, setBien] = useState([]);
  const [err, setErr] = useState('');
  const [guardando, setGuardando] = useState(false);
  const n = leerNota(nota);
  const guardar = async () => {
    if (!terminado) { setErr('Marca la T de terminado para poder calificar.'); return; }
    if (!notaValida(n)) { setErr('La nota va de 1,0 a 7,0.'); return; }
    setErr(''); setGuardando(true);
    await onGuardar({ terminado: true, nota: n, comentario: comentario.trim(), pasosBien: bien, pasosTotal: d ? d.pasos.length : 0 });
    setGuardando(false);
  };
  const alternar = (i) => setBien((b) => (b.includes(i) ? b.filter((x) => x !== i) : [...b, i].sort((x, y) => x - y)));
  return (
    <Modal open onClose={onClose} title="Evaluar" wide>
      <div className="flex flex-col gap-5 p-6">
        <div>
          <p className="m-0 text-[17px] font-bold text-deep">{cita.estudiante?.nombre} · {nombreProto(cita.protocoloId)}</p>
          <p className="m-0 text-[12.5px] text-ink3">{diaLargo(cita.fecha)} · {cita.hora} · paciente {cita.paciente}{cita.pieza ? ' · pieza ' + cita.pieza : ''}</p>
        </div>
        <button type="button" onClick={() => setTerminado(!terminado)} aria-pressed={terminado}
          className={cx('flex items-center gap-4 rounded-[18px] p-4 text-left transition-colors', terminado ? 'bg-panel text-panelink' : 'bg-soft text-ink')}>
          <span className={cx('grid h-12 w-12 flex-none place-items-center rounded-full text-[24px] font-extrabold', terminado ? 'bg-menta text-mentaink' : 'bg-card text-ink3')}>T</span>
          <span><b className="block text-[15px]">Terminado</b><span className={cx('text-[12.5px]', terminado ? 'text-panelink2' : 'text-ink3')}>El estudiante completó el protocolo con este paciente.</span></span>
        </button>
        <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
          <Field label="Nota (1,0 a 7,0)" id="ev-nota"><input id="ev-nota" inputMode="decimal" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="6,0" className={inputCls + ' text-[22px] font-extrabold'} /></Field>
          <Field label="Comentario para el estudiante" id="ev-com" hint="Opcional."><textarea id="ev-com" rows={2} value={comentario} onChange={(e) => setComentario(e.target.value)} className={inputCls} /></Field>
        </div>
        {d && (
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3"><p className="rotulo m-0">Pasos bien hechos · opcional</p><span className="text-[12.5px] font-semibold tabular-nums text-ink2">{bien.length} de {d.pasos.length}</span></div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {d.pasos.map((s, i) => (
                <button key={i} type="button" onClick={() => alternar(i)} aria-pressed={bien.includes(i)}
                  className={cx('flex items-center gap-2.5 rounded-rs px-3 py-2 text-left text-[13px] transition-colors', bien.includes(i) ? 'bg-mentasoft text-ink' : 'bg-soft text-ink2')}>
                  <span className={cx('grid h-5 w-5 flex-none place-items-center rounded-[6px] text-[11px] font-bold', bien.includes(i) ? 'bg-menta text-mentaink' : 'bg-card text-ink3')}>{bien.includes(i) ? '✓' : nn(i)}</span>{s.corto}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setBien(bien.length === d.pasos.length ? [] : d.pasos.map((_, i) => i))} className="mt-2 text-[12.5px] font-semibold text-acento hover:underline">{bien.length === d.pasos.length ? 'Desmarcar todos' : 'Marcar todos'}</button>
          </div>
        )}
        {err && <p className="m-0 text-[13px] font-semibold text-bad" role="alert">{err}</p>}
        <div className="flex justify-end gap-2"><Btn v="ghost" onClick={onClose}>Volver</Btn><Btn v="primary" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar evaluación'}</Btn></div>
      </div>
    </Modal>
  );
}

/* ═══ Solicitar un protocolo que todavía no está ═══ */
export function SolicitudesProtocolo() {
  const { myUid, perfil, avisar } = useApp();
  const mias = useMisSolicitudes(myUid);
  const [abierto, setAbierto] = useState(false);
  const [s, setS] = useState({ procedimiento: '', especialidad: '', detalle: '' });
  const [err, setErr] = useState('');
  const [listo, setListo] = useState(null);
  const enviar = async () => {
    if (s.procedimiento.trim().length < 5) { setErr('Escribe qué procedimiento necesitas.'); return; }
    if (!s.especialidad) { setErr('Elige la especialidad.'); return; }
    const plazo = sumarDiasHabiles(fechaLocal(), PLAZO_SOLICITUD);
    try {
      await crearSolicitudFS({ uid: myUid, nombre: (perfil && perfil.nombre) || '', procedimiento: s.procedimiento.trim(), especialidad: s.especialidad, detalle: s.detalle.trim(), plazo });
      setListo(plazo); setS({ procedimiento: '', especialidad: '', detalle: '' }); setErr('');
    } catch (e) { avisar('No se pudo enviar. Revisa tu conexión.', 'warn'); }
  };
  const cerrar = () => { setAbierto(false); setListo(null); setErr(''); };
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-[60ch]">
          <p className="rotulo m-0 mb-1">¿Falta un protocolo?</p>
          <p className="m-0 text-[14.5px] leading-relaxed text-ink2">Pídelo. Criterium lo publica en un plazo máximo de <b className="text-ink">{PLAZO_SOLICITUD} días hábiles</b>.</p>
        </div>
        <Btn v="primary" icon="plus" onClick={() => setAbierto(true)}>Solicitar un protocolo</Btn>
      </div>
      {mias.length > 0 && (
        <ul className="m-0 flex list-none flex-col p-0">
          {mias.map((x) => (
            <li key={x.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line2 py-2.5">
              <span className="text-[14px] text-ink"><b className="font-semibold">{x.procedimiento}</b> <span className="text-ink3">· {x.especialidad}</span></span>
              <span className="text-[12.5px] text-ink3">
                <span className={cx('mr-2 rounded-full px-2 py-0.5 font-semibold', x.estado === 'publicada' ? 'bg-oksoft text-ok' : 'bg-acentosoft text-acentodeep')}>{x.estado}</span>
                {x.estado !== 'publicada' && <>a más tardar el {diaLargo(x.plazo)}</>}
              </span>
            </li>
          ))}
        </ul>
      )}
      {abierto && (
        <Modal open onClose={cerrar} title="Solicitar un protocolo">
          {listo ? (
            <div className="flex flex-col items-start gap-3 p-6">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-menta text-[22px] font-extrabold text-mentaink">✓</span>
              <p className="m-0 text-[17px] font-bold text-deep">Lo recibimos.</p>
              <p className="m-0 text-[14px] leading-relaxed text-ink2">Criterium lo publica a más tardar el <b className="text-ink">{diaLargo(listo)}</b> ({PLAZO_SOLICITUD} días hábiles; si hay feriados, puede correrse un día). Lo verás en la Biblioteca y aquí cambiará su estado.</p>
              <Btn v="primary" onClick={cerrar}>Listo</Btn>
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-6">
              <Field label="¿Qué procedimiento necesitas?" id="s-proc"><input id="s-proc" value={s.procedimiento} onChange={(e) => setS({ ...s, procedimiento: e.target.value })} placeholder="Por ejemplo: incrustación de resina indirecta" className={inputCls} /></Field>
              <Field label="Especialidad" id="s-esp">
                <select id="s-esp" value={s.especialidad} onChange={(e) => setS({ ...s, especialidad: e.target.value })} className={inputCls}>
                  <option value="">Elige una</option>{[...ORDEN_ESP, 'Operatoria', 'Ortodoncia', 'Otra'].map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Detalle" id="s-det" hint="Opcional: para qué caso lo necesitas o qué dudas tienes. Sin datos del paciente."><textarea id="s-det" rows={3} value={s.detalle} onChange={(e) => setS({ ...s, detalle: e.target.value })} className={inputCls} /></Field>
              {err && <p className="m-0 text-[13px] font-semibold text-bad" role="alert">{err}</p>}
              <div className="flex justify-end gap-2"><Btn v="ghost" onClick={cerrar}>Volver</Btn><Btn v="primary" onClick={enviar}>Enviar solicitud</Btn></div>
            </div>
          )}
        </Modal>
      )}
    </section>
  );
}
