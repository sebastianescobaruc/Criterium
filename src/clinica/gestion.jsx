// Clínica › Gestión: laboratorio (todas las órdenes), inventario con entradas y salidas, esterilización por ciclo
// (trazabilidad del instrumental), tareas del equipo, informes y registro de accesos a las fichas (administración).
import React, { useState } from 'react';
import { useApp } from '../ctx.js';
import { useColeccionClinica, usePacientes, crearEn, actualizarEn, borrarEn, moverStockFS, useMovimientos } from './db.js';
import { Informes } from './clinica.jsx';
import { TarjetaLab, ModalLab, ESTADOS_LAB, labAtrasado } from './plan.jsx';
import { hoy, fechaCorta, fechaHora, diasHasta, clp, nombreDe, yoComo, ROLES, Cabecera, Pestanas, Tarjeta, Fila, Alerta, CabTabla } from './comun.jsx';
import { Ic, Btn, Modal, Field, Seg, Vacio, Avatar, inputCls, cx } from '../ui.jsx';

export function Gestion() {
  const { tabClinica, irClinica, rolClinica, clinica } = useApp();
  const admin = rolClinica === 'admin';
  const lab = useColeccionClinica(clinica.id, 'laboratorio') || [];
  const inv = useColeccionClinica(clinica.id, 'inventario') || [];
  const tareas = useColeccionClinica(clinica.id, 'tareas') || [];
  const tabs = ['laboratorio', 'inventario', 'esterilizacion', 'tareas', 'informes', admin && 'accesos'].filter(Boolean);
  const tab = tabs.includes(tabClinica) ? tabClinica : 'laboratorio';
  const TIT = { laboratorio: ['Laboratorio', 'Órdenes de trabajo enviadas a laboratorio y su estado'], inventario: ['Inventario', 'Insumos, stock mínimo, vencimientos y movimientos'], esterilizacion: ['Esterilización', 'Ciclos de autoclave e indicadores: trazabilidad del instrumental'], tareas: ['Tareas', 'Pendientes del equipo'], informes: ['Informes', 'Citas, inasistencia, producción y profesionales'], accesos: ['Registro de accesos', 'Quién abrió cada ficha y cuándo'] }[tab];
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
      <Cabecera titulo={TIT[0]} sub={TIT[1]} />
      {tab === 'laboratorio' && <Laboratorio lista={lab} />}
      {tab === 'inventario' && <Inventario lista={inv} admin={admin} />}
      {tab === 'esterilizacion' && <Esterilizacion />}
      {tab === 'tareas' && <Tareas lista={tareas} />}
      {tab === 'informes' && <Informes sinCabecera />}
      {tab === 'accesos' && <Accesos />}
    </div>
  );
}

/* ── Laboratorio: todas las órdenes, con las atrasadas arriba ── */
function Laboratorio({ lista }) {
  const { clinica } = useApp();
  const pacientes = usePacientes(clinica.id) || [];
  const [filtro, setFiltro] = useState('curso');
  const [elegir, setElegir] = useState(false);
  const [paciente, setPaciente] = useState(null);
  const ver = lista.filter((o) => filtro === 'todas' || (filtro === 'curso' ? !['instalado', 'anulado'].includes(o.estado) : o.estado === filtro))
    .sort((a, b) => (labAtrasado(b) - labAtrasado(a)) || (a.entrega || '9').localeCompare(b.entrega || '9'));
  const porCobrar = lista.filter((o) => o.estado !== 'anulado' && (o.envio || '').startsWith(hoy().slice(0, 7))).reduce((s, o) => s + (o.costo || 0), 0);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn v="primary" icon="plus" onClick={() => setElegir(true)}>Nueva orden</Btn>
        <span className="text-[13px] text-ink2">Costo de laboratorio este mes: <b>{clp(porCobrar)}</b></span>
      </div>
      <Seg opciones={[{ v: 'curso', t: 'En curso' }, { v: 'recibido', t: 'Por instalar' }, { v: 'instalado', t: 'Instaladas' }, { v: 'todas', t: 'Todas' }]} valor={filtro} onChange={setFiltro} size="sm" />
      {!ver.length ? <Vacio icon="diente" titulo="Sin órdenes aquí">Las órdenes se crean desde la ficha del paciente o con «Nueva orden».</Vacio> : <div className="grid gap-3 [&>*]:min-w-0 md:grid-cols-2">{ver.map((o) => <TarjetaLab key={o.id} o={o} mostrarPaciente />)}</div>}
      {elegir && (
        <Modal open onClose={() => setElegir(false)} title="¿Para qué paciente?">
          <div className="flex max-h-[60vh] flex-col overflow-y-auto">{pacientes.map((p) => <button key={p.id} type="button" onClick={() => { setPaciente(p); setElegir(false); }} className="flex items-center gap-2 rounded-[12px] px-2 py-2 text-left text-[14px] hover:bg-soft"><Avatar nombre={nombreDe(p)} size={28} />{nombreDe(p)}</button>)}</div>
        </Modal>
      )}
      {paciente && <ModalLab paciente={paciente} cerrar={() => setPaciente(null)} />}
    </div>
  );
}

