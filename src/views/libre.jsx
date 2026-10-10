// Manos libres: el protocolo a pantalla completa, con el lenguaje de Apple.
// Fondo claro y quieto, una sola idea por pantalla (qué hacer y cuándo terminaste), los controles en los bordes
// y lo demás (por qué, fuentes, voz) a un toque, en hojas que suben desde abajo.
// El estado vive en Guiado (guiado.jsx); esto solo dibuja.
import React, { useEffect, useRef, useState } from 'react';
import { nn } from '../logic.js';
import { useApp } from '../ctx.js';
import { registrarUso } from '../piloto.js';
import { Ic, cx } from '../ui.jsx';
import { fichaDe, Sub, Escuchar, FlujoPublicacion, Huella } from './protocolos.jsx';
import { ComentariosPaso, useNComentarios } from './comentarios.jsx';
import { Animacion } from './animaciones.jsx';
import { vozDisponible, lecturaDisponible } from '../voz.js';

const reducido = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
const AUTO_PORQUE = 5; // s: el «¿Por qué?» se abre solo, como en el modo guiado

export function PantallaLibre({ d, cur, visto, hechos, ir, siguiente, anterior, listo, dir, salir, voz, AjustesVoz, onPdf, bajando, reiniciar, onRegistrar, onVerTodo, pq, onTouchStart, onTouchEnd, prep, onTocar, onSinMicro }) {
  const N = d.pasos.length;
  const [hoja, setHoja] = useState(null); // 'fuentes' | 'voz' | null
  const cuerpo = useRef(null);
  const s = cur >= 0 && cur < N ? d.pasos[cur] : null;

  // Cada paso parte arriba
  useEffect(() => { if (cuerpo.current) cuerpo.current.scrollTop = 0; setHoja(null); }, [cur]);
  // Esc cierra primero la hoja abierta (si no, Guiado sale de manos libres)
  useEffect(() => {
    if (!hoja) return;
    const f = (e) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); setHoja(null); } };
    window.addEventListener('keydown', f, true); return () => window.removeEventListener('keydown', f, true);
  }, [hoja]);

  const boton = cur === -1 ? 'Empezar' : cur === N - 1 ? 'Terminar' : 'Terminé';
  const pista = vozDisponible() && voz.leer && voz.estado !== 'apagado' ? 'Di «siguiente», «por qué» o «salir» · nunca datos del paciente' : vozDisponible() ? 'Toca el micrófono para guiar con la voz' : 'Desliza para cambiar de paso';

  return (
    <div className="libre fixed inset-0 z-[60] flex flex-col bg-bg text-ink">
      {/* Arriba: cerrar, avance por pasos y voz */}
      <header className="flex-none px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] sm:px-8">
        <div className="mx-auto flex max-w-[920px] items-center gap-3">
          <button type="button" onClick={salir} aria-label="Salir de manos libres" title="Salir (Esc)"
            className="grid h-9 w-9 flex-none place-items-center rounded-full bg-soft text-ink2 transition-colors hover:bg-acentosoft"><Ic n="x" s={17} sw={2.2} /></button>
          <Segmentos d={d} cur={cur} visto={visto} hechos={hechos} ir={ir} />
          {(lecturaDisponible() || vozDisponible()) && <BotonVoz voz={voz} />}
          {lecturaDisponible() && (
            <button type="button" onClick={() => setHoja(hoja === 'voz' ? null : 'voz')} aria-label="Ajustes de voz" title="Voz, velocidad y órdenes"
              className="grid h-9 w-9 flex-none place-items-center rounded-full bg-soft text-ink2 transition-colors hover:bg-acentosoft"><Ic n="dots" s={18} /></button>
          )}
        </div>
        <p className="mx-auto mt-2.5 max-w-[920px] truncate text-center text-[12.5px] font-medium text-ink3">{d.titulo}</p>
        <Capsula voz={voz} abrir={() => setHoja('voz')} />
      </header>

      {/* Centro: una sola idea por pantalla */}
      <main ref={cuerpo} className="min-h-0 flex-1 touch-pan-y overflow-y-auto" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="mx-auto flex min-h-full max-w-[820px] flex-col justify-center px-6 py-8 sm:px-10">
          <div key={cur} className={reducido() ? '' : dir > 0 ? 'entra-der' : 'entra-izq'}>
            {cur === -1 && <BandejaLibre d={d} onPdf={onPdf} bajando={bajando} />}
            {s && <PasoLibre s={s} i={cur} N={N} pq={pq} fuentes={() => setHoja('fuentes')} comentar={() => setHoja('comentarios')} leyendo={voz.leer && voz.hablando} />}
            {cur === N && <CierreLibre d={d} hechos={hechos} ir={ir} reiniciar={reiniciar} onRegistrar={onRegistrar} onVerTodo={onVerTodo} />}
          </div>
        </div>
      </main>

      {/* Abajo: atrás y la acción principal, al alcance del pulgar */}
      <footer className="relative flex-none px-4 before:pointer-events-none before:absolute before:inset-x-0 before:-top-8 before:h-8 before:bg-[linear-gradient(to_top,var(--bg),transparent)] before:content-[''] pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-2 sm:px-8">
        <div className="mx-auto flex max-w-[620px] items-center gap-3">
          <button type="button" onClick={() => anterior()} disabled={cur === -1} aria-label="Paso anterior"
            className="grid h-14 w-14 flex-none place-items-center rounded-full bg-soft text-ink2 transition-colors hover:bg-acentosoft disabled:opacity-30"><Ic n="back" s={22} sw={2} /></button>
          {cur < N ? (
            <button type="button" onClick={() => siguiente()}
              className={cx('inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-full text-[17px] font-semibold transition-[background-color,transform] active:scale-[.98]',
                listo ? 'confirma bg-menta text-mentaink' : 'bg-acento text-onc hover:bg-acentodeep')}>
              {listo ? <><Ic n="check" s={19} sw={2.6} />Hecho</> : boton}
            </button>
          ) : (
            <button type="button" onClick={salir} className="inline-flex h-14 flex-1 items-center justify-center rounded-full bg-acento text-[17px] font-semibold text-onc hover:bg-acentodeep">Listo</button>
          )}
        </div>
        <p className="m-0 mt-2.5 text-center text-[11.5px] text-ink3">{pista}</p>
      </footer>

      {prep && <Preparando prep={prep} onTocar={onTocar} onSinMicro={onSinMicro} salir={salir} />}

      {hoja === 'fuentes' && s && (
        <Hoja titulo={'Paso ' + nn(cur) + ' · ' + (s.corto || 'Fuentes')} cerrar={() => setHoja(null)}>
          <Fichas s={s} />
        </Hoja>
      )}
      {hoja === 'comentarios' && s && (
        <Hoja titulo={'Paso ' + nn(cur) + ' · comentarios'} cerrar={() => setHoja(null)}>
          <ComentariosPaso i={cur} s={s} />
        </Hoja>
      )}
      {hoja === 'voz' && (
        <Hoja titulo="Voz" cerrar={() => setHoja(null)}>
          <HojaVoz voz={voz} AjustesVoz={AjustesVoz} />
        </Hoja>
      )}
    </div>
  );
}

