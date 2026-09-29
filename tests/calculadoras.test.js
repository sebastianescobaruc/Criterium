// Calculadoras y validación de dientes. Los valores esperados salen de las reglas escritas en logic.js.
import { describe, it, expect } from 'vitest';
import { perio, endo, anestesia, validarDientes } from '../src/logic.js';

/* ───────── validarDientes ───────── */
describe('validarDientes', () => {
  it.each(['3.6', '1.1', '4.8', '5.1', '8.5', '1.6, 1.7', '1.6 y 1.7', '36'])('acepta %s', (t) => {
    expect(validarDientes(t)).toBe('');
  });
  it.each(['', '   ', '9.1', '1.9', '0.1', '5.6', '8.8', '1.10', 'abc', '3.6, 4.9'])('rechaza "%s"', (t) => {
    expect(validarDientes(t)).not.toBe('');
  });
  it('explica el límite de la dentición temporal', () => {
    expect(validarDientes('6.7')).toMatch(/temporal/);
  });
});

/* ───────── perio (clasificación 2018) ───────── */
const p = (x) => perio({ pCal: 2, pRbl: 10, pEdad: 40, pPerdidos: 0, ...x });

describe('perio', () => {
  it('pide los datos mínimos', () => expect(perio({}).listo).toBe(false));
  it('rechaza pérdida ósea fuera de 0–100', () => expect(p({ pRbl: 120 }).listo).toBe(false));
  it('rechaza edad fuera de rango', () => expect(p({ pEdad: 0 }).listo).toBe(false));
  it('acepta coma decimal', () => expect(p({ pCal: '2,5' }).listo).toBe(true));

  it('CAL 1–2 mm y pérdida ósea < 15 % → estadio I', () => expect(p().estadio).toBe('I'));
  it('CAL 3–4 mm → estadio II', () => expect(p({ pCal: 3 }).estadio).toBe('II'));
  it('pérdida ósea 15–33 % → estadio II', () => expect(p({ pRbl: 20 }).estadio).toBe('II'));
  it('CAL ≥ 5 mm → estadio III', () => expect(p({ pCal: 5 }).estadio).toBe('III'));
  it('1 a 4 dientes perdidos → estadio III', () => expect(p({ pPerdidos: 2 }).estadio).toBe('III'));
  it('5 o más dientes perdidos → estadio IV', () => expect(p({ pPerdidos: 5 }).estadio).toBe('IV'));
  it('sondaje ≥ 6 mm sube a estadio III', () => expect(p({ pPs: 6 }).estadio).toBe('III'));
  it.each(['pVert', 'pFurca'])('%s sube a estadio III', (k) => expect(p({ [k]: 'si' }).estadio).toBe('III'));
  it('criterio de estadio IV manda', () => expect(p({ pSt4: 'si' }).estadio).toBe('IV'));

  it('extensión < 30 % es localizada', () => expect(p({ pExt: 20 }).dx).toMatch(/localizada/));
  it('extensión ≥ 30 % es generalizada', () => expect(p({ pExt: 30 }).dx).toMatch(/generalizada/));

  it('% pérdida ósea / edad < 0,25 → grado A', () => expect(p({ pRbl: 9, pEdad: 40 }).grado).toBe('A'));
  it('% pérdida ósea / edad 0,25–1 → grado B', () => expect(p({ pRbl: 20, pEdad: 40 }).grado).toBe('B'));
  it('% pérdida ósea / edad > 1 → grado C', () => expect(p({ pRbl: 50, pEdad: 40 }).grado).toBe('C'));
  it('fumar < 10 al día lleva al menos a grado B', () => expect(p({ pTabaco: 5 }).grado).toBe('B'));
  it('fumar ≥ 10 al día lleva a grado C', () => expect(p({ pTabaco: 10 }).grado).toBe('C'));
  it('HbA1c < 7 % lleva al menos a grado B', () => expect(p({ pHba: 6 }).grado).toBe('B'));
  it('HbA1c ≥ 7 % lleva a grado C', () => expect(p({ pHba: 7 }).grado).toBe('C'));
  it('un modificador nunca baja el grado', () => expect(p({ pRbl: 50, pTabaco: 5 }).grado).toBe('C'));
});

