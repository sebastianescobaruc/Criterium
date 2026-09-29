// La pantalla del periodontograma se dibuja sin errores, vacía y con datos.
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Periodontograma } from '../src/views/periodontograma.jsx';

const html = (chart) => renderToString(<Periodontograma chart={chart} setChart={() => {}} onUsar={() => {}} />);

describe('Periodontograma (pantalla)', () => {
  it('vacío: muestra los 16 dientes superiores y ningún NIC', () => {
    const h = html({});
    expect(h).toContain('1.8');
    expect(h).toContain('2.8');
    expect(h).not.toContain('>4.8<');
    expect(h).toContain('Palatino');
  });
  it('con datos: calcula el NIC en la tabla y el resumen', () => {
    const h = html({ '1.6': { s: { vd: { ps: '3', mg: '-2', sg: true } } } });
    expect(h).toContain('>5<');
    expect(h).toContain('5 mm');
    expect(h).toContain('1.6');
  });
});
