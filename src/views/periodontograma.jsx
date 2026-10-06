// Periodontograma con la estructura de PerioTools (y de la ficha periodontal de Berna en la que se inspira):
// por diente, implante, movilidad y furca; por sitio, sangrado, placa, margen gingival y profundidad de sondaje;
// y el dibujo de los dientes con la línea del margen gingival y la del fondo del saco.
// Orden clásico: superior vestibular y palatino; inferior lingual y vestibular.
// Al anotar un número el cursor salta solo al sitio siguiente.
import { useRef, useState } from 'react';
import { Btn, cx } from '../ui.jsx';
import { ARCADAS_PERIO, tieneFurca, nicSitio, resumenPeriodontograma } from '../logic.js';

const CW = 24;          // ancho de un sitio
const TW = CW * 3;      // ancho de un diente
const K = 3.6;          // píxeles por milímetro en el dibujo
const CORONA = 9 * K, RAIZ = 14 * K, PAD = 14;
const ALTO = CORONA + RAIZ + PAD * 2;

// Orden de los sitios en pantalla: en los cuadrantes 1 y 4 el distal queda a la izquierda
const orden = (d) => (d[0] === '1' || d[0] === '4' ? ['d', 'c', 'm'] : ['m', 'c', 'd']);
const tipo = (d) => { const n = +d[2]; return n <= 2 ? 'inc' : n === 3 ? 'can' : n <= 5 ? 'pre' : 'mol'; };
const num = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? null : n; };
const MOV = ['', '0', '1', '2', '3'], FURCA = ['', 'I', 'II', 'III'];
const siguiente = (lista, v) => lista[(lista.indexOf(v || '') + 1) % lista.length];

/* ── Dibujo de un diente. dir = 1: la corona va hacia abajo (arcada superior); −1: hacia arriba (inferior) ── */
function formaDiente(t, cx, y0, dir) {
  const h = TW / 2 - 7, hc = h * 0.66, y = (mm) => y0 + dir * mm;
  const c = CORONA, r = RAIZ;
  let borde;
  if (t === 'inc') borde = `L${cx - h * 0.78},${y(c)} L${cx + h * 0.78},${y(c)}`;
  else if (t === 'can') borde = `L${cx - h * 0.55},${y(c * 0.92)} L${cx},${y(c * 1.06)} L${cx + h * 0.55},${y(c * 0.92)}`;
  else if (t === 'pre') borde = `Q${cx - h * 0.5},${y(c * 1.08)} ${cx - h * 0.1},${y(c * 0.94)} Q${cx + h * 0.5},${y(c * 1.08)} ${cx + h * 0.9},${y(c * 0.86)}`;
  else borde = `Q${cx - h * 0.62},${y(c * 1.07)} ${cx - h * 0.33},${y(c * 0.95)} Q${cx},${y(c * 1.08)} ${cx + h * 0.33},${y(c * 0.95)} Q${cx + h * 0.62},${y(c * 1.07)} ${cx + h * 0.92},${y(c * 0.85)}`;
  const corona = `M${cx - hc},${y0} C${cx - h * 1.02},${y(c * 0.2)} ${cx - h * 1.02},${y(c * 0.65)} ${cx - h * 0.92},${y(c * 0.86)} ${borde} C${cx + h * 1.02},${y(c * 0.65)} ${cx + h * 1.02},${y(c * 0.2)} ${cx + hc},${y0} Z`;
  const raiz = t === 'mol'
    ? `M${cx - hc},${y0} C${cx - hc},${y(-r * 0.5)} ${cx - hc * 0.9},${y(-r * 0.9)} ${cx - hc * 0.55},${y(-r)} C${cx - hc * 0.3},${y(-r * 0.85)} ${cx - hc * 0.15},${y(-r * 0.45)} ${cx},${y(-r * 0.3)} C${cx + hc * 0.15},${y(-r * 0.45)} ${cx + hc * 0.3},${y(-r * 0.85)} ${cx + hc * 0.55},${y(-r)} C${cx + hc * 0.9},${y(-r * 0.9)} ${cx + hc},${y(-r * 0.5)} ${cx + hc},${y0} Z`
    : `M${cx - hc},${y0} C${cx - hc},${y(-r * 0.55)} ${cx - hc * 0.45},${y(-r * 0.95)} ${cx},${y(-r * (t === 'can' ? 1.1 : 1))} C${cx + hc * 0.45},${y(-r * 0.95)} ${cx + hc},${y(-r * 0.55)} ${cx + hc},${y0} Z`;
  return { corona, raiz };
}
function Implante({ cx, y0, dir }) {
  const w = TW / 2 - 13, y = (mm) => y0 + dir * mm;
  return (
    <g className="perio-implante">
      <path d={`M${cx - w * 0.8},${y0} L${cx - w * 0.8},${y(CORONA * 0.85)} Q${cx},${y(CORONA * 1.05)} ${cx + w * 0.8},${y(CORONA * 0.85)} L${cx + w * 0.8},${y0} Z`} />
      <rect x={cx - w * 0.5} y={Math.min(y0, y(-RAIZ))} width={w} height={RAIZ} rx="3" />
      {[0.2, 0.4, 0.6, 0.8].map((f) => <line key={f} x1={cx - w * 0.5} x2={cx + w * 0.5} y1={y(-RAIZ * f)} y2={y(-RAIZ * f)} />)}
    </g>
  );
}

