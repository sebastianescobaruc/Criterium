// Animaciones como datos («recetas»): la IA (o una persona) describe la escena con palabras de un vocabulario cerrado
// y este archivo la dibuja con las mismas bases e instrumentos que las escenas hechas a mano. Así un borrador nuevo
// trae su animación sin que nadie tenga que programarla.
//
// Una receta es un objeto en `anim` del paso (en vez del nombre de una escena):
// { base, estado, duracion, quieto, capas, quitar, instrumentos, efectos, rotulos, marcas, pieza }
// El vocabulario (bases, estados, capas, puntos, instrumentos) está en VOCABULARIO, más abajo, y lo valida validarReceta.
import React from 'react';
import { Op, Tr, Ro, ve, Fresa, Explorador, Jeringa, Triple, Microbrush, Lampara, Papel, Gotas, Aire, Luz, Rotulo, Dique, Cepillo, Dedo, Algodon, SondaPerio, Ultrasonido, Cureta, Gotero, Lima, Gates, Espaciador, Elevador, Sindesmotomo, Forceps, Gasa, Disco } from './base.jsx';
import { M, Molar } from './molar.jsx';
import { E, pt, canal, Premolar } from './endo.jsx';
import { P, SUB, Periodonto } from './perio.jsx';
import { X, Maxilar, Diente18 } from './exo.jsx';
import { C, Base, Invertida } from './pmma.jsx';

const ANCHO = { anchoV: [4.2, 1.2], anchoP: [4.2, 1.2] };
const conductos = (clase, hasta = 1) => <g><path className={clase} d={canal(0, hasta, 4.2, 1.2)} /><path className={clase} d={canal(0, hasta, 4.2, 1.2, 'P')} /></g>;

/* ═══ Bases: qué dibujan, qué estados aceptan, qué capas y qué puntos tienen ═══
   Las capas se dibujan en el orden de `orden` (de atrás hacia adelante). */
