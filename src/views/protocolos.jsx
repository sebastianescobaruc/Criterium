import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PROTOS, DATOS } from '../data.js';
import { ORDEN_ESP, norm, nn, diasHasta, fechaCorta, descargar, ESTADOS } from '../logic.js';
import { useApp } from '../ctx.js';
import { Ic, Pill, Btn, cx, Aviso, EstadoPill, Avatar } from '../ui.jsx';
import { useAprobadoresProtocolo } from '../db.js';
import { Guiado } from './guiado.jsx';
import { SolicitudesProtocolo } from './agenda.jsx';

// Cómo se recorre un protocolo: 'guiado' (un paso a la vez) o 'todo' (la lista completa). Comodidad local.
const leerModo = () => { try { return localStorage.getItem('criterium-modo-proto') === 'todo' ? 'todo' : 'guiado'; } catch (e) { return 'guiado'; } };
const guardarModo = (m) => { try { localStorage.setItem('criterium-modo-proto', m); } catch (e) {} };

// Solo las especialidades que tienen al menos un protocolo en el catálogo
const CHIPS = ['todas', ...ORDEN_ESP.filter((e) => PROTOS.some((p) => p.esp === e))];

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


import { ChipEstadoProtocolo } from '../ui.jsx';

function TarjetaProto({ p }) {
  const { abrirProto } = useApp();
  const d = DATOS[p.id]; // Puede ser undefined si está planificado
  
  const estadoVisual = p.estadoTxt.toLowerCase().includes('borrador') ? 'borrador' 
    : p.estadoTxt.toLowerCase().includes('planificado') ? 'planificado' 
    : p.estadoTxt.toLowerCase().includes('disputa') ? 'disputa' : 'validado';

  const pasos = d ? d.pasos.length : 0;
  const fuentes = d ? d.evidencia.length : 0;

  return (
    <button type="button" onClick={() => p.abre && abrirProto(p.id)} className="flex min-h-[176px] flex-col gap-4 tarjeta p-5 transition-shadow hover:shadow-shlg text-left w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 w-full">
        <span className="rotulo">{p.esp}</span>
        <span className="flex flex-wrap items-center gap-1.5">{p.estudio && <Pill tono="acento">Estudio piloto</Pill>}<ChipEstadoProtocolo estado={estadoVisual} /></span>
      </div>
      
      <div className="flex-1">
        <h3 className="m-0 mb-2 text-[18px] font-extrabold leading-[1.28] tracking-[-.015em] text-deep">{p.t}</h3>
        <p className="m-0 font-serif text-[14.5px] leading-normal text-ink2">{p.s}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line2 pt-4 mt-2 text-[13px] font-medium text-ink2 w-full">
        {d ? (
          <>
            <div className="flex items-center gap-1.5"><Ic n="check" s={16} className="text-ink3" /> {pasos} pasos</div>
            <div className="h-4 w-px bg-line" />
            <div className="flex items-center gap-1.5"><Ic n="book" s={16} className="text-ink3" /> {fuentes} fuentes</div>
            <div className="h-4 w-px bg-line" />
            <div className="flex items-center gap-1.5"><Ic n="clock" s={16} className="text-ink3" /> {p.estadoTxt}</div>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-ink3"><Ic n="clock" s={16} /> Próximamente en desarrollo</div>
        )}
      </div>
    </button>
  );
}

