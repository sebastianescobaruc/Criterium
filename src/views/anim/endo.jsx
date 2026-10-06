// Primer premolar superior en corte vestibulopalatino, con la corona hacia arriba (como en una radiografía de
// conductometría): dos raíces con su conducto. Los instrumentos trabajan en el conducto vestibular (a la izquierda).
// Biopulpectomía y necropulpectomía.
import React from 'react';
import { Op, Tr, Ro, At, ve, Fresa, Explorador, Jeringa, Microbrush, Gotas, Aire, Rotulo, Dique, Dedo, Algodon, Lima, Gates, Espaciador } from './base.jsx';

export const E = {
  esmalte: 'M114,84 C110,64 112,44 120,32 Q128,22 136,28 L150,44 L164,28 Q172,22 180,32 C188,44 190,64 186,84 Z',
  dentina: 'M116,84 C116,100 120,116 124,128 L106,170 Q108,180 116,178 L140,126 Q150,116 160,126 L184,178 Q192,180 194,170 L176,128 C180,116 184,100 184,84 Z',
  dentinaCorona: 'M122,82 C119,66 121,50 128,40 Q132,35 137,40 L150,56 L163,40 Q168,35 172,40 C179,50 181,66 178,82 Z',
  camara: 'M134,100 L136,72 Q138,64 142,66 L150,70 L158,66 Q162,64 164,72 L166,100 Q150,96 134,100 Z',
  acceso: 'M139,38 L141,70 L159,70 L161,38 Q150,42 139,38 Z',
  cariesM: 'M118,44 Q113,58 118,70 L131,64 Q129,52 126,42 Z',
  pared: 'M117,44 Q112,58 117,70 L131,64 Q129,52 125,42 Z',
  cuello: 84,
  // Sellado: corte de la gutapercha 1 mm bajo el cuello y doble sellado coronario
  ionomero: 'M135,91 L165,91 L164,72 Q160,66 150,70 Q140,66 136,72 Z',
  resina: 'M141,70 L159,70 L161,38 Q150,42 139,38 Z',
  torunda: [150, 86]
};
// Eje de cada conducto: de la entrada (t = 0) al ápice (t = 1)
export const EJE = { V: { o: [140, 100], v: [-27, 72], ang: 20.6 }, P: { o: [160, 100], v: [27, 72], ang: -20.6 } };
export const pt = (t, l = 'V') => { const e = EJE[l]; return [e.o[0] + e.v[0] * t, e.o[1] + e.v[1] * t]; };
// Polígono del conducto entre t0 y t1, con ancho w0 arriba y w1 abajo
export function canal(t0, t1, w0, w1, l = 'V') {
  const e = EJE[l]; const n = Math.hypot(e.v[0], e.v[1]); const px = e.v[1] / n, py = -e.v[0] / n;
  const [a, b] = [pt(t0, l), pt(t1, l)];
  const f = (p, w, s) => (p[0] + s * w * px).toFixed(1) + ',' + (p[1] + s * w * py).toFixed(1);
  return `M${f(a, w0, 1)} L${f(b, w1, 1)} L${f(b, w1, -1)} L${f(a, w0, -1)} Z`;
}
// Longitudes en t: 1 mm ≈ 0,095 del conducto en este dibujo
export const T = { dosTercios: 0.3, lt: 0.905, lt1: 0.81, lt2: 0.715, lt3: 0.62, tercioLT: 0.6 };
// Instrumento con la punta en el punto t del conducto vestibular
const EnConducto = ({ d, p, children, l = 'V' }) => (
  <g><Tr d={d} p={p.map(([tiempo, t]) => [tiempo, ...pt(t, l)])} /><g transform={`rotate(${EJE[l].ang})`}>{children}</g></g>
);
const fuera = -1.7; // t fuera del diente (arriba, fuera del cuadro)

