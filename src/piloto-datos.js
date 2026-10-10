// Cálculos del piloto sin Firebase (los usa el panel del equipo y los prueba tests/piloto.test.js)

// Indicador del estudio, en el grupo criterium:
// - sesiones: % de sesiones con al menos 1 protocolo abierto;
// - estudiantes: % de estudiantes que abre al menos 1 protocolo en la mayoría (más de la mitad) de sus sesiones.
export function indicadorPiloto(eventos, participantes) {
  const grupoDe = Object.fromEntries(participantes.map((p) => [p.codigo, p.grupo]));
  const ses = new Map();
  eventos.filter((e) => grupoDe[e.codigo] === 'criterium').forEach((e) => {
    const k = e.codigo + '|' + e.sesion;
    if (!ses.has(k)) ses.set(k, { codigo: e.codigo, abrio: false });
    if (e.tipo === 'protocolo_abierto') ses.get(k).abrio = true;
  });
  const lista = [...ses.values()];
  const porEst = new Map();
  lista.forEach((s) => { const x = porEst.get(s.codigo) || { n: 0, ok: 0 }; x.n += 1; x.ok += s.abrio ? 1 : 0; porEst.set(s.codigo, x); });
  const est = [...porEst.values()];
  const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);
  return {
    sesiones: lista.length, sesionesConProtocolo: lista.filter((s) => s.abrio).length, pctSesiones: pct(lista.filter((s) => s.abrio).length, lista.length),
    estudiantes: est.length, estudiantesCumplen: est.filter((x) => x.ok / x.n > 0.5).length, pctEstudiantes: pct(est.filter((x) => x.ok / x.n > 0.5).length, est.length)
  };
}

// CSV seudonimizado: código, grupo, sesión, tipo, protocolo y fecha. Nunca nombre, correo ni uid.
export function csvEventos(eventos, participantes) {
  const grupoDe = Object.fromEntries(participantes.map((p) => [p.codigo, p.grupo]));
  const esc = (v) => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const filas = [['codigo', 'grupo', 'sesion', 'tipo', 'protocolo', 'fecha_hora']]
    .concat([...eventos].sort((a, b) => (a.fecha || 0) - (b.fecha || 0)).map((e) => [e.codigo, grupoDe[e.codigo] || '', e.sesion, e.tipo, e.protoId, e.fecha ? e.fecha.toISOString() : '']));
  return filas.map((f) => f.map(esc).join(',')).join('\n');
}