/* ── Inventario: cada insumo con stock, mínimo y vencimiento; el stock cambia solo con entradas y salidas registradas ── */
const PLI = 'minmax(220px,2fr) minmax(110px,1fr) minmax(140px,1.2fr) 120px 80px 120px';
const CATEGORIAS_INV = ['Anestesia', 'Restauración', 'Endodoncia', 'Periodoncia', 'Cirugía', 'Prótesis', 'Bioseguridad', 'Desechables', 'Otros'];
function Inventario({ lista, admin }) {
  const { clinica, avisar } = useApp();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('todas');
  const [nuevo, setNuevo] = useState(null);
  const [abierto, setAbierto] = useState(null);
  const ver = lista.filter((i) => (cat === 'todas' || (cat === 'bajo' ? (i.stock || 0) <= (i.minimo || 0) : i.categoria === cat)) && (!q || i.nombre.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const porVencer = lista.filter((i) => i.vence && diasHasta(i.vence) <= 60);
  const guardar = async () => {
    if (!nuevo.nombre.trim()) { avisar('Falta el nombre.', 'warn'); return; }
    try { await crearEn(clinica.id, 'inventario', { ...nuevo, nombre: nuevo.nombre.trim(), stock: Math.max(0, Math.round(+nuevo.stock || 0)), minimo: Math.max(0, Math.round(+nuevo.minimo || 0)), costo: Math.round(+nuevo.costo || 0) }); setNuevo(null); avisar('Insumo agregado'); }
    catch (e) { avisar('No se pudo agregar.', 'warn'); }
  };
  const item = abierto && lista.find((i) => i.id === abierto);
  return (
    <div className="flex flex-col gap-3">
      {porVencer.length > 0 && <Tarjeta><Alerta tono="warn" ic="clock">Vencen pronto: {porVencer.map((i) => `${i.nombre} (${fechaCorta(i.vence)})`).join(', ')}</Alerta></Tarjeta>}
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar insumo" aria-label="Buscar insumo" className={cx(inputCls, 'max-w-[280px]')} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoría" className={cx(inputCls, 'max-w-[200px]')}><option value="todas">Todas</option><option value="bajo">Stock bajo</option>{CATEGORIAS_INV.map((c) => <option key={c}>{c}</option>)}</select>
        <Btn v="primary" icon="plus" onClick={() => setNuevo({ nombre: '', categoria: 'Desechables', unidad: 'unidades', stock: '', minimo: '', costo: '', proveedor: '', vence: '' })}>Nuevo insumo</Btn>
      </div>
      {!ver.length ? <Vacio icon="folder" titulo="Sin insumos aquí" /> : (
        <Tarjeta>
          <CabTabla plantilla={PLI} cols={['Insumo', 'Categoría', 'Proveedor', 'Vence', '>Mínimo', '>Stock']} />
          {ver.map((i) => {
            const bajo = (i.stock || 0) <= (i.minimo || 0), vence = i.vence && diasHasta(i.vence) <= 60;
            return (
              <button key={i.id} type="button" onClick={() => setAbierto(i.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 border-b border-[var(--cl-line-2)] px-4 py-2.5 text-left text-[13.5px] last:border-0 hover:bg-[var(--cl-hover)] md:[grid-template-columns:var(--pl)]" style={{ '--pl': PLI }}>
                <span className="min-w-0"><b className="block truncate font-semibold text-ink">{i.nombre}</b><span className="block truncate text-[12px] text-ink3 md:hidden">{i.categoria}{i.vence ? ' · vence ' + fechaCorta(i.vence) : ''}</span></span>
                <span className="hidden truncate text-ink2 md:block">{i.categoria}</span>
                <span className="hidden truncate text-ink2 md:block">{i.proveedor || '—'}</span>
                <span className={cx('hidden md:block', vence ? 'font-semibold text-warn' : 'text-ink2')}>{i.vence ? fechaCorta(i.vence) : '—'}</span>
                <span className="hidden text-right tabular-nums text-ink3 md:block">{i.minimo || 0}</span>
                <span className="text-right"><b className={cx('inline-block min-w-[64px] rounded-md px-2 py-0.5 text-center text-[12.5px] tabular-nums', bajo ? 'bg-badsoft text-bad' : 'bg-oksoft text-ok')}>{i.stock || 0} {i.unidad === 'unidades' ? 'u' : i.unidad}</b></span>
              </button>
            );
          })}
        </Tarjeta>
      )}
      {nuevo && (
        <Modal open onClose={() => setNuevo(null)} title="Nuevo insumo">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre" id="in-n" className="sm:col-span-2"><input id="in-n" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} placeholder="Ej.: Lidocaína 2 % con epinefrina, tubo" className={inputCls} /></Field>
            <Field label="Categoría" id="in-c"><select id="in-c" value={nuevo.categoria} onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })} className={inputCls}>{CATEGORIAS_INV.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Unidad" id="in-u"><select id="in-u" value={nuevo.unidad} onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value })} className={inputCls}>{['unidades', 'cajas', 'jeringas', 'tubos', 'frascos', 'paquetes'].map((u) => <option key={u}>{u}</option>)}</select></Field>
            <Field label="Stock inicial" id="in-s"><input id="in-s" type="number" value={nuevo.stock} onChange={(e) => setNuevo({ ...nuevo, stock: e.target.value })} className={inputCls} /></Field>
            <Field label="Avisar bajo" id="in-m" hint="Stock mínimo"><input id="in-m" type="number" value={nuevo.minimo} onChange={(e) => setNuevo({ ...nuevo, minimo: e.target.value })} className={inputCls} /></Field>
            <Field label="Costo por unidad" id="in-$"><input id="in-$" type="number" value={nuevo.costo} onChange={(e) => setNuevo({ ...nuevo, costo: e.target.value })} className={inputCls} /></Field>
            <Field label="Vence" id="in-v"><input id="in-v" type="date" value={nuevo.vence} onChange={(e) => setNuevo({ ...nuevo, vence: e.target.value })} className={inputCls} /></Field>
            <Field label="Proveedor" id="in-p" className="sm:col-span-2"><input id="in-p" value={nuevo.proveedor} onChange={(e) => setNuevo({ ...nuevo, proveedor: e.target.value })} className={inputCls} /></Field>
            <div className="flex gap-2 sm:col-span-2"><Btn v="primary" onClick={guardar}>Agregar</Btn><Btn onClick={() => setNuevo(null)}>Cancelar</Btn></div>
          </div>
        </Modal>
      )}
      {item && <DetalleInsumo i={item} admin={admin} cerrar={() => setAbierto(null)} />}
    </div>
  );
}

function DetalleInsumo({ i, admin, cerrar }) {
  const { clinica, myUid, perfil, avisar } = useApp();
  const movs = useMovimientos(clinica.id, i.id);
  const [m, setM] = useState({ tipo: 'salida', cantidad: 1, nota: '' });
  const [minimo, setMinimo] = useState(i.minimo || 0);
  const [borrar, setBorrar] = useState(false);
  const mover = async () => {
    const n = Math.round(+m.cantidad);
    if (!(n > 0)) { avisar('La cantidad tiene que ser mayor que cero.', 'warn'); return; }
    if (m.tipo === 'salida' && n > (i.stock || 0)) { avisar('No hay tanto stock.', 'warn'); return; }
    try { await moverStockFS(clinica.id, i.id, m.tipo, n, m.nota.trim(), yoComo(myUid, perfil)); setM({ tipo: 'salida', cantidad: 1, nota: '' }); avisar(m.tipo === 'entrada' ? 'Entrada registrada' : 'Salida registrada'); }
    catch (e) { avisar('No se pudo registrar.', 'warn'); }
  };
  const guardarMin = async () => { try { await actualizarEn(clinica.id, 'inventario', i.id, { minimo: Math.max(0, Math.round(+minimo || 0)) }); avisar('Mínimo actualizado'); } catch (e) { avisar('No se pudo guardar.', 'warn'); } };
  const eliminar = async () => { try { await borrarEn(clinica.id, 'inventario', i.id); cerrar(); avisar('Insumo eliminado'); } catch (e) { avisar('No se pudo eliminar.', 'warn'); } };
  return (
    <Modal open onClose={cerrar} title={i.nombre}>
      <div className="flex flex-col gap-4">
        <div className="flex items-end gap-3"><b className="text-[36px] font-extrabold leading-none tabular-nums text-deep">{i.stock || 0}</b><span className="pb-1 text-[14px] text-ink2">{i.unidad} en stock{i.costo ? ' · ' + clp((i.stock || 0) * i.costo) + ' inmovilizados' : ''}</span></div>
        <div className="flex flex-col gap-2 rounded-[16px] bg-soft p-3">
          <Seg opciones={[{ v: 'salida', t: 'Salida (uso)' }, { v: 'entrada', t: 'Entrada (compra)' }]} valor={m.tipo} onChange={(v) => setM({ ...m, tipo: v })} size="sm" />
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <input type="number" min="1" value={m.cantidad} onChange={(e) => setM({ ...m, cantidad: e.target.value })} aria-label="Cantidad" className={cx(inputCls, '!bg-card')} />
            <input value={m.nota} onChange={(e) => setM({ ...m, nota: e.target.value })} placeholder={m.tipo === 'entrada' ? 'Proveedor, factura…' : 'Box, motivo…'} aria-label="Nota" className={cx(inputCls, '!bg-card')} />
          </div>
          <Btn v="primary" sm className="self-start" onClick={mover}>Registrar {m.tipo}</Btn>
        </div>
        <div className="flex items-end gap-2"><Field label="Avisar cuando queden" id="di-m" className="w-40"><input id="di-m" type="number" value={minimo} onChange={(e) => setMinimo(e.target.value)} className={inputCls} /></Field><Btn sm onClick={guardarMin}>Guardar</Btn></div>
        <section className="flex flex-col gap-1">
          <p className="rotulo m-0">Movimientos</p>
          {movs === null ? <div className="h-16 animate-pulse rounded-[14px] bg-soft" /> : !movs.length ? <p className="m-0 text-[13px] text-ink3">Sin movimientos todavía.</p>
            : movs.map((x) => <div key={x.id} className="flex items-center gap-2 border-b border-line2 py-1.5 text-[13px] last:border-0"><b className={cx('w-12 tabular-nums', x.tipo === 'entrada' ? 'text-ok' : 'text-bad')}>{x.tipo === 'entrada' ? '+' : '−'}{x.cantidad}</b><span className="min-w-0 flex-1 truncate text-ink2">{x.nota || (x.tipo === 'entrada' ? 'Entrada' : 'Salida')}</span><span className="text-[12px] text-ink3">{x.por && x.por.nombre} · {new Date(x.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</span></div>)}
        </section>
        {admin && (borrar
          ? <div className="flex flex-wrap items-center gap-2 rounded-[14px] bg-badsoft p-3 text-[13px] text-bad">¿Eliminar este insumo? Los movimientos se pierden.<Btn sm onClick={eliminar}>Sí, eliminar</Btn><Btn sm onClick={() => setBorrar(false)}>No</Btn></div>
          : <button type="button" onClick={() => setBorrar(true)} className="self-start text-[12.5px] font-semibold text-ink3 hover:text-bad">Eliminar insumo</button>)}
      </div>
    </Modal>
  );
}

/* ── Esterilización: cada ciclo de autoclave con sus indicadores y un código de lote que se anota en la evolución ── */
function Esterilizacion() {
  const { clinica, myUid, perfil, avisar } = useApp();
  const ciclos = useColeccionClinica(clinica.id, 'esterilizacion');
  const equipos = clinica.equipos && clinica.equipos.length ? clinica.equipos : ['Autoclave 1'];
  const [nuevo, setNuevo] = useState(null);
  const siguiente = (eq) => 1 + Math.max(0, ...(ciclos || []).filter((c) => c.equipo === eq).map((c) => +c.ciclo || 0));
  const abrir = () => { const eq = equipos[0]; setNuevo({ equipo: eq, programa: 'Instrumental envuelto · 134 °C', temperatura: 134, minutos: 18, quimico: 'ok', biologico: 'no aplica', paquetes: '', nota: '' }); };
  const guardar = async () => {
    const ciclo = siguiente(nuevo.equipo);
    const lote = `${nuevo.equipo.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase()}-${hoy().replace(/-/g, '').slice(2)}-${String(ciclo).padStart(3, '0')}`;
    try { await crearEn(clinica.id, 'esterilizacion', { ...nuevo, ciclo, lote, temperatura: +nuevo.temperatura, minutos: +nuevo.minutos, paquetes: Math.round(+nuevo.paquetes || 0), responsable: yoComo(myUid, perfil) }); setNuevo(null); avisar('Ciclo registrado · lote ' + lote); }
    catch (e) { avisar('No se pudo registrar.', 'warn'); }
  };
  const ind = (v) => <span className={cx('rounded-full px-2 py-[2px] text-[11.5px] font-bold', v === 'ok' ? 'bg-oksoft text-ok' : v === 'falla' ? 'bg-badsoft text-bad' : 'bg-soft text-ink3')}>{v === 'ok' ? 'Viró' : v === 'falla' ? 'Falla' : v === 'pendiente' ? 'Pendiente' : '—'}</span>;
  const ult = (ciclos || [])[0];
  const semanaBio = (ciclos || []).some((c) => c.biologico && c.biologico !== 'no aplica' && diasHasta((c.fecha || '').slice(0, 10)) >= -7);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2"><Btn v="primary" icon="plus" onClick={abrir}>Registrar un ciclo</Btn>{ult && <span className="text-[13px] text-ink2">Último: {ult.lote} · {fechaHora(ult.fecha)}</span>}</div>
      {ciclos && ciclos.length > 0 && !semanaBio && <Tarjeta><Alerta tono="warn" ic="alert">Esta semana no hay ningún ciclo con indicador biológico registrado.</Alerta></Tarjeta>}
      <p className="m-0 text-[13px] text-ink2">Cada ciclo recibe un código de lote. Al firmar una evolución se elige el lote del instrumental usado: así se sabe qué paciente recibió qué instrumental si un indicador falla. Los ciclos no se editan.</p>
      {ciclos === null ? <div className="h-32 animate-pulse rounded-[22px] bg-soft" /> : !ciclos.length ? <Vacio icon="check" titulo="Sin ciclos registrados" /> : (
        <Tarjeta>{ciclos.slice(0, 40).map((c) => (
          <Fila key={c.id} className={cx((c.quimico === 'falla' || c.biologico === 'falla') && 'bg-badsoft')}>
            <span className="min-w-0 flex-1"><b className="block truncate text-[14px] text-ink">{c.lote}</b><span className="block truncate text-[12.5px] text-ink3">{c.equipo} · {c.programa}{c.paquetes ? ' · ' + c.paquetes + ' paquetes' : ''} · {c.responsable && c.responsable.nombre}</span></span>
            <span className="hidden text-[12.5px] text-ink3 sm:inline">{new Date(c.fecha).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            <span className="flex flex-col items-end gap-1 text-[11px] text-ink3 sm:flex-row sm:items-center">Q {ind(c.quimico)} B {ind(c.biologico)}</span>
          </Fila>
        ))}</Tarjeta>
      )}
      {nuevo && (
        <Modal open onClose={() => setNuevo(null)} title="Ciclo de esterilización">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Equipo" id="es-e"><select id="es-e" value={nuevo.equipo} onChange={(e) => setNuevo({ ...nuevo, equipo: e.target.value })} className={inputCls}>{equipos.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Programa" id="es-p"><select id="es-p" value={nuevo.programa} onChange={(e) => { const v = e.target.value; setNuevo({ ...nuevo, programa: v, temperatura: v.includes('121') ? 121 : 134, minutos: v.includes('121') ? 30 : v.includes('sin envolver') ? 4 : 18 }); }} className={inputCls}>{['Instrumental envuelto · 134 °C', 'Instrumental sin envolver · 134 °C', 'Textiles y gomas · 121 °C', 'Prueba de Bowie-Dick'].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Temperatura (°C)" id="es-t"><input id="es-t" type="number" value={nuevo.temperatura} onChange={(e) => setNuevo({ ...nuevo, temperatura: e.target.value })} className={inputCls} /></Field>
            <Field label="Tiempo de exposición (min)" id="es-m"><input id="es-m" type="number" value={nuevo.minutos} onChange={(e) => setNuevo({ ...nuevo, minutos: e.target.value })} className={inputCls} /></Field>
            <Field label="Indicador químico" id="es-q"><select id="es-q" value={nuevo.quimico} onChange={(e) => setNuevo({ ...nuevo, quimico: e.target.value })} className={inputCls}><option value="ok">Viró (correcto)</option><option value="falla">No viró (falla)</option></select></Field>
            <Field label="Indicador biológico" id="es-b"><select id="es-b" value={nuevo.biologico} onChange={(e) => setNuevo({ ...nuevo, biologico: e.target.value })} className={inputCls}><option value="no aplica">No se usó en este ciclo</option><option value="pendiente">Incubando (pendiente)</option><option value="ok">Negativo (correcto)</option><option value="falla">Positivo (falla)</option></select></Field>
            <Field label="Paquetes" id="es-k"><input id="es-k" type="number" value={nuevo.paquetes} onChange={(e) => setNuevo({ ...nuevo, paquetes: e.target.value })} className={inputCls} /></Field>
            <Field label="Nota" id="es-n"><input id="es-n" value={nuevo.nota} onChange={(e) => setNuevo({ ...nuevo, nota: e.target.value })} className={inputCls} /></Field>
            {(nuevo.quimico === 'falla' || nuevo.biologico === 'falla') && <p className="m-0 rounded-[12px] bg-badsoft p-3 text-[13px] font-semibold text-bad sm:col-span-2">Con un indicador en falla, el instrumental de este ciclo no se usa: reprocesa y revisa el equipo.</p>}
            <p className="m-0 text-[12px] text-ink3 sm:col-span-2">Los parámetros por defecto son los habituales de un autoclave de vapor; usa los que indica el fabricante de tu equipo.</p>
            <div className="flex gap-2 sm:col-span-2"><Btn v="primary" onClick={guardar}>Registrar ciclo</Btn><Btn onClick={() => setNuevo(null)}>Cancelar</Btn></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Tareas del equipo: asignadas a un miembro, con fecha ── */
function Tareas({ lista }) {
  const { clinica, myUid, perfil, avisar } = useApp();
  const [filtro, setFiltro] = useState('mias');
  const [nueva, setNueva] = useState('');
  const [asignado, setAsignado] = useState('');
  const [vence, setVence] = useState('');
  const equipo = Object.entries(clinica.equipo || {}).map(([uid, nombre]) => ({ uid, nombre }));
  const ver = lista.filter((t) => filtro === 'hechas' ? t.estado === 'hecha' : t.estado !== 'hecha' && (filtro === 'todas' || !t.asignado || !t.asignado.uid || t.asignado.uid === myUid))
    .sort((a, b) => (a.vence || '9').localeCompare(b.vence || '9'));
  const crear = async () => {
    if (!nueva.trim()) return;
    const a = equipo.find((x) => x.uid === asignado);
    try { await crearEn(clinica.id, 'tareas', { titulo: nueva.trim(), estado: 'pendiente', vence, asignado: a || null, creadoPor: yoComo(myUid, perfil) }); setNueva(''); setVence(''); }
    catch (e) { avisar('No se pudo crear.', 'warn'); }
  };
  const marcar = async (t) => { try { await actualizarEn(clinica.id, 'tareas', t.id, { estado: t.estado === 'hecha' ? 'pendiente' : 'hecha', hechaPor: t.estado === 'hecha' ? null : yoComo(myUid, perfil) }); } catch (e) { avisar('No se pudo cambiar.', 'warn'); } };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-[18px] bg-card p-3 shadow-sh sm:flex-row">
        <input value={nueva} onChange={(e) => setNueva(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && crear()} placeholder="Nueva tarea: llamar al laboratorio, pedir guantes…" aria-label="Nueva tarea" className={cx(inputCls, 'flex-1')} />
        {equipo.length > 0 && <select value={asignado} onChange={(e) => setAsignado(e.target.value)} aria-label="Asignar a" className={cx(inputCls, 'sm:w-44')}><option value="">Para cualquiera</option>{equipo.map((x) => <option key={x.uid} value={x.uid}>{x.nombre}</option>)}</select>}
        <input type="date" value={vence} onChange={(e) => setVence(e.target.value)} aria-label="Para cuándo" className={cx(inputCls, 'sm:w-40')} />
        <Btn v="primary" onClick={crear}>Agregar</Btn>
      </div>
      <Seg opciones={[{ v: 'mias', t: 'Para mí' }, { v: 'todas', t: 'Todo el equipo' }, { v: 'hechas', t: 'Hechas' }]} valor={filtro} onChange={setFiltro} size="sm" />
      {!ver.length ? <Vacio icon="check" titulo={filtro === 'hechas' ? 'Nada hecho todavía' : 'Sin tareas pendientes'} /> : (
        <Tarjeta>{ver.map((t) => (
          <Fila key={t.id}>
            <button type="button" onClick={() => marcar(t)} aria-label={t.estado === 'hecha' ? 'Marcar pendiente' : 'Marcar hecha'} className={cx('grid h-6 w-6 flex-none place-items-center rounded-full border-2', t.estado === 'hecha' ? 'border-ok bg-ok text-onc' : 'border-cardline')}>{t.estado === 'hecha' && <Ic n="check" s={13} />}</button>
            <span className="min-w-0 flex-1"><span className={cx('block text-[14.5px]', t.estado === 'hecha' ? 'text-ink3 line-through' : 'text-ink')}>{t.titulo}</span><span className="block text-[12px] text-ink3">{t.asignado ? 'Para ' + t.asignado.nombre : 'Para cualquiera'}{t.creadoPor ? ' · de ' + t.creadoPor.nombre : ''}</span></span>
            {t.vence && <span className={cx('text-[12.5px] font-semibold', t.estado !== 'hecha' && diasHasta(t.vence) < 0 ? 'text-bad' : 'text-ink3')}>{fechaCorta(t.vence)}</span>}
            <button type="button" onClick={() => borrarEn(clinica.id, 'tareas', t.id)} aria-label="Borrar tarea" className="rounded-full p-1.5 text-ink3 hover:bg-soft"><Ic n="trash" s={15} /></button>
          </Fila>
        ))}</Tarjeta>
      )}
    </div>
  );
}

/* ── Registro de accesos a las fichas (solo administración) ── */
function Accesos() {
  const { clinica } = useApp();
  const accesos = useColeccionClinica(clinica.id, 'accesos');
  const pacientes = usePacientes(clinica.id) || [];
  const nom = (pid) => { const p = pacientes.find((x) => x.id === pid); return p ? nombreDe(p) : 'Paciente'; };
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-[13px] text-ink2">Quién abrió cada ficha y cuándo. Nadie puede editar ni borrar este registro (lo exige la trazabilidad de la ficha clínica).</p>
      {accesos === null ? <div className="h-32 animate-pulse rounded-[22px] bg-soft" /> : !accesos.length ? <Vacio icon="userCheck" titulo="Sin accesos registrados" /> : (
        <Tarjeta>{accesos.slice(0, 100).map((a) => <Fila key={a.id}><span className="w-36 flex-none text-[12.5px] text-ink3">{fechaHora(a.fecha)}</span><span className="min-w-0 flex-1 truncate text-[13.5px] text-ink"><b>{a.nombre || 'Alguien'}</b> · {a.accion || 'abrió'} · {nom(a.pacienteId)}</span><span className="hidden text-[12px] text-ink3 sm:inline">{ROLES[(clinica.miembros || {})[a.uid]] || ''}</span></Fila>)}</Tarjeta>
      )}
    </div>
  );
}
