// Asistente › Desde un caso: un caso clínico con el tratamiento decidido → borrador de protocolo completo
// (pasos con evidencia, animaciones, campos del PDF de box y preguntas para el panel de expertos).
// Usa el master prompt docs/MASTER_PROMPT_CASO_A_PROTOCOLO.md (que se apoya en el de protocolos).
// Si no hay modelo disponible, se puede pegar el JSON que entregó Claude con ese prompt y verlo igual que en la app.
import React, { useState } from 'react';
import { PROTOS, DATOS } from '../data.js';
import { cap, errIA, descargar } from '../logic.js';
import { useApp } from '../ctx.js';
import { Ic, Pill, Btn, Field, Aviso, inputCls, cx } from '../ui.jsx';
import { Paso } from './protocolos.jsx';
import { ESCENAS } from './animaciones.jsx';
import { validarReceta } from './anim/receta.jsx';
import CASO_MD from '../../docs/MASTER_PROMPT_CASO_A_PROTOCOLO.md?raw';
import MASTER_MD from '../../docs/MASTER_PROMPT_PROTOCOLOS.md?raw';

const cuerpo = (md) => md.split(/\n---\n/).slice(1).join('\n---\n').trim() || md;
const CAMPOS_CASO = [
  ['esp', 'Especialidad', 'Rehabilitación oral, Endodoncia, Cirugía…'],
  ['diente', 'Diente (FDI)', '3.6'],
  ['dx', 'Diagnóstico', 'Caries oclusal cavitada, dentina media, pulpa vital'],
  ['tto', 'Tratamiento decidido (y quién lo decidió)', 'Restauración de resina clase I, decidida con el docente'],
  ['contexto', 'Contexto clínico relevante', 'Edad en años, sistémico, hallazgos, radiografía descrita'],
  ['materiales', 'Materiales e instrumental disponibles', 'Resina bulk-fill, adhesivo universal, dique…'],
  ['particular', 'Qué tiene de particular este caso', 'Opcional'],
  ['fuentes', 'Fuentes que ya tienen (con DOI o PMID)', 'Opcional']
];

import { datosPersonales } from '../logic.js';
export { datosPersonales };

// Revisión automática del borrador: lo que impide verlo o usarlo (fallas) y lo que hay que mirar (avisos)
export function revisarBorrador(b) {
  const fallas = [], avisos = [];
  if (!b || typeof b !== 'object') return { fallas: ['No es un JSON con la forma del master prompt.'], avisos };
  if ((b.alertas || []).length && !b.datos) return { fallas: [], avisos, soloAlertas: true };
  const d = b.datos;
  if (!d || !Array.isArray(d.pasos) || !d.pasos.length) { fallas.push('Falta "datos" con sus "pasos".'); return { fallas, avisos }; }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(b.id || '')) fallas.push('El id va en minúsculas con guiones (por ejemplo resina-clase-ii).');
  if (DATOS[b.id]) fallas.push('Ya existe un protocolo con el id «' + b.id + '».');
  const personales = datosPersonales(JSON.stringify(b));
  if (personales.length) fallas.push('El borrador trae ' + personales.join(', ') + '. Quítalo antes de seguir.');
  if ((d.campos || []).some((c) => /nombre|rut|ficha|tel[eé]fono|direcci[oó]n/i.test(c))) fallas.push('Los campos del PDF de box no pueden pedir datos personales.');
  if (!(d.campos || []).length) avisos.push('Faltan los "campos" del PDF de box.');
  d.pasos.forEach((s, i) => {
    const n = String(i + 1).padStart(2, '0');
    if (!s.hacer || !s.corto) fallas.push('Paso ' + n + ': falta "corto" o "hacer".');
    if (!/^Terminaste cuando/.test(s.listo || '')) fallas.push('Paso ' + n + ': "listo" tiene que empezar con «Terminaste cuando».');
    const fuentes = (s.sub || []).flatMap((x) => x.fuentes || []);
    if (!fuentes.length && !s.sinEv) fallas.push('Paso ' + n + ': no tiene fuente ni está declarado como práctica habitual (sinEv).');
    if (s.sinEv) avisos.push('Paso ' + n + ': práctica habitual, sin fuente. El panel tiene que mirarlo.');
    if (s.marca === 'en disputa' && !s.disputa) fallas.push('Paso ' + n + ': está en disputa pero falta "disputa".');
    if (typeof s.anim === 'string' && !ESCENAS[s.anim]) fallas.push('Paso ' + n + ': la escena «' + s.anim + '» no existe.');
    if (s.anim && typeof s.anim === 'object') validarReceta(s.anim).forEach((e) => fallas.push('Paso ' + n + ' · animación: ' + e));
    if ((s.hacer || '').length > 220) avisos.push('Paso ' + n + ': el "hacer" es largo para el PDF de box (más de dos líneas).');
    fuentes.forEach((f) => { if (/localizador de párrafo pendiente/.test(f.loc || '')) avisos.push('Paso ' + n + ': una fuente con el localizador de párrafo pendiente.'); });
  });
  if (d.pasos.length > 16) avisos.push('Tiene ' + d.pasos.length + ' pasos: puede no caber en una hoja del PDF de box.');
  return { fallas, avisos };
}

