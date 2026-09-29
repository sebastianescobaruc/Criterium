import React, { useState, useMemo, useRef } from 'react';
import { DATOS } from '../data.js';
import { ESTADOS, ESPECIALIDADES_CASO, TIPOS_FOTO, CRITERIOS, chequeoCaso, validarDientes, nn, norm, fecha, fechaCorta, hace, hoyISO, diasHasta, uid, comprimirImagen, protosAbiertos, casoMarkdown, descargar, esCritico } from '../logic.js';
import { useApp } from '../ctx.js';
import { Ic, Pill, EstadoPill, Btn, Field, Seg, Foto, Vacio, Chequeo, Aviso, PageHead, Avatar, inputCls, inputErr, cx } from '../ui.jsx';

const ESTADOS_PASO = [
  { v: 'hecho', t: 'Hecho', tono: 'ok' },
  { v: 'modificado', t: 'Modificado', tono: 'warn' },
  { v: 'omitido', t: 'Omitido', tono: 'bad' },
  { v: 'noaplica', t: 'No aplica' }
];
const TXT_PASO = { hecho: 'Hecho', modificado: 'Modificado', omitido: 'Omitido', noaplica: 'No aplica', pendiente: 'Sin marcar' };
const TONO_PASO = { hecho: 'ok', modificado: 'warn', omitido: 'bad', noaplica: 'neutro', pendiente: 'neutro' };

export function casoVacio(preset = {}) {
  return {
    id: uid(), ejemplo: false, estado: 'borrador', autor: { id: 'yo', nombre: 'Tú', rol: '' },
    titulo: '', dientes: '', especialidad: preset.especialidad || 'Rehabilitación oral',
    paciente: { iniciales: '', edad: '', sexo: '' }, protocoloId: preset.protocoloId || '',
    diagnostico: '', procedimiento: '', pasos: {}, evidencia: '', consentimiento: false, fotos: [],
    sesiones: [], revisiones: [], historial: [], creado: new Date().toISOString(), actualizado: new Date().toISOString(), nuevo: true
  };
}

/* ─────────────── tarjeta de revisión (veredicto) ─────────────── */
export function TarjetaRevision({ r }) {
  const { verPerfil } = useApp();
  const e = ESTADOS[r.veredicto];
  const borde = { ok: 'border-ok', warn: 'border-warn', bad: 'border-bad' }[e.tono] || 'border-line';
  return (
    <article className={cx('rounded-r border-2 bg-card p-5', borde)}>
      <div className="flex flex-wrap items-center gap-3">
        <Avatar nombre={r.revisor.nombre} verificado={r.revisor.verificado} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[14px] font-semibold text-ink">{r.revisor.id ? <button type="button" onClick={() => verPerfil(r.revisor.id)} className="text-left hover:underline">{r.revisor.nombre}</button> : r.revisor.nombre}{r.revisor.verificado && <span className="text-ok" title="Verificado">✓</span>}{r.revisor.demo && <Pill>revisor de prueba</Pill>}</div>
          <div className="text-[12px] text-ink3">Revisor · {r.revisor.area || 'área sin indicar'} · {fecha(r.fecha)}</div>
        </div>
        <EstadoPill estado={r.veredicto} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {CRITERIOS.map((k) => (
          <div key={k.k} className="rounded-rs bg-soft px-3 py-2">
            <div className="text-[11px] leading-tight text-ink3">{k.t}</div>
            <div className="mt-1 flex items-center gap-1" aria-label={r.puntajes[k.k] + ' de 5'}>
              {[1, 2, 3, 4, 5].map((n) => <span key={n} className={cx('h-1.5 flex-1 rounded-full', n <= r.puntajes[k.k] ? 'bg-acento' : 'bg-line')} />)}
              <b className="ml-1.5 text-[12px] tabular-nums text-ink">{r.puntajes[k.k]}</b>
            </div>
          </div>
        ))}
      </div>
      {r.motivos && r.motivos.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{r.motivos.map((m) => <Pill key={m} tono={e.tono === 'bad' ? 'bad' : 'warn'}>{m}</Pill>)}</div>}
      <p className="m-0 mt-3 font-serif text-[15px] leading-relaxed text-ink">{r.justificacion}</p>
    </article>
  );
}