// Avance como segmentos (uno por paso): hecho en verde azulado, el actual oscuro, los demás tenues.
// Tocar uno ya visto salta a ese paso.
function Segmentos({ d, cur, visto, hechos, ir }) {
  const N = d.pasos.length;
  return (
    <nav aria-label="Avance del protocolo" className="flex min-w-0 flex-1 items-center gap-[3px] sm:gap-1">
      {d.pasos.map((p, k) => {
        const hecho = hechos.includes(k);
        const alcanzable = k <= visto || hecho;
        return (
          <button key={k} type="button" onClick={() => alcanzable && ir(k)} disabled={!alcanzable} aria-current={k === cur ? 'step' : undefined}
            aria-label={'Paso ' + nn(k) + (alcanzable ? ' · ' + p.corto : '') + (hecho ? ' (hecho)' : '')} title={alcanzable ? 'Paso ' + nn(k) + ' · ' + p.corto : undefined}
            className="group flex-1 py-3 disabled:cursor-default">
            <span className={cx('block h-[5px] rounded-full transition-colors duration-500',
              k === cur ? 'bg-deep' : hecho || cur === N ? 'bg-acento' : k < cur ? 'bg-acento opacity-40' : 'bg-cardline', alcanzable && k !== cur && 'group-hover:opacity-70')} />
          </button>
        );
      })}
    </nav>
  );
}

