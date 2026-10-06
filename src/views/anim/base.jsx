// Piezas comunes de las animaciones: línea de tiempo (SMIL), instrumentos y rótulos.
// Las coordenadas viven en un lienzo de 360 × 180 (viewBox "40 4 360 180"); cada instrumento tiene la punta en 0,0.
import React from 'react';
import { cx } from '../../ui.jsx';

/* ═══ Línea de tiempo ═══ */

// Puntos [t (0 a 1 de la vuelta), valor] → keyTimes y values; agrega los extremos si faltan
export function kv(p) {
  const q = p.map(([t, v]) => [Math.min(1, Math.max(0, t)), v]);
  if (q[0][0] > 0) q.unshift([0, q[0][1]]);
  if (q[q.length - 1][0] < 1) q.push([1, q[q.length - 1][1]]);
  return { keyTimes: q.map((x) => +x[0].toFixed(4)).join(';'), values: q.map((x) => x[1]).join(';') };
}
export const suave = (n) => Array(Math.max(1, n - 1)).fill('.42 0 .58 1').join(';');
// Opacidad, traslado, giro y cualquier atributo, todos en bucle con la duración de la escena
export const Op = ({ p, d }) => <animate attributeName="opacity" dur={d + 's'} repeatCount="indefinite" {...kv(p)} />;
export const Tr = ({ p, d }) => { const k = kv(p.map(([t, x, y]) => [t, x + ' ' + y])); return <animateTransform attributeName="transform" type="translate" dur={d + 's'} repeatCount="indefinite" calcMode="spline" keySplines={suave(k.values.split(';').length)} {...k} />; };
export const Ro = ({ p, c, d }) => { const k = kv(p.map(([t, a]) => [t, a + ' ' + c[0] + ' ' + c[1]])); return <animateTransform attributeName="transform" type="rotate" dur={d + 's'} repeatCount="indefinite" calcMode="spline" keySplines={suave(k.values.split(';').length)} {...k} />; };
export const At = ({ a, p, d }) => <animate attributeName={a} dur={d + 's'} repeatCount="indefinite" {...kv(p)} />;
// Visible entre a y b (con un fundido corto)
export const ve = (a, b, f = 0.03) => [[a, 0], [a + f, 1], [b - f, 1], [b, 0]];

/* ═══ Instrumentos (la punta en 0,0) ═══ */

export const Fresa = ({ pulidor }) => (
  <g>
    <path className="mango" d="M9,-36 L64,-86" />
    <rect className="ins" x="-10" y="-46" width="20" height="18" rx="5" />
    <path className="vastago" d="M0,-6 L0,-28" />
    {pulidor ? <path className="pulidor" d="M-4,-12 L4,-12 L1.5,0 L-1.5,0 Z" /> : <circle className="met" cx="0" cy="-3.5" r="4" />}
  </g>
);
export const Explorador = () => (
  <g>
    <path className="punta" d="M0,0 C-1,-6 2,-11 7,-13 L22,-38" />
    <path className="mango" d="M22,-38 L46,-92" />
  </g>
);
export const Jeringa = ({ gel }) => (
  <g>
    <path className="punta" d="M0,0 L-8,-18" strokeWidth="2.4" />
    <path className="mango" d="M-8,-18 L-26,-56" />
    {gel && <circle className="gel" cx="0" cy="1" r="2.6" />}
  </g>
);
export const Triple = () => (
  <g>
    <path className="punta" d="M0,0 L-12,-14 L-46,-30" strokeWidth="3" />
    <path className="mango" d="M-46,-30 L-70,-34" />
  </g>
);
export const Microbrush = () => (
  <g>
    <path className="mango fino" d="M0,-3 L14,-60" />
    <circle className="brush" cx="0" cy="-2" r="3.4" />
  </g>
);
export const Lampara = () => (
  <g>
    <path className="mango grueso" d="M0,-8 L0,-26 Q0,-36 12,-44 L58,-74" />
    <rect className="ins" x="-13" y="-8" width="26" height="8" rx="2.5" />
  </g>
);
export const Papel = ({ x = 0, y = 0 }) => (
  <g transform={`translate(${x},${y})`}>
    <rect className="pap" x="88" y="38" width="128" height="4" rx="1" />
    <path className="mango fino" d="M216,40 L262,40 M262,40 L292,30 M262,40 L292,50" />
  </g>
);
export const Gotas = ({ d, a, b, x = 0, y = 0 }) => (
  <g opacity="0" transform={`translate(${x},${y})`}><Op d={d} p={ve(a, b)} />
    {[[150, 40], [160, 46], [170, 38], [156, 54], [166, 50]].map(([x, y], k) => (
      <circle key={k} className="liq" cx={x} cy={y} r="2.2"><At d={d} a="cy" p={[[a, y - 18], [b, y + 16]]} /></circle>
    ))}
  </g>
);
export const Aire = ({ d, a, b, x = 0, y = 0 }) => (
  <g opacity="0" transform={`translate(${x},${y})`}><Op d={d} p={ve(a, b)} />
    {[0, 1, 2].map((k) => <path key={k} className="aire-l" d={`M${150 + k * 9},${34 - k * 3} q4,6 0,12`}><At d={d} a="stroke-dashoffset" p={[[a, 14], [b, -14]]} /></path>)}
  </g>
);
export const Luz = ({ d, a, b, x = 160, y = 40, ancho = 13 }) => (
  <path className="luz" opacity="0" d={`M${x - ancho},${y} L${x + ancho},${y} L${x + ancho + 10},${y + 34} L${x - ancho - 10},${y + 34} Z`}>
    <Op d={d} p={[[a - 0.02, 0], [a, 0.75], [(a + b) / 2, 0.55], [b, 0.75], [b + 0.02, 0]]} />
  </path>
);
export const Rotulo = ({ x, y, children, d, p, ancla = 'start', tono = '' }) => (
  <text x={x} y={y} textAnchor={ancla} className={cx('rot', tono)} opacity={p ? 0 : 1}>{p && <Op d={d} p={p} />}{children}</text>
);

