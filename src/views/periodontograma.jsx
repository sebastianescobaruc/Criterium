import { useState } from 'react';
import { Btn, Seg, Aviso, cx } from '../ui.jsx';
import { ARCADAS_PERIO, tieneFurca, nicSitio, resumenPeriodontograma } from '../logic.js';

// Orden de los sitios en pantalla: en los cuadrantes 1 y 4 el distal queda a la izquierda.
const orden = (d) => (d[0] === '1' || d[0] === '4' ? ['d', 'c', 'm'] : ['m', 'c', 'd']);
const limpio = (v, negativo) => {
  const t = String(v).replace(',', '.').trim();
  return (negativo ? /^-?\d{0,2}$/ : /^\d{0,2}$/).test(t) ? t : null;
};

function Stat({ n, t, tono }) {
  return (
    <div className="flex-1 basis-[120px] rounded-r border border-line bg-card px-4 py-3">
      <b className={cx('block text-[22px] font-extrabold tabular-nums', tono === 'bad' ? 'text-bad' : tono === 'warn' ? 'text-warn' : 'text-acentodeep')}>{n}</b>
      <span className="text-[11.5px] text-ink3">{t}</span>
    </div>
  );
}

function Celda({ value, onChange, negativo, disabled, tono, label }) {
  return (
    <input
      type="text" inputMode={negativo ? 'text' : 'numeric'} aria-label={label} disabled={disabled}
      value={value ?? ''} onChange={(e) => { const v = limpio(e.target.value, negativo); if (v !== null) onChange(v); }}
      className={cx('h-7 w-7 rounded-[6px] border text-center text-[12.5px] tabular-nums outline-none focus:border-acento focus:ring-2 focus:ring-acentosoft disabled:opacity-30',
        tono === 'bad' ? 'border-bad bg-badsoft font-bold text-bad' : tono === 'warn' ? 'border-warn bg-warnsoft font-bold text-warn' : 'border-line bg-bg text-ink')}
    />
  );
}

function Punto({ on, onClick, disabled, tono, label }) {
  return (
    <button type="button" aria-pressed={!!on} aria-label={label} disabled={disabled} onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-[6px] border border-line bg-bg disabled:opacity-30">
      <span className={cx('h-3 w-3 rounded-full', on ? (tono === 'bad' ? 'bg-bad' : 'bg-warn') : 'border border-line')} />
    </button>
  );
}

