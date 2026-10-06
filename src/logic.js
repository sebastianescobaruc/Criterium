import { PROTOS, DATOS } from './data.js';

export const AREAS = ['Rehabilitación oral', 'Cirugía bucal', 'Periodoncia', 'Endodoncia', 'Odontopediatría', 'Ortodoncia', 'Radiología', 'Educación en ciencias de la salud'];
export const ORDEN_ESP = ['Rehabilitación oral', 'Periodoncia', 'Endodoncia', 'Cirugía', 'Odontopediatría'];
export const ESPECIALIDADES_CASO = ['Rehabilitación oral', 'Operatoria', 'Periodoncia', 'Endodoncia', 'Cirugía bucal', 'Odontopediatría', 'Ortodoncia', 'Otra'];
export const TIPOS_FOTO = ['Inicial', 'Progreso', 'Final', 'Radiografía'];

export const ESTADOS = {
  borrador: { txt: 'Borrador', tono: 'neutro' },
  enviado: { txt: 'En revisión', tono: 'acento' },
  cambios: { txt: 'Cambios pedidos', tono: 'warn' },
  aprobado: { txt: 'Aprobado', tono: 'ok' },
  denegado: { txt: 'Denegado', tono: 'bad' }
};

export const MOTIVOS = [
  'Indicación no justificada',
  'Paso crítico omitido',
  'Desvío del protocolo sin respaldo',
  'Evidencia insuficiente para lo que se hizo',
  'Registro incompleto: fotos, radiografía o ficha',
  'Riesgo para el paciente no declarado'
];

export const CRITERIOS = [
  { k: 'pertinencia', t: 'Pertinencia', d: '¿El procedimiento estaba indicado para este diagnóstico?' },
  { k: 'claridad', t: 'Claridad del registro', d: '¿Con lo documentado se entiende qué se hizo y por qué?' },
  { k: 'evidencia', t: 'Suficiencia de la evidencia', d: '¿Lo que se hizo tiene respaldo suficiente?' }
];

export const nn = (i) => ('0' + (i + 1)).slice(-2);
export const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const iniciales = (n) => (n || '?').trim().split(/[\s.]+/).filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join('') || '?';