// Botón de voz: apagado (gris), escuchando (late), leyendo (barras)
function BotonVoz({ voz }) {
  const { leer, hablando, estado, alternar } = voz;
  const escucha = leer && !hablando && estado === 'escuchando';
  return (
    <button type="button" onClick={alternar} aria-pressed={leer}
      aria-label={leer ? 'Apagar la voz' : 'Encender la voz: lee cada paso y escucha tus órdenes'}
      title={leer ? 'Apagar la voz' : 'Leer cada paso y escuchar órdenes'}
      className={cx('relative isolate grid h-9 w-9 flex-none place-items-center rounded-full transition-colors', leer ? 'bg-deep text-menta' : 'bg-soft text-ink2 hover:bg-acentosoft', escucha && 'onda')}>
      {leer && hablando ? <span className="barras inline-flex h-4 items-end justify-center gap-[2px]"><i /><i /><i /></span>
        : <Ic n={vozDisponible() ? 'mic' : 'volumen'} s={17} />}
    </button>
  );
}

// Bajo la barra, el orbe de la voz y una línea de texto: qué oyó y qué hizo, sin tapar el paso
const NOMBRE = { siguiente: 'Siguiente paso', anterior: 'Paso anterior', leer: 'Leyendo el paso', porque: 'Leyendo el porqué', callar: 'Silencio', salir: 'Salir' };
export function Orbe({ size = 40, e = 'escucha', className = '' }) {
  return <span aria-hidden="true" className={cx('orbe block', className)} data-e={e} style={{ width: size, height: size, '--s': size + 'px' }}><i /><i /><i /></span>;
}
function Capsula({ voz, abrir }) {
  const { leer, hablando, estado, oido, orden, encender } = voz;
  const [, refrescar] = useState(0);
  const [oye, setOye] = useState(false);
  // La orden reciente se muestra 2,5 s: un temporizador vuelve a dibujar para ocultarla
  useEffect(() => { if (!orden) return; const t = setTimeout(() => refrescar((n) => n + 1), 2600); return () => clearTimeout(t); }, [orden]);
  // Cada vez que oye algo, el orbe crece un instante
  useEffect(() => { if (!oido) return; setOye(true); const t = setTimeout(() => setOye(false), 650); return () => clearTimeout(t); }, [oido]);
  if (!leer) return null;
  const reciente = orden && Date.now() - orden.t < 2500;
  let txt, accion = abrir, e = 'escucha';
  if (!vozDisponible() || estado === 'apagado') { txt = hablando ? 'Leyendo…' : 'Lectura encendida'; e = hablando ? 'habla' : 'escucha'; } // solo lectura, sin micrófono
  else if (estado === 'denegado') { txt = 'El micrófono no tiene permiso'; e = 'apagado'; }
  else if (estado === 'sin-micro') { txt = 'No hay micrófono'; e = 'apagado'; }
  else if (estado === 'error') { txt = 'Sin conexión de voz · toca para reintentar'; accion = encender; e = 'apagado'; }
  else if (estado === 'pausado') { txt = 'En pausa · toca para seguir'; accion = encender; e = 'apagado'; }
  else if (estado === 'iniciando') { txt = 'Encendiendo el micrófono…'; e = 'espera'; }
  else if (reciente) { txt = <><Ic n="check" s={14} sw={2.6} className="text-acento" />{NOMBRE[orden.o]}</>; e = 'oye'; }
  else if (hablando) { txt = 'Leyendo · puedes hablar'; e = oye ? 'oye' : 'habla'; }
  else if (oye && oido) { txt = <span className="truncate">«{oido}»</span>; e = 'oye'; }
  else txt = 'Escuchando';
  return (
    <div className="pointer-events-none mt-1.5 flex justify-center" aria-live="polite">
      <button type="button" onClick={accion} className="aparece pointer-events-auto inline-flex max-w-[86vw] items-center gap-2.5 rounded-full py-1 pl-1 pr-3 text-[13.5px] font-medium text-ink2">
        <Orbe size={34} e={e} />
        <span className="inline-flex min-w-0 items-center gap-1.5">{txt}</span>
      </button>
    </div>
  );
}

