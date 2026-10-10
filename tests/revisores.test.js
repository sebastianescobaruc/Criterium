// Revisores: consenso del panel, validación de la revisión, protocolos completados y avance del tramo
import { describe, it, expect } from 'vitest';
import { consenso, validarRevision, completados, avanceTramo, montoTramo, puedeVerBorrador, puedeRevisar, TRAMOS_DEF } from '../src/revisores.js';

const B = { tipo: 'protocolo', especialidad: 'Endodoncia', estado: 'revision', autor: { uid: 'autor' }, contenido: { pasos: [{ corto: 'Aísla' }, { corto: 'Abre' }] } };
const voto = (i, a, b, c) => ({ i, pertinencia: a, claridad: b, respaldo: c });
const rev = (uid, ronda, puntajes) => ({ revisor: { uid }, ronda, puntajes });

describe('consenso del panel', () => {
  it('con 5 revisores y ≥ 80 % de 4–5 en todo, se aprueba', () => {
    const rs = ['a', 'b', 'c', 'd', 'e'].map((u, k) => rev(u, 2, [voto(0, 5, 4, 4), voto(1, 4, 4, k === 0 ? 3 : 5)]));
    const c = consenso(B, rs, 2);
    expect(c.completo).toBe(true);
    expect(c.items.map((x) => x.acuerdo)).toEqual([1, 0.8]);
    expect(c.aprobado).toBe(true);
  });
  it('un paso con menos del 80 % no se aprueba', () => {
    const rs = ['a', 'b', 'c', 'd', 'e'].map((u, k) => rev(u, 2, [voto(0, 5, 5, 5), voto(1, 4, k < 2 ? 2 : 4, 4)]));
    expect(consenso(B, rs, 2).aprobado).toBe(false);
  });
  it('con menos revisores que el panel, no está completo', () => {
    const rs = ['a', 'b', 'c'].map((u) => rev(u, 1, [voto(0, 5, 5, 5), voto(1, 5, 5, 5)]));
    const c = consenso(B, rs, 1);
    expect(c.completo).toBe(false);
    expect(c.aprobado).toBe(false);
  });
  it('materia se puntúa como un solo ítem y basta un panel de 3', () => {
    const M = { tipo: 'materia' };
    const rs = ['a', 'b', 'c'].map((u) => rev(u, 2, [voto(0, 4, 5, 4)]));
    expect(consenso(M, rs, 2).aprobado).toBe(true);
  });
});

describe('formulario de revisión', () => {
  it('pide los tres puntajes de cada paso y 40 caracteres de comentario', () => {
    expect(validarRevision(B, [voto(0, 5, 5, 5)], 'corto')).toEqual(['Falta puntuar: Abre.', 'El comentario pide al menos 40 caracteres.']);
    expect(validarRevision(B, [voto(0, 5, 5, 5), voto(1, 3, 4, 5)], 'Un comentario suficientemente largo para justificar.')).toEqual([]);
  });
});

describe('tramos y pago', () => {
  const r = (borradorId, ronda, fecha, tipo = 'protocolo') => ({ borradorId, ronda, fecha, tipo });
  it('un protocolo cuenta solo con sus 2 rondas, en el mes de la segunda', () => {
    const c = completados([r('p1', 1, '2026-10-02'), r('p1', 2, '2026-11-03'), r('p2', 1, '2026-10-05')], 'protocolo');
    expect(c).toEqual([{ borradorId: 'p1', fecha: '2026-11-03' }]);
  });
  it('con menos del tramo no se paga; al completarlo se paga el mes, aunque sea con atraso', () => {
    const revs = [];
    for (let k = 1; k <= 2; k++) revs.push(r('p' + k, 1, '2026-10-01'), r('p' + k, 2, '2026-10-0' + (k + 1)));
    let a = avanceTramo({ tipo: 'protocolo', n: 3, cicloInicio: '2026-10-01', revisiones: revs, hoy: '2026-10-20' });
    expect(a.acumulado).toBe(2); expect(a.mesesPagados).toBe(0); expect(a.pagoAcumulado).toBe(0); expect(a.faltanParaEsteMes).toBe(1);
    for (let k = 3; k <= 4; k++) revs.push(r('p' + k, 1, '2026-11-01'), r('p' + k, 2, '2026-11-0' + k));
    a = avanceTramo({ tipo: 'protocolo', n: 3, cicloInicio: '2026-10-01', revisiones: revs, hoy: '2026-11-10' });
    expect(a.acumulado).toBe(4); expect(a.mesesPagados).toBe(1); expect(a.pagoAcumulado).toBe(montoTramo('protocolo', 3)); expect(a.alDia).toBe(false);
  });
  it('lo que sobra del ciclo queda como excedente, sin subir la tarifa', () => {
    const revs = []; for (let k = 1; k <= 11; k++) revs.push(r('p' + k, 1, '2026-10-01'), r('p' + k, 2, '2026-12-01'));
    const a = avanceTramo({ tipo: 'protocolo', n: 3, cicloInicio: '2026-10-01', revisiones: revs, hoy: '2026-12-15' });
    expect(a.mesesPagados).toBe(3); expect(a.excedente).toBe(2); expect(a.pagoAcumulado).toBe(3 * TRAMOS_DEF.protocolo[0].monto);
  });
  it('los montos salen de la configuración si existe', () => {
    expect(montoTramo('materia', 1)).toBe(180000);
    expect(montoTramo('materia', 1, { materia: [{ n: 1, monto: 90000 }] })).toBe(90000);
  });
});

describe('permisos', () => {
  it('ven los borradores solo revisores, docentes, el equipo y su autor', () => {
    expect(puedeVerBorrador(B, { uid: 'x' })).toBe(false);
    expect(puedeVerBorrador(B, { uid: 'autor' })).toBe(true);
    expect(puedeVerBorrador(B, { uid: 'x', esDocente: true })).toBe(true);
    expect(puedeVerBorrador(B, { uid: 'x', esRevisorVerificado: true })).toBe(true);
  });
  it('revisa solo un revisor de esa especialidad que no sea el autor', () => {
    expect(puedeRevisar(B, { uid: 'r', especialidades: ['Endodoncia'] })).toBe(true);
    expect(puedeRevisar(B, { uid: 'r', especialidades: ['Periodoncia'] })).toBe(false);
    expect(puedeRevisar(B, { uid: 'autor', especialidades: ['Endodoncia'] })).toBe(false);
    expect(puedeRevisar({ ...B, estado: 'borrador' }, { uid: 'r', especialidades: ['Endodoncia'] })).toBe(false);
  });
});