const fmtFecha = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtCorta = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' });
export const fecha = (iso) => { try { return fmtFecha.format(new Date(iso)); } catch (e) { return ''; } };
export const fechaCorta = (iso) => { try { return fmtCorta.format(new Date(iso)); } catch (e) { return ''; } };
export const hoyISO = () => new Date().toISOString().slice(0, 10);
export function hace(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'recién';
  if (d < 3600) return 'hace ' + Math.floor(d / 60) + ' min';
  if (d < 86400) return 'hace ' + Math.floor(d / 3600) + ' h';
  if (d < 86400 * 7) return 'hace ' + Math.floor(d / 86400) + ' d';
  return fecha(iso);
}
export function diasHasta(isoDia) {
  const a = new Date(hoyISO() + 'T00:00:00'); const b = new Date(isoDia + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

export const protoPorId = (id) => PROTOS.find((p) => p.id === id);
export const protosAbiertos = () => PROTOS.filter((p) => p.abre && DATOS[p.id]);

/* ───────── dientes en notación FDI ───────── */
export function validarDientes(txt) {
  const partes = (txt || '').split(/[,\s;y]+/).map((x) => x.trim()).filter(Boolean);
  if (!partes.length) return 'Escribe el o los dientes en notación FDI, por ejemplo 3.6 o 1.8.';
  for (const p of partes) {
    const m = p.replace('.', '').match(/^([1-8])([1-8])$/);
    if (!m) return '“' + p + '” no es un diente FDI válido. Usa cuadrante y diente: 1.1 a 4.8, o 5.1 a 8.5 en temporales.';
    const c = +m[1], d = +m[2];
    if (c >= 5 && d > 5) return '“' + p + '”: en dentición temporal cada cuadrante llega hasta el 5.';
  }
  return '';
}

/* ───────── texto de un protocolo (para el asistente) ───────── */
export function textoProtocolo(id) {
  const d = DATOS[id];
  if (!d) return '';
  const out = ['PROTOCOLO ' + id + ' — ' + d.titulo, 'Area: ' + d.esp, 'Alcance: ' + d.alcance];
  d.pasos.forEach((s, i) => {
    out.push('PASO ' + nn(i) + ' · ' + s.corto);
    if (s.cond) out.push('  Condicion: ' + s.cond);
    if (s.marca) out.push('  Marca: ' + s.marca);
    if (s.disputa) out.push('  En disputa: ' + s.disputa);
    if (s.sinEv) out.push('  ' + s.sinEv);
    out.push('  Hacer: ' + s.hacer);
    if (s.listo) out.push('  Criterio de termino: ' + s.listo);
    (s.porque || []).forEach((t) => out.push('  Por que: ' + t));
    (s.sub || []).forEach((x) => {
      out.push('  [' + x.titulo + ']');
      (x.parrafos || []).forEach((t) => out.push('    ' + t));
      (x.fuentes || []).forEach((f) => out.push('    Fuente (' + f.grado + '): ' + f.cita + ' — ' + f.loc));
      (x.arbol || []).forEach((a) => out.push('    Arbol: ' + a.q + ' -> ' + a.a));
    });
  });
  return out.join('\n');
}
export const bibliotecaTexto = () => protosAbiertos().map((p) => textoProtocolo(p.id)).join('\n\n');

/* ───────── validador de protocolos (reglas fijas) ───────── */
export function validar(id) {
  const d = DATOS[id];
  if (!d) return { filas: [], total: 0, ok: 0, revisar: 0, falla: 0, veredicto: 'Sin datos' };
  let nFalla = 0, nAviso = 0, nOk = 0;
  const filas = d.pasos.map((s, i) => {
    const fuentes = [];
    (s.sub || []).forEach((x) => (x.fuentes || []).forEach((f) => fuentes.push(f)));
    const avisos = []; let estado = 'ok';
    if (!fuentes.length && !s.sinEv) { avisos.push('Sin fuente declarada y sin marca de sin evidencia.'); estado = 'falla'; }
    if (s.sinEv) { avisos.push('Declarado sin evidencia: práctica habitual. Correcto si es deliberado.'); if (estado === 'ok') estado = 'revisar'; }
    if (s.disputa) { avisos.push('Paso en disputa, pendiente de resolución del panel.'); if (estado === 'ok') estado = 'revisar'; }
    fuentes.forEach((f) => {
      const g = f.grado || '', txt = (f.cita || '') + ' ' + g;
      if (/revisi|metaan|meta-an/i.test(txt) && /in vitro/i.test(txt) && /Grado A|Grado B/i.test(g)) {
        avisos.push('Techo de grado roto: una revisión de estudios in vitro no puede otorgar grado A ni B.'); estado = 'falla';
      }
      if (/pendiente/i.test(f.loc || '')) { avisos.push('Localizador de párrafo pendiente.'); if (estado === 'ok') estado = 'revisar'; }
      if (/poblacion distinta|población distinta/i.test(txt) && !/ojo con esta evidencia/i.test(JSON.stringify(s.sub || []))) {
        avisos.push('Fuente en población distinta sin bloque que lo declare.'); estado = 'falla';
      }
    });
    if (estado === 'falla') nFalla++; else if (estado === 'revisar') nAviso++; else nOk++;
    return { n: nn(i), corto: s.corto, estado, nFuentes: fuentes.length === 1 ? '1 fuente' : fuentes.length + ' fuentes', avisos };
  });
  return {
    filas, total: filas.length, ok: nOk, revisar: nAviso, falla: nFalla,
    veredicto: nFalla ? 'No publicable como está: ' + nFalla + ' paso(s) rompen una regla del validador.'
      : (nAviso ? 'Publicable como borrador. ' + nAviso + ' paso(s) piden revisión antes de mostrarlo a un especialista.' : 'Pasa todas las reglas automáticas.')
  };
}

/* ───────── chequeo de evidencia de un caso ───────── */
export const esCritico = (s) => /cr[ií]tico|suele faltar/i.test(s.marca || '');

export function chequeoCaso(c) {
  const items = [];
  const add = (nivel, txt, envio) => items.push({ nivel, txt, envio: !!envio });
  if (!c.titulo || c.titulo.trim().length < 4) add('falla', 'Ponle un título al caso.', true);
  const errD = validarDientes(c.dientes);
  if (errD) add('falla', errD, true);
  if (!c.diagnostico || c.diagnostico.trim().length < 10) add('falla', 'Falta el diagnóstico (al menos una frase).', true);
  if (!c.procedimiento || c.procedimiento.trim().length < 10) add('falla', 'Falta describir el procedimiento realizado.', true);
  if (!c.consentimiento) add('falla', 'Falta confirmar el consentimiento del paciente para usar sus datos e imágenes sin identificarlo.', true);

  const d = c.protocoloId ? DATOS[c.protocoloId] : null;
  if (d) {
    d.pasos.forEach((s, i) => {
      const r = (c.pasos || {})[i] || {};
      const est = r.estado || 'pendiente';
      const nota = (r.nota || '').trim();
      const et = 'Paso ' + nn(i) + ' · ' + s.corto;
      if (est === 'pendiente') { add('falla', et + ': sin marcar.', true); return; }
      if ((est === 'modificado' || est === 'omitido') && nota.length < 8) {
        add('falla', et + ': ' + est + ' sin justificar.', true); return;
      }
      if (est === 'noaplica' && !s.cond && nota.length < 8) {
        add('falla', et + ': este paso no es condicional; explica por qué no aplica.', true); return;
      }
      if (est === 'omitido' && esCritico(s)) {
        add('falla', et + ': es un paso crítico y se omitió. Un caso así no se puede aprobar.', false); return;
      }
      if ((est === 'modificado' || est === 'omitido') && s.disputa) add('revisar', et + ': desvío en un paso en disputa. Vale si la justificación se apoya en la evidencia del paso.');
      else if ((est === 'modificado' || est === 'omitido') && s.sinEv) add('revisar', et + ': desvío en un paso sin evidencia, que es práctica habitual.');
      else if (est === 'modificado' || est === 'omitido') add('revisar', et + ': desvío justificado. El revisor decide si la justificación alcanza.');
      if (est === 'hecho' && s.disputa && !esCritico(s)) add('info', et + ': se siguió un paso en disputa, pendiente del panel.');
    });
  } else {
    if (!c.evidencia || c.evidencia.trim().length < 20) add('falla', 'Sin protocolo de la biblioteca: el caso tiene que declarar en qué evidencia se apoya.', true);
    else add('revisar', 'La evidencia la declara el autor. El revisor tiene que comprobarla.');
  }
  const fotos = c.fotos || [];
  if (!fotos.length) add('revisar', 'Sin registro fotográfico.');
  if (/Endodoncia|Cirugía/.test(c.especialidad || '') && !fotos.some((f) => f.tipo === 'Radiografía')) add('revisar', 'Sin radiografía adjunta en un caso de ' + c.especialidad.toLowerCase() + '.');

  const bloqueaEnvio = items.filter((x) => x.envio);
  const fallas = items.filter((x) => x.nivel === 'falla');
  return {
    items, bloqueaEnvio, fallas,
    revisar: items.filter((x) => x.nivel === 'revisar'),
    info: items.filter((x) => x.nivel === 'info'),
    puedeEnviar: bloqueaEnvio.length === 0,
    puedeAprobar: fallas.length === 0
  };
}

/* ───────── calculadora periodontal (clasificación 2018) ───────── */
const num = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? null : n; };

export function perio(st) {
  const cal = num(st.pCal), rbl = num(st.pRbl), edad = num(st.pEdad), perd = num(st.pPerdidos),
    ps = num(st.pPs), ext = num(st.pExt), cig = num(st.pTabaco) || 0, hba = num(st.pHba);
  if (cal === null || rbl === null || edad === null || perd === null) return { listo: false, aviso: 'Completa al menos CAL interdental, pérdida ósea, edad y dientes perdidos.' };
  if (rbl > 100 || rbl < 0) return { listo: false, aviso: 'La pérdida ósea va de 0 a 100 % de la raíz.' };
  if (edad <= 0 || edad > 120) return { listo: false, aviso: 'Revisa la edad.' };
  const porque = [];
  const stSev = cal >= 5 ? 3 : (cal >= 3 ? 2 : 1);
  porque.push('CAL interdental de ' + cal + ' mm → severidad de estadio ' + (stSev === 3 ? 'III o IV' : (stSev === 2 ? 'II' : 'I')) + '.');
  const stRbl = rbl < 15 ? 1 : (rbl <= 33 ? 2 : 3);
  porque.push('Pérdida ósea del ' + rbl + ' % → estadio ' + (stRbl === 3 ? 'III o IV' : (stRbl === 2 ? 'II' : 'I')) + ' por extensión radiográfica.');
  const stPerd = perd === 0 ? 1 : (perd <= 4 ? 3 : 4);
  if (perd > 0) porque.push(perd + ' diente(s) perdido(s) por periodontitis → estadio ' + (stPerd === 4 ? 'IV' : 'III') + ' como mínimo.');
  let est = Math.max(stSev, stRbl, stPerd);
  if (ps !== null && ps >= 6) { if (est < 3) est = 3; porque.push('Profundidad de sondaje de ' + ps + ' mm → complejidad de estadio III.'); }
  if (st.pVert === 'si') { if (est < 3) est = 3; porque.push('Defecto vertical de 3 mm o más → complejidad de estadio III.'); }
  if (st.pFurca === 'si') { if (est < 3) est = 3; porque.push('Furca clase II o III → complejidad de estadio III.'); }
  if (st.pSt4 === 'si') { est = 4; porque.push('Disfunción masticatoria, movilidad grado 2 o más, colapso de mordida o menos de 20 dientes → estadio IV.'); }
  const romano = ['', 'I', 'II', 'III', 'IV'][est];
  const extension = ext === null ? 'extensión no calculada' : (ext < 30 ? 'localizada (' + ext + ' % de los sitios)' : 'generalizada (' + ext + ' % de los sitios)');
  const ratio = rbl / edad;
  let grado = ratio < 0.25 ? 'A' : (ratio <= 1 ? 'B' : 'C');
  const porqueG = ['Pérdida ósea dividida por edad: ' + rbl + ' / ' + edad + ' = ' + ratio.toFixed(2) + ' → grado ' + grado + ' por evidencia indirecta.'];
  const orden = { A: 0, B: 1, C: 2 };
  const subir = (g, motivo) => { if (orden[g] > orden[grado]) grado = g; porqueG.push(motivo); };
  if (cig >= 10) subir('C', 'Fuma ' + cig + ' cigarrillos al día (10 o más) → modificador que lleva a grado C.');
  else if (cig > 0) subir('B', 'Fuma ' + cig + ' cigarrillos al día (menos de 10) → modificador que lleva a grado B como mínimo.');
  if (hba !== null && hba >= 7) subir('C', 'HbA1c de ' + hba + ' % (7 o más) → modificador que lleva a grado C.');
  else if (hba !== null && hba > 0) subir('B', 'HbA1c de ' + hba + ' % (menor de 7) → modificador que lleva a grado B como mínimo.');
  return { listo: true, dx: 'Periodontitis estadio ' + romano + ', ' + extension + ', grado ' + grado, estadio: romano, estadioN: est, grado, extension, porque, porqueG };
}

/* ───────── periodontograma ───────── */
// Orden en pantalla: arcada superior 1.8 → 2.8, inferior 4.8 → 3.8.
const cuadrante = (q, desc) => { const l = [1, 2, 3, 4, 5, 6, 7, 8].map((d) => q + '.' + d); return desc ? l.reverse() : l; };
export const ARCADAS_PERIO = {
  sup: [...cuadrante(1, true), ...cuadrante(2)],
  inf: [...cuadrante(4, true), ...cuadrante(3)]
};
// Sitios: v = vestibular, l = lingual o palatino; d = distal, c = centro, m = mesial.
export const SITIOS_PERIO = ['vd', 'vc', 'vm', 'ld', 'lc', 'lm'];
export const tieneFurca = (d) => /^[1-4]\.[678]$/.test(d) || d === '1.4' || d === '2.4';

// NIC = sondaje − margen. Margen positivo si está hacia coronal del LAC, negativo si hay recesión.
// Sin margen anotado se toma 0 (margen a nivel del LAC).
export function nicSitio(x) {
  const ps = num(x && x.ps);
  if (ps === null) return null;
  const mg = num(x.mg);
  return ps - (mg === null ? 0 : mg);
}

export function resumenPeriodontograma(chart) {
  const todos = [...ARCADAS_PERIO.sup, ...ARCADAS_PERIO.inf];
  const presentes = todos.filter((d) => !(chart[d] && chart[d].aus));
  let sondados = 0, sangran = 0, placa = 0, ps4 = 0, ps6 = 0, psMax = null, nicMax = null, nicMaxDiente = '', sumaPs = 0, sumaNic = 0;
  let furcaAvanzada = false, movilidad2 = false;
  presentes.forEach((d) => {
    const t = chart[d] || {};
    if (tieneFurca(d) && (t.furca === 'II' || t.furca === 'III')) furcaAvanzada = true;
    if (num(t.mov) >= 2) movilidad2 = true;
    SITIOS_PERIO.forEach((k) => {
      const x = (t.s || {})[k] || {};
      const ps = num(x.ps);
      if (ps === null) return;
      sondados++;
      if (x.sg) sangran++;
      if (x.pl) placa++;
      if (ps >= 4) ps4++;
      if (ps >= 6) ps6++;
      if (psMax === null || ps > psMax) psMax = ps;
      const nic = nicSitio(x);
      sumaPs += ps; sumaNic += nic;
      if (k[1] !== 'c' && (nicMax === null || nic > nicMax)) { nicMax = nic; nicMaxDiente = d; }
    });
  });
  const pct = (n) => (sondados ? Math.round((n / sondados) * 100) : 0);
  return {
    presentes: presentes.length, ausentes: todos.length - presentes.length, sondados,
    sangrado: pct(sangran), placa: pct(placa), ps4, ps6, psMax, nicMax, nicMaxDiente, furcaAvanzada, movilidad2,
    // Promedios por sitio sondado (como los resume PerioTools)
    psMedia: sondados ? Math.round((sumaPs / sondados) * 10) / 10 : null, nicMedia: sondados ? Math.round((sumaNic / sondados) * 10) / 10 : null
  };
}

/* ───────── calculadora de endodoncia (step-back) ───────── */
export function endo(st) {
  const lrd = num(st.eLrd); let lad = num(st.eLad);
  const li = num(st.eLi) || 15, lm = num(st.eLm) || 30;
  if (lrd === null) return { listo: false, aviso: 'Escribe al menos la longitud real del diente (LRD) que te dio el localizador.' };
  if (lrd < 10 || lrd > 35) return { listo: false, aviso: 'Una LRD de ' + lrd + ' mm está fuera de rango. Revisa la medida.' };
  if (lm < 30) return { listo: false, aviso: 'La lima maestra mínima es #30.' };
  if (li >= lm) return { listo: false, aviso: 'La lima inicial tiene que ser menor que la lima maestra.' };
  if (lad === null) lad = lrd;
  const necro = st.eTipo === 'necro';
  const lt = lrd - 1;
  const dosTercios = lad * 2 / 3;
  const mm = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',') + ' mm';
  const iso = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80];
  const sig = (c) => { for (const x of iso) if (x > c) return x; return null; };
  const fase1 = []; let c = li, tope = 0;
  while (c !== null && c < lm && tope < 12) { fase1.push({ lima: '#' + c, prof: mm(lt), nota: 'negociación, irrigar y lima de pasaje a ' + mm(lt + 1) }); c = sig(c); tope++; }
  fase1.push({ lima: '#' + lm + ' · maestra', prof: mm(lt), nota: 'forma el tope apical. Mínimo #30.' });
  const fase2 = []; let paso = 1; c = sig(lm);
  while (c !== null && paso <= 10) {
    fase2.push({ lima: '#' + c, prof: mm(lt - paso), nota: 'recapitular con la #' + lm + ' a ' + mm(lt) + ', irrigar, pasaje, irrigar' });
    if (c >= 50) break; c = sig(c); paso++;
  }
  return {
    listo: true, lt: mm(lt), permeabilidad: mm(lt + 1), dosTercios: mm(dosTercios), cateterismo: mm(lad - 2),
    // Los mismos valores en número, para dibujar el conducto a escala
    num: { lrd, lad, lt, pasaje: lt + 1, dosTercios, cateterismo: lad - 2, escalones: fase2.map((x, i) => ({ lima: x.lima, prof: lt - (i + 1) })) },
    irrigante: necro ? 'Hipoclorito de sodio al 2,25 %' : 'Hipoclorito de sodio al 2,5–5,25 %',
    gates: st.eAmplio === 'si' ? 'Secuencia 3-2-1, conducto amplio' : 'Secuencia 1-2-1, conducto fino o medio',
    medicacion: mm(lt - 1) + ' a ' + mm(lt - 2), fase1, fase2,
    empalme: 'El step-back tiene que llegar al menos a #50 y empalmar a ' + mm(dosTercios) + ', que es hasta donde entraron las Gates.',
    conflicto: necro
      ? 'Longitud de trabajo: tu escuela fija LRD − 1 mm; un apunte de tu compañero indica LRD − 0,5 mm. Permeabilidad: la escuela trabaja a LT + 1 mm, el apunte a LT + 0,5 mm. Sin resolver.'
      : 'En biopulpectomía la referencia radiográfica es 1 a 1,5 mm del vértice. Aquí se calculó con 1 mm: confírmalo antes de usarlo.'
  };
}

