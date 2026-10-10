// Evolución con protocolo: borrador de la nota, pasos, insumos y avisos de stock (funciones puras)
import { describe, it, expect } from 'vitest';
import { pasosIniciales, insumosIniciales, pasosSinNota, borradorNota, avisosStock, insumosUsados, resumenPasos, versionTxt, itemsBandeja, insumosDeBandeja, combinarInsumos, involucradosCita } from '../src/clinica/protocolo-evolucion.js';

const DATOS = { titulo: 'Restauración de resina compuesta clase I oclusal', pasos: Array.from({ length: 9 }, (_, i) => ({ corto: 'Paso corto ' + (i + 1) })) };
const INV = [
  { id: 'res', nombre: 'Resina compuesta A2', unidad: 'jeringas', stock: 5, minimo: 4 },
  { id: 'aci', nombre: 'Ácido ortofosfórico 37 %', unidad: 'jeringas', stock: 3, minimo: 3 }
];

describe('pasos e insumos iniciales', () => {
  it('todos los pasos parten en «Hecho», en orden y con su texto corto', () => {
    const p = pasosIniciales(DATOS);
    expect(p).toHaveLength(9);
    expect(p[0]).toEqual({ i: 0, corto: 'Paso corto 1', estado: 'hecho', nota: '' });
    expect(p.every((x) => x.estado === 'hecho')).toBe(true);
  });
  it('sin datos del protocolo no hay pasos', () => { expect(pasosIniciales(null)).toEqual([]); });
  it('precarga el consumo estándar con nombre del inventario y omite insumos borrados', () => {
    const i = insumosIniciales([{ insumoId: 'res', cantidad: 1 }, { insumoId: 'aci', cantidad: 1 }, { insumoId: 'borrado', cantidad: 2 }], INV);
    expect(i.map((x) => [x.insumoId, x.nombre, x.cantidad])).toEqual([['res', 'Resina compuesta A2', 1], ['aci', 'Ácido ortofosfórico 37 %', 1]]);
  });
});

describe('borrador de la nota', () => {
  const base = { procedimiento: DATOS.titulo, protocoloId: 'resina-clase-i', version: '0.2', diente: '3.6', lote: 'L-123' };
  it('arma el texto completo con pasos hechos, insumos y lote', () => {
    const pasos = pasosIniciales(DATOS);
    const t = borradorNota({ ...base, pasos, insumos: insumosIniciales([{ insumoId: 'res', cantidad: 1 }, { insumoId: 'aci', cantidad: 1 }], INV) });
    expect(t).toBe('Restauración de resina compuesta clase I oclusal. Protocolo Criterium resina-clase-i v0.2. Pieza 3.6. Pasos: 9 de 9 hechos. Insumos: Resina compuesta A2 ×1, Ácido ortofosfórico 37 % ×1. Instrumental: lote L-123.');
  });
  it('detalla los pasos modificados, omitidos y que no aplican', () => {
    const pasos = pasosIniciales(DATOS);
    pasos[4] = { ...pasos[4], estado: 'modificado', nota: 'Grabado de 10 s por esmalte delgado.' };
    pasos[6] = { ...pasos[6], estado: 'omitido', nota: 'Sin aislamiento absoluto: paciente no lo toleró' };
    pasos[7] = { ...pasos[7], estado: 'noaplica' };
    const t = borradorNota({ ...base, pasos, insumos: [] });
    expect(t).toContain('Pasos: 6 de 9 hechos; paso 5 modificado: Grabado de 10 s por esmalte delgado; paso 7 omitido: Sin aislamiento absoluto: paciente no lo toleró; paso 8 no aplica.');
  });
  it('sin insumos lo dice, y sin lote no menciona el instrumental', () => {
    const t = borradorNota({ ...base, lote: '', pasos: pasosIniciales(DATOS), insumos: [] });
    expect(t).toContain('Insumos: no se registraron.');
    expect(t).not.toContain('Instrumental');
  });
  it('un insumo con cantidad 0 no aparece en la nota ni se guarda', () => {
    const insumos = [{ insumoId: 'res', nombre: 'Resina compuesta A2', cantidad: 1 }, { insumoId: 'aci', nombre: 'Ácido ortofosfórico 37 %', cantidad: 0 }];
    const t = borradorNota({ ...base, pasos: pasosIniciales(DATOS), insumos });
    expect(t).toContain('Insumos: Resina compuesta A2 ×1.');
    expect(t).not.toContain('Ácido');
    expect(insumosUsados(insumos)).toEqual([{ insumoId: 'res', nombre: 'Resina compuesta A2', cantidad: 1 }]);
  });
  it('la versión se escribe con v una sola vez', () => { expect(versionTxt('0.2')).toBe('v0.2'); expect(versionTxt('v0.2')).toBe('v0.2'); expect(versionTxt('')).toBe(''); });
});