const BASES = {
  molar: {
    desc: 'Molar en corte vestibulolingual, corona arriba (operatoria, sellantes).',
    rotulo: [232, 46],
    estados: { cavidad: 'cavidad preparada (sin caries)', caries: 'caries en el surco', restaurada: 'resina completa', sellante: 'sellante en la fisura', dique: 'dique de goma puesto', algodones: 'rollos de algodón a los lados' },
    dibujar: (e) => <Molar cavidad={!!e.cavidad || !!e.restaurada} caries={!!e.caries} fisura={!e.cavidad && !e.restaurada && !e.sellante} />,
    capas: {
      cavidad: <path className="aire" d={M.cavidad} />,
      caries: <path className="car" d={M.caries} />,
      fisura: <path className="fis" d={M.fisura} />,
      mancha: <path className="mancha" d={M.fisura} />,
      placa: <g><circle className="pla-p" cx="157" cy="66" r="2.4" /><circle className="pla-p" cx="163" cy="67" r="2.2" /><circle className="pla-p" cx="160" cy="72" r="2" /></g>,
      grabado: <path className="tiza" d={M.grabado} />,
      gel: <g><path className="gel" d={M.gelI} /><path className="gel" d={M.gelD} /></g>,
      'gel-fisura': <path className="gel" d={M.grabado} />,
      liner: <path className="liner" d={M.liner} />,
      adhesivo: <path className="adh" d={M.borde} />,
      resina1: <path className="res" d={M.capa1} />, resina2: <path className="res" d={M.capa2} />, resina3: <path className="res" d={M.capa3} />,
      resina: <g><path className="res" d={M.capa1} /><path className="res" d={M.capa2} /><path className="res" d={M.capa3} /></g>,
      sellante: <path className="res" d={M.sellante} />,
      ionomero: <path className="iono" d={M.sellante} />,
      exceso: <path className="res" d={M.exceso} />,
      proteccion: <path className="capa-prot" d="M140,51 Q150,54 154,58 Q160,62 166,58 Q170,54 180,51" />,
      marcas: <g><ellipse className="marca" cx="128" cy="45" rx="5" ry="2" /><ellipse className="marca" cx="192" cy="45" rx="5" ry="2" /></g>,
      'contacto-alto': <ellipse className="marca alta" cx="160" cy="52" rx="6" ry="2.2" />,
      papel: <Papel />,
      antagonista: <path className="esm" d={M.antagonista} />,
      dique: <Dique />,
      algodones: <g><Algodon x={84} y={108} /><Algodon x={236} y={108} /></g>
    },
    orden: ['cavidad', 'caries', 'fisura', 'mancha', 'placa', 'grabado', 'gel', 'gel-fisura', 'liner', 'adhesivo', 'resina1', 'resina2', 'resina3', 'resina', 'sellante', 'ionomero', 'exceso', 'proteccion', 'marcas', 'contacto-alto', 'dique', 'algodones', 'papel', 'antagonista'],
    fijas: (e) => [e.restaurada && 'resina', e.sellante && 'sellante', e.dique && 'dique', e.algodones && 'algodones'].filter(Boolean),
    puntos: { fuera: [160, -50], arriba: [160, 30], surco: [160, 64], cuspideV: [128, 45], cuspideL: [192, 45], vertienteV: [146, 54], vertienteL: [174, 54], piso: [160, 95], paredV: [149, 80], paredL: [171, 80], cuelloV: [100, 118], cuelloL: [220, 118], lado: [196, 26] }
  },
  premolar: {
    desc: 'Primer premolar superior en corte, corona arriba, con dos conductos; los instrumentos van en el vestibular (endodoncia).',
    rotulo: [232, 30],
    estados: { acceso: 'cavidad de acceso abierta', caries: 'caries en la corona', dique: 'dique de goma puesto', conducto: "contenido del conducto: 'pulpa' | 'vacio' | 'liquido' | 'gutapercha' | 'hidroxido'" },
    dibujar: (e) => {
      const c = { pulpa: 'pul', vacio: 'aire', liquido: 'liq', gutapercha: 'gut', hidroxido: 'hidroxido' }[e.conducto || 'pulpa'] || 'pul';
      return <Premolar acceso={!!e.acceso} caries={!!e.caries} conducto={c} {...(e.conducto && e.conducto !== 'pulpa' ? ANCHO : {})} />;
    },
    capas: {
      acceso: <g><path className="aire" d={E.acceso} /><path className="aire" d={E.camara} /></g>,
      caries: <path className="car" d={E.cariesM} />,
      pared: <path className="res" d={E.pared} />,
      liquido: conductos('liq'), suero: conductos('suero'), edta: conductos('edta'),
      gutapercha: conductos('gut'), hidroxido: conductos('hidroxido', 0.81),
      entradas: <g><circle className="entrada" cx="140" cy="100" r="2.6" /><circle className="entrada" cx="160" cy="100" r="2.6" /></g>,
      torunda: <Algodon x={150} y={88} r={8} />,
      provisorio: <path className="provisorio" d="M136,80 L164,80 L163,70 Q150,66 137,70 Z" />,
      ionomero: <path className="iono" d={E.ionomero} />,
      resina: <path className="res" d={E.resina} />,
      dique: <Dique izq={114} der={186} y={88} />
    },
    orden: ['acceso', 'caries', 'pared', 'liquido', 'suero', 'edta', 'gutapercha', 'hidroxido', 'entradas', 'torunda', 'provisorio', 'ionomero', 'resina', 'dique'],
    fijas: (e) => [e.dique && 'dique'].filter(Boolean),
    puntos: { fuera: [150, -60], oclusal: [150, 38], cuspideV: [130, 24], camara: [150, 84], entradaV: [140, 100], entradaP: [160, 100], vestibular: [108, 56], lado: [196, 26] },
    // 'conducto:0.9' = punto del conducto vestibular (0 entrada, 1 ápice); 'conductoP:0.9' el palatino
    extra: 'conducto:t y conductoP:t (t de 0 = entrada a 1 = ápice; 0,3 = 2/3 de la LAD, 0,905 = LT, 0,81 = LT − 1, 0,715 = LT − 2, 0,62 = LT − 3; −1,7 = fuera del diente)'
  },
  periodonto: {
    desc: 'Diente unirradicular en corte con encía y hueso; a la derecha (vestibular) un saco con cálculo (periodoncia).',
    rotulo: [214, 24],
    estados: { calculo: 'cálculo supra y subgingival (por defecto sí)', placa: 'placa teñida' },
    dibujar: (e) => <Periodonto supra={e.calculo !== false} sub={e.calculo !== false} />,
    capas: {
      placa: <g><path className="pla" d={P.placaD} /><path className="pla" d={P.placaI} /></g>,
      'calculo-supra': <path className="cal" d={P.supra} />,
      'calculo-sub': <g>{SUB.map(([x, y, rx, ry], k) => <ellipse key={k} className="cal" cx={x} cy={y} rx={rx} ry={ry} />)}</g>,
      liquido: <path className="liq" d={P.saco} />,
      'raiz-lisa': <path className="lisa" d={P.lisa} />
    },
    orden: ['placa', 'calculo-supra', 'calculo-sub', 'liquido', 'raiz-lisa'],
    fijas: (e) => [e.placa && 'placa'].filter(Boolean),
    puntos: { fuera: [230, -40], corona: [150, 30], cuello: [176, 60], margen: [174, 66], saco: [172, 112], 'saco-medio': [173, 90], encia: [206, 98] }
  },
  maxilar: {
    desc: 'Maxilar superior visto por vestibular: el 1.8 con la corona hacia abajo, el 1.7, la tuberosidad y el seno (cirugía).',
    rotulo: [272, 130],
    estados: { diente: 'el 1.8 en su lugar (por defecto sí)', alveolo: 'alveolo vacío visible' },
    dibujar: (e, pieza) => <Maxilar diente={e.diente !== false && !pieza} alveolo={!!e.alveolo} />,
    capas: {
      separacion: <path className="separa" d={X.margen} />,
      coagulo: <path className="coagulo" d={X.alveolo} />,
      'piso-ok': <path className="piso-ok" d={X.piso} />,
      luz: <path className="haz" d="M150,184 L188,184 L184,64 L156,64 Z" />,
      dedos: <g><g transform="translate(268,100) rotate(58) scale(.62)"><Dedo /></g><g transform="translate(296,78) rotate(66) scale(.62)"><Dedo /></g></g>
    },
    orden: ['coagulo', 'separacion', 'piso-ok', 'luz', 'dedos'],
    fijas: () => [],
    puntos: { fuera: [169, 220], cuello: [169, 118], mesial: [134, 110], vestibulo: [204, 92], alveolo: [169, 96], tuberosidad: [280, 90], corona: [169, 140] },
    pieza: () => <Diente18 />, piezaGiro: [170, 70]
  },
  munon: {
    desc: 'Muñón preparado con su corona provisional, en corte, con encía y hueso (rehabilitación oral).',
    rotulo: [222, 30],
    estados: { corona: "'nueva' | 'vieja' | false: la corona puesta", gutapercha: 'pilar endodonciado', dique: 'dique de goma puesto', cemento: 'capa de cemento bajo la corona' },
    dibujar: (e, pieza) => <Base gutapercha={!!e.gutapercha}>{!pieza && e.cemento && <path className="cem" d={C.borde} />}{!pieza && e.corona && <path className={e.corona === 'vieja' ? 'viejo' : 'pmma'} d={C.corona} />}</Base>,
    capas: {
      gel: <path className="gel-l" d={C.borde} />,
      adhesivo: <path className="adh" d={C.borde} />,
      cemento: <path className="cem" d={C.borde} />,
      restos: <g><circle className="cem-p" cx="131" cy="72" r="3" /><circle className="cem-p" cx="169" cy="88" r="3" /><circle className="cem-p" cx="148" cy="47" r="2.6" /></g>,
      excesos: <g><ellipse className="cem-ex" cx="118" cy="113" rx="6" ry="3.5" /><ellipse className="cem-ex" cx="182" cy="113" rx="6" ry="3.5" /></g>,
      mate: <path className="mate" d={C.mate} />,
      recubrimiento: <path className="recubre" d={C.vestibular} />,
      'margen-ok': <path className="borde-ok" d="M112,112 L128,112 M172,112 L188,112" />,
      'contacto-alto': <ellipse className="marca alta" cx="142" cy="28" rx="6" ry="2.2" />,
      papel: <Papel x={-10} y={-16} />,
      antagonista: <path className="esm" d={C.antagonista} />,
      dique: <Dique izq={118} der={182} y={112} />
    },
    orden: ['gel', 'adhesivo', 'cemento', 'restos', 'excesos', 'mate', 'recubrimiento', 'margen-ok', 'contacto-alto', 'dique', 'papel', 'antagonista'],
    fijas: (e) => [e.dique && 'dique'].filter(Boolean),
    puntos: { fuera: [150, -60], oclusal: [150, 28], margenV: [121, 111], margenL: [179, 111], munonV: [130, 70], munonL: [170, 70], vestibular: [116, 80], arriba: [150, 24] },
    pieza: (e) => <g>{e.cemento && <path className="cem" d={C.borde} />}<path className={e.corona === 'vieja' ? 'viejo' : 'pmma'} d={C.corona} /></g>, piezaGiro: [150, 70]
  },
  corona: {
    desc: 'La corona provisional fuera de la boca, invertida, con la cara interna hacia arriba (laboratorio o sillón).',
    rotulo: [222, 40],
    estados: {},
    dibujar: () => null,
    envolver: (hijos) => <Invertida>{hijos}</Invertida>,
    capas: {
      gel: <path className="gel-l" d={C.borde} />, cemento: <path className="cem" d={C.borde} />, adhesivo: <path className="adh" d={C.borde} />, mate: <path className="mate-l" d={C.borde} />
    },
    orden: ['gel', 'mate', 'cemento', 'adhesivo'],
    fijas: () => [],
    puntos: { fuera: [220, -30], arriba: [150, -10], interior: [150, 90], bordeV: [128, 40], bordeL: [172, 40] }
  }
};

