// Mapa de protocolos: por especialidad (vista `mapa`) y la constelación del inicio (MapaInicio).
// Las relaciones se calculan desde data.js, nunca a mano. SVG propio, sin librerías.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PROTOS, DATOS } from '../data.js';
import { nn } from '../logic.js';
import { useApp } from '../ctx.js';
import { cx } from '../ui.jsx';


// Temas que comparten los protocolos: se buscan en el texto de cada paso y en la bandeja
const TEMAS = [
  { id: 'aislamiento', t: 'Aislamiento', re: /dique|aisla/i },
  { id: 'anestesia', t: 'Anestesia', re: /anestesi|lidoca[ií]na/i },
  { id: 'grabado', t: 'Grabado ácido', re: /ácido fosfórico|\bgrab[ae]/i },
  { id: 'adhesion', t: 'Adhesión', re: /adhesiv|adhesi[oó]n/i },
  { id: 'clorhexidina', t: 'Clorhexidina', re: /clorhexidina/i },
  { id: 'radiografia', t: 'Radiografía', re: /radiograf/i },
  { id: 'oclusion', t: 'Oclusión', re: /papel de articular|oclusi[oó]n/i },
  { id: 'luz', t: 'Fotopolimerización', re: /fotopolimeri/i },
  { id: 'caries', t: 'Caries', re: /caries/i },
  { id: 'control', t: 'Control y seguimiento', re: /\bcontrol(es)?\b|reevalua/i },
  { id: 'hipoclorito', t: 'Hipoclorito', re: /hipoclorito/i }
];
// A qué protocolo apunta un texto que deriva a otro tratamiento
const DESTINO = [
  ['resina-clase-i', /restauraci[oó]n|\brestaura/i],
  ['pulpectomia-premolar', /endodoncia|tratamiento de conductos|exposici[oó]n pulpar/i],
  ['exodoncia-18', /exodoncia|\bextra(er|cci[oó]n)/i],
  ['destartraje', /periodontitis|gingivitis|periodontal/i],
  ['sellantes-ninos', /sellante/i]
];
const textoPaso = (s) => [s.corto, s.hacer, s.cond, s.listo, ...(s.porque || []), s.sinEv].filter(Boolean).join(' ');
const claveFuente = (f) => ((f.loc || '').match(/PMID\s+(\d+)/) || (f.loc || '').match(/DOI\s+(\S+)/) || [null, f.cita])[1];

