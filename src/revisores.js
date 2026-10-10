// Revisores de Criterium: borradores de protocolos y de materia, consenso del panel y tramos de pago.
// Funciones puras (sin Firebase ni React): las usan creativa/revisores.jsx y las prueba tests/revisores.test.js.
// Los montos son valores por defecto: el equipo los cambia en config/revisores sin tocar el código.

// Tramos mensuales (pago fijo). Un protocolo cuenta cuando el revisor completa sus 2 rondas (60 a 90 min en total);
// con menos del mínimo no se paga.
export const TRAMOS_DEF = {
  protocolo: [{ n: 3, monto: 75000 }, { n: 5, monto: 135000 }, { n: 10, monto: 290000 }, { n: 15, monto: 465000 }],
  materia: [{ n: 1, monto: 180000 }, { n: 2, monto: 380000 }, { n: 4, monto: 800000 }] // revisar un material toma unos 240 min
};
export const RONDAS = 2;                          // siempre 2 rondas de panel
export const PANEL = { protocolo: 5, materia: 3 }; // revisores necesarios por ronda
export const UMBRAL = 0.8;                         // un paso se aprueba si ≥ 80 % pone 4 o 5 en los tres criterios
export const CRITERIOS = [['pertinencia', 'Pertinencia'], ['claridad', 'Claridad'], ['respaldo', 'Respaldo en la evidencia']];
export const ESTADOS_BORRADOR = [
  { v: 'borrador', t: 'Borrador' },
  { v: 'revision', t: 'En revisión' },
  { v: 'correcciones', t: 'Con correcciones' },
  { v: 'aprobado', t: 'Aprobado y publicado' }
];
export const estadoBorrador = (v) => ESTADOS_BORRADOR.find((e) => e.v === v) || ESTADOS_BORRADOR[0];
export const clp = (n) => '$' + Math.round(n || 0).toLocaleString('es-CL');

export const tramos = (tipo, config) => ((config && config[tipo]) || TRAMOS_DEF[tipo] || []).slice().sort((a, b) => a.n - b.n);
export const montoTramo = (tipo, n, config) => (tramos(tipo, config).find((t) => t.n === n) || {}).monto || 0;

// Ítems que el panel puntúa: los pasos del protocolo, o el material completo (materia)
export const itemsRevision = (b) => (b && b.tipo === 'protocolo' ? ((b.contenido && b.contenido.pasos) || []).map((p, i) => ({ i, t: p.corto || `Paso ${i + 1}` })) : [{ i: 0, t: 'Material completo' }]);

// Consenso de una ronda: por ítem, qué proporción del panel puso ≥ 4 en los tres criterios.
// Devuelve { n, minimo, completo, items: [{ i, t, acuerdo, ok }], aprobado }.
export function consenso(borrador, revisiones, ronda) {
  const delaRonda = (revisiones || []).filter((r) => r.ronda === ronda);
  const minimo = PANEL[borrador && borrador.tipo] || 5;
  const items = itemsRevision(borrador).map((it) => {
    const votos = delaRonda.map((r) => (r.puntajes || []).find((p) => p.i === it.i)).filter(Boolean);
    const si = votos.filter((p) => CRITERIOS.every(([k]) => (+p[k] || 0) >= 4)).length;
    const acuerdo = votos.length ? si / votos.length : 0;
    return { ...it, votos: votos.length, acuerdo, ok: votos.length > 0 && acuerdo >= UMBRAL };
  });
  const completo = delaRonda.length >= minimo;
  return { n: delaRonda.length, minimo, completo, items, aprobado: completo && items.length > 0 && items.every((x) => x.ok) };
}

// Validación del formulario de revisión: cada ítem con sus tres puntajes (1 a 5) y un comentario de al menos 40 caracteres
export function validarRevision(borrador, puntajes, comentario) {
  const faltan = itemsRevision(borrador).filter((it) => { const p = (puntajes || []).find((x) => x.i === it.i); return !p || CRITERIOS.some(([k]) => !(+p[k] >= 1 && +p[k] <= 5)); });
  const errores = [];
  if (faltan.length) errores.push(`Falta puntuar: ${faltan.map((x) => x.t).join(', ')}.`);
  if (String(comentario || '').trim().length < 40) errores.push('El comentario pide al menos 40 caracteres.');
  return errores;
}

