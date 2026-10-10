// Currículum en el perfil (las dos ediciones): formación, investigación, clínica, voluntariados, ayudantías, cursos,
// premios, idiomas y habilidades. Va en curriculum/{uid} (aparte de perfiles/, que se lee de a muchos en la Red).
// Lo ve cualquiera con sesión; solo el dueño lo edita. Nunca datos de contacto (teléfono, dirección, correo) ni de pacientes.
// «Descargar PDF» abre una hoja limpia y el diálogo de impresión del navegador.
import React, { useState } from 'react';
import { useApp } from '../ctx.js';
import { useCurriculum, guardarCurriculumFS } from '../db.js';
import { datosPersonales } from '../logic.js';
import { Ic, Btn, Modal, inputCls, cx } from '../ui.jsx';

// Secciones y lo que pide cada campo: t = título, l = lugar o entidad, p = periodo o fecha, d = detalle
export const SECCIONES_CV = [
  { k: 'formacion', t: 'Formación académica', ic: 'birrete', campos: { t: 'Título o grado', l: 'Institución', p: 'Periodo (ej.: 2022 – presente)', d: 'Detalle (opcional)' } },
  { k: 'investigacion', t: 'Investigación y presentaciones', ic: 'sparkle', campos: { t: 'Título del trabajo', l: 'Congreso, revista o jornada', p: 'Año', d: 'Tu rol, coautores, resumen breve' } },
  { k: 'clinica', t: 'Experiencia clínica', ic: 'stamp', campos: { t: 'Clínica, internado o pasantía', l: 'Lugar', p: 'Periodo', d: 'Qué hiciste' } },
  { k: 'voluntariados', t: 'Voluntariados y proyección social', ic: 'personas', campos: { t: 'Actividad u operativo', l: 'Lugar', p: 'Fecha', d: 'Qué hiciste' } },
  { k: 'ayudantias', t: 'Ayudantías y docencia', ic: 'book', campos: { t: 'Ramo o curso', l: 'Institución', p: 'Periodo', d: 'Detalle (opcional)' } },
  { k: 'cursos', t: 'Cursos, jornadas y congresos', ic: 'clock', campos: { t: 'Nombre', l: 'Organiza o lugar', p: 'Fecha', d: 'Detalle (horas, certificación)' } },
  { k: 'premios', t: 'Premios y distinciones', ic: 'check', campos: { t: 'Premio o distinción', l: 'Quién lo otorga', p: 'Año', d: 'Detalle (opcional)' } }
];
const MAX = 25;
const vacio = () => ({ t: '', l: '', p: '', d: '' });
export const cvVacio = (cv) => !cv || (!cv.resumen && !SECCIONES_CV.some((s) => (cv[s.k] || []).length) && !(cv.idiomas || []).length && !(cv.habilidades || []).length);

