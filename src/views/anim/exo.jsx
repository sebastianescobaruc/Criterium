// Maxilar visto por vestibular: el 1.8 con la corona hacia abajo, el 1.7 a su lado, la tuberosidad hacia distal
// y el seno maxilar sobre las raíces. Exodoncia simple del tercer molar superior.
import React from 'react';
import { Op, Tr, Ro, ve, Jeringa, Rotulo, Gotas, Dedo, Elevador, Sindesmotomo, Forceps, Gasa } from './base.jsx';

export const X = {
  hueso: 'M40,4 L330,4 L330,30 C326,70 300,100 262,108 C246,110 228,108 214,104 L40,104 Z',
  seno: 'M92,12 C130,6 220,8 252,20 C266,30 254,48 230,52 L118,52 C94,50 82,26 92,12 Z',
  piso: 'M118,52 L230,52',
  encia: 'M40,100 L132,100 C150,96 192,96 212,100 C232,106 250,108 264,104 L264,112 C246,118 230,118 212,114 L198,118 C186,122 154,122 142,118 L132,114 L40,114 Z',
  margen: 'M144,117 C154,121 186,121 196,117',
  raices: 'M148,116 C146,96 148,78 156,64 Q160,58 163,64 L169,88 L175,64 Q178,58 182,64 C190,78 194,96 192,116 Z',
  corona: 'M146,114 C142,130 144,150 150,160 Q158,166 165,162 L169,158 L173,162 Q180,166 188,160 C194,150 196,130 192,114 Z',
  alveolo: 'M150,118 C148,96 150,78 157,66 Q160,62 162,66 L169,90 L176,66 Q178,62 181,66 C188,78 191,96 190,118 Z'
};
const desplazar = (d, dx) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => (+x + dx) + ',' + y);
const X17 = { raices: desplazar(X.raices, -82), corona: desplazar(X.corona, -82) };

export function Maxilar({ diente = true, alveolo = false, children }) {
  return (
    <g>
      <path className="hue" d={X.hueso} />
      <path className="seno" d={X.seno} />
      <path className="piso" d={X.piso} />
      {alveolo && <path className="alveolo" d={X.alveolo} />}
      <path className="raiz" d={X17.raices} />
      <path className="esm" d={X17.corona} />
      {diente && <g><path className="raiz" d={X.raices} /><path className="esm" d={X.corona} /></g>}
      {children}
      <path className="enc" d={X.encia} />
    </g>
  );
}
export const Diente18 = () => <g><path className="raiz" d={X.raices} /><path className="esm" d={X.corona} /></g>;
// Dedos que sostienen la tuberosidad
const Dedos = () => <g><g transform="translate(268,100) rotate(58) scale(.62)"><Dedo /></g><g transform="translate(296,78) rotate(66) scale(.62)"><Dedo /></g></g>;

