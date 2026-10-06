// Periodonto en corte: un diente unirradicular con su encía y su hueso. A la izquierda sano; a la derecha
// (vestibular) un saco con cálculo supra y subgingival y el hueso más abajo. Destartraje y pulido radicular.
import React from 'react';
import { Op, Tr, ve, Jeringa, Rotulo, Cepillo, SondaPerio, Ultrasonido, Cureta, Gotero, Explorador } from './base.jsx';

export const P = {
  esmalte: 'M128,72 C124,50 128,28 140,18 Q150,12 160,18 C172,28 176,50 172,72 Z',
  raiz: 'M129,70 L171,70 C169,110 163,150 154,182 Q150,186 146,182 C137,150 131,110 129,70 Z',
  pulpa: 'M146,40 Q150,34 154,40 L156,72 C155,110 153,150 151,176 L149,176 C147,150 145,110 144,72 Z',
  huesoI: 'M40,184 L40,100 C80,98 116,100 131,104 L139,184 Z',
  huesoD: 'M161,184 L168,126 C200,122 250,124 400,126 L400,184 Z',
  enciaI: 'M40,92 Q100,88 124,66 Q128,64 130,68 L132,106 L40,106 Z',
  enciaD: 'M176,64 Q184,60 194,70 Q240,88 400,92 L400,130 L167,130 L172,116 C176,100 178,80 176,64 Z',
  saco: 'M171.6,66 L176,64 C178,80 176,100 172,116 L168.4,116 C169.4,100 170.4,80 171.6,66 Z',
  supra: 'M165,57 Q174,52 178,61 L175,67 Q170,64 167,66 Z',
  lisa: 'M171.4,70 C170.8,90 169.8,105 168.6,116',
  placaD: 'M170,44 Q174,56 175,64',
  placaI: 'M130,44 Q126,56 125,64'
};
export const SUB = [[171, 84, 2.4, 5], [170.3, 98, 2.2, 4.4], [169.3, 110, 2, 3.4]];

export function Periodonto({ supra = true, sub = true }) {
  return (
    <g>
      <path className="hue" d={P.huesoI} />
      <path className="hue" d={P.huesoD} />
      <path className="den" d={P.raiz} />
      <path className="esm" d={P.esmalte} />
      <path className="pul" d={P.pulpa} />
      <path className="enc" d={P.enciaI} />
      <path className="enc" d={P.enciaD} />
      {supra && <path className="cal" d={P.supra} />}
      {sub && SUB.map(([x, y, rx, ry], k) => <ellipse key={k} className="cal" cx={x} cy={y} rx={rx} ry={ry} />)}
    </g>
  );
}