export function Premolar({ acceso = false, conducto = 'pul', anchoV = [1.4, 1], anchoP = [1.4, 1], caries = false, children }) {
  return (
    <g>
      <path className="den" d={E.dentina} />
      <path className="esm" d={E.esmalte} />
      <path className="den sin-borde" d={E.dentinaCorona} />
      <path className={acceso ? 'aire' : 'pul'} d={E.camara} />
      {acceso && <path className="aire" d={E.acceso} />}
      <path className={conducto} d={canal(0, 1, anchoV[0], anchoV[1])} />
      <path className={conducto} d={canal(0, 1, anchoP[0], anchoP[1], 'P')} />
      {caries && <path className="car" d={E.cariesM} />}
      {children}
    </g>
  );
}
// Marcas de longitud junto al conducto vestibular
const Marca = ({ t, txt, d, p, x = 74 }) => {
  const [mx, my] = pt(t);
  return (
    <g opacity={p ? 0 : 1}>{p && <Op d={d} p={p} />}
      <path className="guia" d={`M${x + 30},${my} L${mx - 3},${my}`} />
      <text x={x + 27} y={my + 3.5} textAnchor="end" className="rot chico">{txt}</text>
    </g>
  );
};
const ConductosAnchos = { anchoV: [4.2, 1.2], anchoP: [4.2, 1.2] };

