// Muñón preparado y corona provisional de PMMA en corte: raíz, encía, hueso, el muñón con su línea de terminación
// y la corona. Para los pasos fuera de la boca, la corona sola, invertida. Cementado de provisional de PMMA.
import React from 'react';
import { Op, Tr, ve, Fresa, Explorador, Jeringa, Triple, Microbrush, Lampara, Papel, Gotas, Aire, Luz, Rotulo, Dique, Dedo, SondaPerio, Disco } from './base.jsx';

export const C = {
  raiz: 'M120,112 L180,112 C176,140 166,166 158,184 L142,184 C134,166 124,140 120,112 Z',
  munon: 'M120,112 L126,104 L130,60 Q132,48 142,46 L158,46 Q168,48 170,60 L174,104 L180,112 Z',
  borde: 'M121,111 L127,104 L131,60 Q133,49 142,47 L158,47 Q167,49 169,60 L173,104 L179,111',
  corona: 'M120,112 C114,84 114,54 122,38 Q134,22 150,26 Q166,22 178,38 C186,54 186,84 180,112 L174,104 L170,60 Q168,48 158,46 L142,46 Q132,48 130,60 L126,104 Z',
  vestibular: 'M120,110 C114,84 114,54 122,38 Q130,28 140,26',
  huesoI: 'M40,184 L40,132 L128,132 L134,184 Z',
  huesoD: 'M166,184 L172,132 L400,132 L400,184 Z',
  enciaI: 'M40,116 Q90,108 118,110 L124,114 L128,128 L40,134 Z',
  enciaD: 'M182,110 Q230,108 400,116 L400,134 L172,128 L176,114 Z',
  gutapercha: 'M148,72 L152,72 L151,178 L149,178 Z',
  antagonista: 'M90,-14 L90,-4 C90,14 102,24 118,26 C130,26 140,22 150,18 C160,22 170,26 182,26 C198,24 210,14 210,-4 L210,-14 Z',
  marca: [142, 28],
  mate: 'M132,30 Q142,26 152,27 L150,33 Q141,32 134,35 Z'
};
const EXCESOS = [[118, 113], [182, 113]];

export function Base({ gutapercha = false, children }) {
  return (
    <g>
      <path className="hue" d={C.huesoI} />
      <path className="hue" d={C.huesoD} />
      <path className="den" d={C.raiz} />
      {gutapercha && <path className="gut" d={C.gutapercha} />}
      <path className="den" d={C.munon} />
      {children}
      <path className="enc" d={C.enciaI} />
      <path className="enc" d={C.enciaD} />
    </g>
  );
}
// Corona fuera de la boca, con la cara interna hacia arriba
export const Invertida = ({ children }) => <g transform="translate(0,4) rotate(180 150 70)"><path className="pmma" d={C.corona} />{children}</g>;

