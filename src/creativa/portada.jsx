// Portada pública de Criterium Red: lo que ve quien todavía no tiene cuenta.
// Sin personas ni casos inventados: muestra el camino de un caso y lo que se puede hacer.
import React from 'react';
import { Ic, cx } from '../ui.jsx';
import { MarcaRed } from './marca.jsx';

const PUNTOS = [
  ['folder', 'Sube tus casos', 'Diagnóstico, plan y resultado, ordenados. Fotos, radiografías y videos muy pronto.'],
  ['stamp', 'Revisados y corregidos', 'Un docente puntúa el caso y corrige cada sección antes de publicarlo.'],
  ['personas', 'Discute planes de tratamiento', 'Propón los planes que consideras. La comunidad vota y explica por qué.']
];
const CAMINO = [['folder', 'Subes el caso'], ['stamp', 'Lo revisa un docente'], ['edit', 'Lo corriges'], ['check', 'Se publica']];

export function PortadaRed({ entrar, privacidad }) {
  return (
    <div className="fondo min-h-screen">
      <header className="sticky top-0 z-20 border-b border-cardline bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex max-w-[1080px] items-center gap-1.5 px-4 py-3 sm:gap-3 sm:px-6">
          <MarcaRed size={24} />
          <button type="button" onClick={() => entrar('login')} className="ml-auto whitespace-nowrap rounded-full px-2 py-2 text-[14px] font-semibold text-ink2 hover:text-ink sm:px-3.5">Entrar</button>
          <button type="button" onClick={() => entrar('registro')} className="whitespace-nowrap rounded-full bg-acento px-3.5 py-2 text-[14px] font-semibold text-onc hover:bg-acentodeep sm:px-4">Crear cuenta</button>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1080px] flex-col gap-20 px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <section className="flex flex-col items-center text-center">
          <p className="rotulo m-0 mb-4">La red de la Odontología</p>
          <h1 className="m-0 max-w-[15ch] text-[40px] font-bold leading-[1.04] tracking-[-.035em] text-deep [text-wrap:balance] sm:text-[60px]">Casos reales, revisados por docentes.</h1>
          <p className="m-0 mt-5 max-w-[46ch] text-[17px] leading-relaxed text-ink2 sm:text-[19px]">Sube tus casos, recibe correcciones, discute planes de tratamiento y sigue a quienes te enseñan.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => entrar('registro')} className="h-12 rounded-full bg-acento px-7 text-[16px] font-semibold text-onc hover:bg-acentodeep">Crear cuenta gratis</button>
            <a href="#camino" className="inline-flex h-12 items-center rounded-full bg-card px-7 text-[16px] font-semibold text-acentodeep shadow-sh hover:bg-soft">Cómo funciona</a>
          </div>
        </section>

        <section id="camino" className="scroll-mt-24">
          <div className="mx-auto max-w-[920px] rounded-[28px] bg-deep px-5 py-10 sm:px-10">
            <p className="m-0 text-center text-[12.5px] font-semibold uppercase tracking-[.14em] text-menta">El camino de un caso</p>
            <ol className="m-0 mt-8 grid list-none grid-cols-2 gap-x-3 gap-y-8 p-0 sm:grid-cols-4">
              {CAMINO.map(([ic, t], k) => (
                <li key={t} className="relative flex flex-col items-center gap-3 text-center">
                  {k < CAMINO.length - 1 && <span className="absolute left-[calc(50%+34px)] top-7 hidden h-[2px] w-[calc(100%-68px)] bg-[color-mix(in_srgb,var(--menta)_35%,transparent)] sm:block" aria-hidden="true" />}
                  <span className={cx('grid h-14 w-14 place-items-center rounded-full', k === CAMINO.length - 1 ? 'bg-menta text-mentaink' : 'bg-[color-mix(in_srgb,var(--card)_10%,transparent)] text-menta')}><Ic n={ic} s={22} /></span>
                  <span className="text-[12px] font-semibold text-panelink2">0{k + 1}</span>
                  <b className="-mt-2 text-[15px] leading-snug text-onc">{t}</b>
                </li>
              ))}
            </ol>
            <p className="m-0 mx-auto mt-8 max-w-[52ch] text-center text-[14px] leading-relaxed text-panelink2">Cada corrección va ligada a la sección que corrige. Lo que se publica dice quién lo revisó.</p>
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

        <section className="flex flex-col items-center rounded-[28px] bg-card px-6 py-12 text-center shadow-sh">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-acentosoft text-acento"><Ic n="userCheck" s={22} /></span>
          <h2 className="m-0 mt-4 text-[24px] font-bold tracking-[-.02em] text-deep sm:text-[28px]">Tu perfil profesional</h2>
          <p className="m-0 mt-2 max-w-[44ch] text-[15px] leading-relaxed text-ink2">Dónde estudias o trabajas, tu año y tus áreas. Tu inicio se arma según lo que te interesa.</p>
          <button type="button" onClick={() => entrar('registro')} className="mt-6 h-12 rounded-full bg-acento px-7 text-[16px] font-semibold text-onc hover:bg-acentodeep">Crear cuenta</button>
        </section>
      </main>

      <footer className="border-t border-cardline">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-6 text-[12.5px] text-ink3 sm:px-6">
          <button type="button" onClick={privacidad} className="font-semibold hover:text-ink">Privacidad y términos</button>
          <a href="https://wa.me/56998215701" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-ink">Contacto</a>
          <span className="sm:ml-auto">Nunca datos de pacientes. Lo publicado no reemplaza la indicación de tu docente.</span>
        </div>
      </footer>
    </div>
  );
}
