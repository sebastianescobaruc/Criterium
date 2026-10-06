// Textos que se leen en voz alta en el modo guiado. Los usa la app y también scripts/voces.mjs,
// que genera con Google Cloud Text-to-Speech un audio por cada texto: si cambia una frase aquí,
// hay que volver a correr `npm run voces`.

export const TEXTO_BANDEJA = 'Antes de empezar, monta la bandeja. Di siguiente cuando esté lista.';
export const TEXTO_SIN_PORQUE = 'Este paso no trae explicación.';
export const TEXTO_PRUEBA = 'Paso uno. Confirma el material de la corona. Terminaste cuando lo tienes anotado en la ficha.';
export const textoPaso = (s, k) => 'Paso ' + (k + 1) + '. ' + s.hacer + ' ' + (s.listo || '');
export const textoPorque = (s) => (s.porque || [])[0] || TEXTO_SIN_PORQUE;
export const textoCierre = (hechos, total) => 'Protocolo terminado. Marcaste ' + hechos + ' de ' + total + ' pasos.';

// Todos los textos que puede leer un protocolo (para generar sus audios)
export function textosDe(d) {
  const N = d.pasos.length;
  return [
    TEXTO_BANDEJA, TEXTO_SIN_PORQUE,
    ...d.pasos.map(textoPaso),
    ...d.pasos.map(textoPorque),
    ...Array.from({ length: N + 1 }, (_, h) => textoCierre(h, N))
  ];
}

// Huella corta y síncrona de un texto (cyrb53): nombra el archivo de audio. Síncrona a propósito:
// así el audio parte dentro del mismo toque, que es lo que exige Safari para dejarlo sonar.
export function clave(texto) {
  const s = String(texto).normalize('NFC').trim();
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}