export const ESCENAS_PMMA = {
  // Mide con sonda la dentina sana bajo el margen de la corona, en todo el perímetro
  'pmma.ferula': {
    d: 7, quieto: 0.5, alt: 'En un pilar endodonciado, la sonda milimetrada mide la dentina sana sobre la línea de terminación, a cada lado del muñón.',
    C: ({ d }) => (
      <>
        <Base gutapercha />
        <g><Tr d={d} p={[[0, 100, -40], [0.08, 124, 108], [0.36, 124, 108], [0.42, 100, -40], [0.48, 200, -40], [0.54, 176, 108], [0.82, 176, 108], [0.88, 200, -40]]} /><SondaPerio /></g>
        <path className="cota" d="M112,108 L112,92 M108,108 L116,108 M108,92 L116,92" opacity="0"><Op d={d} p={ve(0.14, 0.4)} /></path>
        <path className="cota" d="M188,108 L188,92 M184,108 L192,108 M184,92 L192,92" opacity="0"><Op d={d} p={ve(0.6, 0.86)} /></path>
        <Rotulo x={222} y={30} d={d} p={ve(0.06, 0.4)}>mide la dentina sana</Rotulo>
        <Rotulo x={222} y={43} d={d} p={ve(0.08, 0.4)}>bajo el margen de la corona</Rotulo>
        <Rotulo x={222} y={30} d={d} p={ve(0.46, 0.94)} tono="acento">en todo el contorno</Rotulo>
        <Rotulo x={222} y={43} d={d} p={ve(0.6, 0.94)}>al menos 2 mm</Rotulo>
      </>
    )
  },
  // Retira el provisional anterior, limpia el cemento y prueba la corona en seco
  'pmma.probar': {
    d: 9, quieto: 0.9, alt: 'Sale el provisional anterior, se limpian los restos de cemento del muñón y la corona nueva se prueba en seco: asienta sin presión con los márgenes en contacto.',
    C: ({ d }) => (
      <>
        <Base>
          <g><Op d={d} p={[[0.02, 1], [0.22, 0], [0.97, 0], [0.995, 1]]} /><Tr d={d} p={[[0, 0, 0], [0.04, 0, 0], [0.2, 0, -70], [0.97, 0, -70], [0.995, 0, 0]]} /><path className="viejo" d={C.corona} /></g>
          <g opacity="0"><Op d={d} p={[[0.16, 0], [0.2, 1], [0.32, 1], [0.48, 0]]} /><circle className="cem-p" cx="131" cy="72" r="3" /><circle className="cem-p" cx="169" cy="88" r="3" /><circle className="cem-p" cx="148" cy="47" r="2.6" /></g>
          <g><Tr d={d} p={[[0, 0, -90], [0.52, 0, -90], [0.64, 0, 0], [0.96, 0, 0], [0.99, 0, -90]]} /><Op d={d} p={[[0.5, 0], [0.54, 1], [0.96, 1], [0.99, 0]]} /><path className="pmma" d={C.corona} /></g>
          <path className="borde-ok" d="M112,112 L128,112 M172,112 L188,112" opacity="0"><Op d={d} p={ve(0.7, 0.95)} /></path>
        </Base>
        <g><Tr d={d} p={[[0, 220, -40], [0.24, 220, -40], [0.28, 132, 74], [0.34, 132, 60], [0.4, 169, 90], [0.46, 152, 48], [0.5, 220, -40]]} /><Explorador /></g>
        <Rotulo x={222} y={30} d={d} p={ve(0.04, 0.22)}>retira el provisional</Rotulo>
        <Rotulo x={222} y={30} d={d} p={ve(0.24, 0.5)}>limpia todo resto de cemento</Rotulo>
        <Rotulo x={222} y={30} d={d} p={ve(0.54, 0.95)} tono="acento">prueba en seco</Rotulo>
        <Rotulo x={222} y={43} d={d} p={ve(0.66, 0.95)}>asienta sin presión</Rotulo>
        <Rotulo x={222} y={56} d={d} p={ve(0.7, 0.95)}>márgenes en todo el perímetro</Rotulo>
      </>
    )
  },
  // Ajusta la oclusión con el provisional todavía sin cementar
  'pmma.oclusion': {
    d: 7, quieto: 0.5, alt: 'Con la corona puesta sin cemento, el papel de articular marca el contacto alto y la fresa lo ajusta.',
    C: ({ d }) => (
      <>
        <Base><path className="pmma" d={C.corona} /></Base>
        <g opacity="0"><Op d={d} p={ve(0.1, 0.36)} /><Papel x={-10} y={-16} /></g>
        <g><Tr d={d} p={[[0, 0, -30], [0.12, 0, -30], [0.22, 0, 0], [0.28, 0, 0], [0.36, 0, -30]]} /><path className="esm" d={C.antagonista} /></g>
        <ellipse className="marca alta" cx={C.marca[0]} cy={C.marca[1]} rx="6" ry="2.2" opacity="0"><Op d={d} p={[[0.26, 0], [0.28, 1], [0.5, 1], [0.6, 0]]} /></ellipse>
        <g><Tr d={d} p={[[0, 142, -50], [0.42, 142, -50], [0.48, 138, 26], [0.54, 146, 26], [0.6, 142, 27], [0.64, 142, -50]]} /><Fresa /></g>
        <Rotulo x={222} y={46} d={d} p={ve(0.08, 0.4)} tono="acento">todavía sin cementar</Rotulo>
        <Rotulo x={222} y={46} d={d} p={ve(0.44, 0.66)} tono="mal">ajusta el contacto alto</Rotulo>
        <Rotulo x={222} y={46} d={d} p={ve(0.7, 0.95)}>oclusión pareja</Rotulo>
      </>
    )
  },
  // Pule solo las zonas que ajustaste
  'pmma.pulir': {
    d: 6, quieto: 0.7, alt: 'El pulidor trabaja solo la zona que se ajustó; el resto del provisional no se toca.',
    C: ({ d }) => (
      <>
        <Base><path className="pmma" d={C.corona} /></Base>
        <path className="mate" d={C.mate}><Op d={d} p={[[0.2, 1], [0.6, 0], [0.97, 0], [0.995, 1]]} /></path>
        <g><Tr d={d} p={[[0, 142, -50], [0.12, 136, 30], [0.2, 148, 29], [0.28, 136, 30], [0.36, 148, 29], [0.44, 136, 30], [0.52, 148, 29], [0.6, 142, -50]]} /><Fresa pulidor /></g>
        <Rotulo x={222} y={46} d={d} p={ve(0.06, 0.62)} tono="acento">pule solo lo ajustado</Rotulo>
        <Rotulo x={222} y={46} d={d} p={ve(0.66, 0.95)}>el resto no se toca</Rotulo>
      </>
    )
  },
  // Vía convencional: óxido de zinc sin eugenol en capa fina en la cara interna, sin llenar la cofia
  'pmma.cemento': {
    d: 7, quieto: 0.8, alt: 'Fuera de la boca, el cemento de óxido de zinc sin eugenol se carga en una capa fina sobre la cara interna de la corona, sin llenarla.',
    C: ({ d }) => (
      <>
        <Invertida>
          <path className="cem" d={C.borde} pathLength="1" strokeDasharray="1 1" strokeDashoffset="1"><animate attributeName="stroke-dashoffset" dur={d + 's'} repeatCount="indefinite" values="1;1;0;0;1" keyTimes="0;0.14;0.6;0.96;1" /></path>
        </Invertida>
        <g><Tr d={d} p={[[0, 220, -30], [0.12, 128, 40], [0.26, 134, 92], [0.4, 166, 94], [0.54, 172, 40], [0.62, 220, -30]]} /><Microbrush /></g>
        <Rotulo x={222} y={40} d={d} p={ve(0.04, 0.62)}>óxido de zinc sin eugenol</Rotulo>
        <Rotulo x={222} y={53} d={d} p={ve(0.12, 0.62)} tono="acento">capa fina en la cara interna</Rotulo>
        <Rotulo x={222} y={40} d={d} p={ve(0.66, 0.95)} tono="mal">sin llenar la cofia</Rotulo>
      </>
    )
  },
  // Vía adhesiva, fuera de la boca: ácido 60 s, arenado 50 µm a 1–2 bar, ultrasonido y primer con MMA
  'pmma.arenar': {
    d: 11, quieto: 0.9, alt: 'Fuera de la boca: ácido fosfórico 60 segundos en la cara interna, lavado y secado; arenado con óxido de aluminio de 50 micrones, limpieza en ultrasonido y una capa fina de primer con MMA fotopolimerizada.',
    C: ({ d }) => (
      <>
        <Invertida>
          <path className="gel-l" d={C.borde} opacity="0"><Op d={d} p={[[0.04, 0], [0.08, 1], [0.2, 1], [0.24, 0]]} /></path>
          <path className="mate-l" d={C.borde} opacity="0"><Op d={d} p={[[0.4, 0], [0.54, 1], [0.96, 1], [0.99, 0]]} /></path>
          <path className="adh" d={C.borde} opacity="0"><Op d={d} p={[[0.76, 0], [0.84, 1], [0.96, 1], [0.99, 0]]} /></path>
        </Invertida>
        <Gotas d={d} a={0.24} b={0.32} x={-10} y={40} />
        <g opacity="0"><Op d={d} p={ve(0.36, 0.56)} />
          {[[0, 0], [6, 10], [-6, 18], [3, 26], [-3, 6]].map(([x, y], k) => <circle key={k} className="particula" cx={150 + x} cy={10 + y} r="1.6"><animate attributeName="cy" dur={d + 's'} repeatCount="indefinite" values={`${y - 20};${y + 70}`} keyTimes="0;1" /></circle>)}
          <path className="mango" d="M150,-4 L150,-30" />
        </g>
        <g opacity="0"><Op d={d} p={ve(0.6, 0.72)} /><path className="vibra" d="M104,60 q-6,10 0,20 M98,56 q-8,14 0,28 M196,60 q6,10 0,20 M202,56 q8,14 0,28" /></g>
        <g><Tr d={d} p={[[0, 220, -30], [0.74, 220, -30], [0.78, 132, 50], [0.82, 168, 50], [0.86, 220, -30]]} /><Microbrush /></g>
        <g><Tr d={d} p={[[0, 150, -60], [0.86, 150, -60], [0.88, 150, 30], [0.96, 150, 30], [0.98, 150, -60]]} /><Lampara /></g>
        <Luz d={d} a={0.89} b={0.95} y={30} />
        <Rotulo x={222} y={40} d={d} p={ve(0.04, 0.22)} tono="acento">ácido 37 % · 60 s</Rotulo>
        <Rotulo x={222} y={40} d={d} p={ve(0.24, 0.32)}>lava y seca</Rotulo>
        <Rotulo x={222} y={40} d={d} p={ve(0.36, 0.56)} tono="acento">arena: Al₂O₃ 50 µm</Rotulo>
        <Rotulo x={222} y={53} d={d} p={ve(0.38, 0.56)}>a 1–2 bar · queda mate</Rotulo>
        <Rotulo x={222} y={40} d={d} p={ve(0.6, 0.72)}>limpia en ultrasonido</Rotulo>
        <Rotulo x={222} y={40} d={d} p={ve(0.76, 0.96)} tono="acento">primer con MMA</Rotulo>
        <Rotulo x={222} y={53} d={d} p={ve(0.86, 0.96)}>fotopolimeriza</Rotulo>
      </>
    )
  },
  // Vía adhesiva en boca: aísla, graba esmalte 30 s y dentina 15 s, adhesivo frotado 20 s, evapora 5 s y cementa con resina
  'pmma.adhesivo': {
    d: 11, quieto: 0.9, alt: 'Con el diente aislado se graba el esmalte 30 segundos y la dentina 15, se frota el adhesivo 20 segundos, se evapora el disolvente 5 segundos y la corona se cementa con resina.',
    C: ({ d }) => (
      <>
        <Base>
          <path className="gel-l" d={C.borde} opacity="0"><Op d={d} p={[[0.1, 0], [0.16, 1], [0.3, 1], [0.34, 0]]} /></path>
          <path className="adh" d={C.borde} opacity="0"><Op d={d} p={[[0.42, 0], [0.56, 1], [0.96, 1], [0.99, 0]]} /></path>
          <g><Tr d={d} p={[[0, 0, -90], [0.72, 0, -90], [0.84, 0, 0], [0.96, 0, 0], [0.99, 0, -90]]} /><Op d={d} p={[[0.7, 0], [0.74, 1], [0.96, 1], [0.99, 0]]} /><path className="cem" d={C.borde} /><path className="pmma" d={C.corona} /></g>
        </Base>
        <Dique izq={118} der={182} y={112} />
        <g><Tr d={d} p={[[0, 150, -40], [0.08, 124, 70], [0.12, 150, 42], [0.16, 176, 70], [0.2, 200, -40], [1, 200, -40]]} /><Jeringa gel /></g>
        <Gotas d={d} a={0.3} b={0.38} x={-10} y={0} />
        <g><Tr d={d} p={[[0, 200, -40], [0.4, 200, -40], [0.44, 132, 70], [0.48, 150, 48], [0.52, 168, 70], [0.56, 132, 80], [0.6, 200, -40]]} /><Microbrush /></g>
        <Aire d={d} a={0.62} b={0.7} x={-10} y={0} />
        <g><Tr d={d} p={[[0, 250, -50], [0.6, 250, -50], [0.62, 190, 20], [0.7, 190, 20], [0.72, 250, -50]]} /><Triple /></g>
        <Rotulo x={222} y={30} d={d} p={ve(0.02, 0.1)}>aísla</Rotulo>
        <Rotulo x={222} y={30} d={d} p={ve(0.1, 0.36)} tono="acento">graba esmalte 30 s</Rotulo>
        <Rotulo x={222} y={43} d={d} p={ve(0.12, 0.36)}>y dentina 15 s</Rotulo>
        <Rotulo x={222} y={30} d={d} p={ve(0.4, 0.6)}>adhesivo frotando 20 s</Rotulo>
        <Rotulo x={222} y={30} d={d} p={ve(0.62, 0.72)}>evapora 5 s</Rotulo>
        <Rotulo x={222} y={30} d={d} p={ve(0.74, 0.96)} tono="acento">cementa con resina</Rotulo>
        <Rotulo x={222} y={43} d={d} p={ve(0.78, 0.96)}>una corona a la vez</Rotulo>
      </>
    )
  },
  // Asienta con presión digital firme, con vibración suave, y retira el exceso en el momento justo
  'pmma.asentar': {
    d: 9, quieto: 0.5, alt: 'El dedo asienta la corona con presión firme y sostenida y una vibración suave; el exceso de cemento sale por los márgenes y se retira en el momento justo.',
    C: ({ d }) => (
      <>
        <Base>
          <g><Tr d={d} p={[[0, 0, -60], [0.04, 0, -60], [0.18, 0, 0], [0.96, 0, 0], [0.99, 0, -60]]} /><Op d={d} p={[[0.02, 0], [0.05, 1], [0.96, 1], [0.99, 0]]} /><path className="cem" d={C.borde} /><path className="pmma" d={C.corona} /></g>
        </Base>
        {EXCESOS.map(([x, y], k) => <ellipse key={k} className="cem-ex" cx={x} cy={y} rx="0" ry="0"><animate attributeName="rx" dur={d + 's'} repeatCount="indefinite" values="0;0;6;6;0;0" keyTimes="0;0.22;0.46;0.64;0.76;1" /><animate attributeName="ry" dur={d + 's'} repeatCount="indefinite" values="0;0;3.5;3.5;0;0" keyTimes="0;0.22;0.46;0.64;0.76;1" /></ellipse>)}
        <g><Tr d={d} p={[[0, 150, -80], [0.14, 150, -80], [0.2, 150, 24], [0.24, 151, 25], [0.28, 149, 24], [0.32, 151, 25], [0.36, 149, 24], [0.4, 151, 25], [0.44, 149, 24], [0.5, 150, 24], [0.56, 150, -80]]} /><Dedo /></g>
        <g><Tr d={d} p={[[0, 80, 0], [0.6, 80, 0], [0.64, 116, 112], [0.7, 112, 116], [0.72, 230, 0], [0.74, 186, 112], [0.8, 190, 116], [0.84, 230, -20]]} /><Explorador /></g>
        <Rotulo x={222} y={30} d={d} p={ve(0.06, 0.56)} tono="acento">presión firme y sostenida</Rotulo>
        <Rotulo x={222} y={43} d={d} p={ve(0.2, 0.56)}>con vibración suave</Rotulo>
        <Rotulo x={222} y={30} d={d} p={ve(0.6, 0.94)}>retira el exceso a tiempo:</Rotulo>
        <Rotulo x={222} y={43} d={d} p={ve(0.62, 0.94)}>convencional, cuando se quiebra</Rotulo>
        <Rotulo x={222} y={56} d={d} p={ve(0.64, 0.94)}>adhesiva, en fase gel</Rotulo>
      </>
    )
  },
  // Revisa el margen con sonda cara por cara y pasa hilo dental en vaivén, sacándolo hacia vestibular
  'pmma.hilo': {
    d: 9, quieto: 0.9, alt: 'La sonda recorre el margen cara por cara buscando cemento; el hilo dental pasa por el contacto en vaivén y sale hacia vestibular, limpio.',
    C: ({ d }) => (
      <>
        <Base><path className="pmma" d={C.corona} /></Base>
        <g><Tr d={d} p={[[0, 80, -20], [0.06, 118, 108], [0.16, 121, 114], [0.26, 118, 108], [0.3, 80, -20], [0.32, 230, -20], [0.36, 182, 108], [0.46, 179, 114], [0.54, 182, 108], [0.58, 230, -20]]} /><Explorador /></g>
        <g opacity="0"><Op d={d} p={ve(0.6, 0.92)} />
          <path className="hilo" d="M60,40 L240,40"><animate attributeName="d" dur={d + 's'} repeatCount="indefinite" values="M60,30 L240,30;M60,30 L240,30;M60,86 L240,92;M60,70 L240,64;M60,96 L240,96;M10,96 L190,96" keyTimes="0;0.62;0.7;0.76;0.82;1" /></path>
        </g>
        <Rotulo x={222} y={30} d={d} p={ve(0.04, 0.58)}>sonda cara por cara</Rotulo>
        <Rotulo x={222} y={43} d={d} p={ve(0.1, 0.58)}>sin restos de cemento</Rotulo>
        <Rotulo x={222} y={30} d={d} p={ve(0.62, 0.82)} tono="acento">hilo en vaivén</Rotulo>
        <Rotulo x={222} y={30} d={d} p={ve(0.84, 0.96)} tono="acento">sale hacia vestibular, limpio</Rotulo>
      </>
    )
  },
  // Repule lo fresado y aplica un recubrimiento fotopolimerizable en la vestibular
  'pmma.sellar': {
    d: 10, quieto: 0.93, alt: 'Se repulen las zonas fresadas con fresa de acrílico, discos y pasta; después se aplica un recubrimiento de superficie en la cara vestibular y se fotopolimeriza.',
    C: ({ d }) => (
      <>
        <Base><path className="pmma" d={C.corona} /></Base>
        <path className="mate" d={C.mate}><Op d={d} p={[[0.1, 1], [0.36, 0], [0.97, 0], [0.995, 1]]} /></path>
        <path className="mate" d="M116,70 Q114,84 118,98 L122,96 Q119,84 121,70 Z"><Op d={d} p={[[0.1, 1], [0.36, 0], [0.97, 0], [0.995, 1]]} /></path>
        <g><Tr d={d} p={[[0, 220, -40], [0.06, 140, 28], [0.14, 120, 70], [0.22, 118, 92], [0.3, 140, 28], [0.36, 220, -40]]} /><Disco d={d} /></g>
        <path className="recubre" d={C.vestibular} opacity="0"><Op d={d} p={[[0.44, 0], [0.6, 1], [0.96, 1], [0.99, 0]]} /></path>
        <g><Tr d={d} p={[[0, 60, -30], [0.4, 60, -30], [0.44, 116, 104], [0.52, 116, 60], [0.6, 132, 30], [0.64, 60, -30]]} /><g transform="scale(-1,1)"><Microbrush /></g></g>
        <g><Tr d={d} p={[[0, 80, -40], [0.66, 80, -40], [0.7, 106, 60], [0.92, 106, 60], [0.96, 80, -40]]} /><g transform="rotate(-70)"><Lampara /></g></g>
        <Rotulo x={222} y={30} d={d} p={ve(0.04, 0.38)}>repule: fresa, discos y pasta</Rotulo>
        <Rotulo x={222} y={30} d={d} p={ve(0.42, 0.64)} tono="acento">recubre la vestibular</Rotulo>
        <Rotulo x={222} y={30} d={d} p={ve(0.68, 0.94)}>fotopolimeriza</Rotulo>
        <Rotulo x={222} y={43} d={d} p={ve(0.72, 0.94)}>ninguna zona mate</Rotulo>
      </>
    )
  }
};