/* ═══ Instrumentos por nombre ═══ */
const INSTRUMENTOS = {
  fresa: { C: () => <Fresa />, desc: 'fresa en pieza de mano (corta)' },
  pulidor: { C: () => <Fresa pulidor />, desc: 'goma o punta de pulir' },
  explorador: { C: () => <Explorador />, desc: 'explorador o sonda de caries' },
  jeringa: { C: () => <Jeringa />, desc: 'jeringa con aguja (anestesia, irrigación, aplicación)' },
  'jeringa-gel': { C: () => <Jeringa gel />, desc: 'jeringa de ácido grabador' },
  triple: { C: () => <Triple />, desc: 'jeringa triple (agua y aire)' },
  microbrush: { C: () => <Microbrush />, desc: 'microbrush con adhesivo o primer' },
  lampara: { C: () => <Lampara />, desc: 'lámpara de fotopolimerizar' },
  cepillo: { C: () => <Cepillo />, desc: 'cepillo dental' },
  dedo: { C: () => <Dedo />, desc: 'dedo enguantado (presión)' },
  sonda: { C: () => <SondaPerio />, desc: 'sonda periodontal milimetrada' },
  ultrasonido: { C: ({ d }) => <Ultrasonido d={d} a={0} b={1} />, desc: 'punta de ultrasonido (vibra)' },
  cureta: { C: () => <Cureta />, desc: 'cureta Gracey' },
  gotero: { C: () => <Gotero />, desc: 'gotero (revelador)' },
  gates: { C: () => <Gates />, desc: 'fresa Gates Glidden' },
  espaciador: { C: () => <Espaciador />, desc: 'espaciador digital' },
  elevador: { C: () => <Elevador />, desc: 'elevador recto (de abajo hacia arriba)' },
  sindesmotomo: { C: () => <Sindesmotomo />, desc: 'sindesmótomo (de abajo hacia arriba)' },
  forceps: { C: () => <Forceps />, desc: 'fórceps (bocados abrazan el cuello)' },
  gasa: { C: () => <Gasa />, desc: 'gasa doblada' },
  disco: { C: ({ d }) => <Disco d={d} />, desc: 'disco de pulir (gira)' },
  algodon: { C: () => <Algodon x={0} y={0} r={7} />, desc: 'torunda o rollo de algodón' }
};
// Limas tipo K con el color ISO de su número
for (const n of [10, 15, 20, 25, 30, 35, 40, 45, 50]) INSTRUMENTOS['lima-' + n] = { C: () => <Lima n={n} tope={140} />, desc: 'lima K #' + n, eje: true };
INSTRUMENTOS.gates.eje = true; INSTRUMENTOS.espaciador.eje = true;

