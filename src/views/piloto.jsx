// Panel del equipo Criterium para el piloto START MEDUC (vista `piloto`, solo admins):
// interruptores de config/piloto, indicador, participantes, invitaciones, CSV seudonimizado y «Abrir todo».
import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../ctx.js';
import { usePerfiles } from '../db.js';
import { descargar } from '../logic.js';
import { Ic, Btn, Field, Pill, Seg, Vacio, inputCls, cx } from '../ui.jsx';
import { GRUPOS, PILOTO_DEFECTO, fechaApertura, fechaTxt, guardarConfigPiloto, abrirTodo, generarInvitaciones, asignarGrupo, quitarDelPiloto, guardarIdentidad, leerDatosPiloto, indicadorPiloto, csvEventos } from '../piloto.js';

const isoDia = (d) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10) : '');
const OPC_GRUPO = [{ v: 'criterium', t: 'Criterium' }, { v: 'habitual', t: 'Habitual' }];

function Tarjeta({ titulo, children, accion }) {
  return (
    <section className="tarjeta flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="m-0 text-[17px] font-bold text-deep">{titulo}</h2>{accion}</div>
      {children}
    </section>
  );
}
function Interruptor({ on, onChange, t, s }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-rs py-1">
      <input type="checkbox" checked={!!on} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 flex-none accent-[var(--acento)]" />
      <span className="min-w-0"><b className="block text-[14px] text-ink">{t}</b><span className="block text-[12.5px] leading-snug text-ink3">{s}</span></span>
    </label>
  );
}

export function PanelPiloto() {
  const { esAdmin, avisar, piloto } = useApp();
  const cfg = (piloto && piloto.cfg) || null;
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const cargar = async () => {
    setCargando(true); setError('');
    try { setDatos(await leerDatosPiloto()); } catch (e) { setError('No se pudieron leer los datos del piloto. ¿Publicaste las reglas nuevas?'); }
    setCargando(false);
  };
  useEffect(() => { if (esAdmin) cargar(); }, [esAdmin]);
  if (!esAdmin) return <Vacio icon="personas" titulo="Solo para el equipo Criterium">Esta sección es para el equipo del estudio.</Vacio>;

  const ind = datos ? indicadorPiloto(datos.eventos, datos.participantes) : null;
  const guardar = async (cambios, msj) => { try { await guardarConfigPiloto(cambios); avisar(msj || 'Guardado'); } catch (e) { avisar('No se pudo guardar.', 'warn'); } };

  return (
    <div className="mx-auto flex max-w-[980px] flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="rotulo m-0 mb-1.5">Equipo Criterium</p>
          <h1 className="m-0 text-[28px] font-bold tracking-[-.03em] text-deep sm:text-[34px]">Piloto START MEDUC</h1>
          <p className="m-0 mt-1 max-w-[62ch] text-[14px] text-ink3">Lo que cambies aquí se aplica al tiro en la base de datos. Las reglas de Firestore lo hacen cumplir, también si alguien llama directo a la API.</p>
        </div>
        <Btn sm onClick={cargar} disabled={cargando}>{cargando ? 'Cargando…' : 'Actualizar'}</Btn>
      </header>
      {error && <div className="rounded-rs bg-badsoft px-4 py-3 text-[13.5px] font-semibold text-bad">{error}</div>}

      <Estado cfg={cfg} guardar={guardar} />
      <Indicador ind={ind} datos={datos} avisar={avisar} />
      <Participantes datos={datos} recargar={cargar} avisar={avisar} />
      <Invitaciones datos={datos} recargar={cargar} avisar={avisar} />
    </div>
  );
}