/* ── Una cara de la arcada dibujada: dientes, margen gingival y fondo del saco ── */
function Cara({ dientes, chart, cara, dir }) {
  const y0 = dir === 1 ? PAD + RAIZ : PAD + CORONA; // altura del límite amelocementario
  const w = dientes.length * TW;
  // Puntos de cada sitio con dato, en el orden de la pantalla; un sitio sin sondaje corta la línea
  const tramos = []; let tramo = [];
  dientes.forEach((d, i) => {
    const t = chart[d] || {};
    orden(d).forEach((pos, j) => {
      const x = (t.s || {})[cara + pos] || {};
      const ps = num(x.ps);
      if (t.aus || ps === null) { if (tramo.length) tramos.push(tramo); tramo = []; return; }
      const mg = num(x.mg) || 0;
      const yMg = y0 + dir * mg * K;           // margen positivo: hacia la corona
      const yFondo = yMg - dir * ps * K;       // el fondo del saco queda hacia apical
      tramo.push({ x: i * TW + j * CW + CW / 2, yMg, yFondo });
    });
  });
  if (tramo.length) tramos.push(tramo);
  const linea = (pts, k) => pts.map((p, i) => (i ? 'L' : 'M') + p.x + ',' + p[k]).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${ALTO}`} width={w} height={ALTO} className="perio-dibujo block" aria-hidden="true">
      <line x1="0" x2={w} y1={y0} y2={y0} className="perio-lac" />
      {[3, 6, 9].map((mm) => <line key={mm} x1="0" x2={w} y1={y0 - dir * mm * K} y2={y0 - dir * mm * K} className="perio-guia" />)}
      {dientes.map((d, i) => {
        const t = chart[d] || {}; const cx0 = i * TW + TW / 2;
        if (t.imp) return <g key={d} className={cx(t.aus && 'perio-ausente')}><Implante cx={cx0} y0={y0} dir={dir} /></g>;
        const f = formaDiente(tipo(d), cx0, y0, dir);
        const furca = cara === 'v' && tieneFurca(d) && t.furca;
        return (
          <g key={d} className={cx('perio-diente', t.aus && 'perio-ausente')}>
            <path d={f.raiz} className="perio-raiz" />
            <path d={f.corona} className="perio-corona" />
            {furca && <path d={`M${cx0 - 6},${y0 - dir * RAIZ * 0.3 - dir * 2} L${cx0 + 6},${y0 - dir * RAIZ * 0.3 - dir * 2} L${cx0},${y0 - dir * RAIZ * 0.3 + dir * 9} Z`} className={'perio-furca f' + FURCA.indexOf(t.furca)} />}
            {t.aus && <path d={`M${cx0 - 16},${PAD + 8} L${cx0 + 16},${ALTO - PAD - 8} M${cx0 + 16},${PAD + 8} L${cx0 - 16},${ALTO - PAD - 8}`} className="perio-x" />}
          </g>
        );
      })}
      {tramos.map((p, k) => (
        <g key={k}>
          <path d={linea(p, 'yMg') + ' ' + [...p].reverse().map((q) => 'L' + q.x + ',' + q.yFondo).join(' ') + ' Z'} className="perio-saco" />
          <path d={linea(p, 'yFondo')} className="perio-fondo" />
          <path d={linea(p, 'yMg')} className="perio-margen" />
        </g>
      ))}
    </svg>
  );
}

export function Periodontograma({ chart, setChart, onUsar }) {
  const [borrar, setBorrar] = useState(false);
  const r = resumenPeriodontograma(chart);
  const raiz = useRef(null);
  const espera = useRef(null);

  const upd = (d, fn) => setChart((c) => ({ ...c, [d]: fn(c[d] || {}) }));
  const sitio = (d, k) => ((chart[d] || {}).s || {})[k] || {};
  const setSitio = (d, k, campo, v) => upd(d, (t) => ({ ...t, s: { ...(t.s || {}), [k]: { ...((t.s || {})[k] || {}), [campo]: v } } }));
  const aus = (d) => !!(chart[d] && chart[d].aus);

  // Saltar al sitio siguiente de la misma fila (data-fila y data-col en cada campo)
  const mover = (el, paso) => {
    const fila = el.getAttribute('data-fila'); const col = +el.getAttribute('data-col');
    const lista = [...raiz.current.querySelectorAll(`input[data-fila="${fila}"]:not(:disabled)`)];
    const sig = lista.find((x) => +x.getAttribute('data-col') === col + paso) || lista.filter((x) => (paso > 0 ? +x.getAttribute('data-col') > col : +x.getAttribute('data-col') < col)).sort((a, b) => paso * (+a.getAttribute('data-col') - +b.getAttribute('data-col')))[0];
    if (sig) { sig.focus(); sig.select(); }
  };
  const escribir = (e, d, k, campo, negativo) => {
    const el = e.target; const v = el.value.replace(',', '.').trim();
    if (!(negativo ? /^-?\d{0,2}$/ : /^\d{0,2}$/).test(v)) return;
    setSitio(d, k, campo, v);
    clearTimeout(espera.current);
    const cifras = v.replace('-', '');
    // Un dígito salta al siguiente sitio. En el sondaje, un «1» espera un momento por si viene un 10 o más;
    // en el margen no (un margen de 10 mm casi no existe, y así «−1» seguido de «−2» no se junta en «−12»)
    if (cifras.length === 2 || (cifras.length === 1 && (cifras !== '1' || negativo))) mover(el, 1);
    else if (cifras === '1') espera.current = setTimeout(() => mover(el, 1), 700);
  };
  const teclas = (e) => {
    if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value.length) { e.preventDefault(); mover(e.target, 1); }
    if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) { e.preventDefault(); mover(e.target, -1); }
  };

  const tonoPs = (ps) => { const n = num(ps); return n >= 6 ? 'grave' : n >= 4 ? 'alerta' : ''; };

  // Filas de una cara, en el orden en que se leen sobre el dibujo
  const filas = (dientes, cara, arc, campos) => campos.map((campo) => {
    const nombre = { sg: 'Sangrado', pl: 'Placa', mg: 'Margen gingival', ps: 'Prof. de sondaje' }[campo];
    return (
      <tr key={arc + cara + campo}>
        <th scope="row" className="perio-th">{nombre}</th>
        {dientes.map((d, i) => (
          <td key={d} className="perio-td">
            <div className="flex">
              {orden(d).map((pos, j) => {
                const k = cara + pos, x = sitio(d, k), off = aus(d);
                const lab = nombre + ' ' + d + ' ' + (cara === 'v' ? 'vestibular' : arc === 'sup' ? 'palatino' : 'lingual') + ' ' + { d: 'distal', c: 'centro', m: 'mesial' }[pos];
                if (campo === 'sg' || campo === 'pl') {
                  return <button key={pos} type="button" disabled={off} aria-pressed={!!x[campo]} aria-label={lab} onClick={() => setSitio(d, k, campo, !x[campo])}
                    className="perio-punto"><span className={cx(x[campo] && (campo === 'sg' ? 'on-sg' : 'on-pl'))} /></button>;
                }
                return <input key={pos} type="text" inputMode={campo === 'mg' ? 'text' : 'numeric'} aria-label={lab} disabled={off}
                  data-fila={arc + cara + campo} data-col={i * 3 + j} value={x[campo] ?? ''}
                  onChange={(e) => escribir(e, d, k, campo, campo === 'mg')} onKeyDown={teclas} onFocus={(e) => e.target.select()}
                  className={cx('perio-in', campo === 'ps' && tonoPs(x.ps), campo === 'mg' && num(x.mg) < 0 && 'recesion')} />;
              })}
            </div>
          </td>
        ))}
      </tr>
    );
  });
  const filaDiente = (dientes, campo) => {
    const nombre = { n: 'Diente', imp: 'Implante', mov: 'Movilidad', furca: 'Furca' }[campo];
    return (
      <tr key={campo}>
        <th scope="row" className="perio-th">{nombre}</th>
        {dientes.map((d) => {
          const t = chart[d] || {};
          let cel;
          if (campo === 'n') cel = <button type="button" aria-pressed={aus(d)} title={aus(d) ? 'Marcar presente' : 'Marcar ausente'} onClick={() => upd(d, (x) => ({ ...x, aus: !x.aus }))} className={cx('perio-num', aus(d) && 'ausente')}>{d}</button>;
          else if (campo === 'imp') cel = <button type="button" disabled={aus(d)} aria-pressed={!!t.imp} aria-label={'Implante ' + d} onClick={() => upd(d, (x) => ({ ...x, imp: !x.imp }))} className={cx('perio-chip', t.imp && 'on')}>{t.imp ? 'Sí' : ''}</button>;
          else if (campo === 'mov') cel = <button type="button" disabled={aus(d)} aria-label={'Movilidad ' + d + ': ' + (t.mov || 'sin dato')} onClick={() => upd(d, (x) => ({ ...x, mov: siguiente(MOV, x.mov) }))} className={cx('perio-chip', num(t.mov) >= 2 && 'alerta')}>{t.mov || ''}</button>;
          else cel = tieneFurca(d)
            ? <button type="button" disabled={aus(d)} aria-label={'Furca ' + d + ': ' + (t.furca || 'sin dato')} onClick={() => upd(d, (x) => ({ ...x, furca: siguiente(FURCA, x.furca) }))} className={cx('perio-chip', (t.furca === 'II' || t.furca === 'III') && 'alerta')}>{t.furca || ''}</button>
            : <span className="block h-[22px]" />;
          return <td key={d} className="perio-td text-center">{cel}</td>;
        })}
      </tr>
    );
  };
  const dibujo = (dientes, cara, dir) => (
    <tr><th className="perio-th perio-th-dibujo">{cara === 'v' ? 'Vestibular' : dientes[0][0] === '1' ? 'Palatino' : 'Lingual'}</th>
      <td colSpan={dientes.length} className="p-0"><Cara dientes={dientes} chart={chart} cara={cara} dir={dir} /></td></tr>
  );

  const sup = ARCADAS_PERIO.sup, inf = ARCADAS_PERIO.inf;
  const cifras = [
    [r.psMedia === null ? '—' : String(r.psMedia).replace('.', ',') + ' mm', 'Sondaje medio'],
    [r.nicMedia === null ? '—' : String(r.nicMedia).replace('.', ',') + ' mm', 'NIC medio'],
    [r.sangrado + ' %', 'Sangrado al sondaje', r.sangrado >= 10],
    [r.placa + ' %', 'Placa'],
    [r.ps4, 'Sitios ≥ 4 mm', r.ps4 > 0],
    [r.nicMax === null ? '—' : r.nicMax + ' mm', 'NIC interdental máx.' + (r.nicMaxDiente ? ' · ' + r.nicMaxDiente : '')]
  ];

  return (
    <div className="flex flex-col gap-5" ref={raiz}>
      <dl className="m-0 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
        {cifras.map(([v, t, alerta]) => (
          <div key={t}><dd className={cx('m-0 text-[24px] font-extrabold tabular-nums tracking-[-.03em]', alerta ? 'text-warn' : 'text-deep')}>{v}</dd><dt className="text-[10px] font-bold uppercase tracking-[.14em] text-rotulo">{t}</dt></div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 max-w-[66ch] text-[13px] leading-relaxed text-ink2">Margen gingival positivo si está hacia coronal del límite amelocementario y negativo si hay recesión. <b>NIC = sondaje − margen.</b> Toca el número de un diente para marcarlo ausente; movilidad y furca cambian con cada toque.</p>
        <div className="flex flex-wrap gap-2">
          <Btn sm v="primary" icon="sparkle" disabled={r.nicMax === null} onClick={() => onUsar(r)}>Usar en estadio y grado</Btn>
          {!borrar ? <Btn sm v="ghost" onClick={() => setBorrar(true)}>Limpiar</Btn> : (
            <span className="inline-flex items-center gap-2 text-[12.5px] text-ink2">¿Borrar todo?
              <Btn sm v="danger" onClick={() => { setChart({}); setBorrar(false); }}>Sí, borrar</Btn>
              <Btn sm v="ghost" onClick={() => setBorrar(false)}>No</Btn>
            </span>
          )}
        </div>
      </div>

      {/* Leyenda del dibujo */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[11.5px] text-ink3" aria-hidden="true">
        <span className="flex items-center gap-1.5"><i className="inline-block h-[3px] w-5 rounded bg-bad" />Margen gingival</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-[3px] w-5 rounded bg-acento" />Fondo del saco</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full bg-bad" />Sangrado</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full bg-acento" />Placa</span>
        <span>Líneas guía cada 3 mm desde el límite amelocementario</span>
      </div>

      {[['Arcada superior', sup, 'sup'], ['Arcada inferior', inf, 'inf']].map(([titulo, dientes, arc]) => (
        <section key={arc}>
          <p className="rotulo m-0 mb-2">{titulo}</p>
          <div className="perio-scroll -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="perio-tabla">
              <tbody>
                {arc === 'sup' ? <>
                  {filaDiente(dientes, 'n')}{filaDiente(dientes, 'imp')}{filaDiente(dientes, 'mov')}{filaDiente(dientes, 'furca')}
                  {filas(dientes, 'v', arc, ['sg', 'pl', 'mg', 'ps'])}
                  {dibujo(dientes, 'v', 1)}
                  {dibujo(dientes, 'l', 1)}
                  {filas(dientes, 'l', arc, ['ps', 'mg', 'pl', 'sg'])}
                </> : <>
                  {filas(dientes, 'l', arc, ['sg', 'pl', 'mg', 'ps'])}
                  {dibujo(dientes, 'l', -1)}
                  {dibujo(dientes, 'v', -1)}
                  {filas(dientes, 'v', arc, ['ps', 'mg', 'pl', 'sg'])}
                  {filaDiente(dientes, 'furca')}{filaDiente(dientes, 'mov')}{filaDiente(dientes, 'imp')}{filaDiente(dientes, 'n')}
                </>}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <p className="m-0 text-[12px] text-ink3">No se guarda: si recargas la página o sales de Herramientas, se borra. En el celular, desliza la tabla hacia el lado.</p>
    </div>
  );
}