export function DesdeCaso({ iaOff, setIaOff }) {
  const { avisar } = useApp();
  const [caso, setCaso] = useState(() => Object.fromEntries(CAMPOS_CASO.map(([k]) => [k, ''])));
  const [pegado, setPegado] = useState('');
  const [bor, setBor] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [verPegar, setVerPegar] = useState(false);
  const textoCaso = CAMPOS_CASO.map(([k, t]) => t + ': ' + (caso[k] || '').trim()).join('\n');

  const generar = async () => {
    setError('');
    if (!caso.dx.trim() || !caso.tto.trim()) { setError('Escribe el diagnóstico y el tratamiento decidido: Criterium no los decide.'); return; }
    const p = datosPersonales(textoCaso);
    if (p.length) { setError('El caso trae ' + p.join(', ') + '. Quítalo: aquí solo van datos clínicos.'); return; }
    setCargando(true);
    try {
      const sample = await cap('sample');
      if (!sample) { setIaOff(true); setCargando(false); return; }
      const catalogo = PROTOS.map((x) => '- ' + x.id + ': ' + x.t + ' (' + x.esp + ')').join('\n');
      const r = await sample.json([
        cuerpo(CASO_MD), '', '## Reglas del master prompt de protocolos (aplican completas)', '', cuerpo(MASTER_MD), '',
        '## En esta vista de la app',
        '- No puedes consultar PubMed, doi.org ni internet: solo puedes citar fuentes que vengan en el caso, con su DOI o PMID tal como vienen. Para el resto, sinEv y la búsqueda en "pendientes".',
        '', 'PROTOCOLOS QUE YA EXISTEN EN CRITERIUM:', catalogo, '', 'CASO:', textoCaso
      ].join('\n'));
      setBor(r);
    } catch (e) { const m = errIA(e); if (m) setError(m); }
    setCargando(false);
  };
  const verPegado = () => {
    setError('');
    try { setBor(JSON.parse(pegado.trim().replace(/^```(?:json)?\s*|\s*```$/g, ''))); setVerPegar(false); }
    catch (e) { setError('Eso no es un JSON válido. Pega solo la respuesta, desde la primera { hasta la última }.'); }
  };
  const bajar = () => {
    const id = bor.id, d = bor.datos;
    const proto = { ...(bor.proto || {}), id, estadoTxt: 'Borrador v0.1', n: '', abre: true };
    const js = ['// Borrador generado con el master prompt «del caso al protocolo». Sin revisión de expertos: no usar en un paciente.',
      '// Se publica solo con el aporte de al menos 5 expertos. Antes de pegarlo en src/data.js, verifica cada fuente.', '',
      '// En PROTOS:', JSON.stringify(proto, null, 2) + ',', '', '// En DATOS:', JSON.stringify(id) + ': ' + JSON.stringify(d, null, 2) + ','].join('\n');
    descargar(id + '.js', new Blob([js], { type: 'text/javascript' }), avisar);
    const rv = bor.revision || {};
    const md = ['# ' + (d.titulo || id) + ' · borrador para el panel de expertos', '', '> Generado con IA desde un caso clínico. Sin revisión de expertos. Se publica con el aporte de al menos 5 expertos.', '',
      '## Especialidades que deberían revisarlo', '', ...(rv.especialidades || []).map((x) => '- ' + x), '',
      '## Pasos de riesgo (mirar primero)', '', ...(rv.riesgos || []).map((x) => '- ' + x), '',
      '## Preguntas para el panel', '', ...(rv.preguntas || []).map((x) => '- Paso ' + String(x.paso).padStart(2, '0') + ': ' + x.pregunta), '',
      '## Reporte de verificación', '', typeof bor.reporte === 'string' ? bor.reporte : '```json\n' + JSON.stringify(bor.reporte, null, 2) + '\n```', '',
      '## Pendientes', '', ...(bor.pendientes || []).map((x) => '- ' + x)].join('\n');
    descargar(id + '-revision.md', new Blob([md], { type: 'text/markdown' }), avisar);
  };

  const rev = bor ? revisarBorrador(bor) : null;
  const d = bor && bor.datos;
  return (
    <section className="flex flex-col gap-4">
      <Aviso tono="neutro" className="!font-medium">
        Del caso al protocolo: con el diagnóstico y el tratamiento ya decididos por un clínico, la IA arma el borrador completo, con evidencia, animaciones y PDF de box. Ningún borrador llega a los estudiantes sin la revisión de al menos 5 expertos. Solo datos clínicos: nunca nombre, RUT ni ficha.
      </Aviso>
      {!bor && (
        <div className="tarjeta grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          {CAMPOS_CASO.map(([k, t, ph]) => (
            <Field key={k} label={t} id={'caso-' + k} className={['contexto', 'particular', 'fuentes', 'materiales'].includes(k) ? 'sm:col-span-2' : ''}>
              {['contexto', 'fuentes', 'materiales', 'particular'].includes(k)
                ? <textarea id={'caso-' + k} rows={2} value={caso[k]} onChange={(e) => setCaso({ ...caso, [k]: e.target.value })} placeholder={ph} className={cx(inputCls, 'resize-y')} />
                : <input id={'caso-' + k} value={caso[k]} onChange={(e) => setCaso({ ...caso, [k]: e.target.value })} placeholder={ph} className={inputCls} />}
            </Field>
          ))}
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Btn v="primary" icon="sparkle" onClick={generar} disabled={cargando}>{cargando ? 'Armando el borrador…' : 'Generar el borrador'}</Btn>
            <Btn onClick={() => setVerPegar(!verPegar)}>Pegar un borrador</Btn>
            {iaOff && <span className="text-[12.5px] text-ink3">El modelo no está disponible en esta vista: usa el master prompt en Claude y pega aquí el JSON.</span>}
          </div>
          {verPegar && (
            <div className="flex flex-col gap-2 sm:col-span-2">
              <textarea rows={8} value={pegado} onChange={(e) => setPegado(e.target.value)} placeholder='{"version": "caso-a-protocolo-1", …}' className={cx(inputCls, 'font-sans text-[12.5px]')} aria-label="JSON del borrador" />
              <Btn v="soft" className="self-start" onClick={verPegado}>Ver el borrador</Btn>
            </div>
          )}
        </div>
      )}
      {error && <Aviso tono="warn">{error}</Aviso>}

      {bor && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Btn icon="back" onClick={() => { setBor(null); setError(''); }}>Otro caso</Btn>
            {d && <Btn v="primary" icon="download" onClick={bajar} disabled={rev.fallas.length > 0}>Descargar para data.js y para el panel</Btn>}
          </div>
          {(bor.alertas || []).length > 0 && <Aviso tono="warn"><b>El modelo se detuvo o advierte:</b><ul className="m-0 mt-1 pl-4">{bor.alertas.map((a, k) => <li key={k}>{typeof a === 'string' ? a : JSON.stringify(a)}</li>)}</ul></Aviso>}
          {rev.fallas.length > 0 && <Aviso tono="bad"><b>Hay que corregir antes de descargar:</b><ul className="m-0 mt-1 pl-4">{rev.fallas.map((a, k) => <li key={k}>{a}</li>)}</ul></Aviso>}
          {d && (
            <>
              <div className="panel p-6 sm:p-8">
                <div className="flex flex-wrap gap-2"><Pill tono="warn">Borrador generado con IA</Pill><Pill>Necesita 5 expertos</Pill></div>
                <h2 className="m-0 mt-3 text-[24px] font-bold leading-tight text-panelink">{d.titulo}</h2>
                <p className="m-0 mt-2 text-[14.5px] leading-relaxed text-panelink2"><b className="text-panelink">Alcance:</b> {d.alcance}</p>
                {(d.campos || []).length > 0 && <p className="m-0 mt-3 text-[13px] text-panelink2"><b className="text-menta">PDF de box · campos:</b> {d.campos.join(' · ')}</p>}
              </div>
              {rev.avisos.length > 0 && (
                <details className="tarjeta px-5 py-3.5">
                  <summary className="text-[13px] font-semibold text-acentodeep">{rev.avisos.length} cosas para que mire el panel</summary>
                  <ul className="m-0 mt-2 pl-4 text-[13px] leading-relaxed text-ink2">{rev.avisos.map((a, k) => <li key={k}>{a}</li>)}</ul>
                </details>
              )}
              {bor.revision && (
                <div className="suave p-5">
                  <div className="rotulo mb-2">Para el panel de expertos</div>
                  {(bor.revision.especialidades || []).length > 0 && <p className="m-0 mb-2 text-[13.5px] text-ink2"><b className="text-ink">Especialidades:</b> {bor.revision.especialidades.join(', ')}</p>}
                  {(bor.revision.riesgos || []).length > 0 && <p className="m-0 mb-2 text-[13.5px] text-ink2"><b className="text-bad">Mirar primero:</b> {bor.revision.riesgos.join(' · ')}</p>}
                  {(bor.revision.preguntas || []).map((q, k) => <p key={k} className="m-0 text-[13.5px] leading-relaxed text-ink2"><b className="tabular-nums text-rotulo">{String(q.paso).padStart(2, '0')}</b> {q.pregunta}</p>)}
                </div>
              )}
              <div className="flex flex-col gap-3.5">
                {d.pasos.map((s, i) => <Paso key={i} s={s} i={i} hecho={false} onToggle={() => {}} />)}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