/* ───────── dosis máxima de lidocaína 2 % con epinefrina ───────── */
export function anestesia(st) {
  const peso = num(st.aPeso), usados = num(st.aUsados) || 0;
  if (peso === null) return { listo: false, aviso: 'Escribe el peso del paciente en kilos.' };
  if (peso < 5 || peso > 250) return { listo: false, aviso: 'Un peso de ' + peso + ' kg está fuera de rango. Revisa el dato.' };
  const porPeso = peso * 7;
  const maxMg = Math.min(porPeso, 500);
  const porTubo = 36;
  const maxTubos = maxMg / porTubo;
  const usadoMg = usados * porTubo;
  const quedanMg = Math.max(0, maxMg - usadoMg);
  const f1 = (n) => (Math.floor(n * 10) / 10).toString().replace('.', ',');
  return {
    listo: true, maxMg: Math.round(maxMg) + ' mg', maxTubos: f1(maxTubos), usadoMg: Math.round(usadoMg) + ' mg',
    num: { maxTubos, usados, quedan: quedanMg / porTubo }, // para el medidor
    quedanTubos: f1(quedanMg / porTubo), pasado: usadoMg > maxMg,
    porque: [
      peso + ' kg × 7 mg/kg = ' + Math.round(porPeso) + ' mg.' + (porPeso > 500 ? ' Pasa el techo absoluto de 500 mg, así que manda el techo.' : ''),
      'Cada tubo de 1,8 ml al 2 % lleva 36 mg. ' + Math.round(maxMg) + ' mg ÷ 36 mg = ' + f1(maxTubos) + ' tubos como máximo.',
      usados ? usados + ' tubo(s) usados = ' + Math.round(usadoMg) + ' mg. Te quedan ' + f1(quedanMg / porTubo) + ' tubos de margen.' : 'Todavía no registras tubos usados.'
    ]
  };
}