// Construye nodos y aristas desde los protocolos abiertos
export function grafoProtocolos() {
  const protos = PROTOS.filter((p) => p.abre && DATOS[p.id]);
  const nodos = []; const aristas = [];
  const fuentesDe = {};
  protos.forEach((p) => {
    const d = DATOS[p.id];
    const conFuente = d.pasos.filter((s) => (s.sub || []).some((x) => (x.fuentes || []).length)).length;
    nodos.push({ id: p.id, tipo: 'proto', t: p.t, esp: d.esp, pasos: d.pasos.length, conFuente, disputa: d.pasos.filter((s) => s.marca === 'en disputa').length, r: 24 + d.pasos.length * 1.3 });
    fuentesDe[p.id] = new Map();
    d.pasos.forEach((s, i) => (s.sub || []).forEach((x) => (x.fuentes || []).forEach((f) => fuentesDe[p.id].set(claveFuente(f), { f, i }))));
  });
  // Temas: solo los que unen a dos o más protocolos (los puentes)
  TEMAS.forEach((tm) => {
    const usos = protos.map((p) => {
      const d = DATOS[p.id];
      const pasos = d.pasos.map((s, i) => tm.re.test(textoPaso(s)) ? i : -1).filter((i) => i >= 0);
      const enBandeja = d.bandeja.some((b) => b.items.some((x) => tm.re.test(x)));
      return { id: p.id, pasos, peso: pasos.length + (enBandeja ? 1 : 0) };
    }).filter((u) => u.peso > 0);
    if (usos.length < 2) return;
    nodos.push({ id: 'tema:' + tm.id, tipo: 'tema', t: tm.t, usos, r: 11 + usos.length * 2 });
    usos.forEach((u) => aristas.push({ a: 'tema:' + tm.id, b: u.id, tipo: 'tema', peso: u.peso, pasos: u.pasos }));
  });
  // Derivaciones y menciones entre protocolos
  protos.forEach((p) => {
    const d = DATOS[p.id];
    d.pasos.forEach((s, i) => {
      const ramas = (s.sub || []).flatMap((x) => x.arbol || []);
      DESTINO.forEach(([dest, re]) => {
        if (dest === p.id || !DATOS[dest]) return;
        const rama = ramas.find((r) => re.test(r.a));
        if (rama) aristas.push({ a: p.id, b: dest, tipo: 'deriva', paso: i, txt: rama.q + ' → ' + rama.a });
        else if ((s.porque || []).some((t) => re.test(t))) aristas.push({ a: p.id, b: dest, tipo: 'menciona', paso: i, txt: (s.porque || []).find((t) => re.test(t)) });
      });
    });
  });
  // Fuentes compartidas
  protos.forEach((p, k) => protos.slice(k + 1).forEach((q) => {
    fuentesDe[p.id].forEach((v, clave) => { if (fuentesDe[q.id].has(clave)) aristas.push({ a: p.id, b: q.id, tipo: 'fuente', txt: v.f.cita }); });
  }));
  // Una arista por par y tipo (se acumulan los detalles)
  const unidas = new Map();
  aristas.forEach((e) => {
    const k = [e.a, e.b].sort().join('|') + '|' + e.tipo;
    const u = unidas.get(k);
    if (u) { u.n++; u.detalles.push(e); } else unidas.set(k, { ...e, n: 1, detalles: [e] });
  });
  return { nodos, aristas: [...unidas.values()] };
}

// Protocolo → especialidad del catálogo (la que se ve en la Biblioteca)
// Se leen al momento: los protocolos llegan de Firestore después de cargar el módulo
const ESP_DE = new Proxy({}, { get: (_, id) => (PROTOS.find((p) => p.id === id) || {}).esp });
const CORTO = new Proxy({}, { get: (_, id) => { const p = PROTOS.find((x) => x.id === id); return p ? p.corto || p.t : ''; } });
const ESPECIALIDADES = ['Rehabilitación oral', 'Periodoncia', 'Endodoncia', 'Cirugía', 'Odontopediatría'];

// Lazos entre protocolos: qué temas comparten y si uno deriva o menciona al otro (todo sale de grafoProtocolos)
function lazosProtocolos() {
  const g = grafoProtocolos();
  const temas = new Map();
  g.aristas.filter((e) => e.tipo === 'tema').forEach((e) => { if (!temas.has(e.a)) temas.set(e.a, []); temas.get(e.a).push(e.b); });
  const nombreTema = Object.fromEntries(g.nodos.filter((n) => n.tipo === 'tema').map((n) => [n.id, n.t]));
  const m = new Map();
  const lazo = (a, b) => { const k = [a, b].sort().join('|'); if (!m.has(k)) m.set(k, { a, b, temas: [], deriva: [], menciona: [] }); return m.get(k); };
  temas.forEach((ps, tema) => ps.forEach((a, i) => ps.slice(i + 1).forEach((b) => lazo(a, b).temas.push(nombreTema[tema]))));
  g.aristas.filter((e) => e.tipo === 'deriva' || e.tipo === 'menciona').forEach((e) => e.detalles.forEach((x) => lazo(e.a, e.b)[e.tipo].push({ desde: e.a, hacia: e.b, paso: x.paso, txt: x.txt })));
  const lista = [...m.values()].map((l) => ({ ...l, peso: l.temas.length + 2 * (l.deriva.length + l.menciona.length) }));
  const protos = g.nodos.filter((n) => n.tipo === 'proto');
  return { protos, lazos: lista };
}

