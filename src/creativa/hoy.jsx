// Criterium Red · Hoy: lo que hace volver cada día.
// Historias de video («Caso en 60 segundos»), el Desafío del día con racha y la Ronda clínica en vivo.
// Todo el contenido lo publican docentes o el equipo: la app no inventa preguntas ni casos.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../ctx.js';
import { datosPersonales, hace } from '../logic.js';
import { useVideos, subirVideoFS, borrarVideoFS, meSirveVideoFS, useDesafios, useRespuestasDesafio, crearDesafioFS, responderDesafioFS, useRacha, guardarRachaFS, useRondas, crearRondaFS, borrarRondaFS, avisameRondaFS, mensajeRondaFS } from '../db.js';
import { INTERESES, PillEsp, colorEsp } from '../views/red.jsx';
import { Ic, Btn, Field, Modal, Avatar, Vacio, inputCls, inputErr, cx } from '../ui.jsx';

/* ═══ Fechas locales (el desafío cambia a medianoche de Chile, no de Greenwich) ═══ */
const dia = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const ayer = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dia(d); };
const saludo = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches'; };
const FECHA_LARGA = (d = new Date()) => d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

/* ═════════ Caso en 60 segundos ═════════ */
// Solo YouTube y Vimeo: el video vive allá, aquí se ve en formato vertical
export function leerVideo(url) {
  const u = String(url || '').trim();
  let m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (m) return { plataforma: 'youtube', vid: m[1] };
  m = u.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/);
  if (m) return { plataforma: 'vimeo', vid: m[1] };
  return null;
}
const embed = (v) => (v.plataforma === 'youtube' ? `https://www.youtube-nocookie.com/embed/${v.vid}?autoplay=1&playsinline=1&rel=0&modestbranding=1` : `https://player.vimeo.com/video/${v.vid}?autoplay=1&title=0&byline=0&portrait=0`);
const miniatura = (v) => (v.plataforma === 'youtube' ? `https://i.ytimg.com/vi/${v.vid}/hqdefault.jpg` : null);

