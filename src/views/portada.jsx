// Portada pública: lo que ve alguien que todavía no tiene cuenta. Pocas palabras, un paso real de muestra
// (con su animación, cuándo terminaste y su porqué) y los protocolos disponibles.
import React, { useState } from 'react';
import { PROTOS, DATOS } from '../data.js';
import { Ic, Logo, Pill, cx } from '../ui.jsx';
import { Animacion } from './protocolos.jsx';

// El paso de muestra: «Abre y remueve la caries» de la resina clase I
const MUESTRA = { proto: 'resina-clase-i', paso: 2 };
const PUNTOS = [
  ['check', 'Qué hacer y cuándo terminaste', 'Cada paso es una acción que se puede comprobar.'],
  ['book', 'La evidencia de cada paso', 'Con su grado. Lo que no tiene respaldo se dice.'],
  ['personas', 'Revisado por expertos', 'Se publica con al menos 5 especialistas.']
];

export function Portada({ entrar, privacidad }) {
  const [porque, setPorque] = useState(false);
  const d = DATOS[MUESTRA.proto]; const s = d.pasos[MUESTRA.paso];
  const grado = ((s.sub || []).flatMap((x) => x.fuentes || [])[0] || {}).grado;
  const pre = 'Terminaste cuando';
  const protos = PROTOS.filter((p) => p.abre && DATOS[p.id]);
  return (
    <div className="fondo min-h-screen">
      <header className="sticky top-0 z-20 border-b border-cardline bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex max-w-[1080px] items-center gap-3 px-4 py-3 sm:px-6">
          <Logo size={26} />
          <button type="button" onClick={() => entrar('login')} className="ml-auto whitespace-nowrap rounded-full px-2.5 py-2 text-[14px] font-semibold text-ink2 hover:text-ink sm:px-3.5">Entrar</button>
          <button type="button" onClick={() => entrar('registro')} className="whitespace-nowrap rounded-full bg-acento px-4 py-2 text-[14px] font-semibold text-onc hover:bg-acentodeep">Crear cuenta</button>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1080px] flex-col gap-20 px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <section className="flex flex-col items-center text-center">
          <p className="rotulo m-0 mb-4">Biblioteca viva de protocolos</p>
          <h1 className="m-0 max-w-[16ch] text-[40px] font-bold leading-[1.04] tracking-[-.035em] text-deep [text-wrap:balance] sm:text-[60px]">Cada paso, con su porqué.</h1>
          <p className="m-0 mt-5 max-w-[46ch] text-[17px] leading-relaxed text-ink2 sm:text-[19px]">Protocolos clínicos de Odontología con la evidencia a la vista, revisados por expertos.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => entrar('registro')} className="h-12 rounded-full bg-acento px-7 text-[16px] font-semibold text-onc hover:bg-acentodeep">Crear cuenta gratis</button>
            <a href="#muestra" className="inline-flex h-12 items-center rounded-full bg-card px-7 text-[16px] font-semibold text-acentodeep shadow-sh hover:bg-soft">Ver un paso</a>
          </div>
        </section>

        <section id="muestra" className="scroll-mt-24">
          <p className="m-0 mb-3 text-center text-[13px] font-semibold text-ink3">Un paso real · {d.titulo}</p>
          <div className="mx-auto grid max-w-[920px] items-center gap-5 overflow-hidden rounded-[28px] bg-card p-4 shadow-shlg sm:p-6 md:grid-cols-[1.05fr_1fr]">
            <Animacion id={s.anim} />
            <div className="flex flex-col gap-3 px-1 sm:px-2">
              <p className="m-0 text-[12.5px] font-semibold uppercase tracking-[.12em] text-rotulo">Paso {MUESTRA.paso + 1} de {d.pasos.length}</p>
              <h2 className="m-0 text-[22px] font-bold leading-snug tracking-[-.02em] text-deep sm:text-[26px]">{s.hacer}</h2>
              <p className="m-0 text-[15px] leading-relaxed text-ink2">{(s.listo || '').startsWith(pre) ? <><b className="font-semibold text-acento">{pre}</b>{s.listo.slice(pre.length)}</> : s.listo}</p>
              {grado && <Pill tono="acento" className="self-start">{grado}</Pill>}
              <button type="button" onClick={() => setPorque(!porque)} aria-expanded={porque} className="inline-flex items-center gap-1.5 self-start rounded-full bg-soft px-4 py-2 text-[14px] font-semibold text-acentodeep hover:bg-acentosoft">
                ¿Por qué?<svg className={cx('transition-transform duration-300', porque && 'rotate-180')} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {porque && <p className="aparece m-0 text-[14.5px] leading-relaxed text-ink2">{(s.porque || [])[0]}</p>}
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {PUNTOS.map(([ic, t, x]) => (
            <div key={t} className="rounded-[22px] bg-card p-6 shadow-sh">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-acentosoft text-acento"><Ic n={ic} s={19} /></span>
              <h3 className="m-0 mt-4 text-[16.5px] font-bold text-deep">{t}</h3>
              <p className="m-0 mt-1 text-[14px] leading-snug text-ink3">{x}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto w-full max-w-[720px]">
          <h2 className="m-0 mb-4 text-center text-[22px] font-bold tracking-[-.02em] text-deep sm:text-[26px]">Protocolos disponibles</h2>
          <ul className="m-0 list-none overflow-hidden rounded-[22px] bg-card p-0 shadow-sh">
            {protos.map((p, k) => (
              <li key={p.id} className={cx('flex items-center gap-3 px-5 py-3.5', k > 0 && 'border-t border-line2')}>
                <span className="min-w-0 flex-1"><b className="block text-[15px] leading-snug text-ink">{p.t}</b><span className="block text-[12.5px] text-ink3">{p.esp}</span></span>
                <Pill tono="warn">Borrador</Pill>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col items-center rounded-[28px] bg-deep px-6 py-12 text-center">
          <h2 className="m-0 text-[26px] font-bold tracking-[-.02em] text-onc sm:text-[32px]">Estudia con criterio.</h2>
          <p className="m-0 mt-2 max-w-[40ch] text-[15px] text-panelink2">Gratis para estudiantes y docentes. Te toma un minuto.</p>
          <button type="button" onClick={() => entrar('registro')} className="mt-6 h-12 rounded-full bg-menta px-7 text-[16px] font-semibold text-mentaink">Crear cuenta</button>
        </section>
      </main>

      <footer className="border-t border-cardline">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-6 text-[12.5px] text-ink3 sm:px-6">
          <button type="button" onClick={privacidad} className="font-semibold hover:text-ink">Privacidad y términos</button>
          <a href="https://wa.me/56998215701" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-ink">Contacto</a>
          <span className="sm:ml-auto">Borradores sin revisión de especialista. No reemplazan la indicación de tu docente.</span>
        </div>
      </footer>
    </div>
  );
}