// Ancho del contenedor, para dibujar distinto en el celular
function useAncho(ref) {
  const [ancho, setAncho] = useState(720);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const medir = () => setAncho(el.clientWidth || 720);
    medir();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null;
    ro && ro.observe(el); return () => ro && ro.disconnect();
  }, []);
  return ancho;
}

/* Mapa de protocolos por especialidad.
   Nivel 1: las especialidades en un anillo, unidas por arcos según cuánto se conectan sus protocolos.
   Nivel 2: los protocolos de una especialidad, entrelazados cuando comparten técnica o uno deriva al otro,
   con las especialidades vecinas alrededor para saltar a ellas. Mismo lenguaje visual que el mapa del inicio. */
// El mapa por especialidades. En el inicio va incrustado (sin título de página: h2 en vez de h1).
export function Mapa({ incrustado = false }) {
  const { abrirProto, go } = useApp();
  const [esp, setEsp] = useState(null);
  const { protos, lazos } = useMemo(lazosProtocolos, []);
  const caja = useRef(null);
  const movil = useAncho(caja) < 560;

  return (
    <div ref={caja} className="flex flex-col gap-5">
      <header>
        <nav aria-label="Ruta" className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.16em]">
          <button type="button" onClick={() => setEsp(null)} className={cx('uppercase tracking-[.16em]', esp ? 'text-acento hover:underline' : 'text-rotulo')}>Especialidades</button>
          {esp && <><span className="text-ink3">›</span><span className="text-rotulo">{esp}</span></>}
        </nav>
        {React.createElement(incrustado ? 'h2' : 'h1', { className: cx('m-0 max-w-[26ch] font-extrabold leading-[1.12] tracking-[-.025em] text-deep', incrustado ? 'text-[19px] sm:text-[21px]' : 'text-[26px] sm:text-[32px]') },
          esp ? 'Cómo se entrelazan sus protocolos.' : incrustado ? 'Protocolos por especialidad' : 'Elige una especialidad.')}
        {!incrustado && <p className="m-0 mt-2 max-w-[62ch] text-[14px] leading-relaxed text-ink2">
          {esp ? 'Las líneas unen protocolos que comparten técnicas o materiales; la flecha marca cuando uno lleva al otro. Alrededor, las especialidades con las que se conecta.'
            : 'Cada punto es una especialidad. Los arcos muestran cuánto se conectan sus protocolos entre sí.'}
        </p>}
      </header>
      {esp
        ? <Especialidad esp={esp} protos={protos} lazos={lazos} movil={movil} irA={setEsp} abrirProto={abrirProto} />
        : <Especialidades protos={protos} lazos={lazos} movil={movil} elegir={setEsp} />}
      {!esp && !incrustado && <button type="button" onClick={() => go('biblioteca')} className="self-start text-[13px] font-semibold text-acento hover:underline">Ver todos los protocolos en la Biblioteca</button>}
    </div>
  );
}

