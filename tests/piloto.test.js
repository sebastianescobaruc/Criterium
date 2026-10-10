import { describe, it, expect } from 'vitest';
import { indicadorPiloto, csvEventos } from '../src/piloto-datos.js';

const participantes = [
  { uid: 'u1', codigo: 'P-AAAAA1', grupo: 'criterium' },
  { uid: 'u2', codigo: 'P-BBBBB2', grupo: 'criterium' },
  { uid: 'u3', codigo: 'P-CCCCC3', grupo: 'habitual' }
];
const ev = (codigo, sesion, tipo, protoId = '') => ({ codigo, sesion, tipo, protoId, fecha: new Date('2027-06-10T12:00:00Z') });
const eventos = [
  ev('P-AAAAA1', 's1', 'sesion_inicio'), ev('P-AAAAA1', 's1', 'protocolo_abierto', 'resina-clase-i'),
  ev('P-AAAAA1', 's2', 'sesion_inicio'), ev('P-AAAAA1', 's2', 'protocolo_abierto', 'destartraje'),
  ev('P-AAAAA1', 's3', 'sesion_inicio'),
  ev('P-BBBBB2', 's4', 'sesion_inicio'),
  ev('P-BBBBB2', 's5', 'sesion_inicio'), ev('P-BBBBB2', 's5', 'nivel_2_abierto', 'resina-clase-i'),
  ev('P-CCCCC3', 's6', 'sesion_inicio')
];

describe('indicador del piloto (grupo criterium)', () => {
  it('cuenta sesiones con al menos 1 protocolo abierto, sin el grupo habitual', () => {
    const r = indicadorPiloto(eventos, participantes);
    expect(r.sesiones).toBe(5);
    expect(r.sesionesConProtocolo).toBe(2);
    expect(r.pctSesiones).toBe(40);
  });
  it('cuenta estudiantes que lo cumplen en la mayoría de sus sesiones', () => {
    const r = indicadorPiloto(eventos, participantes);
    expect(r.estudiantes).toBe(2);
    expect(r.estudiantesCumplen).toBe(1); // P-AAAAA1: 2 de 3; P-BBBBB2: 0 de 2
    expect(r.pctEstudiantes).toBe(50);
  });
  it('sin datos no inventa un porcentaje', () => {
    expect(indicadorPiloto([], participantes).pctSesiones).toBe(null);
  });
});

describe('CSV de eventos de uso', () => {
  it('trae código y grupo, nunca nombre, correo ni uid', () => {
    const conDatos = participantes.map((p) => ({ ...p, nombre: 'Ana Pérez', correo: 'ana@uc.cl' }));
    const csv = csvEventos(eventos, conDatos);
    expect(csv.split('\n')[0]).toBe('codigo,grupo,sesion,tipo,protocolo,fecha_hora');
    expect(csv).toContain('P-AAAAA1,criterium,s1,protocolo_abierto,resina-clase-i,2027-06-10T12:00:00.000Z');
    for (const prohibido of ['Ana', 'ana@uc.cl', 'u1', 'u2', 'u3']) expect(csv).not.toMatch(new RegExp('(^|,)' + prohibido + '(,|$)', 'm'));
    expect(csv).not.toContain('@');
  });
});
