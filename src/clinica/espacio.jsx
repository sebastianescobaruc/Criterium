// Espacio de trabajo de la Clínica: al entrar cambia toda la pantalla (estilo clínico sobrio). Barra superior con la
// clínica, el buscador de pacientes (⌘K / Ctrl K), «Nueva cita» y el menú de la cuenta; menú lateral agrupado en
// Atención, Administración y Configuración, con contadores; en el celular, barra inferior propia y menú completo.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../ctx.js';
import { usePacientes, useColeccionClinica } from './db.js';
import { labAtrasado } from './plan.jsx';
import { hoy, edad, nombreDe, ROLES, hhmm } from './comun.jsx';
import { ModalCita, ModalPaciente } from './clinica.jsx';
import { IconoRail } from '../creativa/iconos.jsx';
import { Logo, Avatar, cx } from '../ui.jsx';

// [clave, ícono, texto, vista, pestaña]
const GRUPOS = [
  ['Atención', [['hoy', 'hoy', 'Hoy', 'hoy'], ['agenda', 'agenda', 'Agenda', 'agenda'], ['pacientes', 'pacientes', 'Pacientes', 'pacientes'], ['seguimiento', 'seguimiento', 'Seguimiento', 'seguimiento']]],
  ['Administración', [['caja', 'caja', 'Caja', 'caja'], ['laboratorio', 'laboratorio', 'Laboratorio', 'gestion', 'laboratorio'], ['inventario', 'gestion', 'Inventario', 'gestion', 'inventario'], ['esterilizacion', 'esterilizacion', 'Esterilización', 'gestion', 'esterilizacion'], ['tareas', 'tareas', 'Tareas', 'gestion', 'tareas'], ['informes', 'informes', 'Informes', 'gestion', 'informes']]],
  ['Configuración', [['ajustes', 'ajustes', 'Ajustes', 'ajustes', null, true], ['accesos', 'accesos', 'Registro de accesos', 'gestion', 'accesos', true]]]
];
const GESTION_DEF = 'laboratorio';

