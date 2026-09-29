// Periodontograma: NIC por sitio y resumen.
import { describe, it, expect } from 'vitest';
import { nicSitio, resumenPeriodontograma, ARCADAS_PERIO, tieneFurca } from '../src/logic.js';

describe('nicSitio', () => {
  it('NIC = sondaje − margen', () => expect(nicSitio({ ps: 5, mg: 1 })).toBe(4));
  it('recesión (margen negativo) suma', () => expect(nicSitio({ ps: 3, mg: -2 })).toBe(5));
  it('sin margen, NIC = sondaje', () => expect(nicSitio({ ps: 4 })).toBe(4));
  it('sin sondaje no hay NIC', () => expect(nicSitio({ mg: -2 })).toBe(null));
  it('acepta texto', () => expect(nicSitio({ ps: '6', mg: '-1' })).toBe(7));
});

describe('arcadas', () => {
  it('32 dientes en orden de pantalla', () => {
    expect(ARCADAS_PERIO.sup.slice(0, 2)).toEqual(['1.8', '1.7']);
    expect(ARCADAS_PERIO.sup.slice(7, 9)).toEqual(['1.1', '2.1']);
    expect(ARCADAS_PERIO.inf[0]).toBe('4.8');
    expect(ARCADAS_PERIO.inf[15]).toBe('3.8');
    expect(ARCADAS_PERIO.sup.length + ARCADAS_PERIO.inf.length).toBe(32);
  });
  it('furca en molares y primeros premolares superiores', () => {
    expect(['1.6', '2.7', '3.8', '4.6', '1.4', '2.4'].every(tieneFurca)).toBe(true);
    expect(['1.5', '3.4', '4.4', '1.1'].some(tieneFurca)).toBe(false);
  });
});

describe('resumenPeriodontograma', () => {
  const chart = {
    '1.6': { furca: 'II', mov: '1', s: {
      vd: { ps: 6, mg: -1, sg: true, pl: true }, vc: { ps: 3, mg: -3 }, vm: { ps: 4, mg: 0, sg: true },
      ld: { ps: 2 }, lc: { ps: 2 }, lm: { ps: 2 }
    } },
    '1.1': { aus: true, s: { vd: { ps: 9 } } },
    '3.1': { mov: '2' }
  };
  const r = resumenPeriodontograma(chart);

  it('cuenta presentes y ausentes', () => { expect(r.presentes).toBe(31); expect(r.ausentes).toBe(1); });
  it('ignora sitios de dientes ausentes', () => { expect(r.sondados).toBe(6); expect(r.psMax).toBe(6); });
  it('% sangrado y placa sobre sitios sondados', () => { expect(r.sangrado).toBe(33); expect(r.placa).toBe(17); });
  it('cuenta sitios ≥ 4 y ≥ 6 mm', () => { expect(r.ps4).toBe(2); expect(r.ps6).toBe(1); });
  it('NIC máximo solo en sitios interdentales', () => {
    // vc tiene NIC 6 (3 − (−3)) pero es centro; vd tiene NIC 7
    expect(r.nicMax).toBe(7);
    expect(r.nicMaxDiente).toBe('1.6');
  });
  it('detecta furca II o III y movilidad 2 o más', () => {
    expect(r.furcaAvanzada).toBe(true);
    expect(r.movilidad2).toBe(true);
  });
  it('periodontograma vacío no revienta', () => {
    const v = resumenPeriodontograma({});
    expect(v.sondados).toBe(0);
    expect(v.sangrado).toBe(0);
    expect(v.nicMax).toBe(null);
  });
});