function ItemPlanificado({ p }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line2 py-3 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <h4 className="m-0 text-[14.5px] font-bold text-ink2">{p.t}</h4>
        <span className="text-[11px] font-semibold uppercase text-ink3 bg-soft px-2 py-0.5 rounded-full">{p.esp}</span>
      </div>
      <p className="m-0 text-[13.5px] text-ink3 leading-snug">{p.s}</p>
    </div>
  );
}
export function TuDia() {
  const { casos, abrirCaso, go, nuevoCaso, modoRevisor, myUid, esDocente } = useApp();
  if (!esDocente) return null; // casos, controles y revisión son del portal docente
  const mios = casos.filter((c) => c.autorUid === myUid || c.autor?.id === myUid);
  const controles = [];
  mios.forEach((c) => (c.sesiones || []).forEach((s) => { if (s.proximo) controles.push({ c, s, d: diasHasta(s.proximo) }); }));
  const prox = controles.filter((x) => x.d >= -14).sort((a, b) => a.d - b.d).slice(0, 4);
  const cambios = mios.filter((c) => c.estado === 'cambios').length;
  const borradores = mios.filter((c) => c.estado === 'borrador').length;
  const porRevisar = casos.filter((c) => c.estado === 'enviado').length;
  const cuando = (d) => d === 0 ? 'hoy' : d === 1 ? 'mañana' : d > 1 ? 'en ' + d + ' d' : 'vencido hace ' + (-d) + ' d';
  return (
    <div className="flex flex-col gap-4 tarjeta p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 rotulo">Tu día</h2>
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


// Cómo se produce un protocolo (presentación para tutores, diapositiva 5). El tercero es el único con IA.
const PRODUCCION = [
  ['Pregunta operativa', 'Qué procedimiento y cuál es su alcance.'],
  ['Búsqueda de evidencia', 'Guías > revisiones > ensayos > observacionales > laboratorio.'],
  ['Borrador con IA', 'Cada afirmación con cita de página y párrafo.', true],
  ['Validador y revisión humana', 'Rechaza fuentes fuera del corpus y aplica la regla del techo. Los autores resuelven conflictos.'],
  ['Juicio de expertos', 'Puntúan cada paso; los autores corrigen. Cada corrección queda registrada.'],
  ['Texto fijo y fechado', 'Con huella SHA-256: se lee la versión aprobada.']
];

// Las seis capas de cada protocolo (presentación para tutores, diapositiva 3)
const CAPAS = [
  ['Secuencia con criterio de término', '¿Qué hago y cómo sé que terminé?', 'check'],
  ['Instrumental por fase', '¿Qué materiales voy a usar y en qué fase?', 'tool'],
  ['Árbol de decisión', '¿Y si hay más de una opción válida?', 'sparkle'],
  ['Disenso entre autores', '¿Dónde no se ponen de acuerdo?', 'chat'],
  ['Errores frecuentes', '¿Dónde se equivoca la gente?', 'alert'],
  ['Referencias con página y párrafo', 'Cada afirmación lleva al origen de su evidencia en un toque.', 'book']
];

export function Inicio() {
  const { q, setQ, esp, go } = useApp();
  const res = filtrarProtos(q, esp);
  return (
    <div className="flex flex-col gap-10 pb-8">
      <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12 pt-4">
        <div className="min-w-0">
          <p className="rotulo m-0 mb-4">Biblioteca viva de protocolos</p>
          <h1 className="m-0 mb-4 text-[36px] font-extrabold leading-[1.08] tracking-[-.03em] text-deep sm:text-[42px] xl:text-[48px] [text-wrap:balance]">
            Protocolos clínicos con <span className="text-acento">la evidencia a la vista</span>.
          </h1>
          <p className="m-0 mb-8 max-w-[54ch] text-[16px] leading-relaxed text-ink2 sm:text-[18px]">
            Qué hacer, por qué, y dónde todavía no se sabe. Registra tus casos, compáralos con el protocolo y somételos a revisión especializada.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); go('biblioteca'); }}
            className="flex max-w-[560px] items-center gap-2.5 rounded-full border border-line bg-card py-2 pl-5 pr-2 shadow-sh focus-within:border-acento focus-within:shadow-shlg transition-shadow">
            <Ic n="search" s={18} className="text-acento" sw={1.9} />
            <input id="busqueda-hero" type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar en biblioteca"
              placeholder="Ej: cementar carilla, exodoncia..." className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-ink outline-none placeholder:text-ink3" />
            <button type="submit" className="flex-none rounded-full bg-acento px-6 py-2.5 text-[14px] font-semibold text-onc hover:bg-acentodeep transition-colors">Buscar</button>
          </form>
          <ChipsEsp className="mt-5" />
        </div>
        <div className="hidden lg:block">
          <TuDia />
        </div>
      </section>

      <section>
        <p className="rotulo m-0 mb-2">Cómo está hecho cada protocolo</p>
        <h2 className="m-0 mb-5 text-[24px] font-extrabold leading-tight tracking-[-.025em] text-deep sm:text-[28px]">Cada paso dice qué hacer, cuándo terminaste y en qué evidencia se apoya.</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CAPAS.map(([t, d, ic], k) => (
            <div key={t} className="suave grid grid-cols-[38px_minmax(0,1fr)_auto] items-start gap-3 p-5">
              <b className="text-[34px] font-extrabold leading-none tabular-nums text-menta">{k + 1}</b>
              <div><h3 className="m-0 mb-1 text-[15.5px] font-bold leading-snug text-deep">{t}</h3><p className="m-0 text-[13.5px] leading-snug text-ink2">{d}</p></div>
              <Ic n={ic} s={19} className="text-rotulo" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="rotulo m-0 mb-2">Cómo se produce un protocolo</p>
        <h2 className="m-0 mb-5 text-[24px] font-extrabold leading-tight tracking-[-.025em] text-deep sm:text-[28px]">La IA trabaja en la producción, no en la entrega.</h2>
        <ol className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {PRODUCCION.map(([t, d, ia], k) => (
            <li key={t} className={cx('aparece relative flex flex-col gap-1.5 rounded-[20px] p-5', ia ? 'panel' : 'suave')} style={{ '--d': k * 90 + 'ms' }}>
              <span className={cx('grid h-9 w-9 place-items-center rounded-full text-[14px] font-extrabold', ia ? 'bg-menta text-mentaink' : 'bg-card text-deep shadow-sh')}>{k + 1}</span>
              <h3 className={cx('m-0 mt-1 text-[15px] font-bold leading-snug', ia ? 'text-panelink' : 'text-deep')}>{t}</h3>
              <p className={cx('m-0 text-[13px] leading-snug', ia ? 'text-panelink2' : 'text-ink2')}>{d}</p>
              {ia && <span className="mt-1 self-start rounded-full bg-menta px-2.5 py-0.5 text-[11px] font-bold text-mentaink">Solo aquí entra la IA</span>}
            </li>
          ))}
        </ol>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="suave p-5"><h3 className="m-0 mb-1 text-[15px] font-bold text-deep">Regla del techo</h3><p className="m-0 text-[13.5px] leading-snug text-ink2">Una revisión no puede recibir un grado mayor que el de los estudios que resume. Por ejemplo, un metaanálisis de estudios in vitro no llega a grado A.</p></div>
          <div className="panel p-5"><h3 className="m-0 mb-1 text-[15px] font-bold text-panelink">Lo que Criterium no es</h3><p className="m-0 text-[13.5px] leading-snug text-panelink2">No reemplaza al docente. No decide el tratamiento de un paciente. No genera indicaciones nuevas en el momento: el estudiante lee un texto fijo y fechado.</p></div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-cardline pb-3">
          <h2 className="m-0 text-[18px] font-bold text-deep">Protocolos recomendados</h2>
          <button type="button" onClick={() => go('biblioteca')} className="text-[13px] font-semibold text-acentodeep hover:underline">Ver biblioteca →</button>
        </div>
        {res.length === 0 ? (
          <div className="text-center py-10 rounded-rs border border-dashed border-line bg-soft">
             <p className="m-0 text-[14px] text-ink3">Nada coincide con “{q}”. Prueba con otra palabra.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
             {res.map((p) => <TarjetaProto key={p.id} p={p} />)}
          </div>
        )}
      </section>
      
      <section className="grid items-center gap-6 rounded-[26px] bg-band px-6 py-8 sm:px-10 sm:py-10 md:grid-cols-[minmax(0,1.3fr)_auto]">
        <div>
          <h2 className="m-0 mb-3 text-[26px] font-extrabold leading-[1.1] tracking-[-.03em] text-white [text-wrap:balance] sm:text-[32px]">Ningún protocolo está validado todavía.</h2>
          <p className="m-0 max-w-[62ch] font-serif text-[16px] leading-relaxed text-[#D5E3E8] sm:text-[17px]">Cada protocolo pasará por un juicio de expertos: al menos 5 especialistas del área puntúan cada paso de 1 a 5 en pertinencia, claridad y respaldo de la evidencia, en hasta dos rondas. Un paso queda aprobado si el 80 % o más le pone 4 o 5. Si no hay acuerdo, se publica marcado «sin acuerdo experto» o se elimina.</p>
        </div>
        <button type="button" onClick={() => go('postular')} className="justify-self-start rounded-full bg-[#F6F8F9] px-6 py-3 text-[14.5px] font-bold text-[#1B3949] hover:bg-white">Revisar casos clínicos</button>
      </section>
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
  const { abrirProto, avisar, go, protoFoco } = useApp();
  // Llegaste desde el mapa del inicio: baja hasta ese protocolo y destácalo un momento
  const [foco, setFoco] = useState(protoFoco);
  useEffect(() => {
    if (!protoFoco) return;
    const el = document.getElementById('proto-' + protoFoco);
    if (el) el.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    const t = setTimeout(() => setFoco(null), 2600);
    return () => clearTimeout(t);
  }, [protoFoco]);
  const [bajando, setBajando] = useState(''); // id del protocolo cuyo PDF se está preparando
  const pdf = async (id) => { setBajando(id); await bajarPdf(DATOS[id].pdf, avisar); setBajando(''); };
  return (
    <div className="flex flex-col gap-6">
      <header className="max-w-[66ch]">
        <p className="rotulo m-0 mb-2.5">Biblioteca viva de protocolos</p>
        <h1 className="m-0 mb-2 text-[30px] font-extrabold tracking-[-.03em] text-deep sm:text-[36px]">Biblioteca</h1>
        <p className="m-0 font-serif text-[17px] leading-relaxed text-ink2">Todos los protocolos, con su estado a la vista. Nada aparece como validado hasta que un especialista lo firma.</p>
        <Btn icon="red" className="mt-3" onClick={() => go('mapa')}>Ver el mapa de protocolos</Btn>
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
          <div className="flex items-baseline justify-between"><h2 className="rotulo m-0">{g.esp}</h2><span className="text-[12.5px] text-ink3">{g.meta}</span></div>
          {g.items.map((p) => (
            <article key={p.id} id={'proto-' + p.id} className={cx('grid scroll-mt-28 items-center gap-4 tarjeta px-5 py-4 transition-colors hover:bg-soft sm:grid-cols-[minmax(0,1fr)_auto]', foco === p.id && 'foco-proto')}>
              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5"><Pill>{p.estadoTxt}</Pill>{p.estudio && <Pill tono="acento">Estudio piloto</Pill>}{p.extraTxt && <Pill tono="warn">{p.extraTxt}</Pill>}{p.n && <span className="text-[11.5px] text-ink3">{p.n}</span>}</div>
                <h3 className="m-0 mb-1 text-[16.5px] font-bold leading-snug tracking-[-.015em] text-deep">{p.t}</h3>
                <p className="m-0 font-serif text-[14.5px] leading-normal text-ink2">{p.s}</p>
              </div>
              {p.abre ? (
                <div className="flex flex-wrap items-center gap-2 justify-self-start">
                  <Btn onClick={() => abrirProto(p.id, { libre: true })} className="!text-acentodeep">Abrir</Btn>
                  {DATOS[p.id]?.pdf && (
                    <Btn v="soft" icon="download" onClick={() => pdf(p.id)} disabled={bajando === p.id} title="Descargar el PDF para imprimir y llevar al box">
                      {bajando === p.id ? 'Preparando…' : 'PDF de box'}
                    </Btn>
                  )}
                </div>
              ) : <span className="text-[12.5px] font-semibold text-ink3">Planificado</span>}
            </article>
          ))}
        </section>
      ))}
      <SolicitudesProtocolo />
    </div>
  );
}