/* ───────── dosis máxima pediátrica (AAPD 2023, tabla pág. 408) ───────── */
// mg/kg de la tabla AAPD. mg por tubo calculados para tubos de 1,8 ml (la tabla AAPD usa 1,7 ml).
export const ANEST_NINO = {
  lido: { t: 'Lidocaína 2 % con epinefrina', mgkg: 4.4, mgTubo: 36 },
  arti: { t: 'Articaína 4 % con epinefrina', mgkg: 7, mgTubo: 72, edadMin: 4 },
  mepi3: { t: 'Mepivacaína 3 % sin vasoconstrictor', mgkg: 4.4, mgTubo: 54, sinVaso: true },
  mepi2: { t: 'Mepivacaína 2 % con levonordefrina', mgkg: 4.4, mgTubo: 36 }
};

export function anestesiaNino(st) {
  const peso = num(st.nPeso), edad = num(st.nEdad), usados = num(st.nUsados) || 0;
  const a = ANEST_NINO[st.nAnest] || ANEST_NINO.lido;
  if (peso === null || edad === null) return { listo: false, aviso: 'Escribe el peso en kilos y la edad en años.' };
  if (peso < 2 || peso > 150) return { listo: false, aviso: 'Un peso de ' + peso + ' kg está fuera de rango. Revisa el dato.' };
  if (edad < 0 || edad >= 18) return { listo: false, aviso: 'Esta calculadora es para menores de 18 años. Para un adulto usa la pestaña Adulto.' };
  if (a.edadMin && edad < a.edadMin) return { listo: false, bloqueo: true, aviso: 'La articaína no se recomienda en menores de 4 años (fabricante, citado por la AAPD). Elige otro anestésico.' };
  const f1 = (n) => (Math.floor(n * 10) / 10).toString().replace('.', ',');
  const porPeso = peso * a.mgkg;
  const lactante = edad < 0.5;
  const maxMg = Math.floor(lactante ? porPeso * 0.7 : porPeso);
  const usadoMg = usados * a.mgTubo;
  const quedanMg = Math.max(0, maxMg - usadoMg);
  const porque = [
    peso + ' kg × ' + String(a.mgkg).replace('.', ',') + ' mg/kg = ' + f1(porPeso) + ' mg.',
    lactante ? 'Menor de 6 meses: se descuenta un 30 % → ' + maxMg + ' mg.' : 'Se redondea hacia abajo: ' + maxMg + ' mg.',
    'Cada tubo de 1,8 ml lleva ' + a.mgTubo + ' mg. ' + maxMg + ' mg ÷ ' + a.mgTubo + ' mg = ' + f1(maxMg / a.mgTubo) + ' tubos como máximo.',
    usados ? usados + ' tubo(s) usados = ' + usadoMg + ' mg. Te quedan ' + f1(quedanMg / a.mgTubo) + ' tubos de margen.' : 'Todavía no registras tubos usados.'
  ];
  const avisos = [];
  if (st.nSeda === 'si') avisos.push('Con sedación u otros depresores del sistema nervioso central la AAPD pide bajar la dosis máxima. No da un porcentaje: la calculadora no lo descuenta.');
  if (a.sinVaso) avisos.push('Sin vasoconstrictor la AAPD pide usar dosis más bajas que el máximo de la tabla.');
  return {
    listo: true, anest: a.t, maxMg: maxMg + ' mg', maxTubos: f1(maxMg / a.mgTubo), usadoMg: usadoMg + ' mg',
    num: { maxTubos: maxMg / a.mgTubo, usados, quedan: quedanMg / a.mgTubo }, // para el medidor
    quedanTubos: f1(quedanMg / a.mgTubo), pasado: usadoMg > maxMg, porque, avisos
  };
}

