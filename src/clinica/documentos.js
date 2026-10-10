// Documentos clínicos: plantillas que el profesional completa y emite (quedan guardados y no se editan) y la hoja para
// imprimir o guardar en PDF. Son plantillas de ejemplo: cada clínica debe revisarlas con su asesoría legal antes de usarlas.
export const PLANTILLAS = [
  { k: 'consentimiento', t: 'Consentimiento informado', texto: (x) =>
`Yo, ${x.paciente}${x.rut ? ', RUT ' + x.rut : ''}, declaro que ${x.profesional} me explicó en lenguaje claro:

• Mi diagnóstico: ____________________________________________
• El procedimiento propuesto: ${x.procedimiento || '______________________________'}${x.diente ? ' (pieza ' + x.diente + ')' : ''}
• Sus beneficios, sus riesgos y molestias habituales, y lo que puede pasar si no me trato.
• Las alternativas de tratamiento, incluida la de no tratarme, y su costo.

Pude hacer todas mis preguntas y quedaron respondidas. Sé que puedo retirar este consentimiento en cualquier momento antes del procedimiento.

Autorizo la realización del procedimiento.` },
  { k: 'receta', t: 'Receta', texto: (x) =>
`Paciente: ${x.paciente}${x.edad ? ' · ' + x.edad + ' años' : ''}${x.rut ? ' · RUT ' + x.rut : ''}

Rp.
(escribe aquí el medicamento, la dosis, la frecuencia y la duración)


Indicaciones:
` },
  { k: 'certificado', t: 'Certificado de atención', texto: (x) =>
`Certifico que ${x.paciente}${x.rut ? ', RUT ' + x.rut : ''}, fue atendido(a) en ${x.clinica} el ${x.fecha}.

Se extiende el presente certificado a petición del interesado(a), para los fines que estime convenientes.` },
  { k: 'indicaciones', t: 'Indicaciones para el paciente', texto: (x) =>
`Indicaciones para ${x.paciente}

(escribe aquí las indicaciones de cuidado después del procedimiento, con lenguaje simple)
` }
];

const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// Hoja limpia en una ventana nueva y el diálogo de impresión del navegador
export function imprimirHoja({ clinica, titulo, cuerpoHtml, pie = '', demo }) {
  const w = window.open('', '_blank'); if (!w) return;
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>
    @page{margin:18mm} body{font-family:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif;color:#0F2530;font-size:11.5pt;line-height:1.5;margin:0}
    header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #2F6A78;padding-bottom:8px;margin-bottom:18px}
    .cl{font-weight:800;font-size:15pt} .demo{color:#9A6A1E;font-weight:700;font-size:9.5pt} h1{font-size:16pt;margin:0 0 12px}
    pre{font-family:inherit;white-space:pre-wrap;margin:0} table{width:100%;border-collapse:collapse;margin-top:6px} td,th{text-align:left;padding:6px 4px;border-bottom:1px solid #D5E3E9} th{font-size:9.5pt;color:#56707C;text-transform:uppercase;letter-spacing:.06em}
    .tot{font-weight:800;text-align:right} .firmas{display:flex;gap:40px;margin-top:60px} .firmas div{flex:1;border-top:1px solid #0F2530;padding-top:6px;font-size:10pt;text-align:center}
    footer{margin-top:28px;color:#8AA0AA;font-size:8.5pt}</style></head><body>
    <header><span class="cl">${esc(clinica)}</span>${demo ? '<span class="demo">CLÍNICA DE DEMOSTRACIÓN · DATOS FICTICIOS</span>' : ''}</header>
    <h1>${esc(titulo)}</h1>${cuerpoHtml}${pie}
    <footer>Emitido desde Criterium · ${new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</footer>
    <script>window.onload=()=>setTimeout(()=>window.print(),250)</script></body></html>`);
  w.document.close();
}
export const textoHtml = (t) => `<pre>${esc(t)}</pre>`;
export const firmasHtml = (a, b) => `<div class="firmas"><div>${esc(a)}</div><div>${esc(b)}</div></div>`;
export const tablaHtml = (filas, total) => `<table><tr><th>Pieza</th><th>Tratamiento</th><th style="text-align:right">Valor</th></tr>${filas.map((f) => `<tr><td>${esc(f.diente || '—')}</td><td>${esc(f.tratamiento)}</td><td style="text-align:right">${esc(f.valorTxt)}</td></tr>`).join('')}<tr><td></td><td class="tot">Total</td><td class="tot">${esc(total)}</td></tr></table>`;