// Nombre corto de cada ficha del nivel 3, a partir del título que trae el contenido en data.js
const FICHA = {
  'ver fuentes': ['Fuentes', 'book'],
  'dónde se equivoca la gente': ['Errores', 'alert'],
  'dónde no hay acuerdo': ['Disenso', 'chat'],
  '¿y si mi caso es otro?': ['¿Y si mi caso es otro?', 'tool'],
  'ojo con esta evidencia': ['Ojo con la evidencia', 'alert']
};
const fichaDe = (t) => FICHA[t] || [t.charAt(0).toUpperCase() + t.slice(1), 'sparkle'];

// Enlaces de una fuente: url propia (verificada) o el DOI y PMID escritos en loc. Nunca se arma un enlace inventado.
export function enlacesFuente(f) {
  const txt = f.loc || '';
  const doi = (txt.match(/DOI\s+(10\.\d{4,9}\/[^\s·]+)/i) || [])[1];
  const pmid = (txt.match(/PMID\s+(\d+)/i) || [])[1];
  return {
    directo: f.url || (doi ? 'https://doi.org/' + doi : null),
    pubmed: pmid ? 'https://pubmed.ncbi.nlm.nih.gov/' + pmid + '/' : null
  };
}

function Fuente({ f }) {
  const e = enlacesFuente(f);
  const lnk = 'inline-flex items-center gap-1 text-[12px] font-semibold text-acento hover:underline';
  return (
    <div className="mt-2 rounded-rs bg-soft px-3.5 py-3">
      <Pill tono="acento" className="mb-1.5">{f.grado}</Pill>
      {e.directo ? (
        <a href={e.directo} target="_blank" rel="noopener noreferrer" className="group block text-[13px] leading-normal text-ink">
          <span className="underline decoration-acento/40 underline-offset-2 group-hover:decoration-acento">{f.cita}</span>
          <Ic n="ext" s={13} className="ml-1 inline align-[-2px] text-acento" />
        </a>
      ) : <div className="text-[13px] leading-normal text-ink">{f.cita}</div>}
      <div className="mt-1 text-[11.5px] leading-normal text-ink3">{f.loc}</div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {e.directo && <a href={e.directo} target="_blank" rel="noopener noreferrer" className={lnk}><Ic n="ext" s={12} />{/^https:\/\/doi\.org/.test(e.directo) ? 'Abrir el artículo' : 'Abrir la fuente'}</a>}
        {e.pubmed && <a href={e.pubmed} target="_blank" rel="noopener noreferrer" className={lnk}><Ic n="ext" s={12} />PubMed</a>}
      </div>
    </div>
  );
}