export const ESCENAS_PERIO = {
  // Muestra la placa con revelador y enseña el cepillado y la limpieza interdental
  'perio.placa': {
    d: 8, quieto: 0.3, alt: 'El revelador tiñe la placa junto a la encía; después se enseña el cepillado en el margen y la limpieza interdental.',
    C: ({ d }) => (
      <>
        <Periodonto />
        <g opacity="0"><Op d={d} p={[[0.12, 0], [0.22, 1], [0.38, 1], [0.6, 0]]} /><path className="pla" d={P.placaD} /><path className="pla" d={P.placaI} /></g>
        <g><Tr d={d} p={[[0, 186, -30], [0.04, 176, 8], [0.16, 176, 8], [0.2, 186, -30]]} /><Gotero /></g>
        <g><Tr d={d} p={[[0, 240, -20], [0.3, 240, -20], [0.36, 196, 52], [0.42, 200, 56], [0.48, 194, 50], [0.54, 200, 56], [0.6, 196, 52], [0.66, 240, -20]]} /><g transform="rotate(-45)"><Cepillo /></g></g>
        <Rotulo x={214} y={24} d={d} p={ve(0.08, 0.3)} tono="acento">el revelador tiñe la placa</Rotulo>
        <Rotulo x={214} y={24} d={d} p={ve(0.34, 0.62)}>enseña el cepillado</Rotulo>
        <Rotulo x={214} y={24} d={d} p={ve(0.66, 0.8)}>y la limpieza interdental</Rotulo>
        <Rotulo x={214} y={24} d={d} p={ve(0.82, 0.96)} tono="acento">anota el índice de placa</Rotulo>
        <Rotulo x={214} y={37} d={d} p={ve(0.82, 0.96)}>revisa tabaco y diabetes</Rotulo>
      </>
    )
  },
  // Anestesia el cuadrante si los sacos son profundos o hay dolor al sondaje
  'perio.anestesia': {
    d: 6, quieto: 0.5, alt: 'Si los sacos miden 5 mm o más, o el sondaje duele, se infiltra anestesia en la mucosa del cuadrante.',
    C: ({ d }) => (
      <>
        <Periodonto />
        <g><Tr d={d} p={[[0, 260, 30], [0.12, 206, 98], [0.62, 206, 98], [0.74, 260, 30]]} /><g transform="rotate(-50)"><Jeringa /></g></g>
        <circle className="liq" cx="206" cy="100" r="0"><animate attributeName="r" dur={d + 's'} repeatCount="indefinite" values="0;0;6;6;0" keyTimes="0;0.16;0.5;0.66;1" /></circle>
        <Rotulo x={214} y={24} d={d} p={ve(0.06, 0.94)} tono="acento">si hay sacos de 5 mm o más</Rotulo>
        <Rotulo x={214} y={37} d={d} p={ve(0.1, 0.94)}>o duele al sondaje</Rotulo>
      </>
    )
  },
  // Retira el cálculo supragingival y después instrumenta cada saco hasta dejar la raíz lisa
  'perio.raspar': {
    d: 10, quieto: 0.86, alt: 'El ultrasonido retira el cálculo sobre la encía; después la cureta entra al saco y raspa hacia coronal hasta dejar la raíz lisa, y la sonda lo comprueba.',
    C: ({ d }) => (
      <>
        <Periodonto supra={false} sub={false} />
        <path className="cal" d={P.supra}><Op d={d} p={[[0.08, 1], [0.24, 0], [0.97, 0], [0.995, 1]]} /></path>
        {SUB.map(([x, y, rx, ry], k) => <ellipse key={k} className="cal" cx={x} cy={y} rx={rx} ry={ry}><Op d={d} p={[[0.34 + k * 0.1, 1], [0.42 + k * 0.1, 0], [0.97, 0], [0.995, 1]]} /></ellipse>)}
        <g><Tr d={d} p={[[0, 220, -30], [0.04, 178, 60], [0.08, 176, 58], [0.12, 178, 62], [0.16, 176, 58], [0.2, 178, 62], [0.24, 220, -30]]} /><Ultrasonido d={d} a={0.04} b={0.24} /></g>
        <g><Tr d={d} p={[[0, 230, -40], [0.28, 230, -40], [0.32, 172, 112], [0.38, 173, 78], [0.42, 171, 112], [0.48, 173, 78], [0.52, 170, 112], [0.6, 173, 74], [0.66, 230, -40]]} /><Cureta /></g>
        <path className="lisa" d={P.lisa} opacity="0"><Op d={d} p={[[0.68, 0], [0.74, 1], [0.96, 1], [0.99, 0]]} /></path>
        <g><Tr d={d} p={[[0, 230, -40], [0.7, 230, -40], [0.74, 172, 70], [0.82, 170, 112], [0.88, 172, 70], [0.92, 230, -40]]} /><Explorador /></g>
        <Rotulo x={214} y={24} d={d} p={ve(0.04, 0.26)}>primero el supragingival</Rotulo>
        <Rotulo x={214} y={24} d={d} p={ve(0.3, 0.64)}>cada saco: ultrasonido,</Rotulo>
        <Rotulo x={214} y={37} d={d} p={ve(0.3, 0.64)}>curetas Gracey o ambos</Rotulo>
        <Rotulo x={214} y={24} d={d} p={ve(0.7, 0.96)} tono="acento">✓ raíz lisa</Rotulo>
        <Rotulo x={214} y={37} d={d} p={ve(0.74, 0.96)}>sin cálculo ni rugosidades</Rotulo>
      </>
    )
  },
  // Irriga los sacos con suero, revisa que no quede cálculo y explica qué sentirá
  'perio.irrigar': {
    d: 7, quieto: 0.4, alt: 'La jeringa irriga el saco con suero; se revisa que no quede cálculo y se explica que puede haber sensibilidad y algo de sangrado.',
    C: ({ d }) => (
      <>
        <Periodonto supra={false} sub={false} />
        <path className="liq" d={P.saco} opacity="0"><Op d={d} p={[[0.14, 0], [0.3, 1], [0.5, 1], [0.6, 0]]} /></path>
        <g><Tr d={d} p={[[0, 230, -30], [0.08, 174, 64], [0.54, 174, 64], [0.6, 230, -30]]} /><g transform="rotate(20)"><Jeringa /></g></g>
        <Rotulo x={214} y={24} d={d} p={ve(0.08, 0.56)} tono="acento">irriga con suero</Rotulo>
        <Rotulo x={214} y={24} d={d} p={ve(0.6, 0.76)}>revisa: sin cálculo visible</Rotulo>
        <Rotulo x={214} y={24} d={d} p={ve(0.8, 0.96)}>explica: sensibilidad</Rotulo>
        <Rotulo x={214} y={37} d={d} p={ve(0.8, 0.96)}>y algo de sangrado</Rotulo>
      </>
    )
  }
};