describe('validaciones y avisos', () => {
  it('Modificado y Omitido piden nota; Hecho y No aplica no', () => {
    const pasos = pasosIniciales(DATOS);
    pasos[1] = { ...pasos[1], estado: 'modificado', nota: '' };
    pasos[2] = { ...pasos[2], estado: 'omitido', nota: '  ' };
    pasos[3] = { ...pasos[3], estado: 'noaplica', nota: '' };
    pasos[5] = { ...pasos[5], estado: 'modificado', nota: 'Con nota' };
    expect(pasosSinNota(pasos).map((p) => p.i)).toEqual([1, 2]);
  });
  it('avisa si el stock queda bajo el mínimo o bajo cero, sin bloquear', () => {
    expect(avisosStock([{ insumoId: 'res', cantidad: 1 }, { insumoId: 'aci', cantidad: 1 }], INV)).toEqual([{ insumoId: 'aci', nombre: 'Ácido ortofosfórico 37 %', queda: 2, tipo: 'minimo' }]);
    expect(avisosStock([{ insumoId: 'res', cantidad: 7 }], INV)).toEqual([{ insumoId: 'res', nombre: 'Resina compuesta A2', queda: -2, tipo: 'negativo' }]);
    expect(avisosStock([{ insumoId: 'res', cantidad: 0 }], INV)).toEqual([]);
  });
  it('resume los pasos hechos', () => {
    const pasos = pasosIniciales(DATOS); pasos[4] = { ...pasos[4], estado: 'modificado', nota: 'x' };
    expect(resumenPasos(pasos)).toBe('8/9 pasos');
  });
});

describe('bandeja de la cita', () => {
  const BAND = { bandeja: [{ fase: 'Aislamiento', items: ['Dique de goma', 'Clamp'] }, { fase: 'Adhesión', items: ['Ácido ortofosfórico al 37 %', 'Resina compuesta'] }] };
  const MAPA = { 'Ácido ortofosfórico al 37 %': { insumoId: 'aci', cantidad: 1 }, 'Resina compuesta': { insumoId: 'res', cantidad: 1 }, Clamp: { insumoId: 'borrado', cantidad: 1 } };
  it('lista los materiales con su fase', () => {
    expect(itemsBandeja(BAND).map((x) => x.fase + ' · ' + x.item)).toEqual(['Aislamiento · Dique de goma', 'Aislamiento · Clamp', 'Adhesión · Ácido ortofosfórico al 37 %', 'Adhesión · Resina compuesta']);
  });
  it('solo lo marcado y unido al inventario se vuelve insumo', () => {
    expect(insumosDeBandeja(['Dique de goma', 'Resina compuesta', 'Clamp'], MAPA, INV)).toEqual([{ insumoId: 'res', nombre: 'Resina compuesta A2', unidad: 'jeringas', cantidad: 1 }]);
    expect(insumosDeBandeja([], MAPA, INV)).toEqual([]);
  });
  it('suma el mismo insumo del consumo general y de la bandeja', () => {
    const r = combinarInsumos([{ insumoId: 'res', nombre: 'Resina compuesta A2', cantidad: 1 }], [{ insumoId: 'res', nombre: 'Resina compuesta A2', cantidad: 2 }, { insumoId: 'aci', nombre: 'Ácido', cantidad: 1 }]);
    expect(r).toEqual([{ insumoId: 'res', nombre: 'Resina compuesta A2', cantidad: 3 }, { insumoId: 'aci', nombre: 'Ácido', cantidad: 1 }]);
  });
  it('la nota menciona los materiales marcados', () => {
    const t = borradorNota({ procedimiento: 'Resina', pasos: [], insumos: [], bandeja: ['Dique de goma', 'Resina compuesta'] });
    expect(t).toContain('Bandeja: 2 materiales (Dique de goma, Resina compuesta).');
  });
  it('involucrados: el odontólogo de la cita (si tiene cuenta) y su asistente', () => {
    const profs = [{ id: 'p1', uid: 'u-odo' }, { id: 'p2' }];
    expect(involucradosCita({ profesionalId: 'p1', asistente: { uid: 'u-asi' } }, profs)).toEqual(['u-odo', 'u-asi']);
    expect(involucradosCita({ profesionalId: 'p2' }, profs)).toEqual([]);
  });
});