// Flecha que se dibuja sola (trazo animado). vertical en móvil, horizontal desde sm.
export function Flecha({ vertical, rotulo, className = '' }) {
  return (
    <div className={cx('flex flex-none items-center justify-center text-rotulo', vertical ? 'h-9 flex-col' : 'w-full', className)} aria-hidden="true">
      <svg className="flecha" width={vertical ? 16 : 52} height={vertical ? 36 : 16} viewBox={vertical ? '0 0 16 36' : '0 0 52 16'} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {vertical ? <><path d="M8 1v32" style={{ '--len': 34 }} /><path d="M3 28l5 5 5-5" style={{ '--len': 16, animationDelay: '.35s' }} /></>
          : <><path d="M1 8h48" style={{ '--len': 50 }} /><path d="M44 3l5 5-5 5" style={{ '--len': 16, animationDelay: '.35s' }} /></>}
      </svg>
      {rotulo && <span className="text-[10.5px] font-bold uppercase tracking-[.12em]">{rotulo}</span>}
    </div>
  );
}

// Árbol de decisión dibujado como diagrama: pregunta → (sí) → qué hacer
export function Arbol({ l }) {
  return (
    <div className="flex flex-col gap-6 sm:gap-3">
      {l.map((r, i) => (
        <div key={i} className="aparece grid items-center gap-1 sm:grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)] sm:gap-0" style={{ '--d': i * 160 + 'ms' }}>
          <div className="rounded-rs border border-line bg-card px-4 py-3 text-[13.5px] font-semibold leading-snug text-ink shadow-sh">{r.q}</div>
          <Flecha vertical rotulo="sí" className="sm:hidden" />
          <Flecha rotulo="sí" className="hidden sm:flex sm:flex-col" />
          <div className="rounded-rs bg-acentosoft px-4 py-3 text-[13.5px] leading-snug text-ink">{r.a}</div>
        </div>
      ))}
    </div>
  );
}