export const VOCABULARIO = {
  bases: Object.fromEntries(Object.entries(BASES).map(([k, b]) => [k, { desc: b.desc, estados: b.estados, capas: Object.keys(b.capas), puntos: Object.keys(b.puntos), ...(b.extra ? { puntosExtra: b.extra } : {}), ...(b.pieza ? { pieza: 'la pieza se puede mover con `pieza`' } : {}) }])),
  instrumentos: Object.fromEntries(Object.entries(INSTRUMENTOS).map(([k, v]) => [k, v.desc])),
  efectos: { luz: 'luz de la lámpara (cono azul) bajo el punto', gotas: 'agua o suero cayendo en el punto', aire: 'soplido de aire en el punto' },
  tonos: ['', 'acento', 'mal']
};

/* ═══ Validación ═══ */
const esT = (t) => typeof t === 'number' && t >= 0 && t <= 1;
function punto(base, p) {
  if (Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number')) return p;
  if (typeof p !== 'string') return null;
  const m = p.match(/^conducto(P?):(-?\d*\.?\d+)$/);
  if (m && base === 'premolar') return pt(parseFloat(m[2]), m[1] ? 'P' : 'V');
  return BASES[base] && BASES[base].puntos[p] ? BASES[base].puntos[p] : null;
}
// Devuelve la lista de problemas en palabras (vacía si la receta se puede dibujar)
export function validarReceta(r) {
  const err = [];
  if (!r || typeof r !== 'object') return ['La animación no es un objeto.'];
  const b = BASES[r.base];
  if (!b) return ['Base desconocida: «' + r.base + '». Usa una de: ' + Object.keys(BASES).join(', ') + '.'];
  if (r.duracion != null && !(r.duracion >= 4 && r.duracion <= 12)) err.push('La duración va entre 4 y 12 segundos.');
  for (const k of Object.keys(r.estado || {})) if (!(k in b.estados)) err.push('Estado desconocido en ' + r.base + ': «' + k + '».');
  for (const c of [...(r.capas || []), ...(r.quitar || [])]) {
    if (!b.capas[c.capa]) err.push('Capa desconocida en ' + r.base + ': «' + c.capa + '».');
    if (!esT(c.desde) || !esT(c.hasta) || c.desde >= c.hasta) err.push('La capa «' + c.capa + '» necesita desde < hasta, entre 0 y 1.');
  }
  for (const i of r.instrumentos || []) {
    if (!INSTRUMENTOS[i.i]) err.push('Instrumento desconocido: «' + i.i + '».');
    if (!Array.isArray(i.ruta) || i.ruta.length < 2) err.push('El instrumento «' + i.i + '» necesita una ruta de al menos 2 puntos.');
    else for (const [t, p] of i.ruta) { if (!esT(t)) err.push('Tiempo fuera de 0 a 1 en la ruta de «' + i.i + '».'); if (!punto(r.base, p)) err.push('Punto desconocido en ' + r.base + ': «' + p + '».'); }
  }
  for (const f of r.efectos || []) {
    if (!VOCABULARIO.efectos[f.e]) err.push('Efecto desconocido: «' + f.e + '».');
    if (!punto(r.base, f.en)) err.push('Punto desconocido para el efecto «' + f.e + '»: «' + f.en + '».');
    if (!esT(f.desde) || !esT(f.hasta) || f.desde >= f.hasta) err.push('El efecto «' + f.e + '» necesita desde < hasta.');
  }
  for (const t of r.rotulos || []) {
    if (!t.txt || t.txt.length > 30) err.push('Cada rótulo tiene entre 1 y 30 caracteres: «' + (t.txt || '') + '».');
    if (!esT(t.desde) || !esT(t.hasta) || t.desde >= t.hasta) err.push('El rótulo «' + t.txt + '» necesita desde < hasta.');
    if (t.tono && !VOCABULARIO.tonos.includes(t.tono)) err.push('Tono desconocido: «' + t.tono + '».');
  }
  for (const m of r.marcas || []) if (r.base !== 'premolar' || !punto('premolar', m.en)) err.push('Las marcas solo van en el premolar, sobre un punto conducto:t.');
  if (r.pieza && !b.pieza) err.push('La base ' + r.base + ' no tiene una pieza que se mueva.');
  return err;
}

/* ═══ Dibujo ═══ */
const visible = (desde, hasta) => [[desde, 0], [Math.min(desde + 0.04, hasta), 1], [Math.max(hasta - 0.04, desde + 0.04), 1], [hasta, 0]];
const sale = (desde, hasta) => [[desde, 1], [hasta, 0], [0.97, 0], [0.995, 1]];

export function RecetaEscena({ r, d }) {
  const b = BASES[r.base];
  const e = r.estado || {};
  const quitar = new Set((r.quitar || []).map((q) => q.capa));
  // Lo que el estado dibuja y se va a quitar, lo dibuja la receta (para poder desvanecerlo)
  const eBase = { ...e }; for (const q of quitar) if (q in eBase) eBase[q] = false;
  const fijas = b.fijas(eBase).filter((c) => !quitar.has(c));
  const capas = [
    ...fijas.map((c) => ({ capa: c, fija: true })),
    ...(r.quitar || []).map((c) => ({ ...c, sale: true })),
    ...(r.capas || [])
  ].sort((x, y) => b.orden.indexOf(x.capa) - b.orden.indexOf(y.capa));
  const dibujoCapas = capas.map((c, k) => (
    <g key={k} opacity={c.fija || c.sale ? 1 : 0}>{!c.fija && <Op d={d} p={c.sale ? sale(c.desde, c.hasta) : visible(c.desde, c.hasta)} />}{b.capas[c.capa]}</g>
  ));
  const pieza = r.pieza && b.pieza ? (
    <g>
      {r.pieza.ruta && <Tr d={d} p={r.pieza.ruta} />}
      <g>{r.pieza.giro && <Ro d={d} c={b.piezaGiro} p={r.pieza.giro} />}{b.pieza(e)}</g>
    </g>
  ) : null;
  const [lx, ly] = b.rotulo;
  return (
    <>
      {b.dibujar(eBase, !!pieza)}
      {b.envolver ? b.envolver(dibujoCapas) : dibujoCapas}
      {pieza}
      {(r.marcas || []).map((m, k) => {
        const [mx, my] = punto('premolar', m.en);
        return <g key={'m' + k} opacity="0"><Op d={d} p={visible(m.desde ?? 0, m.hasta ?? 1)} /><path className="guia" d={`M104,${my} L${mx - 3},${my}`} /><text x="101" y={my + 3.5} textAnchor="end" className="rot chico">{m.txt}</text></g>;
      })}
      {(r.instrumentos || []).map((ins, k) => {
        const I = INSTRUMENTOS[ins.i];
        const ruta = ins.ruta.map(([t, p]) => [t, ...punto(r.base, p)]);
        const eje = I.eje && r.base === 'premolar' ? 20.6 : 0;
        const ang = (ins.angulo || 0) + eje;
        return <g key={'i' + k}><Tr d={d} p={ruta} /><g transform={ang ? `rotate(${ang})` : undefined}><I.C d={d} /></g></g>;
      })}
      {(r.efectos || []).map((f, k) => {
        const [x, y] = punto(r.base, f.en);
        if (f.e === 'luz') return <Luz key={'e' + k} d={d} a={f.desde} b={f.hasta} x={x} y={y} />;
        if (f.e === 'gotas') return <Gotas key={'e' + k} d={d} a={f.desde} b={f.hasta} x={x - 160} y={y - 46} />;
        return <Aire key={'e' + k} d={d} a={f.desde} b={f.hasta} x={x - 160} y={y - 40} />;
      })}
      {(r.rotulos || []).map((t, k) => <Rotulo key={'r' + k} x={lx} y={ly + 13 * (t.linea || 0)} d={d} p={ve(t.desde, t.hasta)} tono={t.tono || ''}>{t.txt}</Rotulo>)}
    </>
  );
}
