// La red profesional de Criterium: bienvenida (perfil profesional), feed, publicaciones por tipo, perfil público,
// a quién seguir y la cola de moderación del equipo.
// Los casos clínicos, borradores y protocolos pasan por el filtro del equipo Criterium antes de aparecer (db.js: publicarFS).
import React, { useEffect, useMemo, useState } from 'react';
import { protoPorId, protosAbiertos, hace, uid, datosPersonales } from '../logic.js';
import { useApp } from '../ctx.js';
import { CREATIVA } from '../edicion.js';
import { borrarCuenta, errorAuth } from '../auth.js';
import { borrarMisDatosFS, toggleLikeFS, votarFS, destacarFS, responderPostFS, publicarFS, usePerfilPublico, usePostsDe, useSeguimientos, usePerfiles, useMisPendientes, useColaModeracion, aprobarFS, rechazarFS, borrarPendienteFS, MODERADOS } from '../db.js';
import { Ic, Pill, Btn, Field, PageHead, Avatar, Modal, Vacio, Logo, inputCls, inputErr, cx } from '../ui.jsx';

/* ═══ Vocabulario del perfil ═══ */
export const ETAPAS = [
  { v: 'Estudiante de pregrado', t: 'Estudiante de Odontología', s: 'Estoy en la carrera', ic: 'birrete' },
  { v: 'Cirujano dentista general', t: 'Cirujano dentista', s: 'Ya me titulé', ic: 'userCheck' },
  { v: 'Especialista', t: 'Especialista', s: 'Tengo una especialidad', ic: 'stamp' },
  { v: 'Docente de clínica', t: 'Docente', s: 'Enseño en clínica', ic: 'book' }
];
const ANIOS = ['1.º año', '2.º año', '3.º año', '4.º año', '5.º año', '6.º año', 'Internado'];
export const INTERESES = ['Rehabilitación oral', 'Operatoria', 'Periodoncia', 'Endodoncia', 'Cirugía bucal', 'Odontopediatría', 'Ortodoncia', 'Implantología', 'Radiología', 'Estética', 'Trastornos temporomandibulares'];
export const TEMAS = ['Evidencia clínica', 'Casos clínicos', 'Investigación', 'Docencia', 'IA en odontología', 'Materiales dentales', 'Salud pública', 'Emprendimiento'];
const esEstudiante = (rol) => rol === 'Estudiante de pregrado';

// Cuánto del perfil profesional está completo, y qué falta
export function completitud(p) {
  const items = [
    ['etapa', !!(p && p.rol)], ['institución', !!(p && p.institucion)], ['año', !!(p && p.anio)],
    ['intereses', !!(p && (p.intereses || []).length)], ['presentación', !!(p && p.descripcion)]
  ];
  return { pct: Math.round((items.filter((x) => x[1]).length / items.length) * 100), faltan: items.filter((x) => !x[1]).map((x) => x[0]) };
}
const lineaPerfil = (p) => [p.rol === 'Estudiante de pregrado' ? 'Estudiante' : p.rol, p.anio, p.institucion].filter(Boolean).join(' · ');

/* ═══ Tipos de publicación ═══ */
const TIPOS = {
  publicacion: { t: 'Publicación', ic: 'chat', tono: '' },
  pregunta: { t: 'Pregunta', ic: 'pregunta', tono: 'acento' },
  discusion: { t: 'Plan de tratamiento', ic: 'personas', tono: 'acento' },
  caso: { t: 'Caso clínico', ic: 'folder', tono: 'acento' },
  borrador: { t: 'Borrador de protocolo', ic: 'edit', tono: 'warn' },
  protocolo: { t: 'Protocolo', ic: 'book', tono: 'ok' }
};
const tipoDe = (p) => (TIPOS[p.tipo] ? p.tipo : 'publicacion');
// Lo que se puede crear desde el inicio. En Criterium Red no hay borradores ni protocolos, y el caso abre su propio formulario.
const CREABLES = CREATIVA ? ['publicacion', 'pregunta', 'discusion', 'caso'] : ['publicacion', 'pregunta', 'discusion', 'caso', 'borrador', 'protocolo'];
// Secciones de un caso clínico (Criterium Red): el revisor corrige cada una por separado
export const SECCIONES_CASO = [
  ['motivo', 'Motivo de consulta'], ['diagnostico', 'Diagnóstico'], ['plan', 'Plan de tratamiento'], ['realizado', 'Qué se hizo y cómo resultó']
];
// Color por especialidad: un tono pastel y su tinta (tokens --esp-* en index.css)
const CLAVE_ESP = { 'Rehabilitación oral': 'rehab', 'Rehabilitación': 'rehab', 'Prótesis': 'rehab', Operatoria: 'opera', Periodoncia: 'perio', Endodoncia: 'endo', 'Cirugía bucal': 'ciru', 'Cirugía': 'ciru',
  Odontopediatría: 'pedia', Ortodoncia: 'orto', Implantología: 'impla', Radiología: 'radio', Estética: 'este', 'Trastornos temporomandibulares': 'atm' };
export const claveEsp = (e) => CLAVE_ESP[e] || '';
export const colorEsp = (e) => { const k = claveEsp(e); return k ? { background: `var(--esp-${k})`, color: `var(--esp-${k}-ink)` } : null; };
export function PillEsp({ esp, className = '' }) {
  const c = colorEsp(esp);
  return c ? <span style={c} className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold leading-5', className)}>{esp}</span> : <Pill className={className}>{esp}</Pill>;
}
// Procedimientos (lista cerrada): etiquetan cada caso para enlazarlo a su protocolo cuando se fusionen las ediciones
export const PROCEDIMIENTOS = [
  ['Operatoria', ['Resina clase I', 'Resina clase II', 'Resina clase III o IV', 'Resina clase V', 'Incrustación', 'Sellante']],
  ['Endodoncia', ['Biopulpectomía', 'Necropulpectomía', 'Retratamiento endodóntico', 'Pulpotomía', 'Recubrimiento pulpar']],
  ['Periodoncia', ['Destartraje y pulido radicular', 'Cirugía periodontal', 'Alargamiento coronario', 'Injerto de encía']],
  ['Cirugía bucal', ['Exodoncia simple', 'Exodoncia de tercer molar', 'Exodoncia quirúrgica', 'Biopsia', 'Frenectomía']],
  ['Odontopediatría', ['Sellantes en niños', 'Pulpotomía en diente temporal', 'Corona preformada', 'Mantenedor de espacio']],
  ['Rehabilitación oral', ['Corona', 'Puente fijo', 'Prótesis removible', 'Prótesis total', 'Provisorio', 'Perno y muñón']],
  ['Implantología', ['Instalación de implante', 'Rehabilitación sobre implante']],
  ['Ortodoncia', ['Aparato removible', 'Ortodoncia fija']],
  ['Estética', ['Blanqueamiento', 'Carillas']],
  ['Otros', ['Urgencia', 'Otro procedimiento']]
];
const especialidadDe = (p) => p.especialidad || (p.protocoloId && protoPorId(p.protocoloId) ? protoPorId(p.protocoloId).esp : '');

// Insignias junto al nombre
function Insignias({ a }) {
  return (
    <>
      {a && a.oficial && <span className="inline-flex flex-none items-center gap-1 rounded-full bg-deep px-1.5 py-[1px] text-[10.5px] font-bold text-onc" title="Cuenta oficial"><Ic n="edificio" s={11} />Oficial</span>}
      {a && a.verificado && !a.oficial && <span className="grid h-4 w-4 flex-none place-items-center rounded-full bg-acento text-onc" title="Verificado"><Ic n="check" s={10} sw={3} /></span>}
    </>
  );
}