export function Periodontograma({ chart, setChart, onUsar }) {
  const [arc, setArc] = useState('sup');
  const [borrar, setBorrar] = useState(false);
  const r = resumenPeriodontograma(chart);
  const dientes = ARCADAS_PERIO[arc];
  const interna = arc === 'sup' ? 'Palatino' : 'Lingual';

  const upd = (d, fn) => setChart((c) => ({ ...c, [d]: fn(c[d] || {}) }));
  const sitio = (d, k) => ((chart[d] || {}).s || {})[k] || {};
  const setSitio = (d, k, campo, v) => upd(d, (t) => ({ ...t, s: { ...(t.s || {}), [k]: { ...((t.s || {})[k] || {}), [campo]: v } } }));
  const aus = (d) => !!(chart[d] && chart[d].aus);

  const tonoPs = (ps) => { const n = parseFloat(ps); return n >= 6 ? 'bad' : n >= 4 ? 'warn' : ''; };
  const nombreSitio = { d: 'distal', c: 'centro', m: 'mesial' };

  const filaCara = (cara) => {
    const titulo = cara === 'v' ? 'Vestibular' : interna;
    const filas = [
      { campo: 'ps', t: 'Sondaje' },
      { campo: 'mg', t: 'Margen' },
      { campo: 'sg', t: 'Sangrado' },
      { campo: 'pl', t: 'Placa' },
      { campo: 'nic', t: 'NIC' }
    ];
    return [
      <tr key={cara + '-t'}><th colSpan={dientes.length * 3 + 1} className="sticky left-0 bg-card pb-1 pt-3 text-left text-[11px] font-bold uppercase tracking-[.05em] text-ink3">{titulo}</th></tr>,
      ...filas.map((f) => (
        <tr key={cara + f.campo}>
          <th scope="row" className="sticky left-0 z-10 bg-card pr-2 text-left text-[11.5px] font-semibold text-ink2">{f.t}</th>
          {dientes.map((d) => orden(d).map((pos, i) => {
            const k = cara + pos, x = sitio(d, k), off = aus(d);
            const lab = f.t + ' ' + d + ' ' + titulo.toLowerCase() + ' ' + nombreSitio[pos];
            let cel;
            if (f.campo === 'ps') cel = <Celda value={x.ps} onChange={(v) => setSitio(d, k, 'ps', v)} disabled={off} tono={tonoPs(x.ps)} label={lab} />;
            else if (f.campo === 'mg') cel = <Celda value={x.mg} onChange={(v) => setSitio(d, k, 'mg', v)} disabled={off} negativo label={lab} />;
            else if (f.campo === 'sg') cel = <Punto on={x.sg} onClick={() => setSitio(d, k, 'sg', !x.sg)} disabled={off} tono="bad" label={lab} />;
            else if (f.campo === 'pl') cel = <Punto on={x.pl} onClick={() => setSitio(d, k, 'pl', !x.pl)} disabled={off} tono="warn" label={lab} />;
            else { const n = off ? null : nicSitio(x); cel = <span className={cx('grid h-7 w-7 place-items-center text-[12.5px] tabular-nums', n === null ? 'text-ink3' : n >= 5 ? 'font-bold text-bad' : n >= 3 ? 'font-bold text-warn' : 'text-ink')}>{n === null ? '·' : n}</span>; }
            return <td key={d + pos} className={cx('px-[1px] py-[2px]', i === 2 && 'pr-2')}>{cel}</td>;
          }))}
        </tr>
      ))
    ];
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="m-0 max-w-[72ch] text-[13.5px] leading-relaxed text-ink2">
        Seis sitios por diente. Anota la profundidad de sondaje y el margen gingival: positivo si está hacia coronal del límite amelocementario (LAC), negativo si hay recesión. El nivel de inserción clínica (NIC) se calcula solo: <b>NIC = sondaje − margen</b>. Por ejemplo, sondaje 3 con margen −2 da NIC 5.
      </p>

      <div className="flex flex-wrap gap-2.5">
        <Stat n={r.sangrado + ' %'} t="sitios que sangran" tono={r.sangrado >= 10 ? 'warn' : ''} />
        <Stat n={r.placa + ' %'} t="sitios con placa" />
        <Stat n={r.ps4} t="sitios de 4 mm o más" tono={r.ps4 ? 'warn' : ''} />
        <Stat n={r.ps6} t="sitios de 6 mm o más" tono={r.ps6 ? 'bad' : ''} />
        <Stat n={r.nicMax === null ? '—' : r.nicMax + ' mm'} t={r.nicMax === null ? 'NIC interdental máximo' : 'NIC interdental máximo · ' + r.nicMaxDiente} />
      </div>
      <p className="-mt-2 m-0 text-[12px] text-ink3">{r.sondados} sitios sondados en {r.presentes} dientes presentes. Los porcentajes se calculan sobre los sitios sondados.</p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Seg size="sm" valor={arc} onChange={setArc} opciones={[{ v: 'sup', t: 'Superior · 1.8 a 2.8' }, { v: 'inf', t: 'Inferior · 4.8 a 3.8' }]} />
        <div className="flex flex-wrap gap-2">
          <Btn sm v="soft" icon="sparkle" disabled={r.nicMax === null} onClick={() => onUsar(r)}>Usar en estadio y grado</Btn>
          {!borrar ? <Btn sm v="ghost" onClick={() => setBorrar(true)}>Limpiar</Btn> : (
            <span className="inline-flex items-center gap-2 text-[12.5px] text-ink2">¿Borrar todo?
              <Btn sm v="danger" onClick={() => { setChart({}); setBorrar(false); }}>Sí, borrar</Btn>
              <Btn sm v="ghost" onClick={() => setBorrar(false)}>No</Btn>
            </span>
          )}
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:rounded-r sm:border sm:border-line sm:bg-card sm:p-4">
        <table className="border-separate border-spacing-0 bg-card">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card" />
              {dientes.map((d) => (
                <th key={d} colSpan={3} className="px-1 pb-1">
                  <button type="button" aria-pressed={aus(d)} onClick={() => upd(d, (t) => ({ ...t, aus: !t.aus }))} title={aus(d) ? 'Marcar presente' : 'Marcar ausente'}
                    className={cx('w-full rounded-[7px] border px-1 py-1 text-[12.5px] font-bold tabular-nums', aus(d) ? 'border-line bg-soft text-ink3 line-through' : 'border-line bg-bg text-deep hover:bg-soft')}>
                    {d}
                  </button>
                </th>
              ))}
            </tr>
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-card pr-2 text-left text-[11.5px] font-semibold text-ink2">Movilidad</th>
              {dientes.map((d) => (
                <td key={d} colSpan={3} className="px-1 py-[2px] text-center">
                  <select aria-label={'Movilidad ' + d} disabled={aus(d)} value={(chart[d] || {}).mov || ''} onChange={(e) => upd(d, (t) => ({ ...t, mov: e.target.value }))}
                    className="h-7 w-full rounded-[6px] border border-line bg-bg text-center text-[12px] text-ink disabled:opacity-30">
                    <option value="">–</option><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option>
                  </select>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-card pr-2 text-left text-[11.5px] font-semibold text-ink2">Furca</th>
              {dientes.map((d) => (
                <td key={d} colSpan={3} className="px-1 py-[2px] text-center">
                  {tieneFurca(d) ? (
                    <select aria-label={'Furca ' + d} disabled={aus(d)} value={(chart[d] || {}).furca || ''} onChange={(e) => upd(d, (t) => ({ ...t, furca: e.target.value }))}
                      className="h-7 w-full rounded-[6px] border border-line bg-bg text-center text-[12px] text-ink disabled:opacity-30">
                      <option value="">–</option><option value="I">I</option><option value="II">II</option><option value="III">III</option>
                    </select>
                  ) : <span className="text-[12px] text-ink3">·</span>}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {filaCara('v')}
            {filaCara('l')}
          </tbody>
        </table>
      </div>
      <p className="m-0 text-[12px] text-ink3">Toca el número de un diente para marcarlo ausente. En el celular, desliza la tabla hacia el lado.</p>

      <Aviso tono="warn">Todavía no se guarda: si sales de Herramientas o recargas la página, se borra. Guardarlo dentro de un caso es el siguiente paso.</Aviso>
    </div>
  );
}