export function Historias() {
  const { esRevisor } = useApp();
  const videos = useVideos(true);
  const [abierto, setAbierto] = useState(null);
  const [subir, setSubir] = useState(false);
  if (!videos.length && !esRevisor) return null;
  return (
    <section aria-label="Caso en 60 segundos" className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between"><h2 className="m-0 text-[14px] font-bold text-ink">Caso en 60 segundos</h2>{videos.length > 0 && <span className="text-[12px] text-ink3">Técnicas en video corto, sin pacientes</span>}</div>
      <div className="scroll-x -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-1">
        {esRevisor && (
          <button type="button" onClick={() => setSubir(true)} className="flex w-[74px] flex-none flex-col items-center gap-1.5">
            <span className="grid h-[68px] w-[68px] place-items-center rounded-full border-2 border-dashed border-acento bg-card text-acento"><Ic n="plus" s={24} /></span>
            <span className="w-full truncate text-center text-[11.5px] font-semibold text-ink2">Subir video</span>
          </button>
        )}
        {videos.map((v, k) => (
          <button key={v.id} type="button" onClick={() => setAbierto(k)} className="flex w-[74px] flex-none flex-col items-center gap-1.5" aria-label={'Ver ' + v.titulo}>
            <span className="historia-anillo grid h-[68px] w-[68px] place-items-center rounded-full p-[3px]">
              <span className="block h-full w-full overflow-hidden rounded-full bg-deep ring-2 ring-card" style={miniatura(v) ? { backgroundImage: `url(${miniatura(v)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : colorEsp(v.especialidad) || undefined}>
                {!miniatura(v) && <span className="grid h-full w-full place-items-center text-onc"><Ic n="video" s={22} /></span>}
              </span>
            </span>
            <span className="w-full truncate text-center text-[11.5px] font-semibold text-ink2">{v.paso || v.titulo}</span>
          </button>
        ))}
        {!videos.length && <span className="self-center text-[12.5px] leading-snug text-ink3">Sube el primer video de técnica: un enlace de YouTube o Vimeo, sin pacientes.</span>}
      </div>
      {abierto !== null && <VisorVideos videos={videos} inicio={abierto} cerrar={() => setAbierto(null)} />}
      {subir && <SubirVideo cerrar={() => setSubir(false)} />}
    </section>
  );
}

function VisorVideos({ videos, inicio, cerrar }) {
  const { myUid, avisar } = useApp();
  const [i, setI] = useState(inicio);
  const toque = useRef(null);
  const v = videos[i];
  const ir = (d) => { const n = i + d; if (n < 0) return; if (n >= videos.length) return cerrar(); setI(n); };
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') cerrar(); if (e.key === 'ArrowDown' || e.key === 'ArrowRight') ir(1); if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ir(-1); };
    window.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [i]);
  if (!v) return null;
  const sirve = (v.likedBy || []).includes(myUid);
  return (
    <div className="fixed inset-0 z-[85] flex flex-col bg-[#071318]" role="dialog" aria-modal="true" aria-label="Caso en 60 segundos"
      onTouchStart={(e) => { toque.current = e.touches[0].clientY; }} onTouchEnd={(e) => { if (toque.current === null) return; const d = e.changedTouches[0].clientY - toque.current; if (Math.abs(d) > 60) ir(d < 0 ? 1 : -1); toque.current = null; }}>
      <div className="flex gap-1 px-3 pt-[calc(10px+env(safe-area-inset-top,0px))]">{videos.map((_, k) => <span key={k} className={cx('h-[3px] flex-1 rounded-full', k <= i ? 'bg-menta' : 'bg-[rgba(255,255,255,.2)]')} />)}</div>
      <div className="flex items-center gap-3 px-4 py-3 text-onc">
        <Avatar nombre={v.autor.nombre} size={34} />
        <div className="min-w-0 flex-1"><b className="block truncate text-[14px]">{v.autor.nombre}</b><span className="block truncate text-[12px] text-panelink2">{[v.especialidad, hace(v.fecha)].filter(Boolean).join(' · ')}</span></div>
        <button type="button" onClick={cerrar} className="grid h-10 w-10 place-items-center rounded-full bg-[rgba(255,255,255,.1)]" aria-label="Cerrar"><Ic n="x" s={20} /></button>
      </div>
      <div className="relative mx-auto flex min-h-0 w-full max-w-[460px] flex-1 items-center justify-center px-3">
        <div className="relative h-full max-h-[78vh] w-full overflow-hidden rounded-[22px] bg-black" style={{ aspectRatio: '9 / 16' }}>
          <iframe key={v.id} src={embed(v)} title={v.titulo} className="absolute inset-0 h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[460px] px-5 pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-3 text-onc">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {v.paso && <span className="mb-1.5 inline-block rounded-full bg-menta px-2.5 py-[2px] text-[11.5px] font-bold text-mentaink">{v.paso}</span>}
            <p className="m-0 text-[16px] font-semibold leading-snug">{v.titulo}</p>
          </div>
          <button type="button" onClick={async () => { try { await meSirveVideoFS(v.id, myUid, sirve); } catch (e) { avisar('No se pudo guardar.', 'warn'); } }} aria-pressed={sirve} className={cx('flex flex-none flex-col items-center gap-0.5 rounded-full px-2 py-1 text-[11.5px] font-semibold', sirve ? 'text-menta' : 'text-onc')} aria-label="Me sirve">
            <Ic n="heart" s={24} className={sirve ? 'salta fill-current' : ''} />{(v.likedBy || []).length}
          </button>
        </div>
        <div className="mt-3 flex justify-between text-[12.5px] font-semibold text-panelink2">
          <button type="button" onClick={() => ir(-1)} disabled={i === 0} className="disabled:opacity-30">← Anterior</button>
          <span>{i + 1} de {videos.length}</span>
          <button type="button" onClick={() => ir(1)}>{i === videos.length - 1 ? 'Terminar' : 'Siguiente →'}</button>
        </div>
      </div>
    </div>
  );
}

function SubirVideo({ cerrar }) {
  const { myUid, perfil, avisar } = useApp();
  const [f, setF] = useState({ url: '', titulo: '', paso: '', especialidad: '', sinPaciente: false });
  const [err, setErr] = useState('');
  const v = leerVideo(f.url);
  const enviar = async () => {
    if (!v) return setErr('Pega un enlace de YouTube o Vimeo.');
    if (f.titulo.trim().length < 6) return setErr('Ponle un título: qué técnica muestra.');
    if (!f.sinPaciente) return setErr('Confirma que el video no muestra la cara ni datos de un paciente.');
    if (datosPersonales(f.titulo + ' ' + f.paso).length) return setErr('El texto trae datos personales. Quítalos.');
    try { await subirVideoFS({ ...v, url: f.url.trim(), titulo: f.titulo.trim(), paso: f.paso.trim().slice(0, 30), especialidad: f.especialidad, autor: { uid: myUid, nombre: (perfil && perfil.nombre) || '' } }); avisar('Video publicado'); cerrar(); }
    catch (e) { setErr('No se pudo publicar. Revisa tu conexión.'); }
  };
  return (
    <Modal open onClose={cerrar} title="Subir un caso en 60 segundos">
      <div className="flex flex-col gap-3.5 p-4 sm:p-5">
        <Field label="Enlace del video" id="sv-url" hint={v ? (v.plataforma === 'youtube' ? 'YouTube detectado' : 'Vimeo detectado') : 'YouTube (también Shorts) o Vimeo. Puede ser «no listado».'} error={f.url && !v ? 'No reconozco el enlace.' : ''}>
          <input id="sv-url" value={f.url} onChange={(e) => { setF({ ...f, url: e.target.value }); setErr(''); }} placeholder="https://youtube.com/shorts/…" className={cx(inputCls, f.url && !v && inputErr)} />
        </Field>
        <Field label="Título" id="sv-tit"><input id="sv-tit" value={f.titulo} onChange={(e) => { setF({ ...f, titulo: e.target.value }); setErr(''); }} placeholder="Grabado incremental en clase II" className={inputCls} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Rótulo corto (opcional)" id="sv-paso" hint="Se ve en la historia, hasta 30 letras."><input id="sv-paso" maxLength={30} value={f.paso} onChange={(e) => setF({ ...f, paso: e.target.value })} placeholder="Paso 3 · Capas" className={inputCls} /></Field>
          <Field label="Especialidad" id="sv-esp"><select id="sv-esp" value={f.especialidad} onChange={(e) => setF({ ...f, especialidad: e.target.value })} className={inputCls}><option value="">Elige</option>{INTERESES.map((a) => <option key={a}>{a}</option>)}</select></Field>
        </div>
        <label className="flex items-start gap-2.5 text-[13px] leading-snug text-ink2"><input type="checkbox" checked={f.sinPaciente} onChange={(e) => { setF({ ...f, sinPaciente: e.target.checked }); setErr(''); }} className="mt-0.5 accent-[var(--acento)]" />El video no muestra la cara, la voz ni datos de un paciente.</label>
        {err && <p className="m-0 text-[12.5px] font-semibold text-bad">{err}</p>}
        <div className="flex gap-2"><Btn v="primary" icon="send" onClick={enviar}>Publicar</Btn><Btn onClick={cerrar}>Cancelar</Btn></div>
      </div>
    </Modal>
  );
}

/* ═════════ Desafío del día ═════════ */
function useDesafioHoy() {
  const desafios = useDesafios(true);
  const hoy = dia();
  return desafios.find((d) => d.fecha <= hoy) || null;
}
// La racha cuenta días seguidos respondiendo (aciertes o no): lo que se premia es volver
function nuevaRacha(r) {
  const hoy = dia();
  if (r && r.ultimo === hoy) return r;
  const dias = r && r.ultimo === ayer() ? (r.dias || 0) + 1 : 1;
  return { dias, mejor: Math.max(dias, (r && r.mejor) || 0), ultimo: hoy };
}
function Racha({ r, oscuro }) {
  const dias = r && (r.ultimo === dia() || r.ultimo === ayer()) ? r.dias : 0;
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-bold', oscuro ? 'bg-[rgba(255,255,255,.1)] text-menta' : 'bg-acentosoft text-acentodeep')} title={'Tu mejor racha: ' + ((r && r.mejor) || 0) + ' días'}>
      <svg width="14" height="16" viewBox="0 0 28 32" aria-hidden="true"><path d="M14 4c4-3 12-3 12 6 0 6-3 9-4 15-1 5-2 7-4 7-3 0-3-7-4-11-1 4-1 11-4 11-2 0-3-2-4-7C5 19 2 16 2 10 2 1 10 1 14 4z" fill="currentColor" /></svg>
      {dias} {dias === 1 ? 'día' : 'días'}
    </span>
  );
}

export function DesafioHoy() {
  const { myUid, esRevisor, avisar } = useApp();
  const d = useDesafioHoy();
  const respuestas = useRespuestasDesafio(d && d.id);
  const racha = useRacha(myUid);
  const [crear, setCrear] = useState(false);
  const mia = respuestas.find((x) => x.uid === myUid);
  const aciertos = respuestas.length ? Math.round((respuestas.filter((x) => x.correcta).length * 100) / respuestas.length) : 0;
  const responder = async (k) => {
    if (mia || !d) return;
    try {
      await responderDesafioFS(d.id, myUid, k, k === d.correcta);
      const r = nuevaRacha(racha); await guardarRachaFS(myUid, r);
      avisar(k === d.correcta ? '¡Correcto! Racha de ' + r.dias + (r.dias === 1 ? ' día' : ' días') : 'Sumaste un día a tu racha: ' + r.dias, k === d.correcta ? 'ok' : undefined);
    } catch (e) { avisar('No se pudo guardar tu respuesta.', 'warn'); }
  };
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-[24px] bg-deep p-5 text-onc" aria-label="Desafío del día">
      <div className="flex items-center gap-2">
        <span className="text-[11.5px] font-bold uppercase tracking-[.14em] text-menta">Desafío del día</span>
        <span className="ml-auto"><Racha r={racha} oscuro /></span>
      </div>
      {!d ? (
        <>
          <p className="m-0 text-[17px] font-semibold leading-snug">{esRevisor ? 'Publica el desafío de hoy' : 'El desafío de hoy todavía no sale'}</p>
          <p className="m-0 text-[13px] leading-snug text-panelink2">{esRevisor ? 'Una pregunta de 2 a 4 opciones, con la explicación y su fuente. La responde toda la comunidad.' : 'Lo publica un docente. Cuando salga, respóndelo para sumar a tu racha.'}</p>
          {esRevisor && <button type="button" onClick={() => setCrear(true)} className="self-start rounded-full bg-menta px-4 py-2 text-[13.5px] font-semibold text-mentaink">Crear desafío</button>}
        </>
      ) : (
        <>
          {d.especialidad && <span className="self-start"><PillEsp esp={d.especialidad} /></span>}
          <p className="m-0 whitespace-pre-line text-[17px] font-semibold leading-snug">{d.pregunta}</p>
          <div className="flex flex-col gap-2">
            {d.opciones.map((o, k) => {
              const bien = mia && k === d.correcta, mal = mia && k === mia.opcion && !mia.correcta;
              return (
                <button key={k} type="button" disabled={!!mia} onClick={() => responder(k)}
                  className={cx('flex items-center gap-2.5 rounded-[14px] px-3.5 py-2.5 text-left text-[14px] transition-colors', bien ? 'bg-menta font-semibold text-mentaink' : mal ? 'bg-[rgba(162,74,72,.35)] text-onc' : mia ? 'bg-[rgba(255,255,255,.06)] text-panelink2' : 'bg-[rgba(255,255,255,.09)] text-onc hover:bg-[rgba(255,255,255,.16)]')}>
                  <b className="grid h-6 w-6 flex-none place-items-center rounded-full bg-[rgba(255,255,255,.14)] text-[12px]">{bien ? <Ic n="check" s={13} sw={2.8} /> : String.fromCharCode(65 + k)}</b>
                  <span className="min-w-0 flex-1">{o}</span>
                </button>
              );
            })}
          </div>
          {mia ? (
            <div className="aparece flex flex-col gap-1.5 rounded-[16px] bg-[rgba(255,255,255,.07)] p-3.5">
              <b className="text-[13.5px] text-menta">{mia.correcta ? 'Correcto' : 'La respuesta era la ' + String.fromCharCode(65 + d.correcta)} · acertó el {aciertos} % de {respuestas.length} {respuestas.length === 1 ? 'persona' : 'personas'}</b>
              {d.explicacion && <p className="m-0 whitespace-pre-line text-[13.5px] leading-relaxed text-panelink">{d.explicacion}</p>}
              <span className="text-[11.5px] text-panelink2">Por {d.autor.nombre}. Mañana hay otro.</span>
            </div>
          ) : <span className="text-[12px] text-panelink2">Responde para ver la explicación y cuántos acertaron.</span>}
          {esRevisor && <button type="button" onClick={() => setCrear(true)} className="self-start text-[12.5px] font-semibold text-menta underline">Programar otro desafío</button>}
        </>
      )}
      {crear && <CrearDesafio cerrar={() => setCrear(false)} />}
    </section>
  );
}

function CrearDesafio({ cerrar }) {
  const { myUid, perfil, avisar } = useApp();
  const [f, setF] = useState({ fecha: dia(), pregunta: '', opciones: ['', '', '', ''], correcta: 0, explicacion: '', especialidad: '' });
  const [err, setErr] = useState('');
  const ops = f.opciones.map((o) => o.trim());
  const enviar = async () => {
    const llenas = ops.filter(Boolean);
    if (f.pregunta.trim().length < 15) return setErr('Escribe la pregunta completa.');
    if (llenas.length < 2 || ops.slice(0, llenas.length).some((o) => !o)) return setErr('Escribe al menos dos opciones, sin dejar huecos entre ellas.');
    if (!ops[f.correcta]) return setErr('Marca cuál es la correcta.');
    if (f.explicacion.trim().length < 20) return setErr('Explica la respuesta, y si tiene fuente, cítala.');
    if (datosPersonales([f.pregunta, ...ops, f.explicacion].join(' ')).length) return setErr('El texto trae datos que identifican a alguien. Quítalos.');
    try { await crearDesafioFS({ fecha: f.fecha, pregunta: f.pregunta.trim(), opciones: llenas, correcta: f.correcta, explicacion: f.explicacion.trim(), especialidad: f.especialidad, autor: { uid: myUid, nombre: (perfil && perfil.nombre) || '' } }); avisar('Desafío programado para el ' + f.fecha.split('-').reverse().join('-')); cerrar(); }
    catch (e) { setErr('No se pudo guardar. Revisa tu conexión.'); }
  };
  return (
    <Modal open onClose={cerrar} title="Crear un desafío del día">
      <div className="flex flex-col gap-3.5 p-4 text-ink sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Día" id="cd-fecha"><input id="cd-fecha" type="date" value={f.fecha} min={dia()} onChange={(e) => setF({ ...f, fecha: e.target.value })} className={inputCls} /></Field>
          <Field label="Especialidad" id="cd-esp"><select id="cd-esp" value={f.especialidad} onChange={(e) => setF({ ...f, especialidad: e.target.value })} className={inputCls}><option value="">Elige</option>{INTERESES.map((a) => <option key={a}>{a}</option>)}</select></Field>
        </div>
        <Field label="Pregunta" id="cd-preg"><textarea id="cd-preg" rows={3} maxLength={600} value={f.pregunta} onChange={(e) => { setF({ ...f, pregunta: e.target.value }); setErr(''); }} placeholder="Ej.: ¿Cuál es el espesor máximo de cada capa de resina convencional al fotopolimerizar?" className={cx(inputCls, 'resize-y')} /></Field>
        <div className="flex flex-col gap-2">
          <span className="text-[12.5px] font-semibold text-ink2">Opciones (toca la letra de la correcta)</span>
          {f.opciones.map((o, k) => (
            <div key={k} className="flex items-center gap-2">
              <button type="button" onClick={() => setF({ ...f, correcta: k })} aria-pressed={f.correcta === k} aria-label={'Marcar la ' + String.fromCharCode(65 + k) + ' como correcta'} className={cx('grid h-9 w-9 flex-none place-items-center rounded-full text-[13px] font-bold', f.correcta === k ? 'bg-ok text-onc' : 'bg-soft text-ink2')}>{f.correcta === k ? <Ic n="check" s={15} sw={2.6} /> : String.fromCharCode(65 + k)}</button>
              <input value={o} maxLength={160} onChange={(e) => { setF({ ...f, opciones: f.opciones.map((x, i) => (i === k ? e.target.value : x)) }); setErr(''); }} placeholder={k < 2 ? 'Opción ' + String.fromCharCode(65 + k) : 'Opción ' + String.fromCharCode(65 + k) + ' (opcional)'} aria-label={'Opción ' + String.fromCharCode(65 + k)} className={cx(inputCls, '!py-2')} />
            </div>
          ))}
        </div>
        <Field label="Explicación" id="cd-exp" hint="Se muestra después de responder. Si te apoyas en una guía o artículo, cítalo."><textarea id="cd-exp" rows={3} value={f.explicacion} onChange={(e) => { setF({ ...f, explicacion: e.target.value }); setErr(''); }} className={cx(inputCls, 'resize-y')} /></Field>
        {err && <p className="m-0 text-[12.5px] font-semibold text-bad">{err}</p>}
        <div className="flex gap-2"><Btn v="primary" icon="check" onClick={enviar}>Programar</Btn><Btn onClick={cerrar}>Cancelar</Btn></div>
      </div>
    </Modal>
  );
}

/* ═════════ Ronda clínica en vivo ═════════ */
const fin = (r) => new Date(new Date(r.inicio).getTime() + (r.duracion || 60) * 60000);
export const estadoRonda = (r, ahora = Date.now()) => (ahora < new Date(r.inicio).getTime() ? 'proxima' : ahora <= fin(r).getTime() ? 'envivo' : 'pasada');
function useAhora(ms = 30000) { const [t, setT] = useState(Date.now()); useEffect(() => { const i = setInterval(() => setT(Date.now()), ms); return () => clearInterval(i); }, [ms]); return t; }
function falta(r, ahora) {
  const s = Math.max(0, Math.round((new Date(r.inicio).getTime() - ahora) / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d ? d + ' d ' + h + ' h' : h ? h + ' h ' + m + ' min' : m + ' min';
}
const horaRonda = (r) => new Date(r.inicio).toLocaleString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
// Agregar al calendario: un archivo .ics que abren Google Calendar, Apple y Outlook
function bajarIcs(r) {
  const z = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (t) => String(t || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Criterium//Ronda//ES', 'BEGIN:VEVENT', 'UID:' + r.id + '@criterium', 'DTSTAMP:' + z(new Date()), 'DTSTART:' + z(new Date(r.inicio)), 'DTEND:' + z(fin(r)), 'SUMMARY:' + esc('Ronda en vivo · ' + r.titulo), 'DESCRIPTION:' + esc((r.descripcion || '') + (r.enlace ? '\n' + r.enlace : '')), r.enlace ? 'URL:' + r.enlace : '', 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'ronda-criterium.ics'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export function RondaCard() {
  const { myUid, esRevisor, go, avisar, abrirRonda } = useApp();
  const rondas = useRondas(true);
  const ahora = useAhora();
  const [crear, setCrear] = useState(false);
  const r = useMemo(() => {
    const vivas = rondas.filter((x) => estadoRonda(x, ahora) === 'envivo');
    const prox = rondas.filter((x) => estadoRonda(x, ahora) === 'proxima').sort((a, b) => a.inicio.localeCompare(b.inicio));
    return vivas[0] || prox[0] || null;
  }, [rondas, ahora]);
  const vivo = r && estadoRonda(r, ahora) === 'envivo';
  const anotado = r && (r.asistentes || []).includes(myUid);
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-[24px] bg-card p-5 shadow-sh" aria-label="Ronda clínica en vivo">
      <div className="flex items-center gap-2">
        {vivo ? <span className="en-vivo inline-flex items-center gap-1.5 rounded-full bg-bad px-2.5 py-[3px] text-[11px] font-bold uppercase tracking-[.1em] text-onc"><span className="h-1.5 w-1.5 rounded-full bg-onc" />En vivo</span>
          : <span className="text-[11.5px] font-bold uppercase tracking-[.14em] text-rotulo">Ronda en vivo</span>}
        {r && !vivo && <span className="ml-auto rounded-full bg-soft px-2.5 py-1 text-[12px] font-bold tabular-nums text-acentodeep">en {falta(r, ahora)}</span>}
      </div>
      {!r ? (
        <>
          <p className="m-0 text-[17px] font-semibold leading-snug text-deep">{esRevisor ? 'Programa una ronda clínica' : 'Pronto, casos discutidos en vivo'}</p>
          <p className="m-0 text-[13px] leading-snug text-ink3">{esRevisor ? 'Elige un día, tres casos y una videollamada. La comunidad se anota y conversa en el chat.' : 'Un docente presenta casos y los discutimos juntos. Te avisamos cuando haya una.'}</p>
          {esRevisor ? <Btn v="primary" className="self-start" icon="plus" onClick={() => setCrear(true)}>Programar ronda</Btn> : <button type="button" onClick={() => go('rondas')} className="self-start text-[13px] font-semibold text-acento">Ver rondas anteriores</button>}
        </>
      ) : (
        <>
          <button type="button" onClick={() => abrirRonda(r.id)} className="text-left"><p className="m-0 text-[17px] font-semibold leading-snug text-deep hover:underline">{r.titulo}</p></button>
          <p className="m-0 text-[13px] capitalize-first text-ink3">{horaRonda(r)} · {r.autor.nombre}</p>
          <div className="flex items-center gap-2 text-[12.5px] text-ink3"><span className="flex">{(r.asistentes || []).slice(0, 4).map((u, k) => <span key={u} className={cx('h-6 w-6 rounded-full bg-acentosoft ring-2 ring-card', k && '-ml-2')} />)}</span>{(r.asistentes || []).length} {(r.asistentes || []).length === 1 ? 'anotado' : 'anotados'}</div>
          <div className="flex flex-wrap gap-2">
            {vivo ? <Btn v="primary" icon="video" onClick={() => abrirRonda(r.id)}>Entrar a la ronda</Btn>
              : <Btn v={anotado ? 'outline' : 'primary'} icon={anotado ? 'check' : 'clock'} onClick={async () => { try { await avisameRondaFS(r.id, myUid, anotado); avisar(anotado ? 'Ya no estás anotado' : 'Anotado. Agrégala a tu calendario para no olvidarla.'); } catch (e) { avisar('No se pudo guardar.', 'warn'); } }}>{anotado ? 'Anotado' : 'Avísame'}</Btn>}
            {!vivo && <Btn onClick={() => bajarIcs(r)}>Al calendario</Btn>}
          </div>
        </>
      )}
      {crear && <CrearRonda cerrar={() => setCrear(false)} />}
    </section>
  );
}

function CrearRonda({ cerrar }) {
  const { myUid, perfil, avisar, abrirRonda } = useApp();
  const man = new Date(); man.setDate(man.getDate() + 1);
  const [f, setF] = useState({ titulo: '', descripcion: '', especialidad: '', fecha: dia(man), hora: '20:00', duracion: '60', enlace: '' });
  const [err, setErr] = useState('');
  const enviar = async () => {
    if (f.titulo.trim().length < 6) return setErr('Ponle un título a la ronda.');
    const inicio = new Date(f.fecha + 'T' + f.hora);
    if (isNaN(inicio.getTime()) || inicio.getTime() < Date.now() - 60000) return setErr('Elige un día y una hora que todavía no pasen.');
    if (f.enlace && !/^https:\/\/\S+$/.test(f.enlace.trim())) return setErr('El enlace de la videollamada debe empezar con https://');
    if (datosPersonales(f.titulo + ' ' + f.descripcion).length) return setErr('El texto trae datos que identifican a alguien. Quítalos.');
    try { const id = await crearRondaFS({ titulo: f.titulo.trim(), descripcion: f.descripcion.trim(), especialidad: f.especialidad, inicio: inicio.toISOString(), duracion: +f.duracion, enlace: f.enlace.trim(), autor: { uid: myUid, nombre: (perfil && perfil.nombre) || '' } }); avisar('Ronda programada'); cerrar(); abrirRonda(id); }
    catch (e) { setErr('No se pudo programar. Revisa tu conexión.'); }
  };
  return (
    <Modal open onClose={cerrar} title="Programar una ronda en vivo">
      <div className="flex flex-col gap-3.5 p-4 text-ink sm:p-5">
        <Field label="Título" id="cr-tit"><input id="cr-tit" value={f.titulo} onChange={(e) => { setF({ ...f, titulo: e.target.value }); setErr(''); }} placeholder="Tres casos de endodoncia en premolares" className={inputCls} /></Field>
        <Field label="De qué se trata (opcional)" id="cr-desc"><textarea id="cr-desc" rows={2} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} className={cx(inputCls, 'resize-y')} /></Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Día" id="cr-dia" className="col-span-2 sm:col-span-1"><input id="cr-dia" type="date" min={dia()} value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} className={inputCls} /></Field>
          <Field label="Hora" id="cr-hora"><input id="cr-hora" type="time" value={f.hora} onChange={(e) => setF({ ...f, hora: e.target.value })} className={inputCls} /></Field>
          <Field label="Duración" id="cr-dur"><select id="cr-dur" value={f.duracion} onChange={(e) => setF({ ...f, duracion: e.target.value })} className={inputCls}>{['30', '45', '60', '90'].map((d) => <option key={d} value={d}>{d} min</option>)}</select></Field>
          <Field label="Especialidad" id="cr-esp" className="col-span-2 sm:col-span-1"><select id="cr-esp" value={f.especialidad} onChange={(e) => setF({ ...f, especialidad: e.target.value })} className={inputCls}><option value="">Elige</option>{INTERESES.map((a) => <option key={a}>{a}</option>)}</select></Field>
        </div>
        <Field label="Enlace de la videollamada (opcional)" id="cr-link" hint="Meet, Zoom o Teams. Se muestra solo cuando la ronda empieza."><input id="cr-link" value={f.enlace} onChange={(e) => { setF({ ...f, enlace: e.target.value }); setErr(''); }} placeholder="https://meet.google.com/…" className={inputCls} /></Field>
        {err && <p className="m-0 text-[12.5px] font-semibold text-bad">{err}</p>}
        <div className="flex gap-2"><Btn v="primary" icon="check" onClick={enviar}>Programar</Btn><Btn onClick={cerrar}>Cancelar</Btn></div>
      </div>
    </Modal>
  );
}

/* La lista de rondas y el detalle con chat */
export function Rondas() {
  const { esRevisor, abrirRonda } = useApp();
  const rondas = useRondas(true);
  const ahora = useAhora();
  const [crear, setCrear] = useState(false);
  const prox = rondas.filter((r) => estadoRonda(r, ahora) !== 'pasada').sort((a, b) => a.inicio.localeCompare(b.inicio));
  const pasadas = rondas.filter((r) => estadoRonda(r, ahora) === 'pasada');
  const fila = (r) => (
    <button key={r.id} type="button" onClick={() => abrirRonda(r.id)} className="flex items-center gap-3.5 rounded-[20px] bg-card p-4 text-left shadow-sh transition-shadow hover:shadow-shlg">
      <span className={cx('grid h-12 w-12 flex-none place-items-center rounded-[14px]', estadoRonda(r, ahora) === 'envivo' ? 'bg-bad text-onc' : 'bg-deep text-menta')}><Ic n="video" s={20} /></span>
      <span className="min-w-0 flex-1"><b className="block truncate text-[15px] text-ink">{r.titulo}</b><span className="block truncate text-[12.5px] text-ink3">{horaRonda(r)} · {r.autor.nombre}</span></span>
      {estadoRonda(r, ahora) === 'envivo' ? <span className="text-[12px] font-bold text-bad">EN VIVO</span> : estadoRonda(r, ahora) === 'proxima' ? <span className="text-[12px] font-semibold tabular-nums text-acento">en {falta(r, ahora)}</span> : <span className="text-[12px] text-ink3">{(r.mensajes || []).length} mensajes</span>}
    </button>
  );
  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="rotulo m-0 mb-1.5">Rondas clínicas</p><h1 className="m-0 text-[28px] font-bold tracking-[-.025em] text-deep">Casos discutidos en vivo</h1></div>
        {esRevisor && <Btn v="primary" icon="plus" onClick={() => setCrear(true)}>Programar ronda</Btn>}
      </header>
      {prox.length === 0 && pasadas.length === 0 ? <Vacio icon="video" titulo="Todavía no hay rondas">{esRevisor ? 'Programa la primera: un día, unos casos y una videollamada.' : 'Cuando un docente programe una, aparece aquí y en tu inicio.'}</Vacio> : null}
      {prox.length > 0 && <section className="flex flex-col gap-3"><h2 className="m-0 text-[15px] font-bold text-ink">Próximas</h2>{prox.map(fila)}</section>}
      {pasadas.length > 0 && <section className="flex flex-col gap-3"><h2 className="m-0 text-[15px] font-bold text-ink">Anteriores</h2>{pasadas.map(fila)}</section>}
      {crear && <CrearRonda cerrar={() => setCrear(false)} />}
    </div>
  );
}

export function Ronda() {
  const { rondaId, myUid, perfil, go, avisar } = useApp();
  const rondas = useRondas(true);
  const ahora = useAhora(15000);
  const r = rondas.find((x) => x.id === rondaId);
  const [txt, setTxt] = useState('');
  const [borrar, setBorrar] = useState(false);
  const fondo = useRef(null);
  const n = r ? (r.mensajes || []).length : 0;
  useEffect(() => { if (fondo.current) fondo.current.scrollTop = fondo.current.scrollHeight; }, [n]);
  const volver = <button type="button" onClick={() => go('rondas')} className="inline-flex items-center gap-1.5 self-start rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] text-ink2 hover:bg-soft"><Ic n="back" s={14} />Rondas</button>;
  if (!r) return <div className="mx-auto flex max-w-[760px] flex-col gap-4">{volver}<div className="h-60 animate-pulse rounded-[22px] bg-soft" /></div>;
  const est = estadoRonda(r, ahora);
  const anotado = (r.asistentes || []).includes(myUid);
  const enviar = async (e) => {
    e.preventDefault(); const t = txt.trim(); if (!t) return;
    if (datosPersonales(t).length) return avisar('El mensaje trae datos que identifican a alguien. Quítalos.', 'warn');
    try { await mensajeRondaFS(r.id, { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), autor: { uid: myUid, nombre: (perfil && perfil.nombre) || '' }, txt: t.slice(0, 500), fecha: new Date().toISOString() }); setTxt(''); }
    catch (er) { avisar('No se pudo enviar.', 'warn'); }
  };
  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5">
      {volver}
      <section className="relative overflow-hidden rounded-[26px] bg-deep p-6 text-onc sm:p-8">
        <span className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-menta opacity-20 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center gap-2">
          {est === 'envivo' ? <span className="en-vivo inline-flex items-center gap-1.5 rounded-full bg-bad px-2.5 py-[3px] text-[11px] font-bold uppercase tracking-[.1em]"><span className="h-1.5 w-1.5 rounded-full bg-onc" />En vivo</span>
            : <span className="rounded-full bg-[rgba(255,255,255,.1)] px-2.5 py-[3px] text-[11.5px] font-bold text-menta">{est === 'proxima' ? 'Empieza en ' + falta(r, ahora) : 'Terminó'}</span>}
          {r.especialidad && <PillEsp esp={r.especialidad} />}
        </div>
        <h1 className="relative m-0 mt-3 text-[26px] font-bold leading-tight tracking-[-.02em] sm:text-[30px]">{r.titulo}</h1>
        <p className="relative m-0 mt-1.5 text-[14px] text-panelink2"><span className="capitalize-first">{horaRonda(r)}</span> · {r.duracion} min · con {r.autor.nombre}</p>
        {r.descripcion && <p className="relative m-0 mt-3 max-w-[60ch] whitespace-pre-line text-[14.5px] leading-relaxed text-panelink">{r.descripcion}</p>}
        <div className="relative mt-5 flex flex-wrap gap-2">
          {est === 'envivo' && r.enlace && <a href={r.enlace} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-menta px-5 text-[14.5px] font-semibold text-mentaink"><Ic n="video" s={17} />Entrar a la videollamada</a>}
          {est === 'proxima' && <button type="button" onClick={async () => { try { await avisameRondaFS(r.id, myUid, anotado); } catch (e) { avisar('No se pudo guardar.', 'warn'); } }} className={cx('inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14.5px] font-semibold', anotado ? 'bg-[rgba(255,255,255,.12)] text-onc' : 'bg-menta text-mentaink')}><Ic n={anotado ? 'check' : 'clock'} s={17} />{anotado ? 'Anotado' : 'Avísame'}</button>}
          {est === 'proxima' && <button type="button" onClick={() => bajarIcs(r)} className="inline-flex h-11 items-center gap-2 rounded-full bg-[rgba(255,255,255,.12)] px-5 text-[14.5px] font-semibold text-onc"><Ic n="download" s={16} />Agregar al calendario</button>}
        </div>
        <p className="relative m-0 mt-4 text-[12.5px] text-panelink2">{(r.asistentes || []).length} {(r.asistentes || []).length === 1 ? 'persona anotada' : 'personas anotadas'}{est === 'proxima' && r.enlace ? ' · el enlace aparece cuando empiece' : ''}</p>
      </section>
      <section className="flex flex-col overflow-hidden rounded-[22px] bg-card shadow-sh" aria-label="Chat de la ronda">
        <h2 className="m-0 border-b border-line2 px-5 py-3.5 text-[15px] font-bold text-ink">Chat de la ronda</h2>
        <div ref={fondo} className="flex max-h-[420px] min-h-[180px] flex-col gap-3 overflow-y-auto px-5 py-4">
          {n === 0 ? <p className="m-auto text-center text-[13.5px] text-ink3">{est === 'pasada' ? 'Nadie escribió en esta ronda.' : 'Escribe tu pregunta para el docente. Nunca datos de pacientes.'}</p>
            : r.mensajes.map((m) => (
              <div key={m.id} className={cx('flex gap-2.5', m.autor.uid === myUid && 'flex-row-reverse')}>
                <Avatar nombre={m.autor.nombre} size={28} />
                <div className={cx('max-w-[78%] rounded-[16px] px-3.5 py-2', m.autor.uid === myUid ? 'bg-acento text-onc' : m.autor.uid === r.autor.uid ? 'bg-deep text-onc' : 'bg-soft text-ink')}>
                  <span className={cx('block text-[11.5px] font-semibold', m.autor.uid === myUid || m.autor.uid === r.autor.uid ? 'text-menta' : 'text-acentodeep')}>{m.autor.uid === myUid ? 'Tú' : m.autor.nombre}{m.autor.uid === r.autor.uid ? ' · presenta' : ''}</span>
                  <p className="m-0 whitespace-pre-line text-[14px] leading-snug">{m.txt}</p>
                </div>
              </div>
            ))}
        </div>
        {est !== 'pasada' && (
          <form onSubmit={enviar} className="flex gap-2 border-t border-line2 p-3">
            <input value={txt} maxLength={500} onChange={(e) => setTxt(e.target.value)} placeholder="Escribe un mensaje" aria-label="Mensaje" className={cx(inputCls, 'flex-1')} />
            <Btn v="primary" type="submit" icon="send" onClick={enviar}>Enviar</Btn>
          </form>
        )}
      </section>
      {r.autor.uid === myUid && (borrar
        ? <div className="flex gap-3 text-[13px] font-semibold"><span className="text-bad">¿Borrar la ronda y su chat?</span><button type="button" onClick={async () => { try { await borrarRondaFS(r.id); go('rondas'); } catch (e) { avisar('No se pudo borrar.', 'warn'); } }} className="text-bad underline">Borrar</button><button type="button" onClick={() => setBorrar(false)} className="text-ink3 underline">No</button></div>
        : <button type="button" onClick={() => setBorrar(true)} className="self-start text-[13px] font-semibold text-ink3 hover:text-bad">Borrar la ronda</button>)}
    </div>
  );
}

/* ═════════ Hoy en Criterium: arriba del feed ═════════ */
export function Hoy() {
  const { perfil } = useApp();
  const nombre = ((perfil && perfil.nombre) || '').split(' ')[0];
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="m-0 text-[13px] font-semibold capitalize-first text-ink3">{FECHA_LARGA()}</p>
        <p className="m-0 text-[26px] font-bold tracking-[-.02em] text-deep sm:text-[30px]">{saludo()}{nombre ? ', ' + nombre : ''}</p>
      </div>
      <Historias />
      <div className="grid gap-4 md:grid-cols-[1.15fr_1fr]">
        <DesafioHoy />
        <RondaCard />
      </div>
    </div>
  );
}