/* ═════════ BIENVENIDA: el perfil profesional en 5 pantallas ═════════ */
export function Bienvenida({ editar = false, cerrar }) {
  const { perfil, setPerfil, avisar, myUid, siguiendo, toggleSeguir } = useApp();
  const [f, setF] = useState(() => ({ nombre: '', rol: '', institucion: '', anio: '', area: '', intereses: [], temas: [], descripcion: '', ...(perfil || {}) }));
  const [paso, setPaso] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const personas = usePerfiles(!editar);
  const [egreso, setEgreso] = useState(() => ((perfil && perfil.anio) || '').match(/\d{4}/)?.[0] || '');
  const anioEgreso = (v) => { const n = +v; return v.length === 4 && n >= 1950 && n <= new Date().getFullYear(); };
  const pasos = editar ? 4 : 5;
  const marca = (k, v) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v].slice(0, 12) }));
  const paso2 = f.institucion.trim().length >= 3 && (esEstudiante(f.rol) ? !!f.anio : !egreso || anioEgreso(egreso));
  const valido = [!!f.rol, paso2, f.intereses.length > 0, f.nombre.trim().length >= 3, true][paso];
  const guardar = async (terminado) => {
    setGuardando(true);
    try {
      await setPerfil({ ...(perfil || {}), ...f, nombre: f.nombre.trim(), institucion: f.institucion.trim(), descripcion: (f.descripcion || '').trim().slice(0, 300), onboarding: terminado || !!(perfil && perfil.onboarding) });
      if (terminado) avisar(editar ? 'Perfil actualizado' : 'Listo: tu inicio ya está hecho para ti');
      cerrar();
    } catch (e) { avisar('No se pudo guardar tu perfil. Revisa tu conexión.', 'warn'); }
    setGuardando(false);
  };
  // «Completar después» cierra siempre: guarda lo que haya en segundo plano y, si falla, no deja a nadie atrapado
  const despues = () => {
    try { sessionStorage.setItem('criterium-bienvenida', 'despues'); } catch (e) {}
    setPerfil({ ...(perfil || {}), ...f, nombre: f.nombre.trim(), institucion: f.institucion.trim(), onboarding: !!(perfil && perfil.onboarding) }).catch(() => {});
    cerrar();
  };
  const sugeridas = personas.filter((x) => x.uid !== myUid && x.nombre)
    .map((x) => ({ ...x, puntos: (x.intereses || []).filter((i) => f.intereses.includes(i)).length * 2 + (f.institucion && x.institucion && x.institucion.toLowerCase() === f.institucion.trim().toLowerCase() ? 3 : 0) + (x.tipo === 'oficial' ? 1 : 0) }))
    .sort((a, b) => b.puntos - a.puntos).slice(0, 6);

  const opcion = (sel, onClick, children, k) => (
    <button key={k} type="button" onClick={onClick} aria-pressed={sel}
      className={cx('flex items-center gap-3 rounded-[18px] border px-4 py-3.5 text-left transition-colors', sel ? 'border-acento bg-acentosoft' : 'border-cardline bg-card hover:bg-soft')}>{children}</button>
  );
  const chip = (sel, onClick, t) => (
    <button key={t} type="button" onClick={onClick} aria-pressed={sel}
      className={cx('rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition-colors', sel ? 'bg-deep text-onc' : 'bg-card text-ink2 ring-1 ring-inset ring-cardline hover:bg-soft')}>{sel && '✓ '}{t}</button>
  );
  const pantallas = [
    <>
      <h2 className="titulo-bv">¿Quién eres?</h2>
      <p className="sub-bv">Así Criterium te muestra lo que sirve a tu etapa.</p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {ETAPAS.map((e) => opcion(f.rol === e.v, () => setF({ ...f, rol: e.v, anio: esEstudiante(e.v) === esEstudiante(f.rol) ? f.anio : '' }), <>
          <span className={cx('grid h-10 w-10 flex-none place-items-center rounded-full', f.rol === e.v ? 'bg-acento text-onc' : 'bg-soft text-acento')}><Ic n={e.ic} s={19} /></span>
          <span className="min-w-0"><b className="block text-[15px] text-ink">{e.t}</b><span className="block text-[12.5px] text-ink3">{e.s}</span></span>
        </>, e.v))}
      </div>
    </>,
    <>
      <h2 className="titulo-bv">{esEstudiante(f.rol) ? '¿Dónde estudias?' : '¿Dónde estudiaste o trabajas?'}</h2>
      <p className="sub-bv">Tu universidad o tu lugar de trabajo. Lo ve la gente que visita tu perfil.</p>
      <Field label={esEstudiante(f.rol) ? 'Universidad' : 'Universidad o lugar de trabajo'} id="bv-inst">
        <input id="bv-inst" value={f.institucion} onChange={(e) => setF({ ...f, institucion: e.target.value })} placeholder={esEstudiante(f.rol) ? 'Tu universidad' : 'Universidad, clínica o centro'} autoComplete="organization" className={inputCls} />
      </Field>
      {esEstudiante(f.rol) ? (
        <div className="mt-5"><p className="m-0 mb-2 text-[13px] font-semibold text-ink2">¿En qué año vas?</p><div className="flex flex-wrap gap-2">{ANIOS.map((a) => chip(f.anio === a, () => setF({ ...f, anio: a }), a))}</div></div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="¿En qué año egresaste?" id="bv-egreso" error={egreso && !anioEgreso(egreso) ? 'Escribe el año con 4 números.' : ''}>
            <input id="bv-egreso" inputMode="numeric" maxLength={4} value={egreso} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setEgreso(v); setF({ ...f, anio: anioEgreso(v) ? 'Egresó en ' + v : '' }); }} placeholder="2019 (opcional)" className={inputCls} />
          </Field>
          {f.rol === 'Especialista' && (
            <Field label="Tu especialidad" id="bv-area">
              <select id="bv-area" value={f.area || ''} onChange={(e) => setF({ ...f, area: e.target.value })} className={inputCls}><option value="">Elige</option>{INTERESES.map((a) => <option key={a}>{a}</option>)}</select>
            </Field>
          )}
        </div>
      )}
    </>,
    <>
      <h2 className="titulo-bv">¿Qué te interesa?</h2>
      <p className="sub-bv">{CREATIVA ? 'Elige tus áreas. Tu inicio y las sugerencias de a quién seguir se ordenan según esto.' : 'Elige tus áreas. Tu inicio, las sugerencias de a quién seguir y los protocolos se ordenan según esto.'}</p>
      <p className="m-0 mb-2 text-[13px] font-semibold text-ink2">Áreas clínicas</p>
      <div className="flex flex-wrap gap-2">{INTERESES.map((a) => chip(f.intereses.includes(a), () => marca('intereses', a), a))}</div>
      <p className="m-0 mb-2 mt-5 text-[13px] font-semibold text-ink2">Temas</p>
      <div className="flex flex-wrap gap-2">{TEMAS.map((a) => chip(f.temas.includes(a), () => marca('temas', a), a))}</div>
    </>,
    <>
      <h2 className="titulo-bv">Preséntate</h2>
      <p className="sub-bv">Una o dos frases. Nunca datos de pacientes.</p>
      <Field label="Nombre y apellido" id="bv-nombre"><input id="bv-nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} className={inputCls} /></Field>
      <Field label="Sobre ti (opcional)" id="bv-desc" hint={(f.descripcion || '').length + ' de 300'} className="mt-4">
        <textarea id="bv-desc" rows={3} maxLength={300} value={f.descripcion || ''} onChange={(e) => setF({ ...f, descripcion: e.target.value })} placeholder={esEstudiante(f.rol) ? 'Qué te gusta de la clínica, qué quieres aprender…' : 'En qué trabajas, qué te apasiona de tu área…'} className={cx(inputCls, 'resize-y')} />
      </Field>
      <div className="mt-5 rounded-[20px] bg-soft p-4">
        <p className="m-0 mb-2.5 text-[11.5px] font-semibold uppercase tracking-[.1em] text-ink3">Así te verán</p>
        <div className="flex items-center gap-3"><Avatar nombre={f.nombre || '?'} size={44} /><div className="min-w-0"><b className="block truncate text-[15px] text-ink">{f.nombre || 'Tu nombre'}</b><span className="block truncate text-[12.5px] text-ink3">{lineaPerfil(f) || 'Tu etapa · tu institución'}</span></div></div>
        {f.intereses.length > 0 && <div className="mt-2.5 flex flex-wrap gap-1.5">{f.intereses.slice(0, 5).map((i) => <Pill key={i}>{i}</Pill>)}</div>}
      </div>
    </>,
    <>
      <h2 className="titulo-bv">Gente que te puede interesar</h2>
      <p className="sub-bv">Según tus intereses y tu institución. Lo que publiquen aparece en tu inicio.</p>
      {sugeridas.length === 0 ? <div className="rounded-[20px] bg-soft p-5 text-[14px] text-ink2">Todavía somos pocos en Criterium. Cuando llegue gente con tus intereses, te la mostramos en el inicio.</div> : (
        <div className="flex flex-col gap-2">
          {sugeridas.map((x) => {
            const sigo = siguiendo.includes(x.uid);
            return (
              <div key={x.uid} className="flex items-center gap-3 rounded-[18px] bg-card px-4 py-3 shadow-sh">
                <Avatar nombre={x.nombre} size={40} />
                <div className="min-w-0 flex-1"><b className="flex items-center gap-1.5 truncate text-[14.5px] text-ink">{x.nombre}<Insignias a={{ oficial: x.tipo === 'oficial', verificado: x.verificado }} /></b><span className="block truncate text-[12.5px] text-ink3">{lineaPerfil(x) || 'Miembro de Criterium'}</span></div>
                <Btn sm v={sigo ? 'outline' : 'primary'} onClick={() => toggleSeguir(x.uid)}>{sigo ? 'Siguiendo' : 'Seguir'}</Btn>
              </div>
            );
          })}
        </div>
      )}
    </>
  ];
  return (
    <div className="bienvenida fixed inset-0 z-[80] flex flex-col bg-bg" role="dialog" aria-modal="true" aria-label={editar ? 'Editar tu perfil profesional' : 'Bienvenida a Criterium'}>
      <header className="flex-none px-4 pt-[calc(14px+env(safe-area-inset-top,0px))] sm:px-8">
        <div className="mx-auto flex max-w-[620px] items-center gap-4">
          <Logo size={24} texto={false} />
          <div className="flex flex-1 gap-1" aria-hidden="true">{Array.from({ length: pasos }, (_, k) => <span key={k} className={cx('h-[5px] flex-1 rounded-full transition-colors duration-500', k < paso ? 'bg-acento' : k === paso ? 'bg-deep' : 'bg-cardline')} />)}</div>
          <button type="button" onClick={editar ? cerrar : despues} className="flex-none text-[13px] font-semibold text-ink3 hover:text-ink">{editar ? 'Cancelar' : 'Completar después'}</button>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-[620px] flex-col justify-center px-6 py-8">
          {paso === 0 && !editar && <p className="m-0 mb-2 text-[13px] font-semibold uppercase tracking-[.12em] text-rotulo">Bienvenida a Criterium</p>}
          <div key={paso} className="entra-der">{pantallas[paso]}</div>
        </div>
      </main>
      <footer className="flex-none px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-2 sm:px-8">
        <div className="mx-auto flex max-w-[620px] items-center gap-3">
          <button type="button" onClick={() => setPaso(paso - 1)} disabled={paso === 0} aria-label="Atrás" className="grid h-14 w-14 flex-none place-items-center rounded-full bg-soft text-ink2 disabled:opacity-30"><Ic n="back" s={22} /></button>
          <button type="button" disabled={!valido || guardando} onClick={() => (paso < pasos - 1 ? setPaso(paso + 1) : guardar(true))}
            className="h-14 flex-1 rounded-full bg-acento text-[17px] font-semibold text-onc transition-colors hover:bg-acentodeep disabled:opacity-40">
            {guardando ? 'Guardando…' : paso < pasos - 1 ? 'Siguiente' : editar ? 'Guardar' : 'Ir a mi inicio'}
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ═════════ CREAR: el compositor de publicaciones ═════════ */
const VACIO = { titulo: '', txt: '', especialidad: '', diente: '', protocoloId: '', sinDatos: false, opciones: ['', ''], conDesenlace: false, desPlan: '', desTxt: '' };
function Crear() {
  const { perfil, myUid, avisar, conPerfil, subirCaso } = useApp();
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState('publicacion');
  const [f, setF] = useState(VACIO);
  const [medios, setMedios] = useState(false);
  const [err, setErr] = useState('');
  const [enviando, setEnviando] = useState(false);
  const moderado = MODERADOS.includes(tipo);
  const conTitulo = moderado || tipo === 'discusion';
  const clinico = tipo === 'caso' || tipo === 'discusion';
  const opciones = f.opciones.map((o) => o.trim()).filter(Boolean);
  const limpiar = () => { setF(VACIO); setErr(''); setMedios(false); setAbierto(false); setTipo('publicacion'); };
  const elegir = (k) => { if (CREATIVA && k === 'caso') { limpiar(); subirCaso(); return; } setTipo(k); setErr(''); };
  const setOpcion = (k, v) => { setF({ ...f, opciones: f.opciones.map((o, i) => (i === k ? v : o)) }); setErr(''); };
  const publicar = () => {
    if (conTitulo && f.titulo.trim().length < 6) { setErr(tipo === 'discusion' ? 'Ponle un título: el caso en una línea.' : 'Ponle un título que diga de qué se trata.'); return; }
    if (f.txt.trim().length < 10) { setErr(tipo === 'pregunta' ? 'Cuenta un poco más: qué pasó, en qué paso y qué dudas tienes.' : tipo === 'discusion' ? 'Resume el caso: diagnóstico, hallazgos y qué te hace dudar.' : 'Escribe un poco más.'); return; }
    if (tipo === 'discusion' && opciones.length < 2) { setErr('Escribe al menos dos planes de tratamiento para que la gente vote.'); return; }
    if (tipo === 'discusion' && f.conDesenlace && f.desTxt.trim().length < 10) { setErr('Cuenta qué se hizo y cómo resultó, o quita el desenlace.'); return; }
    if (clinico && !f.sinDatos) { setErr('Confirma que no hay datos que identifiquen al paciente.'); return; }
    const p = datosPersonales([f.titulo, f.txt, ...opciones, f.conDesenlace ? f.desTxt : ''].join(' '));
    if (p.length) { setErr('El texto trae ' + p.join(', ') + '. Quítalo: en Criterium no van datos que identifiquen a nadie.'); return; }
    conPerfil(async (pf) => {
      setEnviando(true);
      try {
        const dest = await publicarFS({
          tipo, titulo: f.titulo.trim(), txt: f.txt.trim(), especialidad: f.especialidad, diente: clinico ? f.diente.trim() : '', protocoloId: f.protocoloId,
          ...(tipo === 'discusion' ? { opciones: opciones.slice(0, 4), votos: {} } : {}),
          ...(tipo === 'discusion' && f.conDesenlace ? { desenlace: { plan: f.desPlan === '' ? -1 : +f.desPlan, txt: f.desTxt.trim() } } : {}),
          adjuntos: [], autorUid: myUid, autor: { uid: myUid, nombre: pf.nombre, rol: pf.rol, institucion: pf.institucion || '', verificado: false },
          fecha: new Date().toISOString(), likes: 0, likedBy: [], respuestas: []
        });
        avisar(dest === 'revision' ? 'Enviado al equipo Criterium. Lo ves en tu perfil mientras se revisa.' : 'Publicado');
        limpiar();
      } catch (e) { setErr('No se pudo publicar. Revisa tu conexión.'); }
      setEnviando(false);
    });
  };
  if (!abierto) return (
    <div className="rounded-[22px] bg-card shadow-sh transition-shadow hover:shadow-shlg">
      <button type="button" onClick={() => setAbierto(true)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <Avatar nombre={(perfil && perfil.nombre) || '?'} size={40} />
        <span className="flex-1 text-[15px] text-ink3">{CREATIVA ? 'Comparte un caso, una duda o un plan…' : 'Comparte algo con la comunidad…'}</span>
        <span className="hidden gap-1 text-acento sm:flex"><Ic n="image" s={20} /><Ic n="video" s={20} /></span>
      </button>
      {CREATIVA && (
        <div className="flex gap-1 border-t border-line2 px-2 py-1.5">
          {[['caso', 'folder', 'Caso clínico', 'Caso'], ['discusion', 'personas', 'Plan de tratamiento', 'Plan'], ['pregunta', 'pregunta', 'Pregunta', 'Pregunta']].map(([k, ic, t, corto]) => (
            <button key={k} type="button" onClick={() => { setAbierto(true); elegir(k); }} className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-[13px] font-semibold text-ink2 hover:bg-soft"><Ic n={ic} s={17} className="flex-none text-acento" /><span className="truncate sm:hidden">{corto}</span><span className="hidden truncate sm:inline">{t}</span></button>
          ))}
        </div>
      )}
    </div>
  );
  return (
    <section className="aparece rounded-[22px] bg-card p-4 shadow-shlg sm:p-5" aria-label="Crear una publicación">
      <div className="scroll-x -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist">
        {CREABLES.map((k) => { const t = TIPOS[k]; return (
          <button key={k} type="button" role="tab" aria-selected={tipo === k} onClick={() => elegir(k)}
            className={cx('inline-flex flex-none items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors', tipo === k ? 'bg-deep text-onc' : 'bg-soft text-ink2 hover:bg-acentosoft')}>
            <Ic n={t.ic} s={15} />{t.t}
          </button>
        ); })}
      </div>
      {moderado && <p className="m-0 mt-2.5 flex items-start gap-2 rounded-rs bg-warnsoft px-3 py-2 text-[12.5px] font-semibold leading-snug text-warn"><Ic n="stamp" s={15} className="mt-[1px]" />Pasa por el filtro del equipo Criterium antes de aparecer en el feed{tipo !== 'caso' ? '. Los protocolos se publican después de la revisión de al menos 5 expertos.' : '.'}</p>}
      {tipo === 'discusion' && <p className="m-0 mt-2.5 text-[13px] leading-snug text-ink3">Cuenta el caso y propone los planes que estás considerando. La comunidad vota y explica por qué.</p>}
      <div className="mt-3 flex flex-col gap-3">
        {conTitulo && <input value={f.titulo} onChange={(e) => { setF({ ...f, titulo: e.target.value }); setErr(''); }} aria-label="Título" placeholder={tipo === 'caso' ? 'Título del caso: qué se hizo y en qué diente' : tipo === 'discusion' ? 'El caso en una línea: ej. molar con lesión de furca grado II' : 'Título del protocolo'} className="w-full bg-transparent text-[18px] font-bold text-ink outline-none placeholder:text-ink3" />}
        <textarea autoFocus value={f.txt} onChange={(e) => { setF({ ...f, txt: e.target.value }); setErr(''); }} rows={4} aria-label="Texto"
          placeholder={{ publicacion: '¿Qué quieres compartir?', pregunta: '¿Qué te pasó en el box? Di en qué paso y qué dudas tienes.', discusion: 'Edad, motivo de consulta, hallazgos, diagnóstico y qué te hace dudar. Sin datos del paciente.', caso: 'Diagnóstico, qué hiciste y cómo resultó. Sin datos del paciente.', borrador: 'De qué trata el borrador, qué cubre y qué fuentes usaste.', protocolo: 'Resumen del protocolo: para qué caso es y qué cubre.' }[tipo]}
          className="w-full resize-y bg-transparent text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink3" />
        {tipo === 'discusion' && (
          <div className="flex flex-col gap-2">
            {f.opciones.map((o, k) => (
              <div key={k} className="flex items-center gap-2">
                <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-acentosoft text-[13px] font-bold text-acentodeep">{String.fromCharCode(65 + k)}</span>
                <input value={o} maxLength={120} onChange={(e) => setOpcion(k, e.target.value)} aria-label={'Plan ' + String.fromCharCode(65 + k)} placeholder={k === 0 ? 'Plan A: ej. destartraje, pulido radicular y control' : 'Plan ' + String.fromCharCode(65 + k)} className={cx(inputCls, '!py-2 !text-[14px]')} />
                {f.opciones.length > 2 && <button type="button" onClick={() => setF({ ...f, opciones: f.opciones.filter((_, i) => i !== k) })} className="rounded-full p-1.5 text-ink3 hover:bg-soft" aria-label="Quitar este plan"><Ic n="x" s={16} /></button>}
              </div>
            ))}
            {f.opciones.length < 4 && <button type="button" onClick={() => setF({ ...f, opciones: [...f.opciones, ''] })} className="self-start rounded-full px-3 py-1.5 text-[13px] font-semibold text-acento hover:bg-soft">+ Otro plan</button>}
            <div className={cx('mt-1 flex flex-col gap-2.5 rounded-[18px] p-3.5 transition-colors', f.conDesenlace ? 'bg-deep' : 'bg-soft')}>
              <label className={cx('flex items-start gap-2.5 text-[13.5px] font-semibold leading-snug', f.conDesenlace ? 'text-onc' : 'text-ink')}>
                <input type="checkbox" checked={f.conDesenlace} onChange={(e) => { setF({ ...f, conDesenlace: e.target.checked }); setErr(''); }} className="mt-0.5 accent-[var(--menta)]" />
                <span>¿Qué harías tú? <span className={cx('block text-[12.5px] font-normal', f.conDesenlace ? 'text-panelink2' : 'text-ink3')}>Si ya lo trataste, cuenta qué se hizo. Se revela cuando cada persona vota.</span></span>
              </label>
              {f.conDesenlace && (
                <>
                  <select value={f.desPlan} onChange={(e) => setF({ ...f, desPlan: e.target.value })} aria-label="Qué plan se hizo" className={inputCls}>
                    <option value="">Se hizo otra cosa</option>
                    {f.opciones.map((o, k) => o.trim() && <option key={k} value={k}>{'Se hizo el plan ' + String.fromCharCode(65 + k) + ': ' + o.trim().slice(0, 50)}</option>)}
                  </select>
                  <textarea value={f.desTxt} rows={3} onChange={(e) => { setF({ ...f, desTxt: e.target.value }); setErr(''); }} aria-label="Qué se hizo y cómo resultó" placeholder="Qué se hizo, cómo resultó y en qué control. Sin datos del paciente." className={cx(inputCls, 'resize-y')} />
                </>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {(moderado || tipo === 'pregunta' || tipo === 'discusion') && (
            <select value={f.especialidad} onChange={(e) => setF({ ...f, especialidad: e.target.value })} aria-label="Especialidad" className="rounded-full border-0 bg-soft py-1.5 pl-3 pr-8 text-[13px] font-semibold text-ink2"><option value="">Especialidad</option>{INTERESES.map((a) => <option key={a}>{a}</option>)}</select>
          )}
          {clinico && <input value={f.diente} onChange={(e) => setF({ ...f, diente: e.target.value })} aria-label="Diente (FDI)" placeholder="Diente FDI, ej. 3.6" className="w-[150px] rounded-full bg-soft px-3 py-1.5 text-[13px] text-ink2 outline-none" />}
          {!CREATIVA && !['borrador', 'protocolo'].includes(tipo) && (
            <select value={f.protocoloId} onChange={(e) => setF({ ...f, protocoloId: e.target.value })} aria-label="Protocolo relacionado" className="max-w-[260px] rounded-full border-0 bg-soft py-1.5 pl-3 pr-8 text-[13px] font-semibold text-ink2"><option value="">Protocolo relacionado</option>{protosAbiertos().map((p) => <option key={p.id} value={p.id}>{p.t}</option>)}</select>
          )}
        </div>
        {medios && <EspacioMedios caso={clinico} />}
        {clinico && (
          <label className="flex items-start gap-2.5 text-[13px] leading-snug text-ink2">
            <input type="checkbox" checked={f.sinDatos} onChange={(e) => { setF({ ...f, sinDatos: e.target.checked }); setErr(''); }} className="mt-0.5 accent-[var(--acento)]" />
            No trae nombre, RUT, ficha, fecha de nacimiento ni fotos que identifiquen al paciente.
          </label>
        )}
        {err && <p className="m-0 text-[12.5px] font-semibold text-bad">{err}</p>}
        <div className="flex items-center gap-1 border-t border-line2 pt-3">
          <button type="button" onClick={() => setMedios(!medios)} aria-pressed={medios} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold text-acento hover:bg-soft"><Ic n="image" s={18} /><span className="hidden sm:inline">Foto</span></button>
          <button type="button" onClick={() => setMedios(!medios)} aria-pressed={medios} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold text-acento hover:bg-soft"><Ic n="video" s={18} /><span className="hidden sm:inline">Video</span></button>
          <button type="button" onClick={limpiar} className="ml-auto rounded-full px-3 py-2 text-[13px] font-semibold text-ink3 hover:text-ink">Cancelar</button>
          <Btn v="primary" sm onClick={publicar} disabled={enviando}>{enviando ? 'Enviando…' : moderado ? 'Enviar a revisión' : 'Publicar'}</Btn>
        </div>
      </div>
    </section>
  );
}

// El espacio para fotos y videos: listo en diseño; se activa cuando se prenda Firebase Storage
export function EspacioMedios({ caso }) {
  return (
    <div className="grid place-items-center gap-1.5 rounded-[18px] border-2 border-dashed border-cardline bg-soft px-4 py-7 text-center">
      <span className="flex gap-2 text-acento"><Ic n="image" s={26} /><Ic n="video" s={26} /></span>
      <b className="text-[14px] text-ink">Fotos y videos · muy pronto</b>
      <span className="max-w-[44ch] text-[12.5px] leading-snug text-ink3">Aquí vas a poder arrastrar fotos, radiografías y videos cortos. {caso ? 'Irán sin rostro, sin datos que identifiquen al paciente y con su consentimiento.' : 'Mientras, describe en el texto lo que mostrarías.'}</span>
    </div>
  );
}

/* ═════════ PUBLICACIÓN (una tarjeta, según su tipo) ═════════ */
// Discusión de un plan de tratamiento: se vota un plan; los resultados se ven después de votar
function Votacion({ p }) {
  const { myUid, avisar } = useApp();
  const votos = p.votos || {};
  const mio = votos[myUid];
  const votado = typeof mio === 'number';
  const total = Object.keys(votos).length;
  const cuenta = (k) => Object.values(votos).filter((v) => v === k).length;
  const votar = async (k) => { try { await votarFS(p.id, myUid, mio === k ? null : k); } catch (e) { avisar('No se pudo guardar tu voto.', 'warn'); } };
  // ¿Qué harías tú?: el desenlace (qué se hizo y cómo resultó) se ve recién al votar; el autor lo ve siempre
  const d = p.desenlace && p.desenlace.txt ? p.desenlace : null;
  const autor = (p.autorUid || (p.autor && p.autor.uid)) === myUid;
  const ve = d && (votado || autor);
  const plan = d && typeof d.plan === 'number' && p.opciones && p.opciones[d.plan] ? d.plan : -1;
  const igual = d && plan >= 0 && total ? Math.round((cuenta(plan) * 100) / total) : null;
  return (
    <div className="flex flex-col gap-2 px-4 pb-3">
      {(p.opciones || []).map((o, k) => {
        const pct = total ? Math.round((cuenta(k) * 100) / total) : 0;
        return (
          <button key={k} type="button" onClick={() => votar(k)} aria-pressed={mio === k} className={cx('relative overflow-hidden rounded-[14px] border px-3.5 py-2.5 text-left transition-colors', mio === k ? 'border-acento' : 'border-cardline hover:bg-soft')}>
            {votado && <span className="absolute inset-y-0 left-0 bg-acentosoft transition-[width] duration-500" style={{ width: pct + '%' }} aria-hidden="true" />}
            <span className="relative flex items-center gap-2.5">
              <b className={cx('grid h-7 w-7 flex-none place-items-center rounded-full text-[12.5px]', mio === k ? 'bg-acento text-onc' : 'bg-soft text-acentodeep')}>{mio === k ? <Ic n="check" s={14} sw={2.6} /> : String.fromCharCode(65 + k)}</b>
              <span className="min-w-0 flex-1 text-[14px] leading-snug text-ink">{o}</span>
              {votado && <b className="flex-none text-[13px] tabular-nums text-ink2">{pct}%</b>}
            </span>
          </button>
        );
      })}
      <p className="m-0 text-[12px] text-ink3">{total} {total === 1 ? 'voto' : 'votos'} · {votado ? 'Toca tu plan para quitar el voto. Explica por qué en una respuesta.' : d ? 'Vota el plan que harías y se revela qué se hizo.' : 'Vota el plan que harías. Los resultados se ven al votar.'}</p>
      {d && (ve ? (
        <div className="aparece flex flex-col gap-1.5 rounded-[16px] bg-deep px-4 py-3.5 text-panelink">
          <p className="m-0 flex flex-wrap items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[.1em] text-menta"><Ic n="check" s={13} sw={2.6} />Lo que se hizo{plan >= 0 ? ' · Plan ' + String.fromCharCode(65 + plan) : ''}</p>
          <p className="m-0 whitespace-pre-line text-[14.5px] leading-relaxed text-onc">{d.txt}</p>
          <p className="m-0 text-[12px] text-panelink2">{igual !== null && votado ? (mio === plan ? 'Pensaste igual que el ' + igual + ' % de quienes votaron.' : 'El ' + igual + ' % de quienes votaron eligió este plan.') + ' ' : ''}Es lo que se hizo en este caso, no la única opción válida.</p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-[16px] bg-deep px-4 py-3.5" aria-label="Desenlace oculto hasta que votes">
          <p className="m-0 select-none text-[14px] leading-relaxed text-panelink [filter:blur(5px)]" aria-hidden="true">Se eligió un plan y se controló en el tiempo, con un resultado que la comunidad va a conocer al votar.</p>
          <span className="absolute inset-0 grid place-items-center"><span className="inline-flex items-center gap-2 rounded-full bg-menta px-3.5 py-1.5 text-[13px] font-semibold text-mentaink"><svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" /><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2.4" /></svg>Vota para ver qué se hizo</span></span>
        </div>
      ))}
    </div>
  );
}

const leerGuardados = () => { try { return JSON.parse(localStorage.getItem('criterium-guardados') || '[]'); } catch (e) { return []; } };
export function Publicacion({ p, pendiente = false }) {
  const { conPerfil, perfil, abrirProto, myUid, verPerfil, siguiendo, toggleSeguir, avisar, go, abrirCasoRed, esRevisor, esDocente, esAdmin, setFeedProc } = useApp();
  const puedeDestacar = (esRevisor ?? (esDocente || esAdmin)) && ['caso', 'discusion'].includes(p.tipo) && !pendiente;
  const [resp, setResp] = useState(false);
  const [todas, setTodas] = useState(false);
  const [largo, setLargo] = useState(false);
  const [txt, setTxt] = useState('');
  const [err, setErr] = useState('');
  const [guardado, setGuardado] = useState(() => leerGuardados().includes(p.id));
  const [borrar, setBorrar] = useState(false);
  const tipo = tipoDe(p); const T = TIPOS[tipo];
  const proto = p.protocoloId && protoPorId(p.protocoloId);
  const autorUid = p.autorUid || (p.autor && p.autor.uid) || '';
  const respuestas = p.respuestas || [];
  const likedBy = p.likedBy || [];
  const meGusta = likedBy.includes(myUid);
  const likes = Math.max(p.likes || 0, likedBy.length);
  const esp = especialidadDe(p);
  const like = async () => { try { await toggleLikeFS(p.id, myUid, meGusta); } catch (e) { avisar('No se pudo guardar tu «me sirve».', 'warn'); } };
  const guardar = () => {
    const l = leerGuardados(); const n = l.includes(p.id) ? l.filter((x) => x !== p.id) : [...l, p.id];
    try { localStorage.setItem('criterium-guardados', JSON.stringify(n)); } catch (e) {}
    setGuardado(!guardado); avisar(guardado ? 'Quitado de guardados' : 'Guardado');
  };
  const responder = (e) => {
    e.preventDefault();
    if (txt.trim().length < 5) { setErr('Escribe una respuesta un poco más larga.'); return; }
    if (datosPersonales(txt).length) { setErr('La respuesta trae datos que identifican a alguien. Quítalos.'); return; }
    conPerfil(async (pf) => {
      try {
        await responderPostFS(p.id, { id: uid(), autor: { uid: myUid, nombre: pf.nombre, rol: pf.rol, verificado: false }, fecha: new Date().toISOString(), txt: txt.trim() });
        setTxt(''); setResp(false); setErr(''); setTodas(true);
      } catch (er) { setErr('No se pudo publicar la respuesta. Revisa tu conexión.'); }
    });
  };
  const nombre = (u, contenido, cls = '') => u ? <button type="button" onClick={() => verPerfil(u)} className={cx('text-left hover:underline', cls)}>{contenido}</button> : <span className={cls}>{contenido}</span>;
  const visibles = todas ? respuestas : respuestas.slice(-2);
  const largoTxt = (p.txt || '').length > 420 && !largo;
  const secciones = SECCIONES_CASO.filter(([k]) => p.secciones && p.secciones[k]);
  return (
    <article className={cx('overflow-hidden rounded-[22px] bg-card shadow-sh', pendiente && 'ring-2 ring-inset', pendiente && (p.estado === 'rechazado' ? 'ring-badsoft' : 'ring-warnsoft'))}>
      {claveEsp(esp) && !pendiente && <div className="h-1" style={{ background: `color-mix(in srgb, var(--esp-${claveEsp(esp)}-ink) 45%, var(--esp-${claveEsp(esp)}))` }} aria-hidden="true" />}
      {pendiente && (
        <div className={cx('flex flex-wrap items-center gap-2 px-4 py-2.5 text-[12.5px] font-semibold', p.estado === 'rechazado' ? 'bg-badsoft text-bad' : 'bg-warnsoft text-warn')}>
          <Ic n={p.estado === 'rechazado' ? 'alert' : 'clock'} s={15} />
          <span className="min-w-0 flex-1">{p.estado === 'rechazado' ? 'No se publicó' + (p.moderacion && p.moderacion.motivo ? ': ' + p.moderacion.motivo : '') : 'En revisión del equipo Criterium. Solo tú lo ves.'}</span>
          {abrirCasoRed && tipo === 'caso' && <button type="button" onClick={() => abrirCasoRed(p.id)} className="underline">Ver la revisión</button>}
          {autorUid === myUid && !(abrirCasoRed && tipo === 'caso') && (borrar
            ? <span className="flex gap-2"><button type="button" onClick={() => borrarPendienteFS(p.id).catch(() => avisar('No se pudo borrar.', 'warn'))} className="underline">Borrar</button><button type="button" onClick={() => setBorrar(false)} className="underline">No</button></span>
            : <button type="button" onClick={() => setBorrar(true)} className="underline">{p.estado === 'rechazado' ? 'Borrar' : 'Retirar'}</button>)}
        </div>
      )}
      <header className="flex items-center gap-3 px-4 pb-1 pt-4">
        {nombre(autorUid, <Avatar nombre={p.autor.nombre} verificado={p.autor.verificado} size={42} />, 'block rounded-full')}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[14.5px] font-semibold leading-tight text-ink">{nombre(autorUid, p.autor.nombre, 'truncate')}<Insignias a={p.autor} /></div>
          <p className="m-0 truncate text-[12.5px] text-ink3">{[p.autor.rol, p.autor.institucion].filter(Boolean).join(' · ')}{p.fecha ? ' · ' + hace(p.fecha) : ''}</p>
        </div>
        {autorUid && autorUid !== myUid && !pendiente && !siguiendo.includes(autorUid) && <button type="button" onClick={() => toggleSeguir(autorUid)} className="flex-none rounded-full px-3 py-1.5 text-[13px] font-semibold text-acento hover:bg-soft">+ Seguir</button>}
      </header>
      {(tipo !== 'publicacion' || esp || proto) && (
        <div className="flex flex-wrap items-center gap-1.5 px-4 pt-2">
          {tipo !== 'publicacion' && <Pill tono={T.tono || 'neutro'}><Ic n={T.ic} s={12} />{T.t}</Pill>}
          {esp && <PillEsp esp={esp} />}
          {p.procedimiento && (setFeedProc
            ? <button type="button" onClick={() => setFeedProc(p.procedimiento)} className="inline-flex items-center gap-1 rounded-full bg-soft px-2.5 py-[3px] text-[11.5px] font-semibold text-acentodeep hover:bg-acentosoft"># {p.procedimiento}</button>
            : <Pill># {p.procedimiento}</Pill>)}
          {p.diente && <Pill>Diente {p.diente}</Pill>}
          {p.edad && <Pill>{p.edad} años</Pill>}
          {proto && <button type="button" onClick={() => abrirProto(proto.id)} className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-acentosoft px-2.5 py-[3px] text-[11.5px] font-semibold text-acentodeep hover:brightness-95"><Ic n="book" s={12} /><span className="truncate">{proto.t}</span></button>}
          {tipo === 'pregunta' && !respuestas.length && !pendiente && <Pill tono="warn">sin responder</Pill>}
        </div>
      )}
      {p.secciones ? (
        <div className="flex flex-col gap-2.5 px-4 pb-2 pt-2.5">
          {p.titulo && <h3 className="m-0 text-[17px] font-bold leading-snug text-deep">{p.titulo}</h3>}
          {secciones.slice(0, largo ? 4 : 2).map(([k, t]) => (
            <div key={k}>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[.1em] text-rotulo">{t}</p>
              <p className="m-0 mt-0.5 whitespace-pre-line text-[14.5px] leading-[1.55] text-ink">{p.secciones[k]}</p>
            </div>
          ))}
          {secciones.length > 2 && !largo && <button type="button" onClick={() => setLargo(true)} className="self-start text-[13px] font-semibold text-acento">Ver el caso completo</button>}
        </div>
      ) : (
        <div className="px-4 pb-2 pt-2.5">
          {p.titulo && <h3 className="m-0 mb-1 text-[17px] font-bold leading-snug text-deep">{p.titulo}</h3>}
          <p className={cx('m-0 whitespace-pre-line text-[15px] leading-[1.6] text-ink', largoTxt && 'line-clamp-6')}>{p.txt}</p>
          {largoTxt && <button type="button" onClick={() => setLargo(true)} className="mt-1 text-[13px] font-semibold text-acento">Ver más</button>}
        </div>
      )}
      {tipo === 'discusion' && !pendiente && <Votacion p={p} />}
      {p.revisado && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-rs bg-acentosoft px-3 py-2 text-[12.5px] font-semibold text-acentodeep">
          <Ic n="stamp" s={15} /><span className="min-w-0 flex-1">Revisado por {p.revisado.por.nombre}{p.revisado.rondas > 1 ? ' · ' + p.revisado.rondas + ' rondas de revisión' : ''}</span>
        </div>
      )}
      {(p.adjuntos || []).length > 0 && (
        <div className={cx('grid gap-0.5', p.adjuntos.length > 1 && 'grid-cols-2')}>
          {p.adjuntos.slice(0, 4).map((a, k) => a.tipo === 'video'
            ? <video key={k} src={a.url} controls playsInline className="aspect-video w-full bg-deep object-contain" />
            : <img key={k} src={a.url} alt={a.alt || ''} loading="lazy" className="aspect-[4/3] w-full bg-soft object-contain" />)}
        </div>
      )}
      {tipo === 'borrador' && !pendiente && (
        <button type="button" onClick={() => go('postular')} className="mx-4 mb-2 flex w-[calc(100%-2rem)] items-center gap-2 rounded-rs bg-warnsoft px-3 py-2 text-left text-[12.5px] font-semibold text-warn">
          <Ic n="personas" s={15} />Borrador: busca revisores expertos. Se publica con un mínimo de 5.<span className="ml-auto underline">Postular</span>
        </button>
      )}
      {!pendiente && (
        <>
          <div className="flex items-center gap-1 border-t border-line2 px-2 py-1">
            <button type="button" onClick={like} aria-pressed={meGusta} className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold transition-colors', meGusta ? 'text-bad' : 'text-ink2 hover:bg-soft')}>
              <Ic n="heart" s={19} className={meGusta ? 'fill-current' : ''} />{likes > 0 ? likes : ''} <span className="hidden sm:inline">Me sirve</span>
            </button>
            <button type="button" onClick={() => setResp(!resp)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold text-ink2 hover:bg-soft">
              <Ic n="chat" s={19} />{respuestas.length > 0 ? respuestas.length : ''} <span className="hidden sm:inline">Responder</span>
            </button>
            {puedeDestacar && (
              <button type="button" onClick={async () => { try { await destacarFS(p.id, p.destacado ? null : { uid: myUid, nombre: (perfil && perfil.nombre) || '' }); avisar(p.destacado ? 'Ya no es el caso de la semana' : 'Destacado como caso de la semana'); } catch (e) { avisar('No se pudo destacar.', 'warn'); } }}
                aria-pressed={!!p.destacado} title="Caso de la semana" className={cx('ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold hover:bg-soft', p.destacado ? 'text-acento' : 'text-ink2')}>
                <Ic n="sparkle" s={18} /><span className="hidden sm:inline">{p.destacado ? 'Destacado' : 'Destacar'}</span>
              </button>
            )}
            <button type="button" onClick={guardar} aria-pressed={guardado} className={cx(puedeDestacar ? '' : 'ml-auto', 'inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold hover:bg-soft', guardado ? 'text-acento' : 'text-ink2')}>
              <Ic n="guardar" s={19} className={guardado ? 'fill-current' : ''} /><span className="hidden sm:inline">{guardado ? 'Guardado' : 'Guardar'}</span>
            </button>
          </div>
          {(respuestas.length > 0 || resp) && (
            <div className="flex flex-col gap-3 border-t border-line2 bg-[color-mix(in_srgb,var(--soft)_45%,var(--card))] px-4 py-3.5">
              {respuestas.length > 2 && !todas && <button type="button" onClick={() => setTodas(true)} className="self-start text-[13px] font-semibold text-ink3 hover:text-ink">Ver las {respuestas.length} respuestas</button>}
              {visibles.map((r) => (
                <div key={r.id} className="flex gap-2.5">
                  <Avatar nombre={r.autor.nombre} verificado={r.autor.verificado} size={30} />
                  <div className={cx('min-w-0 flex-1 rounded-[16px] bg-card px-3.5 py-2.5 shadow-sh', r.autor.verificado && 'ring-1 ring-ok')}>
                    <div className="flex flex-wrap items-center gap-1.5 text-[12.5px]">{nombre(r.autor.uid, r.autor.nombre, 'font-semibold text-ink')}<Insignias a={r.autor} /><span className="text-ink3">{r.autor.rol} · {hace(r.fecha)}</span></div>
                    <p className="m-0 mt-0.5 text-[14px] leading-relaxed text-ink2">{r.txt}</p>
                  </div>
                </div>
              ))}
              {resp ? (
                <form onSubmit={responder} className="flex gap-2.5">
                  <Avatar nombre={(perfil && perfil.nombre) || '?'} size={30} />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <textarea value={txt} autoFocus onChange={(e) => { setTxt(e.target.value); setErr(''); }} rows={2} placeholder="Tu respuesta. Si te apoyas en evidencia, cítala." aria-label="Tu respuesta" className={cx(inputCls, 'resize-y !text-[14px]', err && inputErr)} />
                    {err && <span className="text-[12px] text-bad">{err}</span>}
                    <div className="flex gap-2"><Btn sm v="primary" type="submit" onClick={responder}>Responder</Btn><Btn sm onClick={() => setResp(false)}>Cancelar</Btn></div>
                  </div>
                </form>
              ) : <button type="button" onClick={() => setResp(true)} className="self-start text-[13px] font-semibold text-ink3 hover:text-ink">Responder…</button>}
            </div>
          )}
        </>
      )}
    </article>
  );
}

/* ═════════ A QUIÉN SEGUIR ═════════ */
function useSugerencias(n = 5) {
  const { perfil, myUid, siguiendo } = useApp();
  const personas = usePerfiles(true);
  return useMemo(() => {
    const mis = (perfil && perfil.intereses) || []; const inst = ((perfil && perfil.institucion) || '').toLowerCase();
    return personas.filter((x) => x.uid !== myUid && x.nombre && !siguiendo.includes(x.uid))
      .map((x) => ({ ...x, comun: (x.intereses || []).filter((i) => mis.includes(i)), misma: inst && (x.institucion || '').toLowerCase() === inst }))
      .map((x) => ({ ...x, puntos: x.comun.length * 2 + (x.misma ? 3 : 0) + (x.tipo === 'oficial' ? 1 : 0) }))
      .sort((a, b) => b.puntos - a.puntos || (a.nombre || '').localeCompare(b.nombre || '')).slice(0, n);
  }, [personas, perfil, myUid, siguiendo, n]);
}
function ASeguir({ horizontal = false }) {
  const { verPerfil, toggleSeguir } = useApp();
  const sug = useSugerencias(horizontal ? 8 : 4);
  if (!sug.length) return null;
  const razon = (x) => (x.misma ? 'De tu institución' : x.comun.length ? x.comun.slice(0, 2).join(' · ') : lineaPerfil(x) || 'Miembro de Criterium');
  if (horizontal) return (
    <section aria-label="A quién seguir">
      <h2 className="m-0 mb-2.5 text-[14px] font-bold text-ink">A quién seguir</h2>
      <div className="scroll-x -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {sug.map((x) => (
          <div key={x.uid} className="flex w-[160px] flex-none flex-col items-center gap-2 rounded-[20px] bg-card px-3 py-4 text-center shadow-sh">
            <button type="button" onClick={() => verPerfil(x.uid)}><Avatar nombre={x.nombre} size={52} /></button>
            <b className="w-full truncate text-[13.5px] text-ink">{x.nombre}</b>
            <span className="line-clamp-2 min-h-[30px] text-[11.5px] leading-tight text-ink3">{razon(x)}</span>
            <Btn sm v="primary" className="w-full" onClick={() => toggleSeguir(x.uid)}>Seguir</Btn>
          </div>
        ))}
      </div>
    </section>
  );
  return (
    <section className="rounded-[22px] bg-card p-4 shadow-sh" aria-label="A quién seguir">
      <h2 className="m-0 mb-2 text-[14px] font-bold text-ink">A quién seguir</h2>
      <div className="flex flex-col">
        {sug.map((x) => (
          <div key={x.uid} className="flex items-center gap-2.5 py-2">
            <button type="button" onClick={() => verPerfil(x.uid)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
              <Avatar nombre={x.nombre} size={36} />
              <span className="min-w-0"><b className="flex items-center gap-1 truncate text-[13.5px] text-ink">{x.nombre}<Insignias a={{ oficial: x.tipo === 'oficial', verificado: x.verificado }} /></b><span className="block truncate text-[12px] text-ink3">{razon(x)}</span></span>
            </button>
            <button type="button" onClick={() => toggleSeguir(x.uid)} className="flex-none rounded-full bg-soft px-3 py-1.5 text-[12.5px] font-semibold text-acentodeep hover:bg-acentosoft">Seguir</button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═════════ FEED ═════════ */
const PESTANAS = CREATIVA
  ? [['para-ti', 'Para ti'], ['siguiendo', 'Siguiendo'], ['caso', 'Casos'], ['discusion', 'Planes de tratamiento'], ['pregunta', 'Preguntas']]
  : [['para-ti', 'Para ti'], ['siguiendo', 'Siguiendo'], ['pregunta', 'Preguntas'], ['caso', 'Casos'], ['protocolos', 'Protocolos']];
// Caso de la semana: lo destaca un docente o el equipo; se muestra 7 días, el más reciente
const SEMANA = 7 * 864e5;
function CasoSemana({ p }) {
  const [abierto, setAbierto] = useState(false);
  const esp = especialidadDe(p);
  const votos = Object.keys(p.votos || {}).length;
  const resp = (p.respuestas || []).length;
  return (
    <section aria-label="Caso de la semana" className="flex flex-col gap-3">
      <button type="button" onClick={() => setAbierto(!abierto)} aria-expanded={abierto} className="relative overflow-hidden rounded-[24px] bg-deep px-5 py-5 text-left text-onc transition-transform active:scale-[.99] sm:px-6 sm:py-6">
        <span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-menta opacity-20 blur-3xl" aria-hidden="true" />
        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-menta px-3 py-1 text-[11px] font-bold uppercase tracking-[.12em] text-mentaink"><Ic n="sparkle" s={13} />Caso de la semana</span>
        <h2 className="relative m-0 mt-3 max-w-[30ch] text-[22px] font-bold leading-snug tracking-[-.02em] [text-wrap:balance] sm:text-[26px]">{p.titulo || (p.txt || '').slice(0, 90)}</h2>
        <p className="relative m-0 mt-1.5 text-[13.5px] text-panelink2">{[p.autor && p.autor.nombre, p.revisado ? 'revisado por ' + p.revisado.por.nombre : '', esp].filter(Boolean).join(' · ')}</p>
        <span className="relative mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold text-menta">{abierto ? 'Cerrar' : p.tipo === 'discusion' ? '¿Qué harías tú? Vota y discute' : 'Ver y discutir'}<span className="text-panelink2">{resp} {resp === 1 ? 'respuesta' : 'respuestas'}{p.tipo === 'discusion' ? ' · ' + votos + (votos === 1 ? ' voto' : ' votos') : ''}</span></span>
      </button>
      {abierto && <div className="aparece"><Publicacion p={p} /></div>}
    </section>
  );
}

// arriba y lado: lo que cada edición agrega al inicio (en la completa, el mapa de protocolos y «Tu día»)
export function Feed({ arriba = null, lado = null }) {
  const { feed, perfil, myUid, siguiendo, verPerfil, feedProto, setFeedProto, editarPerfil, feedProc, setFeedProc } = useApp();
  const semana = useMemo(() => feed.filter((p) => (p.estado || 'publicado') === 'publicado' && p.destacado && p.destacado.fecha && Date.now() - new Date(p.destacado.fecha).getTime() < SEMANA)
    .sort((a, b) => b.destacado.fecha.localeCompare(a.destacado.fecha))[0], [feed]);
  const [tab, setTab] = useState('para-ti');
  const misPendientes = useMisPendientes(myUid);
  const { seguidores } = useSeguimientos(myUid);
  const intereses = (perfil && perfil.intereses) || [];
  const comp = completitud(perfil);
  const nombre = ((perfil && perfil.nombre) || '').split(' ')[0];
  const fp = feedProto && protoPorId(feedProto);
  const lista = useMemo(() => {
    let l = feed.filter((p) => (p.estado || 'publicado') === 'publicado' && (!feedProto || p.protocoloId === feedProto) && (!feedProc || p.procedimiento === feedProc) && (feedProc || !semana || p.id !== semana.id));
    const deSeguidos = (p) => siguiendo.includes(p.autorUid || (p.autor && p.autor.uid));
    if (tab === 'siguiendo') l = l.filter(deSeguidos);
    if (tab === 'pregunta') l = l.filter((p) => tipoDe(p) === 'pregunta' || (!p.tipo && /\?/.test(p.txt || '')));
    if (tab === 'caso') l = l.filter((p) => tipoDe(p) === 'caso');
    if (tab === 'discusion') l = l.filter((p) => tipoDe(p) === 'discusion');
    if (tab === 'protocolos') l = l.filter((p) => ['borrador', 'protocolo'].includes(tipoDe(p)));
    if (tab === 'para-ti') {
      // Lo de quien sigues y lo de tus áreas sube; después, lo más nuevo
      const dias = (f) => (Date.now() - new Date(f).getTime()) / 864e5;
      const puntos = (p) => (deSeguidos(p) ? 3 : 0) + (intereses.includes(especialidadDe(p)) ? 2 : 0) + (p.autor && (p.autor.oficial || p.autor.verificado) ? 1 : 0) - Math.min(dias(p.fecha) / 3, 4);
      return [...l].sort((a, b) => puntos(b) - puntos(a));
    }
    return [...l].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [feed, tab, siguiendo, intereses, feedProto, feedProc, semana]);
  const enRevision = misPendientes.filter((p) => p.estado === 'revision').length;

  return (
    <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="mx-auto flex w-full min-w-0 max-w-[660px] flex-col gap-5">
        <h1 className="sr-only">Inicio</h1>
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 text-[24px] font-bold tracking-[-.02em] text-deep sm:text-[28px]">{nombre ? 'Hola, ' + nombre : 'Hola'}</p>
            {intereses.length > 0 && <p className="m-0 mt-0.5 text-[14px] text-ink3">Tu inicio según {intereses.slice(0, 3).join(', ')}</p>}
          </div>
        </header>
        {arriba}
        {semana && <CasoSemana key={semana.id} p={semana} />}
        {comp.pct < 100 && (
          <button type="button" onClick={editarPerfil} className="flex items-center gap-4 rounded-[22px] bg-deep px-5 py-4 text-left text-onc">
            <span className="relative grid h-12 w-12 flex-none place-items-center">
              <svg viewBox="0 0 36 36" className="absolute inset-0 h-12 w-12 -rotate-90" aria-hidden="true"><circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeOpacity=".15" strokeWidth="3" /><circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--menta)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${comp.pct * 0.974} 100`} /></svg>
              <b className="text-[12.5px] tabular-nums">{comp.pct}%</b>
            </span>
            <span className="min-w-0 flex-1"><b className="block text-[15px]">Completa tu perfil profesional</b><span className="block text-[12.5px] text-panelink2">Falta: {comp.faltan.join(', ')}</span></span>
            <span className="rotate-180 text-menta"><Ic n="back" s={18} /></span>
          </button>
        )}
        <Crear />
        {enRevision > 0 && <button type="button" onClick={() => verPerfil(myUid)} className="flex items-center gap-2 rounded-rs bg-warnsoft px-4 py-2.5 text-left text-[13px] font-semibold text-warn"><Ic n="clock" s={15} />{enRevision === 1 ? 'Tienes 1 publicación' : 'Tienes ' + enRevision + ' publicaciones'} en revisión del equipo Criterium.<span className="ml-auto underline">Ver</span></button>}
        <div className="xl:hidden"><ASeguir horizontal /></div>
        <nav className="scroll-x sticky top-[60px] z-10 -mx-4 flex gap-1 overflow-x-auto bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] px-4 py-2 backdrop-blur-xl lg:top-2" aria-label="Filtrar el inicio">
          {PESTANAS.map(([k, t]) => (
            <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k} className={cx('flex-none rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors', tab === k ? 'bg-deep text-onc' : 'text-ink2 hover:bg-soft')}>{t}</button>
          ))}
        </nav>
        {feedProc && <button type="button" onClick={() => setFeedProc('')} className="inline-flex items-center gap-1.5 self-start rounded-full bg-deep px-3.5 py-1.5 text-[12.5px] font-semibold text-onc"># {feedProc}<Ic n="x" s={13} /></button>}
        {fp && <button type="button" onClick={() => setFeedProto('')} className="inline-flex items-center gap-1.5 self-start rounded-full bg-acentosoft px-3 py-1 text-[12px] font-semibold text-acentodeep">Sobre: {fp.t}<Ic n="x" s={13} /></button>}
        <div className="flex flex-col gap-4">
          {lista.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-line px-6 py-10 text-center">
              <p className="m-0 text-[14px] text-ink3">{tab === 'siguiendo' ? (siguiendo.length ? 'Las personas que sigues todavía no publican.' : 'Todavía no sigues a nadie. Mira «A quién seguir».') : 'Todavía no hay nada aquí. Sé el primero en publicar.'}</p>
            </div>
          ) : lista.map((p) => <Publicacion key={p.id} p={p} />)}
        </div>
      </div>

      <aside className="hidden flex-col gap-4 xl:sticky xl:top-[76px] xl:flex">
        {perfil && (
          <section className="overflow-hidden rounded-[22px] bg-card shadow-sh">
            <div className="banda-marca h-14" />
            <div className="-mt-7 px-4 pb-4">
              <button type="button" onClick={() => verPerfil(myUid)} className="relative z-[1] rounded-full bg-card ring-4 ring-card"><Avatar nombre={perfil.nombre} size={56} /></button>
              <button type="button" onClick={() => verPerfil(myUid)} className="mt-1.5 block text-left"><b className="block text-[15px] text-ink hover:underline">{perfil.nombre}</b><span className="block text-[12.5px] text-ink3">{lineaPerfil(perfil)}</span></button>
              <div className="mt-3 flex gap-5 text-[12.5px] text-ink3"><span><b className="text-ink">{seguidores.length}</b> seguidores</span><span><b className="text-ink">{siguiendo.length}</b> siguiendo</span></div>
            </div>
          </section>
        )}
        <ASeguir />
        {lado}
        <section className="rounded-[22px] border border-dashed border-cardline p-4">
          <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-deep text-onc"><Ic n="edificio" s={16} /></span><b className="text-[13.5px] text-ink">Cuentas oficiales</b><Pill>Pronto</Pill></div>
          <p className="m-0 mt-2 text-[12.5px] leading-snug text-ink3">Universidades, sociedades científicas y colegios profesionales con su insignia verificada. Las crea el equipo Criterium.</p>
        </section>
        <p className="m-0 px-1 text-[11px] leading-normal text-ink3">Lo que se publica aquí no reemplaza la indicación de tu docente. Nunca datos de pacientes.</p>
      </aside>
    </div>
  );
}

/* ═════════ PERFIL PÚBLICO ═════════ */
function ListaPersonas({ titulo, uids, cerrar }) {
  const { verPerfil } = useApp();
  const personas = usePerfiles(true);
  const lista = uids.map((u) => personas.find((x) => x.uid === u) || { uid: u, nombre: 'Miembro de Criterium' });
  return (
    <Modal open onClose={cerrar} title={titulo}>
      <div className="flex max-h-[60vh] flex-col overflow-y-auto p-3">
        {lista.length === 0 ? <p className="m-0 p-3 text-[13.5px] text-ink3">Todavía nadie.</p> : lista.map((x) => (
          <button key={x.uid} type="button" onClick={() => { cerrar(); verPerfil(x.uid); }} className="flex items-center gap-3 rounded-rs px-2 py-2 text-left hover:bg-soft">
            <Avatar nombre={x.nombre} size={38} /><span className="min-w-0"><b className="block truncate text-[14px] text-ink">{x.nombre}</b><span className="block truncate text-[12px] text-ink3">{lineaPerfil(x)}</span></span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
export function PerfilPublico() {
  const { perfilUid, myUid, siguiendo, toggleSeguir, editarPerfil, go, logout } = useApp();
  const pf = usePerfilPublico(perfilUid);
  const posts = usePostsDe(perfilUid);
  const yo = perfilUid === myUid;
  const pendientes = useMisPendientes(yo ? myUid : null);
  const { siguiendo: suyos, seguidores } = useSeguimientos(perfilUid);
  const [tab, setTab] = useState('todo');
  const [lista, setLista] = useState(null);
  const loSigo = siguiendo.includes(perfilUid);
  const volver = <button type="button" onClick={() => go('feed')} className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] text-ink2 hover:bg-soft"><Ic n="back" s={14} />Inicio</button>;
  if (pf === undefined) return <div className="mx-auto max-w-[720px]">{volver}<div className="h-64 animate-pulse rounded-[22px] bg-soft" /></div>;
  if (pf === null) return <div className="mx-auto max-w-[720px]">{volver}<Vacio icon="userCheck" titulo="Este perfil no está disponible">La persona todavía no entra con la versión nueva de Criterium.</Vacio></div>;
  const oficial = pf.tipo === 'oficial';
  const publicados = posts.filter((p) => (p.estado || 'publicado') === 'publicado');
  const TABS = [['todo', 'Publicaciones', publicados], ['caso', 'Casos', publicados.filter((p) => tipoDe(p) === 'caso')],
    CREATIVA ? ['discusion', 'Planes de tratamiento', publicados.filter((p) => tipoDe(p) === 'discusion')] : ['protocolos', 'Protocolos y borradores', publicados.filter((p) => ['borrador', 'protocolo'].includes(tipoDe(p)))],
    ...(yo ? [['revision', 'En revisión', pendientes]] : [])];
  const actual = TABS.find((t) => t[0] === tab) || TABS[0];
  const comp = completitud(pf);
  const stat = (n, t, onClick) => <button type="button" onClick={onClick} disabled={!onClick} className="flex flex-col items-start rounded-rs px-1 text-left enabled:hover:bg-soft"><b className="text-[18px] font-bold tabular-nums text-ink">{n}</b><span className="text-[12px] text-ink3">{t}</span></button>;
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-5">
      <div>{volver}</div>
      <section className="overflow-hidden rounded-[24px] bg-card shadow-sh">
        <div className={cx('relative h-32 sm:h-40', oficial ? 'bg-deep' : 'banda-marca')}>
          {oficial && <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--card)_16%,transparent)] px-3 py-1 text-[12px] font-bold text-onc"><Ic n="edificio" s={13} />Cuenta oficial</span>}
        </div>
        <div className="px-5 pb-5 sm:px-7">
          <div className="-mt-12 flex items-end justify-between gap-3">
            <span className={cx('relative z-[1] rounded-full bg-card ring-[5px] ring-card', oficial && 'rounded-[22px]')}><Avatar nombre={pf.nombre} size={96} /></span>
            <div className="flex gap-2 pb-1">
              {yo ? <Btn icon="edit" onClick={editarPerfil}>Editar perfil</Btn>
                : <Btn v={loSigo ? 'outline' : 'primary'} onClick={() => toggleSeguir(perfilUid)}>{loSigo ? 'Siguiendo' : 'Seguir'}</Btn>}
            </div>
          </div>
          <h1 className="m-0 mt-3 flex flex-wrap items-center gap-2 text-[24px] font-bold tracking-[-.02em] text-deep sm:text-[28px]">{pf.nombre}<Insignias a={{ oficial, verificado: pf.verificado }} /></h1>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-ink2">
            {pf.rol && <span className="inline-flex items-center gap-1.5"><Ic n={(ETAPAS.find((e) => e.v === pf.rol) || {}).ic || 'userCheck'} s={15} className="text-acento" />{(ETAPAS.find((e) => e.v === pf.rol) || { t: pf.rol }).t}{pf.anio ? ' · ' + pf.anio : ''}{pf.area ? ' · ' + pf.area : ''}</span>}
            {pf.institucion && <span className="inline-flex items-center gap-1.5"><Ic n="edificio" s={15} className="text-acento" />{pf.institucion}</span>}
          </div>
          {pf.descripcion ? <p className="m-0 mt-3 max-w-[60ch] whitespace-pre-line text-[15px] leading-relaxed text-ink">{pf.descripcion}</p>
            : yo && <p className="m-0 mt-3 text-[13.5px] text-ink3">Todavía no tienes presentación. Cuéntales a los demás qué estudias o en qué trabajas.</p>}
          {[...(pf.intereses || []), ...(pf.temas || [])].length > 0 && <div className="mt-3.5 flex flex-wrap gap-1.5">{(pf.intereses || []).map((i) => <Pill key={i} tono="acento">{i}</Pill>)}{(pf.temas || []).map((i) => <Pill key={i}>{i}</Pill>)}</div>}
          <div className="mt-4 flex gap-6 border-t border-line2 pt-4">
            {stat(publicados.length, publicados.length === 1 ? 'publicación' : 'publicaciones')}
            {stat(seguidores.length, seguidores.length === 1 ? 'seguidor' : 'seguidores', () => setLista(['Seguidores', seguidores]))}
            {stat(suyos.length, 'siguiendo', () => setLista(['Siguiendo', suyos]))}
          </div>
          {yo && comp.pct < 100 && <button type="button" onClick={editarPerfil} className="mt-4 flex w-full items-center gap-3 rounded-rs bg-soft px-4 py-3 text-left"><b className="text-[13px] text-acentodeep">Perfil al {comp.pct}%</b><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-cardline"><span className="block h-full rounded-full bg-acento" style={{ width: comp.pct + '%' }} /></span><span className="text-[12.5px] font-semibold text-acento">Completar</span></button>}
        </div>
      </section>
      <nav className="scroll-x -mx-4 flex gap-1 overflow-x-auto px-4" aria-label="Contenido del perfil">
        {TABS.map(([k, t, l]) => <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k} className={cx('flex-none rounded-full px-4 py-2 text-[13.5px] font-semibold', tab === k ? 'bg-deep text-onc' : 'text-ink2 hover:bg-soft')}>{t}{l.length ? ' · ' + l.length : ''}</button>)}
      </nav>
      <div className="flex flex-col gap-4">
        {actual[2].length === 0
          ? <p className="m-0 rounded-[22px] border border-dashed border-line px-6 py-10 text-center text-[14px] text-ink3">{yo ? (tab === 'revision' ? 'No tienes nada en revisión.' : 'Todavía no publicas nada aquí. Hazlo desde el inicio.') : 'Todavía no publica nada aquí.'}</p>
          : actual[2].map((p) => <Publicacion key={p.id} p={p} pendiente={tab === 'revision'} />)}
      </div>
      {yo && <PieCuenta logout={logout} />}
      {lista && <ListaPersonas titulo={lista[0]} uids={lista[1]} cerrar={() => setLista(null)} />}
    </div>
  );
}

// Al final de tu perfil: privacidad, cerrar sesión y borrar la cuenta (pide la contraseña)
function PieCuenta({ logout }) {
  const { go, avisar } = useApp();
  const [borrar, setBorrar] = useState(false);
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const confirmar = async (e) => {
    e.preventDefault(); if (!pass) { setErr('Escribe tu contraseña.'); return; }
    setOcupado(true); setErr('');
    try { await borrarCuenta(pass, borrarMisDatosFS); avisar('Tu cuenta se borró.'); }
    catch (er) { setErr(er && er.code ? errorAuth(er.code) : 'No se pudo borrar la cuenta. Revisa tu conexión.'); }
    setOcupado(false);
  };
  return (
    <div className="flex flex-col gap-3 border-t border-line2 pt-5">
      <div className="flex flex-wrap gap-x-5 gap-y-2 px-1 text-[13px] font-semibold">
        <button type="button" onClick={() => go('privacidad')} className="text-ink3 hover:text-ink">Privacidad y términos</button>
        {logout && <button type="button" onClick={logout} className="text-ink3 hover:text-ink">Cerrar sesión</button>}
        <button type="button" onClick={() => setBorrar(!borrar)} className="text-bad hover:underline">Borrar mi cuenta</button>
      </div>
      {borrar && (
        <form onSubmit={confirmar} className="flex flex-col gap-2.5 rounded-[18px] bg-badsoft p-4">
          <p className="m-0 text-[13.5px] font-semibold leading-snug text-bad">Se borran para siempre tu perfil, tus publicaciones, tus comentarios, a quién sigues y tu cuenta. No se puede deshacer.</p>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Tu contraseña, para confirmar" aria-label="Tu contraseña" autoComplete="current-password" className={inputCls} />
          {err && <span className="text-[12.5px] text-bad">{err}</span>}
          <div className="flex gap-2"><Btn v="danger" type="submit" disabled={ocupado}>{ocupado ? 'Borrando…' : 'Borrar para siempre'}</Btn><Btn onClick={() => setBorrar(false)}>Cancelar</Btn></div>
        </form>
      )}
    </div>
  );
}

/* ═════════ MODERACIÓN (equipo Criterium) ═════════ */
export function Moderacion() {
  const { esAdmin, myUid, perfil, avisar } = useApp();
  const cola = useColaModeracion(esAdmin);
  const [rechazo, setRechazo] = useState({});
  const [ocupado, setOcupado] = useState('');
  const yo = { uid: myUid, nombre: (perfil && perfil.nombre) || 'Equipo Criterium' };
  const aprobar = async (p) => { setOcupado(p.id); try { await aprobarFS(p, yo); avisar('Publicado en el feed'); } catch (e) { avisar('No se pudo aprobar.', 'warn'); } setOcupado(''); };
  const rechazar = async (p) => {
    const m = (rechazo[p.id] || '').trim();
    if (m.length < 10) { avisar('Explica en una frase por qué no se publica (el autor lo ve).', 'warn'); return; }
    setOcupado(p.id); try { await rechazarFS(p.id, m, yo); avisar('Rechazado con su motivo'); } catch (e) { avisar('No se pudo rechazar.', 'warn'); } setOcupado('');
  };
  if (!esAdmin) return <Vacio icon="stamp" titulo="Solo para el equipo Criterium">Esta sección la usa el equipo que revisa lo que se publica.</Vacio>;
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-5">
      <PageHead eyebrow="Equipo Criterium" titulo="Filtro de publicación">Casos clínicos, borradores y protocolos que esperan revisión antes de aparecer en el feed. Revisa que no traigan datos de pacientes, que sean pertinentes y que no indiquen algo peligroso.</PageHead>
      {cola.length === 0 ? <Vacio icon="check" titulo="Nada pendiente">Todo lo enviado ya está revisado.</Vacio> : cola.map((p) => (
        <div key={p.id} className="flex flex-col gap-2.5">
          <Publicacion p={{ ...p, estado: 'revision' }} pendiente />
          <div className="flex flex-col gap-2 rounded-[18px] bg-soft p-3.5 sm:flex-row sm:items-start">
            <textarea rows={2} value={rechazo[p.id] || ''} onChange={(e) => setRechazo({ ...rechazo, [p.id]: e.target.value })} placeholder="Si no se publica: el motivo, para el autor" aria-label="Motivo del rechazo" className={cx(inputCls, 'flex-1 resize-y !text-[13.5px]')} />
            <div className="flex gap-2">
              <Btn v="primary" icon="check" disabled={ocupado === p.id} onClick={() => aprobar(p)}>Aprobar</Btn>
              <Btn v="dangerOutline" disabled={ocupado === p.id} onClick={() => rechazar(p)}>Rechazar</Btn>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