export const ESCENAS_ENDO = {
  // Pruebas de sensibilidad al frío (primero dientes control), percusión y palpación
  'endo.frio': {
    d: 9, quieto: 0.25, alt: 'Una torunda con frío toca primero los dientes control y después el diente en estudio; se completa con percusión y palpación.',
    C: ({ d }) => (
      <>
        <Premolar />
        <g><Tr d={d} p={[[0, 60, -20], [0.06, 108, 56], [0.34, 108, 56], [0.4, 60, -20]]} /><Algodon x={0} y={0} r={7} /><path className="frio" d="M-4,-4 L4,4 M4,-4 L-4,4 M0,-6 L0,6 M-6,0 L6,0" /></g>
        <path className="onda" d="M100,64 q-6,-4 -10,0 M98,72 q-8,-4 -14,0" opacity="0"><Op d={d} p={ve(0.14, 0.34)} /></path>
        <g><Tr d={d} p={[[0, 220, -50], [0.42, 220, -50], [0.48, 130, 18], [0.51, 130, 24], [0.54, 130, 18], [0.57, 130, 24], [0.6, 130, 18], [0.66, 220, -50]]} /><path className="mango" d="M0,0 L40,-60" /></g>
        <g><Tr d={d} p={[[0, 60, 220], [0.68, 60, 220], [0.74, 104, 156], [0.88, 104, 156], [0.94, 60, 220]]} /><g transform="rotate(130)"><Dedo /></g></g>
        <Rotulo x={232} y={40} d={d} p={ve(0.04, 0.38)} tono="acento">frío: primero 2 o 3</Rotulo>
        <Rotulo x={232} y={53} d={d} p={ve(0.04, 0.38)}>dientes control, después este</Rotulo>
        <Rotulo x={232} y={40} d={d} p={ve(0.44, 0.64)}>percusión</Rotulo>
        <Rotulo x={232} y={40} d={d} p={ve(0.7, 0.94)}>palpación</Rotulo>
        <Rotulo x={232} y={53} d={d} p={ve(0.74, 0.94)}>y anota el diagnóstico</Rotulo>
      </>
    )
  },
  // En la radiografía: LAD, sus 2/3 y la distancia al techo de la cámara
  'endo.rx': {
    d: 8, quieto: 0.9, alt: 'Sobre la radiografía se mide la longitud aparente del diente, se marcan sus dos tercios y la distancia desde la cúspide hasta el techo de la cámara.',
    C: ({ d }) => (
      <>
        <rect className="rx-fondo" x="40" y="4" width="360" height="180" />
        <g className="rx"><Premolar /></g>
        <g opacity="0"><Op d={d} p={[[0.06, 0], [0.12, 1], [0.95, 1], [0.99, 0]]} />
          <path className="regla" d="M92,22 L92,22"><At d={d} a="d" p={[[0.06, 'M92,22 L92,22'], [0.3, 'M92,22 L92,172']]} /></path>
          <path className="regla" d="M86,22 L98,22 M86,172 L98,172" />
          <text x="84" y="100" textAnchor="end" className="rot claro">LAD</text>
        </g>
        <g opacity="0"><Op d={d} p={[[0.34, 0], [0.4, 1], [0.95, 1], [0.99, 0]]} /><path className="regla" d="M86,122 L132,122" /><text x="84" y="125" textAnchor="end" className="rot claro menta">2/3</text></g>
        <g opacity="0"><Op d={d} p={[[0.58, 0], [0.64, 1], [0.95, 1], [0.99, 0]]} /><path className="regla" d="M206,22 L206,64 M200,22 L212,22 M200,64 L212,64" /><path className="guia claro" d="M136,22 L200,22 M166,64 L200,64" /></g>
        <Rotulo x={232} y={30} d={d} p={ve(0.08, 0.3)} tono="claro">mide la LAD</Rotulo>
        <Rotulo x={232} y={30} d={d} p={ve(0.36, 0.56)} tono="claro">marca sus 2/3</Rotulo>
        <Rotulo x={222} y={46} d={d} p={ve(0.62, 0.95)} tono="claro">al techo de la cámara</Rotulo>
        <Rotulo x={222} y={160} d={d} p={ve(0.74, 0.95)} tono="claro menta">¿cuántas raíces ves?</Rotulo>
      </>
    )
  },
  // Elimina la caries y reconstruye las paredes que falten con resina
  'endo.preparar': {
    d: 7, quieto: 0.9, alt: 'La fresa elimina la caries de la corona y la pared que falta se reconstruye con resina compuesta antes de entrar a la cámara.',
    C: ({ d }) => (
      <>
        <Premolar />
        <path className="aire" d={E.pared} opacity="0"><Op d={d} p={[[0.1, 0], [0.4, 1], [0.6, 1], [0.7, 0]]} /></path>
        <path className="car" d={E.cariesM}><Op d={d} p={[[0.1, 1], [0.4, 0], [0.97, 0], [0.995, 1]]} /></path>
        <path className="res" d={E.pared} opacity="0"><Op d={d} p={[[0.56, 0], [0.7, 1], [0.95, 1], [0.99, 0]]} /></path>
        <g><Tr d={d} p={[[0, 124, -40], [0.08, 122, 46], [0.16, 118, 58], [0.24, 124, 66], [0.32, 120, 52], [0.4, 124, -40]]} /><Fresa /></g>
        <Rotulo x={232} y={40} d={d} p={ve(0.06, 0.44)}>elimina la caries</Rotulo>
        <Rotulo x={232} y={40} d={d} p={ve(0.54, 0.95)} tono="acento">reconstruye la pared</Rotulo>
        <Rotulo x={232} y={53} d={d} p={ve(0.58, 0.95)}>con resina compuesta</Rotulo>
      </>
    )
  },
  // Anestesia y cavidad de acceso: diamante perpendicular hacia la cúspide vestibular, carburo paralelo al eje
  'endo.acceso': {
    d: 8, quieto: 0.92, alt: 'Con el diente anestesiado, la fresa de diamante entra perpendicular por el surco hacia vestibular; en dentina sigue la de carburo paralela al eje hasta abrir la cámara y ver las dos entradas.',
    C: ({ d }) => (
      <>
        <Premolar>
          <path className="aire" d="M141,38 L142,50 L158,50 L159,38 Q150,42 141,38 Z" opacity="0"><Op d={d} p={[[0.12, 0], [0.3, 1], [0.95, 1], [0.99, 0]]} /></path>
          <g opacity="0"><Op d={d} p={[[0.4, 0], [0.62, 1], [0.95, 1], [0.99, 0]]} /><path className="aire" d={E.acceso} /><path className="aire" d={E.camara} /></g>
          <g opacity="0"><Op d={d} p={ve(0.66, 0.95)} /><circle className="entrada" cx="140" cy="100" r="2.6" /><circle className="entrada" cx="160" cy="100" r="2.6" /></g>
        </Premolar>
        <g><Tr d={d} p={[[0, 146, -40], [0.1, 146, 40], [0.3, 146, 50], [0.36, 146, -40], [1, 146, -40]]} /><Fresa /></g>
        <g><Tr d={d} p={[[0, 150, -60], [0.36, 150, -60], [0.42, 150, 50], [0.6, 150, 72], [0.66, 150, -60]]} /><Fresa /></g>
        <Rotulo x={232} y={30} d={d} p={ve(0.02, 0.1)}>anestesia</Rotulo>
        <Rotulo x={232} y={30} d={d} p={ve(0.1, 0.34)}>diamante perpendicular,</Rotulo>
        <Rotulo x={232} y={43} d={d} p={ve(0.1, 0.34)}>hacia la cúspide vestibular</Rotulo>
        <Rotulo x={232} y={30} d={d} p={ve(0.38, 0.64)}>en dentina: carburo de baja</Rotulo>
        <Rotulo x={232} y={43} d={d} p={ve(0.38, 0.64)}>paralelo al eje</Rotulo>
        <Rotulo x={232} y={30} d={d} p={ve(0.68, 0.95)} tono="acento">ves las dos entradas</Rotulo>
      </>
    )
  },
  // Dique con el clamp amarrado al arco con hilo dental; desinfecta el campo
  'endo.dique': {
    d: 7, quieto: 0.8, alt: 'Se instala el dique de goma, el clamp queda amarrado con hilo dental y se desinfecta el campo, sin algodón bajo el dique.',
    C: ({ d }) => (
      <>
        <Premolar acceso />
        <g><Tr d={d} p={[[0, 0, -80], [0.04, 0, -80], [0.3, 0, 0], [0.94, 0, 0], [0.98, 0, -80]]} /><Op d={d} p={[[0.02, 0], [0.06, 1], [0.94, 1], [0.98, 0]]} /><Dique izq={114} der={186} y={88} />
          <path className="hilo" d="M110,88 Q86,60 70,10" pathLength="1" strokeDasharray="1 1" strokeDashoffset="1"><animate attributeName="stroke-dashoffset" dur={d + 's'} repeatCount="indefinite" values="1;1;0;0;1" keyTimes="0;0.34;0.5;0.94;1" /></path>
        </g>
        <Rotulo x={232} y={30} d={d} p={ve(0.06, 0.32)}>dique de goma</Rotulo>
        <Rotulo x={232} y={30} d={d} p={ve(0.36, 0.62)} tono="acento">clamp amarrado con hilo</Rotulo>
        <Rotulo x={232} y={30} d={d} p={ve(0.66, 0.94)}>desinfecta el campo</Rotulo>
        <Rotulo x={232} y={43} d={d} p={ve(0.7, 0.94)} tono="mal">nunca algodón bajo el dique</Rotulo>
      </>
    )
  },
  // Lima #10 hasta 2/3 de la LAD, irriga, y Gates en los tercios cervical y medio sin pasar los 2/3
  'endo.tercios': {
    d: 9, quieto: 0.85, alt: 'La lima número 10 explora hasta los dos tercios de la LAD; después las fresas Gates Glidden ensanchan los tercios cervical y medio sin pasar de esa marca.',
    C: ({ d }) => (
      <>
        <Premolar acceso />
        <path className="pul" d={canal(0, T.dosTercios, 4.2, 2.4)} opacity="0" />
        <path className="aire" d={canal(0, T.dosTercios, 4.2, 2.2)} opacity="0"><Op d={d} p={[[0.5, 0], [0.8, 1], [0.95, 1], [0.99, 0]]} /></path>
        <Marca t={T.dosTercios} txt="2/3 LAD" />
        <EnConducto d={d} p={[[0, fuera], [0.08, fuera], [0.18, T.dosTercios], [0.3, T.dosTercios], [0.36, fuera]]}><Lima n={10} /></EnConducto>
        <Gotas d={d} a={0.36} b={0.46} x={-10} y={26} />
        <EnConducto d={d} p={[[0, fuera], [0.48, fuera], [0.56, T.dosTercios * 0.6], [0.62, 0.05], [0.7, T.dosTercios], [0.78, 0.05], [0.84, T.dosTercios], [0.9, fuera]]}><Gates /></EnConducto>
        <Rotulo x={232} y={30} d={d} p={ve(0.08, 0.34)}>lima #10 hasta 2/3 de la LAD</Rotulo>
        <Rotulo x={232} y={30} d={d} p={ve(0.36, 0.46)}>irriga</Rotulo>
        <Rotulo x={232} y={30} d={d} p={ve(0.5, 0.92)} tono="acento">Gates: tercio cervical y medio</Rotulo>
        <Rotulo x={232} y={43} d={d} p={ve(0.54, 0.92)}>sin pasar los 2/3, sin forzar</Rotulo>
      </>
    )
  },
  // Localizador: lima K10 o K15 hasta «0.0», tope, resta 1 mm y radiografía de conductometría
  'endo.localizador': {
    d: 9, quieto: 0.6, alt: 'Con el conducto húmedo, la lima avanza hasta que el localizador marca 0.0; se ajusta el tope, se resta 1 mm para la longitud de trabajo y se toma la radiografía.',
    C: ({ d }) => {
      const lecturas = [['1.0', 0.1, 0.22], ['0.5', 0.22, 0.32], ['0.0', 0.32, 0.66]];
      return (
        <>
          <Premolar acceso {...ConductosAnchos} conducto="liq" />
          <rect className="pantalla" x="258" y="96" width="62" height="40" rx="8" />
          {lecturas.map(([v, a, b]) => <text key={v} x="289" y="123" textAnchor="middle" className={v === '0.0' ? 'lectura cero' : 'lectura'} opacity="0"><Op d={d} p={ve(a, b, 0.01)} />{v}</text>)}
          <path className="cable" d="M258,116 Q220,120 196,40" />
          <EnConducto d={d} p={[[0, fuera], [0.06, fuera], [0.14, 0.6], [0.24, 0.85], [0.32, 1], [0.6, 1], [0.66, T.lt], [0.94, T.lt], [0.98, fuera]]}><Lima n={15} tope={154} /></EnConducto>
          <Marca t={T.lt} txt="LT" d={d} p={ve(0.64, 0.95)} />
          <Rotulo x={232} y={30} d={d} p={ve(0.06, 0.34)}>conducto húmedo, cámara seca</Rotulo>
          <Rotulo x={232} y={30} d={d} p={ve(0.36, 0.6)} tono="acento">hasta «0.0»: ajusta el tope</Rotulo>
          <Rotulo x={232} y={30} d={d} p={ve(0.64, 0.95)} tono="acento">resta 1 mm = LT</Rotulo>
          <Rotulo x={232} y={43} d={d} p={ve(0.7, 0.95)}>confirma y toma la rx</Rotulo>
        </>
      );
    }
  },
  // Irriga con hipoclorito toda la preparación, aguja con tope a 2/3 de la LT, sin trabar ni empujar
  'endo.irrigar': {
    d: 7, quieto: 0.5, alt: 'La aguja precurvada entra con tope a dos tercios de la longitud de trabajo, sin trabarse; el hipoclorito llena el conducto y se aspira.',
    C: ({ d }) => (
      <>
        <Premolar acceso {...ConductosAnchos} conducto="aire" />
        <path className="liq" d={canal(0, 1, 4.2, 1.2)} opacity="0"><Op d={d} p={[[0.2, 0], [0.4, 1], [0.86, 1], [0.94, 0]]} /></path>
        <path className="liq" d={E.camara} opacity="0"><Op d={d} p={[[0.3, 0], [0.44, 0.8], [0.6, 0.8], [0.72, 0]]} /></path>
        <Marca t={T.tercioLT} txt="2/3 LT" />
        <EnConducto d={d} p={[[0, fuera], [0.08, fuera], [0.18, T.tercioLT], [0.7, T.tercioLT], [0.78, fuera]]}><path className="punta" d="M0,0 L0,-150" strokeWidth="2.2" /><ellipse className="tope" cx="0" cy="-60" rx="5" ry="2" /><path className="mango" d="M0,-150 L0,-180" /></EnConducto>
        <g><Tr d={d} p={[[0, 220, -30], [0.5, 220, -30], [0.56, 164, 66], [0.84, 164, 66], [0.9, 220, -30]]} /><path className="mango grueso" d="M0,0 L40,-60" /><circle className="ins" cx="0" cy="0" r="4" /></g>
        <Rotulo x={232} y={30} d={d} p={ve(0.08, 0.5)} tono="acento">hipoclorito todo el tiempo</Rotulo>
        <Rotulo x={232} y={43} d={d} p={ve(0.12, 0.5)}>aguja con tope a 2/3 de la LT</Rotulo>
        <Rotulo x={232} y={30} d={d} p={ve(0.52, 0.9)}>sin trabar ni empujar fuerte</Rotulo>
        <Rotulo x={232} y={43} d={d} p={ve(0.56, 0.9)} tono="acento">aspira</Rotulo>
      </>
    )
  },
  // Tercio apical: lima inicial y 4 o 5 limas más hasta una maestra de al menos #30, con permeabilidad entre cada una
  'endo.apical': {
    d: 10, quieto: 0.9, alt: 'Desde la lima inicial se amplía con cuatro o cinco limas sucesivas a la longitud de trabajo, con entrada pasiva y salida activa, pasando una lima fina de permeabilidad entre cada una, hasta una lima maestra de al menos 30.',
    C: ({ d }) => {
      const limas = [[15, 0.02], [20, 0.2], [25, 0.38], [30, 0.56]];
      return (
        <>
          <Premolar acceso anchoV={[4.2, 1]} anchoP={[4.2, 1.2]} conducto="liq" />
          {limas.map(([n, a], k) => <path key={'c' + n} className="liq" d={canal(0.5, T.lt, 2.6, 1.2 + k * 0.5)} opacity="0"><Op d={d} p={[[a + 0.12, 0], [a + 0.16, 1], [0.96, 1], [0.99, 0]]} /></path>)}
          <Marca t={T.lt} txt="LT" />
          {limas.map(([n, a]) => (
            <EnConducto key={n} d={d} p={[[0, fuera], [a, fuera], [a + 0.04, T.lt - 0.1], [a + 0.07, T.lt], [a + 0.09, T.lt - 0.05], [a + 0.11, T.lt], [a + 0.14, fuera]]}><Lima n={n} tope={140} /></EnConducto>
          ))}
          {limas.slice(0, 3).map(([n, a]) => <EnConducto key={'p' + n} d={d} p={[[0, fuera], [a + 0.14, fuera], [a + 0.16, T.lt + 0.04], [a + 0.18, fuera]]}><Lima n={10} /></EnConducto>)}
          <Rotulo x={232} y={30} d={d} p={ve(0.02, 0.18)}>lima inicial a la LT</Rotulo>
          <Rotulo x={232} y={30} d={d} p={ve(0.2, 0.72)}>4 o 5 limas sobre ella</Rotulo>
          <Rotulo x={232} y={43} d={d} p={ve(0.22, 0.72)}>entra pasiva, sale activa</Rotulo>
          <Rotulo x={232} y={56} d={d} p={ve(0.3, 0.72)}>lima fina de permeabilidad</Rotulo>
          <Rotulo x={232} y={30} d={d} p={ve(0.76, 0.96)} tono="acento">maestra de al menos #30</Rotulo>
        </>
      );
    }
  },
  // Escalonado: LT − 1, − 2, − 3 mm, recapitulando con la maestra a LT entre cada lima
  'endo.stepback': {
    d: 10, quieto: 0.9, alt: 'Cada lima siguiente llega 1 mm más corta: a LT menos 1, menos 2 y menos 3 milímetros; entre cada una se irriga y la lima maestra vuelve a la longitud de trabajo.',
    C: ({ d }) => {
      const pasos = [[35, T.lt1, 0.02, 'LT − 1'], [40, T.lt2, 0.3, 'LT − 2'], [45, T.lt3, 0.58, 'LT − 3']];
      return (
        <>
          <Premolar acceso anchoV={[4.2, 2.4]} anchoP={[4.2, 1.2]} conducto="liq" />
          {pasos.map(([n, t, a], k) => <path key={'c' + n} className="liq" d={canal(0.3, t, 3.6, 2.6 + k * 0.3)} opacity="0"><Op d={d} p={[[a + 0.1, 0], [a + 0.13, 1], [0.96, 1], [0.99, 0]]} /></path>)}
          <Marca t={T.lt} txt="LT" />
          {pasos.map(([n, t, a, txt]) => <Marca key={txt} t={t} txt={txt} x={46} d={d} p={ve(a + 0.04, a + 0.17)} />)}
          {pasos.map(([n, t, a]) => (
            <EnConducto key={n} d={d} p={[[0, fuera], [a, fuera], [a + 0.06, t], [a + 0.12, t], [a + 0.16, fuera]]}><Lima n={n} tope={140} /></EnConducto>
          ))}
          {pasos.map(([, , a]) => <EnConducto key={'r' + a} d={d} p={[[0, fuera], [a + 0.18, fuera], [a + 0.22, T.lt], [a + 0.25, T.lt], [a + 0.28, fuera]]}><Lima n={30} /></EnConducto>)}
          <Rotulo x={232} y={30} d={d} p={ve(0.02, 0.86)}>cada lima, 1 mm más corta</Rotulo>
          <Rotulo x={232} y={43} d={d} p={ve(0.18, 0.86)} tono="acento">recapitula con la maestra a LT</Rotulo>
          <Rotulo x={232} y={56} d={d} p={ve(0.2, 0.86)}>irriga entre cada lima</Rotulo>
          <Rotulo x={232} y={30} d={d} p={ve(0.87, 0.98, 0.02)} tono="acento">hasta empalmar</Rotulo>
          <Rotulo x={232} y={43} d={d} p={ve(0.87, 0.98, 0.02)} tono="acento">con el tercio medio</Rotulo>
        </>
      );
    }
  },
  // Irrigación final: hipoclorito, suero, EDTA 17 % 1 minuto, suero (y clorhexidina al final si se usa)
  'endo.irrigacionfinal': {
    d: 10, quieto: 0.5, alt: 'El conducto se irriga en orden: hipoclorito, suero fisiológico, EDTA al 17 por ciento durante un minuto y suero; la clorhexidina, si se usa, va al final.',
    C: ({ d }) => {
      const orden = [['liq', 'hipoclorito', 0.02, 0.22], ['suero', 'suero fisiológico', 0.24, 0.42], ['edta', 'EDTA 17 % · 1 minuto', 0.44, 0.68], ['suero', 'suero fisiológico', 0.7, 0.88]];
      return (
        <>
          <Premolar acceso {...ConductosAnchos} conducto="aire" />
          {orden.map(([c, , a, b], k) => <path key={k} className={c} d={canal(0, 1, 4.2, 1.2)} opacity="0"><Op d={d} p={ve(a + 0.03, b, 0.03)} /></path>)}
          {orden.map(([, txt, a, b], k) => <Rotulo key={k} x={232} y={30} d={d} p={ve(a + 0.02, b)} tono={k === 2 ? 'acento' : ''}>{k + 1} · {txt}</Rotulo>)}
          <Rotulo x={232} y={30} d={d} p={ve(0.89, 0.98, 0.02)}>clorhexidina, si la usas,</Rotulo>
          <Rotulo x={232} y={43} d={d} p={ve(0.89, 0.98, 0.02)}>va al final</Rotulo>
        </>
      );
    }
  },
  // Medicación entre sesiones: hidróxido de calcio a LT − 1 o − 2 mm, torunda, provisorio y ionómero
  'endo.medicacion': {
    d: 9, quieto: 0.92, alt: 'Si el tratamiento sigue otro día, el hidróxido de calcio llena el conducto hasta 1 o 2 mm antes de la longitud de trabajo; encima, una torunda estéril, 2 mm de provisorio e ionómero.',
    C: ({ d }) => (
      <>
        <Premolar acceso {...ConductosAnchos} conducto="aire" />
        <path className="hidroxido" d={canal(0, T.lt1, 4.2, 1.4)} opacity="0"><Op d={d} p={[[0.08, 0], [0.4, 1], [0.96, 1], [0.99, 0]]} /></path>
        <path className="hidroxido" d={canal(0, T.lt1, 4.2, 1.4, 'P')} opacity="0"><Op d={d} p={[[0.08, 0], [0.4, 1], [0.96, 1], [0.99, 0]]} /></path>
        <EnConducto d={d} p={[[0, fuera], [0.04, fuera], [0.12, T.lt1], [0.36, T.lt1 - 0.3], [0.42, fuera]]}><Lima n={25} /></EnConducto>
        <path className="giro" d="M226,104 a10,10 0 1,0 6,-8" opacity="0"><Op d={d} p={ve(0.08, 0.4)} /></path>
        <g opacity="0"><Op d={d} p={[[0.46, 0], [0.52, 1], [0.96, 1], [0.99, 0]]} /><Algodon x={150} y={88} r={8} /></g>
        <path className="provisorio" d="M136,80 L164,80 L163,70 Q150,66 137,70 Z" opacity="0"><Op d={d} p={[[0.58, 0], [0.64, 1], [0.96, 1], [0.99, 0]]} /></path>
        <path className="iono" d={E.resina} opacity="0"><Op d={d} p={[[0.72, 0], [0.78, 1], [0.96, 1], [0.99, 0]]} /></path>
        <Marca t={T.lt1} txt="LT − 1" d={d} p={ve(0.06, 0.44)} />
        <Rotulo x={232} y={30} d={d} p={ve(0.06, 0.44)} tono="acento">hidróxido de calcio</Rotulo>
        <Rotulo x={232} y={43} d={d} p={ve(0.08, 0.44)}>lima en sentido antihorario</Rotulo>
        <Rotulo x={232} y={30} d={d} p={ve(0.48, 0.58)}>torunda estéril</Rotulo>
        <Rotulo x={232} y={30} d={d} p={ve(0.6, 0.72)}>2 mm de provisorio</Rotulo>
        <Rotulo x={232} y={30} d={d} p={ve(0.74, 0.96)} tono="acento">ionómero encima</Rotulo>
      </>
    )
  },
  // Conometría y obturación: cono maestro a LT, sellador y condensación lateral con al menos tres conos accesorios
  'endo.obturar': {
    d: 10, quieto: 0.92, alt: 'El cono maestro llega a la longitud de trabajo con retención; con sellador, el espaciador abre espacio y se suman al menos tres conos accesorios hasta llenar el conducto.',
    C: ({ d }) => {
      const acc = [0.4, 0.56, 0.72];
      return (
        <>
          <Premolar acceso {...ConductosAnchos} conducto="aire" />
          <g><Tr d={d} p={[[0, 0, -120], [0.04, 0, -120], [0.18, 0, 0], [0.96, 0, 0], [0.99, 0, -120]]} /><path className="gut" d={canal(-0.8, T.lt, 2.4, 1.1)} /></g>
          {acc.map((a, k) => <path key={k} className="gut" d={canal(-0.4, T.lt3 - k * 0.12, 1.3, 0.5)} transform={`translate(${2.2 + k * 0.8},${-0.6})`} opacity="0"><Op d={d} p={[[a + 0.08, 0], [a + 0.12, 1], [0.96, 1], [0.99, 0]]} /></path>)}
          {acc.map((a, k) => <EnConducto key={'e' + k} d={d} p={[[0, fuera], [a, fuera], [a + 0.04, T.lt3 - k * 0.1], [a + 0.08, fuera]]}><g transform="translate(2.4,0)"><Espaciador /></g></EnConducto>)}
          <Marca t={T.lt} txt="LT" />
          <Rotulo x={232} y={30} d={d} p={ve(0.04, 0.34)}>cono maestro a la LT</Rotulo>
          <Rotulo x={232} y={43} d={d} p={ve(0.08, 0.34)}>con retención · confirma con rx</Rotulo>
          <Rotulo x={232} y={30} d={d} p={ve(0.38, 0.84)} tono="acento">condensación lateral</Rotulo>
          <Rotulo x={232} y={43} d={d} p={ve(0.4, 0.84)}>al menos 3 conos accesorios</Rotulo>
          <Rotulo x={232} y={30} d={d} p={ve(0.85, 0.98, 0.02)}>rx: lleno hasta la LT,</Rotulo>
          <Rotulo x={232} y={43} d={d} p={ve(0.85, 0.98, 0.02)}>sin vacíos</Rotulo>
        </>
      );
    }
  },
  // Corta la gutapercha 1 mm bajo el cuello, limpia con alcohol y haz el doble sellado coronario
  'endo.sellar': {
    d: 9, quieto: 0.92, alt: 'La gutapercha se corta 1 mm bajo el cuello del diente, la cámara se limpia con alcohol y se hace el doble sellado coronario: ionómero y resina.',
    C: ({ d }) => (
      <>
        <Premolar acceso {...ConductosAnchos} conducto="gut" />
        <path className="gut" d={E.camara}><Op d={d} p={[[0.14, 1], [0.26, 0], [0.97, 0], [0.995, 1]]} /></path>
        <path className="guia" d="M100,91 L200,91" opacity="0"><Op d={d} p={ve(0.06, 0.3)} /></path>
        <path className="guia" d={`M100,${E.cuello} L200,${E.cuello}`} opacity="0"><Op d={d} p={ve(0.06, 0.3)} /></path>
        <g><Tr d={d} p={[[0, 150, -40], [0.06, 150, 91], [0.24, 150, 91], [0.3, 150, -40]]} /><path className="caliente" d="M0,0 L0,-120" /><path className="mango" d="M0,-120 L30,-170" /></g>
        <g><Tr d={d} p={[[0, 200, -40], [0.32, 200, -40], [0.36, 150, 84], [0.4, 144, 80], [0.44, 156, 80], [0.48, 200, -40]]} /><Algodon x={0} y={0} r={6} /></g>
        <path className="iono" d={E.ionomero} opacity="0"><Op d={d} p={[[0.52, 0], [0.6, 1], [0.96, 1], [0.99, 0]]} /></path>
        <path className="res" d={E.resina} opacity="0"><Op d={d} p={[[0.68, 0], [0.76, 1], [0.96, 1], [0.99, 0]]} /></path>
        <Rotulo x={232} y={30} d={d} p={ve(0.04, 0.3)} tono="acento">corta 1 mm bajo el cuello</Rotulo>
        <Rotulo x={232} y={30} d={d} p={ve(0.34, 0.5)}>limpia con alcohol</Rotulo>
        <Rotulo x={232} y={30} d={d} p={ve(0.54, 0.96)} tono="acento">doble sellado coronario</Rotulo>
        <Rotulo x={232} y={43} d={d} p={ve(0.8, 0.96)}>y agenda la rehabilitación</Rotulo>
      </>
    )
  }
};
