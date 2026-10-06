// Modo guiado de un protocolo: se ve un paso a la vez y el recorrido se va desplegando.
// cur: -1 = bandeja (antes de empezar), 0..N-1 = pasos, N = cierre.
import React, { useEffect, useRef, useState } from 'react';
import { nn } from '../logic.js';
import { Ic, Btn, Aviso, Seg, cx } from '../ui.jsx';
import { Paso, Flecha } from './protocolos.jsx';
import { PantallaLibre, Orbe } from './libre.jsx';
import { TEXTO_BANDEJA, TEXTO_PRUEBA, textoPaso, textoPorque, textoCierre } from '../lectura.js';
import { useVoz, estadoMicrofono, pedirMicrofono, desbloquearAudio, vozDisponible, lecturaDisponible, useHablando, hablar, callar, useVoces, vozElegida, elegirVoz, velocidad, elegirVelocidad, VELOCIDADES } from '../voz.js';


const reducido = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

export function Guiado({ d, hechos, toggle, marcar, reiniciar, onVerTodo, onRegistrar, volver, libreInicial, onPdf, bajando }) {
  const N = d.pasos.length;
  const [cur, setCur] = useState(() => {
    if (!hechos.length) return -1;
    const f = d.pasos.findIndex((_, i) => !hechos.includes(i));
    return f === -1 ? N : f;
  });
  const [visto, setVisto] = useState(cur); // hasta dónde llegó: el mapa no adelanta pasos que no ha visto
  const [leer, setLeer] = useState(false); // modo voz: lee cada paso al llegar y escucha órdenes a la vez
  const [dir, setDir] = useState(1);        // 1 avanza (entra desde la derecha), -1 retrocede
  const [listo, setListo] = useState(false); // "Terminé" confirma con ✓ antes de avanzar
  const [orden, setOrden] = useState(null);
  const [ajustes, setAjustes] = useState(false); // panel para elegir la voz de lectura y la velocidad
  const [pq, setPq] = useState(0); // «por qué» por voz abre el desplegable del paso
  const [libre, setLibre] = useState(false); // manos libres: pantalla completa + voz + lectura
  const raiz = useRef(null);
  const hablando = useHablando();
  const leerAhora = useRef(false);          // una orden de voz pide leer aunque la lectura automática esté apagada
  const escenario = useRef(null);
  const primera = useRef(true);

  const leerPaso = (k) => {
    if (k === -1) hablar(TEXTO_BANDEJA);
    else if (k >= N) hablar(textoCierre(hechos.length, N));
    else hablar(textoPaso(d.pasos[k], k));
  };
  const ir = (k, porVoz) => {
    const n = Math.max(-1, Math.min(N, k));
    if (n === cur) return;
    setDir(n > cur ? 1 : -1);
    if (porVoz) leerAhora.current = true;
    setCur(n); setVisto((v) => Math.max(v, n)); setPq(0);
  };
  const siguiente = (porVoz) => {
    if (cur >= N || listo) return;
    if (cur >= 0 && !hechos.includes(cur)) marcar(cur);
    if (cur < 0 || reducido()) { ir(cur + 1, porVoz); return; }
    // Un instante de ✓ antes de pasar: se siente que el paso quedó hecho
    const desde = cur; setListo(true);
    setTimeout(() => { setListo(false); ir(desde + 1, porVoz); }, 280);
  };
  const anterior = (porVoz) => { if (cur > -1) ir(cur - 1, porVoz); };

  // Al llegar a un paso se lee solo, si la lectura está encendida (o si llegaste por voz)
  const montado = useRef(false);
  useEffect(() => {
    if (!montado.current) { montado.current = true; return; }
    if (leer || leerAhora.current) leerPaso(cur); else callar();
    leerAhora.current = false;
  }, [cur]);

  // Deslizar en el celular: izquierda avanza, derecha retrocede
  const toque = useRef(null);
  const onTouchStart = (e) => { const t = e.touches[0]; toque.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e) => {
    const a = toque.current; toque.current = null; if (!a) return;
    const t = e.changedTouches[0]; const dx = t.clientX - a.x, dy = t.clientY - a.y;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) { if (dx < 0) siguiente(); else anterior(); }
  };

  // Al cambiar de paso, el escenario sube a la vista
  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    const el = escenario.current; if (!el) return;
    const behavior = reducido() ? 'auto' : 'smooth';
    const caja = libre && raiz.current;
    if (caja) caja.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top - caja.getBoundingClientRect().top + caja.scrollTop - 16), behavior });
    else window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 84), behavior });
  }, [cur]);

  // Teclado: → avanza, ← retrocede (no mientras se escribe)
  const teclas = useRef(); teclas.current = { siguiente, anterior };
  useEffect(() => {
    const f = (e) => {
      const t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); teclas.current.siguiente(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); teclas.current.anterior(); }
    };
    window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f);
  }, []);

  // Voz
  const { estado, oido, encender, apagar } = useVoz((o, texto) => {
    setOrden({ o, texto, t: Date.now() });
    if (o === 'siguiente') siguiente(true);
    else if (o === 'anterior') anterior(true);
    else if (o === 'leer') leerPaso(cur);
    else if (o === 'porque') setPq((n) => n + 1), hablar(cur >= 0 && cur < N ? textoPorque(d.pasos[cur]) : '');
    else if (o === 'callar') callar();
    else if (o === 'salir' && libre) salirLibre();
  });
  useEffect(() => () => callar(), []);
  // Modo voz: un solo botón lee y escucha a la vez. Todo se enciende dentro del toque:
  // Safari no abre el micrófono ni deja sonar el audio fuera de un gesto.
  const encenderVoz = () => { setLeer(true); if (vozDisponible()) encender(); leerPaso(cur); };
  const apagarVoz = () => { setLeer(false); apagar(); callar(); };
  const alternarModoVoz = () => { if (leer) apagarVoz(); else encenderVoz(); };

  // Manos libres: la app se esconde, el paso ocupa la pantalla, se escucha la voz, se lee cada paso
  // y la pantalla no se apaga. En iPhone no hay pantalla completa real: queda la capa fija que tapa todo.
  const bloqueo = useRef(null);
  const pedirBloqueo = async () => { try { if (navigator.wakeLock) bloqueo.current = await navigator.wakeLock.request('screen'); } catch (e) {} };
  // Orden al entrar: primero el permiso del micrófono, después la pantalla completa y recién ahí la voz.
  // Si se pide la pantalla completa a la vez que el permiso, el aviso del navegador queda escondido detrás.
  // prep: null | 'permiso' (esperando el aviso) | 'tocar' (falta un toque para la pantalla completa) | 'denied' | 'sin-micro' | 'error'
  const [prep, setPrep] = useState(null);
  const intento = useRef(0); // salir o volver a empezar invalida un permiso que todavía está pendiente
  const sinSalir = useRef(false); // se sale de la pantalla completa a propósito para pedir el permiso: no cierra manos libres
  const hayPantalla = () => { const el = document.documentElement; return !!(el.requestFullscreen || el.webkitRequestFullscreen); };
  const enPantalla = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const pantallaCompleta = () => new Promise((ok) => {
    try {
      const el = document.documentElement; const f = el.requestFullscreen || el.webkitRequestFullscreen;
      if (!f) return ok(false);
      const r = f.call(el);
      if (r && r.then) r.then(() => ok(true), () => ok(false)); else setTimeout(() => ok(enPantalla()), 120);
    } catch (e) { ok(false); }
  });
  const salirPantalla = () => new Promise((ok) => {
    if (!enPantalla()) return ok();
    sinSalir.current = true;
    try { const r = document.fullscreenElement ? document.exitFullscreen() : document.webkitExitFullscreen(); if (r && r.then) r.then(ok, ok); else setTimeout(ok, 200); } catch (e) { ok(); }
  });
  // Pantalla completa (si se puede) y voz encendida. Va dentro de un toque o justo después de él.
  const arrancar = async (conMicro) => {
    await pantallaCompleta();
    sinSalir.current = false; setPrep(null);
    if (conMicro) encenderVoz(); else { setLeer(true); leerPaso(cur); }
    pedirBloqueo();
  };
  const prepararVoz = async () => {
    const t = ++intento.current; const vigente = () => t === intento.current;
    desbloquearAudio(); // dentro del toque: así la lectura puede sonar aunque empiece después del permiso
    if (!vozDisponible()) { arrancar(false); return; }
    const st = await estadoMicrofono();
    if (!vigente()) return;
    if (st === 'granted') { arrancar(true); return; }
    await salirPantalla();
    setPrep('permiso');
    const r = await pedirMicrofono();
    if (!vigente()) return;
    if (r !== 'granted') { setPrep(r); return; }
    // Aceptado: se intenta la pantalla completa de inmediato. Si el navegador ya no cuenta el toque, se pide uno.
    if (!hayPantalla()) { arrancar(true); return; }
    const ok = await pantallaCompleta();
    if (!vigente()) return;
    if (ok) arrancar(true); else setPrep('tocar');
  };
  const entrarLibre = () => {
    setLibre(true);
    if (leer) { pantallaCompleta(); pedirBloqueo(); return; } // la voz ya estaba encendida: el permiso ya se dio
    prepararVoz();
  };
  // En manos libres, encender la voz pasa por el mismo orden (permiso → pantalla completa → voz)
  const alternarVozLibre = () => { if (leer) apagarVoz(); else prepararVoz(); };
  const salirLibre = () => {
    intento.current++; setLibre(false); setPrep(null); sinSalir.current = false; apagarVoz();
    try { if (document.fullscreenElement) document.exitFullscreen(); else if (document.webkitFullscreenElement) document.webkitExitFullscreen(); } catch (e) {}
    try { if (bloqueo.current) bloqueo.current.release(); } catch (e) {}
    bloqueo.current = null;
  };
  const salirRef = useRef(); salirRef.current = salirLibre;
  useEffect(() => {
    if (!libre) return;
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    // Esc o salir de la pantalla completa del navegador también cierra manos libres
    const fs = () => { if (!document.fullscreenElement && !document.webkitFullscreenElement && !sinSalir.current) salirRef.current(); };
    const esc = (e) => { if (e.key === 'Escape' && !sinSalir.current) salirRef.current(); };
    // Al volver a la pestaña, el bloqueo de pantalla se pierde: se pide de nuevo
    const vis = () => { if (document.visibilityState === 'visible') pedirBloqueo(); };
    document.addEventListener('fullscreenchange', fs); document.addEventListener('webkitfullscreenchange', fs);
    window.addEventListener('keydown', esc); document.addEventListener('visibilitychange', vis);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('fullscreenchange', fs); document.removeEventListener('webkitfullscreenchange', fs);
      window.removeEventListener('keydown', esc); document.removeEventListener('visibilitychange', vis);
    };
  }, [libre]);
  useEffect(() => () => { try { if (bloqueo.current) bloqueo.current.release(); } catch (e) {} }, []);
  // Abierto desde la Biblioteca: entra directo a manos libres. Corre justo después del toque en «Abrir»,
  // así el navegador todavía cuenta el gesto y deja abrir la pantalla completa, el audio y el micrófono.
  useEffect(() => { if (libreInicial) entrarLibre(); }, []);

  const pct = Math.round((hechos.length / N) * 100);
  const mapa = <Recorrido d={d} cur={cur} visto={visto} hechos={hechos} ir={ir} />;
  const s = cur >= 0 && cur < N ? d.pasos[cur] : null;

  // Manos libres: otra pantalla, minimalista (libre.jsx); el estado y las acciones son los mismos
  if (libre) return (
    <PantallaLibre d={d} cur={cur} visto={visto} hechos={hechos} ir={ir} siguiente={siguiente} anterior={anterior} listo={listo} dir={dir}
      salir={salirLibre} AjustesVoz={AjustesVoz} onPdf={onPdf} bajando={bajando} pq={pq} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      voz={{ leer, hablando, estado, oido, orden, encender, alternar: alternarVozLibre }}
      prep={prep} onTocar={() => arrancar(true)} onSinMicro={() => { intento.current++; arrancar(false); }}
      reiniciar={() => { reiniciar(); setVisto(-1); ir(-1); }}
      onRegistrar={onRegistrar && (() => { salirLibre(); onRegistrar(); })}
      onVerTodo={() => { salirLibre(); onVerTodo(); }} />
  );

  return (
    <div ref={raiz} className="flex flex-col gap-4">
      {/* Franja superior compacta */}
      <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center gap-3">
        <button type="button" onClick={volver} className="inline-flex flex-none items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] text-ink2 hover:bg-soft"><Ic n="back" s={14} />Biblioteca</button>
        <div className="min-w-0 flex-1 basis-[240px]">
          <p className="rotulo m-0">{d.esp} · modo guiado</p>
          <h1 className="m-0 truncate text-[18px] font-extrabold leading-tight tracking-[-.02em] text-deep sm:text-[22px]" title={d.titulo}>{d.titulo}</h1>
        </div>
        <div className="flex flex-none items-center gap-2">
          {(lecturaDisponible() || vozDisponible()) && (
            <button type="button" onClick={alternarModoVoz} aria-pressed={leer}
              aria-label={leer ? 'Apagar el modo voz' : 'Modo voz: lee cada paso en voz alta y escucha tus órdenes'}
              title={vozDisponible() ? 'Lee cada paso y escucha «siguiente», «anterior», «por qué», «silencio»' : 'Lee cada paso en voz alta (este navegador no reconoce la voz)'}
              className={cx('relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors sm:min-w-[142px]', leer ? 'bg-panel text-panelink' : 'border border-cardline bg-card text-ink2 shadow-sh hover:bg-soft')}>
              <span className={cx('relative grid h-5 w-5 place-items-center rounded-full', leer && !hablando && estado === 'escuchando' && 'onda')}>
                {leer && hablando ? <span className="barras inline-flex h-4 w-4 items-end justify-center gap-[2px]"><i /><i /><i /></span>
                  : <Ic n={vozDisponible() ? 'mic' : 'volumen'} s={16} className={leer ? 'text-menta' : 'text-acento'} />}
              </span>
              <span className="hidden sm:inline">{!leer ? 'Voz' : hablando ? 'Leyendo' : estado === 'escuchando' ? 'Escuchando' : 'Voz encendida'}</span>
            </button>
          )}
          {lecturaDisponible() && (
            <button type="button" onClick={() => setAjustes(!ajustes)} aria-pressed={ajustes} aria-label="Elegir la voz de lectura y la velocidad" title="Elegir la voz y la velocidad"
              className={cx('grid h-9 w-9 place-items-center rounded-full transition-colors', ajustes ? 'bg-panel text-menta' : 'border border-cardline bg-card text-acento shadow-sh hover:bg-soft')}>
              <Ic n="dots" s={18} />
            </button>
          )}
          <button type="button" onClick={onVerTodo} aria-label="Ver todo el protocolo" className="inline-flex items-center gap-2 rounded-full border border-cardline bg-card px-3.5 py-2 text-[13px] font-semibold text-ink2 shadow-sh hover:bg-soft">
            <Ic n="book" s={16} /><span className="hidden sm:inline">Ver todo</span>
          </button>}
          {libre
            ? <button type="button" onClick={salirLibre} className="inline-flex items-center gap-2 rounded-full bg-acento px-4 py-2 text-[13px] font-bold text-onc shadow-sh hover:bg-acentodeep"><Ic n="shrink" s={16} />Salir</button>
            : <button type="button" onClick={entrarLibre} aria-label="Manos libres: pantalla completa, voz y lectura de cada paso"
                title={vozDisponible() ? 'Pantalla completa, voz y lectura de cada paso' : 'Pantalla completa y lectura de cada paso (este navegador no reconoce la voz)'}
                className="inline-flex items-center gap-2 rounded-full bg-acento px-3.5 py-2 text-[13px] font-bold text-onc shadow-sh hover:bg-acentodeep">
                <Ic n="expand" s={16} /><span className="hidden sm:inline">Manos libres</span>
              </button>}
        </div>
      </div>

      <div className="mx-auto h-1.5 w-full max-w-[1100px] overflow-hidden rounded-full bg-soft" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Pasos marcados">
        <div className="h-1.5 rounded-full bg-[linear-gradient(90deg,var(--acento),var(--menta))] transition-[width] duration-700" style={{ width: pct + '%' }} />
      </div>

      {ajustes && <div className="mx-auto w-full max-w-[1100px]"><AjustesVoz cerrar={() => setAjustes(false)} /></div>}
      {leer && vozDisponible() && <div className="mx-auto w-full max-w-[1100px]"><PanelVoz estado={estado} oido={oido} orden={orden} encender={encender} hablando={hablando} /></div>}
      {leer && !vozDisponible() && <p className="mx-auto m-0 w-full max-w-[1100px] text-[12.5px] text-ink3">Este navegador no reconoce la voz: cada paso se lee en voz alta y avanzas tocando «Terminé» o deslizando.</p>}

      <div ref={escenario} className="mx-auto w-full min-w-0 max-w-[1100px] touch-pan-y" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {/* El paso anterior queda arriba, compacto, unido por una flecha */}
          {cur > 0 && cur <= N && (
            <div key={'prev' + cur}>
              <button type="button" onClick={() => ir(cur - 1)} className="compacta flex w-full items-center gap-3 rounded-full px-2 py-1.5 text-left text-[13px] text-ink3 hover:bg-soft hover:text-ink2">
                <span className={cx('grid h-6 w-6 flex-none place-items-center rounded-full text-[11px] font-bold', hechos.includes(cur - 1) ? 'bg-menta text-mentaink' : 'bg-card text-ink3')}>
                  {hechos.includes(cur - 1) ? <Ic n="check" s={13} sw={2.6} /> : nn(cur - 1)}
                </span>
                <span className="min-w-0 truncate"><b className="font-semibold text-ink">Paso {nn(cur - 1)}</b> · {d.pasos[cur - 1].corto}</span>
              </button>
              <Flecha vertical className="mx-auto my-1" />
            </div>
          )}

          <div key={cur} className={dir > 0 ? 'entra-der' : 'entra-izq'}>
            {cur === -1 && <Bandeja d={d} mapa={mapa} empezar={() => siguiente()} onPdf={onPdf} bajando={bajando} />}
            {s && <Paso s={s} i={cur} hecho={hechos.includes(cur)} onToggle={() => toggle(cur)} grande animar leyendo={hablando} abrirPorque={pq} autoPorque={5} mapa={mapa} />}
            {cur === N && <Cierre d={d} hechos={hechos} ir={ir} mapa={mapa} reiniciar={() => { reiniciar(); setVisto(-1); ir(-1); }} onRegistrar={onRegistrar} onVerTodo={onVerTodo} />}
          </div>

          {/* Navegación: fija abajo, al alcance del pulgar */}
          {cur < N && (
            <div className={'sticky bottom-[calc(76px+env(safe-area-inset-bottom,0px))] z-20 mt-5 lg:bottom-5'}>
            <div className={'flex items-center gap-2 rounded-full border border-cardline bg-[color-mix(in_srgb,var(--card)_86%,transparent)] p-1.5 shadow-shlg backdrop-blur-xl'}>
              <button type="button" onClick={() => anterior()} disabled={cur === -1} aria-label="Paso anterior"
                className={'grid h-11 w-11 flex-none place-items-center rounded-full text-ink2 hover:bg-soft disabled:opacity-35'}><Ic n="back" s={18} /></button>
              <span className="min-w-0 flex-1 truncate text-center text-[12.5px] tabular-nums text-ink3">
                {cur === -1 ? 'Antes de empezar' : <>Paso <b className="text-ink">{nn(cur)}</b> de {N}</>}
                <span className="hidden sm:inline"> · usa ← →{vozDisponible() ? ' o di «siguiente»' : ''}</span>
                <span className="sm:hidden"> · desliza</span>
              </span>
              <button type="button" onClick={() => siguiente()}
                className={cx('inline-flex flex-none items-center gap-2 rounded-full font-bold', 'h-11 px-5 text-[14px]', 'shadow-[0_8px_20px_-10px_var(--acento)] transition-colors active:scale-[.97]', listo ? 'confirma bg-menta text-mentaink' : 'bg-acento text-onc hover:bg-acentodeep')}>
                {listo ? <><Ic n="check" s={17} sw={2.6} />Hecho</> : <>
                  {cur === -1 ? 'Empezar' : cur === N - 1 ? 'Terminar' : <><span className="sm:hidden">Terminé</span><span className="hidden sm:inline">Terminé este paso</span></>}
                  <span className="rotate-180"><Ic n="back" s={17} sw={2.2} /></span>
                </>}
              </button>
            </div>
            </div>
          )}
      </div>
    </div>
  );
}

