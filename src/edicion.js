// Edición de la app. 'creativa' = Criterium Red (Dirección creativa): perfiles, feed, casos con revisión y corrección,
// y discusiones de planes de tratamiento. Sin protocolos ni biblioteca: en esa edición data.js se reemplaza por
// creativa/sin-protocolos.js (vite.config.js), así el contenido clínico ni siquiera viaja en el código.
export const CREATIVA = import.meta.env.VITE_EDICION === 'creativa';
