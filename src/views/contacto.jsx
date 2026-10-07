// Contáctanos: el equipo, WhatsApp, correo (si existe) y un formulario que llega a Firestore (mensajes/).
// Lo usan las dos ediciones; en Criterium Red no se habla de protocolos.
import React, { useState } from 'react';
import { uid } from '../logic.js';
import { useApp } from '../ctx.js';
import { CREATIVA } from '../edicion.js';
import { Ic, Pill, Btn, Field, Aviso, Avatar, inputCls, inputErr, cx } from '../ui.jsx';

const esEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((s || '').trim());
const EQUIPO = [
  { nombre: 'Jorge Baeza Santibáñez', titulo: 'Co-Founder' },
  { nombre: 'Sebastián Escobar Prieto', titulo: 'Co-Founder', extra: 'Director creativo' }
];
const CONTACTO = {
  correo: '',                 // correo de Criterium: pendiente (mientras esté vacío no se muestra)
  whatsapp: '+56998215701'
};
const telefonoVisible = (t) => t.replace(/^\+56(9)(\d{4})(\d{4})$/, '+56 $1 $2 $3');

export function Contacto() {
  const { setMensajes, avisar, perfil, usuario } = useApp();
  const MOTIVOS_C = CREATIVA ? ['Consulta sobre Criterium', 'Encontré un error', 'Quiero sumar a mi universidad', 'Soy docente y quiero revisar casos', 'Otro'] : ['Encontré un error en un protocolo', 'Quiero proponer un protocolo', 'Consulta sobre el proyecto', 'Soy docente y quiero saber más', 'Otro'];
  const [f, setF] = useState({ motivo: MOTIVOS_C[0], nombre: (perfil && perfil.nombre) || '', correo: (usuario && usuario.email) || '', msg: '' });
  const [intento, setIntento] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(null);
  const e = { nombre: f.nombre.trim().length < 2 ? 'Escribe tu nombre.' : '', correo: !esEmail(f.correo) ? 'Escribe un correo válido para poder responderte.' : '', msg: f.msg.trim().length < 15 ? 'Cuéntanos un poco más (al menos 15 caracteres).' : '' };
  const enviar = async (ev) => {
    ev.preventDefault(); setIntento(true);
    if (Object.values(e).some(Boolean) || enviando) return;
    const m = { id: uid(), motivo: f.motivo, nombre: f.nombre.trim(), correo: f.correo.trim(), msg: f.msg.trim() };
    setEnviando(true);
    try { await setMensajes(m); setListo(m); setIntento(false); setF({ ...f, msg: '' }); }
    catch (err) { avisar('No se pudo enviar el mensaje. Revisa tu conexión e inténtalo de nuevo.', 'warn'); }
    setEnviando(false);
  };
  const ic = (k) => cx(inputCls, intento && e[k] && inputErr);
  const wa = CONTACTO.whatsapp.replace(/\D/g, '');
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,.9fr)]">
      <div className="flex min-w-0 flex-col gap-5">
        <header className="max-w-[62ch]">
          <h1 className="m-0 mb-2 text-[30px] font-extrabold tracking-[-.03em] text-deep sm:text-[36px]">Contáctanos</h1>
          <p className="m-0 font-serif text-[17px] leading-relaxed text-ink2">{CREATIVA ? 'Criterium lo hacen dos estudiantes de Odontología. Si algo no funciona, tienes una idea o quieres sumar a tu universidad, escríbenos.' : 'Criterium lo hacen dos estudiantes de Odontología. Si algo está mal en un protocolo, falta uno que necesitas o quieres sumarte, escríbenos.'}</p>
        </header>
        {CREATIVA ? <Aviso><b>Criterium está en desarrollo.</b> Lo que se publica no reemplaza el juicio clínico ni la indicación de tu docente.</Aviso> : <Aviso><b>Este sitio está en desarrollo.</b> Los protocolos son borradores sin revisión de especialista y no deben usarse como estándar de atención.</Aviso>}
        {listo ? (
          <div className="flex flex-col gap-3 rounded-r border-2 border-acento bg-card p-5 sm:p-6">
            <Pill tono="acento" className="self-start"><Ic n="check" s={13} sw={2.4} />Mensaje enviado</Pill>
            <p className="m-0 text-[14px] leading-relaxed text-ink2">Gracias, {listo.nombre.split(' ')[0]}. Tu mensaje le llegó al equipo y te respondemos a <b className="text-ink">{listo.correo}</b> dentro de una semana.</p>
            <Btn v="ghost" className="self-start" onClick={() => setListo(null)}>Escribir otro</Btn>
          </div>
        ) : (
          <form onSubmit={enviar} noValidate className="grid gap-4 tarjeta p-5 sm:p-6">
            <Field label="Motivo" id="c-motivo"><select id="c-motivo" value={f.motivo} onChange={(x) => setF({ ...f, motivo: x.target.value })} className={inputCls}>{MOTIVOS_C.map((m) => <option key={m}>{m}</option>)}</select></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" id="c-nombre" error={intento ? e.nombre : ''}><input id="c-nombre" value={f.nombre} onChange={(x) => setF({ ...f, nombre: x.target.value })} placeholder="Tu nombre" className={ic('nombre')} /></Field>
              <Field label="Correo" id="c-correo" error={intento ? e.correo : ''}><input id="c-correo" type="email" value={f.correo} onChange={(x) => setF({ ...f, correo: x.target.value })} placeholder="tucorreo@ejemplo.cl" className={ic('correo')} /></Field>
            </div>
            <Field label="Mensaje" id="c-msg" error={intento ? e.msg : ''}><textarea id="c-msg" rows={5} value={f.msg} onChange={(x) => setF({ ...f, msg: x.target.value })} placeholder={CREATIVA ? 'Cuéntanos qué pasa. No escribas datos de pacientes.' : 'Cuéntanos qué pasa. Si es un error en un protocolo, di cuál y en qué paso. No escribas datos de pacientes.'} className={cx(ic('msg'), 'resize-y leading-relaxed')} /></Field>
            <Btn v="primary" type="submit" className="justify-self-start" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar mensaje'}</Btn>
          </form>
        )}
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        <div className="tarjeta p-5">
          <h2 className="rotulo m-0 mb-3">El equipo</h2>
          <div className="flex flex-col">
            {EQUIPO.map((p, k) => (
              <div key={p.nombre} className={cx('grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 py-3', k > 0 && 'border-t border-line2')}>
                <Avatar nombre={p.nombre} size={44} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><b className="text-[15px] text-ink">{p.nombre}</b><Pill tono="acento">{p.titulo}</Pill>{p.extra && <Pill>{p.extra}</Pill>}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="tarjeta px-5 py-1">
          {CONTACTO.correo && (
            <a href={'mailto:' + CONTACTO.correo} className="grid grid-cols-[20px_minmax(0,1fr)] gap-3 border-b border-line2 py-4 last:border-0">
              <Ic n="mail" s={18} className="text-acento" />
              <div><p className="m-0 mb-0.5 text-[13px] font-semibold">Correo</p><p className="m-0 text-[14px] text-acento [overflow-wrap:anywhere]">{CONTACTO.correo}</p></div>
            </a>
          )}
          {CONTACTO.whatsapp && (
            <a href={'https://wa.me/' + wa} target="_blank" rel="noopener noreferrer" className="grid grid-cols-[20px_minmax(0,1fr)] gap-3 border-b border-line2 py-4 last:border-0">
              <Ic n="chat" s={18} className="text-acento" />
              <div><p className="m-0 mb-0.5 text-[13px] font-semibold">WhatsApp</p><p className="m-0 text-[14px] tabular-nums text-acento">{telefonoVisible(CONTACTO.whatsapp)}</p></div>
            </a>
          )}
          <div className="grid grid-cols-[20px_minmax(0,1fr)] gap-3 border-b border-line2 py-4 last:border-0">
            <Ic n="clock" s={18} className="text-acento" />
            <div><p className="m-0 mb-0.5 text-[13px] font-semibold">Respuesta</p><p className="m-0 text-[13.5px] leading-normal text-ink2">Dentro de una semana. Somos dos y estamos en clínica.</p></div>
          </div>
        </div>
      </aside>
    </div>
  );
}
