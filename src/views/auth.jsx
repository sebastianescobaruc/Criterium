import React, { useEffect, useState } from 'react';
import { registrar, iniciarSesion, recuperarPassword, errorAuth } from '../auth.js';
import { AREAS } from '../logic.js';
import { Btn, Field, Ic, Logo, inputCls, inputErr, cx } from '../ui.jsx';

const ROLES = ['Estudiante de pregrado', 'Cirujano dentista general', 'Especialista', 'Docente de clínica'];
const esEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((s || '').trim());

/* ═════════════════════════════════════════
   AuthGate — envuelve la app.
   Si no hay sesión muestra login/registro.
   Si hay sesión renderiza children.
   ═════════════════════════════════════════ */
export default function AuthGate({ usuario, cargando, children }) {
  // La pantalla de carga animada vive en index.html; se va cuando ya se sabe si hay sesión
  useEffect(() => { if (!cargando) window.criteriumListo?.(); }, [cargando]);
  if (cargando) return <Cargando />;
  if (!usuario) return <PantallaAuth />;
  return children;
}

/* ── Pantalla de carga: la tapa la animación de index.html (#carga); esto solo queda debajo ── */
function Cargando() {
  return <div className="fondo min-h-screen" />;
}

/* ── Marca / logo ── */
function Marca() {
  return (
    <div className="mb-2 text-center">
      <Logo size={34} className="justify-center" />
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink2">
        Procedimientos clínicos basados en la evidencia
      </p>
    </div>
  );
}

/* ═════════ Pantalla de Login / Registro ═════════ */
function PantallaAuth() {
  const [modo, setModo] = useState('login'); // 'login' | 'registro' | 'recuperar'

  return (
    <div className="fondo flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Marca />

        {modo === 'login' && <FormLogin onCambiar={setModo} />}
        {modo === 'registro' && <FormRegistro onCambiar={setModo} />}
        {modo === 'recuperar' && <FormRecuperar onCambiar={setModo} />}

        <p className="mt-6 text-center text-[11px] leading-normal text-ink3">
          Borradores sin revisión de especialista. No deben usarse como estándar de atención.
        </p>
      </div>
    </div>
  );
}

/* ── Login ── */
function FormLogin({ onCambiar }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [intento, setIntento] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setIntento(true);
    if (!esEmail(email) || pass.length < 6) return;
    setCargando(true);
    setError('');
    try {
      await iniciarSesion(email.trim(), pass);
      // onAuthStateChanged se encarga del resto
    } catch (err) {
      setError(errorAuth(err.code));
      setCargando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="mt-6 flex flex-col gap-4 tarjeta p-6">
      <h2 className="m-0 text-[18px] font-bold text-deep">Iniciar sesión</h2>

      <Field label="Correo electrónico" id="auth-email" error={intento && !esEmail(email) ? 'Escribe un correo válido.' : ''}>
        <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.cl" autoComplete="email"
          className={cx(inputCls, intento && !esEmail(email) && inputErr)} />
      </Field>

      <Field label="Contraseña" id="auth-pass" error={intento && pass.length < 6 ? 'La contraseña debe tener al menos 6 caracteres.' : ''}>
        <input id="auth-pass" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Al menos 6 caracteres" autoComplete="current-password"
          className={cx(inputCls, intento && pass.length < 6 && inputErr)} />
      </Field>

      {error && <div className="rounded-rs bg-badsoft px-3.5 py-2.5 text-[13px] font-semibold text-bad">{error}</div>}

      <Btn v="primary" type="submit" disabled={cargando}>
        {cargando ? 'Entrando…' : 'Iniciar sesión'}
      </Btn>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <button type="button" onClick={() => onCambiar('recuperar')} className="font-semibold text-acentodeep hover:underline">
          ¿Olvidaste tu contraseña?
        </button>
        <button type="button" onClick={() => onCambiar('registro')} className="font-semibold text-acentodeep hover:underline">
          Crear cuenta
        </button>
      </div>
    </form>
  );
}

