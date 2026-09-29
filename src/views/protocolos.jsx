import React, { useState, useMemo } from 'react';
import { PROTOS, DATOS } from '../data.js';
import { ORDEN_ESP, norm, nn, diasHasta, fechaCorta, descargar, ESTADOS } from '../logic.js';
import { useApp } from '../ctx.js';
import { Ic, Pill, Btn, cx, Aviso, EstadoPill, Avatar } from '../ui.jsx';
import { useAprobadoresProtocolo } from '../db.js';

const CHIPS = ['todas', 'Rehabilitación oral', 'Periodoncia', 'Endodoncia', 'Cirugía'];

export function filtrarProtos(q, esp) {
  const nq = norm(q.trim());
  return PROTOS.filter((p) => (esp === 'todas' || p.esp === esp) && (!nq || norm(p.t + ' ' + p.s + ' ' + p.k + ' ' + p.esp).includes(nq)));
}

export function ChipsEsp({ className = '' }) {
  const { esp, setEsp } = useApp();
  return (
    <div className={cx('flex flex-wrap gap-1.5', className)}>
      {CHIPS.map((c) => (
        <button key={c} type="button" aria-pressed={esp === c} onClick={() => setEsp(c)}
          className={cx('rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors', esp === c ? 'border-acento bg-acento font-semibold text-onc' : 'border-line bg-card text-ink2 hover:border-acento')}>
          {c === 'todas' ? 'Todas' : c}
        </button>
      ))}
    </div>
  );
}

function TarjetaProto({ p }) {
  const { abrirProto } = useApp();
  return (
    <article className="flex min-h-[176px] flex-col gap-2.5 rounded-r border border-line bg-card p-5 shadow-sh transition-shadow hover:shadow-shlg">
      <div className="flex flex-wrap gap-1.5">
        <Pill>{p.estadoTxt}</Pill>
        {p.extraTxt && <Pill tono="warn">{p.extraTxt}</Pill>}
      </div>
      <h3 className="m-0 text-[17px] font-bold leading-[1.28] tracking-[-.015em] text-deep">{p.t}</h3>
      <p className="m-0 flex-1 font-serif text-[14.5px] leading-normal text-ink2">{p.s}</p>
      <div className="flex items-center justify-between gap-2.5 border-t border-line2 pt-3">
        <span className="text-[12px] text-ink3">{p.esp}{p.n ? ' · ' + p.n : ''}</span>
        {p.abre ? <Btn sm onClick={() => abrirProto(p.id)} className="!text-acentodeep hover:!border-acento">Abrir</Btn>
          : <span className="text-[12px] font-semibold text-ink3">Planificado</span>}
      </div>
    </article>
  );
}