// Dique de goma con clamp en el cuello del diente (izq y der: bordes del cuello; y: altura del cuello)
export function Dique({ izq = 98, der = 222, y = 118 }) {
  return (
    <g>
      <path className="diq" d={`M14,${y - 8} Q60,${y - 14} ${izq},${y}`} />
      <path className="diq" d={`M${der},${y} Q${der + 38},${y - 14} 306,${y - 8}`} />
      <rect className="clamp" x={izq - 6} y={y - 4} width="10" height="9" rx="2" />
      <rect className="clamp" x={der - 4} y={y - 4} width="10" height="9" rx="2" />
    </g>
  );
}
// Gotas de agua o suero y soplido de aire alrededor de (x, y)

/* ═══ Más instrumentos ═══ */

// Cepillo dental: las cerdas terminan en 0,0
export const Cepillo = () => (
  <g>
    <path className="mango" d="M26,-13 L96,-34" />
    <rect className="ins" x="-28" y="-18" width="56" height="8" rx="3" />
    <path className="cerdas" d="M-22,-10 L-22,0 M-14,-10 L-14,0 M-6,-10 L-6,0 M2,-10 L2,0 M10,-10 L10,0 M18,-10 L18,0" />
  </g>
);
// Dedo enguantado: la yema en 0,0, hacia abajo
export const Dedo = ({ ang = 0 }) => (
  <g transform={`rotate(${ang})`}><path className="dedo" d="M-13,-4 Q-13,4 0,4 Q13,4 13,-4 L13,-70 L-13,-70 Z" /><path className="una" d="M-7,-4 Q0,0 7,-4" /></g>
);
export const Algodon = ({ x, y, r = 9 }) => <g><circle className="algodon" cx={x} cy={y} r={r} /><path className="algodon-l" d={`M${x - r * 0.5},${y - r * 0.2} q${r * 0.5},${r * 0.4} ${r},0`} /></g>;
// Sonda periodontal con marcas milimetradas
export const SondaPerio = () => (
  <g>
    <path className="punta" d="M0,0 L0,-62" strokeWidth="2" />
    <path className="marca-sonda" d="M0,-10 L0,-16 M0,-22 L0,-28 M0,-40 L0,-46" />
    <path className="mango" d="M0,-62 L16,-122" />
  </g>
);
// Punta de ultrasonido (vibra)
export const Ultrasonido = ({ d, a, b }) => (
  <g>
    <path className="punta" d="M0,0 Q-4,-10 0,-20 L6,-40" strokeWidth="2.4" />
    <path className="mango grueso" d="M6,-40 L26,-112" />
    <g opacity="0"><Op d={d} p={ve(a, b)} /><path className="vibra" d="M-7,-3 q-3,-4 0,-8 M7,-3 q3,-4 0,-8" /></g>
  </g>
);
// Cureta Gracey: la hoja en 0,0
export const Cureta = () => (
  <g>
    <path className="punta" d="M0,0 Q-5,-3 -4,-8 Q-2,-12 0,-14 Q4,-30 2,-46 L10,-62" strokeWidth="2.2" />
    <path className="mango" d="M10,-62 L30,-124" />
  </g>
);
// Gotero de revelador
export const Gotero = () => (
  <g>
    <path className="punta" d="M0,0 L0,-26" strokeWidth="3" />
    <ellipse className="ins" cx="0" cy="-34" rx="7" ry="10" />
  </g>
);
// Lima endodóntica tipo K: la punta en 0,0; color del mango según la norma ISO; tope de silicona a `tope` de la punta
export const Lima = ({ n = 15, largo = 168, tope }) => {
  const zz = Array.from({ length: 16 }, (_, k) => `L${k % 2 ? 1.6 : -1.6},${-(k + 1) * 4}`).join(' ');
  return (
    <g>
      <path className="lima" d={`M0,0 ${zz} L0,-64 L0,${-largo}`} />
      <rect className="mango-lima" x="-5" y={-largo - 22} width="10" height="22" rx="2.5" style={{ fill: `var(--an-iso-${n})` }} />
      {tope && <ellipse className="tope" cx="0" cy={-tope} rx="5" ry="2" />}
    </g>
  );
};
// Fresa Gates Glidden (cabeza en llama) en contraángulo
export const Gates = ({ largo = 150 }) => (
  <g>
    <path className="met" d="M0,0 Q-3.4,-6 0,-12 Q3.4,-6 0,0 Z" />
    <path className="vastago" d={`M0,-12 L0,${-largo}`} />
    <rect className="ins" x="-9" y={-largo - 18} width="18" height="18" rx="5" />
  </g>
);
// Espaciador digital
export const Espaciador = ({ largo = 150 }) => (
  <g>
    <path className="punta" d={`M0,0 L-1.6,-60 L-1.6,${-largo + 20} M1.6,-60 L1.6,${-largo + 20} M0,0 L1.6,-60`} strokeWidth="1.2" />
    <rect className="ins" x="-5" y={-largo} width="10" height="20" rx="2.5" />
  </g>
);
// Elevador recto: la hoja arriba en 0,0, el mango hacia abajo
export const Elevador = () => (
  <g>
    <path className="punta" d="M0,0 Q-3,8 0,16 L2,32" strokeWidth="3.4" />
    <path className="mango grueso" d="M2,32 L12,104" />
  </g>
);
// Sindesmótomo: hoja fina arriba en 0,0
export const Sindesmotomo = () => (
  <g>
    <path className="punta" d="M0,0 L2,12 L6,40" strokeWidth="2.2" />
    <path className="mango" d="M6,40 L16,104" />
  </g>
);
// Fórceps: dos bocados que abrazan la corona desde abajo (0,0 = cuello del diente)
export const Forceps = () => (
  <g>
    <path className="bocado" d="M-24,0 Q-30,22 -18,46 L-10,120" />
    <path className="bocado" d="M24,0 Q30,22 18,46 L10,120" />
  </g>
);
// Gasa doblada
export const Gasa = () => (
  <g>
    <rect className="gasa" x="-20" y="-8" width="40" height="16" rx="3" />
    <path className="gasa-l" d="M-20,-2 L20,-2 M-20,3 L20,3 M-10,-8 L-10,8 M0,-8 L0,8 M10,-8 L10,8" />
  </g>
);
// Disco de pulir en mandril (gira)
export const Disco = ({ d }) => (
  <g>
    <path className="mango" d="M0,0 L56,-58" />
    <g><Ro d={d} c={[0, 0]} p={[[0, 0], [1, 1440]]} /><circle className="disco" cx="0" cy="0" r="11" /><path className="disco-l" d="M-11,0 L11,0" /></g>
  </g>
);
