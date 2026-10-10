// Evolución con protocolo: funciones puras (sin Firebase ni React) para armar los pasos, los insumos, el borrador de
// la nota y los avisos de stock. Las usa la ficha (clinica.jsx › EvolucionProtocolo) y las prueba
// tests/protocolo-evolucion.test.js.

// Los mismos estados y textos de Mis casos (views/casos.jsx)
export const ESTADOS_PASO_EVOL = [
  { v: 'hecho', t: 'Hecho', tono: 'ok' },
  { v: 'modificado', t: 'Modificado', tono: 'warn' },
  { v: 'omitido', t: 'Omitido', tono: 'bad' },
  { v: 'noaplica', t: 'No aplica' }
];
const TXT = { hecho: 'hecho', modificado: 'modificado', omitido: 'omitido', noaplica: 'no aplica' };
export const pideNota = (estado) => estado === 'modificado' || estado === 'omitido';
export const versionTxt = (v) => { const s = String(v || '').trim(); return !s ? '' : /^v/i.test(s) ? s : 'v' + s; };

// Todos los pasos del protocolo parten en «Hecho»
export function pasosIniciales(datos) {
  return ((datos && datos.pasos) || []).map((p, i) => ({ i, corto: p.corto || `Paso ${i + 1}`, estado: 'hecho', nota: '' }));
}

// Insumos estándar del protocolo (clinicas/{cid}.consumos[protocoloId]), con el nombre y la unidad del inventario.
// Los que ya no existen en el inventario se dejan fuera.
export function insumosIniciales(consumos, inventario) {
  return (consumos || []).map((c) => {
    const it = (inventario || []).find((x) => x.id === c.insumoId);
    return it ? { insumoId: it.id, nombre: it.nombre, unidad: it.unidad || '', cantidad: Math.max(0, Math.round(+c.cantidad || 0)) } : null;
  }).filter(Boolean);
}

// Modificado y Omitido piden una nota corta. Devuelve los pasos a los que les falta.
export function pasosSinNota(pasos) {
  return (pasos || []).filter((p) => pideNota(p.estado) && !String(p.nota || '').trim());
}

// Borrador de la nota clínica. Ejemplo:
// «Restauración de resina compuesta clase I oclusal. Protocolo Criterium resina-clase-i v0.2. Pieza 3.6. Pasos: 8 de 9
//  hechos; paso 5 modificado: … Insumos: Resina compuesta A2 ×1, Ácido ortofosfórico 37 % ×1. Instrumental: lote L-123.»
export function borradorNota({ procedimiento, protocoloId, version, diente, pasos, insumos, lote } = {}) {
  const ps = pasos || [];
  const partes = [];
  if (procedimiento && String(procedimiento).trim()) partes.push(String(procedimiento).trim().replace(/\.$/, '') + '.');
  if (protocoloId) partes.push(`Protocolo Criterium ${protocoloId}${version ? ' ' + versionTxt(version) : ''}.`);
  if (diente && String(diente).trim()) partes.push(`Pieza ${String(diente).trim()}.`);
  if (ps.length) {
    const hechos = ps.filter((p) => p.estado === 'hecho').length;
    const desvios = ps.filter((p) => p.estado !== 'hecho').map((p) => {
      const nota = String(p.nota || '').trim().replace(/\.$/, '');
      return `paso ${p.i + 1} ${TXT[p.estado] || p.estado}${nota ? ': ' + nota : ''}`;
    });
    partes.push(`Pasos: ${hechos} de ${ps.length} hechos${desvios.length ? '; ' + desvios.join('; ') : ''}.`);
  }
  const usados = (insumos || []).filter((x) => (+x.cantidad || 0) > 0);
  partes.push(usados.length ? `Insumos: ${usados.map((x) => `${x.nombre} ×${Math.round(+x.cantidad)}`).join(', ')}.` : 'Insumos: no se registraron.');
  if (lote && String(lote).trim()) partes.push(`Instrumental: lote ${String(lote).trim()}.`);
  return partes.join(' ');
}

// Insumos que quedarían bajo cero o bajo su mínimo al descontar lo usado. Solo avisa: la ficha no se detiene por el inventario.
export function avisosStock(insumos, inventario) {
  return (insumos || []).filter((x) => (+x.cantidad || 0) > 0).map((x) => {
    const it = (inventario || []).find((y) => y.id === x.insumoId);
    if (!it) return null;
    const queda = (it.stock || 0) - Math.round(+x.cantidad);
    if (queda < 0) return { insumoId: it.id, nombre: it.nombre, queda, tipo: 'negativo' };
    if (queda < (it.minimo || 0)) return { insumoId: it.id, nombre: it.nombre, queda, tipo: 'minimo' };
    return null;
  }).filter(Boolean);
}

// Lo que se guarda en la evolución: solo los insumos usados (cantidad > 0), en enteros
export const insumosUsados = (insumos) => (insumos || []).filter((x) => (+x.cantidad || 0) > 0).map((x) => ({ insumoId: x.insumoId, nombre: x.nombre, cantidad: Math.round(+x.cantidad) }));
export const resumenPasos = (pasos) => `${(pasos || []).filter((p) => p.estado === 'hecho').length}/${(pasos || []).length} pasos`;
