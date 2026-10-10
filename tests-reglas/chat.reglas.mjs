// Pruebas de las reglas del chat de Criterium Red, con usuarios ficticios, en el emulador (necesita Java).
// firebase emulators:exec --only firestore --project demo-criterium "node --test tests-reglas/chat.reglas.mjs"
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDocs, collection, query, where, writeBatch, updateDoc } from 'firebase/firestore';

let env;
const A = 'ana', B = 'beto', C = 'caro';           // Ana y Beto se siguen; Caro no sigue a nadie
const cid = (x, y) => [x, y].sort().join('_');
const como = (u) => env.authenticatedContext(u, { email: u + '@correo.cl', email_verified: true }).firestore();
const ahora = () => new Date().toISOString();

// Lo mismo que hace enviarMensajeChatFS (src/db.js)
async function enviar(db, yo, otro, txt, chat, relacion) {
  const id = cid(yo, otro), f = ahora(), b = writeBatch(db), ref = doc(db, 'chats', id);
  const ultimo = { txt, autor: yo, fecha: f };
  if (!chat) b.set(ref, { miembros: [yo, otro].sort(), estado: relacion ? 'abierto' : 'solicitud', iniciadoPor: yo, ultimo, leido: { [yo]: f }, actualizado: f });
  else b.update(ref, { ultimo, actualizado: f, ['leido.' + yo]: f, ...(chat.estado === 'solicitud' ? { estado: 'abierto' } : {}) });
  b.set(doc(collection(db, 'chats', id, 'mensajes')), { autor: yo, txt, fecha: f });
  return b.commit();
}

before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-criterium', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 } }); });
after(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => { const db = c.firestore(); await setDoc(doc(db, 'seguimientos', A + '_' + B), { de: A, a: B, fecha: ahora() }); });
});

test('con quien sigues, el chat nace abierto y se puede seguir escribiendo', async () => {
  await assertSucceeds(enviar(como(A), A, B, 'Hola Beto', null, true));
  await assertSucceeds(enviar(como(B), B, A, 'Hola Ana', { estado: 'abierto' }, true));
  await assertSucceeds(enviar(como(A), A, B, 'Otra', { estado: 'abierto' }, true));
});
test('sin relación no se puede crear un chat «abierto»', async () => {
  await assertFails(enviar(como(C), C, A, 'Hola', null, true));
});
test('sin relación: un solo mensaje, y el segundo se bloquea', async () => {
  await assertSucceeds(enviar(como(C), C, A, 'Hola Ana, ¿me ayudas?', null, false));
  await assertFails(enviar(como(C), C, A, 'Insisto', { estado: 'solicitud' }, false));
  await assertFails(updateDoc(doc(como(C), 'chats', cid(A, C)), { estado: 'abierto' }));
});
test('si quien recibe la solicitud responde, el chat se abre', async () => {
  await assertSucceeds(enviar(como(C), C, A, 'Hola', null, false));
  await assertSucceeds(enviar(como(A), A, C, 'Hola Caro', { estado: 'solicitud' }, false));
  await assertSucceeds(enviar(como(C), C, A, 'Gracias', { estado: 'abierto' }, false));
});
test('si quien recibe la elimina, queda cerrada para siempre', async () => {
  await assertSucceeds(enviar(como(C), C, A, 'Hola', null, false));
  await assertFails(updateDoc(doc(como(C), 'chats', cid(A, C)), { estado: 'rechazado' }));
  await assertSucceeds(updateDoc(doc(como(A), 'chats', cid(A, C)), { estado: 'rechazado' }));
  await assertFails(enviar(como(C), C, A, 'Otra', { estado: 'rechazado' }, false));
});
test('un tercero no lee ni escribe en un chat ajeno', async () => {
  await assertSucceeds(enviar(como(A), A, B, 'Privado', null, true));
  await assertFails(getDocs(collection(como(C), 'chats', cid(A, B), 'mensajes')));
  await assertFails(enviar(como(C), C, A, 'x', null, false).then(() => {}).then(() => setDoc(doc(como(C), 'chats', cid(A, B), 'mensajes', 'm1'), { autor: C, txt: 'x', fecha: ahora() })));
});
test('cada uno lista solo sus chats', async () => {
  await assertSucceeds(enviar(como(A), A, B, 'Hola', null, true));
  await assertSucceeds(getDocs(query(collection(como(A), 'chats'), where('miembros', 'array-contains', A))));
  await assertFails(getDocs(query(collection(como(C), 'chats'), where('miembros', 'array-contains', A))));
});
test('leído: cada uno marca solo lo suyo', async () => {
  await assertSucceeds(enviar(como(A), A, B, 'Hola', null, true));
  await assertSucceeds(updateDoc(doc(como(B), 'chats', cid(A, B)), { ['leido.' + B]: ahora() }));
  await assertFails(updateDoc(doc(como(B), 'chats', cid(A, B)), { ['leido.' + A]: ahora() }));
});
test('el bloqueo corta los mensajes en los dos sentidos', async () => {
  await assertSucceeds(enviar(como(A), A, B, 'Hola', null, true));
  await assertSucceeds(setDoc(doc(como(B), 'bloqueos', B + '_' + A), { de: B, a: A, fecha: ahora() }));
  await assertFails(enviar(como(A), A, B, 'Hola de nuevo', { estado: 'abierto' }, true));
  await assertFails(enviar(como(B), B, A, 'Y yo tampoco', { estado: 'abierto' }, true));
});
test('nadie escribe a nombre de otro', async () => {
  await assertFails(setDoc(doc(como(C), 'bloqueos', A + '_' + B), { de: A, a: B, fecha: ahora() }));
  const db = como(A), id = cid(A, B), f = ahora(), b = writeBatch(db);
  b.set(doc(db, 'chats', id), { miembros: [A, B].sort(), estado: 'abierto', iniciadoPor: A, ultimo: { txt: 'x', autor: A, fecha: f }, leido: { [A]: f }, actualizado: f });
  b.set(doc(collection(db, 'chats', id, 'mensajes')), { autor: B, txt: 'suplantado', fecha: f });
  await assertFails(b.commit());
});
