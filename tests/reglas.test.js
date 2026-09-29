// Reglas de validar() y chequeoCaso() con un catálogo de prueba.
// Se reemplaza data.js para que las pruebas no dependan del contenido clínico real.
import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/data.js', () => {
  const fuente = (grado, extra = {}) => ({ cita: 'Autor de prueba 2020', grado, loc: 'p. 1', ...extra });
  return {
    PROTOS: [{ id: 'prueba', abre: true }, { id: 'reglas', abre: true }],
    DATOS: {
      // Protocolo para chequeoCaso: un paso de cada tipo.
      prueba: {
        titulo: 'Protocolo de prueba', esp: 'Rehabilitación oral', alcance: '',
        pasos: [
          { corto: 'Normal', hacer: '', listo: '', porque: [], sub: [{ titulo: 'x', fuentes: [fuente('Grado B')] }] },
          { corto: 'Condicional', cond: 'Solo si hay X', hacer: '', listo: '', porque: [], sinEv: 'Sin evidencia' },
          { corto: 'Crítico', marca: 'paso crítico', hacer: '', listo: '', porque: [], sinEv: 'Sin evidencia' },
          { corto: 'Suele faltar', marca: 'paso que suele faltar', hacer: '', listo: '', porque: [], sinEv: 'Sin evidencia' },
          { corto: 'En disputa', marca: 'en disputa', disputa: 'A vs B', hacer: '', listo: '', porque: [], sinEv: 'Sin evidencia' },
          { corto: 'Sin evidencia', marca: 'sin evidencia', sinEv: 'Práctica habitual', hacer: '', listo: '', porque: [] }
        ]
      },
      // Protocolo para validar: un paso por regla.
      reglas: {
        titulo: 'Reglas', esp: 'Periodoncia', alcance: '',
        pasos: [
          { corto: 'Con fuente', sub: [{ fuentes: [fuente('Grado A')] }] },
          { corto: 'Sin nada' },
          { corto: 'Declarado sin evidencia', sinEv: 'Práctica habitual' },
          { corto: 'En disputa', disputa: 'A vs B', sub: [{ fuentes: [fuente('Grado C')] }] },
          { corto: 'Techo roto', sub: [{ fuentes: [fuente('Grado A', { cita: 'Revisión sistemática de estudios in vitro' })] }] },
          { corto: 'Techo respetado', sub: [{ fuentes: [fuente('Grado C', { cita: 'Revisión sistemática de estudios in vitro' })] }] },
          { corto: 'Localizador pendiente', sub: [{ fuentes: [fuente('Grado B', { loc: 'pendiente' })] }] },
          { corto: 'Población distinta sin declarar', sub: [{ fuentes: [fuente('Grado B', { cita: 'Estudio en población distinta' })] }] },
          { corto: 'Población distinta declarada', sub: [{ titulo: 'Ojo con esta evidencia', fuentes: [fuente('Grado B', { cita: 'Estudio en población distinta' })] }] }
        ]
      }
    }
  };
});

const { validar, chequeoCaso, esCritico } = await import('../src/logic.js');

/* ───────── validar ───────── */
describe('validar', () => {
  const r = validar('reglas');
  const fila = (corto) => r.filas.find((f) => f.corto === corto);

  it('cuenta cada paso una vez', () => {
    expect(r.total).toBe(9);
    expect(r.ok + r.revisar + r.falla).toBe(r.total);
  });
  it('paso con fuente pasa', () => expect(fila('Con fuente').estado).toBe('ok'));
  it('paso sin fuente ni marca de sin evidencia falla', () => expect(fila('Sin nada').estado).toBe('falla'));
  it('paso declarado sin evidencia pide revisar, no falla', () => expect(fila('Declarado sin evidencia').estado).toBe('revisar'));
  it('paso en disputa pide revisar', () => expect(fila('En disputa').estado).toBe('revisar'));
  it('regla del techo: revisión in vitro con grado A falla', () => {
    expect(fila('Techo roto').estado).toBe('falla');
    expect(fila('Techo roto').avisos.join(' ')).toMatch(/Techo de grado/);
  });
  it('regla del techo: revisión in vitro con grado C pasa', () => expect(fila('Techo respetado').estado).toBe('ok'));
  it('localizador pendiente pide revisar', () => expect(fila('Localizador pendiente').estado).toBe('revisar'));
  it('población distinta sin declarar falla', () => expect(fila('Población distinta sin declarar').estado).toBe('falla'));
  it('población distinta declarada pasa', () => expect(fila('Población distinta declarada').estado).toBe('ok'));
  it('con fallas, el veredicto dice que no es publicable', () => expect(r.veredicto).toMatch(/^No publicable/));
  it('protocolo inexistente no revienta', () => expect(validar('no-existe').total).toBe(0));
});

/* ───────── chequeoCaso ───────── */
const hechos = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, { estado: 'hecho', nota: '' }]));
const casoBase = (cambios = {}) => ({
  titulo: 'Caso de prueba', dientes: '3.6', especialidad: 'Rehabilitación oral',
  diagnostico: 'Diagnóstico de prueba suficientemente largo', procedimiento: 'Procedimiento de prueba suficientemente largo',
  consentimiento: true, protocoloId: 'prueba', pasos: hechos(6),
  fotos: [{ tipo: 'Inicial' }], ...cambios
});
const conPaso = (i, estado, nota = '') => casoBase({ pasos: { ...hechos(6), [i]: { estado, nota } } });
const textos = (r) => r.items.map((x) => x.txt).join('\n');

