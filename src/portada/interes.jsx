// «Agenda una demo» (clínicas) y «Únete a la lista de espera» (estudiantes y docentes) desde la portada pública.
// Se guarda en interesados/ (firestore.rules: cualquiera crea, con campos y largos fijos; solo el equipo lee).
// Firebase se carga recién al enviar, así la portada abre sin él.
import React, { useEffect, useRef, useState } from 'react';
import { Boton, Campo, Icono, cx } from './base.jsx';

export const WHATSAPP = 'https://wa.me/56998215701';
const CORREO_OK = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

const TIPOS = {
  demo: {
    titulo: 'Agenda una demo',
    bajada: 'Te mostramos Criterium Clínica por videollamada, con la clínica de ejemplo. Te escribimos para coordinar el día.',
    boton: 'Pedir la demo',
    roles: ['Administración', 'Dueño o dueña', 'Odontólogo u odontóloga', 'Otro']
  },
  lista: {
    titulo: 'Únete a la lista de espera',
    bajada: 'Te avisamos cuando abramos Criterium Universidad para tu curso o tu escuela.',
    boton: 'Unirme a la lista',
    roles: ['Estudiante', 'Docente', 'Odontólogo u odontóloga']
  }
};
const VACIO = { nombre: '', correo: '', telefono: '', clinica: '', rol: '', sillones: '', institucion: '', mensaje: '', web: '' };

async function guardarInteresado(tipo, f) {
  const [{ db }, { addDoc, collection, serverTimestamp }] = await Promise.all([import('../firebase.js'), import('firebase/firestore')]);
  const doc = { tipo, nombre: f.nombre.trim(), correo: f.correo.trim().toLowerCase(), rol: f.rol, origen: 'portada', fecha: serverTimestamp() };
  if (f.telefono.trim()) doc.telefono = f.telefono.trim();
  if (tipo === 'demo') { doc.clinica = f.clinica.trim(); if (f.sillones) doc.sillones = f.sillones; }
  if (tipo === 'lista' && f.institucion.trim()) doc.institucion = f.institucion.trim();
  if (f.mensaje.trim()) doc.mensaje = f.mensaje.trim();
  await addDoc(collection(db, 'interesados'), doc);
}