function Especialidades({ protos, lazos, movil, elegir }) {
  const [hover, setHover] = useState(null);
  const lista = ESPECIALIDADES.map((e) => ({ esp: e, n: protos.filter((p) => ESP_DE[p.id] === e).length })).filter((x) => x.n > 0);
  // Arcos entre especialidades: suma de lo que se conectan sus protocolos
  const m = new Map();
  lazos.forEach((l) => {
    const a = ESP_DE[l.a], b = ESP_DE[l.b]; if (!a || !b || a === b) return;
    const k = [a, b].sort().join('|'); m.set(k, { a, b, peso: (m.get(k)?.peso || 0) + l.peso });
  });
  const arcos = [...m.values()];
  const W = movil ? 360 : 760, H = movil ? 460 : 420, rx = movil ? 112 : 240, ry = movil ? 150 : 130, cx0 = W / 2, cy0 = H / 2;
  const pos = Object.fromEntries(lista.map((x, i) => { const ang = -Math.PI / 2 + (i / lista.length) * Math.PI * 2; return [x.esp, { x: cx0 + Math.cos(ang) * rx, y: cy0 + Math.sin(ang) * ry, ang }]; }));
  const max = Math.max(1, ...arcos.map((a) => a.peso));
  const vecino = (e) => !hover || e === hover || arcos.some((a) => (a.a === hover && a.b === e) || (a.b === hover && a.a === e));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="constelacion block h-auto w-full" role="list" aria-label="Especialidades">
      <ellipse cx={cx0} cy={cy0} rx={rx} ry={ry} className="orbita" />
      {arcos.map((l, k) => {
        const a = pos[l.a], b = pos[l.b]; const t = 0.5 + 0.4 * (l.peso / max);
        const qx = (a.x + b.x) / 2 + (cx0 - (a.x + b.x) / 2) * t, qy = (a.y + b.y) / 2 + (cy0 - (a.y + b.y) / 2) * t;
        const on = hover && (l.a === hover || l.b === hover);
        return <path key={k} d={`M${a.x},${a.y} Q${qx},${qy} ${b.x},${b.y}`} pathLength="1" style={{ '--d': 150 + k * 50 + 'ms' }} className={cx('arco', on && 'on', hover && !on && 'off')} strokeWidth={0.8 + (l.peso / max) * 2.8} />;
      })}
      <g pointerEvents="none">
        <circle cx={cx0} cy={cy0 + 4} r={movil ? 50 : 56} className="ojo" />
        <text x={cx0} y={cy0 - 4} className="centro-num">{hover ? lista.find((x) => x.esp === hover).n : lista.length}</text>
        <text x={cx0} y={cy0 + 18} className="centro-txt">{hover ? 'protocolos' : 'especialidades'}</text>
      </g>
      {lista.map((x, k) => {
        const { x: px, y: py, ang } = pos[x.esp]; const cos = Math.cos(ang), sin = Math.sin(ang);
        const lado = movil || Math.abs(cos) < 0.25 ? 'middle' : cos > 0 ? 'start' : 'end';
        const lx = movil ? px : px + cos * 20, ly = movil ? (sin < -0.1 ? py - 32 : py + 26) : py + sin * 20 + (Math.abs(sin) > 0.9 ? (sin > 0 ? 12 : -16) : 0);
        const r = 7 + x.n * 2.5;
        return (
          <g key={x.esp} role="listitem" tabIndex={0} aria-label={x.esp + ', ' + x.n + ' protocolos'} style={{ '--d': k * 70 + 'ms' }}
            className={cx('estrella', hover === x.esp && 'activa', !vecino(x.esp) && 'off')}
            onPointerEnter={() => setHover(x.esp)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(x.esp)} onBlur={() => setHover(null)}
            onClick={() => elegir(x.esp)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(x.esp); } }}>
            <circle cx={px} cy={py} r={r + 18} className="zona" />
            <circle cx={px} cy={py} r={r + 7} className="halo-e" />
            <circle cx={px} cy={py} r={r} className="nucleo" />
            <text x={lx} y={ly} textAnchor={lado} className="nombre-e">{x.esp}</text>
            <text x={lx} y={ly + 15} textAnchor={lado} className="meta-e">{x.n} {x.n === 1 ? 'protocolo' : 'protocolos'}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Especialidad({ esp, protos, lazos, movil, irA, abrirProto }) {
  const [sel, setSel] = useState(null);
  const propios = protos.filter((p) => ESP_DE[p.id] === esp);
  const ids = new Set(propios.map((p) => p.id));
  const internos = lazos.filter((l) => ids.has(l.a) && ids.has(l.b));
  // Hacia afuera: por cada especialidad vecina, con qué protocolo propio se conecta
  const externos = new Map();
  lazos.forEach((l) => {
    const dentro = ids.has(l.a) ? l.a : ids.has(l.b) ? l.b : null; const fuera = dentro === l.a ? l.b : l.a;
    if (!dentro || ids.has(fuera)) return;
    const e = ESP_DE[fuera]; if (!externos.has(e)) externos.set(e, []); externos.get(e).push({ ...l, dentro, fuera });
  });
  const vecinas = [...externos.keys()];

  const W = movil ? 360 : 760, H = movil ? 520 : 440, cx0 = W / 2, cy0 = H / 2;
  // Protocolos al centro (uno solo va al medio); las vecinas en un anillo exterior
  const rIn = propios.length === 1 ? 0 : movil ? 70 : 130;
  const pos = {};
  propios.forEach((p, i) => { const ang = (propios.length === 2 ? Math.PI : -Math.PI / 2) + (i / propios.length) * Math.PI * 2; pos[p.id] = { x: cx0 + Math.cos(ang) * rIn, y: cy0 + Math.sin(ang) * rIn * (movil ? 1.3 : 0.75) }; });
  const rxE = movil ? 140 : 330, ryE = movil ? 225 : 185;
  vecinas.forEach((e, i) => { const ang = -Math.PI / 2 + ((i + 0.5) / vecinas.length) * Math.PI * 2; pos['esp:' + e] = { x: cx0 + Math.cos(ang) * rxE, y: cy0 + Math.sin(ang) * ryE, ang }; });
  const max = Math.max(1, ...lazos.map((l) => l.peso));
  const activo = sel || null;
  const toca = (id) => !activo || id === activo || internos.some((l) => (l.a === activo && l.b === id) || (l.b === activo && l.a === id)) || (externos.get(id.replace('esp:', '')) || []).some((l) => l.dentro === activo);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <svg viewBox={`0 0 ${W} ${H}`} className="constelacion block h-auto w-full" role="img" aria-label={'Protocolos de ' + esp + ' y sus conexiones'}>
        <ellipse cx={cx0} cy={cy0} rx={rxE} ry={ryE} className="orbita" />
        {/* Hacia otras especialidades: líneas punteadas */}
        {vecinas.map((e) => externos.get(e).map((l, k) => {
          const a = pos[l.dentro], b = pos['esp:' + e];
          const on = activo === l.dentro;
          return <path key={e + k} d={`M${a.x},${a.y} L${b.x},${b.y}`} pathLength="1" className={cx('arco arco-fuera', on && 'on', activo && !on && 'off')} strokeWidth={0.8 + (l.peso / max) * 1.6} />;
        }))}
        {/* Dentro de la especialidad: arcos con lo que comparten */}
        {internos.map((l, k) => {
          const a = pos[l.a], b = pos[l.b];
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - (movil ? 0 : 26);
          const deriva = l.deriva[0];
          const on = activo && (l.a === activo || l.b === activo);
          return (
            <g key={k} className={cx(activo && !on && 'off')}>
              <path d={`M${a.x},${a.y} Q${mx},${my - 30} ${b.x},${b.y}`} pathLength="1" className={cx('arco arco-dentro', on && 'on')} strokeWidth={1.4 + (l.peso / max) * 3} markerEnd={deriva ? 'url(#punta-c)' : undefined} />
              {l.temas.length > 0 && <text x={mx} y={my - 22} textAnchor="middle" className="lazo-txt">comparten {l.temas.slice(0, 3).join(', ').toLowerCase()}{l.temas.length > 3 ? '…' : ''}</text>}
            </g>
          );
        })}
        <defs><marker id="punta-c" viewBox="0 0 10 10" refX="16" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--acento)" /></marker></defs>
        {vecinas.map((e) => {
          const p = pos['esp:' + e]; const cos = Math.cos(p.ang), sin = Math.sin(p.ang);
          const lado = movil || Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end';
          const lx = movil ? p.x : p.x + cos * 14, ly = movil ? (sin < 0 ? p.y - 14 : p.y + 20) : p.y + sin * 14 + 4;
          return (
            <g key={e} tabIndex={0} role="button" aria-label={'Ir a ' + e} className={cx('estrella vecina', !toca('esp:' + e) && 'off')}
              onClick={() => irA(e)} onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); irA(e); } }}>
              <circle cx={p.x} cy={p.y} r="22" className="zona" />
              <circle cx={p.x} cy={p.y} r="5" className="nucleo-vecina" />
              <text x={lx} y={ly} textAnchor={lado} className="meta-e">{e} ›</text>
            </g>
          );
        })}
        {propios.map((p, k) => {
          const { x, y } = pos[p.id]; const r = 9 + p.pasos * 0.5;
          return (
            <g key={p.id} tabIndex={0} role="button" aria-pressed={sel === p.id} aria-label={p.t} style={{ '--d': k * 80 + 'ms' }}
              className={cx('estrella', sel === p.id && 'activa', !toca(p.id) && 'off')}
              onClick={() => setSel(sel === p.id ? null : p.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(sel === p.id ? null : p.id); } }}>
              <circle cx={x} cy={y} r={r + 20} className="zona" />
              <circle cx={x} cy={y} r={r + 8} className="halo-e" />
              <circle cx={x} cy={y} r={r} className="nucleo" />
              <text x={x} y={y + r + 22} textAnchor="middle" className="nombre-e">{CORTO[p.id]}</text>
              <text x={x} y={y + r + 37} textAnchor="middle" className="meta-e">{p.pasos} pasos</text>
            </g>
          );
        })}
      </svg>

      {/* Lista de los protocolos con sus conexiones explicadas: lo mismo que el dibujo, en palabras */}
      <ol className="m-0 flex list-none flex-col gap-5 p-0 lg:pt-6">
        {propios.map((p) => {
          const dentro = internos.filter((l) => l.a === p.id || l.b === p.id);
          const fuera = vecinas.flatMap((e) => externos.get(e).filter((l) => l.dentro === p.id).map((l) => ({ ...l, esp: e })));
          return (
            <li key={p.id} className={cx('border-l-2 pl-4 transition-colors', sel === p.id ? 'border-menta' : 'border-line')}>
              <button type="button" onClick={() => setSel(sel === p.id ? null : p.id)} className="text-left">
                <span className="block text-[17px] font-bold leading-snug text-deep">{p.t}</span>
                <span className="text-[10.5px] font-bold uppercase tracking-[.14em] text-rotulo">{p.pasos} pasos · {Math.round(p.conFuente / p.pasos * 100)} % con fuente</span>
              </button>
              {(dentro.length > 0 || fuera.length > 0) && (
                <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0 text-[13px] leading-snug text-ink2">
                  {dentro.map((l, k) => {
                    const otro = l.a === p.id ? l.b : l.a; const der = l.deriva.find((d) => d.desde === p.id);
                    return <li key={'d' + k}>{der ? <>Lleva a <b className="text-ink">{CORTO[otro]}</b> (paso {nn(der.paso)})</> : <>Comparte con <b className="text-ink">{CORTO[otro]}</b>{l.temas.length ? ': ' + l.temas.join(', ').toLowerCase() : ''}</>}</li>;
                  })}
                  {fuera.map((l, k) => {
                    const der = l.deriva.find((d) => d.desde === p.id) || l.menciona.find((d) => d.desde === p.id);
                    return <li key={'f' + k}>{der ? 'Lleva a' : 'Se conecta con'} <button type="button" onClick={() => irA(l.esp)} className="font-semibold text-acento hover:underline">{CORTO[l.fuera]} · {l.esp}</button>{l.temas.length && !der ? ' (' + l.temas.slice(0, 2).join(', ').toLowerCase() + ')' : ''}</li>;
                  })}
                </ul>
              )}
              <button type="button" onClick={() => abrirProto(p.id)} className="mt-2.5 text-[13px] font-semibold text-acento hover:underline">Abrir el protocolo ›</button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ═══ Mapa del inicio: constelación ═══
   Los protocolos se ordenan en un anillo; cada conexión es un arco que pasa cerca del centro,
   más grueso mientras más técnicas y materiales comparten los dos. Solo colores de Criterium.
   Continuo con la página: sin recuadro y sin capturar el scroll. Tocar un protocolo lleva a la Biblioteca. */
export function MapaInicio() {
  const { go } = useApp();
  const [hover, setHover] = useState(null);
  const caja = useRef(null);
  const [ancho, setAncho] = useState(720);
  useEffect(() => {
    const el = caja.current; if (!el) return;
    const medir = () => setAncho(el.clientWidth || 720);
    medir();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null;
    ro && ro.observe(el); return () => ro && ro.disconnect();
  }, []);

  const { protos, lazos, nTemas } = useMemo(() => {
    const g = grafoProtocolos();
    const protos = g.nodos.filter((n) => n.tipo === 'proto')
      .map((n) => ({ ...n, corto: (PROTOS.find((p) => p.id === n.id) || {}).corto || n.t }));
    // Ordena el anillo por especialidad, para que los vecinos se parezcan
    protos.sort((a, b) => a.esp.localeCompare(b.esp));
    const temas = new Map();
    g.aristas.filter((e) => e.tipo === 'tema').forEach((e) => { if (!temas.has(e.a)) temas.set(e.a, []); temas.get(e.a).push(e.b); });
    const m = new Map();
    const lazo = (a, b) => { const k = [a, b].sort().join('|'); if (!m.has(k)) m.set(k, { a, b, peso: 0, deriva: false }); return m.get(k); };
    temas.forEach((ps) => ps.forEach((a, i) => ps.slice(i + 1).forEach((b) => { lazo(a, b).peso++; })));
    g.aristas.filter((e) => e.tipo === 'deriva' || e.tipo === 'menciona').forEach((e) => { const l = lazo(e.a, e.b); l.peso += 2; if (e.tipo === 'deriva') l.deriva = true; });
    return { protos, lazos: [...m.values()].filter((l) => l.peso > 0), nTemas: temas.size };
  }, []);

  // Geometría: anillo más ancho que alto en escritorio, más alto en el celular
  const movil = ancho < 560;
  const W = movil ? 360 : 760, H = movil ? 470 : 430;
  const rx = movil ? 108 : 250, ry = movil ? 160 : 138;
  const cx0 = W / 2, cy0 = H / 2;
  const pos = Object.fromEntries(protos.map((p, i) => {
    const ang = -Math.PI / 2 + (i / protos.length) * Math.PI * 2;
    return [p.id, { x: cx0 + Math.cos(ang) * rx, y: cy0 + Math.sin(ang) * ry, ang }];
  }));
  const max = Math.max(1, ...lazos.map((l) => l.peso));
  const tocaHover = (l) => hover && (l.a === hover || l.b === hover);
  const vecinos = new Set(hover ? [hover, ...lazos.filter(tocaHover).map((l) => (l.a === hover ? l.b : l.a))] : []);
  const abrir = (id) => go('biblioteca', { foco: id });
  const sel = hover && protos.find((p) => p.id === hover);
  const conexiones = sel ? lazos.filter(tocaHover).length : lazos.length;

  return (
    <section ref={caja} aria-labelledby="mapa-inicio" className="relative">
      <p className="rotulo m-0 mb-1.5">Mapa de protocolos</p>
      <h2 id="mapa-inicio" className="m-0 max-w-[30ch] text-[22px] font-extrabold leading-[1.15] tracking-[-.025em] text-deep sm:text-[26px]">Cada protocolo, y lo que comparte con los demás.</h2>

      <svg viewBox={`0 0 ${W} ${H}`} className="constelacion mt-2 block h-auto w-full" role="list" aria-label="Protocolos de la Biblioteca">
        {/* Órbita: guía apenas visible */}
        <ellipse cx={cx0} cy={cy0} rx={rx} ry={ry} className="orbita" />
        {lazos.map((l, k) => {
          const a = pos[l.a], b = pos[l.b]; if (!a || !b) return null;
          // El arco se curva hacia el centro: más cerca mientras más fuerte la relación
          const t = 0.55 + 0.35 * (l.peso / max);
          const qx = (a.x + b.x) / 2 + (cx0 - (a.x + b.x) / 2) * t, qy = (a.y + b.y) / 2 + (cy0 - (a.y + b.y) / 2) * t;
          const on = tocaHover(l);
          return <path key={k} d={`M${a.x},${a.y} Q${qx},${qy} ${b.x},${b.y}`} pathLength="1" style={{ '--d': 200 + k * 40 + 'ms' }}
            className={cx('arco', l.deriva && 'arco-deriva', on && 'on', hover && !on && 'off')} strokeWidth={0.8 + (l.peso / max) * 2.6} />;
        })}

        {/* Centro: la cifra cambia con el protocolo que señalas */}
        <g className="centro" pointerEvents="none">
          <circle cx={cx0} cy={cy0 + 4} r={movil ? 52 : 58} className="ojo" />
          <text x={cx0} y={cy0 - 6} className="centro-num">{sel ? conexiones : protos.length}</text>
          <text x={cx0} y={cy0 + 16} className="centro-txt">{sel ? (conexiones === 1 ? 'conexión' : 'conexiones') : 'protocolos'}</text>
          {!sel && !movil && <text x={cx0} y={cy0 + 32} className="centro-txt tenue-txt">{lazos.length} conexiones · {nTemas} técnicas</text>}
        </g>

        {protos.map((p, k) => {
          const { x, y, ang } = pos[p.id];
          const cos = Math.cos(ang), sin = Math.sin(ang);
          // La etiqueta sale hacia afuera del anillo, alineada según el lado
          // En el celular no hay espacio a los lados: la etiqueta va centrada arriba o abajo del punto
          const lado = movil || Math.abs(cos) < 0.25 ? 'middle' : cos > 0 ? 'start' : 'end';
          const lx = movil ? x : x + cos * 18;
          const ly = movil ? (sin < -0.1 ? y - 30 : y + 22) : y + sin * 18 + (Math.abs(sin) > 0.9 ? (sin > 0 ? 10 : -14) : 0);
          const r = 4.5 + p.pasos * 0.22;
          const activo = hover === p.id, cerca = vecinos.has(p.id);
          return (
            <g key={p.id} role="listitem" style={{ '--d': k * 70 + 'ms' }} className={cx('estrella', activo && 'activa', hover && !cerca && 'off')}
              onPointerEnter={() => setHover(p.id)} onPointerLeave={() => setHover(null)} onClick={() => abrir(p.id)}
              tabIndex={0} aria-label={p.t + '. ' + p.esp + ', ' + p.pasos + ' pasos. Abrir en la Biblioteca'}
              onFocus={() => setHover(p.id)} onBlur={() => setHover(null)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(p.id); } }}>
              <circle cx={x} cy={y} r="26" className="zona" />
              <circle cx={x} cy={y} r={r + 7} className="halo-e" />
              <circle cx={x} cy={y} r={r} className="nucleo" />
              <text x={lx} y={ly} textAnchor={lado} className="nombre-e">{p.corto}</text>
              <text x={lx} y={ly + 15} textAnchor={lado} className="meta-e">{movil ? p.pasos + ' pasos' : p.esp.replace('Cirugía bucal', 'Cirugía') + ' · ' + p.pasos + ' pasos'}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-[12.5px] text-ink3">Toca un protocolo para abrirlo en la Biblioteca.</p>
        <button type="button" onClick={() => go('mapa')} className="text-[13px] font-semibold text-acento hover:underline">Explorar las conexiones</button>
      </div>
    </section>
  );
}