// Antes de empezar con la voz: el permiso del micrófono va primero, después la pantalla completa.
// Velo claro y difuso con el orbe al centro, como el modo voz de un asistente.
function Preparando({ prep, onTocar, onSinMicro, salir }) {
  const T = {
    permiso: ['Permite el micrófono', 'Tu navegador te va a preguntar si Criterium puede usar el micrófono. Cuando respondas, la pantalla se pone completa y empieza la voz.'],
    tocar: ['Todo listo', 'Toca para pasar a pantalla completa y empezar con la voz.'],
    denied: ['Sin permiso para el micrófono', 'Igual te leo cada paso en voz alta y avanzas tocando «Terminé». Para dar órdenes con la voz, permite el micrófono en el candado de la barra de direcciones (en iPhone: Ajustes › Safari › Micrófono).'],
    'sin-micro': ['No encontré un micrófono', 'Conecta uno o revisa que otra app no lo esté usando. Mientras, te leo cada paso en voz alta.'],
    error: ['El micrófono no respondió', 'Puedes seguir solo con la lectura en voz alta.']
  }[prep] || ['', ''];
  const e = prep === 'permiso' ? 'espera' : prep === 'tocar' ? 'escucha' : 'apagado';
  return (
    <div className="velo absolute inset-0 z-[65] flex flex-col items-center justify-center bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] px-8 text-center backdrop-blur-2xl" role="dialog" aria-modal="true" aria-label={T[0]}>
      <button type="button" onClick={salir} aria-label="Salir de manos libres"
        className="absolute left-4 top-[calc(12px+env(safe-area-inset-top,0px))] grid h-9 w-9 place-items-center rounded-full bg-soft text-ink2 sm:left-8"><Ic n="x" s={17} sw={2.2} /></button>
      {prep === 'tocar' ? (
        <button type="button" onClick={onTocar} aria-label="Empezar" className="rounded-full transition-transform active:scale-95"><Orbe size={176} e={e} /></button>
      ) : <Orbe size={176} e={e} />}
      <h2 className="aparece m-0 mt-10 text-[24px] font-semibold tracking-[-.02em] text-deep sm:text-[28px]">{T[0]}</h2>
      <p className="aparece m-0 mt-3 max-w-[36ch] text-[15.5px] leading-[1.55] text-ink2" style={{ '--d': '80ms' }}>{T[1]}</p>
      <div className="aparece mt-8 flex flex-col items-center gap-3" style={{ '--d': '160ms' }}>
        {prep === 'tocar' && <button type="button" onClick={onTocar} className="h-14 min-w-[220px] rounded-full bg-acento px-8 text-[17px] font-semibold text-onc hover:bg-acentodeep">Empezar</button>}
        {prep !== 'tocar' && prep !== 'permiso' && <button type="button" onClick={onSinMicro} className="h-14 min-w-[220px] rounded-full bg-acento px-8 text-[17px] font-semibold text-onc hover:bg-acentodeep">Seguir sin micrófono</button>}
        {prep === 'permiso' && <button type="button" onClick={onSinMicro} className="text-[14px] font-semibold text-acento hover:underline">Seguir sin micrófono</button>}
      </div>
      <p className="m-0 mt-10 max-w-[40ch] text-[12px] leading-normal text-ink3">Solo escucha órdenes cortas. El navegador manda el audio a su servicio de reconocimiento: no digas nombres ni datos del paciente.</p>
    </div>
  );
}