export const ESCENAS_EXO = {
  // Infiltra por vestibular y completa con una punción palatina
  'exo.anestesia': {
    d: 8, quieto: 0.3, alt: 'La aguja infiltra en el fondo del vestíbulo, sobre el diente; después se completa con una punción por palatino.',
    C: ({ d }) => (
      <>
        <Maxilar />
        <g><Tr d={d} p={[[0, 250, 190], [0.1, 204, 92], [0.4, 204, 92], [0.48, 250, 190]]} /><g transform="rotate(205)"><Jeringa /></g></g>
        <circle className="liq" cx="204" cy="92" r="0"><animate attributeName="r" dur={d + 's'} repeatCount="indefinite" values="0;0;7;7;0" keyTimes="0;0.14;0.38;0.48;1" /></circle>
        <g className="atras" opacity="0"><Op d={d} p={ve(0.52, 0.82)} /><g transform="translate(176,108) rotate(185)"><Jeringa /></g></g>
        <Rotulo x={272} y={130} d={d} p={ve(0.08, 0.46)} tono="acento">infiltra</Rotulo>
        <Rotulo x={272} y={143} d={d} p={ve(0.08, 0.46)} tono="acento">por vestibular</Rotulo>
        <Rotulo x={272} y={130} d={d} p={ve(0.52, 0.82)}>y una punción</Rotulo>
        <Rotulo x={272} y={143} d={d} p={ve(0.52, 0.82)}>palatina</Rotulo>
        <Rotulo x={272} y={130} d={d} p={ve(0.86, 0.97, 0.02)}>empieza con un tubo</Rotulo>
      </>
    )
  },
  // Separa la encía del cuello del diente en todo el contorno
  'exo.sindesmotomia': {
    d: 7, quieto: 0.75, alt: 'El sindesmótomo recorre el cuello del diente y separa la encía en todo el contorno.',
    C: ({ d }) => (
      <>
        <Maxilar />
        <path className="separa" d={X.margen} pathLength="1" strokeDasharray="1 1" strokeDashoffset="1"><animate attributeName="stroke-dashoffset" dur={d + 's'} repeatCount="indefinite" values="1;1;0;0;1" keyTimes="0;0.1;0.7;0.96;1" /></path>
        <g><Tr d={d} p={[[0, 160, 190], [0.08, 145, 117], [0.25, 160, 121], [0.42, 180, 121], [0.6, 196, 117], [0.7, 196, 117], [0.78, 220, 190]]} /><Sindesmotomo /></g>
        <Rotulo x={272} y={130} d={d} p={ve(0.06, 0.66)}>separa la encía</Rotulo>
        <Rotulo x={272} y={143} d={d} p={ve(0.06, 0.66)}>del cuello</Rotulo>
        <Rotulo x={272} y={130} d={d} p={ve(0.72, 0.96)} tono="acento">en todo el contorno</Rotulo>
      </>
    )
  },
  // Luxa con el elevador mientras sostienes la tuberosidad con los dedos
  'exo.luxar': {
    d: 7, quieto: 0.5, alt: 'El elevador entra por mesial entre el 1.7 y el 1.8 y luxa el diente, mientras los dedos de la otra mano sostienen la tuberosidad.',
    C: ({ d }) => (
      <>
        <Maxilar diente={false}>
          <g><Ro d={d} c={[170, 70]} p={[[0, 0], [0.3, 0], [0.38, -3.5], [0.46, 0.5], [0.54, -4], [0.62, 0.5], [0.7, -3], [0.8, 0]]} /><Diente18 /></g>
        </Maxilar>
        <Dedos />
        <g><Tr d={d} p={[[0, 120, 190], [0.12, 134, 110], [0.82, 134, 110], [0.92, 120, 190]]} /><g><Ro d={d} c={[0, 0]} p={[[0, 0], [0.3, 0], [0.38, 14], [0.46, 0], [0.54, 16], [0.62, 0], [0.7, 12], [0.8, 0]]} /><Elevador /></g></g>
        <Rotulo x={272} y={136} d={d} p={ve(0.04, 0.32)} tono="acento">sostén</Rotulo>
        <Rotulo x={272} y={149} d={d} p={ve(0.04, 0.32)} tono="acento">la tuberosidad</Rotulo>
        <Rotulo x={272} y={136} d={d} p={ve(0.34, 0.8)}>luxa con el elevador</Rotulo>
        <Rotulo x={272} y={136} d={d} p={ve(0.84, 0.97, 0.02)} tono="acento">movilidad clara</Rotulo>
      </>
    )
  },
  // Toma el diente con el fórceps y extráelo hacia vestibular y oclusal
  'exo.forceps': {
    d: 7, quieto: 0.55, alt: 'El fórceps toma la corona y el diente sale con un movimiento controlado hacia vestibular y oclusal.',
    C: ({ d }) => (
      <>
        <Maxilar diente={false} alveolo />
        <g>
          <Tr d={d} p={[[0, 0, 0], [0.3, 0, 0], [0.42, 2, 8], [0.6, 4, 36], [0.86, 4, 36], [0.9, 6, 200], [0.92, 0, 200], [0.96, 0, 0]]} />
          <g><Op d={d} p={[[0, 1], [0.86, 1], [0.88, 0], [0.96, 0], [0.99, 1]]} /><Diente18 /></g>
          <g><Tr d={d} p={[[0, 169, 220], [0.1, 169, 220], [0.24, 169, 118], [0.86, 169, 118], [0.9, 169, 220]]} /><Forceps /></g>
        </g>
        <Rotulo x={272} y={136} d={d} p={ve(0.12, 0.34)}>toma con el fórceps</Rotulo>
        <Rotulo x={272} y={136} d={d} p={ve(0.38, 0.64)} tono="acento">hacia vestibular</Rotulo>
        <Rotulo x={272} y={149} d={d} p={ve(0.38, 0.64)} tono="acento">y oclusal</Rotulo>
        <Rotulo x={272} y={136} d={d} p={ve(0.66, 0.92)}>compara las raíces</Rotulo>
        <Rotulo x={272} y={149} d={d} p={ve(0.66, 0.92)}>con la radiografía</Rotulo>
      </>
    )
  },
  // Mira el fondo del alveolo con buena luz y descarta una comunicación con el seno
  'exo.seno': {
    d: 6, quieto: 0.7, alt: 'Con buena luz se mira el fondo del alveolo vacío y se confirma que el piso del seno maxilar está intacto.',
    C: ({ d }) => (
      <>
        <Maxilar diente={false} alveolo />
        <path className="haz" d="M150,184 L188,184 L184,64 L156,64 Z" opacity="0"><Op d={d} p={[[0.08, 0], [0.16, 0.7], [0.86, 0.7], [0.94, 0]]} /></path>
        <path className="piso-ok" d={X.piso} opacity="0"><Op d={d} p={ve(0.42, 0.9)} /></path>
        <Rotulo x={272} y={136} d={d} p={ve(0.1, 0.42)}>mira el fondo</Rotulo>
        <Rotulo x={272} y={149} d={d} p={ve(0.1, 0.42)}>con buena luz</Rotulo>
        <Rotulo x={272} y={136} d={d} p={ve(0.44, 0.92)} tono="acento">✓ sin comunicación</Rotulo>
        <Rotulo x={272} y={149} d={d} p={ve(0.44, 0.92)} tono="acento">con el seno</Rotulo>
        <Rotulo x={272} y={166} d={d} p={ve(0.52, 0.92)}>si dudas: mide y avisa</Rotulo>
        <Rotulo x={272} y={179} d={d} p={ve(0.52, 0.92)}>al docente</Rotulo>
      </>
    )
  },
  // Revisa el alveolo, irriga suave con suero y logra la hemostasia con compresión
  'exo.hemostasia': {
    d: 8, quieto: 0.7, alt: 'Se irriga suave el alveolo con suero y después se comprime con una gasa hasta que el coágulo se mantiene.',
    C: ({ d }) => (
      <>
        <Maxilar diente={false} alveolo />
        <path className="coagulo" d={X.alveolo} opacity="0"><Op d={d} p={[[0.5, 0], [0.7, 1], [0.95, 1], [0.99, 0]]} /></path>
        <g><Tr d={d} p={[[0, 220, 200], [0.06, 186, 132], [0.3, 186, 132], [0.36, 220, 200]]} /><g transform="rotate(200)"><Jeringa /></g></g>
        <Gotas d={d} a={0.08} b={0.3} x={10} y={70} />
        <g><Tr d={d} p={[[0, 169, 220], [0.36, 169, 220], [0.44, 169, 128], [0.9, 169, 128], [0.96, 169, 220]]} /><Gasa /><g transform="translate(0,8) rotate(180)"><Dedo /></g></g>
        <Rotulo x={272} y={136} d={d} p={ve(0.06, 0.34)}>irriga suave con suero</Rotulo>
        <Rotulo x={272} y={136} d={d} p={ve(0.4, 0.92)} tono="acento">comprime con gasa</Rotulo>
        <Rotulo x={272} y={149} d={d} p={ve(0.5, 0.92)}>el coágulo se mantiene</Rotulo>
      </>
    )
  }
};