/* ── Estado del piloto e interruptores ── */
function Estado({ cfg, guardar }) {
  const c = cfg || PILOTO_DEFECTO;
  const ap = fechaApertura(cfg);
  const abierto = !!cfg && (cfg.abierto === true || Date.now() >= ap.getTime());
  const [fecha, setFecha] = useState(isoDia(ap));
  const [dominios, setDominios] = useState((c.dominiosInvitacion || []).join(', '));
  const [confirmar, setConfirmar] = useState(false);
  useEffect(() => { setFecha(isoDia(ap)); setDominios((c.dominiosInvitacion || []).join(', ')); }, [cfg]);
  return (
    <Tarjeta titulo="Estado" accion={<Pill tono={abierto ? 'ok' : 'warn'}>{abierto ? 'Abierto para todos' : 'Piloto en curso · apertura ' + fechaTxt(ap)}</Pill>}>
      {!cfg && <p className="m-0 rounded-rs bg-warnsoft px-3.5 py-2.5 text-[13px] font-semibold text-warn">Todavía no existe config/piloto. Se crea con «npm run protocolos:subir» o al guardar aquí.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fecha de apertura" id="pil-ap" hint="Ese día se abren los protocolos para el grupo habitual y los módulos nuevos para todos.">
          <div className="flex gap-2">
            <input id="pil-ap" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputCls} />
            <Btn sm onClick={() => guardar({ apertura: fecha }, 'Fecha de apertura guardada')} disabled={!fecha || fecha === isoDia(ap)}>Guardar</Btn>
          </div>
        </Field>
        <Field label="Dominios por invitación" id="pil-dom" hint="Separados por coma. Con estos correos la cuenta se crea solo con código.">
          <div className="flex gap-2">
            <input id="pil-dom" value={dominios} onChange={(e) => setDominios(e.target.value)} className={inputCls} />
            <Btn sm onClick={() => guardar({ dominiosInvitacion: dominios.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean) }, 'Dominios guardados')}>Guardar</Btn>
          </div>
        </Field>
      </div>
      <div className="flex flex-col gap-2 border-t border-line2 pt-3">
        <Interruptor on={c.registroUCInvitacion} onChange={(v) => guardar({ registroUCInvitacion: v })} t="Registro por invitación (REGISTRO_UC_POR_INVITACION)"
          s="Los correos de esos dominios solo crean cuenta con un código. Una cuenta sin código no recibe nada (salvo docentes y equipo)." />
        <Interruptor on={c.modulosNuevos} onChange={(v) => guardar({ modulosNuevos: v })} t="Módulos nuevos para participantes (MODULOS_NUEVOS_EN_PILOTO)"
          s="Apagado: quienes participan no ven el inicio social, la red, comentarios ni los módulos nuevos hasta la apertura." />
        <Interruptor on={c.congelados} onChange={(v) => guardar({ congelados: v })} t="Protocolos del estudio congelados (PROTOCOLOS_CONGELADOS)"
          s="Los 5 del estudio no se pueden editar. Un cambio queda como versión nueva sin publicar." />
      </div>
      <div className="flex flex-col gap-2 border-t border-line2 pt-4">
        {abierto ? <p className="m-0 text-[13.5px] text-ink2">Ya está todo abierto{cfg && cfg.fechaAbierto ? ' desde el ' + fechaTxt(new Date(cfg.fechaAbierto)) : ''}.</p> : confirmar ? (
          <div className="flex flex-col gap-3 rounded-[18px] bg-warnsoft p-4">
            <p className="m-0 text-[14px] font-semibold text-warn">¿Abrir todo ahora? El grupo habitual verá todos los protocolos y los dos grupos tendrán los módulos nuevos. Hazlo cuando termine el piloto.</p>
            <div className="flex gap-2"><Btn v="primary" onClick={async () => { await guardar({ abierto: true, fechaAbierto: new Date().toISOString() }, 'Todo abierto'); setConfirmar(false); }}>Sí, abrir todo</Btn><Btn onClick={() => setConfirmar(false)}>Cancelar</Btn></div>
          </div>
        ) : <div><Btn icon="sparkle" onClick={() => setConfirmar(true)}>Abrir todo</Btn></div>}
      </div>
    </Tarjeta>
  );
}

/* ── Indicador y exportación ── */
function Indicador({ ind, datos, avisar }) {
  const exportar = async () => {
    const csv = csvEventos(datos.eventos, datos.participantes);
    await descargar('criterium-eventos-uso-' + isoDia(new Date()) + '.csv', new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), avisar);
  };
  const cifra = (v, t, s) => (
    <div className="rounded-[18px] bg-deep p-5 text-onc">
      <b className="block text-[40px] font-extrabold leading-none tabular-nums text-menta">{v === null || v === undefined ? '—' : String(v).replace('.', ',') + ' %'}</b>
      <span className="mt-2 block text-[14px] font-semibold">{t}</span>
      <span className="mt-0.5 block text-[12.5px] text-panelink2">{s}</span>
    </div>
  );
  return (
    <Tarjeta titulo="Uso de protocolos · grupo criterium" accion={<Btn sm icon="download" onClick={exportar} disabled={!datos}>Exportar CSV</Btn>}>
      {!ind ? <div className="h-28 animate-pulse rounded-[18px] bg-soft" /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {cifra(ind.pctSesiones, 'Sesiones con al menos 1 protocolo abierto', ind.sesionesConProtocolo + ' de ' + ind.sesiones + ' sesiones')}
            {cifra(ind.pctEstudiantes, 'Estudiantes que abren al menos 1 en la mayoría de sus sesiones', ind.estudiantesCumplen + ' de ' + ind.estudiantes + ' estudiantes con sesiones')}
          </div>
          <p className="m-0 text-[12.5px] leading-snug text-ink3">
            {datos.eventos.length} eventos registrados. El CSV trae código, grupo, sesión, tipo, protocolo y hora: nunca nombre, correo ni cuenta.
            Los niveles 2 y 3 cuentan solo cuando la persona los abre (no la apertura automática del modo guiado).
          </p>
        </>
      )}
    </Tarjeta>
  );
}