function PanelVoz({ estado, oido, orden, encender, hablando }) {
  const NOMBRE = { siguiente: 'Siguiente paso', anterior: 'Paso anterior', leer: 'Leyendo el paso', porque: 'Leyendo el porqué', callar: 'Silencio', salir: 'Salir' };
  return (
    <div className="aparece tarjeta flex items-center gap-4 px-4 py-3.5 sm:gap-5 sm:px-5">
      <Orbe size={52} e={['denegado', 'sin-micro', 'error', 'pausado'].includes(estado) ? 'apagado' : estado === 'iniciando' ? 'espera' : hablando ? 'habla' : orden && Date.now() - orden.t < 2500 ? 'oye' : 'escucha'} />
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
      <div className="min-w-0 flex-1">
        {estado === 'denegado' ? <p className="m-0 text-[13.5px] text-ink2">El navegador no dio permiso para usar el micrófono. Actívalo en el candado de la barra de direcciones (en iPhone: Ajustes › Safari › Micrófono) y vuelve a tocar «Voz».</p>
          : estado === 'sin-micro' ? <p className="m-0 text-[13.5px] text-ink2">No se encontró un micrófono. Conecta uno o revisa que otra app no lo esté usando.</p>
          : estado === 'error' ? <p className="m-0 text-[13.5px] text-ink2">No hay conexión con el servicio de reconocimiento de voz. Revisa internet y <button type="button" onClick={encender} className="font-bold text-acento underline">vuelve a intentar</button>.</p>
          : estado === 'pausado' ? <p className="m-0 text-[13.5px] text-ink2">La escucha se pausó. <button type="button" onClick={encender} className="font-bold text-acento underline">Toca aquí para seguir escuchando</button>.</p>
          : estado === 'iniciando' ? <p className="m-0 text-[13.5px] text-ink2">Encendiendo el micrófono… si el navegador pregunta, toca «Permitir».</p>
          : <p className="m-0 text-[13.5px] leading-normal text-ink2">Di <b className="text-acento">«siguiente»</b> o «sigamos» para avanzar, «anterior», «lee» para escuchar el paso, «por qué» o «silencio». Puedes hablar aunque esté leyendo.</p>}
        <p className="m-0 mt-1 text-[11.5px] leading-snug text-ink3">El navegador manda el audio a su servicio de reconocimiento (Google en Chrome, Apple en Safari). No digas nombres ni datos del paciente.</p>
      </div>
      <div className="min-w-0 rounded-rs bg-soft px-3.5 py-2 text-[12.5px] text-ink3 sm:w-[260px]" aria-live="polite">
        {orden && Date.now() - orden.t < 4000 ? <><b className="text-acento">{NOMBRE[orden.o]}</b> · «{orden.texto}»</> : oido ? <>Oí: «{oido}»</> : 'Esperando una orden…'}
      </div>
      </div>
    </div>
  );
}

