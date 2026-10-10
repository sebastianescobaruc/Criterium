// node scripts/clinica-demo.mjs
// Crea la clínica de demostración de Criterium (clinicas/demo-criterium) con pacientes FICTICIOS, citas de esta semana,
// fichas, evoluciones, presupuestos y pagos, para mostrar la sección Clínica. No usa datos de personas reales: los
// pacientes son inventados, sin RUT, con teléfonos +56 9 0000 00xx. Si la clínica ya existe, no hace nada.
// Entra con la cuenta del equipo (CRITERIUM_ADMIN_EMAIL y CRITERIUM_ADMIN_PASSWORD en .env.local), que queda de administradora.
// Módulos de gestión (automático si faltan): siembra de gestión (plan de tratamiento, laboratorio, inventario, esterilización, gastos, cierres,
//   tareas, lista de espera, controles y convenios) en la demo ya creada. Una vez: queda marcado con modulos: 2
//   (--forzar-modulos lo repite, solo si una corrida anterior se cortó a medias).
// --investigacion: además publica el póster CIECS 2026 de Sebastián en Universidad › Investigaciones (una vez).
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, doc, getDoc, setDoc, addDoc, collection, getDocs, query, where, writeBatch } from 'firebase/firestore';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const env = {};
for (const f of ['.env', '.env.local']) { if (!existsSync(RAIZ + f)) continue; for (const l of readFileSync(RAIZ + f, 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim(); } }
const app = initializeApp({ apiKey: env.VITE_FB_API_KEY, authDomain: env.VITE_FB_AUTH_DOMAIN, projectId: env.VITE_FB_PROJECT_ID, appId: env.VITE_FB_APP_ID });
const db = initializeFirestore(app, { experimentalForceLongPolling: true });
const { user } = await signInWithEmailAndPassword(getAuth(app), env.CRITERIUM_ADMIN_EMAIL, env.CRITERIUM_ADMIN_PASSWORD);
const yo = user.uid;
const perfilYo = (await getDoc(doc(db, 'perfiles', yo))).data() || {};
const nombreYo = perfilYo.nombre || 'Equipo Criterium';
const iso = (d) => d.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
const hoy = iso(new Date());
const sumar = (f, n) => { const d = new Date(f + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
const lunes = (() => { const d = new Date(hoy + 'T12:00:00'); return sumar(hoy, -((d.getDay() + 6) % 7)); })();
const ahoraISO = (f, h = '12:00') => new Date(f + 'T' + h + ':00-03:00').toISOString();

const CID = 'demo-criterium';
if (!(await getDoc(doc(db, 'clinicas', CID)).catch(() => ({ exists: () => false }))).exists()) {
  // Co-fundadores como administradores de la demo
  const miembros = { [yo]: 'admin' };
  const ps = await getDocs(collection(db, 'perfiles'));
  ps.forEach((d) => { if (/Jorge Andr[eé]s Baeza/i.test(d.data().nombre || '') && d.id !== yo) miembros[d.id] = 'admin'; });
  const PROF = [{ id: 'yo', uid: yo, nombre: nombreYo, especialidad: 'Odontología general' }, { id: 'p2', nombre: 'Dra. Valentina Soto (ficticia)', especialidad: 'Endodoncia' }, { id: 'p3', nombre: 'Dr. Martín Ruiz (ficticio)', especialidad: 'Rehabilitación oral' }];
  const ARANCEL = [['EX', 'Examen y diagnóstico', 15000], ['RX', 'Radiografía periapical', 8000], ['DE', 'Destartraje y pulido', 35000], ['SE', 'Sellante', 18000], ['R1', 'Resina compuesta una cara', 38000], ['R2', 'Resina compuesta dos caras', 48000], ['EN1', 'Endodoncia unirradicular', 140000], ['EN2', 'Endodoncia birradicular', 180000], ['EXO', 'Exodoncia simple', 45000], ['CO', 'Corona', 320000]].map(([codigo, nombre, valor]) => ({ codigo, nombre, valor }));
  await setDoc(doc(db, 'clinicas', CID), { nombre: 'Clínica Demo Criterium', demo: true, boxes: ['Box 1', 'Box 2', 'Box 3'], profesionales: PROF, arancel: ARANCEL, miembros, creado: new Date().toISOString() });
  console.log('· clínica creada · miembros:', Object.keys(miembros).length);

  const PAC = [
    ['Camila', 'Fuentes Araya', '1994-03-12', 'Femenino', 'Fonasa', { alergias: 'Penicilina', enfermedades: 'Sin enfermedades conocidas', medicamentos: 'Ninguno' }],
    ['Joaquín', 'Morales Vera', '1987-11-02', 'Masculino', 'Isapre', { enfermedades: 'Hipertensión arterial controlada', medicamentos: 'Losartán', alergias: 'No refiere' }],
    ['Fernanda', 'Castro Ibáñez', '2001-06-25', 'Femenino', 'Fonasa', { alergias: 'No refiere', habitos: 'Bruxismo nocturno' }],
    ['Tomás', 'Herrera Lagos', '1979-01-19', 'Masculino', 'Particular', { enfermedades: 'Diabetes tipo 2', medicamentos: 'Metformina', alergias: 'No refiere', habitos: 'Fumador, 5 cigarrillos al día' }],
    ['Isidora', 'Pizarro Rojas', '2015-09-08', 'Femenino', 'Fonasa', { alergias: 'No refiere', observaciones: 'Viene con su madre' }],
    ['Matías', 'Reyes Cortés', '1998-04-30', 'Masculino', 'Isapre', { alergias: 'Látex' }],
    ['Antonia', 'Navarro Silva', '1990-12-14', 'Femenino', 'Fonasa', { embarazo: 'Embarazo de 20 semanas', alergias: 'No refiere' }],
    ['Benjamín', 'Soto Muñoz', '1965-07-03', 'Masculino', 'Fonasa', { enfermedades: 'Anticoagulado por fibrilación auricular', medicamentos: 'Acenocumarol', alergias: 'No refiere' }],
    ['Javiera', 'León Bravo', '2004-02-21', 'Femenino', 'Isapre', { alergias: 'No refiere' }],
    ['Diego', 'Vargas Pinto', '1983-10-10', 'Masculino', 'Particular', { alergias: 'AINEs', enfermedades: 'Asma' }]
  ];
  const OD = [{ 16: { caras: { O: 'caries' } }, 26: { caras: { O: 'obturacion', M: 'obturacion' } }, 36: { estado: 'endodoncia', caras: { O: 'obturacion' } } }, { 18: { estado: 'ausente' }, 46: { estado: 'corona' }, 47: { caras: { O: 'caries', D: 'caries' } } }, { 11: { caras: { I: 'obturacion' } } }, { 38: { estado: 'extraccion' }, 48: { estado: 'ausente' }, 14: { estado: 'implante' }, 25: { caras: { M: 'caries' } } }, { 55: { caras: { O: 'caries' } }, 16: { caras: { O: 'sellante' } }, 26: { caras: { O: 'sellante' } } }];
  const ids = [];
  for (const [i, [nombres, apellidos, nacimiento, sexo, prevision, ante]] of PAC.entries()) {
    const ref = await addDoc(collection(db, 'clinicas', CID, 'pacientes'), { nombres, apellidos, rut: '', nacimiento, sexo, prevision, telefono: '+56 9 0000 00' + String(i + 10), correo: '', ficticio: true, creado: new Date().toISOString(), actualizado: new Date().toISOString() });
    ids.push({ id: ref.id, nombre: nombres + ' ' + apellidos });
    await setDoc(doc(db, 'clinicas', CID, 'pacientes', ref.id, 'clinico', 'ficha'), { ...ante, odontograma: OD[i] || {}, actualizado: new Date().toISOString() });
  }
  console.log('· pacientes ficticios:', ids.length);

  // Citas: esta semana (lunes a sábado) y el lunes siguiente
  const MOTIVOS = ['Control', 'Destartraje', 'Resina', 'Endodoncia', 'Urgencia', 'Evaluación', 'Exodoncia', 'Prueba de corona'];
  const b = writeBatch(db); let n = 0;
  for (let dia = 0; dia < 8; dia++) {
    const f = sumar(lunes, dia === 7 ? 7 : dia); if (dia === 6) continue;
    const horas = ['09:00', '10:00', '11:30', '15:00', '16:30', '18:00'];
    horas.forEach((h, k) => {
      if ((dia + k) % 3 === 2) return;
      const pac = ids[(dia * 3 + k) % ids.length], prof = PROF[(dia + 2 * k) % 3];
      const pasado = f < hoy || (f === hoy && h < new Date().toLocaleTimeString('en-GB', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit' }));
      const estado = pasado ? ((dia + k) % 7 === 0 ? 'no-asistio' : 'atendida') : f === hoy ? 'confirmada' : (k % 2 ? 'confirmada' : 'agendada');
      b.set(doc(collection(db, 'clinicas', CID, 'citas')), { pacienteId: pac.id, pacienteNombre: pac.nombre, profesionalId: prof.id, box: 'Box ' + ((k % 3) + 1), fecha: f, hora: h, duracion: [30, 60, 45][k % 3], motivo: MOTIVOS[(dia + k) % MOTIVOS.length], estado, creado: new Date().toISOString() });
      n++;
    });
  }
  await b.commit();
  console.log('· citas:', n);

  // Evoluciones (firmadas por la cuenta del equipo, que es la profesional «yo»), presupuestos y pagos
  const EV = [[0, '3.6', 'Endodoncia unirradicular', 'Conductometría y obturación del conducto. Sin molestias al alta. Control en 7 días.'], [1, '4.7', 'Resina compuesta dos caras', 'Remoción de caries y restauración OD con resina. Contactos oclusales ajustados.'], [3, '', 'Destartraje y pulido', 'Destartraje supragingival en ambas arcadas. Se refuerza técnica de cepillado y uso de seda.'], [4, '5.5', 'Examen y diagnóstico', 'Examen con la madre presente. Lesión oclusal en 5.5; se indica sellantes en 1.6 y 2.6.']];
  for (const [i, diente, procedimiento, nota] of EV) await addDoc(collection(db, 'clinicas', CID, 'pacientes', ids[i].id, 'evoluciones'), { diente, procedimiento, nota, profesional: { uid: yo, nombre: nombreYo }, firmada: true, fecha: ahoraISO(sumar(lunes, i % 5), '10:30') });
  const PRES = [[0, [['1.6', 'Resina compuesta una cara', 38000], ['3.6', 'Corona', 320000]], 'aceptado', [150000]], [1, [['4.7', 'Resina compuesta dos caras', 48000], ['', 'Destartraje y pulido', 35000]], 'aceptado', [83000]], [3, [['3.8', 'Exodoncia simple', 45000], ['2.5', 'Resina compuesta una cara', 38000], ['1.4', 'Corona', 320000]], 'propuesto', []], [4, [['1.6', 'Sellante', 18000], ['2.6', 'Sellante', 18000], ['5.5', 'Resina compuesta una cara', 38000]], 'aceptado', [36000]]];
  for (const [i, items, estado, abonos] of PRES) {
    const lista = items.map(([d, t, v]) => ({ diente: d, tratamiento: t, valor: v }));
    const pr = await addDoc(collection(db, 'clinicas', CID, 'presupuestos'), { pacienteId: ids[i].id, pacienteNombre: ids[i].nombre, items: lista, total: lista.reduce((s, x) => s + x.valor, 0), estado, profesional: { uid: yo, nombre: nombreYo }, fecha: ahoraISO(sumar(lunes, i % 5), '11:00') });
    for (const monto of abonos) await addDoc(collection(db, 'clinicas', CID, 'pagos'), { pacienteId: ids[i].id, pacienteNombre: ids[i].nombre, presupuestoId: pr.id, monto, medio: ['Débito', 'Transferencia', 'Crédito'][i % 3], registradoPor: { uid: yo, nombre: nombreYo }, fecha: ahoraISO(sumar(lunes, Math.min(4, i)), '12:00') });
  }
  console.log('· evoluciones, presupuestos y pagos listos');
} else console.log('· la clínica de demostración ya existe: no se tocó');

const clin = (await getDoc(doc(db, 'clinicas', CID))).data();
if (clin && ((clin.modulos || 0) < 2 || process.argv.includes('--forzar-modulos'))) {
  const pac = (await getDocs(collection(db, 'clinicas', CID, 'pacientes'))).docs.map((d) => ({ id: d.id, ...d.data(), nombre: d.data().nombres + ' ' + d.data().apellidos })).sort((a, b) => a.apellidos.localeCompare(b.apellidos));
  const P = (n) => pac.find((x) => x.nombres === n) || pac[0];
  const equipo = {}; for (const uid of Object.keys(clin.miembros || {})) { const pf = (await getDoc(doc(db, 'perfiles', uid))).data(); equipo[uid] = (pf && pf.nombre) || 'Equipo'; }
  const PCT = { yo: 50, p2: 45, p3: 40 };
  await setDoc(doc(db, 'clinicas', CID), {
    equipo, profesionales: clin.profesionales.map((p) => ({ ...p, porcentaje: PCT[p.id] ?? 40 })),
    laboratorios: ['Laboratorio Dental Andes (ficticio)', 'Lab Cerámica Sur (ficticio)'], equipos: ['Autoclave 1', 'Autoclave 2'],
    convenios: [{ nombre: 'Convenio empresa ficticia', descuento: 15 }, { nombre: 'Funcionarios', descuento: 20 }],
    horario: 'Lunes a viernes 9:00–19:00 · sábado 9:00–13:00'
  }, { merge: true });
  const por = { uid: yo, nombre: nombreYo };
  const b = writeBatch(db);
  const col = (c) => doc(collection(db, 'clinicas', CID, c));
  // Controles periódicos y convenio
  const CTRL = [['Camila', -12, 'Control de endodoncia'], ['Tomás', -40, 'Mantención periodontal'], ['Benjamín', 5, 'Control de prótesis'], ['Javiera', 18, 'Control semestral'], ['Isidora', 60, 'Control de sellantes'], ['Diego', 2, 'Control de resina']];
  for (const [n, d, motivo] of CTRL) b.update(doc(db, 'clinicas', CID, 'pacientes', P(n).id), { control: { fecha: sumar(hoy, d), motivo } });
  b.update(doc(db, 'clinicas', CID, 'pacientes', P('Joaquín').id), { convenio: 'Convenio empresa ficticia' });
  // Plan de tratamiento por fases
  b.set(col('planes'), { pacienteId: P('Tomás').id, pacienteNombre: P('Tomás').nombre, profesionalId: 'p3', estado: 'presentado', fecha: ahoraISO(sumar(lunes, 1), '11:00'), profesional: por, fases: [
    { nombre: 'Fase 1 · Urgencias y control de infección', items: [{ id: 'a1', diente: '3.8', tratamiento: 'Exodoncia simple', valor: 45000, realizado: true }, { id: 'a2', diente: '', tratamiento: 'Destartraje y pulido', valor: 35000, realizado: true }] },
    { nombre: 'Fase 2 · Periodontal y restauradora', items: [{ id: 'a3', diente: '2.5', tratamiento: 'Resina compuesta una cara', valor: 38000, realizado: false }] },
    { nombre: 'Fase 3 · Rehabilitación', items: [{ id: 'a4', diente: '1.4', tratamiento: 'Corona', valor: 320000, realizado: false }] }], total: 438000 });
  // Laboratorio: una atrasada, una por instalar, una recién enviada
  b.set(col('laboratorio'), { pacienteId: P('Camila').id, pacienteNombre: P('Camila').nombre, profesionalId: 'yo', trabajo: 'Corona', diente: '3.6', laboratorio: 'Lab Cerámica Sur (ficticio)', color: 'A2', envio: sumar(hoy, -12), entrega: sumar(hoy, -2), costo: 95000, estado: 'enviado', nota: 'Disilicato de litio, margen en hombro.', creadoPor: por, fecha: ahoraISO(sumar(hoy, -12)) });
  b.set(col('laboratorio'), { pacienteId: P('Benjamín').id, pacienteNombre: P('Benjamín').nombre, profesionalId: 'p3', trabajo: 'Prótesis parcial removible', diente: 'Arcada inferior', laboratorio: 'Laboratorio Dental Andes (ficticio)', color: 'A3', envio: sumar(hoy, -9), entrega: sumar(hoy, 1), costo: 140000, estado: 'recibido', recibido: sumar(hoy, -1), nota: '', creadoPor: por, fecha: ahoraISO(sumar(hoy, -9)) });
  b.set(col('laboratorio'), { pacienteId: P('Fernanda').id, pacienteNombre: P('Fernanda').nombre, profesionalId: 'yo', trabajo: 'Placa de relajación', diente: 'Superior', laboratorio: 'Laboratorio Dental Andes (ficticio)', color: '', envio: sumar(hoy, -1), entrega: sumar(hoy, 6), costo: 45000, estado: 'enviado', nota: 'Acrílico duro, 2 mm.', creadoPor: por, fecha: ahoraISO(sumar(hoy, -1)) });
  // Inventario (dos con stock bajo y uno por vencer)
  const INV = [['Lidocaína 2 % con epinefrina', 'Anestesia', 'tubos', 34, 20, 450, sumar(hoy, 40)], ['Guantes de nitrilo talla M', 'Bioseguridad', 'cajas', 3, 5, 6500, ''], ['Resina compuesta A2', 'Restauración', 'jeringas', 6, 4, 18000, sumar(hoy, 300)], ['Ácido ortofosfórico 37 %', 'Restauración', 'jeringas', 2, 3, 3500, sumar(hoy, 200)], ['Limas K 25 mm (15-40)', 'Endodoncia', 'cajas', 8, 3, 7000, ''], ['Hipoclorito de sodio 5 %', 'Endodoncia', 'frascos', 5, 2, 2500, sumar(hoy, 120)], ['Mascarillas quirúrgicas', 'Bioseguridad', 'cajas', 12, 4, 4000, ''], ['Eyectores de saliva', 'Desechables', 'paquetes', 9, 3, 3000, '']];
  for (const [nombre, categoria, unidad, stock, minimo, costo, vence] of INV) b.set(col('inventario'), { nombre, categoria, unidad, stock, minimo, costo, vence, proveedor: 'Proveedor dental (ficticio)', fecha: ahoraISO(sumar(hoy, -30)) });
  // Esterilización: ciclos de los últimos días
  for (let i = 6; i >= 0; i--) {
    const f = sumar(hoy, -i); const eq = i % 2 ? 'Autoclave 2' : 'Autoclave 1'; const ciclo = 40 + (6 - i);
    b.set(col('esterilizacion'), { equipo: eq, programa: 'Instrumental envuelto · 134 °C', temperatura: 134, minutos: 18, quimico: 'ok', biologico: i === 3 ? 'ok' : 'no aplica', paquetes: 6 + (i % 4), nota: '', ciclo, lote: `${eq.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase()}-${f.replace(/-/g, '').slice(2)}-${String(ciclo).padStart(3, '0')}`, responsable: por, fecha: ahoraISO(f, '08:30') });
  }
  // Gastos del mes, un cierre de ayer, tareas y lista de espera
  const GAS = [['Arriendo del local', 'Arriendo', 850000, 1], ['Insumos de restauración', 'Insumos', 126000, 3], ['Laboratorio · coronas del mes pasado', 'Laboratorio', 190000, 5], ['Luz, agua e internet', 'Servicios básicos', 98000, 6], ['Mantención del autoclave', 'Mantención de equipos', 65000, 8]];
  for (const [concepto, categoria, monto, d] of GAS) b.set(col('gastos'), { concepto, categoria, monto, proveedor: '', documento: '', dia: hoy.slice(0, 8) + String(d).padStart(2, '0'), registradoPor: por, fecha: ahoraISO(hoy.slice(0, 8) + String(d).padStart(2, '0')) });
  b.set(col('cierres'), { dia: sumar(hoy, -1), total: 119000, porMedio: { Efectivo: 20000, 'Débito': 63000, 'Crédito': 0, Transferencia: 36000 }, pagos: 3, efectivoContado: 20000, diferencia: 0, nota: '', por, fecha: ahoraISO(sumar(hoy, -1), '19:10') });
  const TAR = [['Llamar al laboratorio por la corona del 3.6', 0], ['Pedir guantes talla M y ácido grabador', 1], ['Revisar fecha de vencimiento de anestesias', 4]];
  for (const [titulo, d] of TAR) b.set(col('tareas'), { titulo, estado: 'pendiente', vence: sumar(hoy, d), asignado: null, creadoPor: por, fecha: ahoraISO(hoy, '09:00') });
  b.set(col('espera'), { pacienteId: P('Matías').id, pacienteNombre: P('Matías').nombre, telefono: P('Matías').telefono, preferencia: 'Tardes', motivo: 'Adelantar resina', creadoPor: por, fecha: ahoraISO(sumar(hoy, -3)) });
  b.set(col('espera'), { pacienteId: P('Antonia').id, pacienteNombre: P('Antonia').nombre, telefono: P('Antonia').telefono, preferencia: 'Mañanas', motivo: 'Evaluación', creadoPor: por, fecha: ahoraISO(sumar(hoy, -1)) });
  await b.commit();
  await setDoc(doc(db, 'clinicas', CID), { modulos: 2 }, { merge: true });
  console.log('· módulos de gestión sembrados (plan, laboratorio, inventario, esterilización, gastos, cierre, tareas, espera, controles)');
} else console.log('· los módulos de gestión ya estaban');
// Presupuestos de la demo sin profesional (los primeros se crearon sin él): se reparten para que Honorarios tenga datos
if (clin) {
  const sin = (await getDocs(collection(db, 'clinicas', CID, 'presupuestos'))).docs.filter((d) => !d.data().profesionalId);
  if (sin.length) { const bp = writeBatch(db); sin.forEach((d, i) => bp.update(d.ref, { profesionalId: ['yo', 'p3', 'p2'][i % 3] })); await bp.commit(); console.log('· presupuestos con profesional:', sin.length); }
}

if (process.argv.includes('--investigacion')) {
  const ya = await getDocs(query(collection(db, 'investigaciones'), where('autorUid', '==', yo)));
  if (ya.docs.some((d) => /portafolio digital/i.test(d.data().titulo || ''))) console.log('· el póster ya estaba publicado');
  else {
    await addDoc(collection(db, 'investigaciones'), {
      autorUid: yo, autor: { uid: yo, nombre: nombreYo, institucion: perfilYo.institucion || '' }, tipo: 'poster', likedBy: [], fecha: new Date().toISOString(),
      titulo: 'Diseño de portafolio digital como instrumento para la evaluación en residentes de Cirugía Maxilofacial UC', evento: 'Congreso CIECS 2026', anio: '2026', enlace: '',
      autores: [
        { nombre: 'Sebastián Escobar Prieto', afiliacion: 'Escuela de Odontología, Pontificia Universidad Católica de Chile' },
        { nombre: 'Rodrigo Díaz Canio', afiliacion: 'Escuela de Odontología, Pontificia Universidad Católica de Chile' },
        { nombre: 'Alejandro Delfino Yurín', afiliacion: 'Escuela de Medicina, Pontificia Universidad Católica de Chile, Santiago, Chile' },
        { nombre: 'Lorena Isbej Espósito', afiliacion: 'Escuela de Odontología, Pontificia Universidad Católica de Chile, Santiago, Chile' },
        { nombre: 'Salvador Valladares Pérez', afiliacion: 'Escuela de Odontología, Pontificia Universidad Católica de Chile' }
      ],
      resumen: {
        introduccion: 'El portafolio es un instrumento que documenta evidencias de aprendizaje y promueve la reflexión. En el Programa de Cirugía y Traumatología Buco Maxilofacial de la Pontificia Universidad Católica de Chile (CMF UC), se identificó la necesidad de incorporar una herramienta que integre la evaluación de competencias declaradas en el Programa, favorecer el aprendizaje y fortalecer el alineamiento curricular.',
        objetivo: 'Diseñar la estructura, contenido, criterios de evaluación y metodología de implementación de un Portafolio, alineado con los resultados de aprendizaje del Programa de CMF UC.',
        metodologia: 'Se aplicó el modelo desarrollo curricular de Kern para identificar el problema, evaluar necesidades, definir objetivos y estrategias, para luego implementar y evaluar un piloto. Mediante una técnica Delphi modificada, un panel de expertos validó la pertinencia, contenido y criterios de evaluación del Portafolio. La implementación considerará la difusión, capacitación docente y estudiantil, evaluación temprana y una posterior evaluación cualitativa y cuantitativa respecto a adherencia, usabilidad, satisfacción y percepción de utilidad.',
        resultados: 'Aplicando el modelo de Kern, se definieron las necesidades, objetivos y estrategias para la implementación y evaluación de un piloto de Portafolio. Los expertos validaron su pertinencia, componentes e instrumentos de evaluación. Además, se estableció un plan estratégico para mitigar la sobrecarga académica y favorecer la aceptabilidad de la comunidad al instrumento.',
        conclusiones: 'El diseño basado en el modelo de Kern y validado por expertos proporciona una herramienta pedagógica pertinente al programa de CMF UC, favoreciendo el desarrollo de competencias y el alineamiento curricular.'
      },
      palabras: ['Portafolio', 'Evaluación de competencias', 'Cirugía maxilofacial', 'Modelo de Kern', 'Delphi'],
      etica: 'Aprobado por el Comité Ético Científico de Ciencias de la Salud de la Pontificia Universidad Católica de Chile.'
    });
    console.log('· póster publicado en Investigaciones');
  }
}
process.exit(0);
