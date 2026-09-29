import React, { useState, useEffect } from 'react';
import { leerDatosLocales, migrarDatosLocales, limpiarDatosLocales } from '../db.js';
import { Btn, Ic } from '../ui.jsx';

/**
 * Componente que detecta datos locales en IndexedDB y ofrece migrarlos
 * a la cuenta Firebase del usuario. Se muestra una sola vez al registrarse
 * o iniciar sesión por primera vez.
 */
export default function Migracion({ uid, onTerminar }) {
  const [estado, setEstado] = useState('revisando'); // 'revisando' | 'pregunta' | 'migrando' | 'listo' | 'nada'
  const [datosLocales, setDatosLocales] = useState(null);
  const [progreso, setProgreso] = useState({ paso: 0, total: 0, texto: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    leerDatosLocales().then((datos) => {
      if (datos.hayDatos) {
        setDatosLocales(datos);
        setEstado('pregunta');
      } else {
        setEstado('nada');
        onTerminar();
      }
    }).catch(() => {
      setEstado('nada');
      onTerminar();
    });
  }, []);

  const migrar = async () => {
    setEstado('migrando');
    setError('');
    try {
      await migrarDatosLocales(uid, datosLocales, setProgreso);
      await limpiarDatosLocales();
      setEstado('listo');
    } catch (e) {
      setError('Hubo un problema subiendo los datos: ' + (e.message || 'error desconocido') + '. Los datos locales no se borraron, puedes intentar de nuevo.');
      setEstado('pregunta');
    }
  };

  const saltar = async () => {
    await limpiarDatosLocales();
    setEstado('nada');
    onTerminar();
  };

  if (estado === 'revisando') {
    return (
      <Overlay>
        <div className="h-8 w-48 animate-pulse rounded-rs bg-soft" />
        <p className="text-[13px] text-ink3">Revisando datos locales…</p>
      </Overlay>
    );
  }

  if (estado === 'nada') return null;

  if (estado === 'pregunta') {
    const nCasos = datosLocales.casos.length;
    const nFotos = datosLocales.casos.reduce((n, c) => n + (c.fotos || []).length, 0);
    return (
      <Overlay>
        <div className="grid h-14 w-14 place-items-center rounded-full bg-acentosoft text-acento">
          <Ic n="folder" s={24} />
        </div>
        <h2 className="m-0 text-[20px] font-bold text-deep">Datos guardados en este navegador</h2>
        <p className="m-0 max-w-[42ch] text-center text-[14.5px] leading-relaxed text-ink2">
          Encontramos <b>{nCasos} caso{nCasos !== 1 ? 's' : ''}</b>{nFotos > 0 ? <> con <b>{nFotos} foto{nFotos !== 1 ? 's' : ''}</b></> : ''} guardado{nCasos !== 1 ? 's' : ''} en este navegador.
          ¿Quieres subirlos a tu cuenta?
        </p>

        {error && <div className="rounded-rs bg-badsoft px-4 py-3 text-[13px] font-semibold text-bad">{error}</div>}

        <div className="flex flex-wrap justify-center gap-3">
          <Btn v="primary" onClick={migrar}>Sí, subir mis datos</Btn>
          <Btn onClick={saltar}>No, empezar de cero</Btn>
        </div>

        <p className="m-0 text-[11.5px] text-ink3">
          Si empiezas de cero, los datos locales se borran.
        </p>
      </Overlay>
    );
  }

  if (estado === 'migrando') {
    const pct = progreso.total > 0 ? Math.round((progreso.paso / progreso.total) * 100) : 0;
    return (
      <Overlay>
        <h2 className="m-0 text-[18px] font-bold text-deep">Subiendo datos…</h2>
        <div className="w-full max-w-xs">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-soft">
            <div className="h-full rounded-full bg-acento transition-all duration-300" style={{ width: pct + '%' }} />
          </div>
          <p className="mt-2 text-center text-[12.5px] text-ink3">{progreso.texto || 'Preparando…'}</p>
        </div>
      </Overlay>
    );
  }

  if (estado === 'listo') {
    return (
      <Overlay>
        <div className="grid h-14 w-14 place-items-center rounded-full bg-oksoft text-ok">
          <Ic n="check" s={24} />
        </div>
        <h2 className="m-0 text-[20px] font-bold text-deep">¡Listo!</h2>
        <p className="m-0 text-center text-[14.5px] leading-relaxed text-ink2">
          Todos tus datos están en tu cuenta. Ahora puedes acceder desde cualquier dispositivo.
        </p>
        <Btn v="primary" onClick={onTerminar}>Continuar</Btn>
      </Overlay>
    );
  }

  return null;
}

function Overlay({ children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg px-6">
      <div className="flex max-w-md flex-col items-center gap-5 rounded-r border border-line bg-card p-8 shadow-shlg text-center">
        {children}
      </div>
    </div>
  );
}
