// Molar en corte vestibulolingual: resina clase I y sellantes.
import React from 'react';
import { Op, Tr, At, ve, Fresa, Explorador, Jeringa, Triple, Microbrush, Lampara, Papel, Gotas, Aire, Luz, Rotulo, Dique, Cepillo, Dedo, Algodon } from './base.jsx';

/* ═══ Molar en corte (vestibulolingual) ═══ */

export const M = {
  esmalte: 'M98,124 C92,100 94,74 104,58 C112,46 124,42 134,46 C144,50 150,58 154,66 L160,74 L166,66 C170,58 176,50 186,46 C196,42 208,46 216,58 C226,74 228,100 222,124 Z',
  dentina: 'M100,124 C98,106 100,82 110,66 C118,56 128,54 136,58 C146,62 152,72 156,80 L160,86 L164,80 C168,72 174,62 184,58 C192,54 202,56 210,66 C220,82 222,106 220,124 C219,150 214,176 210,200 L182,200 C180,180 174,162 160,160 C146,162 140,180 138,200 L110,200 C106,176 101,150 100,124 Z',
  pulpa: 'M136,140 C134,122 140,110 146,106 C150,104 152,110 156,112 L160,113 L164,112 C168,110 170,104 174,106 C180,110 186,122 184,140 C183,160 180,180 178,200 L170,200 C170,180 166,168 160,168 C154,168 150,180 150,200 L142,200 C140,180 137,160 136,140 Z',
  fisura: 'M155,64 L160,75 L165,64',
  caries: 'M149,60 C145,74 147,88 153,96 C157,100 163,100 167,96 C173,88 175,74 171,60 C167,66 163,71 160,76 C157,71 153,66 149,60 Z',
  cavidad: 'M145,53 L149,95 Q160,100 171,95 L175,53 Z',
  borde: 'M145,53 L149,95 Q160,100 171,95 L175,53',
  // Resina en capas de hasta 2 mm, la última con la anatomía oclusal
  capa1: 'M148.1,86 L149,95 Q160,100 171,95 L171.9,86 Z',
  capa2: 'M147,74 L148.1,86 L171.9,86 L173,74 Z',
  capa3: 'M145,53 C151,56 155,60 158,64 L160,66 L162,64 C165,60 169,56 175,53 L173,74 L147,74 Z',
  // Ácido solo sobre el esmalte del borde de la cavidad
  gelI: 'M136,48 Q144,48 146,54 L147.6,70 L151,70 L149.4,55 Q147,50 141,47 Z',
  gelD: 'M184,48 Q176,48 174,54 L172.4,70 L169,70 L170.6,55 Q173,50 179,47 Z',
  liner: 'M148.6,90 L149,95 Q160,100 171,95 L171.4,90 Q160,94 148.6,90 Z',
  // Sellantes: el material llena la fisura y queda a ras de las vertientes
  sellante: 'M146,54 L154,66 L160,75 L166,66 L174,54 Q160,60 146,54 Z',
  grabado: 'M141,50 L154,66 L160,76 L166,66 L179,50 Q160,57 141,50 Z',
  exceso: 'M150,56 Q160,47 170,56 Q160,59 150,56 Z',
  antagonista: 'M100,-2 L100,8 C100,26 112,36 128,38 C140,38 150,34 160,30 C170,34 180,38 192,38 C208,36 220,26 220,8 L220,-2 Z'
};

