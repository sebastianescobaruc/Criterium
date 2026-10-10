// Criterium Red · Chat: mensajes directos entre colegas, al estilo de Instagram.
// - Con quien sigues o te sigue, el chat es libre. Con cualquier otra persona mandas UN mensaje (una solicitud): no puedes
//   escribir más hasta que te responda; si la elimina, queda cerrado. Se puede bloquear. Todo esto lo validan también las
//   reglas de Firestore (chats/, bloqueos/), no solo esta pantalla.
// - Nunca datos de pacientes: un RUT, un número de ficha o «paciente: Nombre» no se envían; un teléfono o un correo, avisa.
// Escritorio: lista a la izquierda y conversación a la derecha. Celular: una pantalla a la vez.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../ctx.js';
import { usePerfiles, useMensajesChat, enviarMensajeChatFS, marcarLeidoChatFS, rechazarSolicitudFS, useBloqueos, meBloqueoFS, bloquearFS, desbloquearFS, idChat } from '../db.js';
import { datosPersonales } from '../logic.js';
import { ETAPAS } from '../views/red.jsx';
import { Ic, Avatar, Modal, inputCls, cx } from '../ui.jsx';

const BLOQUEA = ['un RUT', 'un número de ficha', 'un nombre'];
const AVISA = ['un teléfono', 'un correo'];
const INICIOS = ['Hola, vi tu caso y tengo una pregunta', '¿Me recomiendas bibliografía sobre este tema?', '¿Coordinamos una interconsulta?'];
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const rolDe = (pf) => (pf && pf.rol ? (ETAPAS.find((e) => e.v === pf.rol) || { t: pf.rol }).t : '');
const otroDe = (c, yo) => c.miembros.find((u) => u !== yo) || yo;
export const noLeido = (c, yo) => !!(c.ultimo && c.ultimo.autor !== yo && (!(c.leido || {})[yo] || c.leido[yo] < c.ultimo.fecha) && !(c.estado === 'rechazado'));
export const contarNoLeidos = (chats, yo) => (chats || []).filter((c) => noLeido(c, yo)).length;
function horaCorta(iso) {
  if (!iso) return '';
  const d = new Date(iso), hoy = new Date(); const dias = Math.floor((new Date(hoy.toDateString()) - new Date(d.toDateString())) / 864e5);
  if (dias === 0) return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  if (dias === 1) return 'ayer';
  if (dias < 7) return d.toLocaleDateString('es-CL', { weekday: 'short' });
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}
function diaLargo(iso) {
  const d = new Date(iso), hoy = new Date(); const dias = Math.floor((new Date(hoy.toDateString()) - new Date(d.toDateString())) / 864e5);
  if (dias === 0) return 'Hoy'; if (dias === 1) return 'Ayer';
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
}
const subtitulo = (pf) => [rolDe(pf), pf && pf.institucion].filter(Boolean).join(' · ');

