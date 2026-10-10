// Privacidad y términos de uso. Se ve sin cuenta (desde la portada y el registro) y dentro de la app.
// Texto simple, en las palabras de un estudiante. Pendiente de revisión legal (Ley 21.719).
import React from 'react';
import { Ic } from '../ui.jsx';
import { CREATIVA } from '../edicion.js';

const SECCIONES = [
  ['Qué guardamos', [
    'Tu cuenta: nombre y correo. El correo no se muestra a nadie.',
    'Tu perfil profesional: etapa, institución, año, intereses y presentación. Lo ven las personas con cuenta.',
    'Lo que publicas, comentas y respondes, siempre con tu nombre.',
    CREATIVA ? 'Los casos clínicos que subes y sus revisiones, sin datos que identifiquen al paciente.' : 'Si eres docente, los casos clínicos que registras, sin datos que identifiquen al paciente.',
    CREATIVA ? 'En tu navegador, comodidades como lo que guardaste para después. No salen de tu equipo.' : 'En tu navegador, comodidades como la voz elegida o los pasos que marcaste. No salen de tu equipo.'
  ]],
  ['Qué nunca guardamos', [
    'Datos que identifiquen a un paciente: nombre, RUT, teléfono, correo, ficha ni fotos con su cara. La app bloquea los textos que los traen.',
    'Tu contraseña: la maneja el sistema de cuentas de Google Firebase, nadie del equipo la ve.',
    'El audio de la voz de los protocolos: el reconocimiento lo hace tu navegador (Chrome con Google, Safari con Apple). Criterium no graba ni guarda audio.'
  ]],
  ['Quién ve qué', [
    'Tu perfil y tus publicaciones: las personas con cuenta en Criterium.',
    CREATIVA ? 'Un caso en revisión: tú y quienes lo revisan (docentes y el equipo Criterium), hasta que se publique.' : 'Un caso, borrador o protocolo en revisión: tú y el equipo Criterium, hasta que se apruebe.',
    'Tus mensajes de contacto: solo el equipo Criterium.'
  ]],
  ['Dónde se guarda', [
    'En Google Firebase (servidores de Google). Usamos lo mínimo para que la app funcione.',
    ...(CREATIVA ? ['Los videos de «Caso en 60 segundos» se ven desde YouTube o Vimeo, que tienen sus propias reglas de privacidad. Usamos la versión de YouTube que no guarda cookies hasta que das «play».'] : [])
  ]],
  ['Tus derechos', [
    'Puedes ver, corregir y borrar tus datos, y oponerte a su uso (Ley 21.719).',
    'Para borrar tu cuenta y todo lo que publicaste: «Borrar mi cuenta», al final de tu perfil. O escríbenos.'
  ]],
  ['Términos de uso', [
    CREATIVA ? 'Criterium es una red para aprender y discutir casos. Lo que se publica no reemplaza el juicio clínico ni la indicación de tu docente.' : 'Criterium es una herramienta de estudio. Los protocolos son borradores hasta que los revisan al menos 5 expertos, y nunca reemplazan la indicación de tu docente.',
    'Lo que publicas va con tu nombre y es tu responsabilidad.',
    'Respeto siempre y nunca datos de pacientes. El equipo puede quitar contenido y cerrar cuentas que no cumplan.'
  ]]
];

export function Privacidad({ volver }) {
  return (
    <article className="mx-auto flex max-w-[680px] flex-col gap-6 pb-10">
      {volver && <button type="button" onClick={volver} className="inline-flex items-center gap-1.5 self-start rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] text-ink2 hover:bg-soft"><Ic n="back" s={14} />Volver</button>}
      <header>
        <p className="rotulo m-0 mb-2">Privacidad y términos</p>
        <h1 className="m-0 text-[30px] font-bold leading-[1.1] tracking-[-.025em] text-deep sm:text-[36px]">Tus datos, en simple.</h1>
        <p className="m-0 mt-3 text-[16px] leading-relaxed text-ink2">Guardamos lo mínimo para que Criterium funcione, nunca datos de pacientes, y puedes borrar todo cuando quieras.</p>
      </header>
      {SECCIONES.map(([t, l]) => (
        <section key={t} className="rounded-[22px] bg-card p-5 shadow-sh sm:p-6">
          <h2 className="m-0 mb-3 text-[17px] font-bold text-deep">{t}</h2>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {l.map((x) => <li key={x} className="flex gap-2.5 text-[14.5px] leading-relaxed text-ink2"><span className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-acento" />{x}</li>)}
          </ul>
        </section>
      ))}
      <p className="m-0 text-[12.5px] leading-normal text-ink3">Versión 0.1 · 6 de octubre de 2026 · pendiente de revisión legal. Dudas: WhatsApp +56 9 9821 5701.</p>
    </article>
  );
}
