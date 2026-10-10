// Universidad › Concursos: convocatorias (concursos, congresos, fondos y becas) que publica el equipo Criterium, con su
// fecha de cierre, y la Liga de universidades (antes en su propia sección).
import React, { useState } from 'react';
import { useApp } from '../ctx.js';
import { useConvocatorias, publicarConvocatoriaFS } from '../clinica/db.js';
import { Liga } from './crecer.jsx';
import { Ic, Btn, Modal, Field, Seg, Vacio, inputCls, cx } from '../ui.jsx';

const TIPOS = [{ v: 'concurso', t: 'Concurso' }, { v: 'congreso', t: 'Congreso' }, { v: 'fondo', t: 'Fondo' }, { v: 'beca', t: 'Beca' }];
const hoyISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
const diasA = (f) => Math.round((new Date(f + 'T12:00:00') - new Date(hoyISO() + 'T12:00:00')) / 864e5);
const fechaLarga = (f) => { try { return new Date(f + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return f; } };

export function Concursos() {
  const { esAdmin } = useApp();
  const [tab, setTab] = useState('convocatorias');
  return (
    <div className="mx-auto flex max-w-[820px] flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="rotulo m-0 mb-1.5">Universidad</p><h1 className="m-0 text-[28px] font-bold tracking-[-.025em] text-deep sm:text-[32px]">Concursos</h1></div>
        <Seg opciones={[{ v: 'convocatorias', t: 'Convocatorias' }, { v: 'liga', t: 'Liga de universidades' }]} valor={tab} onChange={setTab} />
      </div>
      {tab === 'liga' ? <Liga /> : <Convocatorias esAdmin={esAdmin} />}
    </div>
  );
}

function Convocatorias({ esAdmin }) {
  const lista = useConvocatorias();
  const [nueva, setNueva] = useState(false);
  const [pasadas, setPasadas] = useState(false);
  const abiertas = (lista || []).filter((c) => diasA(c.cierre) >= 0), cerradas = (lista || []).filter((c) => diasA(c.cierre) < 0).reverse();
  const tarjeta = (c) => {
    const d = diasA(c.cierre);
    return (
      <article key={c.id} className={cx('flex flex-col gap-2 rounded-[22px] bg-card p-5 shadow-sh', d < 0 && 'opacity-60')}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-acentosoft px-2.5 py-1 text-[11.5px] font-bold text-acentodeep">{(TIPOS.find((x) => x.v === c.tipo) || { t: 'Convocatoria' }).t}</span>
          <span className={cx('rounded-full px-2.5 py-1 text-[11.5px] font-bold', d < 0 ? 'bg-soft text-ink3' : d <= 7 ? 'bg-warnsoft text-warn' : 'bg-oksoft text-ok')}>{d < 0 ? 'Cerrada' : d === 0 ? 'Cierra hoy' : `Cierra en ${d} ${d === 1 ? 'día' : 'días'}`}</span>
        </div>
        <h3 className="m-0 text-[17px] font-bold leading-snug text-ink">{c.titulo}</h3>
        <p className="m-0 text-[13.5px] text-acentodeep">{c.organiza}{c.cierre ? ' · cierre ' + fechaLarga(c.cierre) : ''}</p>
        {c.descripcion && <p className="m-0 whitespace-pre-line text-[14px] leading-relaxed text-ink2">{c.descripcion}</p>}
        {c.enlace && <a href={c.enlace} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 self-start rounded-full bg-acento px-4 py-2 text-[13.5px] font-semibold text-onc"><Ic n="ext" s={15} />Ver las bases</a>}
      </article>
    );
  };
  return (
    <div className="flex flex-col gap-3">
      {esAdmin && <Btn v="primary" icon="plus" className="self-start" onClick={() => setNueva(true)}>Publicar una convocatoria</Btn>}
      {lista === null ? <div className="h-40 animate-pulse rounded-[22px] bg-soft" />
        : !abiertas.length ? <Vacio icon="stamp" titulo="No hay convocatorias abiertas">El equipo Criterium publica aquí concursos, congresos, fondos y becas para estudiantes y dentistas, con su fecha de cierre.</Vacio>
        : abiertas.map(tarjeta)}
      {cerradas.length > 0 && <button type="button" onClick={() => setPasadas(!pasadas)} className="self-start text-[13px] font-semibold text-ink3 hover:text-ink">{pasadas ? 'Ocultar las cerradas' : `Ver las cerradas (${cerradas.length})`}</button>}
      {pasadas && cerradas.map(tarjeta)}
      {nueva && <NuevaConvocatoria cerrar={() => setNueva(false)} />}
    </div>
  );
}

function NuevaConvocatoria({ cerrar }) {
  const { avisar } = useApp();
  const [f, setF] = useState({ tipo: 'concurso', titulo: '', organiza: '', cierre: '', enlace: '', descripcion: '' });
  const [err, setErr] = useState('');
  const guardar = async () => {
    if (f.titulo.trim().length < 4 || !f.cierre) { setErr('Escribe el título y la fecha de cierre.'); return; }
    if (f.enlace && !/^https:\/\//.test(f.enlace.trim())) { setErr('El enlace tiene que empezar con https://'); return; }
    try { await publicarConvocatoriaFS({ ...f, titulo: f.titulo.trim(), organiza: f.organiza.trim(), enlace: f.enlace.trim(), descripcion: f.descripcion.trim().slice(0, 1200) }); avisar('Convocatoria publicada'); cerrar(); }
    catch (e) { setErr('No se pudo publicar.'); }
  };
  return (
    <Modal open onClose={cerrar} title="Publicar una convocatoria">
      <div className="flex flex-col gap-3">
        <Seg opciones={TIPOS} valor={f.tipo} onChange={(v) => setF({ ...f, tipo: v })} size="sm" />
        <Field label="Título" id="cv-t"><input id="cv-t" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} className={inputCls} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Quién organiza" id="cv-o"><input id="cv-o" value={f.organiza} onChange={(e) => setF({ ...f, organiza: e.target.value })} className={inputCls} /></Field>
          <Field label="Cierre" id="cv-c"><input id="cv-c" type="date" value={f.cierre} onChange={(e) => setF({ ...f, cierre: e.target.value })} className={inputCls} /></Field>
        </div>
        <Field label="Enlace a las bases" id="cv-l"><input id="cv-l" value={f.enlace} onChange={(e) => setF({ ...f, enlace: e.target.value })} placeholder="https://" className={inputCls} /></Field>
        <Field label="Descripción" id="cv-d"><textarea id="cv-d" rows={4} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} className={inputCls} /></Field>
        {err && <p className="m-0 text-[13px] font-semibold text-bad">{err}</p>}
        <div className="flex gap-2"><Btn v="primary" onClick={guardar}>Publicar</Btn><Btn onClick={cerrar}>Cancelar</Btn></div>
      </div>
    </Modal>
  );
}
