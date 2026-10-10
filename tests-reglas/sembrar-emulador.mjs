// Siembra los emuladores locales (Auth + Firestore) con usuarios y datos FICTICIOS para probar el modo piloto en la app.
// Uso: npm run emuladores (en otra terminal) y después: node tests-reglas/sembrar-emulador.mjs
// Nunca toca el proyecto real: escribe solo en 127.0.0.1. Todos los usuarios usan la contraseña «prueba123».
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PROTOS, DATOS } from '../src/data.js';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const env = {};
for (const l of readFileSync(RAIZ + '.env', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
const P = env.VITE_FB_PROJECT_ID;
const AUTH = 'http://127.0.0.1:9099';
const FS = `http://127.0.0.1:8080/v1/projects/${P}/databases/(default)/documents`;

// Valor de Firestore REST desde JS
const val = (v) => v === null ? { nullValue: null } : typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v })
  : v instanceof Date ? { timestampValue: v.toISOString() } : Array.isArray(v) ? { arrayValue: { values: v.map(val) } }
  : typeof v === 'object' ? { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, val(x)])) } } : { stringValue: String(v) };
async function poner(ruta, datos) {
  const r = await fetch(`${FS}/${ruta}`, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(datos).map(([k, x]) => [k, val(x)])) }) });
  if (!r.ok) throw new Error(ruta + ': ' + (await r.text()));
}
async function usuario(email, nombre) {
  const r = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=falsa`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'prueba123', displayName: nombre, returnSecureToken: true }) });
  const j = await r.json(); if (!j.localId) throw new Error(email + ': ' + JSON.stringify(j)); return j.localId;
}

await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${P}/databases/(default)/documents`, { method: 'DELETE' });
await fetch(`${AUTH}/emulator/v1/projects/${P}/accounts`, { method: 'DELETE' });

const U = {};
for (const [k, email, nombre, rol] of [
  ['libre', 'estudiante@ficticio.cl', 'Estudiante Ficticia', 'Estudiante de pregrado'],
  ['dentista', 'dentista@ficticio.cl', 'Dentista Ficticio', 'Cirujano dentista general'],
  ['crit', 'criterium@uc.cl', 'Participante Criterium', 'Estudiante de pregrado'],
  ['hab', 'habitual@uc.cl', 'Participante Habitual', 'Estudiante de pregrado'],
  ['admin', 'equipo@ficticio.cl', 'Equipo Ficticio', 'Docente de clínica']
]) {
  U[k] = await usuario(email, nombre);
  await poner('usuarios/' + U[k], { nombre, email, rol, institucion: k === 'crit' || k === 'hab' ? 'Universidad ficticia' : '', onboarding: true });
  await poner('perfiles/' + U[k], { nombre, rol, institucion: '', onboarding: true, intereses: [], temas: [] });
}
await poner('admins/' + U.admin, { nombre: 'Equipo Ficticio' });
await poner('participantes/' + U.crit, { grupo: 'criterium', codigo: 'P-CRIT01', invitacion: '' });
await poner('participantes/' + U.hab, { grupo: 'habitual', codigo: 'P-HAB001', invitacion: '' });
await poner('identidades/P-CRIT01', { nombre: 'Participante Criterium (ficticio)', consentimiento: '2027-05-30' });
await poner('identidades/P-HAB001', { nombre: 'Participante Habitual (ficticio)', consentimiento: '2027-05-30' });
await poner('invitaciones/PRUEBA01', { grupo: 'criterium', participante: 'P-NUEVO1', usada: false, usadaPor: '' });
await poner('identidades/P-NUEVO1', { nombre: '', consentimiento: '', invitacion: 'PRUEBA01' });
await poner('config/piloto', { apertura: new Date('2027-11-01T03:00:00Z'), abierto: false, registroUCInvitacion: true, modulosNuevos: false, congelados: true, dominiosInvitacion: ['uc.cl'], estudio: PROTOS.filter((p) => p.estudio).map((p) => p.id) });
for (const [orden, p] of PROTOS.entries()) {
  const json = JSON.stringify(DATOS[p.id]);
  await poner('protocolos/' + p.id, { catalogo: JSON.stringify(p), json, version: ((p.estadoTxt || '').match(/v\d+(\.\d+)*/) || [''])[0], fecha: '2026-10-07', sha256: createHash('sha256').update(json).digest('hex'), estudio: !!p.estudio, publicado: true, orden });
  const pdf = RAIZ + 'protocolos-pdf/' + (DATOS[p.id].pdf || '');
  if (DATOS[p.id].pdf && existsSync(pdf)) await poner(`protocolos/${p.id}/archivos/pdf`, { nombre: DATOS[p.id].pdf, base64: readFileSync(pdf).toString('base64') });
}
await poner('feed/ficticio1', { tipo: 'publicacion', estado: 'publicado', txt: 'Publicación de ejemplo (ficticia) para probar el feed.', autorUid: U.dentista, autor: { uid: U.dentista, nombre: 'Dentista Ficticio', rol: 'Cirujano dentista general', verificado: false }, fecha: new Date().toISOString(), likes: 0, likedBy: [], respuestas: [] });
console.log(JSON.stringify(U));
