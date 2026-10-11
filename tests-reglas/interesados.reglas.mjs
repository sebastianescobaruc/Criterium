// Pruebas de la regla de interesados/ («Agenda una demo» y «Lista de espera» de la portada pública), en el emulador.
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

let env;
const EQ = 'equipo';
const anonimo = () => env.unauthenticatedContext().firestore();
const como = (u) => env.authenticatedContext(u, { email: u + '@correo.cl', email_verified: true }).firestore();
const demo = (extra = {}) => ({ tipo: 'demo', nombre: 'Ana Pérez', correo: 'ana@clinica.cl', rol: 'Administración', clinica: 'Clínica de prueba', origen: 'portada', fecha: serverTimestamp(), ...extra });
const lista = (extra = {}) => ({ tipo: 'lista', nombre: 'Juan Soto', correo: 'juan@correo.cl', rol: 'Estudiante', origen: 'portada', fecha: serverTimestamp(), ...extra });

before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-criterium', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 } }); });
after(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'admins', EQ), { nombre: 'Equipo' }); });
});

test('sin cuenta se puede pedir una demo o unirse a la lista, con los campos opcionales', async () => {
  await assertSucceeds(addDoc(collection(anonimo(), 'interesados'), demo({ telefono: '+56 9 0000 0000', sillones: '3 a 5', mensaje: 'Ver la agenda y la caja.' })));
  await assertSucceeds(addDoc(collection(anonimo(), 'interesados'), lista({ institucion: 'Mi escuela' })));
});
test('se rechaza lo que no cumple: campos de más, correo malo, demo sin clínica, fecha del cliente, textos largos', async () => {
  const col = () => collection(anonimo(), 'interesados');
  await assertFails(addDoc(col(), demo({ admin: true })));
  await assertFails(addDoc(col(), demo({ correo: 'ana@clinica' })));
  const sinClinica = demo(); delete sinClinica.clinica;
  await assertFails(addDoc(col(), sinClinica));
  await assertFails(addDoc(col(), demo({ fecha: new Date() })));
  await assertFails(addDoc(col(), demo({ tipo: 'otro' })));
  await assertFails(addDoc(col(), lista({ mensaje: 'x'.repeat(1001) })));
  await assertFails(addDoc(col(), lista({ nombre: 'A' })));
});
test('solo el equipo lee; nadie edita ni borra', async () => {
  await env.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'interesados', 'i1'), { ...lista(), fecha: new Date() }); });
  await assertFails(getDoc(doc(anonimo(), 'interesados', 'i1')));
  await assertFails(getDoc(doc(como('alguien'), 'interesados', 'i1')));
  await assertSucceeds(getDoc(doc(como(EQ), 'interesados', 'i1')));
  await assertFails(updateDoc(doc(como(EQ), 'interesados', 'i1'), { nombre: 'Otro' }));
  await assertFails(deleteDoc(doc(como(EQ), 'interesados', 'i1')));
});
