import React, { useState, useEffect } from 'react';
import { DATOS } from '../data.js';
import { validar, bibliotecaTexto, textoProtocolo, protosAbiertos, cap, errIA, descargar } from '../logic.js';
import { useApp } from '../ctx.js';
import { Ic, Pill, Btn, Field, Seg, Aviso, PageHead, inputCls, cx } from '../ui.jsx';
// Master prompt de protocolos: el asistente lo usa como razonamiento para buscar evidencia y armar borradores.
// Se lee del mismo archivo de docs/, así una edición ahí cambia lo que hace la app.
import MASTER_MD from '../../docs/MASTER_PROMPT_PROTOCOLOS.md?raw';
const MASTER = MASTER_MD.split(/\n---\n/).slice(1).join('\n---\n').trim() || MASTER_MD;

/* ═════════ ASISTENTE ═════════ */
export function Asistente() {
  const { avisar, asisTab: tab, setAsisTab: setTab } = useApp();
  const [pregunta, setPregunta] = useState('');
  const [material, setMaterial] = useState('');
  const [valProto, setValProto] = useState('cementado-pmma');
  const [resp, setResp] = useState(null);
  const [bor, setBor] = useState(null);
  const [valIA, setValIA] = useState(null);
  const [cargando, setCargando] = useState('');
  const [error, setError] = useState('');
  const [iaOff, setIaOff] = useState(false);
  useEffect(() => { let v = true; cap('sample').then((s) => { if (v && !s) setIaOff(true); }); return () => { v = false; }; }, []);
  const val = validar(valProto);
  const abiertos = protosAbiertos();

  const pedir = async (tipo, instr, guardar) => {
    setError(''); setCargando(tipo);
    try {
      const sample = await cap('sample');
      if (!sample) { setIaOff(true); setCargando(''); return; }
      const r = await sample.json(instr);
      guardar(r);
    } catch (e) { const m = errIA(e); if (m) setError(m); }
    setCargando('');
  };
  const preguntar = () => {
    const q = pregunta.trim();
    if (q.length < 8) { setError('Escribe primero tu pregunta, con el caso concreto.'); return; }
    setResp(null);
    pedir('preguntar', [
      'Eres el asistente de Criterium, una biblioteca de protocolos clinicos odontologicos con evidencia trazable.',
      'Responde SOLO con lo que esta escrito en los protocolos de abajo. No uses conocimiento propio ni completes con lo que se suele hacer.',
      'Si la respuesta no esta en la biblioteca, pon enBiblioteca en false, escribe una sola frase diciendo que no esta cubierto, y en aviso di que protocolo haria falta.',
      'Cuando la pregunta caiga en un arbol de decision, resuelve la rama que corresponda al caso descrito y di por que esa rama.',
      'Si el paso que usas esta en disputa o marcado sin evidencia, dilo en la respuesta.',
      'Escribe en espanol simple, frases cortas, para un estudiante de primer ano. Sin rodeos ni relleno.',
      'Cita en el campo pasos todos los pasos que usaste.', '',
      'PREGUNTA DEL ESTUDIANTE:', q, '', 'BIBLIOTECA:', bibliotecaTexto(), '',
      'Devuelve solo JSON con esta forma exacta:',
      '{"enBiblioteca": true, "respuesta": ["parrafo 1", "parrafo 2"], "pasos": [{"protocolo": "titulo del protocolo", "n": "07", "corto": "titulo corto del paso"}], "aviso": ""}'
    ].join('\n'), setResp);
  };
  const hacerBorrador = () => {
    const m = material.trim();
    if (m.length < 80) { setError('Pega primero el material de la clase o del caso. Con menos de unas líneas no hay nada que convertir.'); return; }
    setBor(null);
    pedir('borrador', [
      MASTER, '',
      '## Ajustes para esta vista de la app',
      '- Aquí no puedes consultar PubMed, doi.org ni internet. Por eso solo puedes usar como fuente lo que venga escrito en el MATERIAL, con su DOI o PMID tal como viene. No agregues DOI, PMID ni URL que no estén en el MATERIAL.',
      '- Para cada paso que quede sin fuente, propón en reporte.busquedas la consulta exacta que habría que hacer en PubMed para encontrarla. Eso no es una fuente: es una tarea pendiente.',
      '- En vez de los dos bloques de código y la tabla, devuelve un solo JSON con la forma de abajo. "proto" es la entrada de PROTOS y "datos" el objeto de DATOS, con los mismos campos del formato de salida.', '',
      'MATERIAL:', m, '',
      'Devuelve solo JSON con esta forma exacta:',
      '{"id": "id-con-guiones", "proto": {"esp": "", "t": "", "s": "", "extraTxt": "", "k": ""}, "datos": {"esp": "", "titulo": "", "bandera": "", "tags": [""], "alcance": "", "bandeja": [{"fase": "", "items": [""]}], "evidencia": [{"n": "01", "grado": "", "txt": ""}], "nota": "", "pasos": [{"corto": "", "hacer": "", "cond": "", "listo": "Terminaste cuando ...", "porque": [""], "marca": "", "disputa": "", "sinEv": "", "sub": [{"titulo": "ver fuentes", "fuentes": [{"grado": "", "cita": "", "loc": ""}]}], "aportes": []}]}, "reporte": {"fuentes": [{"paso": "01", "cita": "", "dato": "", "grado": ""}], "sinFuente": [{"paso": "02", "motivo": ""}], "busquedas": [{"paso": "02", "consulta": ""}], "conflictos": [""], "pendientes": [""]}}'
    ].join('\n'), setBor);
  };
  const segunda = () => {
    setValIA(null);
    pedir('validador', [
      'Eres el validador de Criterium. Revisas un protocolo ya escrito y senalas problemas de trazabilidad de la evidencia.',
      'Usa como criterio las reglas, los grados y la lista de revision de este documento (no redactes un protocolo nuevo):', MASTER, '',
      'Reglas del validador:',
      '- Todo paso debe tener fuente, o estar declarado como sin evidencia.',
      '- Una revision o metaanalisis no puede otorgar un grado superior al de los estudios que resume: una revision de estudios in vitro tiene techo grado C.',
      '- Una fuente obtenida en una poblacion distinta a la del protocolo debe estar declarada como tal.',
      '- Una cifra sin fuente debe estar declarada como extrapolacion.',
      '- Un paso en disputa debe decir que esta pendiente de resolucion.',
      'No inventes fuentes ni propongas referencias concretas que no esten en el texto.',
      'Se breve y concreto. Espanol simple. Como maximo ocho observaciones, las mas importantes.', '',
      'PROTOCOLO:', textoProtocolo(valProto), '', 'Devuelve solo JSON con esta forma exacta:',
      '{"observaciones": [{"paso": "07", "txt": ""}], "resumen": ""}'
    ].join('\n'), setValIA);
  };
  // El borrador sale con el formato de data.js: un .js para pegar y un .md con el reporte de verificación
  const D = (bor && bor.datos) || {};
  const R = (bor && bor.reporte) || {};
  const idBor = (bor && bor.id) || 'borrador-protocolo';
  const bajarBorrador = () => {
    if (!bor) return;
    const proto = { id: idBor, ...(bor.proto || {}), estadoTxt: 'Borrador v0.1', n: '', abre: true };
    const js = ['// Borrador generado por el asistente de Criterium con el master prompt. Sin revisar: no usar en un paciente.',
      '// Antes de pegarlo en src/data.js, verifica cada fuente (DOI y PMID) y completa las búsquedas pendientes.', '',
      '// En PROTOS:', JSON.stringify(proto, null, 2) + ',', '', '// En DATOS:', JSON.stringify(idBor) + ': ' + JSON.stringify(D, null, 2) + ','].join('\n');
    descargar(idBor + '.js', new Blob([js], { type: 'text/javascript' }), avisar);
    const md = ['# Reporte de verificación · ' + (D.titulo || idBor), '', '> Borrador sin revisar. No usar en un paciente.', '', '## Fuentes', ''];
    (R.fuentes || []).forEach((f) => md.push('- Paso ' + f.paso + ' · ' + f.cita + ' — ' + f.dato + ' (' + f.grado + ')'));
    md.push('', '## Pasos sin fuente', ''); (R.sinFuente || []).forEach((f) => md.push('- Paso ' + f.paso + ': ' + f.motivo));
    md.push('', '## Búsquedas pendientes en PubMed', ''); (R.busquedas || []).forEach((f) => md.push('- Paso ' + f.paso + ': `' + f.consulta + '`'));
    md.push('', '## Conflictos', ''); (R.conflictos || []).forEach((f) => md.push('- ' + f));
    md.push('', '## Pendientes', ''); (R.pendientes || []).forEach((f) => md.push('- ' + f));
    descargar(idBor + '-reporte.md', new Blob([md.join('\n')], { type: 'text/markdown' }), avisar);
  };
  const iaNecesaria = iaOff && <Aviso tono="neutro" className="mt-4 !font-medium">El asistente usa un modelo de lenguaje y no está disponible en esta vista. El validador automático de abajo funciona igual.</Aviso>;

  return (
    <div className="mx-auto flex max-w-[980px] flex-col gap-5">
      <PageHead eyebrow="Criterium · asistente" titulo="Trabaja sobre la biblioteca">
        Tres cosas: resolver una duda con lo que ya está escrito, convertir material de clase en un borrador con el formato de Criterium, y pasar un protocolo por el validador. El asistente no sale de la biblioteca: si algo no está, lo dice.
      </PageHead>
      <Seg valor={tab} onChange={(v) => { setTab(v); setError(''); }} opciones={[{ v: 'preguntar', t: 'Preguntar' }, { v: 'borrador', t: 'Borrador de protocolo' }, { v: 'validador', t: 'Validador' }]} />
      {error && <Aviso tono="warn">{error}</Aviso>}

      {tab === 'preguntar' && (
        <div className="flex flex-col gap-3">
          <Field label="Tu caso" id="asis-q">
            <textarea id="asis-q" rows={4} value={pregunta} onChange={(e) => setPregunta(e.target.value)} placeholder="Voy a cementar un provisional de 18 meses sobre un muñón corto endodonciado. ¿Qué cemento uso?" className={cx(inputCls, 'resize-y leading-relaxed')} />
          </Field>
          <div className="flex flex-wrap items-center gap-3"><Btn v="primary" onClick={preguntar} disabled={!!cargando || iaOff}>{cargando === 'preguntar' ? 'Leyendo la biblioteca…' : 'Resolver con la biblioteca'}</Btn><span className="text-[12px] text-ink3">Busca en los {abiertos.length} protocolos publicados</span></div>
          {iaNecesaria}
          {resp && (
            <div className="mt-2 tarjeta p-5 sm:p-6">
              {resp.enBiblioteca === false && <Pill tono="warn" className="mb-3">FUERA DE LA BIBLIOTECA</Pill>}
              {(resp.respuesta || []).map((t, i) => <p key={i} className="m-0 mb-3 font-serif text-[15.5px] leading-[1.7] text-ink">{t}</p>)}
              {(resp.pasos || []).length > 0 && (
                <div className="mt-4 border-t border-line pt-3.5">
                  <h3 className="m-0 mb-2 rotulo">De dónde sale</h3>
                  {resp.pasos.map((c, i) => <div key={i} className="grid grid-cols-[34px_minmax(0,1fr)] gap-2.5 py-1.5 text-[13.5px] text-ink2"><b className="text-acentodeep">{c.n}</b><span>{c.corto}<span className="mt-0.5 block text-[11.5px] text-ink3">{c.protocolo}</span></span></div>)}
                </div>
              )}
              {resp.aviso && <p className="m-0 mt-3.5 text-[12.5px] leading-relaxed text-ink3">{resp.aviso}</p>}
            </div>
          )}
        </div>
      )}

      {tab === 'borrador' && (
        <div className="flex flex-col gap-3">
          <Field label="Material en bruto" id="asis-m" hint={material.trim().length + ' caracteres · mínimo 80'}>
            <textarea id="asis-m" rows={8} value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Pega aquí el apunte, la transcripción de la clase o tus notas del box. El asistente lo devuelve con el formato de Criterium: paso, criterio de término y por qué." className={cx(inputCls, 'resize-y leading-relaxed')} />
          </Field>
          <div className="flex flex-wrap items-center gap-3"><Btn v="primary" onClick={hacerBorrador} disabled={!!cargando || iaOff}>{cargando === 'borrador' ? 'Escribiendo el borrador…' : 'Convertir en borrador'}</Btn><span className="text-[12px] text-ink3">No inventa citas. Lo que no tenga respaldo sale marcado.</span></div>
          {iaNecesaria}
          {bor && (
            <div className="mt-2 flex flex-col gap-2.5">
              <Aviso>BORRADOR SIN REVISAR · NO USAR EN UN PACIENTE</Aviso>
              <h2 className="m-0 text-[22px] font-extrabold leading-tight tracking-[-.02em] text-deep">{D.titulo || 'Borrador sin título'}</h2>
              <p className="m-0 mb-2 font-serif text-[15px] leading-relaxed text-ink2"><b className="font-sans text-[13px] text-ink">Alcance:</b> {D.alcance}</p>
              {(D.pasos || []).map((s, i) => {
                const fuentes = (s.sub || []).flatMap((x) => x.fuentes || []);
                return (
                  <div key={i} className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 tarjeta p-4">
                    <b className="text-[13px] tabular-nums text-acentodeep">{('0' + (i + 1)).slice(-2)}</b>
                    <div className="min-w-0">
                      <h3 className="m-0 mb-1.5 text-[15.5px] font-bold text-deep">{s.corto}</h3>
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {s.marca && <Pill tono="warn">{s.marca}</Pill>}
                        {fuentes.length ? <Pill tono="ok">{fuentes.length === 1 ? '1 fuente' : fuentes.length + ' fuentes'}</Pill> : <Pill>Práctica habitual · sin fuente</Pill>}
                      </div>
                      {s.cond && <p className="m-0 mb-1.5 text-[13px] text-ink3">{s.cond}</p>}
                      <p className="m-0 mb-2 text-[14.5px] leading-relaxed text-ink">{s.hacer}</p>
                      <p className="m-0 mb-2 text-[13.5px] font-semibold leading-relaxed text-acentodeep">{s.listo}</p>
                      {(s.porque || []).map((q, k) => <p key={k} className="m-0 mb-1.5 font-serif text-[14px] leading-relaxed text-ink2">{q}</p>)}
                      {s.sinEv && <p className="m-0 mt-1 text-[12.5px] text-ink3">◻ {s.sinEv}</p>}
                    </div>
                  </div>
                );
              })}
              {[['Búsquedas pendientes en PubMed', (R.busquedas || []).map((b) => 'Paso ' + b.paso + ': ' + b.consulta)],
                ['Pasos sin fuente', (R.sinFuente || []).map((b) => 'Paso ' + b.paso + ': ' + b.motivo)],
                ['Conflictos entre fuentes', R.conflictos || []],
                ['Falta verificar antes de publicar', R.pendientes || []]].filter(([, l]) => l.length).map(([h, l]) => (
                <div key={h} className="rounded-r border border-line bg-soft p-5"><h3 className="m-0 mb-2 rotulo">{h}</h3><ul className="m-0 pl-5 text-[13.5px] leading-[1.7] text-ink2">{l.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
              ))}
              <Btn icon="download" className="self-start" onClick={bajarBorrador}>Descargar para data.js y el reporte</Btn>
            </div>
          )}
        </div>
      )}

      {tab === 'validador' && (
        <div className="flex flex-col gap-4">
          <Field label="Protocolo a revisar" id="val-proto" className="max-w-[480px]">
            <select id="val-proto" value={valProto} onChange={(e) => { setValProto(e.target.value); setValIA(null); }} className={inputCls}>
              {abiertos.map((p) => <option key={p.id} value={p.id}>{p.t}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[[val.total, 'pasos revisados', 'text-deep'], [val.ok, 'sin observaciones', 'text-acentodeep'], [val.revisar, 'a revisar', 'text-ink2'], [val.falla, 'rompen una regla', 'text-warn']].map(([n, t, c]) => (
              <div key={t} className="tarjeta px-4 py-3"><b className={cx('block text-[24px] font-extrabold tabular-nums', c)}>{n}</b><span className="text-[12px] text-ink3">{t}</span></div>
            ))}
          </div>
          <p className="m-0 text-[14px] font-semibold leading-relaxed text-ink">{val.veredicto}</p>
          <div className="flex flex-col gap-2">
            {val.filas.map((f) => (
              <div key={f.n} className="grid grid-cols-[30px_minmax(0,1fr)] items-start gap-2.5 tarjeta px-4 py-3 sm:grid-cols-[30px_minmax(0,1fr)_auto]">
                <b className="text-[13px] tabular-nums text-acentodeep">{f.n}</b>
                <div>
                  <h3 className="m-0 mb-0.5 text-[14.5px] font-bold text-deep">{f.corto}</h3>
                  <p className="m-0 text-[12px] text-ink3">{f.nFuentes}</p>
                  {f.avisos.length > 0 && <ul className="m-0 mt-2 pl-4 text-[13px] leading-relaxed text-ink2">{f.avisos.map((a, i) => <li key={i}>{a}</li>)}</ul>}
                </div>
                <div className="col-start-2 sm:col-start-auto"><Pill tono={f.estado === 'falla' ? 'warn' : f.estado === 'revisar' ? 'neutro' : 'acento'} className="uppercase">{f.estado}</Pill></div>
              </div>
            ))}
          </div>
          <div className="border-t border-line pt-4">
            <Btn onClick={segunda} disabled={!!cargando || iaOff} icon="sparkle">{cargando === 'validador' ? 'Revisando el protocolo…' : 'Pedir una segunda lectura al asistente'}</Btn>
            <p className="m-0 mt-2.5 max-w-[68ch] text-[12px] leading-relaxed text-ink3">Lo de arriba lo calcula la página sola y da siempre el mismo resultado. Esta segunda lectura la hace un modelo de lenguaje: sirve para encontrar lo que una regla fija no ve, y hay que leerla con ojo crítico.</p>
            {iaNecesaria}
            {valIA && (
              <div className="mt-4 tarjeta p-5">
                {(valIA.observaciones || []).map((o, i) => <div key={i} className="grid grid-cols-[34px_minmax(0,1fr)] gap-2.5 border-b border-line py-2"><b className="text-[13px] text-acentodeep">{o.paso}</b><p className="m-0 text-[13.5px] leading-relaxed text-ink2">{o.txt}</p></div>)}
                <p className="m-0 mt-3.5 font-serif text-[14.5px] leading-relaxed text-ink">{valIA.resumen}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Las Herramientas (calculadoras) viven en views/herramientas.jsx
