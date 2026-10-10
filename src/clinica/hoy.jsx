// Clínica › Hoy (el día de la clínica: agenda con acciones rápidas, alertas y cumpleaños) y › Seguimiento
// (confirmaciones, controles periódicos y lista de espera).
import React, { useEffect, useState } from 'react';
import { useApp } from '../ctx.js';
import { useCitas, usePacientes, useColeccionClinica, guardarCitaFS, crearEn, borrarEn, actualizarEn } from './db.js';
import { Confirmaciones, ModalCita } from './clinica.jsx';
import { labAtrasado } from './plan.jsx';
import { hoy, sumar, fechaLarga, fechaCorta, diasHasta, clp, nombreDe, telefonoWa, estadoCita, mins, colorProf, profDe, Cabecera, Pestanas, Alerta, Tarjeta, Fila, Panel, Kpis, Insignia, yoComo } from './comun.jsx';
import { Ic, Btn, Modal, Field, Vacio, Avatar, inputCls, cx } from '../ui.jsx';

export function Hoy() {
  const { clinica, abrirPaciente, irClinica, myUid, perfil, avisar } = useApp();
  const [, tic] = useState(0);
  useEffect(() => { const t = setInterval(() => tic((x) => x + 1), 30000); return () => clearInterval(t); }, []);
  const todas = (useCitas(clinica.id, hoy(), hoy()) || []).sort((a, b) => a.hora.localeCompare(b.hora));
  const citas = todas.filter((c) => c.estado !== 'cancelada');
  const manana = (useCitas(clinica.id, sumar(hoy(), 1), sumar(hoy(), 1)) || []).filter((c) => c.estado === 'agendada');
  const pacientes = usePacientes(clinica.id) || [];
  const inventario = useColeccionClinica(clinica.id, 'inventario') || [];
  const lab = useColeccionClinica(clinica.id, 'laboratorio') || [];
  const tareas = useColeccionClinica(clinica.id, 'tareas') || [];
  const pagos = (useColeccionClinica(clinica.id, 'pagos') || []).filter((x) => (x.fecha || '').slice(0, 10) === hoy());
  const ester = useColeccionClinica(clinica.id, 'esterilizacion') || [];
  const bajo = inventario.filter((i) => (i.stock || 0) <= (i.minimo || 0));
  const atrasados = lab.filter(labAtrasado);
  const vencidos = pacientes.filter((p) => p.control && p.control.fecha && diasHasta(p.control.fecha) < 0);
  const misTareas = tareas.filter((t) => t.estado !== 'hecha' && (!t.asignado || !t.asignado.uid || t.asignado.uid === myUid)).sort((a, b) => (a.vence || '9').localeCompare(b.vence || '9'));
  const fallaEster = ester.find((c) => c.quimico === 'falla' || c.biologico === 'falla');
  const cumple = pacientes.filter((p) => p.nacimiento && p.nacimiento.slice(5) === hoy().slice(5));
  const ahora = new Date(); const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
  const espera = (c) => c.llegada ? Math.max(0, Math.round((Date.now() - new Date(c.llegada).getTime()) / 60000)) : null;
  const COLS = [
    ['Por llegar', citas.filter((c) => ['agendada', 'confirmada'].includes(c.estado))],
    ['Sala de espera', citas.filter((c) => c.estado === 'llego')],
    ['En atención', citas.filter((c) => c.estado === 'en-atencion')],
    ['Atendidos', citas.filter((c) => ['atendida', 'no-asistio'].includes(c.estado))]
  ];
  const enSala = COLS[1][1];
  const esperaMedia = enSala.length ? Math.round(enSala.reduce((s, c) => s + (espera(c) || 0), 0) / enSala.length) : 0;
  const mover = async (c, estado) => {
    const marca = { llego: { llegada: new Date().toISOString() }, 'en-atencion': { inicio: new Date().toISOString() }, atendida: { fin: new Date().toISOString() } }[estado] || {};
    try { await guardarCitaFS(clinica.id, { id: c.id, estado, ...marca }); } catch (e) { avisar('No se pudo cambiar.', 'warn'); }
  };
  const marcarTarea = async (t) => { try { await actualizarEn(clinica.id, 'tareas', t.id, { estado: 'hecha', hechaPor: yoComo(myUid, perfil) }); } catch (e) { avisar('No se pudo marcar.', 'warn'); } };
  const nombre = ((perfil && perfil.nombre) || '').split(' ')[0];
  const saludo = ahora.getHours() < 12 ? 'Buenos días' : ahora.getHours() < 20 ? 'Buenas tardes' : 'Buenas noches';
  const boxes = (clinica.boxes || []).map((b) => { const cs = citas.filter((c) => c.box === b); const m = cs.reduce((s, c) => s + (c.duracion || 30), 0); return { b, n: cs.length, pct: Math.min(100, Math.round((m / 720) * 100)) }; });
  const alertas = [
    fallaEster && ['bad', 'esterilizacion', `Ciclo de esterilización con indicador en falla (${fallaEster.lote || 'ciclo ' + fallaEster.ciclo}). No uses ese lote.`, () => irClinica('gestion', 'esterilizacion')],
    atrasados.length > 0 && ['bad', 'laboratorio', `${atrasados.length} ${atrasados.length === 1 ? 'trabajo de laboratorio atrasado' : 'trabajos de laboratorio atrasados'}: ${atrasados.map((o) => o.trabajo + ' de ' + (o.pacienteNombre || '').split(' ')[0]).join(', ')}`, () => irClinica('gestion', 'laboratorio')],
    manana.length > 0 && ['warn', 'seguimiento', `${manana.length} ${manana.length === 1 ? 'cita de mañana sin confirmar' : 'citas de mañana sin confirmar'}`, () => irClinica('seguimiento', 'confirmaciones')],
    bajo.length > 0 && ['warn', 'gestion', `Stock bajo: ${bajo.map((i) => i.nombre).slice(0, 3).join(', ')}${bajo.length > 3 ? ` y ${bajo.length - 3} más` : ''}`, () => irClinica('gestion', 'inventario')],
    vencidos.length > 0 && ['info', 'agenda', `${vencidos.length} ${vencidos.length === 1 ? 'paciente con control vencido' : 'pacientes con control vencido'}`, () => irClinica('seguimiento', 'controles')]
  ].filter(Boolean);
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
      <Cabecera titulo={`${saludo}${nombre ? ', ' + nombre : ''}`} sub={fechaLarga(hoy())} acciones={<Btn icon="calendario" onClick={() => irClinica('agenda')}>Abrir la agenda</Btn>} />
      <Kpis items={[
        ['Citas de hoy', citas.length, `${todas.length - citas.length} canceladas`],
        ['En sala de espera', enSala.length, enSala.length ? `Espera media ${esperaMedia} min` : 'Nadie esperando', esperaMedia > 15 ? 'text-bad' : enSala.length ? 'text-warn' : ''],
        ['En atención', COLS[2][1].length, 'Ahora en box'],
        ['Atendidos', citas.filter((c) => c.estado === 'atendida').length, `${citas.filter((c) => c.estado === 'no-asistio').length} no asistieron`],
        ['Recaudado hoy', clp(pagos.reduce((s, x) => s + x.monto, 0)), `${pagos.length} ${pagos.length === 1 ? 'pago' : 'pagos'}`, '', () => irClinica('caja', 'cierre')],
        ['Por confirmar mañana', manana.length, manana.length ? 'Ver confirmaciones' : 'Todo confirmado', manana.length ? 'text-warn' : 'text-ok', () => irClinica('seguimiento', 'confirmaciones')]
      ]} />
      <div className="grid gap-4 [&>*]:min-w-0 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          <Panel titulo="Flujo de pacientes de hoy" acciones={<span className="text-[12px] text-[var(--cl-muted)]">Se actualiza solo</span>} cuerpo="p-0">
            <div className="grid divide-y divide-[var(--cl-line-2)] md:grid-cols-4 md:divide-x md:divide-y-0">
              {COLS.map(([t, l], k) => (
                <div key={t} className="flex min-w-0 flex-col">
                  <div className="flex items-center justify-between bg-[var(--cl-nav)] px-3 py-2 text-[12px] font-bold text-ink2"><span>{t}</span><span className="rounded-full bg-[var(--cl-line-2)] px-1.5 tabular-nums">{l.length}</span></div>
                  <div className="flex max-h-[460px] flex-col gap-2 overflow-y-auto p-2.5">
                    {!l.length && <p className="m-0 px-1 py-4 text-center text-[12.5px] text-ink3">—</p>}
                    {l.map((c) => {
                      const p = profDe(clinica, c.profesionalId), w = espera(c), tarde = k === 0 && mins(c.hora) + 10 < ahoraMin;
                      return (
                        <article key={c.id} className="rounded-[8px] border border-[var(--cl-line)] bg-card p-2.5" style={{ borderLeft: `3px solid ${colorProf(clinica, c.profesionalId)}` }}>
                          <div className="flex items-baseline justify-between gap-2"><b className="text-[13px] tabular-nums text-deep">{c.hora}</b>{k === 0 && <Insignia estado={c.estado} />}{k === 3 && <Insignia estado={c.estado} />}{k === 1 && w !== null && <span className={cx('text-[11.5px] font-bold tabular-nums', w > 15 ? 'text-bad' : 'text-warn')}>{w} min</span>}</div>
                          <button type="button" onClick={() => abrirPaciente(c.pacienteId)} className="mt-0.5 block w-full truncate text-left text-[13.5px] font-semibold text-ink hover:underline">{c.pacienteNombre}</button>
                          <p className="m-0 truncate text-[12px] text-ink3">{c.motivo || 'Atención'} · {c.box}{p ? ' · ' + p.nombre.replace(/\s*\(fictici[oa]\)/, '') : ''}</p>
                          {tarde && <p className="m-0 mt-1 text-[11.5px] font-semibold text-bad">Atrasado {ahoraMin - mins(c.hora)} min</p>}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {k === 0 && <Btn sm v="soft" onClick={() => mover(c, 'llego')}>Llegó</Btn>}
                            {k === 0 && tarde && <Btn sm onClick={() => mover(c, 'no-asistio')}>No asistió</Btn>}
                            {k === 1 && <Btn sm v="primary" onClick={() => mover(c, 'en-atencion')}>Pasar a box</Btn>}
                            {k === 2 && <Btn sm v="primary" onClick={() => mover(c, 'atendida')}>Terminar</Btn>}
                            {k === 3 && c.estado === 'atendida' && <Btn sm onClick={() => abrirPaciente(c.pacienteId, 'presupuestos')}>Cobrar</Btn>}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel titulo="Ocupación de boxes hoy">
            <div className="grid gap-3 sm:grid-cols-3">{boxes.map((x) => <div key={x.b} className="flex flex-col gap-1.5"><div className="flex justify-between text-[13px]"><b className="text-ink">{x.b}</b><span className="tabular-nums text-[var(--cl-muted)]">{x.n} citas · {x.pct} %</span></div><span className="h-2 overflow-hidden rounded-full bg-[var(--cl-line-2)]"><span className="block h-full rounded-full" style={{ width: x.pct + '%', background: x.pct > 85 ? 'var(--warn)' : 'var(--acento)' }} /></span></div>)}</div>
          </Panel>
        </div>
        <div className="flex flex-col gap-4">
          <Panel titulo="Requiere atención" cuerpo="p-0">{alertas.length ? alertas.map(([tono, ic, t, fn], i) => <Alerta key={i} tono={tono} ic={{ esterilizacion: 'alert', laboratorio: 'diente', seguimiento: 'send', gestion: 'alert', agenda: 'calendario' }[ic]} onClick={fn}>{t}</Alerta>) : <p className="m-0 px-4 py-4 text-[13px] text-ink3">Todo en orden.</p>}</Panel>
          <Panel titulo="Tus tareas" acciones={<button type="button" onClick={() => irClinica('gestion', 'tareas')} className="text-[12.5px] font-semibold text-acento">Ver todas</button>} cuerpo="p-0">
            {!misTareas.length ? <p className="m-0 px-4 py-4 text-[13px] text-ink3">Sin tareas pendientes.</p> : misTareas.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-start gap-2.5 border-b border-[var(--cl-line-2)] px-4 py-2.5 last:border-0">
                <button type="button" onClick={() => marcarTarea(t)} aria-label="Marcar hecha" className="mt-0.5 h-4 w-4 flex-none rounded border-[1.5px] border-[var(--cl-line)] hover:border-acento" />
                <span className="min-w-0 flex-1 text-[13.5px] text-ink">{t.titulo}</span>
                {t.vence && <span className={cx('flex-none text-[12px] tabular-nums', diasHasta(t.vence) < 0 ? 'font-semibold text-bad' : 'text-ink3')}>{diasHasta(t.vence) === 0 ? 'Hoy' : fechaCorta(t.vence)}</span>}
              </div>
            ))}
          </Panel>
          {cumple.length > 0 && (
            <Panel titulo="Cumpleaños de hoy" cuerpo="p-0">
              {cumple.map((p) => <div key={p.id} className="flex items-center gap-2.5 border-b border-[var(--cl-line-2)] px-4 py-2.5 text-[13.5px] last:border-0"><Avatar nombre={nombreDe(p)} size={28} /><span className="min-w-0 flex-1 truncate text-ink">{nombreDe(p)}</span>{telefonoWa(p.telefono) && <a href={`https://wa.me/${telefonoWa(p.telefono)}?text=${encodeURIComponent(`¡Feliz cumpleaños, ${p.nombres}! Te saluda todo el equipo de ${clinica.nombre}.`)}`} target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-semibold text-ok">Saludar</a>}</div>)}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

export function Seguimiento() {
  const { tabClinica, irClinica } = useApp();
  const tab = ['confirmaciones', 'controles', 'espera'].includes(tabClinica) ? tabClinica : 'confirmaciones';
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-4">
      <Cabecera titulo="Seguimiento" sub="Que ningún paciente se pierda" />
      <Pestanas items={[['confirmaciones', 'Confirmaciones'], ['controles', 'Controles periódicos'], ['espera', 'Lista de espera']]} valor={tab} onChange={(k) => irClinica('seguimiento', k)} />
      {tab === 'confirmaciones' && <Confirmaciones sinCabecera />}
      {tab === 'controles' && <Controles />}
      {tab === 'espera' && <ListaEspera />}
    </div>
  );
}

function Controles() {
  const { clinica, abrirPaciente } = useApp();
  const pacientes = usePacientes(clinica.id);
  const [agendar, setAgendar] = useState(null);
  const con = (pacientes || []).filter((p) => p.control && p.control.fecha).sort((a, b) => a.control.fecha.localeCompare(b.control.fecha));
  const grupos = [['Vencidos', con.filter((p) => diasHasta(p.control.fecha) < 0)], ['Próximos 30 días', con.filter((p) => { const d = diasHasta(p.control.fecha); return d >= 0 && d <= 30; })], ['Más adelante', con.filter((p) => diasHasta(p.control.fecha) > 30)]];
  const msg = (p) => `Hola ${p.nombres}, te escribimos de ${clinica.nombre}: ya corresponde tu control${p.control.motivo ? ' (' + p.control.motivo.toLowerCase() + ')' : ''}. ¿Te agendamos una hora?`;
  return (
    <div className="flex flex-col gap-4">
      {pacientes === null ? <div className="h-32 animate-pulse rounded-[22px] bg-soft" /> : !con.length ? <Vacio icon="calendario" titulo="Sin controles programados">En la ficha de cada paciente, «Próximo control» deja la fecha y el motivo. Aquí aparecen ordenados para llamarlos a tiempo.</Vacio>
        : grupos.filter(([, l]) => l.length).map(([t, l]) => (
          <section key={t} className="flex flex-col gap-2">
            <p className="rotulo m-0">{t} · {l.length}</p>
            <Tarjeta>{l.map((p) => (
              <Fila key={p.id}>
                <span className={cx('w-24 flex-none text-[13px] font-semibold', diasHasta(p.control.fecha) < 0 ? 'text-bad' : 'text-ink')}>{fechaCorta(p.control.fecha)}</span>
                <button type="button" onClick={() => abrirPaciente(p.id)} className="min-w-0 flex-1 text-left"><b className="block truncate text-[14.5px] text-ink hover:underline">{nombreDe(p)}</b><span className="block truncate text-[12.5px] text-ink3">{p.control.motivo || 'Control'}</span></button>
                {telefonoWa(p.telefono) && <a href={`https://wa.me/${telefonoWa(p.telefono)}?text=${encodeURIComponent(msg(p))}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-ok px-3 py-1.5 text-[12.5px] font-semibold text-onc">WhatsApp</a>}
                <Btn sm v="soft" onClick={() => setAgendar(p)}>Agendar</Btn>
              </Fila>
            ))}</Tarjeta>
          </section>
        ))}
      {agendar && <ModalCita inicial={{ pacienteId: agendar.id, pacienteNombre: nombreDe(agendar), fecha: sumar(hoy(), 1), hora: '09:00', motivo: agendar.control.motivo || 'Control' }} cerrar={() => setAgendar(null)} />}
    </div>
  );
}

function ListaEspera() {
  const { clinica, myUid, perfil, avisar } = useApp();
  const lista = useColeccionClinica(clinica.id, 'espera');
  const pacientes = usePacientes(clinica.id) || [];
  const [nuevo, setNuevo] = useState(null);
  const [agendar, setAgendar] = useState(null);
  const quitar = async (x) => { try { await borrarEn(clinica.id, 'espera', x.id); avisar('Quitado de la lista'); } catch (e) { avisar('No se pudo quitar.', 'warn'); } };
  const guardar = async () => {
    const p = pacientes.find((y) => y.id === nuevo.pacienteId);
    if (!p) { avisar('Elige el paciente.', 'warn'); return; }
    try { await crearEn(clinica.id, 'espera', { pacienteId: p.id, pacienteNombre: nombreDe(p), telefono: p.telefono || '', preferencia: nuevo.preferencia, motivo: nuevo.motivo, creadoPor: yoComo(myUid, perfil) }); setNuevo(null); avisar('Agregado a la lista de espera'); }
    catch (e) { avisar('No se pudo agregar.', 'warn'); }
  };
  return (
    <div className="flex flex-col gap-3">
      <Btn v="primary" icon="plus" className="self-start" onClick={() => setNuevo({ pacienteId: '', preferencia: 'Cualquier horario', motivo: '' })}>Agregar a la lista de espera</Btn>
      <p className="m-0 text-[13px] text-ink2">Pacientes que quieren adelantar su hora: cuando alguien cancela, aquí está a quién llamar.</p>
      {lista === null ? <div className="h-32 animate-pulse rounded-[22px] bg-soft" /> : !lista.length ? <Vacio icon="personas" titulo="La lista de espera está vacía" /> : (
        <Tarjeta>{lista.map((x) => (
          <Fila key={x.id}>
            <Avatar nombre={x.pacienteNombre} size={34} />
            <span className="min-w-0 flex-1"><b className="block truncate text-[14.5px] text-ink">{x.pacienteNombre}</b><span className="block truncate text-[12.5px] text-ink3">{x.preferencia}{x.motivo ? ' · ' + x.motivo : ''} · desde {new Date(x.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</span></span>
            {telefonoWa(x.telefono) && <a href={`https://wa.me/${telefonoWa(x.telefono)}?text=${encodeURIComponent(`Hola ${x.pacienteNombre.split(' ')[0]}, se liberó una hora en ${clinica.nombre}. ¿Te acomoda?`)}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-ok px-3 py-1.5 text-[12.5px] font-semibold text-onc">WhatsApp</a>}
            <Btn sm v="soft" onClick={() => setAgendar(x)}>Agendar</Btn>
            <button type="button" onClick={() => quitar(x)} aria-label="Quitar de la lista" className="rounded-full p-1.5 text-ink3 hover:bg-soft"><Ic n="x" s={16} /></button>
          </Fila>
        ))}</Tarjeta>
      )}
      {nuevo && (
        <Modal open onClose={() => setNuevo(null)} title="Lista de espera">
          <div className="flex flex-col gap-3">
            <Field label="Paciente" id="es-p"><select id="es-p" value={nuevo.pacienteId} onChange={(e) => setNuevo({ ...nuevo, pacienteId: e.target.value })} className={inputCls}><option value="">Elige…</option>{pacientes.map((p) => <option key={p.id} value={p.id}>{nombreDe(p)}</option>)}</select></Field>
            <Field label="Preferencia" id="es-h"><select id="es-h" value={nuevo.preferencia} onChange={(e) => setNuevo({ ...nuevo, preferencia: e.target.value })} className={inputCls}>{['Cualquier horario', 'Mañanas', 'Tardes', 'Sábados'].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Motivo" id="es-m"><input id="es-m" value={nuevo.motivo} onChange={(e) => setNuevo({ ...nuevo, motivo: e.target.value })} className={inputCls} /></Field>
            <div className="flex gap-2"><Btn v="primary" onClick={guardar}>Agregar</Btn><Btn onClick={() => setNuevo(null)}>Cancelar</Btn></div>
          </div>
        </Modal>
      )}
      {agendar && <ModalCita inicial={{ pacienteId: agendar.pacienteId, pacienteNombre: agendar.pacienteNombre, fecha: hoy(), hora: '09:00', motivo: agendar.motivo }} cerrar={() => setAgendar(null)} />}
    </div>
  );
}