/* ─────────────── lista ─────────────── */
function TarjetaCaso({ c }) {
  const { abrirCaso } = useApp();
  const foto = (c.fotos || [])[0];
  const proto = c.protocoloId && DATOS[c.protocoloId];
  const prox = (c.sesiones || []).map((s) => s.proximo).filter(Boolean).sort().filter((p) => diasHasta(p) >= -14)[0];
  const ch = chequeoCaso(c);
  return (
    <button type="button" onClick={() => abrirCaso(c.id)} className="flex min-w-0 flex-col overflow-hidden tarjeta text-left transition-shadow hover:shadow-shlg">
      <div className={cx('relative w-full border-b border-line bg-soft', foto ? 'aspect-[16/10]' : 'h-16 sm:aspect-[16/10] sm:h-auto')}>
        {foto ? <img src={foto.url || foto.data} alt={foto.tipo} className="absolute inset-0 h-full w-full object-contain p-2" />
          : <div className="absolute inset-0 grid place-items-center text-ink3"><span className="flex items-center gap-2 text-[12px] sm:flex-col sm:gap-1.5"><Ic n="image" s={20} />Sin fotos</span></div>}
        {(c.fotos || []).length > 1 && <span className="absolute bottom-2 right-2 rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold tabular-nums text-ink2 shadow-sh">{c.fotos.length} fotos</span>}
        {c.ejemplo && <span className="absolute left-2 top-2 rounded-full bg-card px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[.04em] text-ink3 shadow-sh">Ejemplo</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5"><EstadoPill estado={c.estado} /><Pill>{c.dientes || 'sin diente'}</Pill></div>
        <h3 className="m-0 text-[15.5px] font-bold leading-snug text-deep">{c.titulo || 'Caso sin título'}</h3>
        <p className="m-0 line-clamp-2 text-[13px] leading-normal text-ink2">{proto ? proto.titulo : 'Sin protocolo de la biblioteca'}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 text-[11.5px] text-ink3">
          <span>{prox ? 'Control ' + fechaCorta(prox + 'T12:00:00') : 'Actualizado ' + hace(c.actualizado)}</span>
          {(c.estado === 'borrador' || c.estado === 'cambios') && ch.bloqueaEnvio.length > 0 && <span className="font-semibold text-warn">{ch.bloqueaEnvio.length} pendiente{ch.bloqueaEnvio.length > 1 ? 's' : ''}</span>}
        </div>
      </div>
    </button>
  );
}

export function CasosLista() {
  const { casos, nuevoCaso, filtroCasos, setFiltroCasos, quitarEjemplos, perfil, myUid } = useApp();
  const [q, setQ] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const mios = casos.filter((c) => c.autorUid === myUid || c.autor?.id === myUid);
  const cuenta = (e) => mios.filter((c) => c.estado === e).length;
  const nq = norm(q);
  const lista = mios.filter((c) => (filtroCasos === 'todos' || c.estado === filtroCasos) && (!nq || norm(c.titulo + ' ' + c.dientes + ' ' + c.diagnostico + ' ' + c.paciente.iniciales).includes(nq)))
    .sort((a, b) => b.actualizado.localeCompare(a.actualizado));
  const hayEjemplos = casos.some((c) => c.ejemplo);
  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow="Criterium · casos clínicos" titulo="Mis casos" acciones={<Btn v="primary" icon="plus" onClick={() => nuevoCaso()}>Nuevo caso</Btn>}>
        Registra lo que haces en el box, compáralo paso a paso con el protocolo y envíalo a revisión. Las fotos se guardan completas, sin recortes.
      </PageHead>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Seg className="-mx-4 flex-nowrap overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0" valor={filtroCasos} onChange={setFiltroCasos} opciones={[
          { v: 'todos', t: 'Todos', n: mios.length }, { v: 'borrador', t: 'Borradores', n: cuenta('borrador') }, { v: 'enviado', t: 'En revisión', n: cuenta('enviado') },
          { v: 'cambios', t: 'Cambios pedidos', n: cuenta('cambios') }, { v: 'aprobado', t: 'Aprobados', n: cuenta('aprobado') }, { v: 'denegado', t: 'Denegados', n: cuenta('denegado') }
        ]} />
        <label className="flex w-full items-center gap-2 rounded-full border border-line bg-card px-4 focus-within:border-acento lg:max-w-[300px]">
          <Ic n="search" s={15} className="text-ink3" />
          <input id="buscar-casos" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Diente, paciente, diagnóstico…" aria-label="Buscar en mis casos" className="min-w-0 flex-1 bg-transparent py-2 text-[13.5px] text-ink outline-none placeholder:text-ink3" />
        </label>
      </div>
      {lista.length === 0 ? (
        <Vacio titulo={mios.length ? 'Ningún caso coincide' : 'Todavía no registras casos'}
          accion={<Btn v="primary" icon="plus" onClick={() => nuevoCaso()}>Nuevo caso</Btn>}>
          {mios.length ? 'Prueba con otro filtro o con otra búsqueda.' : 'Un caso junta los datos del paciente sin identificarlo, las fotos y cómo seguiste el protocolo.'}
        </Vacio>
      ) : <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">{lista.map((c) => <TarjetaCaso key={c.id} c={c} />)}</div>}
      {hayEjemplos && (
        <div className="flex flex-wrap items-center gap-3 rounded-rs bg-soft px-4 py-3 text-[12.5px] text-ink2">
          <span>Los casos marcados como ejemplo muestran cómo funciona la app. No son datos tuyos.</span>
          {confirmar ? <span className="flex gap-2"><Btn sm v="danger" onClick={() => { quitarEjemplos(); setConfirmar(false); }}>Sí, quitarlos</Btn><Btn sm onClick={() => setConfirmar(false)}>Cancelar</Btn></span>
            : <Btn sm onClick={() => setConfirmar(true)}>Quitar ejemplos</Btn>}
        </div>
      )}
      <p className="m-0 text-[11.5px] leading-relaxed text-ink3">Tus casos se guardan solo en este navegador. No salen de este equipo ni los ve nadie más.</p>
    </div>
  );
}

/* ─────────────── subir fotos ─────────────── */
function SubirFotos({ onAdd, tipoSugerido = 'Inicial', compacto }) {
  const ref = useRef(null);
  const { avisar } = useApp();
  const [tipo, setTipo] = useState(tipoSugerido);
  const [cargando, setCargando] = useState(false);
  const [sobre, setSobre] = useState(false);
  const procesar = async (files) => {
    const arr = Array.from(files || []); if (!arr.length) return;
    setCargando(true);
    const ok = [];
    for (const f of arr) {
      try { const r = await comprimirImagen(f); ok.push({ id: uid(), tipo, nota: '', data: r.data, w: r.w, h: r.h, fecha: new Date().toISOString() }); }
      catch (e) { avisar(e.message, 'warn'); }
    }
    setCargando(false);
    if (ok.length) { onAdd(ok); avisar(ok.length === 1 ? 'Foto agregada' : ok.length + ' fotos agregadas'); }
    if (ref.current) ref.current.value = '';
  };
  return (
    <div onDragOver={(e) => { e.preventDefault(); setSobre(true); }} onDragLeave={() => setSobre(false)}
      onDrop={(e) => { e.preventDefault(); setSobre(false); procesar(e.dataTransfer.files); }}
      className={cx('flex flex-col gap-3 rounded-r border-2 border-dashed p-4 transition-colors sm:flex-row sm:items-center', sobre ? 'border-acento bg-acentosoft' : 'border-line bg-bg', compacto && 'p-3')}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="grid h-10 w-10 flex-none place-items-center rounded-full bg-acentosoft text-acentodeep"><Ic n="camera" s={19} /></div>
        <div className="min-w-0 text-[13px] leading-snug text-ink2"><b className="block text-ink">{cargando ? 'Procesando fotos…' : 'Arrastra fotos aquí o elige archivos'}</b>JPG o PNG. Se guardan completas, reducidas a 1600 px.</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select id="tipo-foto-nueva" value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo de foto" className={cx(inputCls, '!w-auto !py-2 !text-[13px]')}>
          {TIPOS_FOTO.map((t) => <option key={t}>{t}</option>)}
        </select>
        <Btn v="soft" icon="plus" disabled={cargando} onClick={() => ref.current && ref.current.click()}>Elegir fotos</Btn>
        <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => procesar(e.target.files)} />
      </div>
    </div>
  );
}