// Protocolos (o materiales) que cuentan para el pago de un revisor: aquellos en que entregó las 2 rondas.
// Se cuentan en el mes en que entregó la segunda ronda. revisiones: las del revisor [{ borradorId, tipo, ronda, fecha }]
export function completados(revisiones, tipo) {
  const por = {};
  (revisiones || []).filter((r) => r.tipo === tipo).forEach((r) => { (por[r.borradorId] = por[r.borradorId] || {})[r.ronda] = r.fecha; });
  return Object.entries(por).filter(([, rs]) => Array.from({ length: RONDAS }, (_, k) => rs[k + 1]).every(Boolean)).map(([borradorId, rs]) => ({ borradorId, fecha: rs[RONDAS] }));
}

const mesDe = (iso) => String(iso || '').slice(0, 7);

// Pago del mes (sin ciclos): si completas tu tramo, cobras su fijo; si no llegas, cobras justo los que revisaste, a la
// tarifa del tramo más alto que alcanzaste (ej.: comprometido a 10, revisaste 7 → 7 × la tarifa del tramo de 5). Lo que
// pasa de tu tramo se paga a la tarifa de tu tramo. Bajo el mínimo (el tramo más bajo) no se paga.
export function pagoMes({ tipo, n, hechos, config }) {
  const ts = tramos(tipo, config);
  const tarifa = (t) => (t ? t.monto / t.n : 0);
  const minimo = ts.length ? ts[0].n : 0;
  const comprometido = ts.find((t) => t.n === n);
  if (!hechos || hechos < minimo) return { monto: 0, cumplido: false, tarifa: 0, tramoAlcanzado: 0 };
  if (comprometido && hechos >= comprometido.n) return { monto: Math.round(comprometido.monto + (hechos - comprometido.n) * tarifa(comprometido)), cumplido: true, tarifa: tarifa(comprometido), tramoAlcanzado: comprometido.n };
  const alcanzado = ts.filter((t) => t.n <= hechos && (!comprometido || t.n <= comprometido.n)).pop();
  return { monto: Math.round(hechos * tarifa(alcanzado)), cumplido: false, tarifa: tarifa(alcanzado), tramoAlcanzado: alcanzado ? alcanzado.n : 0 };
}

// Avance del mes en curso para «Mi tramo». hoy: 'AAAA-MM-DD'
export function avanceMes({ tipo, n, revisiones, hoy, config }) {
  const mes = mesDe(hoy);
  const hechos = completados(revisiones, tipo).filter((c) => mesDe(c.fecha) === mes).length;
  const [a, m] = mes.split('-').map(Number);
  const finMes = new Date(Date.UTC(a, m, 1, 12));
  const diasRestantes = Math.max(0, Math.ceil((finMes - new Date(hoy + 'T12:00:00Z')) / 864e5));
  const pago = pagoMes({ tipo, n, hechos, config });
  return { tipo, n, hechos, faltan: Math.max(0, n - hechos), diasRestantes, montoTramo: montoTramo(tipo, n, config), minimo: (tramos(tipo, config)[0] || {}).n || 0, ...pago };
}

// Visibilidad de un borrador: solo especialistas verificados (revisores), docentes, el equipo y su autor
export const puedeVerBorrador = (b, { uid, esRevisorVerificado, esDocente, esAdmin }) => !!(b && (esRevisorVerificado || esDocente || esAdmin || (b.autor && b.autor.uid === uid)));
// Puede revisar: revisor verificado de esa especialidad, que no sea el autor, y el borrador en revisión
export const puedeRevisar = (b, { uid, especialidades }) => !!(b && b.estado === 'revision' && b.autor && b.autor.uid !== uid && (especialidades || []).includes(b.especialidad));
