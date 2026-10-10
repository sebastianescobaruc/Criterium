// Herramientas: calculadoras clínicas con el resultado dibujado, no solo escrito.
// Mismo lenguaje que el mapa del inicio: colores de Criterium, rótulos espaciados, cifras grandes y nada de recuadros pesados.
// Las reglas de cada cálculo viven en logic.js (perio, endo, anestesia, anestesiaNino); aquí solo se muestran.
import React, { useState } from 'react';
import { perio, endo, anestesia, anestesiaNino, ANEST_NINO } from '../logic.js';
import { useApp } from '../ctx.js';
import { Aviso, cx } from '../ui.jsx';
import { Periodontograma } from './periodontograma.jsx';
// En Criterium Red no se nombran los protocolos: el mismo dato se cuenta sin ellos
// Desde la fusión (2026-10-09) la Red también tiene protocolos: los textos de origen vuelven a nombrarlos
const segun = (completa) => completa;

/* ── Piezas de entrada ── */

// Número con − y +: grande y cómodo con guantes. Acepta vacío cuando el dato es opcional.
function Paso({ id, label, value, onChange, step = 1, min = 0, max, unidad, hint, placeholder }) {
  const n = parseFloat(String(value).replace(',', '.'));
  const mover = (d) => {
    const base = isNaN(n) ? (d > 0 ? min : min) : n;
    let v = Math.round((base + d * step) * 10) / 10;
    if (v < min) v = min; if (max != null && v > max) v = max;
    onChange(String(v));
  };
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12.5px] font-semibold leading-snug text-ink2">{label}</label>
      <div className="flex items-center gap-1 rounded-full bg-soft p-1">
        <button type="button" onClick={() => mover(-1)} aria-label={'Bajar ' + label} className="grid h-10 w-10 flex-none place-items-center rounded-full bg-card text-[20px] font-bold text-acento shadow-sh active:scale-95">−</button>
        <div className="flex min-w-0 flex-1 items-baseline justify-center gap-1">
          <input id={id} type="number" inputMode="decimal" step={step} min={min} max={max} value={value} placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-w-0 bg-transparent text-center text-[21px] font-extrabold tabular-nums text-deep outline-none placeholder:text-[13px] placeholder:font-semibold placeholder:text-ink3 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
          {unidad && value !== '' && <span className="flex-none pr-1 text-[12px] font-semibold text-ink3">{unidad}</span>}
        </div>
        <button type="button" onClick={() => mover(1)} aria-label={'Subir ' + label} className="grid h-10 w-10 flex-none place-items-center rounded-full bg-card text-[20px] font-bold text-acento shadow-sh active:scale-95">+</button>
      </div>
      {hint && <span className="text-[11.5px] leading-snug text-ink3">{hint}</span>}
    </div>
  );
}

// Opciones de una sola elección, como interruptor
function Elige({ label, value, onChange, opciones = [['no', 'No'], ['si', 'Sí']] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-semibold leading-snug text-ink2">{label}</span>
      <div className="flex rounded-full bg-soft p-1" role="radiogroup" aria-label={label}>
        {opciones.map(([v, t]) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
            className={cx('min-h-[40px] flex-1 rounded-full px-3 text-[13px] font-semibold leading-tight transition-colors', value === v ? 'bg-acento text-onc shadow-sh' : 'text-ink2 hover:text-ink')}>{t}</button>
        ))}
      </div>
    </div>
  );
}