// Elegir la voz de lectura y la velocidad (se guarda en este navegador)
function AjustesVoz({ cerrar, plano }) {
  const voces = useVoces();
  const [uri, setUri] = useState(vozElegida);
  const [vel, setVel] = useState(() => String(velocidad()));
  const actual = voces.find((v) => v.voiceURI === uri) || voces[0];
  const probar = () => hablar(TEXTO_PRUEBA);
  return (
    <div className={cx('flex flex-col gap-3', !plano && 'aparece tarjeta p-4 sm:flex-row sm:items-end sm:gap-5 sm:p-5')}>
      <label className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-[12.5px] font-semibold text-ink2">Voz de lectura</span>
        {voces.length ? (
          <select value={actual ? actual.voiceURI : ''} onChange={(e) => { setUri(e.target.value); elegirVoz(e.target.value); }}
            className="min-w-0 rounded-rs border border-line bg-input px-3 py-2.5 text-[14px] text-ink">
            {voces.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.natural ? v.name : v.name + ' · ' + v.lang.replace('_', '-')}</option>)}
          </select>
        ) : <span className="text-[13px] text-ink3">Este navegador no trae voces en español. Instala una en los ajustes del sistema (Accesibilidad › Contenido leído).</span>}
      </label>
      <div className="flex flex-col gap-1.5">
        <span className="text-[12.5px] font-semibold text-ink2">Velocidad</span>
        <Seg opciones={VELOCIDADES} valor={vel} onChange={(v) => { setVel(v); elegirVelocidad(v); }} size="sm" />
      </div>
      <div className="flex gap-2">
        <Btn v="soft" icon="volumen" onClick={probar}>Probar</Btn>
        {!plano && <Btn v="ghost" onClick={cerrar}>Listo</Btn>}
      </div>
    </div>
  );
}