/* ── Registro ── */
function FormRegistro({ onCambiar }) {
  const [f, setF] = useState({ nombre: '', email: '', pass: '', rol: ROLES[0], institucion: '', area: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [intento, setIntento] = useState(false);

  const errores = {
    nombre: f.nombre.trim().length < 3 ? 'Escribe tu nombre y apellido.' : '',
    email: !esEmail(f.email) ? 'Escribe un correo válido.' : '',
    pass: f.pass.length < 6 ? 'Al menos 6 caracteres.' : ''
  };

  const enviar = async (e) => {
    e.preventDefault();
    setIntento(true);
    if (errores.nombre || errores.email || errores.pass) return;
    setCargando(true);
    setError('');
    try {
      await registrar(f.email.trim(), f.pass, {
        nombre: f.nombre.trim(),
        rol: f.rol,
        institucion: f.institucion.trim(),
        area: f.area
      });
      // onAuthStateChanged se encarga del resto
    } catch (err) {
      setError(errorAuth(err.code));
      setCargando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="mt-6 flex flex-col gap-4 tarjeta p-6">
      <h2 className="m-0 text-[18px] font-bold text-deep">Crear cuenta</h2>
      <p className="m-0 text-[13.5px] leading-relaxed text-ink2">
        Los aportes van firmados: un comentario sobre un paso clínico tiene que tener un responsable detrás. Después de crear la cuenta te preguntamos dónde estudias y qué te interesa, para armar tu perfil profesional.
      </p>

      <Field label="Nombre y apellido" id="reg-nombre" error={intento ? errores.nombre : ''}>
        <input id="reg-nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Nombre y apellido" autoComplete="name"
          className={cx(inputCls, intento && errores.nombre && inputErr)} />
      </Field>

      <Field label="Correo electrónico" id="reg-email" error={intento ? errores.email : ''}>
        <input id="reg-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="tu@correo.cl" autoComplete="email"
          className={cx(inputCls, intento && errores.email && inputErr)} />
      </Field>

      <Field label="Contraseña" id="reg-pass" error={intento ? errores.pass : ''}>
        <input id="reg-pass" type="password" value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} placeholder="Al menos 6 caracteres" autoComplete="new-password"
          className={cx(inputCls, intento && errores.pass && inputErr)} />
      </Field>

      {error && <div className="rounded-rs bg-badsoft px-3.5 py-2.5 text-[13px] font-semibold text-bad">{error}</div>}

      <Btn v="primary" type="submit" disabled={cargando}>
        {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
      </Btn>

      <button type="button" onClick={() => onCambiar('login')} className="text-[13px] font-semibold text-acentodeep hover:underline">
        ¿Ya tienes cuenta? Inicia sesión
      </button>
    </form>
  );
}

/* ── Recuperar contraseña ── */
function FormRecuperar({ onCambiar }) {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (!esEmail(email)) return;
    setCargando(true);
    setError('');
    try {
      await recuperarPassword(email.trim());
      setEnviado(true);
    } catch (err) {
      setError(errorAuth(err.code));
    }
    setCargando(false);
  };

  if (enviado) {
    return (
      <div className="mt-6 flex flex-col gap-4 tarjeta p-6">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-oksoft text-ok"><Ic n="check" s={22} /></div>
        <h2 className="m-0 text-[18px] font-bold text-deep">Correo enviado</h2>
        <p className="m-0 text-[14px] leading-relaxed text-ink2">
          Revisa tu bandeja de entrada en <b>{email}</b>. Si no lo ves, busca en correo no deseado.
        </p>
        <Btn onClick={() => onCambiar('login')}>Volver a iniciar sesión</Btn>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="mt-6 flex flex-col gap-4 tarjeta p-6">
      <h2 className="m-0 text-[18px] font-bold text-deep">Recuperar contraseña</h2>
      <p className="m-0 text-[13.5px] leading-relaxed text-ink2">
        Te enviaremos un enlace para crear una contraseña nueva.
      </p>

      <Field label="Correo electrónico" id="rec-email">
        <input id="rec-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.cl" autoComplete="email" className={inputCls} />
      </Field>

      {error && <div className="rounded-rs bg-badsoft px-3.5 py-2.5 text-[13px] font-semibold text-bad">{error}</div>}

      <Btn v="primary" type="submit" disabled={cargando || !esEmail(email)}>
        {cargando ? 'Enviando…' : 'Enviar enlace'}
      </Btn>

      <button type="button" onClick={() => onCambiar('login')} className="text-[13px] font-semibold text-acentodeep hover:underline">
        ← Volver a iniciar sesión
      </button>
    </form>
  );
}