export function Chat() {
  const { myUid, chats, chatCon, setChatCon, siguiendo, seguidores } = useApp();
  const perfiles = usePerfiles(true);
  const porUid = useMemo(() => Object.fromEntries(perfiles.map((p) => [p.uid, p])), [perfiles]);
  const bloqueados = useBloqueos(myUid);
  const [tab, setTab] = useState('chats');
  const [q, setQ] = useState('');
  const [nuevo, setNuevo] = useState(false);
  const todos = (chats || []).filter((c) => !(c.estado === 'rechazado' && c.iniciadoPor !== myUid));
  const solicitudes = todos.filter((c) => c.estado === 'solicitud' && c.iniciadoPor !== myUid);
  const normales = todos.filter((c) => !(c.estado === 'solicitud' && c.iniciadoPor !== myUid));
  const ver = (tab === 'solicitudes' ? solicitudes : normales).filter((c) => !q || norm((porUid[otroDe(c, myUid)] || {}).nombre).includes(norm(q)));
  const chatActual = chatCon && (chats || []).find((c) => c.id === idChat(myUid, chatCon));
  const relacion = (u) => siguiendo.includes(u) || seguidores.includes(u);
  useEffect(() => { if (tab === 'solicitudes' && !solicitudes.length) setTab('chats'); }, [solicitudes.length]);

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="grid h-[calc(100dvh-190px)] min-h-[440px] overflow-hidden rounded-[24px] bg-card shadow-sh lg:h-[calc(100dvh-80px)] lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Lista */}
        <aside className={cx('min-h-0 flex-col border-line2 lg:flex lg:border-r', chatCon ? 'hidden' : 'flex')}>
          <div className="flex items-center gap-2 px-5 pb-3 pt-5">
            <h1 className="m-0 flex-1 text-[24px] font-bold tracking-[-.02em] text-deep">Chat</h1>
            <button type="button" onClick={() => setNuevo(true)} aria-label="Nuevo mensaje" className="grid h-10 w-10 place-items-center rounded-full bg-[linear-gradient(135deg,var(--acento),var(--deep))] text-onc shadow-sh transition-transform active:scale-95"><Ic n="edit" s={18} /></button>
          </div>
          <div className="px-4 pb-3">
            <label className="flex items-center gap-2 rounded-full bg-soft px-3.5 py-2 text-ink3"><Ic n="search" s={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" aria-label="Buscar conversaciones" className="w-full bg-transparent text-[14.5px] text-ink outline-none placeholder:text-ink3" /></label>
          </div>
          <div className="flex gap-1 px-4 pb-2">
            {[['chats', 'Mensajes', 0], ['solicitudes', 'Solicitudes', solicitudes.length]].map(([k, t, n]) => (k === 'chats' || n > 0) && (
              <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k}
                className={cx('rounded-full px-3.5 py-1.5 text-[13.5px] font-semibold transition-colors', tab === k ? 'bg-deep text-onc' : 'text-ink2 hover:bg-soft')}>{t}{n > 0 && <span className={cx('ml-1.5 rounded-full px-1.5 text-[11px] font-bold', tab === k ? 'bg-menta text-mentaink' : 'bg-acentosoft text-acentodeep')}>{n}</span>}</button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pb-2">
            {chats === null ? <div className="mx-4 mt-2 h-40 animate-pulse rounded-[18px] bg-soft" />
              : !ver.length ? (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-acentosoft text-acento"><Ic n="chat" s={26} /></span>
                  <b className="text-[15px] text-ink">{q ? 'Sin resultados' : tab === 'solicitudes' ? 'Sin solicitudes' : 'Todavía no tienes mensajes'}</b>
                  {!q && tab === 'chats' && <><p className="m-0 text-[13.5px] text-ink2">Escríbele a un colega, a tu docente o a alguien de tu curso.</p><button type="button" onClick={() => setNuevo(true)} className="mt-1 rounded-full bg-acento px-4 py-2 text-[13.5px] font-semibold text-onc">Nuevo mensaje</button></>}
                </div>
              ) : ver.map((c) => {
                const o = otroDe(c, myUid), pf = porUid[o] || {}, nl = noLeido(c, myUid), activo = chatCon === o;
                const mio = c.ultimo && c.ultimo.autor === myUid;
                return (
                  <button key={c.id} type="button" onClick={() => setChatCon(o)} className={cx('flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-soft', activo && 'bg-soft')}>
                    <span className={cx('flex-none rounded-full', nl && 'ring-2 ring-menta ring-offset-2 ring-offset-card')}><Avatar nombre={pf.nombre || '?'} verificado={pf.verificado} size={50} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2"><b className={cx('min-w-0 flex-1 truncate text-[15px]', nl ? 'font-bold text-ink' : 'font-semibold text-ink')}>{pf.nombre || 'Usuario de Criterium'}</b><span className={cx('flex-none text-[12px]', nl ? 'font-bold text-acento' : 'text-ink3')}>{horaCorta(c.actualizado)}</span></span>
                      <span className={cx('mt-0.5 block truncate text-[13.5px]', nl ? 'font-semibold text-ink' : 'text-ink3')}>
                        {c.estado === 'solicitud' && c.iniciadoPor === myUid ? 'Solicitud enviada · ' : c.estado === 'rechazado' ? 'No aceptó tu mensaje · ' : ''}{mio ? 'Tú: ' : ''}{c.ultimo ? c.ultimo.txt : ''}
                      </span>
                    </span>
                  </button>
                );
              })}
          </div>
        </aside>

        {/* Conversación */}
        <section className={cx('min-h-0 min-w-0 flex-col lg:flex', chatCon ? 'flex' : 'hidden')}>
          {chatCon ? <Conversacion key={chatCon} otro={chatCon} pf={porUid[chatCon] || {}} chat={chatActual} relacion={relacion(chatCon)} bloqueado={bloqueados.includes(chatCon)} volver={() => setChatCon(null)} />
            : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
                <span className="grid h-20 w-20 place-items-center rounded-full bg-[linear-gradient(145deg,var(--acento-soft),var(--soft))] text-acento"><Ic n="chat" s={36} sw={1.5} /></span>
                <h2 className="m-0 text-[20px] font-bold text-deep">Tus mensajes</h2>
                <p className="m-0 max-w-[40ch] text-[14.5px] text-ink2">Conversa con colegas, docentes y compañeros de curso. Comenta casos y dudas clínicas, sin datos de pacientes.</p>
                <button type="button" onClick={() => setNuevo(true)} className="mt-1 rounded-full bg-[linear-gradient(135deg,var(--acento),var(--deep))] px-5 py-2.5 text-[14px] font-semibold text-onc shadow-sh">Nuevo mensaje</button>
              </div>
            )}
        </section>
      </div>
      {nuevo && <NuevoMensaje perfiles={perfiles} bloqueados={bloqueados} cerrar={() => setNuevo(false)} elegir={(u) => { setNuevo(false); setChatCon(u); }} />}
    </div>
  );
}

function Conversacion({ otro, pf, chat, relacion, bloqueado, volver }) {
  const { myUid, verPerfil, avisar } = useApp();
  const cid = idChat(myUid, otro);
  const msgs = useMensajesChat(chat ? cid : null, !!chat);
  const [meBloqueo, setMeBloqueo] = useState(false);
  const [txt, setTxt] = useState('');
  const [err, setErr] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [menu, setMenu] = useState(false);
  const caja = useRef(null), area = useRef(null);
  const nombre = pf.nombre || 'esta persona', corto = (pf.nombre || 'esta persona').split(' ')[0];
  useEffect(() => { let vivo = true; meBloqueoFS(myUid, otro).then((x) => vivo && setMeBloqueo(x)); return () => { vivo = false; }; }, [otro]);
  useEffect(() => { if (chat && noLeido(chat, myUid)) marcarLeidoChatFS(cid, myUid).catch(() => {}); }, [chat && chat.ultimo && chat.ultimo.fecha]);
  useEffect(() => { const el = caja.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs && msgs.length]);
  useEffect(() => { const el = area.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px'; }, [txt]);

  // ¿Puedo escribir?
  const soyIni = chat && chat.iniciadoPor === myUid;
  let cerrado = '';
  if (bloqueado) cerrado = `Bloqueaste a ${corto}.`;
  else if (meBloqueo) cerrado = 'No puedes enviar mensajes en este chat.';
  else if (chat && chat.estado === 'rechazado') cerrado = soyIni ? `${corto} no aceptó tu mensaje.` : 'Eliminaste esta solicitud.';
  else if (chat && chat.estado === 'solicitud' && soyIni && !relacion) cerrado = `Enviaste tu mensaje. Podrás seguir escribiendo cuando ${corto} te responda.`;
  const recibida = chat && chat.estado === 'solicitud' && !soyIni;
  const avisos = datosPersonales(txt).filter((x) => AVISA.includes(x));

  const enviar = async () => {
    const t = txt.trim(); if (!t || enviando || cerrado) return;
    const malos = datosPersonales(t).filter((x) => BLOQUEA.includes(x));
    if (malos.length) { setErr(`Quita ${malos.join(' y ')}: en el chat no se comparten datos que identifiquen a un paciente.`); return; }
    setEnviando(true);
    try { await enviarMensajeChatFS({ yo: myUid, otro, txt: t, chat, relacion }); setTxt(''); setErr(''); }
    catch (e) { setErr('No se pudo enviar. Revisa tu conexión.'); }
    finally { setEnviando(false); }
  };
  const bloquear = async () => { setMenu(false); try { bloqueado ? await desbloquearFS(myUid, otro) : await bloquearFS(myUid, otro); avisar(bloqueado ? `Desbloqueaste a ${corto}` : `Bloqueaste a ${corto}`); } catch (e) { avisar('No se pudo. Revisa tu conexión.', 'warn'); } };
  const eliminar = async () => { try { await rechazarSolicitudFS(cid); avisar('Solicitud eliminada'); volver(); } catch (e) { avisar('No se pudo eliminar.', 'warn'); } };

  return (
    <>
      <header className="flex items-center gap-3 border-b border-line2 px-3 py-2.5 sm:px-5">
        <button type="button" onClick={volver} aria-label="Volver a los mensajes" className="grid h-9 w-9 flex-none place-items-center rounded-full text-ink2 hover:bg-soft lg:hidden"><Ic n="back" s={20} /></button>
        <button type="button" onClick={() => verPerfil(otro)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <Avatar nombre={pf.nombre || '?'} verificado={pf.verificado} size={42} />
          <span className="min-w-0"><b className="block truncate text-[15.5px] text-ink">{pf.nombre || 'Usuario de Criterium'}</b><span className="block truncate text-[12.5px] text-ink3">{subtitulo(pf) || 'Criterium'}</span></span>
        </button>
        <div className="relative flex-none">
          <button type="button" onClick={() => setMenu(!menu)} aria-label="Opciones del chat" aria-expanded={menu} className="grid h-9 w-9 place-items-center rounded-full text-ink2 hover:bg-soft"><Ic n="dots" s={20} /></button>
          {menu && (
            <div className="absolute right-0 top-11 z-10 w-48 overflow-hidden rounded-[16px] bg-card py-1 shadow-shlg ring-1 ring-cardline">
              <button type="button" onClick={() => { setMenu(false); verPerfil(otro); }} className="block w-full px-4 py-2.5 text-left text-[14px] text-ink hover:bg-soft">Ver perfil</button>
              <button type="button" onClick={bloquear} className="block w-full px-4 py-2.5 text-left text-[14px] font-semibold text-bad hover:bg-soft">{bloqueado ? 'Desbloquear' : 'Bloquear'}</button>
            </div>
          )}
        </div>
      </header>

      <div ref={caja} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6" onClick={() => setMenu(false)}>
        {(!chat || (msgs && !msgs.length)) ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <Avatar nombre={pf.nombre || '?'} verificado={pf.verificado} size={84} />
            <b className="mt-1 text-[18px] text-deep">{pf.nombre || 'Usuario de Criterium'}</b>
            {subtitulo(pf) && <span className="text-[13.5px] text-ink2">{subtitulo(pf)}</span>}
            <button type="button" onClick={() => verPerfil(otro)} className="mt-1 rounded-full bg-soft px-4 py-1.5 text-[13px] font-semibold text-ink hover:bg-acentosoft">Ver perfil</button>
            {!cerrado && (
              <div className="mt-4 flex max-w-[420px] flex-wrap justify-center gap-2">
                {INICIOS.map((t) => <button key={t} type="button" onClick={() => { setTxt(t); area.current && area.current.focus(); }} className="rounded-full border border-cardline bg-card px-3.5 py-2 text-[13px] text-ink2 transition-colors hover:border-acento hover:text-acento">{t}</button>)}
              </div>
            )}
          </div>
        ) : msgs === null ? <div className="mx-auto h-24 w-2/3 animate-pulse rounded-[18px] bg-soft" /> : (
          <Burbujas msgs={msgs} yo={myUid} leidoOtro={(chat && chat.leido || {})[otro]} />
        )}
      </div>

      {recibida && !cerrado && (
        <div className="mx-3 mb-2 flex flex-col gap-2 rounded-[18px] bg-soft px-4 py-3 sm:mx-5">
          <p className="m-0 text-[13.5px] text-ink2"><b className="text-ink">{corto} te escribió.</b> No se siguen. Si respondes, el chat queda abierto.</p>
          <div className="flex gap-2"><button type="button" onClick={eliminar} className="rounded-full bg-card px-3.5 py-1.5 text-[13px] font-semibold text-ink ring-1 ring-cardline hover:bg-acentosoft">Eliminar</button><button type="button" onClick={bloquear} className="rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-bad hover:bg-badsoft">Bloquear</button></div>
        </div>
      )}

      <footer className="border-t border-line2 px-3 pb-3 pt-2.5 sm:px-5">
        {cerrado ? (
          <div className="flex flex-wrap items-center justify-center gap-2 py-1.5 text-center text-[13.5px] text-ink2">{cerrado}{bloqueado && <button type="button" onClick={bloquear} className="font-semibold text-acento">Desbloquear</button>}</div>
        ) : (
          <>
            {!chat && !relacion && <p className="m-0 mb-2 text-center text-[12.5px] text-ink3">Como no se siguen, puedes enviarle <b className="text-ink2">un solo mensaje</b>. Podrás seguir escribiendo cuando te responda.</p>}
            <div className="flex items-end gap-2">
              <textarea ref={area} value={txt} rows={1} maxLength={2000} onChange={(e) => { setTxt(e.target.value); setErr(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); enviar(); } }}
                placeholder={`Mensaje para ${corto}…`} aria-label="Escribe un mensaje"
                className={cx(inputCls, '!min-h-[44px] flex-1 resize-none !rounded-[22px] !py-2.5 leading-snug')} />
              <button type="button" onClick={enviar} disabled={!txt.trim() || enviando} aria-label="Enviar"
                className="grid h-11 w-11 flex-none place-items-center rounded-full bg-[linear-gradient(135deg,var(--acento),var(--deep))] text-onc shadow-sh transition-[transform,opacity] active:scale-90 disabled:opacity-40"><Ic n="send" s={18} /></button>
            </div>
            {err ? <p className="m-0 mt-1.5 text-[12.5px] font-semibold text-bad">{err}</p>
              : avisos.length ? <p className="m-0 mt-1.5 text-[12.5px] font-semibold text-warn">Vas a compartir {avisos.join(' y ')}. Que sea tuyo, nunca de un paciente.</p>
              : <p className="m-0 mt-1.5 text-center text-[11.5px] text-ink3">Solo ustedes dos ven estos mensajes. No compartas datos que identifiquen a un paciente.</p>}
          </>
        )}
      </footer>
    </>
  );
}

// Burbujas agrupadas: separador por día, las seguidas del mismo autor (menos de 5 min) se juntan; «Visto» bajo tu último mensaje
function Burbujas({ msgs, yo, leidoOtro }) {
  const ultimoMio = [...msgs].reverse().find((m) => m.autor === yo);
  return (
    <div className="flex flex-col gap-[3px]">
      {msgs.map((m, i) => {
        const prev = msgs[i - 1], sig = msgs[i + 1], mio = m.autor === yo;
        const nuevoDia = !prev || new Date(prev.fecha).toDateString() !== new Date(m.fecha).toDateString();
        const juntoAnt = prev && !nuevoDia && prev.autor === m.autor && new Date(m.fecha) - new Date(prev.fecha) < 3e5;
        const juntoSig = sig && sig.autor === m.autor && new Date(sig.fecha) - new Date(m.fecha) < 3e5 && new Date(sig.fecha).toDateString() === new Date(m.fecha).toDateString();
        return (
          <React.Fragment key={m.id}>
            {nuevoDia && <div className="my-3 flex justify-center"><span className="rounded-full bg-soft px-3 py-1 text-[11.5px] font-semibold capitalize text-ink3">{diaLargo(m.fecha)}</span></div>}
            <div className={cx('flex', mio ? 'justify-end' : 'justify-start', !juntoAnt && !nuevoDia && 'mt-2')}>
              <div className={cx('max-w-[78%] whitespace-pre-wrap break-words px-3.5 py-2 text-[15px] leading-snug',
                mio ? 'bg-[linear-gradient(135deg,var(--acento),var(--deep))] text-onc' : 'bg-soft text-ink',
                'rounded-[20px]', mio ? (juntoSig ? 'rounded-br-[6px]' : '') + (juntoAnt ? ' rounded-tr-[6px]' : '') : (juntoSig ? 'rounded-bl-[6px]' : '') + (juntoAnt ? ' rounded-tl-[6px]' : ''))}>
                {m.txt}
              </div>
            </div>
            {!juntoSig && <div className={cx('px-1 text-[11px] text-ink3', mio ? 'text-right' : 'text-left')}>{horaCorta(m.fecha)}{mio && m === ultimoMio && leidoOtro && leidoOtro >= m.fecha ? ' · Visto' : ''}</div>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Nuevo mensaje: primero tus contactos (te siguen o los sigues), después cualquier persona de Criterium
function NuevoMensaje({ perfiles, bloqueados, cerrar, elegir }) {
  const { myUid, siguiendo, seguidores } = useApp();
  const [q, setQ] = useState('');
  const contactos = [...new Set([...siguiendo, ...seguidores])].filter((u) => u !== myUid);
  const porUid = Object.fromEntries(perfiles.map((p) => [p.uid, p]));
  const calza = (p) => !q || norm(p.nombre).includes(norm(q)) || norm(p.institucion).includes(norm(q));
  const mios = contactos.map((u) => porUid[u]).filter(Boolean).filter(calza).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  const otros = q.trim().length >= 2 ? perfiles.filter((p) => p.uid !== myUid && !contactos.includes(p.uid) && !bloqueados.includes(p.uid) && calza(p)).slice(0, 20) : [];
  const relTxt = (u) => (siguiendo.includes(u) && seguidores.includes(u) ? 'Se siguen' : siguiendo.includes(u) ? 'Lo sigues' : 'Te sigue');
  const fila = (p, rel) => (
    <button key={p.uid} type="button" onClick={() => elegir(p.uid)} className="flex w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-left transition-colors hover:bg-soft">
      <Avatar nombre={p.nombre} verificado={p.verificado} size={44} />
      <span className="min-w-0 flex-1"><b className="block truncate text-[14.5px] text-ink">{p.nombre}</b><span className="block truncate text-[12.5px] text-ink3">{subtitulo(p) || 'Criterium'}</span></span>
      {rel && <span className="flex-none rounded-full bg-acentosoft px-2.5 py-1 text-[11.5px] font-semibold text-acentodeep">{rel}</span>}
    </button>
  );
  return (
    <Modal open onClose={cerrar} title="Nuevo mensaje">
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 rounded-full bg-soft px-3.5 py-2.5 text-ink3"><Ic n="search" s={16} /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca por nombre o institución" aria-label="Buscar personas" className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink3" /></label>
        <div className="flex max-h-[55vh] flex-col overflow-y-auto">
          <p className="rotulo m-0 px-3 pb-1 pt-1">Tus contactos</p>
          {mios.length ? mios.map((p) => fila(p, relTxt(p.uid))) : <p className="m-0 px-3 py-2 text-[13.5px] text-ink3">{q ? 'Nadie de tus contactos con ese nombre.' : 'Cuando sigas a alguien o te sigan, aparecen aquí.'}</p>}
          {q.trim().length >= 2 && (
            <>
              <p className="rotulo m-0 px-3 pb-1 pt-4">Otras personas en Criterium</p>
              <p className="m-0 px-3 pb-1 text-[12.5px] text-ink3">Como no se siguen, puedes enviarles un solo mensaje hasta que te respondan.</p>
              {otros.length ? otros.map((p) => fila(p, '')) : <p className="m-0 px-3 py-2 text-[13.5px] text-ink3">Sin resultados.</p>}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
