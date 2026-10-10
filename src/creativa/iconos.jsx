// Íconos propios de la barra lateral (dibujados para Criterium, trazo redondeado de 2 px en una grilla de 24).
// Cada uno tiene su forma (`d`) y, si corresponde, un detalle (`det`): activo, la forma se rellena y el detalle
// queda calado en blanco; los íconos abiertos (sin forma que rellenar) solo engruesan el trazo.
import React from 'react';

const I = {
  inicio: { d: 'M3.5 10.2 12 3.5l8.5 6.7V19a2 2 0 0 1-2 2h-4v-5.2a2.5 2.5 0 0 0-5 0V21h-4a2 2 0 0 1-2-2z' },
  protocolos: { d: 'M6.5 4.5h11a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2z', det: 'M9.5 3v3h5V3M8.5 13.5l2.4 2.4 4.6-4.8' },
  materia: { d: 'M2.5 9.2 12 4.8l9.5 4.4L12 13.6z', det: '', extra: 'M6.5 11.3v4.4c0 1.7 2.5 3.3 5.5 3.3s5.5-1.6 5.5-3.3v-4.4M21.5 9.2v5.3' },
  herramientas: { d: 'M7 3.5h10a2.5 2.5 0 0 1 2.5 2.5v12a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 18V6A2.5 2.5 0 0 1 7 3.5z', det: 'M8 7.5h8M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01' },
  investigaciones: { d: 'M9.5 3.5h5M10.5 3.5v5.7L5 18.3A1.8 1.8 0 0 0 6.6 21h10.8a1.8 1.8 0 0 0 1.6-2.7l-5.5-9.1V3.5', relleno: 'M7.3 15h9.4l2.3 3.3a1.8 1.8 0 0 1-1.6 2.7H6.6A1.8 1.8 0 0 1 5 18.3z' },
  chat: { d: 'M12 3.5c4.9 0 8.5 3.4 8.5 7.8s-3.6 7.8-8.5 7.8c-1.1 0-2.2-.2-3.2-.5L4 20.2l1.3-3.9A7.4 7.4 0 0 1 3.5 11.3c0-4.4 3.6-7.8 8.5-7.8z', det: 'M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01' },
  subir: { d: 'M7 3.5h10A3.5 3.5 0 0 1 20.5 7v10a3.5 3.5 0 0 1-3.5 3.5H7A3.5 3.5 0 0 1 3.5 17V7A3.5 3.5 0 0 1 7 3.5z', det: 'M12 8v8M8 12h8' },
  hoy: { d: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z', extra: 'M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4' },
  agenda: { d: 'M6 5h12a2.5 2.5 0 0 1 2.5 2.5V18a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V7.5A2.5 2.5 0 0 1 6 5z', det: 'M3.5 10h17M8 13.5h3M8 16.5h6', extra: 'M8 3v4M16 3v4' },
  pacientes: { d: 'M9 4a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6z', extra: 'M16 4.3a3.3 3.3 0 0 1 0 6.4M18 14.4c2.1.7 3.5 2.7 3.5 5.6' },
  seguimiento: { d: 'M12 3.5a6 6 0 0 1 6 6v3.7l1.6 3a.8.8 0 0 1-.7 1.3H5.1a.8.8 0 0 1-.7-1.3l1.6-3V9.5a6 6 0 0 1 6-6z', extra: 'M9.8 20.5a2.4 2.4 0 0 0 4.4 0' },
  caja: { d: 'M5.5 6.5h13a2.5 2.5 0 0 1 2.5 2.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18V9a2.5 2.5 0 0 1 2.5-2.5z', det: 'M16 13.5h2.2', extra: 'M6 6.5V5.8A2.3 2.3 0 0 1 8.3 3.5h7.4A2.3 2.3 0 0 1 18 5.8v.7' },
  gestion: { d: 'M12 3 20 7.5v9L12 21l-8-4.5v-9z', det: 'M4 7.5l8 4.5 8-4.5M12 12v9' },
  ajustes: { abierto: true, extra: 'M4 7h9.5M18.5 7H20M4 17h3.5M12.5 17H20M16 4.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4zM10 14.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4z' },
  clinica: { d: 'M7.3 3.5C5 3.5 3.6 5.4 3.6 7.8c0 2.2.9 3.7 1.6 5.4.6 1.6.8 3.4 1.2 5.3.3 1.3.9 2 1.6 2 .9 0 1.3-1 1.5-2.4.3-1.6.8-3.2 2.5-3.2s2.2 1.6 2.5 3.2c.2 1.4.6 2.4 1.5 2.4.7 0 1.3-.7 1.6-2 .4-1.9.6-3.7 1.2-5.3.7-1.7 1.6-3.2 1.6-5.4 0-2.4-1.4-4.3-3.7-4.3-1.8 0-2.7 1.1-4.7 1.1s-2.9-1.1-4.7-1.1z' },
  laboratorio: { d: 'M8.5 3.5h7M9.5 3.5v6.2l-4.6 7.8A2 2 0 0 0 6.6 20.5h10.8a2 2 0 0 0 1.7-3l-4.6-7.8V3.5', det: 'M8 15.5h8' },
  esterilizacion: { d: 'M12 3 19.5 6v5.6c0 4.4-3.1 8-7.5 9.4-4.4-1.4-7.5-5-7.5-9.4V6z', det: 'm8.8 12 2.3 2.3 4.2-4.6' },
  tareas: { abierto: true, extra: 'M10 6.5h10M10 12h10M10 17.5h10M4 6.5l1.2 1.2L7.4 5.4M4 12l1.2 1.2 2.2-2.3M4.5 17.5h2' },
  informes: { d: 'M5.5 3.5h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2z', det: 'M8 16.5v-3M12 16.5v-8M16 16.5v-5' },
  accesos: { d: 'M7.5 10.5h9a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-6.5a2 2 0 0 1 2-2z', det: 'M12 14.5v2.5', extra: 'M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5' },
  buscar: { abierto: true, extra: 'M10.8 4a6.8 6.8 0 1 1 0 13.6 6.8 6.8 0 0 1 0-13.6zM16 16l4.5 4.5' },
  volver: { abierto: true, extra: 'M10 7 5 12l5 5M5.5 12H15a4.5 4.5 0 0 1 0 9h-1.5' },
  mas: { abierto: true, extra: 'M4 6.5h16M4 12h16M4 17.5h10' },
  areas: { abierto: true, extra: 'M5 8.5h12.5M14.5 5.5l3 3-3 3M19 15.5H6.5M9.5 12.5l-3 3 3 3' }
};

export function IconoRail({ n, on, s = 26, fondo = 'var(--card)' }) {
  const ic = I[n] || I.inicio;
  const sw = on && ic.abierto ? 2.6 : 2;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none">
      {ic.relleno && on && <path d={ic.relleno} fill="currentColor" stroke="none" />}
      {ic.d && <path d={ic.d} fill={on && !ic.relleno ? 'currentColor' : 'none'} />}
      {ic.det && <path d={ic.det} stroke={on ? fondo : 'currentColor'} />}
      {ic.extra && <path d={ic.extra} strokeWidth={on ? 2.4 : 2} />}
    </svg>
  );
}
