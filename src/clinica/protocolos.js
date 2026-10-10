// Protocolos de Criterium dentro de la Clínica: los que esta cuenta puede ver (PROTOS y DATOS ya cargados según el modo
// piloto; el grupo de comparación no recibe ninguno). Se calculan al dibujar, nunca al cargar el módulo.
import * as fuente from '../data.js';

export const protocolosClinica = () => (fuente.PROTOS || []).filter((p) => fuente.DATOS && fuente.DATOS[p.id] && Array.isArray(fuente.DATOS[p.id].pasos));
export const datosProtocolo = (id) => (fuente.DATOS || {})[id] || null;
// Versión y huella del texto publicado (META llega de Firestore; con los protocolos locales puede no existir)
export const metaProtocolo = (id) => ((fuente.META || {})[id]) || {};