function PasoLibre({ s, i, N, pq, fuentes, comentar, leyendo }) {
  const porque = s.porque || [];
  const nFichas = (s.sub || []).length;
  const nCom = useNComentarios(i);
  const [mas, setMas] = useState(false);
  const [auto, setAuto] = useState(porque.length > 0);
  const ref = useRef(null);
  const { protoId } = useApp();
  // Registro de uso (piloto): solo cuenta lo que abre la persona, no la apertura automática
  const usoNivel2 = () => { if (!mas) registrarUso('nivel_2_abierto', protoId); };
  useEffect(() => { if (pq) { usoNivel2(); setMas(true); } }, [pq]);
  // A los 5 s el porqué se abre solo y baja para leerlo; tocarlo antes detiene esto
  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => { setMas(true); setAuto(false); }, AUTO_PORQUE * 1000);
    return () => clearTimeout(t);
  }, [auto]);
  useEffect(() => {
    if (!mas || !ref.current) return;
    const t = setTimeout(() => { try { ref.current.scrollIntoView({ block: 'nearest', behavior: reducido() ? 'auto' : 'smooth' }); } catch (e) {} }, 380);
    return () => clearTimeout(t);
  }, [mas]);
  const pre = 'Terminaste cuando';
  const listo = s.listo || '';
  const critico = /crítico|suele faltar/i.test(s.marca || '');
  return (
    <section aria-label={'Paso ' + nn(i)}>
      <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold uppercase tracking-[.12em] text-rotulo">
        <span>Paso {i + 1} de {N}</span>
        {leyendo && <span className="barras inline-flex h-3 items-end gap-[3px]" aria-label="Leyendo en voz alta"><i /><i /><i /><i /></span>}
        {s.marca && s.marca !== '✓' && <span className={cx('rounded-full px-2.5 py-[3px] text-[11px] font-bold normal-case tracking-normal', critico ? 'bg-badsoft text-bad' : 'bg-warnsoft text-warn')}>{s.marca}</span>}
      </div>
      <h2 className="m-0 mt-3 text-[30px] font-bold leading-[1.13] tracking-[-.025em] text-deep [text-wrap:balance] sm:text-[42px] lg:text-[48px]">{s.hacer}</h2>
      {s.cond && <p className="m-0 mt-3 text-[15px] leading-normal text-ink3">{s.cond}</p>}
      <p className="m-0 mt-6 text-[18px] leading-[1.5] text-ink2 [text-wrap:pretty] sm:text-[21px]">
        {listo.startsWith(pre) ? <><span className="font-semibold text-acento">{pre}</span>{listo.slice(pre.length)}</> : listo}
      </p>
      {s.anim && <Animacion id={s.anim} className="mt-6 max-w-[560px]" />}
      {s.disputa && <p className="m-0 mt-4 text-[14px] leading-normal text-warn"><b>En disputa.</b> {s.disputa}</p>}
      {s.sinEv && <p className="m-0 mt-4 text-[13.5px] leading-normal text-ink3">Práctica habitual · {s.sinEv}</p>}

      <div className="mt-8 flex flex-wrap gap-2">
        {porque.length > 0 && (
          <button type="button" onClick={() => { setAuto(false); usoNivel2(); setMas(!mas); }} aria-expanded={mas}
            className={cx('relative inline-flex items-center gap-1.5 overflow-hidden rounded-full px-4 py-2.5 text-[14.5px] font-semibold transition-colors', mas ? 'bg-deep text-panelink' : 'bg-soft text-acentodeep hover:bg-acentosoft')}>
            {/* El relleno avanza mientras falta para que se abra solo */}
            {auto && !reducido() && <span aria-hidden="true" className="llenado absolute inset-y-0 left-0 bg-acentosoft" style={{ animationDuration: AUTO_PORQUE + 's' }} />}
            <span className="relative">¿Por qué?</span>
            <svg className={cx('relative transition-transform duration-300', mas && 'rotate-180')} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        )}
        <Escuchar s={s} onEmpezar={() => { setAuto(false); usoNivel2(); setMas(true); }} suave className="!px-4 !py-2.5 !text-[14.5px]" />
        {nFichas > 0 && (
          <button type="button" onClick={() => { registrarUso('nivel_3_abierto', protoId); fuentes(); }} className="inline-flex items-center gap-1.5 rounded-full bg-soft px-4 py-2.5 text-[14.5px] font-semibold text-acentodeep transition-colors hover:bg-acentosoft">
            <Ic n="book" s={15} />Fuentes y más
          </button>
        )}
        {nCom !== null && (
          <button type="button" onClick={comentar} className="inline-flex items-center gap-1.5 rounded-full bg-soft px-4 py-2.5 text-[14.5px] font-semibold text-acentodeep transition-colors hover:bg-acentosoft">
            <Ic n="chat" s={15} />{nCom ? 'Comentarios · ' + nCom : 'Comentar'}
          </button>
        )}
      </div>
      <div ref={ref} className={cx('despliega scroll-mb-6', mas && 'abierto')}>
        <div className="min-h-0">
          <div className="mt-4 rounded-[22px] bg-card px-5 py-4 shadow-sh sm:px-7 sm:py-6">
            {porque.map((t, k) => <p key={k} className={cx('m-0 text-[16px] leading-[1.6] text-ink2 sm:text-[17px]', k > 0 && 'mt-3', mas && 'aparece')} style={mas ? { '--d': k * 90 + 'ms' } : undefined}>{t}</p>)}
          </div>
        </div>
      </div>
    </section>
  );
}

