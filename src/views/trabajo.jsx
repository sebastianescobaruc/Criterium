import React, { useState, useEffect } from 'react';
import { DATOS } from '../data.js';
import { validar, perio, endo, anestesia, anestesiaNino, ANEST_NINO, bibliotecaTexto, textoProtocolo, protosAbiertos, cap, errIA, descargar } from '../logic.js';
import { useApp } from '../ctx.js';
import { Ic, Pill, Btn, Field, Seg, Aviso, PageHead, inputCls, cx } from '../ui.jsx';
import { Periodontograma } from './periodontograma.jsx';

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
      'Eres el asistente de Criterium. Conviertes material clinico en un borrador de protocolo con el formato de la biblioteca.',
      'Reglas que no se rompen:',
      '1. No inventes citas, referencias, autores, anos ni DOI. Nunca.',
      '2. Si un paso no trae respaldo en el material, escribe "sin evidencia" en su campo marca.',
      '3. No atribuyas nada a ninguna facultad, escuela ni docente. Lo que venga de apuntes se escribe como practica habitual.',
      '4. Cada paso lleva una instruccion corta en corto, la accion en hacer, y en listo un criterio de termino que empiece por "Terminaste cuando".',
      '5. El campo porque explica el fundamento en frases cortas, sin citas.',
      '6. Espanol simple, para un estudiante de primer ano.',
      '7. En faltan enumera lo que hay que verificar o buscar antes de publicar esto.', '',
      'MATERIAL:', m, '', 'Devuelve solo JSON con esta forma exacta:',
      '{"titulo": "", "alcance": "", "pasos": [{"corto": "", "hacer": "", "listo": "", "porque": [""], "marca": ""}], "faltan": [""]}'
    ].join('\n'), setBor);
  };
  const segunda = () => {
    setValIA(null);
    pedir('validador', [
      'Eres el validador de Criterium. Revisas un protocolo ya escrito y senalas problemas de trazabilidad de la evidencia.',
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
  const bajarBorrador = () => {
    if (!bor) return;
    const md = ['# ' + (bor.titulo || 'Borrador de protocolo'), '', '**Alcance:** ' + (bor.alcance || ''), '', '> Borrador generado por el asistente de Criterium a partir de material sin revisar. No usar en un paciente.', ''];
    (bor.pasos || []).forEach((x, i) => {
      md.push('## ' + ('0' + (i + 1)).slice(-2) + ' · ' + (x.corto || ''));
      if (x.marca) md.push('*' + x.marca + '*');
      md.push('', x.hacer || '', '', '**' + (x.listo || '') + '**', '');
      (x.porque || []).forEach((t) => md.push('- ' + t)); md.push('');
    });
    if ((bor.faltan || []).length) { md.push('## Falta verificar antes de publicar', ''); bor.faltan.forEach((t) => md.push('- ' + t)); }
    descargar('borrador-protocolo.md', new Blob([md.join('\n')], { type: 'text/markdown' }), avisar);
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
                  <h3 className="m-0 mb-2 text-[11.5px] font-bold uppercase tracking-[.04em] text-ink3">De dónde sale</h3>
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
              <h2 className="m-0 text-[22px] font-extrabold leading-tight tracking-[-.02em] text-deep">{bor.titulo || 'Borrador sin título'}</h2>
              <p className="m-0 mb-2 font-serif text-[15px] leading-relaxed text-ink2"><b className="font-sans text-[13px] text-ink">Alcance:</b> {bor.alcance}</p>
              {(bor.pasos || []).map((s, i) => (
                <div key={i} className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 tarjeta p-4">
                  <b className="text-[13px] tabular-nums text-acentodeep">{('0' + (i + 1)).slice(-2)}</b>
                  <div>
                    <h3 className="m-0 mb-1.5 text-[15.5px] font-bold text-deep">{s.corto}</h3>
                    {s.marca && <Pill tono="warn" className="mb-2">{s.marca}</Pill>}
                    <p className="m-0 mb-2 text-[14.5px] leading-relaxed text-ink">{s.hacer}</p>
                    <p className="m-0 mb-2 text-[13.5px] font-semibold leading-relaxed text-acentodeep">{s.listo}</p>
                    {(s.porque || []).map((q, k) => <p key={k} className="m-0 mb-1.5 font-serif text-[14px] leading-relaxed text-ink2">{q}</p>)}
                  </div>
                </div>
              ))}
              {(bor.faltan || []).length > 0 && (
                <div className="rounded-r border border-line bg-soft p-5"><h3 className="m-0 mb-2 text-[11.5px] font-bold uppercase tracking-[.04em] text-ink3">Falta verificar antes de publicar</h3><ul className="m-0 pl-5 text-[13.5px] leading-[1.7] text-ink2">{bor.faltan.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
              )}
              <Btn icon="download" className="self-start" onClick={bajarBorrador}>Descargar el borrador en Markdown</Btn>
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

/* ═════════ HERRAMIENTAS ═════════ */
function Num({ id, label, value, onChange, placeholder, step = '1', min = '0', max, hint }) {
  return (
    <Field label={label} id={id} hint={hint}>
      <input id={id} type="number" inputMode="decimal" step={step} min={min} max={max} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </Field>
  );
}
function SiNo({ id, label, value, onChange, opciones }) {
  return (
    <Field label={label} id={id}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {(opciones || [['no', 'No'], ['si', 'Sí']]).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </Field>
  );
}
function Caja({ n, t }) { return <div className="flex-1 basis-[140px] tarjeta px-4 py-3"><b className="block text-[22px] font-extrabold tabular-nums text-acentodeep">{n}</b><span className="text-[11.5px] text-ink3">{t}</span></div>; }
function Falta({ titulo = 'Qué falta verificar antes de publicar esto', items }) {
  return <div className="rounded-r border border-line bg-soft p-5"><h3 className="m-0 mb-2 text-[11.5px] font-bold uppercase tracking-[.04em] text-ink3">{titulo}</h3><ul className="m-0 pl-5 text-[13px] leading-[1.7] text-ink2">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>;
}

export function Herramientas() {
  const { herrTab: tab, setHerrTab: setTab } = useApp();
  const [st, setSt] = useState({
    pCal: '5', pRbl: '40', pEdad: '45', pPerdidos: '0', pPs: '6', pExt: '30', pVert: 'no', pFurca: 'no', pSt4: 'no', pTabaco: '0', pHba: '',
    eTipo: 'necro', eLrd: '22', eLad: '', eLi: '15', eLm: '30', eAmplio: 'no',
    aPeso: '60', aUsados: '0',
    aModo: 'adulto', nPeso: '20', nEdad: '6', nAnest: 'lido', nUsados: '0', nSeda: 'no'
  });
  const f = (k) => (v) => setSt((s) => ({ ...s, [k]: v }));
  const [chart, setChart] = useState({});
  const [desdePerio, setDesdePerio] = useState(null);
  const usarPeriodontograma = (r) => {
    setSt((s) => ({ ...s, pCal: String(r.nicMax), pPs: r.psMax === null ? s.pPs : String(r.psMax), pFurca: r.furcaAvanzada ? 'si' : 'no', pSt4: r.movilidad2 ? 'si' : s.pSt4 }));
    setDesdePerio(r); setTab('perio');
  };
  const rp = perio(st), re = endo(st), ra = anestesia(st), rn = anestesiaNino(st);
  return (
    <div className="mx-auto flex max-w-[980px] flex-col gap-5">
      <PageHead eyebrow="Criterium · herramientas" titulo="Calculadoras clínicas">
        Metes los datos del paciente y sale el resultado con el razonamiento a la vista, no solo el número. Mismo criterio que los protocolos: si un umbral está en discusión, se dice.
      </PageHead>
      <Aviso>BORRADOR · UMBRALES SIN VERIFICAR CONTRA LA FUENTE · NO USAR EN UN PACIENTE</Aviso>
      <Seg valor={tab} onChange={setTab} opciones={[{ v: 'perio', t: 'Periodoncia · estadio y grado' }, { v: 'periodonto', t: 'Periodontograma' }, { v: 'endo', t: 'Endodoncia · step-back' }, { v: 'anest', t: 'Anestesia · dosis máxima' }]} />
      <p className="m-0 text-[12px] text-ink3">Vienen con un paciente de ejemplo cargado. Cambia los datos por los tuyos.</p>

      {tab === 'periodonto' && <Periodontograma chart={chart} setChart={setChart} onUsar={usarPeriodontograma} />}

      {tab === 'perio' && (
        <div className="flex flex-col gap-5">
          {desdePerio && <Aviso tono="acento">Datos traídos del periodontograma: NIC interdental máximo {desdePerio.nicMax} mm ({desdePerio.nicMaxDiente}), sondaje máximo {desdePerio.psMax} mm, furca II o III: {desdePerio.furcaAvanzada ? 'sí' : 'no'}{desdePerio.movilidad2 ? ', movilidad 2 o más' : ''}. La pérdida ósea, la edad, los dientes perdidos y la extensión los completas tú.</Aviso>}
          <p className="m-0 max-w-[72ch] text-[13.5px] leading-relaxed text-ink2">Clasificación de periodontitis de 2018: estadio por severidad y complejidad, extensión, y grado por velocidad de progresión. El estadio lo manda el criterio más grave, no el promedio.</p>
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <Num id="pCal" label="CAL interdental máxima (mm)" step="0.5" value={st.pCal} onChange={f('pCal')} placeholder="5" />
            <Num id="pRbl" label="Pérdida ósea radiográfica (% de la raíz)" max="100" value={st.pRbl} onChange={f('pRbl')} placeholder="40" />
            <Num id="pEdad" label="Edad (años)" min="1" value={st.pEdad} onChange={f('pEdad')} placeholder="45" />
            <Num id="pPerdidos" label="Dientes perdidos por periodontitis" value={st.pPerdidos} onChange={f('pPerdidos')} placeholder="0" />
            <Num id="pPs" label="Profundidad de sondaje máxima (mm)" value={st.pPs} onChange={f('pPs')} placeholder="6" />
            <Num id="pExt" label="Sitios afectados (%)" max="100" value={st.pExt} onChange={f('pExt')} placeholder="30" />
            <SiNo id="pVert" label="Defecto vertical de 3 mm o más" value={st.pVert} onChange={f('pVert')} />
            <SiNo id="pFurca" label="Furca clase II o III" value={st.pFurca} onChange={f('pFurca')} />
            <SiNo id="pSt4" label="Colapso de mordida, movilidad 2+ o menos de 20 dientes" value={st.pSt4} onChange={f('pSt4')} />
            <Num id="pTabaco" label="Cigarrillos al día" value={st.pTabaco} onChange={f('pTabaco')} placeholder="0" />
            <Num id="pHba" label="HbA1c (%) si es diabético" step="0.1" value={st.pHba} onChange={f('pHba')} placeholder="vacío si no aplica" />
          </div>
          {!rp.listo ? <p className="m-0 text-[13.5px] text-ink3">{rp.aviso}</p> : (
            <div className="tarjeta p-5 sm:p-6">
              <h2 className="m-0 mb-4 text-[21px] font-extrabold leading-tight tracking-[-.02em] text-deep">{rp.dx}</h2>
              <div className="mb-5 flex flex-wrap gap-2.5">
                <div className="flex-1 basis-[130px] rounded-rs bg-soft px-4 py-3"><b className="block text-[22px] font-extrabold text-acentodeep">{rp.estadio}</b><span className="text-[11.5px] text-ink3">estadio</span></div>
                <div className="flex-1 basis-[130px] rounded-rs bg-soft px-4 py-3"><b className="block text-[22px] font-extrabold text-acentodeep">{rp.grado}</b><span className="text-[11.5px] text-ink3">grado</span></div>
              </div>
              <h3 className="m-0 mb-2 text-[11.5px] font-bold uppercase tracking-[.04em] text-ink3">Cómo salió el estadio</h3>
              <ul className="m-0 mb-4 pl-5 text-[13.5px] leading-[1.7] text-ink2">{rp.porque.map((r, i) => <li key={i}>{r}</li>)}</ul>
              <h3 className="m-0 mb-2 text-[11.5px] font-bold uppercase tracking-[.04em] text-ink3">Cómo salió el grado</h3>
              <ul className="m-0 pl-5 text-[13.5px] leading-[1.7] text-ink2">{rp.porqueG.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}
          <Falta items={[
            'Todos los umbrales están escritos de memoria y hay que contrastarlos uno por uno contra los artículos de la clasificación de 2018, no contra un resumen.',
            'Falta la evidencia directa como criterio de grado: pérdida de inserción o de hueso medida en 5 años. Aquí solo está la razón pérdida ósea sobre edad, que es evidencia indirecta.',
            'Falta el fenotipo del caso como criterio de grado: cuánta destrucción hay comparada con la cantidad de biofilm.',
            'No distingue el patrón incisivo-molar dentro de la extensión.',
            'La calculadora no diagnostica: asume que ya decidiste que es periodontitis y no gingivitis ni otra condición.'
          ]} />
        </div>
      )}

      {tab === 'endo' && (
        <div className="flex flex-col gap-5">
          <p className="m-0 max-w-[72ch] text-[13.5px] leading-relaxed text-ink2">Metes la longitud que te dio el localizador y sale la secuencia completa de step-back para ese conducto, con los milímetros ya calculados. Repite conducto por conducto: las longitudes no son iguales.</p>
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <SiNo id="eTipo" label="Tipo de tratamiento" value={st.eTipo} onChange={f('eTipo')} opciones={[['necro', 'Necropulpectomía'], ['biopulp', 'Biopulpectomía']]} />
            <Num id="eLrd" label="LRD · longitud real del diente (mm)" step="0.5" value={st.eLrd} onChange={f('eLrd')} placeholder="22" />
            <Num id="eLad" label="LAD · longitud aparente (mm)" step="0.5" value={st.eLad} onChange={f('eLad')} placeholder="vacía = se usa la LRD" />
            <Num id="eLi" label="Lima inicial (LI)" step="5" min="6" value={st.eLi} onChange={f('eLi')} placeholder="15" />
            <Num id="eLm" label="Lima maestra (LM) · mínimo 30" step="5" min="30" value={st.eLm} onChange={f('eLm')} placeholder="30" />
            <SiNo id="eAmplio" label="Conducto amplio" value={st.eAmplio} onChange={f('eAmplio')} opciones={[['no', 'No · fino o medio'], ['si', 'Sí · amplio']]} />
          </div>
          {!re.listo ? <p className="m-0 text-[13.5px] text-ink3">{re.aviso}</p> : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2.5"><Caja n={re.lt} t="longitud de trabajo" /><Caja n={re.permeabilidad} t="lima de pasaje" /><Caja n={re.dosTercios} t="tope Gates y aguja" /><Caja n={re.cateterismo} t="margen del cateterismo" /></div>
              <div className="tarjeta px-4 py-3.5 text-[13.5px] leading-[1.75] text-ink2">
                <div><b className="text-ink">Irrigante:</b> {re.irrigante}</div>
                <div><b className="text-ink">Gates Glidden:</b> {re.gates}, máximo 3 entradas por conducto, activa al entrar y al salir</div>
                <div><b className="text-ink">Medicación entre sesiones:</b> hidróxido de calcio hasta {re.medicacion}</div>
              </div>
              {[['1.ª fase · lima inicial y ampliación apical', re.fase1], ['2.ª fase · escalonado y empalme', re.fase2]].map(([t, l]) => (
                <div key={t}>
                  <h3 className="m-0 mb-2 text-[11.5px] font-bold uppercase tracking-[.04em] text-ink3">{t}</h3>
                  <div className="flex flex-col gap-1.5">
                    {l.map((x, i) => (
                      <div key={i} className="grid grid-cols-[96px_80px_minmax(0,1fr)] items-baseline gap-3 rounded-rs border border-cardline bg-card shadow-sh px-3.5 py-2.5">
                        <b className="text-[14px] tabular-nums text-deep">{x.lima}</b><span className="text-[14px] font-bold tabular-nums text-acentodeep">{x.prof}</span><span className="text-[12.5px] text-ink3">{x.nota}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <p className="m-0 max-w-[72ch] text-[13.5px] leading-relaxed text-ink2">{re.empalme}</p>
              <Aviso>{re.conflicto}</Aviso>
            </div>
          )}
          <Falta titulo="De dónde sale esto y qué falta" items={[
            'Las reglas vienen de tu propio protocolo de necropulpectomía de premolar superior: LT igual a LRD menos 1 mm, pasaje a LT más 1 mm, Gates y aguja a dos tercios de la LAD, lima maestra mínima 30, step-back hasta 50.',
            'El escalonado de menos 1, menos 2 y menos 3 mm está en tu protocolo. Seguir bajando hasta llegar al 50 es una extensión de esa regla, no algo que el documento diga paso por paso.',
            'La biopulpectomía está resuelta con la misma resta de 1 mm. Tu protocolo dice 1 a 1,5 mm para ese caso: hay que decidir cuál se usa.',
            'Falta el número de limas por encima de la inicial: tu protocolo dice 4 o 5 en necropulpectomía, y eso todavía no entra en el cálculo.',
            'La calculadora no reemplaza la radiografía de conductometría.'
          ]} />
        </div>
      )}

      {tab === 'anest' && (
        <Seg size="sm" valor={st.aModo} onChange={f('aModo')} opciones={[{ v: 'adulto', t: 'Adulto' }, { v: 'nino', t: 'Niño · AAPD' }]} />
      )}

      {tab === 'anest' && st.aModo === 'nino' && (
        <div className="flex flex-col gap-5">
          <p className="m-0 max-w-[72ch] text-[13.5px] leading-relaxed text-ink2">Dosis máxima para menores de 18 años según la tabla de la Academia Americana de Odontología Pediátrica (AAPD). Es más baja que la del adulto: en lidocaína, 4,4 mg por kilo en vez de 7. Tubos de 1,8 ml.</p>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <SiNo id="nAnest" label="Anestésico" value={st.nAnest} onChange={f('nAnest')} opciones={Object.entries(ANEST_NINO).map(([k, a]) => [k, a.t])} />
            <Num id="nPeso" label="Peso del niño (kg)" step="0.5" min="2" value={st.nPeso} onChange={f('nPeso')} placeholder="20" />
            <Num id="nEdad" label="Edad (años)" step="0.1" value={st.nEdad} onChange={f('nEdad')} placeholder="6" hint="Si tiene meses, usa decimales: 5 meses = 0,4." />
            <Num id="nUsados" label="Tubos ya usados en la sesión" step="0.5" value={st.nUsados} onChange={f('nUsados')} placeholder="0" />
            <SiNo id="nSeda" label="¿Con sedación u otro depresor del SNC?" value={st.nSeda} onChange={f('nSeda')} />
          </div>
          {!rn.listo ? (rn.bloqueo ? <Aviso tono="bad">{rn.aviso}</Aviso> : <p className="m-0 text-[13.5px] text-ink3">{rn.aviso}</p>) : (
            <div className="flex flex-col gap-4">
              {rn.pasado && <Aviso tono="bad">Los tubos registrados superan la dosis máxima para este peso. Detente y avisa al docente.</Aviso>}
              {rn.avisos.map((t, i) => <Aviso key={i} tono="warn">{t}</Aviso>)}
              <div className="flex flex-wrap gap-2.5"><Caja n={rn.maxMg} t="dosis máxima" /><Caja n={rn.maxTubos} t="tubos como máximo" /><Caja n={rn.usadoMg} t="usado hasta ahora" /><Caja n={rn.quedanTubos} t="tubos de margen" /></div>
              <div className="tarjeta p-5">
                <h3 className="m-0 mb-2 text-[11.5px] font-bold uppercase tracking-[.04em] text-ink3">Cómo salió</h3>
                <ul className="m-0 pl-5 text-[13.5px] leading-[1.7] text-ink2">{rn.porque.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            </div>
          )}
          <Falta titulo="De dónde sale esto y qué falta" items={[
            'Fuente: AAPD, Use of Local Anesthesia for Pediatric Dental Patients (revisión 2023). The Reference Manual of Pediatric Dentistry 2025, tabla de la pág. 408 y recomendaciones de la pág. 411.',
            'Lidocaína: la AAPD usa 4,4 mg/kg, más conservador que los 7 mg/kg del fabricante. Articaína: 7 mg/kg, y no se recomienda bajo 4 años.',
            'En menores de 6 meses la AAPD pide bajar un 30 % la dosis de las amidas. La calculadora lo descuenta sola.',
            'La tabla de la AAPD no fija un techo total en mg, solo mg por kilo. En un adolescente grande revisa también la dosis de adulto.',
            'La tabla usa tubos de 1,7 ml. Aquí se calcula con 1,8 ml, el tubo habitual en Chile.',
            'El anestésico tópico también se absorbe y la AAPD pide sumarlo al total. La calculadora no lo incluye.',
            'Prilocaína y bupivacaína no están cargadas. La bupivacaína no se recomienda bajo 12 años.'
          ]} />
        </div>
      )}

      {tab === 'anest' && st.aModo !== 'nino' && (
        <div className="flex flex-col gap-5">
          <p className="m-0 max-w-[72ch] text-[13.5px] leading-relaxed text-ink2">Lidocaína al 2 % con epinefrina 1:100.000 en tubos de 1,8 ml. El techo es 7 mg por kilo, sin pasar nunca de 500 mg. Es el mismo dato que usa el protocolo de exodoncia del 1.8.</p>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Num id="aPeso" label="Peso del paciente (kg)" step="0.5" min="5" value={st.aPeso} onChange={f('aPeso')} placeholder="60" />
            <Num id="aUsados" label="Tubos ya usados en la sesión" step="0.5" value={st.aUsados} onChange={f('aUsados')} placeholder="0" />
          </div>
          {!ra.listo ? <p className="m-0 text-[13.5px] text-ink3">{ra.aviso}</p> : (
            <div className="flex flex-col gap-4">
              {ra.pasado && <Aviso tono="bad">Los tubos registrados superan la dosis máxima para este peso. Detente y avisa al docente.</Aviso>}
              <div className="flex flex-wrap gap-2.5"><Caja n={ra.maxMg} t="dosis máxima" /><Caja n={ra.maxTubos} t="tubos como máximo" /><Caja n={ra.usadoMg} t="usado hasta ahora" /><Caja n={ra.quedanTubos} t="tubos de margen" /></div>
              <div className="tarjeta p-5">
                <h3 className="m-0 mb-2 text-[11.5px] font-bold uppercase tracking-[.04em] text-ink3">Cómo salió</h3>
                <ul className="m-0 pl-5 text-[13.5px] leading-[1.7] text-ink2">{ra.porque.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            </div>
          )}
          <Falta titulo="De dónde sale esto y qué falta" items={[
            'Fuente: ficha técnica de la FDA para lidocaína con epinefrina, la misma que cita el protocolo de exodoncia del 1.8. Falta el localizador de párrafo.',
            'La dosis máxima es un techo, no una meta. Quedarse corto por miedo a la dosis es un error más frecuente que pasarse.',
            'No calcula el límite propio de la epinefrina en pacientes con enfermedad cardiovascular. Ese caso se decide aparte.',
            'Solo cubre lidocaína al 2 % con epinefrina. Otros anestésicos tienen otros techos y no están cargados.'
          ]} />
        </div>
      )}
    </div>
  );
}
