import React, { useState, useEffect } from 'react';
import { DATOS } from '../data.js';
import { CRITERIOS, MOTIVOS, chequeoCaso, esCritico, hace, fecha, cap, errIA, textoProtocolo, casoMarkdown, uid, nn } from '../logic.js';
import { useApp } from '../ctx.js';
import { Ic, Pill, EstadoPill, Btn, Field, Seg, Vacio, Chequeo, Aviso, PageHead, Avatar, inputCls, inputErr, cx } from '../ui.jsx';
import { Adherencia, Galeria, TarjetaRevision } from './casos.jsx';

function Intro() {
  const { go, setModoRevisor, casos, abrirCaso, perfil, myUid } = useApp();
  const mios = casos.filter((c) => (c.autorUid === myUid || c.autor?.id === myUid) && c.estado !== 'borrador');
  const puede = perfil && /Especialista|Docente/.test(perfil.rol || '');
  return (
    <div className="flex flex-col gap-7">
      <PageHead eyebrow="Criterium · revisión por pares" titulo="Revisión de casos">
        Un especialista del área mira tu caso contra el protocolo y la evidencia, puntúa tres criterios y firma un veredicto: aprobado, cambios pedidos o denegado.
      </PageHead>
      <div className="grid gap-3.5 md:grid-cols-3">
        {[
          ['Tres criterios, de 1 a 5', 'Pertinencia de la indicación, claridad del registro y suficiencia de la evidencia de lo que se hizo.'],
          ['Reglas que no se saltan', 'No se aprueba un caso con un paso crítico omitido, un desvío sin justificar o con evidencia puntuada bajo 3.'],
          ['Todo veredicto se justifica', 'Pedir cambios o denegar exige nombrar el motivo. El autor ve la justificación completa y puede corregir.']
        ].map(([t, d]) => (
          <div key={t} className="tarjeta p-5"><h3 className="m-0 mb-1.5 text-[15.5px] font-bold text-deep">{t}</h3><p className="m-0 font-serif text-[14.5px] leading-relaxed text-ink2">{d}</p></div>
        ))}
      </div>
      <div className="flex flex-col gap-4 tarjeta p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-[60ch]">
          <h2 className="m-0 mb-1 text-[16px] font-bold text-deep">{puede ? 'Tu perfil puede revisar' : '¿Eres especialista o docente de clínica?'}</h2>
          <p className="m-0 text-[13.5px] leading-relaxed text-ink2">{puede ? 'Entra al modo revisor para ver la cola de casos pendientes.' : 'Postula a una de las ocho plazas. Mientras tanto puedes probar el flujo completo en modo de prueba, con casos de ejemplo.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn v="primary" icon="stamp" onClick={() => setModoRevisor(true)}>{puede ? 'Entrar como revisor' : 'Probar como revisor'}</Btn>
          {!puede && <Btn icon="userCheck" onClick={() => go('postular')}>Postular a revisor</Btn>}
        </div>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Tus casos enviados</h2>
        {mios.length === 0 ? <p className="m-0 text-[13.5px] text-ink3">Todavía no envías casos a revisión.</p> : (
          <div className="tarjeta">
            {mios.map((c) => (
              <button key={c.id} type="button" onClick={() => abrirCaso(c.id)} className="flex w-full flex-wrap items-center justify-between gap-2 border-b border-line2 px-4 py-3 text-left last:border-0 hover:bg-soft">
                <span className="min-w-0 text-[13.5px] text-ink"><b className="font-semibold">{c.dientes}</b> · {c.titulo}</span>
                <EstadoPill estado={c.estado} />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Cola() {
  const { casos, setRevisando, setModoRevisor, perfil, myUid } = useApp();
  const [tab, setTab] = useState('pendientes');
  const pend = casos.filter((c) => c.estado === 'enviado').sort((a, b) => a.actualizado.localeCompare(b.actualizado));
  const hechas = casos.filter((c) => (c.revisiones || []).some((r) => r.revisor.id === myUid));
  const lista = tab === 'pendientes' ? pend : hechas;
  const verificado = perfil && /Especialista|Docente/.test(perfil.rol || '');
  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow="Modo revisor" titulo="Cola de revisión" acciones={<Btn onClick={() => setModoRevisor(false)}>Salir del modo revisor</Btn>}>
        Los casos más antiguos van primero. Abre uno, compáralo con el protocolo y firma tu veredicto.
      </PageHead>
      {!verificado && <Aviso tono="acento">Estás en modo de prueba. En Criterium real solo revisan especialistas verificados del área del caso.</Aviso>}
      <Seg valor={tab} onChange={setTab} opciones={[{ v: 'pendientes', t: 'Pendientes', n: pend.length }, { v: 'hechas', t: 'Revisadas por ti', n: hechas.length }]} />
      {lista.length === 0 ? (
        <Vacio icon="stamp" titulo={tab === 'pendientes' ? 'No hay casos pendientes' : 'Todavía no revisas casos'}>
          {tab === 'pendientes' ? 'Cuando alguien envíe un caso a revisión aparecerá aquí.' : 'Los casos que firmes quedan listados aquí.'}
        </Vacio>
      ) : (
        <div className="flex flex-col gap-2.5">
          {lista.map((c) => {
            const ch = chequeoCaso(c); const d = c.protocoloId && DATOS[c.protocoloId];
            return (
              <article key={c.id} className="grid items-center gap-3 tarjeta p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5">
                <div className="flex min-w-0 gap-3">
                  <Avatar nombre={(c.autorUid === myUid || c.autor?.id === myUid) ? (perfil && perfil.nombre) || 'Tú' : c.autor?.nombre || c.autorNombre || 'Autor'} />
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <Pill>{c.dientes}</Pill>
                      {tab === 'hechas' && <EstadoPill estado={c.estado} />}
                      {ch.fallas.length > 0 && <Pill tono="bad">{ch.fallas.length} bloquea{ch.fallas.length > 1 ? 'n' : ''}</Pill>}
                      {ch.revisar.length > 0 && <Pill tono="warn">{ch.revisar.length} a revisar</Pill>}
                      {(c.autorUid === myUid || c.autor?.id === myUid) && <Pill tono="acento">Tu caso</Pill>}
                      {c.ejemplo && <Pill>Ejemplo</Pill>}
                    </div>
                    <h3 className="m-0 text-[15.5px] font-bold leading-snug text-deep">{c.titulo}</h3>
                    <p className="m-0 mt-0.5 text-[12.5px] text-ink3">{(c.autorUid === myUid || c.autor?.id === myUid) ? 'Tú' : (c.autor?.nombre || c.autorNombre || 'Autor')}{c.autor?.rol ? ' · ' + c.autor.rol : ''} · {d ? d.titulo : 'sin protocolo'} · enviado {hace(c.actualizado)}</p>
                  </div>
                </div>
                <Btn v={tab === 'pendientes' ? 'primary' : 'outline'} icon={tab === 'pendientes' ? 'stamp' : undefined} onClick={() => setRevisando(c.id)} className="justify-self-start">{tab === 'pendientes' ? 'Revisar' : 'Ver'}</Btn>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Puntaje({ k, valor, onChange, error }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2"><span className="text-[13px] font-semibold text-ink">{k.t}</span><span className="text-[12px] tabular-nums text-ink3">{valor ? valor + ' de 5' : 'sin puntuar'}</span></div>
      <span className="text-[11.5px] leading-snug text-ink3">{k.d}</span>
      <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={k.t}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={valor === n} onClick={() => onChange(n)}
            className={cx('rounded-[9px] border py-1.5 text-[13px] font-bold tabular-nums transition-colors', valor === n ? 'border-acento bg-acento text-onc' : valor && n < valor ? 'border-acento bg-acentosoft text-acentodeep' : cx('bg-card text-ink2 hover:border-acento', error ? 'border-bad' : 'border-line'))}>{n}</button>
        ))}
      </div>
    </div>
  );
}

function FormRevision({ c, ch, onFirmar }) {
  const { avisar } = useApp();
  const [p, setP] = useState({ pertinencia: 0, claridad: 0, evidencia: 0 });
  const [ver, setVer] = useState('');
  const [motivos, setMotivos] = useState([]);
  const [just, setJust] = useState('');
  const [intento, setIntento] = useState(false);
  const [ia, setIa] = useState(null);
  const [iaCargando, setIaCargando] = useState(false);
  const [iaErr, setIaErr] = useState('');
  const [iaOn, setIaOn] = useState(true);
  useEffect(() => { let vivo = true; cap('sample').then((s) => { if (vivo && !s) setIaOn(false); }); return () => { vivo = false; }; }, []);

  const sugeridos = [];
  if (ch.items.some((x) => /paso crítico/.test(x.txt))) sugeridos.push('Paso crítico omitido');
  if (ch.items.some((x) => /sin justificar/.test(x.txt))) sugeridos.push('Desvío del protocolo sin respaldo');
  if (ch.items.some((x) => /registro fotográfico|radiografía/.test(x.txt))) sugeridos.push('Registro incompleto: fotos, radiografía o ficha');

  const razonesNoAprobar = [];
  if (!ch.puedeAprobar) razonesNoAprobar.push('El chequeo tiene ' + ch.fallas.length + ' bloqueo' + (ch.fallas.length > 1 ? 's' : '') + '.');
  if (p.evidencia && p.evidencia < 3) razonesNoAprobar.push('Puntuaste la evidencia bajo 3.');
  const errores = {
    puntajes: CRITERIOS.some((k) => !p[k.k]) ? 'Puntúa los tres criterios.' : '',
    ver: !ver ? 'Elige un veredicto.' : (ver === 'aprobado' && razonesNoAprobar.length ? 'No se puede aprobar: ' + razonesNoAprobar.join(' ') : ''),
    motivos: ver && ver !== 'aprobado' && !motivos.length ? 'Marca al menos un motivo.' : '',
    just: just.trim().length < 40 ? 'Escribe al menos 40 caracteres: qué viste y en qué te apoyas.' : ''
  };
  const valido = !Object.values(errores).some(Boolean);
  const elegir = (v) => {
    setVer(v);
    if (v !== 'aprobado' && !motivos.length && sugeridos.length) setMotivos(sugeridos);
  };
  const firmar = () => {
    setIntento(true);
    if (!valido) { avisar('Falta completar la revisión.', 'warn'); return; }
    onFirmar({ puntajes: p, veredicto: ver, motivos: ver === 'aprobado' ? [] : motivos, justificacion: just.trim() });
  };
  const segunda = async () => {
    setIaErr(''); setIa(null); setIaCargando(true);
    try {
      const sample = await cap('sample');
      if (!sample) { setIaOn(false); setIaCargando(false); return; }
      const instr = [
        'Eres un revisor de Criterium. Evalúas un caso clínico odontológico contra el protocolo de la biblioteca y su evidencia.',
        'Reglas: un paso crítico omitido no se aprueba; un desvío tiene que estar justificado con evidencia del mismo nivel o mayor que la del paso; una revisión de estudios in vitro tiene techo de grado C; lo que no tiene respaldo es práctica habitual, no evidencia.',
        'No inventes referencias, autores ni DOI. Usa solo lo que está en el texto.',
        'Escribe en español simple y breve, para un estudiante. Como máximo seis observaciones, las más importantes.',
        '', 'CASO:', casoMarkdown(c), '', c.protocoloId ? 'PROTOCOLO:\n' + textoProtocolo(c.protocoloId) : 'El caso no usa un protocolo de la biblioteca.', '',
        'Devuelve solo JSON con esta forma exacta:',
        '{"sugerencia": "aprobado | cambios | denegado", "observaciones": [{"paso": "07", "txt": ""}], "resumen": ""}'
      ].join('\n');
      const r = await sample.json(instr, { modelTier: 'default' });
      setIa(r);
    } catch (e) { const m = errIA(e); if (e && e.code === 'not_granted') setIaOn(false); setIaErr(m); }
    setIaCargando(false);
  };
  const sugTxt = { aprobado: 'aprobar', cambios: 'pedir cambios', denegado: 'denegar' };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 tarjeta p-4">
        <h3 className="m-0 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Tu revisión</h3>
        {CRITERIOS.map((k) => <Puntaje key={k.k} k={k} valor={p[k.k]} onChange={(n) => setP({ ...p, [k.k]: n })} error={intento && !p[k.k]} />)}
        {intento && errores.puntajes && <span className="text-[12px] font-medium text-bad">{errores.puntajes}</span>}
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink">Veredicto</span>
          <Seg valor={ver} onChange={elegir} opciones={[{ v: 'aprobado', t: 'Aprobar', tono: 'ok' }, { v: 'cambios', t: 'Pedir cambios', tono: 'warn' }, { v: 'denegado', t: 'Denegar', tono: 'bad' }]} />
          {razonesNoAprobar.length > 0 && <p className="m-0 text-[12px] leading-snug text-ink3">No se puede aprobar: {razonesNoAprobar.join(' ')}</p>}
          {intento && errores.ver && <span className="text-[12px] font-medium text-bad">{errores.ver}</span>}
        </div>
        {ver && ver !== 'aprobado' && (
          <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
            <legend className="mb-1.5 text-[13px] font-semibold text-ink">Motivos</legend>
            {MOTIVOS.map((m) => (
              <label key={m} className="flex cursor-pointer items-start gap-2.5 rounded-[9px] px-1 py-1 text-[13px] leading-snug text-ink2 hover:bg-soft">
                <input type="checkbox" checked={motivos.includes(m)} onChange={() => setMotivos((l) => l.includes(m) ? l.filter((x) => x !== m) : [...l, m])} className="mt-0.5 accent-[var(--acento)]" />
                <span>{m}{sugeridos.includes(m) && <span className="ml-1.5 text-[11px] font-semibold text-acentodeep">sugerido por el chequeo</span>}</span>
              </label>
            ))}
            {intento && errores.motivos && <span className="text-[12px] font-medium text-bad">{errores.motivos}</span>}
          </fieldset>
        )}
        <Field label="Justificación" id="rev-just" error={intento ? errores.just : ''} hint={just.trim().length + ' caracteres · mínimo 40. Di qué viste y en qué evidencia te apoyas.'}>
          <textarea id="rev-just" rows={5} value={just} onChange={(e) => setJust(e.target.value)} placeholder="Ej.: El desvío del paso 07 no está respaldado: el metaanálisis de 2023 es in vitro y tiene techo de grado C…"
            className={cx(inputCls, 'resize-y leading-relaxed', intento && errores.just && inputErr)} />
        </Field>
        <Btn v="primary" icon="stamp" onClick={firmar}>Firmar revisión</Btn>
      </div>

      {iaOn && (
        <div className="flex flex-col gap-3 tarjeta p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="m-0 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Segunda lectura</h3>
            <Btn sm v="soft" icon="sparkle" onClick={segunda} disabled={iaCargando}>{iaCargando ? 'Leyendo…' : ia ? 'Pedir otra' : 'Pedir al asistente'}</Btn>
          </div>
          <p className="m-0 text-[11.5px] leading-snug text-ink3">La hace un modelo de lenguaje con el caso y el protocolo. Sirve para ver lo que una regla fija no ve. La decisión es tuya.</p>
          {iaErr && <Aviso tono="warn">{iaErr}</Aviso>}
          {ia && (
            <div className="flex flex-col gap-2">
              {ia.sugerencia && <div className="text-[13px] text-ink2">Sugiere: <b className="text-ink">{sugTxt[String(ia.sugerencia).trim()] || ia.sugerencia}</b></div>}
              {(ia.observaciones || []).map((o, i) => (
                <div key={i} className="grid grid-cols-[30px_minmax(0,1fr)] gap-2 border-t border-line2 pt-2 text-[13px] leading-snug">
                  <b className="tabular-nums text-acentodeep">{o.paso || '—'}</b><span className="text-ink2">{o.txt}</span>
                </div>
              ))}
              {ia.resumen && <p className="m-0 border-t border-line2 pt-2 font-serif text-[14px] leading-relaxed text-ink">{ia.resumen}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PantallaRevision() {
  const { casos, revisando, setRevisando, firmarRevision, perfil, postulacion, myUid } = useApp();
  const c = casos.find((x) => x.id === revisando);
  if (!c) return <Vacio titulo="Este caso ya no está en la cola" accion={<Btn onClick={() => setRevisando(null)}>Volver a la cola</Btn>} />;
  const ch = chequeoCaso(c);
  const d = c.protocoloId && DATOS[c.protocoloId];
  const pendiente = c.estado === 'enviado';
  const propio = c.autorUid === myUid || c.autor?.id === myUid;
  const firmar = (datos) => {
    const verificado = !!(perfil && /Especialista|Docente/.test(perfil.rol || ''));
    firmarRevision(c.id, {
      id: uid(), fecha: new Date().toISOString(), ...datos,
      revisor: { id: myUid, nombre: (perfil && perfil.nombre) || 'Revisor de prueba', area: (perfil && perfil.area) || (postulacion && postulacion.area) || '', verificado: false, demo: !verificado }
    });
  };
  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-6">
        <div>
          <button type="button" onClick={() => setRevisando(null)} className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] text-ink2 hover:bg-soft"><Ic n="back" s={14} />Cola de revisión</button>
          <header className="flex flex-col gap-3 border-b border-line pb-5">
            <div className="flex flex-wrap items-center gap-1.5"><EstadoPill estado={c.estado} />{c.ejemplo && <Pill>Ejemplo</Pill>}<Pill>{c.dientes}</Pill><Pill>{c.especialidad}</Pill></div>
            <h1 className="m-0 text-[26px] font-extrabold leading-[1.12] tracking-[-.03em] text-deep [text-wrap:balance] sm:text-[30px]">{c.titulo}</h1>
            <p className="m-0 text-[13px] text-ink3">{(c.autorUid === myUid || c.autor?.id === myUid) ? 'Tu caso' : (c.autor?.nombre || c.autorNombre || 'Autor') + (c.autor?.rol ? ' · ' + c.autor.rol : '')} · Paciente {[c.paciente.iniciales, c.paciente.edad && c.paciente.edad + ' años', c.paciente.sexo].filter(Boolean).join(', ')} · enviado {hace(c.actualizado)}</p>
          </header>
          {propio && <Aviso tono="warn" className="mt-4">Conflicto de interés: es tu propio caso. No puedes revisarlo; lo revisa otra persona.</Aviso>}
        </div>
        <section className="grid gap-4 md:grid-cols-2">
          <div className="tarjeta p-5"><h2 className="m-0 mb-2 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Diagnóstico</h2><p className="m-0 font-serif text-[15px] leading-relaxed text-ink">{c.diagnostico}</p></div>
          <div className="tarjeta p-5"><h2 className="m-0 mb-2 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Procedimiento</h2><p className="m-0 font-serif text-[15px] leading-relaxed text-ink">{c.procedimiento}</p></div>
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Adherencia al protocolo</h2>
          <Adherencia c={c} />
          {c.evidencia && <div className="rounded-r bg-soft p-4"><h3 className="m-0 mb-1.5 text-[12px] font-bold text-ink2">Evidencia declarada por el autor</h3><p className="m-0 font-serif text-[14.5px] leading-relaxed text-ink">{c.evidencia}</p></div>}
        </section>
        {d && (
          <details className="tarjeta">
            <summary className="px-5 py-4 text-[14px] font-bold text-deep">Evidencia de los pasos con desvío</summary>
            <div className="flex flex-col gap-3 px-5 pb-5">
              {d.pasos.map((s, i) => {
                const r = (c.pasos || {})[i] || {};
                if (!(r.estado === 'modificado' || r.estado === 'omitido')) return null;
                const fuentes = []; (s.sub || []).forEach((x) => (x.fuentes || []).forEach((f) => fuentes.push(f)));
                return (
                  <div key={i} className="rounded-rs bg-soft p-3.5">
                    <div className="mb-1 text-[13px] font-bold text-ink">{nn(i)} · {s.corto} {s.marca && <span className={cx('text-[11px]', esCritico(s) ? 'text-bad' : 'text-warn')}>{s.marca}</span>}</div>
                    <p className="m-0 mb-2 text-[13px] leading-snug text-ink2"><b>El protocolo dice:</b> {s.hacer}</p>
                    {s.disputa && <p className="m-0 mb-2 text-[12.5px] leading-snug text-warn">{s.disputa}</p>}
                    {s.sinEv && <p className="m-0 mb-2 text-[12.5px] text-ink3">{s.sinEv}</p>}
                    {fuentes.map((f, k) => <div key={k} className="mt-1.5 rounded-[9px] border border-line bg-card px-3 py-2"><Pill tono="acento">{f.grado}</Pill><div className="mt-1 text-[12.5px] leading-snug text-ink">{f.cita}</div></div>)}
                    {!fuentes.length && !s.sinEv && <p className="m-0 text-[12.5px] text-ink3">Este paso no cita fuentes propias.</p>}
                  </div>
                );
              })}
              {!Object.values(c.pasos || {}).some((r) => r.estado === 'modificado' || r.estado === 'omitido') && <p className="m-0 text-[13px] text-ink3">No hay desvíos: todos los pasos se siguieron o no aplicaban.</p>}
            </div>
          </details>
        )}
        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Fotos y radiografías</h2>
          <Galeria c={c} />
        </section>
        {(c.revisiones || []).length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="m-0 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Revisiones anteriores</h2>
            {[...c.revisiones].reverse().map((r) => <TarjetaRevision key={r.id} r={r} />)}
          </section>
        )}
      </div>
      <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-[76px] xl:max-h-[calc(100vh-90px)] xl:overflow-auto xl:pb-6">
        <Chequeo ch={ch} compacto />
        {pendiente && propio ? <Aviso tono="warn">No puedes firmar la revisión de tu propio caso.</Aviso>
          : pendiente ? <FormRevision key={c.id} c={c} ch={ch} onFirmar={firmar} /> : <Aviso tono="acento">Este caso ya no está pendiente: {c.estado === 'borrador' ? 'el autor lo retiró.' : 'ya tiene veredicto.'}</Aviso>}
      </aside>
    </div>
  );
}

export function Revision() {
  const { modoRevisor, revisando } = useApp();
  if (!modoRevisor) return <Intro />;
  if (revisando) return <PantallaRevision />;
  return <Cola />;
}