// Antes de empezar: la bandeja como listas agrupadas; cada instrumento se marca al dejarlo en la bandeja
function BandejaLibre({ d, onPdf, bajando }) {
  const { protoId } = useApp();
  const [listos, setListos] = useState([]);
  const total = d.bandeja.reduce((n, b) => n + b.items.length, 0);
  const alternar = (k) => setListos((l) => (l.includes(k) ? l.filter((x) => x !== k) : [...l, k]));
  return (
    <section aria-label="Antes de empezar">
      <p className="m-0 text-[13px] font-semibold uppercase tracking-[.12em] text-rotulo">Antes de empezar</p>
      <h2 className="m-0 mt-3 text-[34px] font-bold leading-[1.1] tracking-[-.025em] text-deep sm:text-[46px]">Monta la bandeja.</h2>
      <p className="m-0 mt-4 max-w-[60ch] text-[16px] leading-[1.55] text-ink2 sm:text-[17px]">{d.alcance.charAt(0).toUpperCase() + d.alcance.slice(1)}</p>
      <div className="mt-7 flex items-baseline justify-between gap-3 px-1">
        <span className="text-[13px] font-semibold text-ink3">Toca cada instrumento cuando esté en la bandeja</span>
        <span className="flex-none text-[13px] font-semibold tabular-nums text-acento">{listos.length} de {total}</span>
      </div>
      <div className="mt-3 grid gap-5 sm:grid-cols-2">
        {d.bandeja.map((b, f) => (
          <div key={b.fase} className="min-w-0">
            <p className="m-0 mb-1.5 px-4 text-[12px] font-semibold uppercase tracking-[.08em] text-ink3">{b.fase}</p>
            <ul className="m-0 list-none overflow-hidden rounded-[18px] bg-card p-0 shadow-sh">
              {b.items.map((x, k) => {
                const id = f + '.' + k; const on = listos.includes(id);
                return (
                  <li key={x} className={cx(k > 0 && 'border-t border-line2')}>
                    <button type="button" onClick={() => alternar(id)} aria-pressed={on} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                      <span className={cx('grid h-[22px] w-[22px] flex-none place-items-center rounded-full border-[1.5px] transition-colors', on ? 'border-acento bg-acento text-onc' : 'border-cardline')}>{on && <Ic n="check" s={13} sw={3} />}</span>
                      <span className={cx('min-w-0 text-[15px] leading-snug transition-colors', on ? 'text-ink3' : 'text-ink')}>{x}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <p className="m-0 mt-6 px-1 text-[12.5px] leading-normal text-ink3">{d.bandera}</p>
      <Huella id={protoId} className="mt-2 px-1" />
      {d.flujo && <div className="mt-3"><FlujoPublicacion d={d} compacto /></div>}
      {onPdf && (
        <button type="button" onClick={onPdf} disabled={bajando} className="mt-3 inline-flex items-center gap-1.5 px-1 text-[14px] font-semibold text-acento hover:underline disabled:opacity-60">
          <Ic n="download" s={15} />{bajando ? 'Preparando…' : 'Descargar el PDF de box'}
        </button>
      )}
    </section>
  );
}

function CierreLibre({ d, hechos, ir, reiniciar, onRegistrar, onVerTodo }) {
  const N = d.pasos.length;
  const faltan = d.pasos.map((s, i) => ({ s, i })).filter(({ i }) => !hechos.includes(i));
  return (
    <section aria-label="Protocolo terminado" className="flex flex-col items-center text-center">
      <span className="confirma grid h-20 w-20 place-items-center rounded-full bg-acento text-onc shadow-shlg"><Ic n="check" s={38} sw={2.6} /></span>
      <h2 className="m-0 mt-6 text-[32px] font-bold leading-[1.1] tracking-[-.025em] text-deep sm:text-[42px]">Terminaste.</h2>
      <p className="m-0 mt-3 text-[17px] text-ink2">Marcaste {hechos.length} de {N} pasos.</p>
      {faltan.length > 0 && (
        <div className="mt-8 w-full max-w-[520px] text-left">
          <p className="m-0 mb-1.5 px-4 text-[12px] font-semibold uppercase tracking-[.08em] text-ink3">Quedaron sin marcar</p>
          <ul className="m-0 list-none overflow-hidden rounded-[18px] bg-card p-0 shadow-sh">
            {faltan.map(({ s, i }, k) => (
              <li key={i} className={cx(k > 0 && 'border-t border-line2')}>
                <button type="button" onClick={() => ir(i)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] text-ink hover:bg-soft">
                  <b className="w-6 flex-none tabular-nums text-rotulo">{nn(i)}</b><span className="min-w-0 flex-1">{s.corto}</span>
                  <span className="rotate-180 text-ink3"><Ic n="back" s={15} /></span>
                </button>
              </li>
            ))}
          </ul>
          {onRegistrar && <p className="m-0 mt-2 px-4 text-[12.5px] text-ink3">Si los omitiste o los cambiaste, anótalo con su motivo al registrar el caso.</p>}
        </div>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[15px] font-semibold text-acento">
        {onRegistrar && <button type="button" onClick={onRegistrar} className="hover:underline">Registrar un caso</button>}
        <button type="button" onClick={reiniciar} className="hover:underline">Empezar de nuevo</button>
        <button type="button" onClick={onVerTodo} className="hover:underline">Ver el protocolo completo</button>
      </div>
    </section>
  );
}

// Hoja que sube desde abajo (en escritorio, centrada). Se cierra tocando fuera, con «Listo» o con Esc.
function Hoja({ titulo, cerrar, children }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={titulo}>
      <button type="button" aria-label="Cerrar" onClick={cerrar} className="velo absolute inset-0 bg-[rgba(15,37,48,.28)] backdrop-blur-[2px]" />
      <div className="hoja relative flex max-h-[86vh] w-full max-w-[640px] flex-col rounded-t-[28px] bg-card shadow-shlg sm:rounded-[28px]">
        <div className="flex-none px-5 pb-2 pt-2.5 sm:pt-4">
          <span className="mx-auto mb-2 block h-[5px] w-9 rounded-full bg-cardline sm:hidden" aria-hidden="true" />
          <div className="flex items-center gap-3">
            <h3 className="m-0 min-w-0 flex-1 truncate text-[17px] font-semibold text-deep">{titulo}</h3>
            <button type="button" onClick={cerrar} className="flex-none rounded-full px-2 py-1 text-[16px] font-semibold text-acento">Listo</button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))]">{children}</div>
      </div>
    </div>
  );
}

// Nivel 3 del paso en la hoja: una ficha a la vez (fuentes, errores, disenso…)
function Fichas({ s }) {
  const fichas = (s.sub || []).map((x, k) => ({ k: 's' + k, t: fichaDe(x.titulo)[0], x }));
  const [k, setK] = useState(fichas[0] && fichas[0].k);
  const f = fichas.find((x) => x.k === k) || fichas[0];
  if (!f) return null;
  return (
    <div>
      {fichas.length > 1 && (
        <div className="scroll-x -mx-5 mb-4 flex gap-1.5 overflow-x-auto px-5 pb-1" role="tablist">
          {fichas.map((x) => (
            <button key={x.k} type="button" role="tab" aria-selected={x.k === f.k} onClick={() => setK(x.k)}
              className={cx('flex-none rounded-full px-3.5 py-1.5 text-[13.5px] font-semibold transition-colors', x.k === f.k ? 'bg-deep text-panelink' : 'bg-soft text-ink2 hover:bg-acentosoft')}>{x.t}</button>
          ))}
        </div>
      )}
      <Sub x={f.x} />
    </div>
  );
}

// Hoja de voz: el estado en palabras, las órdenes, la voz y la velocidad, y el aviso de privacidad
function HojaVoz({ voz, AjustesVoz }) {
  const { leer, estado, alternar, encender } = voz;
  const msg = !vozDisponible() ? 'Este navegador no reconoce la voz: cada paso se lee en voz alta y avanzas tocando «Terminé» o deslizando.'
    : estado === 'denegado' ? 'El navegador no dio permiso para usar el micrófono. Actívalo en el candado de la barra de direcciones (en iPhone: Ajustes › Safari › Micrófono) y vuelve a encender la voz.'
    : estado === 'sin-micro' ? 'No se encontró un micrófono. Conecta uno o revisa que otra app no lo esté usando.'
    : estado === 'error' ? 'No hay conexión con el servicio de reconocimiento de voz. Revisa internet.'
    : estado === 'pausado' ? 'La escucha se pausó.' : null;
  return (
    <div className="flex flex-col gap-5">
      <button type="button" onClick={alternar} aria-pressed={leer} className="flex items-center gap-3 rounded-[18px] bg-soft px-4 py-3.5 text-left">
        <span className="min-w-0 flex-1">
          <b className="block text-[15px] font-semibold text-ink">Guiar con la voz</b>
          <span className="block text-[13px] text-ink3">{vozDisponible() ? 'Lee cada paso y escucha tus órdenes' : 'Lee cada paso en voz alta'}</span>
        </span>
        <span className={cx('relative h-[31px] w-[51px] flex-none rounded-full transition-colors', leer ? 'bg-acento' : 'bg-cardline')} aria-hidden="true">
          <span className={cx('absolute top-[2px] h-[27px] w-[27px] rounded-full bg-card shadow-sh transition-[left]', leer ? 'left-[22px]' : 'left-[2px]')} />
        </span>
      </button>
      {msg && (
        <p className="m-0 rounded-[18px] bg-warnsoft px-4 py-3 text-[13.5px] leading-normal text-warn">
          {msg} {(estado === 'error' || estado === 'pausado') && <button type="button" onClick={encender} className="font-bold underline">Volver a escuchar</button>}
        </p>
      )}
      {vozDisponible() && (
        <div>
          <p className="m-0 mb-1.5 px-1 text-[12px] font-semibold uppercase tracking-[.08em] text-ink3">Órdenes</p>
          <ul className="m-0 list-none overflow-hidden rounded-[18px] bg-soft p-0 text-[14.5px]">
            {[['«Siguiente» · «listo» · «dale»', 'Avanza'], ['«Anterior» · «atrás»', 'Retrocede'], ['«Lee» · «repite»', 'Lee el paso'], ['«Por qué»', 'Abre y lee el porqué'], ['«Silencio»', 'Deja de leer'], ['«Salir»', 'Cierra manos libres']].map(([a, b], k) => (
              <li key={a} className={cx('flex items-center justify-between gap-3 px-4 py-2.5', k > 0 && 'border-t border-line')}><span className="font-semibold text-ink">{a}</span><span className="text-right text-ink3">{b}</span></li>
            ))}
          </ul>
          <p className="m-0 mt-2 px-1 text-[12.5px] text-ink3">Puedes hablar aunque esté leyendo.</p>
        </div>
      )}
      {lecturaDisponible() && <AjustesVoz plano />}
      <p className="m-0 px-1 text-[12px] leading-normal text-ink3">El navegador manda el audio a su servicio de reconocimiento (Google en Chrome, Apple en Safari). No digas nombres ni datos del paciente.</p>
    </div>
  );
}