function Sub({ x }) {
  return (
    <div>
      {(x.parrafos || []).map((t, i) => <p key={i} className="m-0 mb-2.5 text-[14.5px] leading-[1.65] text-ink2">{t}</p>)}
      {x.arbol && <Arbol l={x.arbol} />}
      {(x.fuentes || []).map((f, i) => <Fuente key={i} f={f} />)}
    </div>
  );
}

function Aportes({ l }) {
  return l.map((c, k) => (
    <div key={k} className={cx('grid grid-cols-[32px_minmax(0,1fr)] gap-3 py-3', k > 0 && 'border-t border-line2')}>
      <div className="grid h-8 w-8 place-items-center rounded-full bg-acentosoft text-[11px] font-bold text-acentodeep">{c.av}</div>
      <div>
        <div className="text-[13.5px] leading-normal text-ink2"><b className="text-ink">{c.quien}</b> {c.marca && <span className="text-ok">{c.marca}</span>} {c.txt}</div>
        <div className="mt-1 flex flex-wrap gap-3 text-[11.5px] text-ink3"><span>{c.rol}</span><span>hace {c.cuando}</span><span>♡ {c.likes}</span></div>
      </div>
    </div>
  ));
}

// Descarga el PDF de box de un protocolo (archivo en public/)
async function bajarPdf(archivo, avisar) {
  try {
    const r = await fetch(archivo); if (!r.ok) throw new Error();
    await descargar(archivo, await r.blob(), avisar);
  } catch (e) { avisar('No se pudo obtener el PDF.', 'warn'); }
}

const reducido = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

/* Un paso en tres niveles, como en la presentación:
   1 · siempre visible (qué hacer y cuándo terminaste), 2 · por qué, 3 · fuente, errores, disenso y lo que reportan otros. */