/* ───────── fotos: comprimir sin recortar ───────── */
export function comprimirImagen(file, max = 1600) {
  return new Promise((res, rej) => {
    if (!/^image\//.test(file.type)) { rej(new Error('“' + file.name + '” no es una imagen. Sube JPG, PNG o HEIC exportado a JPG.')); return; }
    if (file.size > 25 * 1024 * 1024) { rej(new Error('“' + file.name + '” pesa más de 25 MB.')); return; }
    const fr = new FileReader();
    fr.onerror = () => rej(new Error('No se pudo leer “' + file.name + '”.'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => rej(new Error('El navegador no puede abrir “' + file.name + '”. Expórtala a JPG y vuelve a subirla.'));
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * k), h = Math.round(img.height * k);
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); cx.drawImage(img, 0, 0, w, h);
        res({ data: cv.toDataURL('image/jpeg', 0.84), w, h });
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/* ───────── almacenamiento local (IndexedDB, con respaldo en memoria) ───────── */
let dbp = null;
function abrirDB() {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      try {
        const r = indexedDB.open('criterium', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    });
  }
  return dbp;
}
export async function leer(k) {
  try {
    const db = await abrirDB();
    return await new Promise((res) => {
      const rq = db.transaction('kv', 'readonly').objectStore('kv').get(k);
      rq.onsuccess = () => res(rq.result); rq.onerror = () => res(undefined);
    });
  } catch (e) { return undefined; }
}
export async function escribir(k, v) {
  try {
    const db = await abrirDB();
    return await new Promise((res) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(v, k);
      tx.oncomplete = () => res(true); tx.onerror = () => res(false); tx.onabort = () => res(false);
    });
  } catch (e) { return false; }
}

/* ───────── capacidades del visor ───────── */
export function cap(nombre) {
  try { if (window.claude && typeof window.claude.use === 'function') return window.claude.use(nombre); } catch (e) {}
  return Promise.resolve(null);
}
export function errIA(e) {
  const c = e && e.code;
  if (c === 'not_granted') return 'Para usar el asistente hay que permitirlo cuando el navegador lo pregunte.';
  if (c === 'rate_limited') return 'Demasiadas consultas seguidas. Espera un momento y vuelve a intentar.';
  if (c === 'cancelled') return '';
  return 'No se pudo completar la consulta. ' + ((e && e.message) || '');
}
export async function descargar(filename, data, avisar) {
  const d = await cap('downloads');
  if (!d || typeof d.save !== 'function') {
    // Fuera del visor de artifacts de claude.ai: descarga normal del navegador.
    try {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return true;
    } catch (e) { avisar && avisar('No se pudo descargar el archivo.', 'warn'); return false; }
  }
  try { await d.save({ filename, data }); return true; }
  catch (e) { if (!(e && e.code === 'cancelled')) avisar && avisar('No se pudo descargar el archivo.', 'warn'); return false; }
}

/* ───────── exportar caso en Markdown ───────── */
export function casoMarkdown(c) {
  const d = c.protocoloId ? DATOS[c.protocoloId] : null;
  const L = ['# ' + c.titulo, '', '**Estado:** ' + ESTADOS[c.estado].txt + ' · **Dientes:** ' + c.dientes + ' · **Especialidad:** ' + c.especialidad, '',
    '**Paciente:** ' + [c.paciente.iniciales, c.paciente.edad && c.paciente.edad + ' años', c.paciente.sexo].filter(Boolean).join(' · '), '',
    '## Diagnóstico', '', c.diagnostico, '', '## Procedimiento', '', c.procedimiento, ''];
  if (d) {
    L.push('## Adherencia al protocolo', '', d.titulo, '');
    d.pasos.forEach((s, i) => {
      const r = (c.pasos || {})[i] || {};
      L.push('- ' + nn(i) + ' · ' + s.corto + ': **' + (r.estado || 'sin marcar') + '**' + (r.nota ? ' — ' + r.nota : ''));
    });
    L.push('');
  }
  if (c.evidencia) L.push('## Evidencia declarada', '', c.evidencia, '');
  if ((c.sesiones || []).length) {
    L.push('## Sesiones', '');
    c.sesiones.forEach((s) => L.push('- ' + s.fecha + ': ' + s.txt + (s.proximo ? ' (próximo control ' + s.proximo + ')' : '')));
    L.push('');
  }
  (c.revisiones || []).forEach((r) => {
    L.push('## Revisión de ' + r.revisor.nombre + ' · ' + fecha(r.fecha), '', '**Veredicto:** ' + ESTADOS[r.veredicto].txt,
      '**Puntajes:** pertinencia ' + r.puntajes.pertinencia + ', claridad ' + r.puntajes.claridad + ', evidencia ' + r.puntajes.evidencia);
    if (r.motivos && r.motivos.length) L.push('**Motivos:** ' + r.motivos.join('; '));
    L.push('', r.justificacion, '');
  });
  L.push('> Exportado desde Criterium. Las fotos no se incluyen en este archivo.');
  return L.join('\n');
}

/* ───────── agenda, evaluación y solicitudes ───────── */
// Fecha local AAAA-MM-DD (hoyISO usa UTC: en Chile, de noche, daría el día siguiente)
export function fechaLocal(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
// Suma días hábiles (lunes a viernes). No descuenta feriados: el plazo real puede correrse un día.
export function sumarDiasHabiles(isoDia, n) {
  const d = new Date(isoDia + 'T12:00:00');
  let quedan = n;
  while (quedan > 0) { d.setDate(d.getDate() + 1); const s = d.getDay(); if (s !== 0 && s !== 6) quedan--; }
  return fechaLocal(d);
}
export const PLAZO_SOLICITUD = 10; // días hábiles para publicar un protocolo pedido

// Escala de notas chilena: 1,0 a 7,0 con un decimal; se aprueba con 4,0
export const NOTA_MIN = 1, NOTA_MAX = 7, NOTA_APRUEBA = 4;
export function leerNota(txt) {
  const n = parseFloat(String(txt ?? '').replace(',', '.'));
  if (isNaN(n)) return null;
  return Math.round(n * 10) / 10;
}
export const notaValida = (n) => n !== null && n >= NOTA_MIN && n <= NOTA_MAX;
export const notaTxt = (n) => (n === null || n === undefined ? '—' : n.toFixed(1).replace('.', ','));
export function promedioNotas(lista) {
  const ns = lista.map((x) => x && x.nota).filter((n) => typeof n === 'number');
  return ns.length ? Math.round((ns.reduce((a, b) => a + b, 0) / ns.length) * 10) / 10 : null;
}
// Instalaciones y horario de la clínica (como en un software de agenda dental: cada cita ocupa un box)
export const BOXES = ['Box 1', 'Box 2', 'Box 3', 'Box 4', 'Box 5', 'Box 6'];
export const DURACIONES = [30, 45, 60, 90, 120];
export const HORARIO = { desde: 8, hasta: 20 }; // horas
export const aMinutos = (hhmm) => { const [h, m] = String(hhmm || '0:0').split(':').map(Number); return h * 60 + m; };
export const deMinutos = (min) => String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
// Dos citas propias en el mismo box que se pisan
export function choques(c, otras) {
  const ini = aMinutos(c.hora), fin = ini + (c.duracion || 60);
  return otras.filter((o) => o.id !== c.id && o.estado !== 'cancelada' && o.fecha === c.fecha && o.box === c.box
    && aMinutos(o.hora) < fin && ini < aMinutos(o.hora) + (o.duracion || 60));
}
// Validación de una cita antes de guardarla (lo mismo exigen las reglas de Firestore)
export function chequeoCita(c) {
  const e = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.fecha || '')) e.fecha = 'Elige la fecha.';
  if (!/^\d{2}:\d{2}$/.test(c.hora || '')) e.hora = 'Elige la hora.';
  if (!c.protocoloId) e.protocoloId = 'Elige el protocolo que vas a realizar.';
  if (!c.docenteUid) e.docenteUid = 'Elige el docente que te va a evaluar.';
  if (!BOXES.includes(c.box)) e.box = 'Elige el box.';
  if (!DURACIONES.includes(Number(c.duracion))) e.duracion = 'Elige la duración.';
  const inicio = aMinutos(c.hora);
  if (!e.hora && (inicio < HORARIO.desde * 60 || inicio + Number(c.duracion || 0) > HORARIO.hasta * 60)) e.hora = 'La clínica atiende de ' + HORARIO.desde + ':00 a ' + HORARIO.hasta + ':00.';
  const ini = (c.paciente || '').trim();
  if (!/^[A-ZÁÉÍÓÚÑ]{2,4}$/i.test(ini)) e.paciente = 'Solo las iniciales del paciente: 2 a 4 letras, sin nombre ni RUT.';
  const dErr = c.pieza ? validarDientes(c.pieza) : '';
  if (dErr) e.pieza = dErr;
  return e;
}