/* ─────────────── editor ─────────────── */
export function CasoEditor() {
  const { editando, guardarCaso, enviarCaso, go, abrirCaso, avisar, casos } = useApp();
  const [c, setC] = useState(() => JSON.parse(JSON.stringify(editando)));
  const [intentoEnvio, setIntentoEnvio] = useState(false);
  const [errTitulo, setErrTitulo] = useState('');
  const set = (k, v) => setC((x) => ({ ...x, [k]: v }));
  const setPac = (k, v) => setC((x) => ({ ...x, paciente: { ...x.paciente, [k]: v } }));
  const setPaso = (i, patch) => setC((x) => ({ ...x, pasos: { ...x.pasos, [i]: { ...(x.pasos[i] || {}), ...patch } } }));
  const d = c.protocoloId ? DATOS[c.protocoloId] : null;
  const ch = chequeoCaso(c);
  const errD = c.dientes ? validarDientes(c.dientes) : '';
  const mostrar = (cond) => intentoEnvio && cond;
  const esNuevo = !casos.some((x) => x.id === c.id);

  const guardar = () => {
    if (!c.titulo || c.titulo.trim().length < 4) { setErrTitulo('Ponle un título de al menos 4 letras para guardar.'); document.getElementById('caso-titulo')?.focus(); return; }
    const { nuevo, ...limpio } = c;
    guardarCaso(limpio);
    avisar(esNuevo ? 'Caso guardado como borrador' : 'Cambios guardados');
    abrirCaso(c.id);
  };
  const enviar = () => {
    setIntentoEnvio(true);
    if (!ch.puedeEnviar) { avisar('Faltan ' + ch.bloqueaEnvio.length + ' cosas antes de enviar. Revisa la lista.', 'warn'); return; }
    const { nuevo, ...limpio } = c;
    guardarCaso(limpio);
    enviarCaso(c.id, limpio);
    abrirCaso(c.id);
  };
  const marcarTodo = () => setC((x) => { const p = { ...x.pasos }; d.pasos.forEach((s, i) => { if (!p[i] || !p[i].estado) p[i] = { estado: 'hecho' }; }); return { ...x, pasos: p }; });

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-7">
        <div>
          <button type="button" onClick={() => esNuevo ? go('casos') : abrirCaso(c.id)} className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] text-ink2 hover:bg-soft"><Ic n="back" s={14} />{esNuevo ? 'Mis casos' : 'Volver al caso'}</button>
          <PageHead eyebrow={esNuevo ? 'Nuevo caso' : 'Editar caso'} titulo={c.titulo || 'Caso sin título'}>
            Nada de lo que escribas aquí debe identificar al paciente: usa iniciales y edad.
          </PageHead>
          {c.estado === 'cambios' && c.revisiones.length > 0 && (
            <div className="mt-5"><Aviso tono="warn">El revisor pidió cambios. Corrige lo que indica y vuelve a enviar.</Aviso><div className="mt-3"><TarjetaRevision r={c.revisiones[c.revisiones.length - 1]} /></div></div>
          )}
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Título del caso" id="caso-titulo" error={errTitulo} className="sm:col-span-2">
            <input id="caso-titulo" value={c.titulo} onChange={(e) => { set('titulo', e.target.value); setErrTitulo(''); }} placeholder="Ej.: Resina clase I oclusal en 3.6" className={cx(inputCls, errTitulo && inputErr)} />
          </Field>
          <Field label="Diente(s) · notación FDI" id="caso-dientes" error={c.dientes ? errD : (intentoEnvio ? 'Indica el diente.' : '')} hint="Separa con coma si son varios: 1.6, 1.7">
            <input id="caso-dientes" value={c.dientes} onChange={(e) => set('dientes', e.target.value)} placeholder="3.6" inputMode="decimal" className={cx(inputCls, (errD || (intentoEnvio && !c.dientes)) && inputErr)} />
          </Field>
          <Field label="Especialidad" id="caso-esp">
            <select id="caso-esp" value={c.especialidad} onChange={(e) => set('especialidad', e.target.value)} className={inputCls}>
              {ESPECIALIDADES_CASO.map((e) => <option key={e}>{e}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-3 gap-3 sm:col-span-2">
            <Field label="Iniciales" id="pac-ini"><input id="pac-ini" value={c.paciente.iniciales} onChange={(e) => setPac('iniciales', e.target.value.slice(0, 8))} placeholder="R. P." className={inputCls} /></Field>
            <Field label="Edad" id="pac-edad"><input id="pac-edad" type="number" min="1" max="110" value={c.paciente.edad} onChange={(e) => setPac('edad', e.target.value)} placeholder="34" className={inputCls} /></Field>
            <Field label="Sexo" id="pac-sexo">
              <select id="pac-sexo" value={c.paciente.sexo} onChange={(e) => setPac('sexo', e.target.value)} className={inputCls}>
                <option value="">—</option><option>Femenino</option><option>Masculino</option><option>Otro</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="grid gap-4">
          <Field label="Diagnóstico" id="caso-dx" error={mostrar(c.diagnostico.trim().length < 10) ? 'Escribe el diagnóstico en al menos una frase.' : ''} hint="Qué tiene, cómo lo confirmaste (clínica, pruebas, radiografía).">
            <textarea id="caso-dx" rows={3} value={c.diagnostico} onChange={(e) => set('diagnostico', e.target.value)} placeholder="Caries oclusal primaria cavitada en 3.6, vital y asintomático…" className={cx(inputCls, 'resize-y leading-relaxed', mostrar(c.diagnostico.trim().length < 10) && inputErr)} />
          </Field>
          <Field label="Procedimiento realizado" id="caso-proc" error={mostrar(c.procedimiento.trim().length < 10) ? 'Describe qué hiciste.' : ''}>
            <textarea id="caso-proc" rows={3} value={c.procedimiento} onChange={(e) => set('procedimiento', e.target.value)} placeholder="Materiales, técnica y cualquier decisión que tomaste en el momento." className={cx(inputCls, 'resize-y leading-relaxed', mostrar(c.procedimiento.trim().length < 10) && inputErr)} />
          </Field>
        </section>

        <section className="flex flex-col gap-4">
          <Field label="Protocolo que seguiste" id="caso-proto" hint="El revisor compara tu caso contra los pasos y la evidencia de este protocolo.">
            <select id="caso-proto" value={c.protocoloId} onChange={(e) => { const v = e.target.value; setC((x) => ({ ...x, protocoloId: v, pasos: {} })); }} className={inputCls}>
              <option value="">Sin protocolo de la biblioteca</option>
              {protosAbiertos().map((p) => <option key={p.id} value={p.id}>{p.t}</option>)}
            </select>
          </Field>
          {d && (
            <div className="tarjeta">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line2 px-4 py-3">
                <h3 className="m-0 text-[13.5px] font-bold text-deep">¿Cómo seguiste cada paso?</h3>
                <Btn sm v="ghost" icon="check" onClick={marcarTodo}>Marcar los pendientes como hechos</Btn>
              </div>
              <ol className="m-0 list-none p-0">
                {d.pasos.map((s, i) => {
                  const r = c.pasos[i] || {};
                  const pide = r.estado === 'modificado' || r.estado === 'omitido' || (r.estado === 'noaplica' && !s.cond);
                  const falta = pide && (r.nota || '').trim().length < 8;
                  return (
                    <li key={i} className={cx('flex flex-col gap-2.5 border-b border-line2 px-4 py-3.5 last:border-0', mostrar(!r.estado) && 'bg-badsoft')}>
                      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                        <span className="text-[12px] font-bold tabular-nums text-ink3">{nn(i)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] font-semibold leading-snug text-ink">{s.corto}</div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {s.marca && <Pill tono={esCritico(s) ? 'bad' : 'warn'}>{s.marca}</Pill>}
                            {s.cond && <span className="text-[11.5px] leading-snug text-acentodeep">{s.cond}</span>}
                          </div>
                        </div>
                      </div>
                      <Seg size="sm" valor={r.estado} onChange={(v) => setPaso(i, { estado: v })} opciones={ESTADOS_PASO} />
                      {pide && (
                        <Field id={'nota-' + i} error={intentoEnvio && falta ? 'Justifica el cambio: qué hiciste distinto y por qué.' : ''}>
                          <input id={'nota-' + i} value={r.nota || ''} onChange={(e) => setPaso(i, { nota: e.target.value })}
                            placeholder={r.estado === 'noaplica' ? '¿Por qué no aplica en este caso?' : 'Qué hiciste distinto y por qué. Si te apoyas en evidencia, cítala.'}
                            className={cx(inputCls, '!py-2 !text-[13.5px]', intentoEnvio && falta && inputErr)} />
                        </Field>
                      )}
                      {r.estado === 'omitido' && esCritico(s) && <p className="m-0 text-[12px] font-semibold text-bad">Paso crítico: si lo omites, el caso no se puede aprobar.</p>}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
          <Field label={d ? 'Evidencia adicional (opcional)' : 'Evidencia en que te apoyas'} id="caso-ev"
            error={!d && mostrar((c.evidencia || '').trim().length < 20) ? 'Sin protocolo, tienes que declarar la evidencia: guía, revisión o estudio, con autor y año.' : ''}
            hint={d ? 'Si tomaste una decisión fuera del protocolo, pon aquí la referencia.' : 'Autor, año y tipo de estudio. El revisor lo comprueba.'}>
            <textarea id="caso-ev" rows={3} value={c.evidencia} onChange={(e) => set('evidencia', e.target.value)} placeholder="Ej.: Guía EFP S3 de periodontitis estadio I–III, 2020." className={cx(inputCls, 'resize-y leading-relaxed')} />
          </Field>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Fotos y radiografías</h2>
          <SubirFotos tipoSugerido={c.fotos.length ? 'Progreso' : 'Inicial'} onAdd={(nuevas) => setC((x) => ({ ...x, fotos: [...x.fotos, ...nuevas] }))} />
          {c.fotos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {c.fotos.map((f) => (
                <div key={f.id} className="flex flex-col gap-2 rounded-rs border border-cardline bg-card shadow-sh p-2">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[8px] bg-soft"><img src={f.data} alt={f.tipo} className="absolute inset-0 h-full w-full object-contain" /></div>
                  <select value={f.tipo} onChange={(e) => setC((x) => ({ ...x, fotos: x.fotos.map((y) => y.id === f.id ? { ...y, tipo: e.target.value } : y) }))} aria-label="Tipo de foto" className={cx(inputCls, '!py-1.5 !text-[12.5px]')}>
                    {TIPOS_FOTO.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <input value={f.nota} onChange={(e) => setC((x) => ({ ...x, fotos: x.fotos.map((y) => y.id === f.id ? { ...y, nota: e.target.value } : y) }))} placeholder="Nota (opcional)" aria-label="Nota de la foto" className={cx(inputCls, '!py-1.5 !text-[12.5px]')} />
                  <Btn sm v="dangerOutline" icon="trash" onClick={() => setC((x) => ({ ...x, fotos: x.fotos.filter((y) => y.id !== f.id) }))}>Quitar</Btn>
                </div>
              ))}
            </div>
          )}
        </section>

        <label className={cx('flex items-start gap-3 rounded-r border bg-card p-4 text-[13.5px] leading-relaxed text-ink2', mostrar(!c.consentimiento) ? 'border-bad' : 'border-line')}>
          <input type="checkbox" checked={c.consentimiento} onChange={(e) => set('consentimiento', e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--acento)]" />
          <span><b className="text-ink">El paciente consintió</b> que se usen sus datos e imágenes, sin identificarlo, para revisión clínica. Las fotos no muestran su cara ni datos personales.</span>
        </label>
      </div>

      <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-[76px]">
        <Chequeo ch={ch} titulo="Antes de enviar" compacto />
        <div className="flex flex-col gap-2 tarjeta p-4">
          <Btn v="primary" icon="send" onClick={enviar}>{c.estado === 'cambios' ? 'Guardar y reenviar a revisión' : 'Guardar y enviar a revisión'}</Btn>
          <Btn onClick={guardar}>Guardar borrador</Btn>
          {intentoEnvio && !ch.puedeEnviar && <p className="m-0 text-[12px] leading-snug text-bad">Corrige lo marcado como “Bloquea” para poder enviar.</p>}
          <p className="m-0 text-[11.5px] leading-snug text-ink3">El borrador solo pide un título. Para enviar a revisión tiene que pasar el chequeo.</p>
        </div>
      </aside>
    </div>
  );
}

/* ─────────────── detalle ─────────────── */
export function Adherencia({ c }) {
  const d = c.protocoloId ? DATOS[c.protocoloId] : null;
  const { abrirProto } = useApp();
  if (!d) return <p className="m-0 text-[13.5px] text-ink2">Este caso no se apoya en un protocolo de la biblioteca.</p>;
  const cuenta = {}; d.pasos.forEach((s, i) => { const e = ((c.pasos || {})[i] || {}).estado || 'pendiente'; cuenta[e] = (cuenta[e] || 0) + 1; });
  return (
    <div className="tarjeta">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line2 px-4 py-3">
        <button type="button" onClick={() => abrirProto(c.protocoloId)} className="min-w-0 text-left text-[13.5px] font-bold text-acentodeep hover:underline">{d.titulo}</button>
        <div className="flex flex-wrap gap-1.5">{Object.keys(cuenta).map((k) => <Pill key={k} tono={TONO_PASO[k]}>{cuenta[k]} {TXT_PASO[k].toLowerCase()}</Pill>)}</div>
      </div>
      <ol className="m-0 list-none p-0">
        {d.pasos.map((s, i) => {
          const r = (c.pasos || {})[i] || {}; const e = r.estado || 'pendiente';
          return (
            <li key={i} className="grid grid-cols-[26px_minmax(0,1fr)] gap-2 border-b border-line2 px-4 py-2.5 last:border-0 sm:grid-cols-[26px_minmax(0,1fr)_auto]">
              <span className="pt-0.5 text-[12px] font-bold tabular-nums text-ink3">{nn(i)}</span>
              <div className="min-w-0">
                <div className="text-[13.5px] leading-snug text-ink">{s.corto}{s.marca && <span className={cx('ml-2 text-[11px] font-semibold', esCritico(s) ? 'text-bad' : 'text-warn')}>{s.marca}</span>}</div>
                {r.nota && <div className="mt-1 font-serif text-[13.5px] leading-snug text-ink2">“{r.nota}”</div>}
              </div>
              <div className="col-start-2 sm:col-start-auto"><Pill tono={TONO_PASO[e]}>{TXT_PASO[e]}</Pill></div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function Galeria({ c, puedeAgregar, onAdd }) {
  const { verFoto } = useApp();
  const fotos = c.fotos || [];
  const grupos = TIPOS_FOTO.map((t) => ({ t, l: fotos.filter((f) => f.tipo === t) })).filter((g) => g.l.length);
  return (
    <div className="flex flex-col gap-4">
      {fotos.length === 0 && <p className="m-0 text-[13.5px] text-ink3">Sin fotos ni radiografías.</p>}
      {grupos.map((g) => (
        <div key={g.t}>
          <h4 className="m-0 mb-2 text-[11.5px] font-bold uppercase tracking-[.04em] text-acentodeep">{g.t} · {g.l.length}</h4>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {g.l.map((f) => <Foto key={f.id} foto={f} onOpen={() => verFoto(f)}>{f.postEnvio && <span className="flex-none font-semibold text-warn">después del envío</span>}</Foto>)}
          </div>
        </div>
      ))}
      {puedeAgregar && <SubirFotos compacto tipoSugerido={fotos.length ? 'Progreso' : 'Inicial'} onAdd={onAdd} />}
    </div>
  );
}

function Sesiones({ c, onAdd, onDel, editable }) {
  const [f, setF] = useState({ fecha: hoyISO(), txt: '', proximo: '' });
  const [err, setErr] = useState('');
  const agregar = (e) => {
    e.preventDefault();
    if (f.txt.trim().length < 3) { setErr('Escribe qué se hizo en la sesión.'); return; }
    if (f.proximo && f.proximo < f.fecha) { setErr('El próximo control no puede ser antes de la sesión.'); return; }
    onAdd({ id: uid(), ...f, txt: f.txt.trim() }); setF({ fecha: hoyISO(), txt: '', proximo: '' }); setErr('');
  };
  const lista = [...(c.sesiones || [])].sort((a, b) => b.fecha.localeCompare(a.fecha));
  return (
    <div className="flex flex-col gap-3">
      {editable && (
        <form onSubmit={agregar} className="flex flex-col gap-2.5 tarjeta p-4">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Fecha" id="ses-fecha"><input id="ses-fecha" type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} className={cx(inputCls, '!py-2 !text-[13px]')} /></Field>
            <Field label="Próximo control" id="ses-prox"><input id="ses-prox" type="date" value={f.proximo} min={f.fecha} onChange={(e) => setF({ ...f, proximo: e.target.value })} className={cx(inputCls, '!py-2 !text-[13px]')} /></Field>
          </div>
          <Field id="ses-txt" error={err}>
            <input id="ses-txt" value={f.txt} onChange={(e) => { setF({ ...f, txt: e.target.value }); setErr(''); }} placeholder="Qué se hizo en esta sesión" aria-label="Qué se hizo en esta sesión" className={cx(inputCls, '!py-2 !text-[13.5px]', err && inputErr)} />
          </Field>
          <Btn v="soft" sm icon="plus" type="submit" onClick={agregar}>Agregar sesión</Btn>
        </form>
      )}
      {lista.length === 0 ? <p className="m-0 text-[13px] text-ink3">Sin sesiones registradas.</p> : (
        <ol className="m-0 flex list-none flex-col p-0">
          {lista.map((s) => (
            <li key={s.id} className="relative grid grid-cols-[14px_minmax(0,1fr)] gap-3 pb-3.5 last:pb-0">
              <span className="relative mt-1.5 h-2.5 w-2.5 rounded-full bg-acento" />
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <b className="text-[12.5px] tabular-nums text-ink">{fecha(s.fecha + 'T12:00:00')}</b>
                  {editable && <button type="button" onClick={() => onDel(s.id)} className="text-[11.5px] text-ink3 hover:text-bad" aria-label="Borrar sesión">Borrar</button>}
                </div>
                <div className="text-[13.5px] leading-snug text-ink2">{s.txt}</div>
                {s.proximo && <div className={cx('mt-0.5 text-[12px] font-semibold', diasHasta(s.proximo) < 0 ? 'text-bad' : 'text-acentodeep')}>Próximo control: {fecha(s.proximo + 'T12:00:00')}</div>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function CasoDetalle() {
  const { casos, casoId, go, editarCaso, enviarCaso, retirarCaso, eliminarCaso, duplicarCaso, actualizarCaso, avisar, desde, myUid } = useApp();
  const c = casos.find((x) => x.id === casoId);
  const [confirmar, setConfirmar] = useState(false);
  if (!c) return <Vacio titulo="Este caso ya no existe" accion={<Btn onClick={() => go('casos')}>Volver a Mis casos</Btn>}>Puede que lo hayas eliminado.</Vacio>;
  const mio = c.autorUid === myUid || c.autor?.id === myUid;
  const ch = chequeoCaso(c);
  const editable = mio && (c.estado === 'borrador' || c.estado === 'cambios');
  const ultima = c.revisiones && c.revisiones.length ? c.revisiones[c.revisiones.length - 1] : null;
  const exportar = () => descargar('caso-' + (c.dientes || 'sin-diente').replace(/[^0-9a-z]+/gi, '-') + '.md', new Blob([casoMarkdown(c)], { type: 'text/markdown' }), avisar);
  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-7">
        <div>
          <button type="button" onClick={() => go(desde === 'revision' ? 'revision' : 'casos')} className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] text-ink2 hover:bg-soft"><Ic n="back" s={14} />{desde === 'revision' ? 'Revisión' : 'Mis casos'}</button>
          <header className="flex flex-col gap-4 border-b border-line pb-5">
            <div className="flex flex-wrap items-center gap-1.5"><EstadoPill estado={c.estado} />{c.ejemplo && <Pill>Ejemplo</Pill>}<Pill>{c.dientes}</Pill><Pill>{c.especialidad}</Pill></div>
            <h1 className="m-0 text-[26px] font-extrabold leading-[1.12] tracking-[-.03em] text-deep [text-wrap:balance] sm:text-[32px]">{c.titulo}</h1>
            <p className="m-0 text-[13px] text-ink3">
              {mio ? 'Tu caso' : 'Caso de ' + c.autor.nombre + (c.autor.rol ? ' · ' + c.autor.rol : '')} · Paciente {[c.paciente.iniciales, c.paciente.edad && c.paciente.edad + ' años', c.paciente.sexo].filter(Boolean).join(', ') || 'sin datos'} · actualizado {hace(c.actualizado)}
            </p>
            {mio && (
              <div className="flex flex-wrap gap-2">
                {editable && <Btn v="primary" icon="send" disabled={!ch.puedeEnviar} onClick={() => enviarCaso(c.id)} title={ch.puedeEnviar ? '' : 'Resuelve lo que bloquea el envío'}>{c.estado === 'cambios' ? 'Reenviar a revisión' : 'Enviar a revisión'}</Btn>}
                {editable && <Btn icon="edit" onClick={() => editarCaso(c.id)}>Editar</Btn>}
                {c.estado === 'enviado' && <Btn onClick={() => retirarCaso(c.id)}>Retirar de revisión</Btn>}
                {(c.estado === 'aprobado' || c.estado === 'denegado') && <Btn icon="copy" onClick={() => duplicarCaso(c.id)}>Duplicar como caso nuevo</Btn>}
                <Btn icon="download" onClick={exportar}>Exportar</Btn>
                {confirmar ? (
                  <span className="flex flex-wrap items-center gap-2 rounded-full bg-badsoft py-1 pl-3 pr-1 text-[12.5px] font-semibold text-bad">¿Eliminar el caso y sus fotos?
                    <Btn sm v="danger" onClick={() => eliminarCaso(c.id)}>Eliminar</Btn><Btn sm onClick={() => setConfirmar(false)}>Cancelar</Btn></span>
                ) : <Btn v="dangerOutline" icon="trash" onClick={() => setConfirmar(true)}>Eliminar</Btn>}
              </div>
            )}
            {editable && !ch.puedeEnviar && <p className="m-0 text-[12.5px] text-warn">Para enviar a revisión faltan {ch.bloqueaEnvio.length} cosa{ch.bloqueaEnvio.length > 1 ? 's' : ''}. Están en el chequeo de la derecha.</p>}
            {c.estado === 'enviado' && mio && <Aviso tono="acento">En revisión. Mientras tanto no se puede editar, pero puedes agregar fotos y sesiones.</Aviso>}
          </header>
        </div>

        {ultima && (
          <section className="flex flex-col gap-3">
            <h2 className="m-0 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">{c.revisiones.length > 1 ? 'Última revisión · ' + c.revisiones.length + ' en total' : 'Revisión'}</h2>
            <TarjetaRevision r={ultima} />
            {c.revisiones.length > 1 && (
              <details className="tarjeta px-4 py-3">
                <summary className="text-[12.5px] font-semibold text-acentodeep">Ver revisiones anteriores</summary>
                <div className="flex flex-col gap-3 pt-3">{c.revisiones.slice(0, -1).reverse().map((r) => <TarjetaRevision key={r.id} r={r} />)}</div>
              </details>
            )}
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="tarjeta p-5">
            <h2 className="m-0 mb-2 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Diagnóstico</h2>
            <p className="m-0 font-serif text-[15px] leading-relaxed text-ink">{c.diagnostico || <span className="text-ink3">Sin completar.</span>}</p>
          </div>
          <div className="tarjeta p-5">
            <h2 className="m-0 mb-2 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Procedimiento</h2>
            <p className="m-0 font-serif text-[15px] leading-relaxed text-ink">{c.procedimiento || <span className="text-ink3">Sin completar.</span>}</p>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Adherencia al protocolo</h2>
          <Adherencia c={c} />
          {c.evidencia && <div className="rounded-r bg-soft p-4"><h3 className="m-0 mb-1.5 text-[12px] font-bold text-ink2">Evidencia declarada por el autor</h3><p className="m-0 font-serif text-[14.5px] leading-relaxed text-ink">{c.evidencia}</p></div>}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Fotos y radiografías</h2>
          <Galeria c={c} puedeAgregar={mio && c.estado !== 'denegado'}
            onAdd={(nuevas) => actualizarCaso(c.id, (x) => ({ ...x, fotos: [...x.fotos, ...nuevas.map((f) => ({ ...f, postEnvio: x.estado !== 'borrador' }))] }))} />
        </section>
      </div>

      <aside className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-[76px]">
        <Chequeo ch={ch} />
        <div>
          <h2 className="m-0 mb-2.5 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Sesiones y controles</h2>
          <Sesiones c={c} editable={mio}
            onAdd={(s) => { actualizarCaso(c.id, (x) => ({ ...x, sesiones: [...(x.sesiones || []), s] })); avisar('Sesión agregada'); }}
            onDel={(sid) => actualizarCaso(c.id, (x) => ({ ...x, sesiones: x.sesiones.filter((s) => s.id !== sid) }))} />
        </div>
        <div>
          <h2 className="m-0 mb-2.5 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Historial</h2>
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {[...(c.historial || [])].reverse().map((h, i) => (
              <li key={i} className="grid grid-cols-[84px_minmax(0,1fr)] gap-2 text-[12.5px]"><span className="tabular-nums text-ink3">{fechaCorta(h.fecha)}</span><span className="text-ink2">{h.txt}</span></li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}