/* ── Participantes ── */
function Participantes({ datos, recargar, avisar }) {
  const perfiles = usePerfiles(true);
  const [busca, setBusca] = useState('');
  const [grupo, setGrupo] = useState('criterium');
  const [consent, setConsent] = useState('');
  const [quitar, setQuitar] = useState(null);
  const idDe = useMemo(() => Object.fromEntries(((datos && datos.identidades) || []).map((x) => [x.codigo, x])), [datos]);
  const lista = (datos && datos.participantes) || [];
  const enPiloto = new Set(lista.map((p) => p.uid));
  const sugeridos = busca.trim().length >= 2 ? perfiles.filter((p) => !enPiloto.has(p.uid) && (p.nombre || '').toLowerCase().includes(busca.trim().toLowerCase())).slice(0, 6) : [];
  const asignar = async (p) => {
    try { const cod = await asignarGrupo(p.uid, grupo, p.nombre, consent); avisar(p.nombre + ' queda en el grupo ' + grupo + ' (' + cod + ')'); setBusca(''); recargar(); }
    catch (e) { avisar('No se pudo asignar.', 'warn'); }
  };
  return (
    <Tarjeta titulo={'Participantes · ' + lista.length}>
      <div className="flex flex-col gap-3 rounded-[18px] bg-soft p-4">
        <p className="m-0 text-[13px] font-semibold text-ink">Asignar grupo a una cuenta que ya existe</p>
        <div className="flex flex-wrap items-center gap-2">
          <Seg opciones={OPC_GRUPO} valor={grupo} onChange={setGrupo} size="sm" />
          <label className="flex items-center gap-2 text-[12.5px] text-ink2">Consentimiento firmado el <input type="date" value={consent} onChange={(e) => setConsent(e.target.value)} className={cx(inputCls, '!w-auto !py-1.5')} /></label>
        </div>
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Busca por nombre…" aria-label="Buscar una cuenta" className={inputCls} />
        {sugeridos.map((p) => (
          <div key={p.uid} className="flex items-center gap-3 rounded-rs bg-card px-3 py-2">
            <span className="min-w-0 flex-1"><b className="block truncate text-[14px] text-ink">{p.nombre}</b><span className="block truncate text-[12px] text-ink3">{[p.rol, p.institucion].filter(Boolean).join(' · ')}</span></span>
            <Btn sm v="primary" onClick={() => asignar(p)} disabled={!consent}>Asignar</Btn>
          </div>
        ))}
        {busca.trim().length >= 2 && !sugeridos.length && <p className="m-0 text-[12.5px] text-ink3">Nadie con ese nombre fuera del piloto.</p>}
        {!consent && <p className="m-0 text-[12px] text-ink3">Primero la fecha del consentimiento: sin consentimiento firmado no se asigna.</p>}
      </div>
      {!datos ? <div className="h-20 animate-pulse rounded-[18px] bg-soft" /> : !lista.length ? <p className="m-0 text-[13.5px] text-ink3">Todavía no hay participantes.</p> : (
        <div className="flex flex-col">
          {lista.map((p, k) => { const id = idDe[p.codigo] || {}; return (
            <div key={p.uid} className={cx('flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5', k > 0 && 'border-t border-line2')}>
              <b className="w-[92px] flex-none text-[14px] tabular-nums text-ink">{p.codigo}</b>
              <Pill tono={p.grupo === 'criterium' ? 'acento' : 'neutro'}>{p.grupo}</Pill>
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink2">{id.nombre || 'Sin nombre en identidades'}{id.consentimiento ? ' · consentimiento ' + id.consentimiento : ''}</span>
              {quitar === p.uid
                ? <span className="flex gap-2 text-[13px]"><button type="button" className="font-semibold text-bad underline" onClick={async () => { await quitarDelPiloto(p.uid).catch(() => avisar('No se pudo quitar.', 'warn')); setQuitar(null); recargar(); }}>Quitar del piloto</button><button type="button" className="underline" onClick={() => setQuitar(null)}>No</button></span>
                : <button type="button" onClick={() => setQuitar(p.uid)} className="text-[13px] text-ink3 hover:text-ink">Quitar</button>}
            </div>
          ); })}
        </div>
      )}
    </Tarjeta>
  );
}