/* ───────── endo (step-back) ───────── */
describe('endo', () => {
  it('pide la LRD', () => expect(endo({}).listo).toBe(false));
  it.each([9, 36])('rechaza LRD de %i mm', (l) => expect(endo({ eLrd: l }).listo).toBe(false));
  it('rechaza lima maestra menor que #30', () => expect(endo({ eLrd: 21, eLm: 25 }).listo).toBe(false));
  it('rechaza lima inicial ≥ maestra', () => expect(endo({ eLrd: 21, eLi: 30, eLm: 30 }).listo).toBe(false));

  const r = endo({ eLrd: 21 });
  it('longitud de trabajo = LRD − 1 mm', () => expect(r.lt).toBe('20 mm'));
  it('permeabilidad = LT + 1 mm', () => expect(r.permeabilidad).toBe('21 mm'));
  it('sin LAD usa la LRD: 2/3 y cateterismo', () => {
    expect(r.dosTercios).toBe('14 mm');
    expect(r.cateterismo).toBe('19 mm');
  });
  it('fase 1: de la inicial #15 a la maestra #30, todas a LT', () => {
    expect(r.fase1.map((x) => x.lima)).toEqual(['#15', '#20', '#25', '#30 · maestra']);
    expect(r.fase1.every((x) => x.prof === '20 mm')).toBe(true);
  });
  it('fase 2: retrocede 1 mm por lima y llega a #50', () => {
    expect(r.fase2.map((x) => x.lima + ' ' + x.prof)).toEqual(['#35 19 mm', '#40 18 mm', '#45 17 mm', '#50 16 mm']);
  });
  it('medicación a LT − 1 a LT − 2', () => expect(r.medicacion).toBe('19 mm a 18 mm'));
  it('decimales con coma', () => expect(endo({ eLrd: 21.5 }).lt).toBe('20,5 mm'));
  it('necropulpectomía cambia irrigante y conflicto', () => {
    const n = endo({ eLrd: 21, eTipo: 'necro' });
    expect(n.irrigante).toMatch(/2,25/);
    expect(n.conflicto).toMatch(/Sin resolver/);
  });
  it('conducto amplio usa Gates 3-2-1', () => expect(endo({ eLrd: 21, eAmplio: 'si' }).gates).toMatch(/3-2-1/));
});

/* ───────── anestesia (lidocaína 2 % con epinefrina) ───────── */
describe('anestesia', () => {
  it('pide el peso', () => expect(anestesia({}).listo).toBe(false));
  it.each([4, 251])('rechaza %i kg', (kg) => expect(anestesia({ aPeso: kg }).listo).toBe(false));
  it('70 kg → 490 mg, 13,6 tubos', () => {
    const r = anestesia({ aPeso: 70 });
    expect(r.maxMg).toBe('490 mg');
    expect(r.maxTubos).toBe('13,6');
  });
  it('sobre 71,4 kg manda el techo de 500 mg', () => {
    const r = anestesia({ aPeso: 90 });
    expect(r.maxMg).toBe('500 mg');
    expect(r.maxTubos).toBe('13,8');
  });
  it('redondea los tubos hacia abajo, nunca hacia arriba', () => {
    expect(anestesia({ aPeso: 20 }).maxTubos).toBe('3,8'); // 140 / 36 = 3,888…
  });
  it('descuenta los tubos usados', () => {
    const r = anestesia({ aPeso: 70, aUsados: 3 });
    expect(r.usadoMg).toBe('108 mg');
    expect(r.quedanTubos).toBe('10,6');
    expect(r.pasado).toBe(false);
  });
  it('avisa si se pasó de la dosis', () => {
    const r = anestesia({ aPeso: 20, aUsados: 4 });
    expect(r.pasado).toBe(true);
    expect(r.quedanTubos).toBe('0');
  });
});