export function Molar({ cavidad = false, caries = false, fisura = !cavidad }) {
  return (
    <g>
      <path className="den" d={M.dentina} />
      <path className="esm" d={M.esmalte} />
      <path className="den sin-borde" d="M108,122 C104,104 106,82 114,68 C121,59 129,58 136,61 C145,65 151,74 155,82 L160,90 L165,82 C169,74 175,65 184,61 C191,58 199,59 206,68 C214,82 216,104 212,122 Z" />
      <path className="pul" d={M.pulpa} />
      {fisura && <path className="fis" d={M.fisura} />}
      {caries && <path className="car" d={M.caries} />}
      {cavidad && <path className="aire" d={M.cavidad} />}
    </g>
  );
}
export const ESCENAS_MOLAR = {
  // Marca los contactos con papel de articular antes de tocar el diente
  'molar.papel': {
    d: 5, quieto: 0.8, alt: 'El diente antagonista cierra sobre el papel de articular y deja marcas azules en las cúspides.',
    C: ({ d }) => (
      <>
        <Molar />
        <g opacity="0"><Op d={d} p={ve(0.08, 0.62)} /><Papel /></g>
        <g><Tr d={d} p={[[0, 0, -40], [0.15, 0, -40], [0.3, 0, 0], [0.45, 0, 0], [0.6, 0, -40]]} /><path className="esm" d={M.antagonista} /></g>
        <g opacity="0"><Op d={d} p={[[0.4, 0], [0.45, 1], [0.95, 1], [0.99, 0]]} />
          <ellipse className="marca" cx="128" cy="45" rx="5" ry="2" /><ellipse className="marca" cx="192" cy="45" rx="5" ry="2" /><ellipse className="marca" cx="146" cy="53" rx="3" ry="1.6" />
        </g>
        <Rotulo x={232} y={30} d={d} p={ve(0.1, 0.55)}>papel de articular</Rotulo>
        <Rotulo x={232} y={70} d={d} p={ve(0.62, 0.95)} tono="acento">contactos marcados</Rotulo>
      </>
    )
  },
  // Aísla con dique de goma
  'molar.dique': {
    d: 5, quieto: 0.8, alt: 'El dique de goma baja con el clamp hasta el cuello del diente y lo deja aislado.',
    C: ({ d }) => (
      <>
        <Molar />
        <g><Tr d={d} p={[[0, 0, -80], [0.1, 0, -80], [0.45, 0, 0], [0.92, 0, 0], [0.98, 0, -80]]} /><Op d={d} p={[[0.06, 0], [0.12, 1], [0.92, 1], [0.97, 0]]} /><Dique /></g>
        <Rotulo x={250} y={96} d={d} p={ve(0.5, 0.92)} tono="acento">dique</Rotulo>
        <Rotulo x={60} y={96} d={d} p={ve(0.5, 0.92)} ancla="middle">clamp</Rotulo>
      </>
    )
  },
  // Abre y remueve la caries hasta dentina firme
  'molar.fresa': {
    d: 7, quieto: 0.82, alt: 'La fresa entra por el surco y remueve la caries; después el explorador comprueba que el piso es dentina firme.',
    C: ({ d }) => (
      <>
        <Molar />
        <Dique />
        <path className="aire" d={M.cavidad} opacity="0"><Op d={d} p={[[0.14, 0], [0.55, 1], [0.94, 1], [0.99, 0]]} /></path>
        <path className="car" d={M.caries}><Op d={d} p={[[0.14, 1], [0.55, 0], [0.97, 0], [0.995, 1]]} /></path>
        <path className="fis" d={M.fisura}><Op d={d} p={[[0.1, 1], [0.2, 0], [0.97, 0], [0.995, 1]]} /></path>
        <g><Tr d={d} p={[[0, 160, -30], [0.1, 160, 60], [0.2, 152, 80], [0.3, 168, 88], [0.4, 154, 92], [0.5, 166, 94], [0.58, 160, 70], [0.65, 160, -40], [1, 160, -40]]} /><Fresa /></g>
        <g><Tr d={d} p={[[0, 182, -60], [0.66, 182, -60], [0.74, 164, 97], [0.8, 152, 96], [0.86, 168, 96], [0.92, 182, -60]]} /><Explorador /></g>
        <Rotulo x={232} y={60} d={d} p={ve(0.18, 0.55)}>remueve la caries</Rotulo>
        <Rotulo x={232} y={60} d={d} p={ve(0.74, 0.94)} tono="acento">✓ dentina firme</Rotulo>
      </>
    )
  },
  // No pongas base ni liner (cavidad poco o moderadamente profunda)
  'molar.sinliner': {
    d: 5, quieto: 0.85, alt: 'En una cavidad poco o moderadamente profunda no va liner: la capa de liner se tacha y la dentina queda lista para el adhesivo.',
    C: ({ d }) => (
      <>
        <Molar cavidad />
        <Dique />
        <g opacity="0"><Op d={d} p={[[0.08, 0], [0.18, 1], [0.48, 1], [0.58, 0]]} />
          <path className="liner" d={M.liner} />
          <path className="tacha" d="M140,82 L180,104 M180,82 L140,104" opacity="0"><Op d={d} p={[[0.26, 0], [0.3, 1], [0.6, 1], [0.62, 0]]} /></path>
        </g>
        <path className="borde-ok" d={M.borde} opacity="0"><Op d={d} p={ve(0.64, 0.94)} /></path>
        <Rotulo x={232} y={60} d={d} p={ve(0.1, 0.56)} tono="mal">sin base ni liner</Rotulo>
        <Rotulo x={232} y={60} d={d} p={ve(0.64, 0.94)} tono="acento">directo al adhesivo</Rotulo>
        <Rotulo x={232} y={74} d={d} p={ve(0.64, 0.94)}>si es poco o</Rotulo>
        <Rotulo x={232} y={85} d={d} p={ve(0.64, 0.94)}>moderadamente profunda</Rotulo>
      </>
    )
  },
  // Grabado selectivo: ácido solo en el esmalte, lava y seca sin resecar
  'molar.grabado': {
    d: 7, quieto: 0.3, alt: 'El ácido se aplica solo en el esmalte del borde de la cavidad, después se lava con agua y se seca suave.',
    C: ({ d }) => (
      <>
        <Molar cavidad />
        <Dique />
        <g opacity="0"><Op d={d} p={[[0.12, 0], [0.18, 1], [0.5, 1], [0.6, 0]]} /><path className="gel" d={M.gelI} /><path className="gel" d={M.gelD} /></g>
        <g><Tr d={d} p={[[0, 150, -40], [0.08, 140, 50], [0.13, 146, 58], [0.17, 176, 50], [0.22, 176, 58], [0.28, 200, -40], [1, 200, -40]]} /><Jeringa gel /></g>
        <Gotas d={d} a={0.5} b={0.66} />
        <Aire d={d} a={0.7} b={0.86} />
        <g><Tr d={d} p={[[0, 250, -40], [0.46, 250, -40], [0.5, 190, 26], [0.86, 190, 26], [0.9, 250, -40]]} /><Triple /></g>
        <Rotulo x={232} y={60} d={d} p={ve(0.14, 0.46)} tono="acento">ácido solo en esmalte</Rotulo>
        <Rotulo x={232} y={73} d={d} p={ve(0.2, 0.46)}>15 a 30 s</Rotulo>
        <Rotulo x={232} y={60} d={d} p={ve(0.5, 0.66)}>lava</Rotulo>
        <Rotulo x={232} y={60} d={d} p={ve(0.7, 0.88)}>seca sin resecar</Rotulo>
      </>
    )
  },
  // Adhesivo frotado, soplado suave y fotopolimerizado
  'molar.adhesivo': {
    d: 7, quieto: 0.82, alt: 'El adhesivo se frota con un microbrush en toda la cavidad, se sopla suave para evaporar el solvente y se fotopolimeriza.',
    C: ({ d }) => (
      <>
        <Molar cavidad />
        <Dique />
        <path className="adh" d={M.borde} opacity="0"><Op d={d} p={[[0.1, 0], [0.4, 1], [0.96, 1], [0.99, 0]]} /></path>
        <g><Tr d={d} p={[[0, 200, -40], [0.08, 152, 88], [0.13, 166, 92], [0.18, 152, 80], [0.23, 168, 88], [0.28, 150, 66], [0.33, 170, 72], [0.4, 200, -40], [1, 200, -40]]} /><Microbrush /></g>
        <Aire d={d} a={0.44} b={0.56} />
        <g><Tr d={d} p={[[0, 250, -50], [0.4, 250, -50], [0.44, 196, 26], [0.56, 196, 26], [0.6, 250, -50]]} /><Triple /></g>
        <g><Tr d={d} p={[[0, 160, -60], [0.6, 160, -60], [0.66, 160, 40], [0.92, 160, 40], [0.97, 160, -60]]} /><Lampara /></g>
        <Luz d={d} a={0.68} b={0.9} />
        <Rotulo x={232} y={60} d={d} p={ve(0.08, 0.4)}>frota</Rotulo>
        <Rotulo x={232} y={60} d={d} p={ve(0.44, 0.58)}>sopla suave</Rotulo>
        <Rotulo x={232} y={60} d={d} p={ve(0.66, 0.92)} tono="acento">fotopolimeriza</Rotulo>
      </>
    )
  },
  // Resina en capas de hasta 2 mm (o un bloque si es bulk-fill)
  'molar.incrementos': {
    d: 8, quieto: 0.9, alt: 'La resina se coloca en capas de hasta 2 mm y cada capa se fotopolimeriza; la última recupera la anatomía oclusal.',
    C: ({ d }) => {
      const capas = [[M.capa1, 0.06], [M.capa2, 0.34], [M.capa3, 0.62]];
      return (
        <>
          <Molar cavidad />
          <Dique />
          <path className="adh" d={M.borde} />
          {capas.map(([c, a], k) => <path key={k} className="res" d={c} opacity="0"><Op d={d} p={[[a, 0], [a + 0.08, 1], [0.96, 1], [0.99, 0]]} /></path>)}
          {capas.map(([, a], k) => (
            <g key={'l' + k}><Tr d={d} p={[[0, 160, -60], [a + 0.1, 160, -60], [a + 0.13, 160, 40], [a + 0.24, 160, 40], [a + 0.27, 160, -60]]} /><Lampara /></g>
          ))}
          {capas.map(([, a], k) => <Luz key={'z' + k} d={d} a={a + 0.14} b={a + 0.24} />)}
          <path className="cota" d="M184,86 L190,86 M187,86 L187,98 M184,98 L190,98" opacity="0"><Op d={d} p={ve(0.08, 0.3)} /></path>
          <Rotulo x={196} y={95} d={d} p={ve(0.08, 0.3)} tono="acento">≤ 2 mm</Rotulo>
          <Rotulo x={232} y={60} d={d} p={ve(0.36, 0.9)}>capa por capa</Rotulo>
          <Rotulo x={232} y={73} d={d} p={ve(0.36, 0.9)}>cada una se cura</Rotulo>
        </>
      );
    }
  },
  // Fotopolimeriza con la punta lo más cerca posible y perpendicular
  'molar.luz': {
    d: 6, quieto: 0.6, alt: 'La punta de la lámpara se acerca lo más posible a la resina, perpendicular a la superficie, y se enciende el tiempo que indica el fabricante.',
    C: ({ d }) => (
      <>
        <Molar cavidad />
        <Dique />
        <path className="res" d={M.capa1} /><path className="res" d={M.capa2} /><path className="res" d={M.capa3} />
        <g><Tr d={d} p={[[0, 160, -40], [0.12, 160, -40], [0.35, 160, 40], [0.9, 160, 40], [0.97, 160, -40]]} /><Lampara /></g>
        <Luz d={d} a={0.4} b={0.88} />
        <path className="cota" d="M118,0 L118,36 M114,0 L122,0" opacity="0"><Op d={d} p={ve(0.14, 0.33)} /></path>
        <path className="guia" d="M160,10 L160,40" opacity="0"><Op d={d} p={ve(0.4, 0.88)} /></path>
        <Rotulo x={232} y={46} d={d} p={ve(0.14, 0.36)}>lo más cerca posible</Rotulo>
        <Rotulo x={232} y={60} d={d} p={ve(0.4, 0.88)} tono="acento">perpendicular</Rotulo>
        <Rotulo x={232} y={73} d={d} p={ve(0.44, 0.88)}>tiempo del fabricante</Rotulo>
      </>
    )
  },
  // Retira el aislamiento, ajusta la oclusión contra el registro del paso 01 y pule
  'molar.pulir': {
    d: 8, quieto: 0.92, alt: 'Sin el dique, el papel de articular marca un contacto alto en la resina; se ajusta hasta que coincide con el registro inicial y se pule.',
    C: ({ d }) => (
      <>
        <Molar cavidad />
        <path className="res" d={M.capa1} /><path className="res" d={M.capa2} /><path className="res" d={M.capa3} />
        <path className="res" d="M151,57 Q160,52 169,57 L166,62 L160,64 L154,62 Z"><Op d={d} p={[[0.45, 1], [0.62, 0], [0.97, 0], [0.995, 1]]} /></path>
        <g><Op d={d} p={[[0, 1], [0.1, 0], [0.97, 0], [0.995, 1]]} /><Dique /></g>
        <g opacity="0"><Op d={d} p={ve(0.14, 0.4)} /><Papel /></g>
        <g><Tr d={d} p={[[0, 0, -40], [0.16, 0, -40], [0.24, 0, -14], [0.3, 0, -14], [0.38, 0, -40]]} /><path className="esm" d={M.antagonista} /></g>
        <ellipse className="marca alta" cx="160" cy="54" rx="6" ry="2.2" opacity="0"><Op d={d} p={[[0.28, 0], [0.3, 1], [0.5, 1], [0.6, 0]]} /></ellipse>
        <g><Tr d={d} p={[[0, 160, -50], [0.42, 160, -50], [0.48, 154, 52], [0.54, 166, 52], [0.6, 160, 54], [0.64, 160, -50], [0.7, 160, -50], [0.74, 148, 50], [0.8, 172, 50], [0.86, 160, 56], [0.9, 160, -50]]} /><Fresa pulidor /></g>
        <Rotulo x={232} y={46} d={d} p={ve(0.02, 0.12)}>retira el dique</Rotulo>
        <Rotulo x={232} y={60} d={d} p={ve(0.28, 0.6)} tono="mal">contacto alto</Rotulo>
        <Rotulo x={232} y={60} d={d} p={ve(0.64, 0.95)} tono="acento">como en el registro</Rotulo>
        <Rotulo x={232} y={73} d={d} p={ve(0.7, 0.95)}>y pule</Rotulo>
      </>
    )
  },

  /* ── Sellantes de fosas y fisuras ── */

  // Revisa la superficie limpia y seca y decide si está sana o tiene una lesión no cavitada
  'fisura.revisar': {
    d: 7, quieto: 0.85, alt: 'Se seca la superficie oclusal con aire y el explorador recorre la fisura sin presionar para decidir si está sana o con una lesión no cavitada.',
    C: ({ d }) => (
      <>
        <Molar />
        <path className="mancha" d={M.fisura} />
        <Aire d={d} a={0.06} b={0.26} />
        <g><Tr d={d} p={[[0, 260, -50], [0.04, 196, 26], [0.28, 196, 26], [0.32, 260, -50]]} /><Triple /></g>
        <g><Tr d={d} p={[[0, 120, -70], [0.34, 120, -70], [0.4, 140, 50], [0.5, 156, 64], [0.56, 164, 64], [0.64, 180, 50], [0.7, 200, -70]]} /><Explorador /></g>
        <Rotulo x={232} y={60} d={d} p={ve(0.06, 0.3)}>limpia y seca</Rotulo>
        <Rotulo x={232} y={60} d={d} p={ve(0.38, 0.68)}>sin presionar</Rotulo>
        <Rotulo x={232} y={60} d={d} p={ve(0.72, 0.96)} tono="acento">sana o no cavitada:</Rotulo>
        <Rotulo x={232} y={73} d={d} p={ve(0.72, 0.96)} tono="acento">se sella</Rotulo>
        <Rotulo x={232} y={90} d={d} p={ve(0.76, 0.96)}>con cavidad: se restaura</Rotulo>
      </>
    )
  },
  // Limpia con cepillo seco o con agua y aire
  'fisura.limpiar': {
    d: 7, quieto: 0.9, alt: 'El cepillo dental limpia la cara oclusal y saca la placa de las fisuras; después agua y aire.',
    C: ({ d }) => (
      <>
        <Molar />
        <g><Op d={d} p={[[0.12, 1], [0.48, 0], [0.97, 0], [0.995, 1]]} /><circle className="pla-p" cx="157" cy="66" r="2.4" /><circle className="pla-p" cx="163" cy="67" r="2.2" /><circle className="pla-p" cx="160" cy="72" r="2" /></g>
        <g><Tr d={d} p={[[0, 160, -40], [0.08, 160, 46], [0.14, 150, 46], [0.2, 170, 46], [0.26, 150, 46], [0.32, 170, 46], [0.38, 150, 46], [0.44, 160, 46], [0.5, 160, -40]]} /><Cepillo /></g>
        <Gotas d={d} a={0.54} b={0.7} />
        <Aire d={d} a={0.72} b={0.88} />
        <g><Tr d={d} p={[[0, 260, -50], [0.5, 260, -50], [0.54, 196, 26], [0.88, 196, 26], [0.92, 260, -50]]} /><Triple /></g>
        <Rotulo x={232} y={60} d={d} p={ve(0.08, 0.5)}>cepillo seco</Rotulo>
        <Rotulo x={232} y={60} d={d} p={ve(0.54, 0.88)}>o agua y aire</Rotulo>
        <Rotulo x={232} y={60} d={d} p={ve(0.9, 0.97, 0.02)} tono="acento">✓ sin placa</Rotulo>
      </>
    )
  },
  // Aísla: dique si se puede; si no, rollos de algodón y aspiración
  'fisura.aislar': {
    d: 7, quieto: 0.8, alt: 'Primero la opción del dique de goma; si no se puede, rollos de algodón a cada lado y aspiración con un ayudante.',
    C: ({ d }) => (
      <>
        <Molar />
        <g><Tr d={d} p={[[0, 0, -80], [0.04, 0, -80], [0.2, 0, 0], [0.4, 0, 0], [0.44, 0, -80]]} /><Op d={d} p={[[0.02, 0], [0.06, 1], [0.4, 1], [0.44, 0]]} /><Dique /></g>
        <g opacity="0"><Op d={d} p={[[0.46, 0], [0.52, 1], [0.95, 1], [0.99, 0]]} /><Algodon x={84} y={108} /><Algodon x={236} y={108} /></g>
        <g><Tr d={d} p={[[0, 330, 200], [0.56, 330, 200], [0.64, 250, 118], [0.94, 250, 118], [0.98, 330, 200]]} /><path className="mango grueso" d="M0,0 L50,46" /><circle className="ins" cx="0" cy="0" r="6" /></g>
        <Rotulo x={232} y={46} d={d} p={ve(0.06, 0.42)} tono="acento">dique, si se puede</Rotulo>
        <Rotulo x={232} y={46} d={d} p={ve(0.5, 0.95)}>si no: rollos de algodón</Rotulo>
        <Rotulo x={232} y={59} d={d} p={ve(0.62, 0.95)}>y aspiración con ayudante</Rotulo>
      </>
    )
  },
  // Graba las fisuras con ácido fosfórico 37 %, lava bien y seca: blanco tiza
  'fisura.grabar': {
    d: 8, quieto: 0.9, alt: 'El ácido cubre las fisuras el tiempo del fabricante, se lava bien y se seca; el esmalte grabado queda blanco tiza y opaco.',
    C: ({ d }) => (
      <>
        <Molar />
        <path className="gel" d={M.grabado} opacity="0"><Op d={d} p={[[0.08, 0], [0.16, 1], [0.48, 1], [0.56, 0]]} /></path>
        <path className="tiza" d={M.grabado} opacity="0"><Op d={d} p={[[0.78, 0], [0.84, 1], [0.96, 1], [0.99, 0]]} /></path>
        <g><Tr d={d} p={[[0, 150, -40], [0.06, 142, 50], [0.16, 178, 50], [0.22, 200, -40], [1, 200, -40]]} /><Jeringa gel /></g>
        <Gotas d={d} a={0.5} b={0.64} />
        <Aire d={d} a={0.66} b={0.78} />
        <g><Tr d={d} p={[[0, 260, -50], [0.46, 260, -50], [0.5, 196, 26], [0.78, 196, 26], [0.82, 260, -50]]} /><Triple /></g>
        <Rotulo x={232} y={46} d={d} p={ve(0.1, 0.46)} tono="acento">ácido fosfórico 37 %</Rotulo>
        <Rotulo x={232} y={59} d={d} p={ve(0.14, 0.46)}>tiempo del fabricante</Rotulo>
        <Rotulo x={232} y={46} d={d} p={ve(0.5, 0.64)}>lava bien</Rotulo>
        <Rotulo x={232} y={46} d={d} p={ve(0.66, 0.78)}>seca</Rotulo>
        <Rotulo x={232} y={46} d={d} p={ve(0.82, 0.96)} tono="acento">blanco tiza y opaco</Rotulo>
      </>
    )
  },
  // Rama resina: adhesivo fino y fotopolimerizado, después el sellante sin burbujas y fotopolimerizado
  'fisura.sellante': {
    d: 9, quieto: 0.9, alt: 'Una capa fina de adhesivo se fotopolimeriza; después el sellante llena las fisuras sin burbujas y se fotopolimeriza otra vez.',
    C: ({ d }) => (
      <>
        <Molar />
        <path className="tiza" d={M.grabado} />
        <path className="adh fino" d="M146,54 L154,66 L160,75 L166,66 L174,54" opacity="0"><Op d={d} p={[[0.06, 0], [0.16, 1], [0.96, 1], [0.99, 0]]} /></path>
        <g><Tr d={d} p={[[0, 200, -40], [0.04, 150, 58], [0.09, 160, 72], [0.14, 170, 58], [0.18, 200, -40], [1, 200, -40]]} /><Microbrush /></g>
        <path className="res" d={M.sellante} opacity="0"><Op d={d} p={[[0.44, 0], [0.56, 1], [0.96, 1], [0.99, 0]]} /></path>
        <g><Tr d={d} p={[[0, 150, -40], [0.4, 150, -40], [0.44, 146, 52], [0.54, 174, 52], [0.58, 200, -40]]} /><Jeringa /></g>
        {[0.22, 0.62].map((a, k) => <g key={k}><Tr d={d} p={[[0, 160, -60], [a - 0.02, 160, -60], [a + 0.02, 160, 40], [a + 0.14, 160, 40], [a + 0.18, 160, -60]]} /><Lampara /></g>)}
        <Luz d={d} a={0.25} b={0.36} />
        <Luz d={d} a={0.65} b={0.76} />
        <Rotulo x={232} y={46} d={d} p={ve(0.04, 0.2)}>adhesivo en capa fina</Rotulo>
        <Rotulo x={232} y={46} d={d} p={ve(0.24, 0.38)}>fotopolimeriza</Rotulo>
        <Rotulo x={232} y={46} d={d} p={ve(0.42, 0.6)} tono="acento">sellante sin burbujas</Rotulo>
        <Rotulo x={232} y={46} d={d} p={ve(0.64, 0.78)}>fotopolimeriza</Rotulo>
        <Rotulo x={232} y={46} d={d} p={ve(0.8, 0.96)} tono="acento">cubre todas las fisuras</Rotulo>
      </>
    )
  },
  // Rama ionómero: acondiciona, aplica presionando con el dedo enguantado y protege con vaselina o barniz
  'fisura.ionomero': {
    d: 8, quieto: 0.85, alt: 'El ionómero se aplica en las fisuras, se presiona con el dedo enguantado y se protege con vaselina o barniz mientras fragua.',
    C: ({ d }) => (
      <>
        <Molar />
        <path className="iono" d={M.sellante} opacity="0"><Op d={d} p={[[0.1, 0], [0.22, 1], [0.96, 1], [0.99, 0]]} /></path>
        <g><Tr d={d} p={[[0, 150, -40], [0.06, 146, 52], [0.18, 174, 52], [0.24, 200, -40], [1, 200, -40]]} /><Jeringa /></g>
        <g><Tr d={d} p={[[0, 160, -80], [0.28, 160, -80], [0.36, 160, 50], [0.54, 160, 50], [0.62, 160, -80]]} /><Dedo /></g>
        <path className="capa-prot" d="M140,51 Q150,54 154,58 Q160,62 166,58 Q170,54 180,51" opacity="0"><Op d={d} p={[[0.66, 0], [0.76, 1], [0.96, 1], [0.99, 0]]} /></path>
        <g><Tr d={d} p={[[0, 200, -40], [0.62, 200, -40], [0.66, 142, 50], [0.74, 178, 50], [0.78, 200, -40]]} /><Microbrush /></g>
        <Rotulo x={232} y={46} d={d} p={ve(0.04, 0.26)}>acondiciona y aplica</Rotulo>
        <Rotulo x={232} y={46} d={d} p={ve(0.32, 0.6)} tono="acento">presiona con el dedo</Rotulo>
        <Rotulo x={232} y={59} d={d} p={ve(0.34, 0.6)}>enguantado</Rotulo>
        <Rotulo x={232} y={46} d={d} p={ve(0.66, 0.96)}>protege: vaselina o barniz</Rotulo>
      </>
    )
  },
  // Retira el aislamiento, revisa la oclusión, quita los excesos y agenda el control
  'fisura.oclusion': {
    d: 8, quieto: 0.9, alt: 'Sin el aislamiento, el papel de articular marca un exceso alto sobre el sellante; se quita y se agenda el control.',
    C: ({ d }) => (
      <>
        <Molar />
        <path className="res" d={M.sellante} />
        <path className="res" d={M.exceso}><Op d={d} p={[[0.46, 1], [0.62, 0], [0.97, 0], [0.995, 1]]} /></path>
        <g><Op d={d} p={[[0, 1], [0.1, 0], [0.97, 0], [0.995, 1]]} /><Algodon x={84} y={108} /><Algodon x={236} y={108} /></g>
        <g opacity="0"><Op d={d} p={ve(0.14, 0.4)} /><Papel /></g>
        <g><Tr d={d} p={[[0, 0, -40], [0.16, 0, -40], [0.24, 0, -12], [0.3, 0, -12], [0.38, 0, -40]]} /><path className="esm" d={M.antagonista} /></g>
        <ellipse className="marca alta" cx="160" cy="51" rx="6" ry="2.2" opacity="0"><Op d={d} p={[[0.28, 0], [0.3, 1], [0.5, 1], [0.6, 0]]} /></ellipse>
        <g><Tr d={d} p={[[0, 160, -50], [0.42, 160, -50], [0.48, 154, 50], [0.54, 166, 50], [0.6, 160, 52], [0.64, 160, -50]]} /><Fresa pulidor /></g>
        <Rotulo x={232} y={46} d={d} p={ve(0.02, 0.12)}>retira el aislamiento</Rotulo>
        <Rotulo x={232} y={46} d={d} p={ve(0.28, 0.46)} tono="mal">contacto alto</Rotulo>
        <Rotulo x={232} y={46} d={d} p={ve(0.48, 0.64)}>quita el exceso</Rotulo>
        <Rotulo x={232} y={46} d={d} p={ve(0.68, 0.96)} tono="acento">agenda el control</Rotulo>
      </>
    )
  }
};