/* ── Invitaciones ── */
function Invitaciones({ datos, recargar, avisar }) {
  const [n, setN] = useState(5);
  const [grupo, setGrupo] = useState('criterium');
  const [nuevas, setNuevas] = useState([]);
  const [haciendo, setHaciendo] = useState(false);
  const idDe = useMemo(() => Object.fromEntries(((datos && datos.identidades) || []).map((x) => [x.codigo, x])), [datos]);
  const lista = [...((datos && datos.invitaciones) || [])].sort((a, b) => Number(a.usada) - Number(b.usada));
  const generar = async () => {
    setHaciendo(true);
    try { setNuevas(await generarInvitaciones(Math.max(1, Math.min(60, +n || 1)), grupo)); recargar(); } catch (e) { avisar('No se pudieron crear.', 'warn'); }
    setHaciendo(false);
  };
  const copiar = async () => { try { await navigator.clipboard.writeText(nuevas.map((x) => x.cod + '\t' + x.participante + '\t' + x.grupo).join('\n')); avisar('Códigos copiados'); } catch (e) { avisar('No se pudo copiar.', 'warn'); } };
  return (
    <Tarjeta titulo="Invitaciones">
      <p className="m-0 text-[13px] leading-snug text-ink3">Entrega un código a cada estudiante después de que firma el consentimiento. Anota su nombre y la fecha de firma: quedan solo en identidades/, que ve el equipo.</p>
      <div className="flex flex-wrap items-center gap-2">
        <input type="number" min="1" max="60" value={n} onChange={(e) => setN(e.target.value)} aria-label="Cantidad" className={cx(inputCls, '!w-20')} />
        <Seg opciones={OPC_GRUPO} valor={grupo} onChange={setGrupo} size="sm" />
        <Btn v="primary" icon="plus" onClick={generar} disabled={haciendo}>{haciendo ? 'Creando…' : 'Crear códigos'}</Btn>
      </div>
      {nuevas.length > 0 && (
        <div className="flex flex-col gap-2 rounded-[18px] bg-deep p-4 text-onc">
          <div className="flex items-center justify-between"><b className="text-[14px]">Códigos nuevos · {GRUPOS[nuevas[0].grupo]}</b><button type="button" onClick={copiar} className="text-[13px] font-semibold text-menta">Copiar</button></div>
          <div className="grid gap-1.5 sm:grid-cols-2">{nuevas.map((x) => <span key={x.cod} className="text-[15px] font-bold tracking-[.12em] text-menta">{x.cod} <span className="text-[12px] font-normal tracking-normal text-panelink2">→ {x.participante}</span></span>)}</div>
        </div>
      )}
      {!datos ? <div className="h-20 animate-pulse rounded-[18px] bg-soft" /> : !lista.length ? <p className="m-0 text-[13.5px] text-ink3">Todavía no hay invitaciones.</p> : (
        <div className="flex flex-col">
          {lista.map((x, k) => <FilaInvitacion key={x.cod} x={x} id={idDe[x.participante] || {}} primera={k === 0} avisar={avisar} />)}
        </div>
      )}
    </Tarjeta>
  );
}
function FilaInvitacion({ x, id, primera, avisar }) {
  const [nombre, setNombre] = useState(id.nombre || '');
  const [consent, setConsent] = useState(id.consentimiento || '');
  const cambio = nombre !== (id.nombre || '') || consent !== (id.consentimiento || '');
  return (
    <div className={cx('flex flex-wrap items-center gap-2 py-2.5', !primera && 'border-t border-line2')}>
      <b className="w-[96px] flex-none text-[14px] tracking-[.08em] text-ink">{x.cod}</b>
      <span className="w-[80px] flex-none text-[12.5px] tabular-nums text-ink3">{x.participante}</span>
      <Pill tono={x.grupo === 'criterium' ? 'acento' : 'neutro'}>{x.grupo}</Pill>
      {x.usada ? <Pill tono="ok">usada</Pill> : <Pill>libre</Pill>}
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de quien firmó" aria-label="Nombre" className={cx(inputCls, '!w-auto min-w-[160px] flex-1 !py-1.5 !text-[13px]')} />
      <input type="date" value={consent} onChange={(e) => setConsent(e.target.value)} aria-label="Fecha del consentimiento" className={cx(inputCls, '!w-auto !py-1.5 !text-[13px]')} />
      {cambio && <Btn sm onClick={() => guardarIdentidad(x.participante, { nombre: nombre.trim(), consentimiento: consent }).then(() => avisar('Guardado')).catch(() => avisar('No se pudo guardar.', 'warn'))}>Guardar</Btn>}
    </div>
  );
}