describe('chequeoCaso: bloqueos de envío', () => {
  it('caso completo se puede enviar y aprobar', () => {
    const r = chequeoCaso(casoBase());
    expect(r.puedeEnviar).toBe(true);
    expect(r.puedeAprobar).toBe(true);
  });
  it.each([
    ['título', { titulo: '' }],
    ['diente', { dientes: '9.9' }],
    ['diagnóstico', { diagnostico: 'corto' }],
    ['procedimiento', { procedimiento: '' }],
    ['consentimiento', { consentimiento: false }]
  ])('falta %s → no se puede enviar', (_, cambio) => {
    expect(chequeoCaso(casoBase(cambio)).puedeEnviar).toBe(false);
  });
  it('paso sin marcar bloquea', () => {
    const pasos = hechos(6); delete pasos[0];
    const r = chequeoCaso(casoBase({ pasos }));
    expect(r.puedeEnviar).toBe(false);
    expect(textos(r)).toMatch(/Paso 01.*sin marcar/);
  });
  it.each(['modificado', 'omitido'])('paso %s sin justificar bloquea', (estado) => {
    expect(chequeoCaso(conPaso(0, estado, 'corta')).puedeEnviar).toBe(false);
  });
  it('"no aplica" en paso no condicional sin explicar bloquea', () => {
    expect(chequeoCaso(conPaso(0, 'noaplica')).puedeEnviar).toBe(false);
  });
  it('"no aplica" en paso no condicional con explicación se puede enviar', () => {
    expect(chequeoCaso(conPaso(0, 'noaplica', 'Explicación suficiente')).puedeEnviar).toBe(true);
  });
  it('"no aplica" en paso condicional no pide explicación', () => {
    expect(chequeoCaso(conPaso(1, 'noaplica')).puedeEnviar).toBe(true);
  });
  it('caso sin protocolo sin evidencia declarada bloquea', () => {
    expect(chequeoCaso(casoBase({ protocoloId: '', evidencia: '' })).puedeEnviar).toBe(false);
  });
  it('caso sin protocolo con evidencia declarada se envía, pero pide revisar', () => {
    const r = chequeoCaso(casoBase({ protocoloId: '', evidencia: 'Guía clínica de prueba, sección 3, año 2020' }));
    expect(r.puedeEnviar).toBe(true);
    expect(r.revisar.length).toBeGreaterThan(0);
  });
});

describe('chequeoCaso: bloqueo de aprobación', () => {
  it.each([[2, 'crítico'], [3, 'suele faltar']])('omitir el paso %i (%s) con justificación: se envía pero no se aprueba', (i) => {
    const r = chequeoCaso(conPaso(i, 'omitido', 'Justificación suficiente'));
    expect(r.puedeEnviar).toBe(true);
    expect(r.puedeAprobar).toBe(false);
  });
  it('modificar un paso crítico con justificación no bloquea la aprobación', () => {
    expect(chequeoCaso(conPaso(2, 'modificado', 'Justificación suficiente')).puedeAprobar).toBe(true);
  });
  it('esCritico reconoce las dos marcas', () => {
    expect(esCritico({ marca: 'Paso crítico' })).toBe(true);
    expect(esCritico({ marca: 'paso critico' })).toBe(true);
    expect(esCritico({ marca: 'Suele faltar' })).toBe(true);
    expect(esCritico({ marca: 'en disputa' })).toBe(false);
    expect(esCritico({})).toBe(false);
  });
});

describe('chequeoCaso: solo avisos', () => {
  it('desvío justificado avisa sin bloquear', () => {
    const r = chequeoCaso(conPaso(0, 'modificado', 'Justificación suficiente'));
    expect(r.puedeEnviar && r.puedeAprobar).toBe(true);
    expect(textos(r)).toMatch(/desvío justificado/);
  });
  it('desvío en paso en disputa avisa como tal', () => {
    expect(textos(chequeoCaso(conPaso(4, 'modificado', 'Justificación suficiente')))).toMatch(/paso en disputa/);
  });
  it('desvío en paso sin evidencia avisa como tal', () => {
    expect(textos(chequeoCaso(conPaso(5, 'omitido', 'Justificación suficiente')))).toMatch(/paso sin evidencia/);
  });
  it('seguir un paso en disputa deja una nota informativa', () => {
    expect(chequeoCaso(casoBase()).info.length).toBe(1);
  });
  it('sin fotos avisa sin bloquear', () => {
    const r = chequeoCaso(casoBase({ fotos: [] }));
    expect(r.puedeEnviar && r.puedeAprobar).toBe(true);
    expect(textos(r)).toMatch(/Sin registro fotográfico/);
  });
  it.each(['Endodoncia', 'Cirugía bucal'])('%s sin radiografía avisa', (especialidad) => {
    expect(textos(chequeoCaso(casoBase({ especialidad })))).toMatch(/Sin radiografía/);
  });
  it('endodoncia con radiografía no avisa', () => {
    const r = chequeoCaso(casoBase({ especialidad: 'Endodoncia', fotos: [{ tipo: 'Radiografía' }] }));
    expect(textos(r)).not.toMatch(/Sin radiografía/);
  });
});