// Explicación numerada: cada línea del razonamiento con su número
function Razones({ titulo, items }) {
  return (
    <div>
      <p className="rotulo m-0 mb-2.5">{titulo}</p>
      <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
        {items.map((r, i) => (
          <li key={i} className="grid grid-cols-[26px_minmax(0,1fr)] items-baseline gap-2">
            <b className="text-[15px] font-extrabold tabular-nums text-acento">{i + 1}</b>
            <span className="text-[13.5px] leading-relaxed text-ink2">{r}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// De dónde sale el cálculo y qué falta: plegado para no robar la vista
function Origen({ items }) {
  return (
    <details className="group border-t border-line pt-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="rotulo">De dónde sale esto y qué falta</span>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-soft text-acento transition-transform group-open:rotate-45">+</span>
      </summary>
      <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
        {items.map((x, i) => <li key={i} className="border-l-2 border-menta pl-3 text-[13px] leading-relaxed text-ink2">{x}</li>)}
      </ul>
    </details>
  );
}

// Glifos de cada herramienta: línea fina, color de la marca
function Glifo({ n }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      {n === 'perio' && <><path d="M5 27h24" {...p} /><path d="M8 27v-5M14 27v-9M20 27v-13M26 27v-18" {...p} strokeWidth="3" /></>}
      {n === 'periodonto' && <><path d="M4 12c3 0 3 3 6 3s3-3 6-3 3 3 6 3 3-3 6-3" {...p} /><path d="M7 15v10M13 15v12M19 15v12M25 15v10" {...p} /><circle cx="13" cy="21" r="1.4" fill="currentColor" /></>}
      {n === 'endo' && <><path d="M11 5h12l-4 24h-4z" {...p} /><path d="M17 6v21" {...p} strokeDasharray="2 2.5" /><path d="M13 21h8" {...p} strokeWidth="2.4" /></>}
      {n === 'anest' && <><rect x="12" y="4" width="10" height="24" rx="3" {...p} /><path d="M12 17h10" {...p} /><path d="M17 28v3" {...p} /><path d="M14.5 20h5v5h-5z" fill="currentColor" stroke="none" opacity=".35" /></>}
    </svg>
  );
}

const HERR = [
  { v: 'perio', esp: 'Periodoncia', t: 'Estadio y grado' },
  { v: 'periodonto', esp: 'Periodoncia', t: 'Periodontograma' },
  { v: 'endo', esp: 'Endodoncia', t: 'Step-back' },
  { v: 'anest', esp: 'Anestesia', t: 'Dosis máxima' }
];

export function Herramientas() {
  const { herrTab: tab, setHerrTab: setTab } = useApp();
  const [st, setSt] = useState({
    pCal: '5', pRbl: '40', pEdad: '45', pPerdidos: '0', pPs: '6', pExt: '30', pVert: 'no', pFurca: 'no', pSt4: 'no', pTabaco: '0', pHba: '',
    eTipo: 'necro', eLrd: '22', eLad: '', eLi: '15', eLm: '30', eAmplio: 'no',
    aPeso: '60', aUsados: '0',
    aModo: 'adulto', nPeso: '20', nEdad: '6', nAnest: 'lido', nUsados: '0', nSeda: 'no'
  });
  const f = (k) => (v) => setSt((s) => ({ ...s, [k]: v }));
  const [chart, setChart] = useState({});
  const [desdePerio, setDesdePerio] = useState(null);
  const usarPeriodontograma = (r) => {
    setSt((s) => ({ ...s, pCal: String(r.nicMax), pPs: r.psMax === null ? s.pPs : String(r.psMax), pFurca: r.furcaAvanzada ? 'si' : 'no', pSt4: r.movilidad2 ? 'si' : s.pSt4 }));
    setDesdePerio(r); setTab('perio');
  };
  const actual = HERR.find((h) => h.v === tab) || HERR[0];

  return (
    <div className="mx-auto flex max-w-[1040px] flex-col gap-7">
      <header>
        <p className="rotulo m-0 mb-1.5">Herramientas</p>
        <h1 className="m-0 max-w-[24ch] text-[28px] font-extrabold leading-[1.1] tracking-[-.03em] text-deep sm:text-[36px]">Calcula en el box, con el razonamiento a la vista.</h1>
        <p className="m-0 mt-3 max-w-[64ch] text-[14.5px] leading-relaxed text-ink2">Vienen con un paciente de ejemplo. Cambia los datos y el resultado se redibuja al instante. Si un umbral está en discusión, se dice.</p>
      </header>

      {/* Selector: cuatro herramientas como piezas de la misma familia */}
      <nav aria-label="Herramientas" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {HERR.map((h) => {
          const on = h.v === actual.v;
          return (
            <button key={h.v} type="button" onClick={() => setTab(h.v)} aria-current={on ? 'page' : undefined}
              className={cx('group relative flex flex-col items-start gap-2 overflow-hidden rounded-[18px] px-4 pb-3.5 pt-3 text-left transition-colors', on ? 'bg-panel text-panelink ring-1 ring-menta' : 'bg-soft text-ink hover:bg-acentosoft')}>
              <span className={on ? 'text-menta' : 'text-acento'}><Glifo n={h.v} /></span>
              <span>
                <span className={cx('block text-[10px] font-bold uppercase tracking-[.14em]', on ? 'text-panelink2' : 'text-rotulo')}>{h.esp}</span>
                <span className="block text-[15px] font-bold leading-tight">{h.t}</span>
              </span>
              {on && <span className="absolute bottom-0 left-4 h-[3px] w-10 rounded-t-full bg-menta" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      <p className="m-0 -mt-3 text-[11.5px] font-semibold uppercase tracking-[.12em] text-warn">Borrador · umbrales sin verificar contra la fuente · no usar en un paciente</p>

      {actual.v === 'periodonto' && <Periodontograma chart={chart} setChart={setChart} onUsar={usarPeriodontograma} />}
      {actual.v === 'perio' && <Perio st={st} f={f} desde={desdePerio} />}
      {actual.v === 'endo' && <Endo st={st} f={f} />}
      {actual.v === 'anest' && <Anestesia st={st} f={f} />}
    </div>
  );
}

/* ═══ Periodoncia: estadio y grado ═══ */
function Perio({ st, f, desde }) {
  const r = perio(st);
  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col gap-4">
        {desde && <Aviso tono="acento">Datos del periodontograma: NIC interdental máximo {desde.nicMax} mm ({desde.nicMaxDiente}), sondaje máximo {desde.psMax} mm, furca II o III: {desde.furcaAvanzada ? 'sí' : 'no'}{desde.movilidad2 ? ', movilidad 2 o más' : ''}. Completa tú la pérdida ósea, la edad, los dientes perdidos y la extensión.</Aviso>}
        <p className="rotulo m-0">Severidad</p>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Paso id="pCal" label="CAL interdental máxima" unidad="mm" step={0.5} value={st.pCal} onChange={f('pCal')} />
          <Paso id="pRbl" label="Pérdida ósea radiográfica" unidad="% raíz" step={5} max={100} value={st.pRbl} onChange={f('pRbl')} />
          <Paso id="pPerdidos" label="Dientes perdidos por periodontitis" value={st.pPerdidos} onChange={f('pPerdidos')} />
          <Paso id="pPs" label="Sondaje máximo" unidad="mm" value={st.pPs} onChange={f('pPs')} />
        </div>
        <p className="rotulo m-0 mt-2">Complejidad y extensión</p>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Elige label="Defecto vertical de 3 mm o más" value={st.pVert} onChange={f('pVert')} />
          <Elige label="Furca clase II o III" value={st.pFurca} onChange={f('pFurca')} />
          <Elige label="Colapso de mordida, movilidad 2+ o menos de 20 dientes" value={st.pSt4} onChange={f('pSt4')} />
          <Paso id="pExt" label="Sitios afectados" unidad="%" step={5} max={100} value={st.pExt} onChange={f('pExt')} />
        </div>
        <p className="rotulo m-0 mt-2">Grado</p>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Paso id="pEdad" label="Edad" unidad="años" min={1} value={st.pEdad} onChange={f('pEdad')} />
          <Paso id="pTabaco" label="Cigarrillos al día" value={st.pTabaco} onChange={f('pTabaco')} />
          <Paso id="pHba" label="HbA1c, si es diabético" unidad="%" step={0.1} value={st.pHba} onChange={f('pHba')} placeholder="no aplica" />
        </div>
      </div>

      <div className="flex flex-col gap-7 lg:sticky lg:top-24 lg:self-start">
        {!r.listo ? <p className="m-0 text-[14px] text-ink3">{r.aviso}</p> : <>
          <div>
            <p className="rotulo m-0 mb-2">Diagnóstico</p>
            <h2 className="m-0 text-[24px] font-extrabold leading-[1.15] tracking-[-.02em] text-deep sm:text-[28px]">Periodontitis estadio {r.estadio}, grado {r.grado}</h2>
            <p className="m-0 mt-1.5 text-[14px] text-ink2">{r.extension.charAt(0).toUpperCase() + r.extension.slice(1)}.</p>
          </div>

          {/* Escala de estadios: el tramo actual en menta, los anteriores en verde azulado */}
          <div>
            <div className="flex items-baseline justify-between"><p className="rotulo m-0">Estadio</p><b className="text-[40px] font-extrabold leading-none tracking-[-.04em] text-deep">{r.estadio}</b></div>
            <div className="mt-3 grid grid-cols-4 gap-1.5" aria-hidden="true">
              {[1, 2, 3, 4].map((e) => <span key={e} className={cx('h-2.5 rounded-full transition-colors duration-500', e < r.estadioN ? 'bg-acento' : e === r.estadioN ? 'bg-menta' : 'bg-soft')} />)}
            </div>
            <div className="mt-1.5 grid grid-cols-4 text-[10.5px] font-bold uppercase tracking-[.14em] text-ink3">
              {['I', 'II', 'III', 'IV'].map((x, i) => <span key={x} className={i + 1 === r.estadioN ? 'text-deep' : ''}>{x}</span>)}
            </div>
          </div>

          {/* Grado: tres velocidades de progresión */}
          <div>
            <div className="flex items-baseline justify-between"><p className="rotulo m-0">Grado · velocidad</p><b className="text-[40px] font-extrabold leading-none tracking-[-.04em] text-deep">{r.grado}</b></div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[['A', 'lenta'], ['B', 'moderada'], ['C', 'rápida']].map(([g, t]) => (
                <div key={g} className={cx('flex items-center gap-2 rounded-full px-3 py-2 transition-colors', g === r.grado ? 'bg-panel text-panelink' : 'bg-soft text-ink3')}>
                  <span className={cx('grid h-6 w-6 flex-none place-items-center rounded-full text-[12px] font-extrabold', g === r.grado ? 'bg-menta text-mentaink' : 'bg-card text-ink3')}>{g}</span>
                  <span className="text-[12.5px] font-semibold">{t}</span>
                </div>
              ))}
            </div>
          </div>

          <Razones titulo="Cómo salió el estadio" items={r.porque} />
          <Razones titulo="Cómo salió el grado" items={r.porqueG} />
        </>}
        <Origen items={[
          'Todos los umbrales están escritos de memoria y hay que contrastarlos uno por uno contra los artículos de la clasificación de 2018, no contra un resumen.',
          'Falta la evidencia directa como criterio de grado: pérdida de inserción o de hueso medida en 5 años. Aquí solo está la razón pérdida ósea sobre edad, que es evidencia indirecta.',
          'Falta el fenotipo del caso como criterio de grado: cuánta destrucción hay comparada con la cantidad de biofilm.',
          'No distingue el patrón incisivo-molar dentro de la extensión.',
          'La calculadora no diagnostica: asume que ya decidiste que es periodontitis y no gingivitis ni otra condición.'
        ]} />
      </div>
    </section>
  );
}

/* ═══ Endodoncia: step-back con el conducto dibujado a escala ═══ */
function Conducto({ n }) {
  // Escala vertical: 0 mm arriba (referencia coronal), LRD abajo (ápice)
  const top = 30, alto = 360, W = 420, cx0 = 150;
  const y = (mm) => top + (mm / n.lrd) * alto;
  const ancho = (mm) => 30 - (mm / n.lrd) * 25; // el conducto se angosta hacia el ápice
  const forma = `M${cx0 - 34},${top - 18} L${cx0 + 34},${top - 18} L${cx0 + ancho(0)},${y(0)} L${cx0 + 3},${y(n.lrd)} L${cx0 - 3},${y(n.lrd)} L${cx0 - ancho(0)},${y(0)} Z`;
  const marcas = [
    { mm: n.dosTercios, t: '2/3 LAD', s: 'tope de Gates y aguja', cls: 'marca-gates' },
    { mm: n.cateterismo, t: 'LAD − 2', s: 'cateterismo #10', cls: 'marca-cat' },
    { mm: n.lt, t: 'LT', s: 'longitud de trabajo', cls: 'marca-lt' },
    { mm: n.pasaje, t: 'Pasaje', s: 'LT + 1, sin cortar', cls: 'marca-pasaje' }
  ].filter((m) => m.mm > 0 && m.mm <= n.lrd + 1.2).sort((a, b) => a.mm - b.mm);
  // Separa etiquetas que caerían encima de otra
  let ult = -99; const ys = marcas.map((m) => { const v = Math.max(y(m.mm), ult + 30); ult = v; return v; });
  const mm = (v) => (Math.round(v * 10) / 10).toString().replace('.', ',');
  return (
    <svg viewBox={`0 0 ${W} ${top + alto + 40}`} className="conducto mx-auto block w-full max-w-[420px]" role="img" aria-label={'Conducto de ' + mm(n.lrd) + ' mm con la longitud de trabajo a ' + mm(n.lt) + ' mm'}>
      <path d={forma} className="raiz" />
      <line x1={cx0} y1={top - 10} x2={cx0} y2={y(n.lt)} className="lima-eje" />
      {/* Escalonado: cada lima del step-back marca su profundidad a la izquierda */}
      {n.escalones.map((e, i) => (
        <g key={i} className="escalon" style={{ '--d': i * 80 + 'ms' }}>
          <line x1={cx0 - ancho(e.prof) - 2} x2={cx0 + ancho(e.prof) + 2} y1={y(e.prof)} y2={y(e.prof)} />
          <text x={cx0 - 46} y={y(e.prof) + 4} textAnchor="end">{e.lima.replace(' · maestra', '')}</text>
        </g>
      ))}
      {marcas.map((m, i) => (
        <g key={m.t} className={cx('marca', m.cls)}>
          <line x1={cx0 - ancho(Math.min(m.mm, n.lrd)) - 6} x2={cx0 + 52} y1={y(m.mm)} y2={y(m.mm)} />
          <path d={`M${cx0 + 52},${y(m.mm)} L${cx0 + 64},${ys[i]}`} className="guia" />
          <text x={cx0 + 70} y={ys[i] - 2} className="mt">{m.t} · {mm(m.mm)} mm</text>
          <text x={cx0 + 70} y={ys[i] + 12} className="ms">{m.s}</text>
        </g>
      ))}
      <text x={cx0 - 46} y={y(n.lrd) + 4} textAnchor="end" className="apice">ápice · LRD {mm(n.lrd)}</text>
      <text x={cx0} y={top - 24} textAnchor="middle" className="apice">referencia coronal</text>
    </svg>
  );
}

function Endo({ st, f }) {
  const r = endo(st);
  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col gap-4">
        <p className="m-0 max-w-[60ch] text-[14px] leading-relaxed text-ink2">Pon la longitud que te dio el localizador y sale la secuencia completa, con los milímetros calculados. Repite conducto por conducto: las longitudes no son iguales.</p>
        <Elige label="Tratamiento" value={st.eTipo} onChange={f('eTipo')} opciones={[['necro', 'Necropulpectomía'], ['biopulp', 'Biopulpectomía']]} />
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Paso id="eLrd" label="LRD · longitud real" unidad="mm" step={0.5} min={10} max={35} value={st.eLrd} onChange={f('eLrd')} />
          <Paso id="eLad" label="LAD · longitud aparente" unidad="mm" step={0.5} min={10} max={35} value={st.eLad} onChange={f('eLad')} placeholder="igual a la LRD" />
          <Paso id="eLi" label="Lima inicial" step={5} min={6} value={st.eLi} onChange={f('eLi')} />
          <Paso id="eLm" label="Lima maestra · mínimo 30" step={5} min={30} value={st.eLm} onChange={f('eLm')} />
        </div>
        <Elige label="Calibre del conducto" value={st.eAmplio} onChange={f('eAmplio')} opciones={[['no', 'Fino o medio · 1-2-1'], ['si', 'Amplio · 3-2-1']]} />
        {r.listo && (
          <dl className="m-0 mt-2 grid grid-cols-2 gap-x-5 gap-y-4">
            {[[r.lt, 'Longitud de trabajo', true], [r.permeabilidad, 'Lima de pasaje'], [r.dosTercios, 'Tope de Gates y aguja'], [r.cateterismo, 'Margen del cateterismo']].map(([v, t, fuerte]) => (
              <div key={t}>
                <dt className="text-[10.5px] font-bold uppercase tracking-[.14em] text-rotulo">{t}</dt>
                <dd className={cx('m-0 font-extrabold tabular-nums tracking-[-.03em] text-deep', fuerte ? 'text-[34px] leading-tight' : 'text-[22px]')}>{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {!r.listo ? <p className="m-0 text-[14px] text-ink3">{r.aviso}</p> : <>
          <Conducto n={r.num} />
          <div className="grid gap-2.5 sm:grid-cols-3">
            {[['Irrigante', r.irrigante], ['Gates Glidden', r.gates + '. Hasta 3 entradas por conducto.'], ['Entre sesiones', 'Hidróxido de calcio hasta ' + r.medicacion]].map(([t, v]) => (
              <div key={t} className="border-l-2 border-menta pl-3">
                <p className="m-0 text-[10.5px] font-bold uppercase tracking-[.14em] text-rotulo">{t}</p>
                <p className="m-0 mt-0.5 text-[13px] leading-snug text-ink2">{v}</p>
              </div>
            ))}
          </div>

          {/* Escalera de limas: el largo de cada barra es la profundidad a la que trabaja */}
          {[['1.ª fase · ampliación apical', r.fase1, false], ['2.ª fase · escalonado', r.fase2, true]].map(([t, l, esc]) => (
            <div key={t}>
              <p className="rotulo m-0 mb-2.5">{t}</p>
              <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
                {l.map((x, i) => {
                  const prof = parseFloat(x.prof.replace(',', '.'));
                  return (
                    <li key={i} className="grid grid-cols-[86px_minmax(0,1fr)] items-center gap-3" title={x.nota}>
                      <b className="text-[13.5px] tabular-nums text-deep">{x.lima}</b>
                      <div className="relative h-7 overflow-hidden rounded-full bg-soft">
                        <span className={cx('absolute inset-y-0 left-0 rounded-full', esc ? 'bg-acento' : 'bg-menta')} style={{ width: (prof / r.num.lrd) * 100 + '%' }} />
                        <span className={cx('absolute inset-y-0 left-3 flex items-center text-[12px] font-bold tabular-nums', esc ? 'text-onc' : 'text-mentaink')}>{x.prof}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
          <p className="m-0 text-[13.5px] leading-relaxed text-ink2">{r.empalme} Entre cada lima: irrigar, recapitular con la maestra a LT, irrigar, pasaje, irrigar.</p>
          <Aviso>{r.conflicto}</Aviso>
        </>}
        <Origen items={[
          segun('Las reglas vienen del protocolo de bio/necropulpectomía de premolar superior: LT igual a LRD menos 1 mm, pasaje a LT más 1 mm, Gates y aguja a dos tercios de la LAD, lima maestra mínima 30, step-back hasta 50.',
            'Las reglas vienen de un borrador de Criterium para bio/necropulpectomía de premolar superior, todavía sin revisión de especialista: LT igual a LRD menos 1 mm, pasaje a LT más 1 mm, Gates y aguja a dos tercios de la LAD, lima maestra mínima 30, step-back hasta 50.'),
          segun('El escalonado de menos 1, menos 2 y menos 3 mm está en el protocolo. Seguir bajando hasta llegar al 50 es una extensión de esa regla, no algo que el documento diga paso por paso.',
            'El escalonado de menos 1, menos 2 y menos 3 mm está en ese borrador. Seguir bajando hasta llegar al 50 es una extensión de esa regla, no algo que el documento diga paso por paso.'),
          segun('La biopulpectomía está resuelta con la misma resta de 1 mm. El protocolo dice 1 a 1,5 mm para ese caso: hay que decidir cuál se usa.',
            'La biopulpectomía está resuelta con la misma resta de 1 mm. El borrador dice 1 a 1,5 mm para ese caso: hay que decidir cuál se usa.'),
          segun('Falta el número de limas por encima de la inicial: el protocolo dice 4 o 5 en necropulpectomía, y eso todavía no entra en el cálculo.',
            'Falta el número de limas por encima de la inicial: el borrador dice 4 o 5 en necropulpectomía, y eso todavía no entra en el cálculo.'),
          'La calculadora no reemplaza la radiografía de conductometría.'
        ]} />
      </div>
    </section>
  );
}

/* ═══ Anestesia: dosis máxima con medidor ═══ */
function Medidor({ n, pasado }) {
  // Arco de 240°: lo usado en verde azulado (o error si se pasó), lo que queda en la pista
  const R = 92, C = 120, ini = 150, barrido = 240;
  const pt = (ang) => [C + R * Math.cos(ang * Math.PI / 180), C + R * Math.sin(ang * Math.PI / 180)];
  const arco = (a0, a1) => { const [x0, y0] = pt(a0), [x1, y1] = pt(a1); return `M${x0},${y0} A${R},${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1},${y1}`; };
  const frac = n.maxTubos > 0 ? Math.min(1, n.usados / n.maxTubos) : 0;
  const f1 = (v) => (Math.floor(v * 10) / 10).toString().replace('.', ',');
  return (
    <svg viewBox="0 0 240 210" className="medidor mx-auto block w-full max-w-[300px]" role="img" aria-label={f1(n.quedan) + ' tubos de margen de ' + f1(n.maxTubos)}>
      <path d={arco(ini, ini + barrido)} className="pista" />
      {frac > 0 && <path d={arco(ini, ini + barrido * Math.max(frac, 0.01))} className={cx('usado', pasado && 'pasado')} />}
      <text x={C} y={C - 2} className="cifra-m">{pasado ? '0' : f1(n.quedan)}</text>
      <text x={C} y={C + 20} className="txt-m">tubos de margen</text>
      <text x={C} y={C + 74} className="txt-m tenue-m">máximo {f1(n.maxTubos)} tubos</text>
    </svg>
  );
}

function Tubos({ n }) {
  const total = Math.ceil(n.maxTubos);
  return (
    <div className="flex flex-wrap justify-center gap-1.5" aria-hidden="true">
      {Array.from({ length: Math.max(total, Math.ceil(n.usados)) }).map((_, i) => {
        const lleno = Math.max(0, Math.min(1, n.usados - i));
        const sobre = i >= n.maxTubos;
        const parcial = i === total - 1 && n.maxTubos % 1 ? n.maxTubos % 1 : 1; // el último tubo del máximo puede ser parcial
        return (
          <span key={i} className={cx('relative h-11 w-4 overflow-hidden rounded-[5px] border-[1.5px]', sobre ? 'border-bad' : 'border-acento')} style={{ opacity: sobre ? 1 : 0.35 + 0.65 * parcial }}>
            <span className={cx('absolute inset-x-0 bottom-0', sobre ? 'bg-bad' : 'bg-acento')} style={{ height: lleno * 100 + '%' }} />
          </span>
        );
      })}
    </div>
  );
}

function Anestesia({ st, f }) {
  const nino = st.aModo === 'nino';
  const r = nino ? anestesiaNino(st) : anestesia(st);
  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <Elige label="Paciente" value={st.aModo} onChange={f('aModo')} opciones={[['adulto', 'Adulto'], ['nino', 'Niño · AAPD']]} />
        <p className="m-0 text-[14px] leading-relaxed text-ink2">{nino
          ? 'Dosis máxima para menores de 18 años según la tabla de la Academia Americana de Odontología Pediátrica (AAPD). Es más baja que la del adulto: en lidocaína, 4,4 mg por kilo en vez de 7. Tubos de 1,8 ml.'
          : 'Lidocaína al 2 % con epinefrina 1:100.000 en tubos de 1,8 ml. El techo es 7 mg por kilo, sin pasar nunca de 500 mg.' + segun(' Es el mismo dato que usa el protocolo de exodoncia.', '')}</p>
        {nino && <Elige label="Anestésico" value={st.nAnest} onChange={f('nAnest')} opciones={Object.entries(ANEST_NINO).map(([k, a]) => [k, a.t.replace(' con epinefrina', '').replace(' sin vasoconstrictor', ' sin vaso').replace(' con levonordefrina', ' + levo')])} />}
        <div className="grid gap-3.5 sm:grid-cols-2">
          {nino ? <>
            <Paso id="nPeso" label="Peso del niño" unidad="kg" step={0.5} min={2} value={st.nPeso} onChange={f('nPeso')} />
            <Paso id="nEdad" label="Edad" unidad="años" step={0.5} value={st.nEdad} onChange={f('nEdad')} hint="Si tiene meses, usa decimales: 5 meses = 0,4." />
            <Paso id="nUsados" label="Tubos ya usados" step={0.5} value={st.nUsados} onChange={f('nUsados')} />
            <Elige label="¿Con sedación?" value={st.nSeda} onChange={f('nSeda')} />
          </> : <>
            <Paso id="aPeso" label="Peso del paciente" unidad="kg" step={1} min={5} value={st.aPeso} onChange={f('aPeso')} />
            <Paso id="aUsados" label="Tubos ya usados" step={0.5} value={st.aUsados} onChange={f('aUsados')} />
          </>}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {!r.listo ? (r.bloqueo ? <Aviso tono="bad">{r.aviso}</Aviso> : <p className="m-0 text-[14px] text-ink3">{r.aviso}</p>) : <>
          {r.pasado && <Aviso tono="bad">Los tubos registrados superan la dosis máxima para este peso. Detente y avisa al docente.</Aviso>}
          {(r.avisos || []).map((t, i) => <Aviso key={i} tono="warn">{t}</Aviso>)}
          <Medidor n={r.num} pasado={r.pasado} />
          <Tubos n={r.num} />
          <dl className="m-0 grid grid-cols-3 gap-3 text-center">
            {[[r.maxMg, 'dosis máxima'], [r.usadoMg, 'usado'], [r.maxTubos, 'tubos máximo']].map(([v, t]) => (
              <div key={t}><dd className="m-0 text-[20px] font-extrabold tabular-nums tracking-[-.02em] text-deep">{v}</dd><dt className="text-[10.5px] font-bold uppercase tracking-[.14em] text-rotulo">{t}</dt></div>
            ))}
          </dl>
          <Razones titulo="Cómo salió" items={r.porque} />
        </>}
        <Origen items={nino ? [
          'Fuente: AAPD, Use of Local Anesthesia for Pediatric Dental Patients (revisión 2023). The Reference Manual of Pediatric Dentistry 2025, tabla de la pág. 408 y recomendaciones de la pág. 411.',
          'Lidocaína: la AAPD usa 4,4 mg/kg, más conservador que los 7 mg/kg del fabricante. Articaína: 7 mg/kg, y no se recomienda bajo 4 años.',
          'En menores de 6 meses la AAPD pide bajar un 30 % la dosis de las amidas. La calculadora lo descuenta sola.',
          'La tabla de la AAPD no fija un techo total en mg, solo mg por kilo. En un adolescente grande revisa también la dosis de adulto.',
          'La tabla usa tubos de 1,7 ml. Aquí se calcula con 1,8 ml, el tubo habitual en Chile.',
          'El anestésico tópico también se absorbe y la AAPD pide sumarlo al total. La calculadora no lo incluye.',
          'Prilocaína y bupivacaína no están cargadas. La bupivacaína no se recomienda bajo 12 años.'
        ] : [
          segun('Fuente: ficha técnica de la FDA para lidocaína con epinefrina (Xylocaine Dental, DailyMed), la misma que cita el protocolo de exodoncia. Falta el localizador de párrafo.',
            'Fuente: ficha técnica de la FDA para lidocaína con epinefrina (Xylocaine Dental, DailyMed). Falta el localizador de párrafo.'),
          'La dosis máxima es un techo, no una meta. Quedarse corto por miedo a la dosis es un error más frecuente que pasarse.',
          'No calcula el límite propio de la epinefrina en pacientes con enfermedad cardiovascular. Ese caso se decide aparte.',
          'Solo cubre lidocaína al 2 % con epinefrina. Otros anestésicos tienen otros techos y no están cargados.'
        ]} />
      </div>
    </section>
  );
}