export function Paso({ s, i, hecho, onToggle, grande, animar, leyendo, abrirPorque, autoPorque, mapa }) {
  const [ficha, setFicha] = useState(null);
  const [mas, setMas] = useState(false); // nivel 2 desplegable: cerrado de partida
  // Una orden externa (la voz: «por qué») abre el desplegable
  useEffect(() => { if (abrirPorque) setMas(true); }, [abrirPorque]);
  const porque = s.porque || [];
  const subs = s.sub || [];
  const aportes = s.aportes || [];
  const fichas = [...subs.map((x, k) => ({ k: 's' + k, t: fichaDe(x.titulo)[0], ic: fichaDe(x.titulo)[1], x })),
    ...(aportes.length ? [{ k: 'aportes', t: 'Otros casos · ' + aportes.length, ic: 'chat' }] : [])];
  const abierta = fichas.find((f) => f.k === ficha);
  // autoPorque (segundos, modo guiado): recorrido solo. Cada tantos segundos se abre lo siguiente
  // (el «¿Por qué?», después cada ficha: fuentes, errores, otros casos…) y la página baja para leerlo entero.
  // Tocar el «¿Por qué?» o una ficha detiene el recorrido.
  const etapas = [...(porque.length ? ['porque'] : []), ...fichas.map((f) => f.k)];
  const [auto, setAuto] = useState(!!autoPorque && etapas.length > 0);
  const [etapa, setEtapa] = useState(-1);
  const [falta, setFalta] = useState(autoPorque || 0);
  const refPorque = useRef(null);
  const refFichas = useRef(null);
  useEffect(() => {
    if (!auto || etapa >= etapas.length - 1) return;
    const t = setTimeout(() => {
      if (falta > 1) { setFalta(falta - 1); return; }
      const e = etapa + 1; const k = etapas[e];
      if (k === 'porque') setMas(true); else setFicha(k);
      setEtapa(e); setFalta(autoPorque);
    }, 1000);
    return () => clearTimeout(t);
  }, [auto, etapa, falta]);
  // Al abrirse algo, la página baja lo justo para verlo entero (después de que termina de desplegarse)
  useEffect(() => {
    if (!auto || etapa < 0) return;
    const el = etapas[etapa] === 'porque' ? refPorque.current : refFichas.current;
    const t = setTimeout(() => { try { el && el.scrollIntoView({ block: 'nearest', behavior: reducido() ? 'auto' : 'smooth' }); } catch (e) {} }, 450);
    return () => clearTimeout(t);
  }, [etapa]);
  const detener = () => setAuto(false);
  const contando = auto && etapa === -1 && etapas[0] === 'porque';
  const pre = 'Terminaste cuando';
  const listo = s.listo || '';
  // animar: cada nivel entra después del anterior (modo guiado)
  const nivel = (k) => animar ? { className: 'aparece', style: { '--d': 120 + k * 170 + 'ms' } } : { className: '', style: undefined };
  return (
    <section id={'paso-' + (i + 1)} className={cx('flex scroll-mt-24 flex-col', grande ? 'gap-3' : 'tarjeta gap-2 p-2 sm:gap-2.5 sm:p-2.5')}>
      <div className={cx('panel transition-shadow duration-300', grande ? 'relative overflow-hidden p-6 shadow-shlg sm:p-10 [&>*:not(.marca-agua)]:relative' : 'p-5 sm:p-6', hecho && 'shadow-[inset_0_0_0_2px_var(--menta)]', nivel(0).className)} style={nivel(0).style}>
        {mapa && <div className="-mx-2 mb-5 sm:mb-7">{mapa}</div>}
        {grande && <span aria-hidden="true" className="marca-agua pointer-events-none absolute -right-3 -top-8 select-none text-[150px] font-extrabold leading-none tracking-[-.06em] text-menta sm:-top-12 sm:text-[230px]">{nn(i)}</span>}
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[.13em] text-menta">
              <span>Paso {nn(i)}{s.corto && <span className="font-semibold normal-case tracking-normal text-panelink2"> · {s.corto}</span>}</span>
              {leyendo && <span className="barras inline-flex h-3 items-end gap-[3px]" aria-label="Leyendo en voz alta"><i /><i /><i /><i /></span>}
            </div>
            {s.marca && s.marca !== '✓' && <span className="mt-2 inline-flex rounded-full bg-warnsoft px-2.5 py-[3px] text-[11px] font-bold text-warn">{s.marca}</span>}
          </div>
          <button type="button" onClick={onToggle} aria-pressed={hecho} aria-label={(hecho ? 'Desmarcar' : 'Marcar hecho') + ' el paso ' + nn(i)}
            className={cx('flex flex-none items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors', hecho ? 'bg-menta text-mentaink' : 'bg-panel2 text-panelink2 hover:text-panelink')}>
            <Ic n="check" s={15} sw={2.4} />{hecho ? 'Hecho' : 'Marcar'}
          </button>
        </div>
        <p className={cx('m-0 font-bold leading-snug text-panelink [text-wrap:pretty]', grande ? 'text-[22px] sm:text-[30px] sm:leading-[1.2] xl:text-[34px]' : 'text-[18px] sm:text-[20px]')}>{s.hacer}</p>
        {s.cond && <p className="m-0 mt-2 text-[13.5px] leading-normal text-panelink2">{s.cond}</p>}
        <p className={cx('m-0 leading-[1.6] text-panelink', grande ? 'mt-5 text-[16px] sm:text-[18px]' : 'mt-3.5 text-[15px]')}>
          {listo.startsWith(pre) ? <><b className="font-bold text-menta">{pre}</b>{listo.slice(pre.length)}</> : listo}
        </p>
        {s.sinEv && <p className="m-0 mt-3.5 rounded-rs border border-dashed border-navline px-3 py-2 text-[12.5px] leading-normal text-panelink2">◻ {s.sinEv}</p>}
      </div>

      {s.disputa && (
        <div className={cx('rounded-[20px] bg-warnsoft px-5 py-4', nivel(1).className)} style={nivel(1).style}>
          <div className="mb-1 text-[11.5px] font-bold uppercase tracking-[.13em] text-warn">En disputa</div>
          <p className="m-0 text-[13.5px] leading-normal text-warn">{s.disputa}</p>
        </div>
      )}

      {porque.length > 0 && (
        <div ref={refPorque} className={cx('suave scroll-mb-[110px] scroll-mt-24 overflow-hidden', nivel(1).className)} style={nivel(1).style}>
          <button type="button" onClick={() => { detener(); setMas(!mas); }} aria-expanded={mas}
            className={cx('group relative flex w-full items-center gap-3 px-5 py-4 text-left', grande ? 'sm:px-9 sm:py-5' : 'sm:px-6')}>
            <span className="rotulo flex-1">¿Por qué?</span>
            {!mas && <span className="hidden min-w-0 flex-[3] truncate text-[13px] text-ink3 sm:block">{porque[0]}</span>}
            {contando && <span className="flex-none text-[12px] font-semibold tabular-nums text-ink3" aria-live="polite">Se abre en {falta} s</span>}
            <span className={cx('grid h-8 w-8 flex-none place-items-center rounded-full bg-card text-acento shadow-sh transition-transform duration-300 group-hover:scale-105', mas && 'rotate-180')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </span>
          </button>
          <div className={cx('despliega', mas && 'abierto')}>
            <div className={cx('min-h-0', grande ? 'px-5 sm:px-9' : 'px-5 sm:px-6')}>
              <div className={cx('pb-4', grande && 'sm:pb-7')}>
                {porque.map((t, k) => <p key={k} className={cx('m-0 mb-2 leading-[1.6] text-ink', grande ? 'text-[15.5px] sm:text-[17px]' : 'text-[15px]', mas && 'aparece')} style={mas ? { '--d': k * 90 + 'ms' } : undefined}>{t}</p>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {fichas.length > 0 && (
        <div ref={refFichas} className={cx('scroll-mb-[110px] scroll-mt-24', grande ? 'px-2 pt-1 sm:px-4' : 'rounded-[20px] border border-line px-4 py-4 sm:px-6 sm:py-5', nivel(2).className)} style={nivel(2).style}>
          <div className="rotulo mb-3">Fuente y otros casos</div>
          <div className="flex flex-wrap gap-2" role="group" aria-label={'Más sobre el paso ' + nn(i)}>
            {fichas.map((f) => {
              const on = ficha === f.k;
              return (
                <button key={f.k} type="button" onClick={() => { detener(); setFicha(on ? null : f.k); }} aria-expanded={on}
                  className={cx('inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors', on ? 'bg-panel text-panelink' : 'bg-soft text-ink2 hover:bg-acentosoft hover:text-acentodeep')}>
                  <Ic n={f.ic} s={14} className={on ? 'text-menta' : 'text-rotulo'} />{f.t}
                </button>
              );
            })}
          </div>
          {abierta && (
            <div className="mt-4 border-t border-line pt-4">
              {abierta.x ? <Sub x={abierta.x} /> : <Aportes l={aportes} />}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ModoBox({ d, hechos, toggle, reiniciar }) {
  const n = hechos.length, tot = d.pasos.length;
  return (
    <div className="tarjeta p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="rotulo">Modo box</span>
        <b className="text-[13px] tabular-nums text-acentodeep">{n} de {tot}</b>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-soft"><div className="h-1.5 rounded-full bg-[linear-gradient(90deg,var(--acento),var(--menta))] transition-all" style={{ width: Math.round(n / tot * 100) + '%' }} /></div>
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
  const { protoId, protoLibre, protoTodo, go, checks, setChecks, nuevoCaso, avisar, casos, abrirCaso, myUid, verPerfil, esDocente } = useApp();
  const d = DATOS[protoId] || DATOS['cementado-pmma'];
  const id = DATOS[protoId] ? protoId : 'cementado-pmma';
  const hechos = checks[id] || [];
  const toggle = (i) => setChecks((c) => { const l = c[id] || []; return { ...c, [id]: l.includes(i) ? l.filter((x) => x !== i) : [...l, i].sort((a, b) => a - b) }; });
  const reiniciar = () => setChecks((c) => ({ ...c, [id]: [] }));
  const marcar = (i) => setChecks((c) => { const l = c[id] || []; return l.includes(i) ? c : { ...c, [id]: [...l, i].sort((a, b) => a - b) }; });
  const [modo, setModoRaw] = useState(() => protoTodo ? 'todo' : protoLibre ? 'guiado' : leerModo());
  const setModo = (m) => { setModoRaw(m); guardarModo(m); setLibreAlEntrar(false); window.scrollTo({ top: 0 }); };
  const [libreAlEntrar, setLibreAlEntrar] = useState(protoLibre); // solo la primera vez: al volver de «Ver todo» no se reabre
  const [bajando, setBajando] = useState(false);
  const aprobadores = useAprobadoresProtocolo(id, esDocente);
  const casosDeEste = casos.filter((c) => c.protocoloId === id && (c.autorUid === myUid || c.autor?.id === myUid));
  const bajarPdfProto = async () => { setBajando(true); await bajarPdf(d.pdf, avisar); setBajando(false); };
  const lado = (
    <>
      <div className="flex flex-col gap-2">
        {esDocente && <Btn v="primary" icon="plus" onClick={() => nuevoCaso({ protocoloId: id, especialidad: d.esp === 'Cirugía bucal' ? 'Cirugía bucal' : d.esp })}>Registrar un caso con este protocolo</Btn>}
        {d.pdf && <Btn icon="download" onClick={bajarPdfProto} disabled={bajando}>{bajando ? 'Preparando…' : 'Descargar el PDF de box'}</Btn>}
      </div>
      {esDocente && casosDeEste.length > 0 && (
        <div className="tarjeta p-4">
          <h2 className="m-0 mb-2 rotulo">Tus casos con este protocolo</h2>
          {casosDeEste.map((c) => (
            <button key={c.id} type="button" onClick={() => abrirCaso(c.id)} className="flex w-full items-center justify-between gap-2 border-t border-line2 py-2 text-left text-[13px] text-ink2 first:border-0 hover:text-ink">
              <span className="min-w-0 truncate">{c.dientes} · {c.titulo}</span><EstadoPill estado={c.estado} />
            </button>
          ))}
        </div>
      )}
      <div className="hidden xl:block"><ModoBox d={d} hechos={hechos} toggle={toggle} reiniciar={reiniciar} /></div>
      <div>
        <h2 className="m-0 mb-2.5 rotulo">Estado de la evidencia</h2>
        <div className="tarjeta px-4 py-1.5">
          {d.evidencia.map((e) => (
            <div key={e.n} className="grid grid-cols-[26px_minmax(0,1fr)] gap-2 border-b border-line2 py-2.5 last:border-0">
              <span className="text-[12px] font-bold tabular-nums text-ink3">{e.n}</span>
              <div><div className="text-[11.5px] font-semibold text-acentodeep">{e.grado}</div><div className="mt-0.5 text-[12.5px] leading-normal text-ink2">{e.txt}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="m-0 mb-2.5 rotulo">Reglas del validador</h2>
        <div className="flex flex-col gap-2 rounded-r bg-soft p-4 font-serif text-[13.5px] leading-relaxed text-ink2">
          <p className="m-0">Una revisión no otorga un grado superior al de los estudios que resume.</p>
          <p className="m-0">Un grado C no desplaza una práctica establecida: el paso queda en disputa.</p>
          <p className="m-0">Lo que no tiene respaldo se publica marcado como sin evidencia.</p>
        </div>
      </div>
    </>
  );
  const registrar = () => nuevoCaso({ protocoloId: id, especialidad: d.esp === 'Cirugía bucal' ? 'Cirugía bucal' : d.esp });
  if (modo === 'guiado') {
    return <Guiado key={id} d={d} hechos={hechos} toggle={toggle} marcar={marcar} reiniciar={reiniciar} libreInicial={libreAlEntrar}
      onPdf={d.pdf ? bajarPdfProto : null} bajando={bajando}
      onVerTodo={() => setModo('todo')} onRegistrar={esDocente ? registrar : null} volver={() => go('biblioteca')} />;
  }
  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={() => go('biblioteca')} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] text-ink2 hover:bg-soft"><Ic n="back" s={14} />Biblioteca</button>
          <Btn sm v="primary" icon="sparkle" onClick={() => setModo('guiado')}>Modo guiado · paso a paso</Btn>
        </div>
        <Aviso className="mb-5 !text-[12px]">{d.bandera}</Aviso>
        <header className="border-b border-line pb-5">
          <p className="rotulo m-0 mb-3">{d.esp} · Protocolo</p>
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

        <details className="mt-5 tarjeta xl:hidden">
          <summary className="flex items-center justify-between gap-3 px-5 py-4 text-[14.5px] font-bold text-deep">
            <span>Modo box · marca lo que ya hiciste</span><span className="text-[13px] tabular-nums text-acentodeep">{hechos.length} de {d.pasos.length}</span>
          </summary>
          <div className="px-3 pb-3"><ModoBox d={d} hechos={hechos} toggle={toggle} reiniciar={reiniciar} /></div>
        </details>

        <details className="mt-3 tarjeta xl:mt-5">
          <summary className="flex items-center justify-between gap-3 px-5 py-4 text-[14.5px] font-bold text-deep">
            <span>Antes de empezar · monta la bandeja</span><span className="text-[12px] font-semibold text-acentodeep">abrir / cerrar</span>
          </summary>
          <div className="grid gap-5 px-5 pb-5 pt-1 sm:grid-cols-2 lg:grid-cols-3">
            {d.bandeja.map((b) => (
              <div key={b.fase}>
                <h4 className="rotulo m-0 mb-2">{b.fase}</h4>
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