export function TuDia() {
  const { casos, abrirCaso, go, nuevoCaso, modoRevisor, myUid } = useApp();
  const mios = casos.filter((c) => c.autorUid === myUid || c.autor?.id === myUid);
  const controles = [];
  mios.forEach((c) => (c.sesiones || []).forEach((s) => { if (s.proximo) controles.push({ c, s, d: diasHasta(s.proximo) }); }));
  const prox = controles.filter((x) => x.d >= -14).sort((a, b) => a.d - b.d).slice(0, 4);
  const cambios = mios.filter((c) => c.estado === 'cambios').length;
  const borradores = mios.filter((c) => c.estado === 'borrador').length;
  const porRevisar = casos.filter((c) => c.estado === 'enviado').length;
  const cuando = (d) => d === 0 ? 'hoy' : d === 1 ? 'mañana' : d > 1 ? 'en ' + d + ' d' : 'vencido hace ' + (-d) + ' d';
  return (
    <div className="flex flex-col gap-4 rounded-r border border-line bg-card p-5 shadow-sh sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Tu día</h2>
        <Btn v="primary" sm icon="plus" onClick={() => nuevoCaso()}>Nuevo caso</Btn>
      </div>
      <div>
        <h3 className="m-0 mb-1 text-[13px] font-bold text-ink">Próximos controles</h3>
        {prox.length === 0 ? <p className="m-0 text-[13px] text-ink3">Sin controles agendados. Se agendan desde las sesiones de cada caso.</p> : (
          <ul className="m-0 list-none p-0">
            {prox.map((x) => (
              <li key={x.c.id + x.s.id}>
                <button type="button" onClick={() => abrirCaso(x.c.id)} className="grid w-full grid-cols-[64px_minmax(0,1fr)] items-baseline gap-3 border-b border-line2 py-2.5 text-left hover:bg-soft">
                  <span className={cx('text-[12px] font-bold tabular-nums', x.d < 0 ? 'text-bad' : x.d <= 1 ? 'text-acentodeep' : 'text-ink2')}>{fechaCorta(x.s.proximo + 'T12:00:00')}</span>
                  <span className="min-w-0 text-[13px] leading-snug text-ink2"><b className="font-semibold text-ink">{x.c.dientes}</b> · {x.c.titulo}<span className="block text-[11.5px] text-ink3">{cuando(x.d)}</span></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { n: borradores, t: 'borradores', on: () => go('casos', { filtroCasos: 'borrador' }) },
          { n: cambios, t: 'con cambios pedidos', on: () => go('casos', { filtroCasos: 'cambios' }), warn: cambios > 0 },
          { n: porRevisar, t: modoRevisor ? 'por revisar' : 'casos en revisión', on: () => go('revision') }
        ].map((k) => (
          <button key={k.t} type="button" onClick={k.on} className="flex flex-col items-start rounded-rs bg-soft px-3 py-2.5 text-left hover:brightness-[.97]">
            <b className={cx('text-[22px] font-extrabold tabular-nums', k.warn ? 'text-warn' : 'text-deep')}>{k.n}</b>
            <span className="text-[11.5px] leading-tight text-ink3">{k.t}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Inicio() {
  const { q, setQ, esp, go } = useApp();
  const res = filtrarProtos(q, esp);
  return (
    <div className="flex flex-col gap-11 pb-6">
      <section className="grid items-start gap-8 pt-2 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,.8fr)] lg:gap-11 lg:pt-8">
        <div className="min-w-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-acentosoft px-3 py-1.5 text-[12px] font-semibold text-acentodeep">
            <span className="h-1.5 w-1.5 rounded-full bg-acento" />Odontología basada en evidencia
          </div>
          <h1 className="m-0 mb-4 max-w-[19ch] text-[36px] font-extrabold leading-[1.05] tracking-[-.035em] text-deep [text-wrap:balance] sm:text-[46px] xl:text-[52px]">Protocolos clínicos con la evidencia a la vista.</h1>
          <p className="m-0 mb-6 max-w-[52ch] font-serif text-[17px] leading-relaxed text-ink2 sm:text-[19px]">Qué hacer, por qué, y dónde todavía no se sabe. Sube tus casos, compáralos con el protocolo y pásalos por un revisor que aprueba o deniega según la evidencia.</p>
          <form onSubmit={(e) => { e.preventDefault(); go('biblioteca'); }}
            className="flex max-w-[620px] items-center gap-2.5 rounded-full border border-line bg-card py-1.5 pl-5 pr-1.5 shadow-sh focus-within:border-acento">
            <Ic n="search" s={18} className="text-acento" sw={1.9} />
            <input id="busqueda-hero" type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="¿Qué vas a hacer hoy?"
              placeholder="¿Qué vas a hacer hoy? cementar un provisional…" className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-ink outline-none placeholder:text-ink3" />
            <button type="submit" className="flex-none rounded-full bg-acento px-5 py-2.5 text-[14px] font-semibold text-onc hover:bg-acentodeep">Buscar</button>
          </form>
          <ChipsEsp className="mt-3.5" />
        </div>
        <TuDia />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="m-0 text-[15px] font-bold text-ink">Protocolos <span className="font-medium text-ink3">· {res.length === 1 ? '1 protocolo' : res.length + ' protocolos'}</span></h2>
          <button type="button" onClick={() => go('biblioteca')} className="text-[13px] font-semibold text-acentodeep hover:underline">Ver la biblioteca completa →</button>
        </div>
        {res.length === 0 ? <p className="m-0 text-[14px] text-ink2">Nada coincide con “{q}”. Prueba con otra palabra o quita el filtro de área.</p> : (
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">{res.map((p) => <TarjetaProto key={p.id} p={p} />)}</div>
        )}
      </section>

      <section className="grid items-center gap-6 rounded-[26px] bg-band px-6 py-8 sm:px-10 sm:py-10 md:grid-cols-[minmax(0,1.3fr)_auto]">
        <div>
          <h2 className="m-0 mb-3 text-[26px] font-extrabold leading-[1.1] tracking-[-.03em] text-white [text-wrap:balance] sm:text-[32px]">Ningún protocolo está validado todavía.</h2>
          <p className="m-0 max-w-[60ch] font-serif text-[16px] leading-relaxed text-[#D5E3E8] sm:text-[17px]">Las ocho plazas de revisor están abiertas y cada una cubre un área distinta. Ningún protocolo se publica como validado sin la firma de un especialista del área que corresponde.</p>
        </div>
        <button type="button" onClick={() => go('postular')} className="justify-self-start rounded-full bg-[#F6F8F9] px-6 py-3 text-[14.5px] font-bold text-[#1B3949] hover:bg-white">Ver las ocho plazas</button>
      </section>

      <section>
        <h2 className="m-0 mb-4 text-[15px] font-bold text-ink">Cómo se valida</h2>
        <div className="grid gap-3.5 md:grid-cols-3">
          {[
            ['El grado va en el paso, no en la bibliografía', 'Cada paso lleva el grado de lo que lo respalda y la referencia completa, con el localizador del párrafo que se cita.'],
            ['La regla del techo', 'Una revisión no otorga un grado superior al de los estudios que resume. Un metaanálisis de estudios in vitro tiene techo de grado C, y un grado C no basta para desplazar una práctica establecida.'],
            ['La disputa y el vacío se declaran', 'Cuando la evidencia reciente contradice lo que se enseña, el paso queda en disputa hasta que lo resuelva el panel. Cuando no hay respaldo, el paso dice “sin evidencia”.']
          ].map(([t, d]) => (
            <div key={t} className="rounded-r border border-line bg-card p-5">
              <h3 className="m-0 mb-2 text-[16.5px] font-bold leading-tight text-deep">{t}</h3>
              <p className="m-0 font-serif text-[14.5px] leading-relaxed text-ink2">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="grid gap-6 border-t border-line pt-6 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)]">
        <p className="m-0 max-w-[64ch] text-[13.5px] leading-relaxed text-ink2">Criterium lo desarrollan dos estudiantes de quinto año de Odontología. Si algo está mal en un protocolo, queremos saberlo.</p>
        <Aviso><b>Este sitio está en desarrollo.</b> Los protocolos son borradores sin revisión de especialista y no deben usarse como estándar de atención.</Aviso>
      </footer>
    </div>
  );
}

export function Biblioteca() {
  const { q, setQ, esp } = useApp();
  const res = filtrarProtos(q, esp);
  const grupos = ORDEN_ESP.map((e) => {
    const items = res.filter((p) => p.esp === e);
    return { esp: e, items, meta: items.filter((p) => p.abre).length + ' de ' + items.length + ' disponibles' };
  }).filter((g) => g.items.length);
  const { abrirProto } = useApp();
  return (
    <div className="flex flex-col gap-6">
      <header className="max-w-[66ch]">
        <h1 className="m-0 mb-2 text-[30px] font-extrabold tracking-[-.03em] text-deep sm:text-[36px]">Biblioteca</h1>
        <p className="m-0 font-serif text-[17px] leading-relaxed text-ink2">Todos los protocolos, con su estado a la vista. Nada aparece como validado hasta que un especialista lo firma.</p>
      </header>
      <div className="flex flex-col gap-3">
        <label className="flex max-w-[520px] items-center gap-2.5 rounded-full border border-line bg-card px-4 focus-within:border-acento">
          <Ic n="search" s={16} className="text-ink3" />
          <input id="busqueda-biblioteca" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="cementar, tallar, exodoncia del 1.8…" aria-label="Buscar un protocolo"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-[14px] text-ink outline-none placeholder:text-ink3" />
        </label>
        <div className="flex flex-wrap items-center gap-2"><ChipsEsp /><span className="ml-auto text-[13px] tabular-nums text-ink3">{res.length === 1 ? '1 protocolo' : res.length + ' protocolos'}</span></div>
      </div>
      {grupos.length === 0 && <p className="m-0 text-[14px] text-ink2">Nada coincide con “{q}”.</p>}
      {grupos.map((g) => (
        <section key={g.esp} className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between"><h2 className="m-0 text-[14px] font-bold text-ink">{g.esp}</h2><span className="text-[12.5px] text-ink3">{g.meta}</span></div>
          {g.items.map((p) => (
            <article key={p.id} className="grid items-center gap-4 rounded-r border border-line bg-card px-5 py-4 transition-colors hover:bg-soft sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5"><Pill>{p.estadoTxt}</Pill>{p.extraTxt && <Pill tono="warn">{p.extraTxt}</Pill>}{p.n && <span className="text-[11.5px] text-ink3">{p.n}</span>}</div>
                <h3 className="m-0 mb-1 text-[16.5px] font-bold leading-snug tracking-[-.015em] text-deep">{p.t}</h3>
                <p className="m-0 font-serif text-[14.5px] leading-normal text-ink2">{p.s}</p>
              </div>
              {p.abre ? <Btn onClick={() => abrirProto(p.id)} className="justify-self-start !text-acentodeep">Abrir</Btn> : <span className="text-[12.5px] font-semibold text-ink3">Planificado</span>}
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}

function Sub({ x }) {
  return (
    <details className="mt-2 rounded-rs bg-soft px-3.5 py-3">
      <summary className="text-[12.5px] font-semibold text-acentodeep">{x.titulo}</summary>
      <div className="pt-2.5">
        {(x.parrafos || []).map((t, i) => <p key={i} className="m-0 mb-2.5 font-serif text-[14.5px] leading-[1.65] text-ink2">{t}</p>)}
        {(x.arbol || []).map((r, i) => (
          <div key={i} className="grid grid-cols-[16px_minmax(0,1fr)] gap-2.5 border-t border-line py-2.5">
            <span className="text-acento">→</span>
            <div><div className="mb-0.5 text-[13px] font-semibold text-ink">{r.q}</div><div className="text-[13px] leading-normal text-ink2">{r.a}</div></div>
          </div>
        ))}
        {(x.fuentes || []).map((f, i) => (
          <div key={i} className="mt-2 rounded-rs border border-line bg-card px-3.5 py-3">
            <Pill tono="acento" className="mb-1.5">{f.grado}</Pill>
            <div className="text-[13px] leading-normal text-ink">{f.cita}</div>
            <div className="mt-1 text-[11.5px] leading-normal text-ink3">{f.loc}</div>
          </div>
        ))}
      </div>
    </details>
  );
}

function Paso({ s, i, hecho, onToggle }) {
  return (
    <section id={'paso-' + (i + 1)} className={cx('grid grid-cols-[40px_minmax(0,1fr)] gap-3.5 rounded-r border bg-card p-4 shadow-sh transition-opacity sm:grid-cols-[46px_minmax(0,1fr)] sm:gap-4 sm:p-6', hecho ? 'border-acento' : 'border-line')}>
      <button type="button" onClick={onToggle} aria-pressed={hecho} aria-label={(hecho ? 'Desmarcar' : 'Marcar hecho') + ' el paso ' + nn(i)}
        className={cx('grid h-9 w-9 place-items-center rounded-[11px] text-[14px] font-extrabold tabular-nums transition-colors', hecho ? 'bg-acento text-onc' : 'bg-soft text-ink2 hover:bg-acentosoft')}>
        {hecho ? <Ic n="check" s={18} sw={2.4} /> : nn(i)}
      </button>
      <div className="min-w-0">
        {s.disputa && (
          <div className="mb-3 rounded-rs bg-warnsoft px-3.5 py-2.5">
            <b className="mb-0.5 block text-[11.5px] uppercase tracking-[.04em] text-warn">{s.marca || 'En disputa'}</b>
            <span className="text-[13px] leading-normal text-warn">{s.disputa}</span>
          </div>
        )}
        <p className={cx('m-0 mb-1.5 text-[16.5px] font-semibold leading-snug text-ink sm:text-[17.5px]', hecho && 'text-ink2')}>{s.hacer}</p>
        {s.cond && <p className="m-0 mb-2.5 text-[13.5px] leading-normal text-acentodeep">{s.cond}</p>}
        <p className="m-0 mt-2.5 grid grid-cols-[18px_minmax(0,1fr)] gap-2 rounded-rs bg-oksoft px-3.5 py-2.5 text-[13.5px] leading-normal text-ink2"><span className="font-bold text-ok">✓</span><span>{s.listo}</span></p>
        {s.sinEv && <p className="m-0 mt-2.5 rounded-rs border border-dashed border-line px-3 py-2 text-[12.5px] leading-normal text-ink3">◻ {s.sinEv}</p>}
        <details className="mt-3">
          <summary className="inline-flex items-center gap-1.5 rounded-full bg-acentosoft px-3.5 py-1.5 text-[12.5px] font-semibold text-acentodeep">¿por qué?</summary>
          <div className="pt-3">
            {(s.porque || []).map((t, k) => <p key={k} className="m-0 mb-3 font-serif text-[15px] leading-[1.65] text-ink2">{t}</p>)}
            {(s.sub || []).map((x, k) => <Sub key={k} x={x} />)}
          </div>
        </details>
        {s.aportes && s.aportes.length > 0 && (
          <details className="mt-2.5">
            <summary className="py-1.5 text-[12.5px] font-semibold text-ink3">{s.aportes.length} aporte{s.aportes.length > 1 ? 's' : ''} de la comunidad</summary>
            {s.aportes.map((c, k) => (
              <div key={k} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 border-t border-line2 py-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-acentosoft text-[11px] font-bold text-acentodeep">{c.av}</div>
                <div>
                  <div className="text-[13.5px] leading-normal text-ink2"><b className="text-ink">{c.quien}</b> {c.marca && <span className="text-ok">{c.marca}</span>} {c.txt}</div>
                  <div className="mt-1 flex flex-wrap gap-3 text-[11.5px] text-ink3"><span>{c.rol}</span><span>hace {c.cuando}</span><span>♡ {c.likes}</span></div>
                </div>
              </div>
            ))}
          </details>
        )}
      </div>
    </section>
  );
}

function ModoBox({ d, hechos, toggle, reiniciar }) {
  const n = hechos.length, tot = d.pasos.length;
  return (
    <div className="rounded-r border border-line bg-card p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[.05em] text-ink3">Modo box</span>
        <b className="text-[13px] tabular-nums text-acentodeep">{n} de {tot}</b>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-soft"><div className="h-1.5 rounded-full bg-acento transition-all" style={{ width: Math.round(n / tot * 100) + '%' }} /></div>
      <div className="flex flex-col gap-px">
        {d.pasos.map((s, i) => {
          const on = hechos.includes(i);
          return (
            <label key={i} className={cx('grid cursor-pointer grid-cols-[16px_22px_minmax(0,1fr)] items-start gap-2 rounded-[9px] px-2 py-2 text-[12.5px] leading-snug text-ink2 hover:bg-soft', on && 'opacity-55')}>
              <input type="checkbox" checked={on} onChange={() => toggle(i)} className="mt-0.5 accent-[var(--acento)]" />
              <span className="font-bold tabular-nums text-ink3">{nn(i)}</span>
              <span className={on ? 'line-through' : ''}>{s.corto}{s.marca && <span className="mt-0.5 block text-[10.5px] font-semibold text-warn no-underline">{s.marca}</span>}</span>
            </label>
          );
        })}
      </div>
      <Btn sm className="mt-3 w-full" onClick={reiniciar} disabled={!n}>Reiniciar marcas</Btn>
    </div>
  );
}

export function Protocolo() {
  const { protoId, go, checks, setChecks, nuevoCaso, avisar, casos, abrirCaso, myUid, verPerfil } = useApp();
  const d = DATOS[protoId] || DATOS['cementado-pmma'];
  const id = DATOS[protoId] ? protoId : 'cementado-pmma';
  const hechos = checks[id] || [];
  const toggle = (i) => setChecks((c) => { const l = c[id] || []; return { ...c, [id]: l.includes(i) ? l.filter((x) => x !== i) : [...l, i].sort((a, b) => a - b) }; });
  const reiniciar = () => setChecks((c) => ({ ...c, [id]: [] }));
  const [bajando, setBajando] = useState(false);
  const aprobadores = useAprobadoresProtocolo(id);
  const casosDeEste = casos.filter((c) => c.protocoloId === id && (c.autorUid === myUid || c.autor?.id === myUid));
  const bajarPdf = async () => {
    setBajando(true);
    try {
      const r = await fetch(d.pdf); if (!r.ok) throw new Error();
      const b = await r.blob();
      await descargar(d.pdf, b, avisar);
    } catch (e) { avisar('No se pudo obtener el PDF.', 'warn'); }
    setBajando(false);
  };
  const lado = (
    <>
      <div className="flex flex-col gap-2">
        <Btn v="primary" icon="plus" onClick={() => nuevoCaso({ protocoloId: id, especialidad: d.esp === 'Cirugía bucal' ? 'Cirugía bucal' : d.esp })}>Registrar un caso con este protocolo</Btn>
        {d.pdf && <Btn icon="download" onClick={bajarPdf} disabled={bajando}>{bajando ? 'Preparando…' : 'Descargar el PDF de box'}</Btn>}
      </div>
      {casosDeEste.length > 0 && (
        <div className="rounded-r border border-line bg-card p-4">
          <h2 className="m-0 mb-2 text-[11px] font-bold uppercase tracking-[.05em] text-ink3">Tus casos con este protocolo</h2>
          {casosDeEste.map((c) => (
            <button key={c.id} type="button" onClick={() => abrirCaso(c.id)} className="flex w-full items-center justify-between gap-2 border-t border-line2 py-2 text-left text-[13px] text-ink2 first:border-0 hover:text-ink">
              <span className="min-w-0 truncate">{c.dientes} · {c.titulo}</span><EstadoPill estado={c.estado} />
            </button>
          ))}
        </div>
      )}
      <div className="hidden xl:block"><ModoBox d={d} hechos={hechos} toggle={toggle} reiniciar={reiniciar} /></div>
      <div>
        <h2 className="m-0 mb-2.5 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Estado de la evidencia</h2>
        <div className="rounded-r border border-line bg-card px-4 py-1.5">
          {d.evidencia.map((e) => (
            <div key={e.n} className="grid grid-cols-[26px_minmax(0,1fr)] gap-2 border-b border-line2 py-2.5 last:border-0">
              <span className="text-[12px] font-bold tabular-nums text-ink3">{e.n}</span>
              <div><div className="text-[11.5px] font-semibold text-acentodeep">{e.grado}</div><div className="mt-0.5 text-[12.5px] leading-normal text-ink2">{e.txt}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="m-0 mb-2.5 text-[12px] font-bold uppercase tracking-[.05em] text-ink3">Reglas del validador</h2>
        <div className="flex flex-col gap-2 rounded-r bg-soft p-4 font-serif text-[13.5px] leading-relaxed text-ink2">
          <p className="m-0">Una revisión no otorga un grado superior al de los estudios que resume.</p>
          <p className="m-0">Un grado C no desplaza una práctica establecida: el paso queda en disputa.</p>
          <p className="m-0">Lo que no tiene respaldo se publica marcado como sin evidencia.</p>
        </div>
      </div>
    </>
  );
  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <button type="button" onClick={() => go('biblioteca')} className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] text-ink2 hover:bg-soft"><Ic n="back" s={14} />Biblioteca</button>
        <Aviso className="mb-5 !text-[12px]">{d.bandera}</Aviso>
        <header className="border-b border-line pb-5">
          <p className="m-0 mb-3 text-[12px] font-semibold text-acentodeep">{d.esp} · Criterium</p>
          <h1 className="m-0 mb-3.5 text-[27px] font-extrabold leading-[1.12] tracking-[-.03em] text-deep [text-wrap:balance] sm:text-[34px]">{d.titulo}</h1>
          <div className="mb-4 flex flex-wrap gap-1.5">{d.tags.map((t) => <Pill key={t}>{t}</Pill>)}</div>
          {aprobadores.length > 0 && (
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex flex-none -space-x-2">{aprobadores.slice(0, 3).map((r) => <span key={r.id || r.nombre} className="rounded-full ring-2 ring-bg"><Avatar nombre={r.nombre} verificado={r.verificado} size={26} /></span>)}</div>
              <p className="m-0 text-[12.5px] leading-snug text-ink3">
                <b className="font-semibold text-ink2">Mención honrosa:</b>{' '}
                {aprobadores.map((r, i) => <span key={r.id || r.nombre}>{i > 0 && (i === aprobadores.length - 1 ? ' y ' : ', ')}{r.id ? <button type="button" onClick={() => verPerfil(r.id)} className="font-semibold text-ink2 hover:underline">{r.nombre}</button> : <span className="font-semibold text-ink2">{r.nombre}</span>}</span>)}
                {', por aprobar '}{(() => { const n = aprobadores.reduce((t, r) => t + r.casos, 0); return n === 1 ? 'un caso' : n + ' casos'; })()} con este protocolo.
              </p>
            </div>
          )}
          <p className="m-0 font-serif text-[15px] leading-relaxed text-ink2"><b className="font-sans text-[13.5px] text-ink">Alcance:</b> {d.alcance}</p>
        </header>

        <details className="mt-5 rounded-r border border-line bg-card xl:hidden">
          <summary className="flex items-center justify-between gap-3 px-5 py-4 text-[14.5px] font-bold text-deep">
            <span>Modo box · marca lo que ya hiciste</span><span className="text-[13px] tabular-nums text-acentodeep">{hechos.length} de {d.pasos.length}</span>
          </summary>
          <div className="px-3 pb-3"><ModoBox d={d} hechos={hechos} toggle={toggle} reiniciar={reiniciar} /></div>
        </details>

        <details className="mt-3 rounded-r border border-line bg-card xl:mt-5">
          <summary className="flex items-center justify-between gap-3 px-5 py-4 text-[14.5px] font-bold text-deep">
            <span>Antes de empezar · monta la bandeja</span><span className="text-[12px] font-semibold text-acentodeep">abrir / cerrar</span>
          </summary>
          <div className="grid gap-5 px-5 pb-5 pt-1 sm:grid-cols-2 lg:grid-cols-3">
            {d.bandeja.map((b) => (
              <div key={b.fase}>
                <h4 className="m-0 mb-2 text-[11.5px] font-bold uppercase tracking-[.04em] text-acentodeep">{b.fase}</h4>
                <ul className="m-0 pl-4 text-[13.5px] leading-[1.65] text-ink2">{b.items.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            ))}
          </div>
        </details>

        <div className="mt-5 flex flex-col gap-3.5">
          {d.pasos.map((s, i) => <Paso key={i} s={s} i={i} hecho={hechos.includes(i)} onToggle={() => toggle(i)} />)}
        </div>

        <section className="mt-8">
          <Pill tono="warn" className="mb-3">Sin validar · aportes de la comunidad</Pill>
          <h2 className="m-0 mb-2 text-[22px] font-extrabold tracking-[-.025em] text-deep">Lo que reporta la gente que lo hace</h2>
          <p className="m-0 mb-4 max-w-[66ch] font-serif text-[15px] leading-relaxed text-ink2">Nada de esta sección pasó por el validador ni por el panel. Son observaciones de quienes usan el protocolo en clínica. Sirven para detectar dónde se equivoca la gente, no para decidir un tratamiento.</p>
          <Btn icon="chat" onClick={() => go('feed', { feedProto: id })}>Preguntar en el feed sobre este protocolo</Btn>
          <p className="m-0 mt-5 max-w-[72ch] text-[12px] leading-relaxed text-ink3">{d.nota}</p>
        </section>
      </div>
      <aside className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-[76px] xl:max-h-[calc(100vh-90px)] xl:overflow-auto xl:pb-6">{lado}</aside>
    </div>
  );
}
