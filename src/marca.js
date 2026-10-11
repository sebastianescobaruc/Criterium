// El logo de Criterium: «El punto de criterio» (propuesta A, elegida el 2026-10-11). Una C gruesa que se abre hacia un punto menta:
// la C es el recorrido de la atención y el punto, el criterio con que cierra cada paso. Grilla de 64; la marca ocupa de 13 a 51.
// Archivos finales (con el nombre en trazos, Inter Bold) en marca/. La pantalla de carga (index.html) repite esta geometría a mano.
export const MARCA_C = 'M41.32 20.89A14.5 14.5 0 1 0 41.32 43.11';
export const MARCA_TRAZO = 9;
export const MARCA_PUNTO = { cx: 46.5, cy: 32, r: 4.6 };
export const MARCA_CAJA = '11 11 42 42'; // viewBox ajustado a la marca, con 2 de aire
export const MARCA_COLOR = {
  claro: { c: '#0B1F27', punto: '#3DBFAE' }, // sobre fondo claro
  oscuro: { c: '#FFFFFF', punto: '#5CCFC0' }, // sobre fondo oscuro o en la ficha
  ficha: '#0B1F27'
};

// SVG como texto, para dibujarlo en un canvas o meterlo en otra página. `ficha`: sobre el cuadro redondeado (como el ícono de la app).
export function svgMarca({ tono = 'claro', ficha = false } = {}) {
  const col = MARCA_COLOR[ficha ? 'oscuro' : tono];
  const p = MARCA_PUNTO;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ficha ? '0 0 64 64' : MARCA_CAJA}">`
    + (ficha ? `<rect width="64" height="64" rx="14" fill="${MARCA_COLOR.ficha}"/>` : '')
    + `<path d="${MARCA_C}" fill="none" stroke="${col.c}" stroke-width="${MARCA_TRAZO}"/>`
    + `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${col.punto}"/></svg>`;
}