// tipo: 'demo' | 'lista' | null (cerrado). privacidad(): abre Privacidad y términos.
export function FormularioInteres({ tipo, cerrar, privacidad }) {
  const ref = useRef(null);
  const [f, setF] = useState(VACIO);
  const [acepta, setAcepta] = useState(false);
  const [intento, setIntento] = useState(false);
  const [estado, setEstado] = useState('editando'); // 'editando' | 'enviando' | 'listo' | 'error'
  const t = TIPOS[tipo] || TIPOS.demo;

  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (tipo && !d.open) { setF(VACIO); setAcepta(false); setIntento(false); setEstado('editando'); d.showModal(); }
    if (!tipo && d.open) d.close();
  }, [tipo]);

  const cambia = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const errores = {
    nombre: f.nombre.trim().length < 2 ? 'Escribe tu nombre.' : null,
    correo: !CORREO_OK.test(f.correo.trim()) ? 'Revisa el correo: falta algo.' : null,
    rol: !f.rol ? 'Elige una opción.' : null,
    clinica: tipo === 'demo' && f.clinica.trim().length < 2 ? 'Escribe el nombre de la clínica.' : null,
    acepta: !acepta ? 'Necesitamos tu permiso para guardar estos datos.' : null
  };
  const err = (k) => (intento ? errores[k] || undefined : undefined);

  async function enviar(e) {
    e.preventDefault();
    setIntento(true);
    if (Object.values(errores).some(Boolean)) return;
    if (f.web) { setEstado('listo'); return; } // campo trampa: solo lo llenan los robots
    setEstado('enviando');
    try { await guardarInteresado(tipo, f); setEstado('listo'); } catch (er) { console.error('Criterium · interesados:', er); setEstado('error'); }
  }

  return (
    <dialog ref={ref} onClose={cerrar} aria-labelledby="interes-titulo"
      className="s-raiz m-auto w-[min(560px,calc(100%-24px))] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-marco border border-s-borde p-0 shadow-s-3 backdrop:bg-[rgba(11,31,39,.45)] backdrop:backdrop-blur-[2px]">
      <div className="flex items-start gap-4 border-b border-s-borde-suave px-6 py-5">
        <div className="min-w-0 flex-1">
          <h2 id="interes-titulo" className="m-0 text-s-h3 font-semibold">{estado === 'listo' ? 'Listo, recibimos tus datos' : t.titulo}</h2>
          {estado !== 'listo' && <p className="m-0 mt-1 text-s-chico text-s-texto-2">{t.bajada}</p>}
        </div>
        <button type="button" onClick={() => ref.current?.close()} aria-label="Cerrar" className="-mr-2 -mt-1 grid h-10 w-10 flex-none place-items-center rounded-campo text-s-texto-2 hover:bg-s-hundido"><Icono n="cerrar" /></button>
      </div>

      {estado === 'listo' ? (
        <div className="px-6 py-6">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-s-ok-fondo text-s-ok"><Icono n="check" /></span>
          <p className="m-0 mt-4 text-s-cuerpo text-s-texto-2">Gracias, {f.nombre.trim().split(' ')[0] || 'de verdad'}. Te escribimos a <b className="font-semibold text-s-texto">{f.correo.trim()}</b>{tipo === 'demo' ? ' para coordinar la demo.' : ' cuando abramos.'}</p>
          <Boton className="mt-6" variante="secundario" onClick={() => ref.current?.close()}>Cerrar</Boton>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="grid gap-4 px-6 py-6 sm:grid-cols-2">
          <Campo id="i-nombre" etiqueta="Nombre" autoComplete="name" value={f.nombre} onChange={cambia('nombre')} error={err('nombre')} maxLength={100} />
          <Campo id="i-correo" etiqueta="Correo" type="email" autoComplete="email" inputMode="email" value={f.correo} onChange={cambia('correo')} error={err('correo')} maxLength={200} />
          {tipo === 'demo' && <Campo id="i-clinica" etiqueta="Clínica" autoComplete="organization" value={f.clinica} onChange={cambia('clinica')} error={err('clinica')} maxLength={150} />}
          <Campo id="i-rol" etiqueta={tipo === 'demo' ? 'Tu rol' : 'Eres'} como="select" value={f.rol} onChange={cambia('rol')} error={err('rol')}>
            <option value="" disabled>Elige</option>{t.roles.map((r) => <option key={r}>{r}</option>)}
          </Campo>
          {tipo === 'demo' && (
            <Campo id="i-sillones" etiqueta="Sillones" opcional como="select" value={f.sillones} onChange={cambia('sillones')}>
              <option value="">Elige</option><option>1 a 2</option><option>3 a 5</option><option>6 o más</option>
            </Campo>
          )}
          {tipo === 'lista' && <Campo id="i-inst" etiqueta="Dónde estudias o trabajas" opcional value={f.institucion} onChange={cambia('institucion')} maxLength={150} />}
          <Campo id="i-tel" etiqueta="Teléfono" opcional type="tel" autoComplete="tel" inputMode="tel" value={f.telefono} onChange={cambia('telefono')} maxLength={30} />
          {tipo === 'demo' && <Campo id="i-msg" etiqueta="¿Qué te gustaría ver?" opcional como="textarea" value={f.mensaje} onChange={cambia('mensaje')} maxLength={1000} className="sm:col-span-2" />}
          {/* Campo trampa para robots: no se ve ni se anuncia */}
          <input type="text" name="web" tabIndex={-1} autoComplete="off" value={f.web} onChange={cambia('web')} aria-hidden="true" className="absolute left-[-9999px] h-px w-px opacity-0" />

          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-start gap-3 text-s-chico text-s-texto-2">
              <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} aria-invalid={err('acepta') ? 'true' : undefined} aria-describedby={err('acepta') ? 'i-acepta-error' : undefined} className="mt-0.5 h-5 w-5 flex-none" />
              <span>Acepto que Criterium guarde estos datos solo para contactarme. <button type="button" onClick={privacidad} className="font-semibold text-s-enlace underline underline-offset-2">Privacidad y términos</button></span>
            </label>
            {err('acepta') && <p id="i-acepta-error" role="alert" className="m-0 mt-1.5 text-s-chico font-medium text-s-error">{err('acepta')}</p>}
          </div>

          {estado === 'error' && (
            <p role="alert" className="m-0 rounded-campo bg-s-error-fondo px-4 py-3 text-s-chico text-s-error sm:col-span-2">
              No pudimos enviar tus datos. Prueba de nuevo o escríbenos por <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="font-semibold underline">WhatsApp</a>.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Boton type="submit" tam="lg" disabled={estado === 'enviando'} className={cx(estado === 'enviando' && 'opacity-70')}>{estado === 'enviando' ? 'Enviando…' : t.boton}</Boton>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="text-s-chico font-semibold text-s-enlace">o escríbenos por WhatsApp</a>
          </div>
        </form>
      )}
    </dialog>
  );
}