// Mapa del recorrido: una fila de puntos dentro del panel del paso (así el paso usa todo el ancho).
// Los pasos que no has visto muestran solo su número; el nombre aparece al pasar el mouse.
function Recorrido({ d, cur, visto, hechos, ir }) {
  const N = d.pasos.length;
  const fila = useRef(null);
  useEffect(() => {
    const ol = fila.current; const el = ol && ol.querySelector('[aria-current="step"]');
    if (el) ol.scrollLeft = el.offsetLeft - ol.clientWidth / 2 + el.offsetWidth / 2;
  }, [cur]);
  return (
    <nav aria-label="Recorrido del protocolo">
      <ol ref={fila} className="scroll-x m-0 flex list-none items-center overflow-x-auto px-2 py-1.5">
        {[-1, ...d.pasos.map((_, i) => i), N].map((k, j) => {
          const hecho = k >= 0 && k < N && hechos.includes(k);
          const actual = k === cur;
          const alcanzable = k <= visto || hecho;
          const nombre = k === -1 ? 'Bandeja' : k === N ? 'Cierre' : 'Paso ' + nn(k) + (alcanzable ? ' · ' + d.pasos[k].corto : '');
          return (
            <li key={k} className="flex flex-none items-center">
              {j > 0 && <span className={cx('h-0.5 w-3 transition-colors sm:w-5', k <= cur ? 'bg-menta' : 'bg-panel2')} aria-hidden="true" />}
              <button type="button" onClick={() => alcanzable && ir(k)} disabled={!alcanzable} aria-current={actual ? 'step' : undefined}
                aria-label={nombre} title={nombre}
                className={cx('grid h-7 w-7 place-items-center rounded-full text-[10.5px] font-bold tabular-nums transition-colors sm:h-8 sm:w-8 sm:text-[11.5px]',
                  actual ? 'nodo-actual bg-panelink text-panel' : hecho ? 'bg-menta text-mentaink' : alcanzable ? 'bg-panel2 text-panelink hover:brightness-125' : 'border border-panel2 text-panelink2 opacity-60')}>
                {hecho && !actual ? <Ic n="check" s={13} sw={2.6} /> : k === -1 ? <Ic n="tool" s={13} /> : k === N ? <Ic n="stamp" s={13} /> : nn(k)}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Antes de empezar: el instrumental agrupado por fase, como un flujo de izquierda a derecha
function Bandeja({ d, mapa, empezar, onPdf, bajando }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="aparece panel p-6 sm:p-9">
        {mapa && <div className="-mx-2 mb-5 sm:mb-7">{mapa}</div>}
        <div className="text-[11.5px] font-bold uppercase tracking-[.13em] text-menta">Antes de empezar</div>
        <h2 className="m-0 mt-2 text-[24px] font-bold leading-tight text-panelink sm:text-[30px]">Monta la bandeja.</h2>
        <p className="m-0 mt-3 max-w-[62ch] text-[15px] leading-[1.6] text-panelink2 sm:text-[16px]"><b className="text-panelink">Alcance:</b> {d.alcance}</p>
        <div className="mt-6 flex w-full max-w-[340px] flex-col gap-2.5">
          <button type="button" onClick={empezar} className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-menta px-7 text-[17px] font-bold text-mentaink shadow-shlg transition-transform active:scale-[.97]">
            Empezar<span className="rotate-180"><Ic n="back" s={19} sw={2.4} /></span>
          </button>
          {onPdf && (
            <button type="button" onClick={onPdf} disabled={bajando} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-panel2 px-6 text-[14.5px] font-semibold text-panelink transition-colors hover:brightness-110 disabled:opacity-60">
              <Ic n="download" s={17} />{bajando ? 'Preparando…' : 'Descargar el PDF de box'}
            </button>
          )}
        </div>
      </div>
      <Aviso className="aparece !rounded-[20px] !text-[12px]" >{d.bandera}</Aviso>
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {d.bandeja.map((b, i) => (
          <div key={b.fase} className="aparece suave p-5" style={{ '--d': 200 + i * 140 + 'ms' }}>
            <div className="mb-2 flex items-center gap-2.5">
              <b className="text-[24px] font-extrabold leading-none tabular-nums text-menta">{i + 1}</b>
              <h3 className="rotulo m-0">{b.fase}</h3>
            </div>
            <ul className="m-0 pl-4 text-[13.5px] leading-[1.65] text-ink2">{b.items.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Cierre({ d, hechos, ir, mapa, reiniciar, onRegistrar, onVerTodo }) {
  const N = d.pasos.length;
  const faltan = d.pasos.map((s, i) => ({ s, i })).filter(({ i }) => !hechos.includes(i));
  return (
    <section className="flex flex-col gap-3">
      <div className="aparece panel flex flex-col items-start gap-4 p-6 sm:p-9">
        {mapa && <div className="-mx-2 mb-1 self-stretch sm:mb-3">{mapa}</div>}
        <span className="grid h-14 w-14 place-items-center rounded-full bg-menta text-mentaink"><Ic n="check" s={28} sw={2.6} /></span>
        <div>
          <div className="text-[11.5px] font-bold uppercase tracking-[.13em] text-menta">Protocolo terminado</div>
          <h2 className="m-0 mt-2 text-[24px] font-bold leading-tight text-panelink sm:text-[30px]">Marcaste {hechos.length} de {N} pasos.</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {onRegistrar && <Btn v="primary" icon="plus" onClick={onRegistrar}>Registrar un caso con este protocolo</Btn>}
          <button type="button" onClick={reiniciar} className="rounded-full bg-panel2 px-4 py-2.5 text-[13.5px] font-semibold text-panelink hover:brightness-110">Empezar de nuevo</button>
        </div>
      </div>
      {faltan.length > 0 && (
        <div className="aparece suave p-5 sm:p-7" style={{ '--d': '300ms' }}>
          <div className="rotulo mb-2">Quedaron sin marcar</div>
          <p className="m-0 mb-3 text-[13.5px] text-ink2">{onRegistrar ? 'Si los omitiste o los cambiaste, anótalo con su motivo al registrar el caso.' : 'Revísalos antes de cerrar: tócalos para volver a ese paso.'}</p>
          <div className="flex flex-col gap-1.5">
            {faltan.map(({ s, i }) => (
              <button key={i} type="button" onClick={() => ir(i)} className="flex items-center gap-3 rounded-rs bg-card px-3.5 py-2.5 text-left text-[13.5px] text-ink2 shadow-sh hover:text-ink">
                <b className="tabular-nums text-rotulo">{nn(i)}</b>{s.corto}
              </button>
            ))}
          </div>
        </div>
      )}
      <button type="button" onClick={onVerTodo} className="aparece self-start px-2 py-1 text-[13px] font-semibold text-acento hover:underline" style={{ '--d': '450ms' }}>Ver el protocolo completo</button>
    </section>
  );
}
