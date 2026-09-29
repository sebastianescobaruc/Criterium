// Dosis máxima pediátrica. Valores de la tabla AAPD 2023 (pág. 408), tubos de 1,8 ml.
import { describe, it, expect } from 'vitest';
import { anestesiaNino } from '../src/logic.js';

const n = (x) => anestesiaNino({ nPeso: 20, nEdad: 6, nAnest: 'lido', nUsados: 0, nSeda: 'no', ...x });

describe('anestesiaNino', () => {
  it('pide peso y edad', () => expect(anestesiaNino({}).listo).toBe(false));
  it('rechaza 18 años o más', () => expect(n({ nEdad: 18 }).listo).toBe(false));
  it('rechaza peso fuera de rango', () => expect(n({ nPeso: 1 }).listo).toBe(false));

  it('lidocaína: 20 kg × 4,4 = 88 mg, 2,4 tubos de 36 mg', () => {
    const r = n();
    expect(r.maxMg).toBe('88 mg');
    expect(r.maxTubos).toBe('2,4');
  });
  it('redondea los mg hacia abajo', () => expect(n({ nPeso: 13 }).maxMg).toBe('57 mg')); // 57,2
  it('articaína: 20 kg × 7 = 140 mg, 1,9 tubos de 72 mg', () => {
    const r = n({ nAnest: 'arti' });
    expect(r.maxMg).toBe('140 mg');
    expect(r.maxTubos).toBe('1,9');
  });
  it('articaína bajo 4 años se bloquea', () => {
    const r = n({ nAnest: 'arti', nEdad: 3.9 });
    expect(r.listo).toBe(false);
    expect(r.bloqueo).toBe(true);
  });
  it('articaína desde 4 años se calcula', () => expect(n({ nAnest: 'arti', nEdad: 4 }).listo).toBe(true));
  it('mepivacaína 3 %: 54 mg por tubo y aviso por no tener vasoconstrictor', () => {
    const r = n({ nAnest: 'mepi3' });
    expect(r.maxTubos).toBe('1,6'); // 88 / 54
    expect(r.avisos.join(' ')).toMatch(/Sin vasoconstrictor/);
  });
  it('menor de 6 meses descuenta 30 %', () => expect(n({ nPeso: 6, nEdad: 0.4 }).maxMg).toBe('18 mg')); // 26,4 × 0,7 = 18,48
  it('desde 6 meses no descuenta', () => expect(n({ nPeso: 6, nEdad: 0.5 }).maxMg).toBe('26 mg'));
  it('con sedación avisa sin descontar', () => {
    const r = n({ nSeda: 'si' });
    expect(r.maxMg).toBe('88 mg');
    expect(r.avisos.join(' ')).toMatch(/sedación/);
  });
  it('descuenta los tubos usados y avisa si se pasó', () => {
    expect(n({ nUsados: 1 }).quedanTubos).toBe('1,4'); // (88 − 36) / 36 = 1,44
    expect(n({ nUsados: 3 }).pasado).toBe(true);
  });
});
