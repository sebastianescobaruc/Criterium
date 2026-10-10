// Los protocolos ya no van dentro del código de la app: se bajan de Firestore (protocolos/) según lo que cada
// persona puede ver (modo piloto: el grupo habitual no ve ninguno hasta la apertura; el grupo criterium, los 5 del estudio).
// Al compilar, vite.config.js cambia `data.js` por este archivo: PROTOS y DATOS empiezan vacíos y se llenan en el mismo
// objeto al llegar de Firestore, así todo el código que los importa sigue igual.
// META guarda por protocolo { version, fecha, sha256, estudio }.
export const PROTOS = [];
export const DATOS = {};
export const META = {};

const oyentes = new Set();
let vuelta = 0;
export const suscribirProtocolos = (f) => { oyentes.add(f); return () => oyentes.delete(f); };
export const vueltaProtocolos = () => vuelta;

// docs: [{ id, catalogo (JSON), json (JSON de DATOS[id]), version, fecha, sha256, estudio, orden }]
export function cargarProtocolos(docs) {
  PROTOS.length = 0;
  for (const k of Object.keys(DATOS)) delete DATOS[k];
  for (const k of Object.keys(META)) delete META[k];
  [...docs].sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99)).forEach((d) => {
    try {
      PROTOS.push(JSON.parse(d.catalogo));
      DATOS[d.id] = JSON.parse(d.json);
      META[d.id] = { version: d.version || '', fecha: d.fecha || '', sha256: d.sha256 || '', estudio: !!d.estudio };
    } catch (e) { console.warn('Protocolo ilegible:', d.id); }
  });
  vuelta += 1;
  oyentes.forEach((f) => f(vuelta));
}
