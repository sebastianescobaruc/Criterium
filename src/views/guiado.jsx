// Modo guiado de un protocolo: se ve un paso a la vez y el recorrido se va desplegando.
// cur: -1 = bandeja (antes de empezar), 0..N-1 = pasos, N = cierre.
import React, { useEffect, useRef, useState } from 'react';
import { nn } from '../logic.js';
import { Ic, Btn, Aviso, cx } from '../ui.jsx';
import { Paso, Flecha } from './protocolos.jsx';
import { useVoz, vozDisponible, lecturaDisponible, useHablando, hablar, callar } from '../voz.js';

// Leer cada paso en voz alta al llegar: comodidad local
const leerPref = () => { try { return localStorage.getItem('criterium-leer') === 'si'; } catch (e) { return false; } };
const guardarLeer = (v) => { try { localStorage.setItem('criterium-leer', v ? 'si' : 'no'); } catch (e) {} };

const reducido = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

export function Guiado({ d, hechos, toggle, marcar, reiniciar, onVerTodo, onRegistrar, volver }) {
  const N = d.pasos.length;
  const [cur, setCur] = useState(() => {
    if (!hechos.length) return -1;
    const f = d.pasos.findIndex((_, i) => !hechos.includes(i));
    return f === -1 ? N : f;
  });
  const [visto, setVisto] = useState(cur); // hasta dónde llegó: el mapa no adelanta pasos que no ha visto
  const [voz, setVoz] = useState(false);
  const [leer, setLeer] = useState(leerPref);
  const [dir, setDir] = useState(1);        // 1 avanza (entra desde la derecha), -1 retrocede
  const [listo, setListo] = useState(false); // "Terminé" confirma con ✓ antes de avanzar
  const [orden, setOrden] = useState(null);
  const [pq, setPq] = useState(0); // «por qué» por voz abre el desplegable del paso
  const [libre, setLibre] = useState(false); // manos libres: pantalla completa + voz + lectura
  const raiz = useRef(null);
  const hablando = useHablando();
  const leerAhora = useRef(false);          // una orden de voz pide leer aunque la lectura automática esté apagada
  const escenario = useRef(null);
  const primera = useRef(true);

  const leerPaso = (k) => {
    if (k === -1) hablar('Antes de empezar, monta la bandeja. Di siguiente cuando esté lista.');
    else if (k >= N) hablar('Protocolo terminado. Marcaste ' + hechos.length + ' de ' + N + ' pasos.');
    else { const s = d.pasos[k]; hablar('Paso ' + (k + 1) + '. ' + s.hacer + ' ' + (s.listo || '')); }
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
  const alternarLeer = () => {
    const v = !leer; setLeer(v); guardarLeer(v);
    if (v) leerPaso(cur); else callar(); // el toque del botón habilita el audio en el navegador
  };

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
  const { estado, oido } = useVoz(voz, (o, texto) => {
    setOrden({ o, texto, t: Date.now() });
    if (o === 'siguiente') siguiente(true);
    else if (o === 'anterior') anterior(true);
    else if (o === 'leer') leerPaso(cur);
    else if (o === 'porque') setPq((n) => n + 1), hablar(cur >= 0 && cur < N ? ((d.pasos[cur].porque || [])[0] || 'Este paso no trae explicación.') : '');
    else if (o === 'callar') callar();
    else if (o === 'salir' && libre) salirLibre();
  });
  useEffect(() => () => callar(), []);
  const alternarVoz = () => { if (voz) callar(); setVoz(!voz); };

  // Manos libres: la app se esconde, el paso ocupa la pantalla, se escucha la voz, se lee cada paso
  // y la pantalla no se apaga. En iPhone no hay pantalla completa real: queda la capa fija que tapa todo.
  const bloqueo = useRef(null);
  const pedirBloqueo = async () => { try { if (navigator.wakeLock) bloqueo.current = await navigator.wakeLock.request('screen'); } catch (e) {} };
  const entrarLibre = () => {
    setLibre(true); setVoz(vozDisponible()); setLeer(true);
    leerPaso(cur); // dentro del toque: así el navegador deja sonar el audio
    try { const el = document.documentElement; const f = el.requestFullscreen || el.webkitRequestFullscreen; if (f) { const r = f.call(el); if (r && r.catch) r.catch(() => {}); } } catch (e) {}
    pedirBloqueo();
  };
  const salirLibre = () => {
    setLibre(false); setVoz(false); setLeer(leerPref()); callar();
    try { if (document.fullscreenElement) document.exitFullscreen(); else if (document.webkitFullscreenElement) document.webkitExitFullscreen(); } catch (e) {}
    try { if (bloqueo.current) bloqueo.current.release(); } catch (e) {}
    bloqueo.current = null;
  };
  const salirRef = useRef(); salirRef.current = salirLibre;
  useEffect(() => {
    if (!libre) return;
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    // Esc o salir de la pantalla completa del navegador también cierra manos libres
    const fs = () => { if (!document.fullscreenElement && !document.webkitFullscreenElement) salirRef.current(); };
    const esc = (e) => { if (e.key === 'Escape') salirRef.current(); };
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

  const pct = Math.round((hechos.length / N) * 100);
  const mapa = <Recorrido d={d} cur={cur} visto={visto} hechos={hechos} ir={ir} />;
  const s = cur >= 0 && cur < N ? d.pasos[cur] : null;

  return (
    <div ref={raiz} className={cx('flex flex-col gap-4', libre && 'fondo fixed inset-0 z-[60] overflow-y-auto px-4 pb-5 pt-[calc(16px+env(safe-area-inset-top,0px))] sm:px-8')}>
      {/* Franja superior compacta */}
      <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center gap-3">
        {!libre && <button type="button" onClick={volver} className="inline-flex flex-none items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] text-ink2 hover:bg-soft"><Ic n="back" s={14} />Biblioteca</button>}
        <div className="min-w-0 flex-1 basis-[240px]">
          <p className="rotulo m-0">{d.esp} · {libre ? 'manos libres' : 'modo guiado'}</p>
          <h1 className="m-0 truncate text-[18px] font-extrabold leading-tight tracking-[-.02em] text-deep sm:text-[22px]" title={d.titulo}>{d.titulo}</h1>
        </div>
        <div className="flex flex-none items-center gap-2">
          {vozDisponible() && (
            <button type="button" onClick={alternarVoz} aria-pressed={voz}
              className={cx('relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors', voz ? 'bg-panel text-panelink' : 'border border-cardline bg-card text-ink2 shadow-sh hover:bg-soft')}>
              <span className={cx('relative grid h-5 w-5 place-items-center rounded-full', voz && estado === 'escuchando' && 'onda')}>
                <Ic n="mic" s={16} className={voz ? 'text-menta' : 'text-acento'} />
              </span>
              <span className="hidden sm:inline">{voz ? 'Escuchando' : 'Voz'}</span>
            </button>
          )}
          {lecturaDisponible() && (
            <button type="button" onClick={alternarLeer} aria-pressed={leer} aria-label="Leer cada paso en voz alta" title="Leer cada paso en voz alta"
              className={cx('inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors', leer ? 'bg-panel text-panelink' : 'border border-cardline bg-card text-ink2 shadow-sh hover:bg-soft')}>
              {leer && hablando ? <span className="barras inline-flex h-4 w-4 items-end justify-center gap-[2px]"><i /><i /><i /></span> : <Ic n="volumen" s={16} className={leer ? 'text-menta' : 'text-acento'} />}
              <span className="hidden sm:inline">{leer ? 'Leyendo pasos' : 'Leer pasos'}</span>
            </button>
          )}
          {!libre && <button type="button" onClick={onVerTodo} aria-label="Ver todo el protocolo" className="inline-flex items-center gap-2 rounded-full border border-cardline bg-card px-3.5 py-2 text-[13px] font-semibold text-ink2 shadow-sh hover:bg-soft">
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

      {voz && <div className="mx-auto w-full max-w-[1100px]"><PanelVoz estado={estado} oido={oido} orden={orden} libre={libre} /></div>}
      {libre && !vozDisponible() && <p className="mx-auto m-0 w-full max-w-[1100px] text-[12.5px] text-ink3">Este navegador no reconoce la voz: cada paso se lee en voz alta y avanzas tocando «Terminé» o deslizando.</p>}

      <div ref={escenario} className="mx-auto w-full min-w-0 max-w-[1100px] touch-pan-y" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {/* El paso anterior queda arriba, compacto, unido por una flecha */}
          {cur > 0 && cur <= N && !libre && (
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
            {cur === -1 && <Bandeja d={d} mapa={mapa} />}
            {s && <Paso s={s} i={cur} hecho={hechos.includes(cur)} onToggle={() => toggle(cur)} grande animar leyendo={hablando} abrirPorque={pq} autoPorque={5} mapa={mapa} />}
            {cur === N && <Cierre d={d} hechos={hechos} ir={ir} mapa={mapa} reiniciar={() => { reiniciar(); setVisto(-1); ir(-1); }} onRegistrar={onRegistrar} onVerTodo={onVerTodo} />}
          </div>

          {/* Navegación: fija abajo, al alcance del pulgar */}
          {cur < N && (
            <div className={cx('sticky z-20 mt-5', libre ? 'bottom-[env(safe-area-inset-bottom,0px)]' : 'bottom-[calc(76px+env(safe-area-inset-bottom,0px))] lg:bottom-5')}>
            <div className={cx('flex items-center gap-2 rounded-full border border-cardline bg-[color-mix(in_srgb,var(--card)_86%,transparent)] p-1.5 shadow-shlg backdrop-blur-xl', libre && 'p-2')}>
              <button type="button" onClick={() => anterior()} disabled={cur === -1} aria-label="Paso anterior"
                className={cx('grid flex-none place-items-center rounded-full text-ink2 hover:bg-soft disabled:opacity-35', libre ? 'h-16 w-16' : 'h-11 w-11')}><Ic n="back" s={libre ? 24 : 18} /></button>
              <span className="min-w-0 flex-1 truncate text-center text-[12.5px] tabular-nums text-ink3">
                {cur === -1 ? 'Antes de empezar' : <>Paso <b className="text-ink">{nn(cur)}</b> de {N}</>}
                <span className="hidden sm:inline"> · {libre && vozDisponible() ? 'di «siguiente» o «salir»' : <>usa ← →{vozDisponible() ? ' o di «siguiente»' : ''}</>}</span>
                <span className="sm:hidden"> · desliza</span>
              </span>
              <button type="button" onClick={() => siguiente()}
                className={cx('inline-flex flex-none items-center gap-2 rounded-full font-bold', libre ? 'h-16 px-8 text-[17px]' : 'h-11 px-5 text-[14px]', 'shadow-[0_8px_20px_-10px_var(--acento)] transition-colors active:scale-[.97]', listo ? 'confirma bg-menta text-mentaink' : 'bg-acento text-onc hover:bg-acentodeep')}>
                {listo ? <><Ic n="check" s={17} sw={2.6} />Hecho</> : <>
                  {cur === -1 ? 'Bandeja lista' : cur === N - 1 ? 'Terminar' : <><span className="sm:hidden">Terminé</span><span className="hidden sm:inline">Terminé este paso</span></>}
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

function PanelVoz({ estado, oido, orden, libre }) {
  const NOMBRE = { siguiente: 'Siguiente paso', anterior: 'Paso anterior', leer: 'Leyendo el paso', porque: 'Leyendo el porqué', callar: 'Silencio', salir: 'Salir' };
  return (
    <div className="aparece panel flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="min-w-0 flex-1">
        {estado === 'denegado' ? <p className="m-0 text-[13.5px] text-panelink">El navegador no dio permiso para usar el micrófono. Actívalo en el candado de la barra de direcciones.</p>
          : estado === 'error' ? <p className="m-0 text-[13.5px] text-panelink">Se cortó la escucha. Apaga y vuelve a encender la voz.</p>
          : <p className="m-0 text-[13.5px] leading-normal text-panelink">Di <b className="text-menta">«siguiente»</b> o «sigamos» para avanzar, «anterior», «lee» para escuchar el paso, «por qué» o «silencio»{libre ? ', y «salir» para terminar' : ''}.</p>}
        <p className="m-0 mt-1 text-[11.5px] leading-snug text-panelink2">El navegador manda el audio a su servicio de reconocimiento (Google en Chrome, Apple en Safari). No digas nombres ni datos del paciente.</p>
      </div>
      <div className="min-w-0 rounded-rs bg-panel2 px-3.5 py-2 text-[12.5px] text-panelink2 sm:w-[260px]" aria-live="polite">
        {orden && Date.now() - orden.t < 4000 ? <><b className="text-menta">{NOMBRE[orden.o]}</b> · «{orden.texto}»</> : oido ? <>Oí: «{oido}»</> : 'Esperando una orden…'}
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
function Bandeja({ d, mapa }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="aparece panel p-6 sm:p-9">
        {mapa && <div className="-mx-2 mb-5 sm:mb-7">{mapa}</div>}
        <div className="text-[11.5px] font-bold uppercase tracking-[.13em] text-menta">Antes de empezar</div>
        <h2 className="m-0 mt-2 text-[24px] font-bold leading-tight text-panelink sm:text-[30px]">Monta la bandeja.</h2>
        <p className="m-0 mt-3 max-w-[62ch] text-[15px] leading-[1.6] text-panelink2 sm:text-[16px]"><b className="text-panelink">Alcance:</b> {d.alcance}</p>
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
          <Btn v="primary" icon="plus" onClick={onRegistrar}>Registrar un caso con este protocolo</Btn>
          <button type="button" onClick={reiniciar} className="rounded-full bg-panel2 px-4 py-2.5 text-[13.5px] font-semibold text-panelink hover:brightness-110">Empezar de nuevo</button>
        </div>
      </div>
      {faltan.length > 0 && (
        <div className="aparece suave p-5 sm:p-7" style={{ '--d': '300ms' }}>
          <div className="rotulo mb-2">Quedaron sin marcar</div>
          <p className="m-0 mb-3 text-[13.5px] text-ink2">Si los omitiste o los cambiaste, anótalo con su motivo al registrar el caso.</p>
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