export function EspacioClinica({ children }) {
  const { view, tabClinica, irClinica, go, clinica, rolClinica, perfil, myUid, verPerfil, logout, misClinicas, elegirClinica, abrirPaciente } = useApp();
  const [cita, setCita] = useState(null);
  const [paciente, setPaciente] = useState(false);
  const proxima = () => { const d = new Date(); const m = Math.min(19 * 60 + 30, Math.max(8 * 60, Math.ceil((d.getHours() * 60 + d.getMinutes()) / 30) * 30)); return hhmm(m); };
  const nuevaCita = () => setCita({ fecha: hoy(), hora: proxima() });
  const nuevoPaciente = () => setPaciente(true);
  const admin = rolClinica === 'admin';
  const [buscar, setBuscar] = useState(false);
  const [cuenta, setCuenta] = useState(false);
  const [menuMovil, setMenuMovil] = useState(false);
  const lab = useColeccionClinica(clinica.id, 'laboratorio') || [];
  const inv = useColeccionClinica(clinica.id, 'inventario') || [];
  const tareas = useColeccionClinica(clinica.id, 'tareas') || [];
  const cuenta_ = { laboratorio: [lab.filter(labAtrasado).length, true], inventario: [inv.filter((i) => (i.stock || 0) <= (i.minimo || 0)).length, true], tareas: [tareas.filter((t) => t.estado !== 'hecha' && (!t.asignado || t.asignado.uid === myUid)).length, false] };
  useEffect(() => {
    const k = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setBuscar(true); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  const activa = ([k, , , v, tab]) => {
    if (v === 'gestion') return view === 'gestion' && (tabClinica || GESTION_DEF) === tab;
    if (k === 'hoy') return view === 'hoy' || view === 'clinica';
    if (k === 'pacientes') return view === 'pacientes' || view === 'paciente';
    return view === v;
  };
  const ir = ([, , , v, tab]) => { setMenuMovil(false); irClinica(v, tab || undefined); };
  const item = (it, movil) => {
    const on = activa(it); const [k, ic, t] = it; const [n, malo] = cuenta_[k] || [];
    return (
      <button key={k} type="button" onClick={() => ir(it)} aria-current={on ? 'page' : undefined}
        className={cx('relative flex w-full items-center gap-2.5 rounded-[7px] px-2.5 text-left transition-colors', movil ? 'h-11 text-[15px]' : 'h-[34px] text-[13.5px]', on ? 'bg-[var(--cl-sel)] font-semibold text-deep' : 'text-ink2 hover:bg-[var(--cl-hover)] hover:text-ink')}>
        {on && <span className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[var(--cl-pri)]" aria-hidden="true" />}
        <span className={on ? 'text-[var(--cl-pri)]' : 'text-[var(--cl-muted)]'}><IconoRail n={ic} s={18} /></span>
        <span className="min-w-0 flex-1 truncate">{t}</span>
        {n > 0 && <span className={cx('min-w-[20px] rounded-full px-1.5 text-center text-[11px] font-bold leading-5 tabular-nums', malo ? 'bg-badsoft text-bad' : 'bg-[var(--cl-line-2)] text-ink2')}>{n}</span>}
      </button>
    );
  };
  const navegacion = (movil) => GRUPOS.map(([g, its]) => {
    const vis = its.filter((it) => !it[5] || admin);
    if (!vis.length) return null;
    return (
      <div key={g} className="flex flex-col gap-0.5">
        <p className="m-0 px-2.5 pb-1 pt-4 text-[10.5px] font-bold uppercase tracking-[.09em] text-[var(--cl-muted)]">{g}</p>
        {vis.map((it) => item(it, movil))}
      </div>
    );
  });
  const otras = (misClinicas || []).filter((c) => c.id !== clinica.id);
  return (
    <div className="cl flex min-h-screen flex-col">
      {/* Barra superior */}
      <header className="sticky top-0 z-40 flex h-14 flex-none items-center gap-3 border-b border-[var(--cl-line)] bg-card px-3 sm:px-4" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <button type="button" onClick={() => irClinica('hoy')} className="flex items-center gap-2.5 rounded-md pr-2" aria-label="Clínica, ir a Hoy">
          <Logo texto={false} size={26} />
          <span className="hidden text-left leading-tight sm:block"><b className="block text-[14px] tracking-[-.01em] text-deep">Criterium <span className="font-semibold text-acento">Clínica</span></b><span className="block max-w-[200px] truncate text-[11.5px] text-[var(--cl-muted)]">{clinica.nombre}</span></span>
        </button>
        {clinica.demo && <span className="hidden rounded-md border border-[color-mix(in_srgb,var(--warn)_35%,transparent)] bg-warnsoft px-2 py-0.5 text-[11px] font-bold uppercase tracking-[.05em] text-warn md:inline">Demo · datos ficticios</span>}
        <button type="button" onClick={() => setBuscar(true)} className="mx-auto hidden h-9 w-full max-w-[460px] items-center gap-2.5 rounded-lg border border-[var(--cl-line)] bg-[var(--cl-bg)] px-3 text-left text-[13.5px] text-ink3 hover:border-[color-mix(in_srgb,var(--acento)_45%,transparent)] md:flex">
          <IconoRail n="buscar" s={16} /><span className="flex-1">Buscar paciente por nombre, RUT o teléfono</span><kbd className="rounded border border-[var(--cl-line)] bg-card px-1.5 text-[11px] font-semibold text-[var(--cl-muted)]">⌘K</kbd>
        </button>
        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <button type="button" onClick={() => setBuscar(true)} aria-label="Buscar paciente" className="grid h-9 w-9 place-items-center rounded-lg text-ink2 hover:bg-[var(--cl-hover)] md:hidden"><IconoRail n="buscar" s={19} /></button>
          <button type="button" onClick={nuevaCita} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--cl-pri)] px-3 text-[13.5px] font-semibold text-onc hover:bg-[var(--cl-pri-h)]"><span className="text-[18px] leading-none">+</span><span className="hidden sm:inline">Nueva cita</span></button>
          <div className="relative">
            <button type="button" onClick={() => setCuenta((x) => !x)} aria-expanded={cuenta} aria-label="Tu cuenta" className="flex items-center gap-2 rounded-lg p-1 hover:bg-[var(--cl-hover)]">{perfil && <Avatar nombre={perfil.nombre} size={30} />}</button>
            {cuenta && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-[260px] overflow-hidden rounded-[10px] border border-[var(--cl-line)] bg-card shadow-[0_12px_32px_rgba(15,37,48,.14)]" onMouseLeave={() => setCuenta(false)}>
                <div className="border-b border-[var(--cl-line-2)] px-4 py-3"><b className="block truncate text-[14px] text-ink">{perfil && perfil.nombre}</b><span className="text-[12px] text-[var(--cl-muted)]">{ROLES[rolClinica]} · {clinica.nombre}</span></div>
                {otras.map((c) => <button key={c.id} type="button" onClick={() => { setCuenta(false); elegirClinica(c.id); }} className="block w-full px-4 py-2.5 text-left text-[13.5px] text-ink hover:bg-[var(--cl-hover)]">Cambiar a {c.nombre}</button>)}
                <button type="button" onClick={() => { setCuenta(false); verPerfil(myUid); }} className="block w-full px-4 py-2.5 text-left text-[13.5px] text-ink hover:bg-[var(--cl-hover)]">Mi perfil en Criterium</button>
                <button type="button" onClick={() => { setCuenta(false); go('feed'); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13.5px] text-ink hover:bg-[var(--cl-hover)]"><IconoRail n="volver" s={16} />Volver a Criterium</button>
                <button type="button" onClick={() => { setCuenta(false); logout(); }} className="block w-full border-t border-[var(--cl-line-2)] px-4 py-2.5 text-left text-[13.5px] text-ink2 hover:bg-[var(--cl-hover)]">Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Menú lateral (escritorio) */}
        <aside className="sticky top-14 hidden h-[calc(100vh-56px)] w-[228px] flex-none flex-col overflow-y-auto border-r border-[var(--cl-line)] bg-[var(--cl-nav)] px-3 pb-4 lg:flex" aria-label="Clínica">
          <nav className="flex flex-col">{navegacion(false)}</nav>
          <button type="button" onClick={() => go('feed')} className="mt-auto flex items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-left text-[13px] text-[var(--cl-muted)] hover:bg-[var(--cl-hover)] hover:text-ink"><IconoRail n="volver" s={16} />Volver a Criterium</button>
        </aside>
        <main className="cl-main min-w-0 flex-1 px-4 pb-[88px] pt-5 sm:px-6 lg:pb-8">{children}</main>
      </div>

      {/* Barra inferior (celular) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--cl-line)] bg-card lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} aria-label="Clínica">
        {[GRUPOS[0][1][0], GRUPOS[0][1][1], GRUPOS[0][1][2], GRUPOS[1][1][0]].map((it) => {
          const on = activa(it);
          return <button key={it[0]} type="button" onClick={() => ir(it)} aria-current={on ? 'page' : undefined} className={cx('flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-semibold', on ? 'text-[var(--cl-pri)]' : 'text-[var(--cl-muted)]')}><IconoRail n={it[1]} s={22} />{it[2]}</button>;
        })}
        <button type="button" onClick={() => setMenuMovil(true)} className="flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-semibold text-[var(--cl-muted)]"><IconoRail n="mas" s={22} />Más</button>
      </nav>
      {menuMovil && (
        <div className="fixed inset-0 z-50 bg-[rgba(15,37,48,.35)] lg:hidden" onMouseDown={(e) => { if (e.target === e.currentTarget) setMenuMovil(false); }}>
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[14px] bg-card px-4 pb-6 pt-2" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>
            <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-[var(--cl-line)]" />
            {navegacion(true)}
            <button type="button" onClick={() => { setMenuMovil(false); go('feed'); }} className="mt-3 flex h-11 w-full items-center gap-2.5 rounded-[7px] px-2.5 text-left text-[15px] text-ink2 hover:bg-[var(--cl-hover)]"><IconoRail n="volver" s={18} />Volver a Criterium</button>
          </div>
        </div>
      )}
      {buscar && <Buscador cerrar={() => setBuscar(false)} nuevaCita={nuevaCita} nuevoPaciente={nuevoPaciente} />}
      {cita && <ModalCita inicial={cita} cerrar={() => setCita(null)} />}
      {paciente && <ModalPaciente cerrar={() => setPaciente(false)} alGuardar={(id) => { setPaciente(false); abrirPaciente(id); }} />}
    </div>
  );
}

/* ── Buscador de pacientes y acciones (⌘K) ── */
function Buscador({ cerrar, nuevaCita, nuevoPaciente }) {
  const { clinica, abrirPaciente, irClinica, rolClinica } = useApp();
  const pacientes = usePacientes(clinica.id) || [];
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const ref = useRef(null);
  useEffect(() => { setTimeout(() => ref.current && ref.current.focus(), 20); }, []);
  const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const res = useMemo(() => {
    const t = norm(q).trim(), dig = q.replace(/\D/g, '');
    const pac = pacientes.filter((p) => !t || norm(nombreDe(p)).includes(t) || (dig.length >= 3 && (String(p.rut || '').replace(/\D/g, '').includes(dig) || String(p.telefono || '').replace(/\D/g, '').includes(dig)))).slice(0, t ? 8 : 5)
      .map((p) => ({ k: 'p' + p.id, tipo: 'Paciente', t: nombreDe(p), s: [edad(p.nacimiento) !== '' ? edad(p.nacimiento) + ' años' : '', p.rut, p.telefono].filter(Boolean).join(' · '), p, ir: () => abrirPaciente(p.id) }));
    const acc = [['Nueva cita', 'agenda', nuevaCita], ['Paciente nuevo', 'pacientes', nuevoPaciente], ['Ir a la agenda', 'agenda', () => irClinica('agenda')], ['Ir a caja', 'caja', () => irClinica('caja')], ['Confirmaciones de mañana', 'seguimiento', () => irClinica('seguimiento', 'confirmaciones')], ['Laboratorio', 'laboratorio', () => irClinica('gestion', 'laboratorio')], ['Inventario', 'gestion', () => irClinica('gestion', 'inventario')], rolClinica === 'admin' && ['Ajustes de la clínica', 'ajustes', () => irClinica('ajustes')]]
      .filter(Boolean).filter(([t]) => !q || norm(t).includes(norm(q))).map(([t, ic, fn]) => ({ k: 'a' + t, tipo: 'Acción', t, ic, ir: fn }));
    return [...pac, ...acc];
  }, [q, pacientes]);
  const elegir = (r) => { cerrar(); r && r.ir(); };
  const tecla = (e) => {
    if (e.key === 'Escape') cerrar();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(res.length - 1, s + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === 'Enter') elegir(res[sel]);
  };
  let grupo = '';
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-[rgba(15,37,48,.32)] px-3 pt-[10vh]" onMouseDown={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
      <div role="dialog" aria-modal="true" aria-label="Buscar" className="cl w-full max-w-[600px] overflow-hidden rounded-[12px] border border-[var(--cl-line)] bg-card shadow-[0_24px_64px_rgba(15,37,48,.25)]">
        <div className="flex items-center gap-3 border-b border-[var(--cl-line)] px-4">
          <span className="text-ink3"><IconoRail n="buscar" s={18} /></span>
          <input ref={ref} value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={tecla} placeholder="Nombre, RUT, teléfono o acción" aria-label="Buscar" style={{ outline: "none", boxShadow: "none", border: 0 }} className="h-14 flex-1 bg-transparent text-[16px] text-ink placeholder:text-ink3" />
          <kbd className="rounded border border-[var(--cl-line)] px-1.5 text-[11px] text-[var(--cl-muted)]">Esc</kbd>
        </div>
        <div className="max-h-[56vh] overflow-y-auto py-1.5">
          {!res.length && <p className="m-0 px-4 py-6 text-center text-[13.5px] text-ink3">Sin resultados para «{q}».</p>}
          {res.map((r, i) => {
            const cab = r.tipo !== grupo ? (grupo = r.tipo) : null;
            return (
              <React.Fragment key={r.k}>
                {cab && <p className="m-0 px-4 pb-1 pt-2.5 text-[10.5px] font-bold uppercase tracking-[.09em] text-[var(--cl-muted)]">{cab === 'Paciente' ? (q ? 'Pacientes' : 'Pacientes recientes') : 'Acciones'}</p>}
                <button type="button" onMouseEnter={() => setSel(i)} onClick={() => elegir(r)} className={cx('flex w-full items-center gap-3 px-4 py-2 text-left', i === sel ? 'bg-[var(--cl-sel)]' : '')}>
                  {r.p ? <Avatar nombre={r.t} size={30} /> : <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[var(--cl-line-2)] text-ink2"><IconoRail n={r.ic} s={16} /></span>}
                  <span className="min-w-0 flex-1"><b className="block truncate text-[14px] font-semibold text-ink">{r.t}</b>{r.s && <span className="block truncate text-[12px] text-ink3">{r.s}</span>}</span>
                  {i === sel && <kbd className="text-[11px] text-[var(--cl-muted)]">↵</kbd>}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