export function Curriculum({ uid, yo, nombre }) {
  const cv = useCurriculum(uid);
  const [editar, setEditar] = useState(false);
  if (cv === undefined) return null;
  if (cvVacio(cv) && !yo) return null;
  return (
    <section className="overflow-hidden rounded-[24px] bg-card shadow-sh" aria-label="Currículum">
      <div className="flex flex-wrap items-center gap-2 border-b border-line2 px-5 py-4 sm:px-7">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-acentosoft text-acento"><Ic n="folder" s={18} /></span>
        <h2 className="m-0 flex-1 text-[19px] font-bold tracking-[-.01em] text-deep">Currículum</h2>
        {!cvVacio(cv) && <button type="button" onClick={() => imprimirCV(cv, nombre)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-acento hover:bg-soft"><Ic n="download" s={15} />Descargar PDF</button>}
        {yo && <Btn sm icon="edit" onClick={() => setEditar(true)}>{cvVacio(cv) ? 'Armar mi currículum' : 'Editar'}</Btn>}
      </div>
      {cvVacio(cv) ? (
        <p className="m-0 px-5 py-6 text-[14px] text-ink2 sm:px-7">Arma tu currículum de estudiante: formación, investigación, clínica, voluntariados, ayudantías, cursos, idiomas y habilidades. Quien visite tu perfil lo verá aquí y lo podrá descargar en PDF.</p>
      ) : (
        <div className="flex flex-col gap-6 px-5 py-5 sm:px-7">
          {cv.resumen && <p className="m-0 whitespace-pre-line text-[15px] leading-relaxed text-ink">{cv.resumen}</p>}
          {SECCIONES_CV.filter((s) => (cv[s.k] || []).length).map((s) => (
            <div key={s.k}>
              <p className="rotulo m-0 mb-2.5 flex items-center gap-2"><Ic n={s.ic} s={14} />{s.t}</p>
              <ol className="m-0 flex list-none flex-col gap-0 p-0">
                {cv[s.k].map((e, i) => (
                  <li key={i} className="relative border-l-2 border-acentosoft pb-4 pl-5 last:pb-0">
                    <span className="absolute -left-[7px] top-[5px] h-3 w-3 rounded-full border-2 border-acento bg-card" aria-hidden="true" />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <b className="text-[15px] leading-snug text-ink">{e.t}</b>
                      {e.p && <span className="text-[12.5px] font-semibold text-ink3">{e.p}</span>}
                    </div>
                    {e.l && <p className="m-0 text-[13.5px] text-acentodeep">{e.l}</p>}
                    {e.d && <p className="m-0 mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-ink2">{e.d}</p>}
                  </li>
                ))}
              </ol>
            </div>
          ))}
          {((cv.idiomas || []).length > 0 || (cv.habilidades || []).length > 0) && (
            <div className="grid gap-5 sm:grid-cols-2">
              {(cv.idiomas || []).length > 0 && <div><p className="rotulo m-0 mb-2.5">Idiomas</p><div className="flex flex-wrap gap-1.5">{cv.idiomas.map((x, i) => <span key={i} className="rounded-full bg-soft px-3 py-1.5 text-[13px] font-semibold text-ink">{x.t}{x.p ? <span className="font-normal text-ink3"> · {x.p}</span> : null}</span>)}</div></div>}
              {(cv.habilidades || []).length > 0 && <div><p className="rotulo m-0 mb-2.5">Habilidades</p><div className="flex flex-wrap gap-1.5">{cv.habilidades.map((x, i) => <span key={i} className="rounded-full bg-acentosoft px-3 py-1.5 text-[13px] font-semibold text-acentodeep">{x}</span>)}</div></div>}
            </div>
          )}
        </div>
      )}
      {editar && <EditorCV cv={cv || {}} uid={uid} cerrar={() => setEditar(false)} />}
    </section>
  );
}

function EditorCV({ cv, uid, cerrar }) {
  const { avisar } = useApp();
  const [d, setD] = useState(() => ({ resumen: cv.resumen || '', ...Object.fromEntries(SECCIONES_CV.map((s) => [s.k, (cv[s.k] || []).map((e) => ({ ...vacio(), ...e }))])), idiomas: (cv.idiomas || []).map((e) => ({ ...vacio(), ...e })), habilidades: (cv.habilidades || []).join(', ') }));
  const [err, setErr] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const setLista = (k, l) => { setD({ ...d, [k]: l }); setErr(''); };
  const guardar = async () => {
    const limpia = (l) => l.map((e) => ({ t: e.t.trim().slice(0, 200), l: e.l.trim().slice(0, 160), p: e.p.trim().slice(0, 60), d: e.d.trim().slice(0, 600) })).filter((e) => e.t).slice(0, MAX);
    const datos = { resumen: d.resumen.trim().slice(0, 1200), ...Object.fromEntries(SECCIONES_CV.map((s) => [s.k, limpia(d[s.k])])),
      idiomas: limpia(d.idiomas), habilidades: d.habilidades.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 20).map((x) => x.slice(0, 40)) };
    const todo = JSON.stringify(datos);
    const malos = datosPersonales(todo);
    if (malos.length) { setErr(`Quita ${malos.join(' y ')}: el currículum lo ve cualquiera con cuenta. Para contactarte está el chat.`); return; }
    setOcupado(true);
    try { await guardarCurriculumFS(uid, datos); avisar('Currículum guardado'); cerrar(); }
    catch (e) { setErr('No se pudo guardar. Revisa tu conexión.'); }
    setOcupado(false);
  };
  const filas = (k, campos, l) => (
    <div className="flex flex-col gap-2.5">
      {l.map((e, i) => (
        <div key={i} className="grid gap-2 rounded-[16px] bg-soft p-3 sm:grid-cols-2">
          <input value={e.t} onChange={(x) => setLista(k, l.map((y, j) => (j === i ? { ...y, t: x.target.value } : y)))} placeholder={campos.t} aria-label={campos.t} className={cx(inputCls, 'sm:col-span-2 !bg-card font-semibold')} />
          {campos.l && <input value={e.l} onChange={(x) => setLista(k, l.map((y, j) => (j === i ? { ...y, l: x.target.value } : y)))} placeholder={campos.l} aria-label={campos.l} className={cx(inputCls, '!bg-card')} />}
          <input value={e.p} onChange={(x) => setLista(k, l.map((y, j) => (j === i ? { ...y, p: x.target.value } : y)))} placeholder={campos.p} aria-label={campos.p} className={cx(inputCls, '!bg-card')} />
          {campos.d && <textarea value={e.d} rows={2} onChange={(x) => setLista(k, l.map((y, j) => (j === i ? { ...y, d: x.target.value } : y)))} placeholder={campos.d} aria-label={campos.d} className={cx(inputCls, 'sm:col-span-2 !bg-card')} />}
          <div className="flex gap-1 sm:col-span-2">
            <button type="button" disabled={i === 0} onClick={() => { const n = [...l]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setLista(k, n); }} className="rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-ink2 hover:bg-card disabled:opacity-30">↑ Subir</button>
            <button type="button" onClick={() => setLista(k, l.filter((_, j) => j !== i))} className="ml-auto rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-bad hover:bg-card">Quitar</button>
          </div>
        </div>
      ))}
      {l.length < MAX && <button type="button" onClick={() => setLista(k, [...l, vacio()])} className="self-start rounded-full px-3 py-1.5 text-[13px] font-semibold text-acento hover:bg-soft">+ Agregar</button>}
    </div>
  );
  return (
    <Modal open onClose={cerrar} title="Tu currículum" wide>
      <div className="flex flex-col gap-6">
        <div><p className="rotulo m-0 mb-2">Sobre mí</p><textarea value={d.resumen} rows={4} maxLength={1200} onChange={(e) => setD({ ...d, resumen: e.target.value })} placeholder="Qué estudias, qué te interesa y qué te destaca." aria-label="Sobre mí" className={inputCls} /></div>
        {SECCIONES_CV.map((s) => <div key={s.k}><p className="rotulo m-0 mb-2 flex items-center gap-2"><Ic n={s.ic} s={14} />{s.t}</p>{filas(s.k, s.campos, d[s.k])}</div>)}
        <div><p className="rotulo m-0 mb-2">Idiomas</p>{filas('idiomas', { t: 'Idioma', p: 'Nivel (ej.: intermedio)' }, d.idiomas)}</div>
        <div><p className="rotulo m-0 mb-2">Habilidades</p><input value={d.habilidades} onChange={(e) => setD({ ...d, habilidades: e.target.value })} placeholder="Separadas por coma: Trabajo en equipo, Comunicación efectiva…" aria-label="Habilidades" className={inputCls} /></div>
        <p className="m-0 text-[12.5px] text-ink3">No pongas teléfono, dirección, correo ni datos de pacientes: tu currículum lo ve cualquiera con cuenta.</p>
        {err && <p className="m-0 text-[13px] font-semibold text-bad">{err}</p>}
        <div className="flex gap-2"><Btn v="primary" onClick={guardar} disabled={ocupado}>{ocupado ? 'Guardando…' : 'Guardar'}</Btn><Btn onClick={cerrar}>Cancelar</Btn></div>
      </div>
    </Modal>
  );
}

// Hoja limpia para imprimir o guardar en PDF (diálogo del navegador)
const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export function imprimirCV(cv, nombre) {
  const w = window.open('', '_blank'); if (!w) return;
  const sec = SECCIONES_CV.filter((s) => (cv[s.k] || []).length).map((s) => `<h2>${esc(s.t)}</h2>${cv[s.k].map((e) => `<div class="e"><div class="f"><b>${esc(e.t)}</b><span>${esc(e.p)}</span></div>${e.l ? `<div class="l">${esc(e.l)}</div>` : ''}${e.d ? `<div class="d">${esc(e.d)}</div>` : ''}</div>`).join('')}`).join('');
  const chips = (t, l) => (l && l.length ? `<h2>${t}</h2><p>${l.map(esc).join(' · ')}</p>` : '');
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Currículum · ${esc(nombre)}</title><style>
    @page{margin:16mm} body{font-family:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif;color:#0F2530;font-size:11pt;line-height:1.45;margin:0}
    header{border-bottom:3px solid #2F6A78;padding-bottom:10px;margin-bottom:6px} h1{margin:0;font-size:24pt;letter-spacing:-.02em} .sub{color:#2F6A78;font-weight:600;margin-top:2px}
    h2{font-size:9.5pt;letter-spacing:.14em;text-transform:uppercase;color:#2F6A78;border-bottom:1px solid #D5E3E9;padding-bottom:3px;margin:18px 0 8px}
    .e{margin:0 0 9px;break-inside:avoid} .f{display:flex;justify-content:space-between;gap:12px} .f span{color:#56707C;white-space:nowrap;font-size:10pt} .l{color:#2F6A78} .d{color:#33454E;font-size:10pt}
    p{margin:0} footer{margin-top:22px;color:#8AA0AA;font-size:8.5pt}</style></head><body>
    <header><h1>${esc(nombre)}</h1><div class="sub">Currículum de estudiante de Odontología</div></header>
    ${cv.resumen ? `<h2>Sobre mí</h2><p>${esc(cv.resumen)}</p>` : ''}${sec}
    ${chips('Idiomas', (cv.idiomas || []).map((x) => x.t + (x.p ? ' (' + x.p + ')' : '')))}${chips('Habilidades', cv.habilidades)}
    <footer>Generado desde Criterium</footer><script>window.onload=()=>setTimeout(()=>window.print(),250)</script></body></html>`);
  w.document.close();
}
