// Voz del modo guiado: lectura en voz alta (speechSynthesis) y órdenes por micrófono (Web Speech API).
// Sin servidor ni librerías. Chrome y Edge reconocen en servidores de Google; Safari, en los de Apple. Firefox no lo trae.
// Por eso la interfaz pide no decir datos del paciente: solo se escuchan órdenes cortas.
import { useEffect, useRef, useState } from 'react';
import { clave } from './lectura.js';

const Reconocedor = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
export const vozDisponible = () => !!Reconocedor;
export const lecturaDisponible = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

const sinTildes = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Orden importa: "por qué" y "anterior" se revisan antes que "siguiente"
const ORDENES = [
  ['callar', /\b(silencio|calla|callate|para de leer|deten|detente|stop)\b/],
  ['salir', /\b(salir|salgamos|cerrar|cierra)\b/],
  ['porque', /\bpor ?que\b/],
  ['anterior', /\b(anterior|atras|volver|vuelve|retrocede|retroceder)\b/],
  ['leer', /\b(lee|leer|leelo|repite|repetir|de nuevo|que hago)\b/],
  ['siguiente', /\b(siguiente|sigamos|sigue|seguimos|seguir|avanza|avanzar|avancemos|adelante|proximo|continua|continuar|listo|lista|termine|terminado|hecho|dale|next)\b/]
];
export function interpretar(texto) {
  const t = sinTildes(texto);
  for (const [orden, re] of ORDENES) if (re.test(t)) return orden;
  return null;
}

/* ═══ Lectura en voz alta ═══ */

// Preferencias locales (comodidad): la voz elegida y la velocidad
const leerLS = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
const guardarLS = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
// «Calma» lee más lento y deja respirar entre frases: escuchar el paso a paso tiene que ser tranquilo
export const VELOCIDADES = [{ v: '0.9', t: 'Calma' }, { v: '1.05', t: 'Normal' }, { v: '1.2', t: 'Rápida' }];
const pausaEntreFrases = (rate) => rate <= 0.92 ? 550 : rate <= 1.08 ? 300 : 120;

// Voces de juguete de Apple (Eddy, Grandma, Rocko…): suenan raras para un protocolo clínico
const JUGUETE = /\b(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|albert|bahh|bells|boing|bubbles|cellos|jester|organ|superstar|trinoids|whisper|wobble|zarvox|bad news|good news)\b/i;
const puntaje = (v) => {
  const l = v.lang.replace('_', '-').toLowerCase(); const n = v.name.toLowerCase();
  let p = l === 'es-cl' ? 4 : /es-(us|mx|419|ar|co|pe)/.test(l) ? 3 : l === 'es-es' ? 2 : 1;
  if (/premium|enhanced|mejorad|natural|neural|online/.test(n)) p += 6; // voces de mejor calidad
  if (/google/.test(n)) p += 5;                                          // las de Chrome suenan naturales
  if (/paulina|m[oó]nica|jorge|diego|isabela|francisca|microsoft/.test(n)) p += 3;
  return p;
};
let voces = [];
const oyentesVoces = new Set();
function cargarVoces() {
  try {
    voces = window.speechSynthesis.getVoices()
      .filter((v) => /^es([-_]|$)/i.test(v.lang) && !JUGUETE.test(v.name))
      .sort((a, b) => puntaje(b) - puntaje(a) || a.name.localeCompare(b.name));
    oyentesVoces.forEach((f) => f(voces));
  } catch (e) {}
}
if (lecturaDisponible()) {
  cargarVoces();
  // Chrome entrega la lista de voces tarde: hay que esperar este evento
  try { window.speechSynthesis.addEventListener('voiceschanged', cargarVoces); } catch (e) { window.speechSynthesis.onvoiceschanged = cargarVoces; }
}
/* Voces naturales de Google Cloud Text-to-Speech: audios generados de antemano con `npm run voces`
   (scripts/voces.mjs) en public/voz/<voz>/<clave>.mp3, con su lista en public/voz/manifest.json.
   Si no hay audios generados, todo sigue funcionando con las voces del sistema. */
const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/';
let natural = { voces: [], claves: new Set() };
if (typeof window !== 'undefined' && typeof fetch === 'function') {
  fetch(BASE + 'voz/manifest.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((m) => {
    if (!m || !Array.isArray(m.voces)) return;
    natural = { voces: m.voces, claves: new Set(m.claves || []) };
    oyentesVoces.forEach((f) => f(listaVoces()));
  }).catch(() => {});
}
const nombreNatural = (v) => 'Natural · ' + v.nombre + (v.genero === 'FEMALE' ? ' (femenina)' : v.genero === 'MALE' ? ' (masculina)' : '');
const listaVoces = () => [...natural.voces.map((v) => ({ voiceURI: 'gcp:' + v.id, name: nombreNatural(v), lang: v.idioma || 'es-US', natural: true })), ...voces];
export function useVoces() {
  const [v, setV] = useState(listaVoces);
  useEffect(() => { const f = () => setV(listaVoces()); oyentesVoces.add(f); cargarVoces(); f(); return () => { oyentesVoces.delete(f); }; }, []);
  return v;
}
export const vozElegida = () => leerLS('criterium-voz', '');
// Voz natural en uso: la elegida si es de Google; si no se ha elegido ninguna, la primera natural disponible
const vozNatural = () => {
  const e = vozElegida();
  if (e.startsWith('gcp:')) return natural.voces.find((v) => 'gcp:' + v.id === e) || natural.voces[0] || null;
  return e ? null : natural.voces[0] || null;
};
export const velocidad = () => parseFloat(leerLS('criterium-voz-vel', '1.05')) || 1.05;
export const elegirVoz = (uri) => guardarLS('criterium-voz', uri);
export const elegirVelocidad = (v) => guardarLS('criterium-voz-vel', String(v));
const vozActual = () => voces.find((v) => v.voiceURI === vozElegida()) || voces[0] || null;
let audio = null; // un solo elemento: Safari deja sonar los siguientes si el primero partió con un toque

// Estado de la lectura. Lo que se está leyendo sirve para no confundir el eco del parlante con una orden.
let leyendo = '';
let cola = [];
let turno = 0;           // cada lectura nueva invalida la anterior
let vigilante = null;
const oyentes = new Set(); // componentes que muestran "leyendo…"
let hablandoAhora = false;
const avisar = (v) => { if (v === hablandoAhora) return; hablandoAhora = v; oyentes.forEach((f) => f(v)); };
export const estaHablando = () => hablandoAhora;
export const textoLeido = () => leyendo;

// Chrome corta las frases largas (~15 s) sin avisar: se lee frase por frase
const trozos = (texto) => (texto.match(/[^.!?;:]+[.!?;:]*\s*/g) || [texto])
  .flatMap((f) => f.length <= 200 ? [f] : f.match(/.{1,200}(\s|$)/g))
  .map((f) => f.trim()).filter(Boolean);

function terminar(t) { if (t !== turno) return; clearInterval(vigilante); vigilante = null; cola = []; leyendo = ''; avisar(false); }
function decirSiguiente(t) {
  if (t !== turno) return;
  const s = window.speechSynthesis; const f = cola.shift();
  if (!f) { terminar(t); return; }
  const u = new SpeechSynthesisUtterance(f);
  const v = vozActual();
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'es-CL';
  u.rate = velocidad(); u.pitch = 0.97; // un tono apenas más grave suena menos metálico
  u.onstart = () => { if (t === turno) avisar(true); };
  u.onend = () => { if (t === turno) setTimeout(() => decirSiguiente(t), cola.length ? pausaEntreFrases(u.rate) : 0); };
  u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') decirSiguiente(t); };
  decirSiguiente.u = u; // referencia viva: si no, Chrome a veces descarta la frase y nunca avisa que terminó
  s.speak(u);
}
export function hablar(texto) {
  if (!texto) return;
  const nv = vozNatural();
  if (nv && natural.claves.has(clave(texto)) && typeof Audio !== 'undefined') { reproducir(texto, nv); return; }
  hablarSistema(texto);
}
// Audio pregenerado: la velocidad elegida se aplica al reproducir, sin cambiar el tono
function reproducir(texto, nv) {
  const t = ++turno;
  try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
  clearInterval(vigilante); cola = [];
  leyendo = sinTildes(texto);
  if (!audio) audio = new Audio();
  audio.pause();
  audio.src = BASE + 'voz/' + nv.id + '/' + clave(texto) + '.mp3';
  audio.playbackRate = velocidad();
  try { audio.preservesPitch = true; } catch (e) {}
  audio.onplaying = () => { if (t === turno) avisar(true); };
  audio.onended = () => terminar(t);
  // Si el archivo falla, lee la voz del sistema
  audio.onerror = () => { if (t === turno) hablarSistema(texto); };
  avisar(true);
  const p = audio.play();
  if (p && p.catch) p.catch(() => { if (t === turno) hablarSistema(texto); });
}
function hablarSistema(texto) {
  if (!lecturaDisponible() || !texto) return;
  const s = window.speechSynthesis;
  const t = ++turno;
  try { s.cancel(); } catch (e) {}
  cola = trozos(texto); leyendo = sinTildes(texto);
  avisar(true);
  // Vigilante: si el navegador deja de hablar sin avisar, se libera solo (antes quedaba "leyendo" hasta un minuto)
  clearInterval(vigilante);
  let quieto = 0;
  vigilante = setInterval(() => {
    if (t !== turno) return;
    if (s.paused) s.resume();
    quieto = s.speaking || s.pending ? 0 : quieto + 1;
    if (quieto >= 3) terminar(t);
  }, 400);
  // Chrome a veces pierde la frase si se habla justo después de cancel
  setTimeout(() => { try { decirSiguiente(t); } catch (e) { terminar(t); } }, 60);
}
export function callar() {
  turno++; cola = []; leyendo = '';
  try { if (audio) audio.pause(); } catch (e) {}
  clearInterval(vigilante); vigilante = null;
  try { window.speechSynthesis.cancel(); } catch (e) {}
  avisar(false);
}
export function useHablando() {
  const [v, setV] = useState(hablandoAhora);
  useEffect(() => { oyentes.add(setV); return () => { oyentes.delete(setV); }; }, []);
  return v;
}

/* ═══ Órdenes por micrófono ═══ */

const PAUSA_FRASE = 800;   // ms sin palabras nuevas = empieza otra frase (Safari junta todo en un solo resultado)
const ESPERA_ECO = 650;    // ms que se espera una palabra suelta que también está en el texto leído
const MAX_PALABRAS = 6;    // una frase más larga es conversación (por ejemplo con el paciente), no una orden
const REINICIO = 40;       // palabras acumuladas en un resultado: se reinicia el micrófono para no arrastrar todo
const palabras = (t) => sinTildes(t).replace(/[^a-zñü0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

// Convierte los resultados del reconocedor en órdenes. Va aparte del hook para poder probarlo sin micrófono.
// - Cada frase se mira desde la última orden o la última pausa, no el resultado entero: así una segunda orden
//   en el mismo resultado (Safari, o Chrome sin pausa) también cuenta, y lo ya dicho no la vuelve "conversación".
// - Eco del parlante: si lo oído (2 palabras o más) está en lo que la app lee, se descarta. Si es UNA palabra
//   que también aparece en el texto («listo», «sigue»…), se espera un instante: si la frase crece, era eco;
//   si no, era la persona. Antes se descartaba siempre, y por eso «listo» o «siguiente» fallaban mientras leía.
export function procesadorOrdenes(emitir, { hablando = estaHablando, leido = textoLeido, reloj = () => Date.now(), diferir = setTimeout, cancelar = clearTimeout } = {}) {
  const frases = new Map(); // índice del resultado → { base, n, t, orden, cuando }
  let ultima = { orden: '', cuando: -1e9 };
  let espera = null;
  const disparar = (st, n, orden, texto) => {
    const ahora = reloj();
    cancelar(espera); espera = null;
    st.base = n;
    // Chrome corrige el texto provisorio («siguiente» → «sí, siguiente»): la misma orden seguida no avanza dos veces
    if (orden === ultima.orden && ahora - ultima.cuando < 1200) return;
    ultima = { orden, cuando: ahora };
    emitir(orden, texto);
  };
  return {
    // Devuelve el texto de la frase actual (para mostrar «Oí: …») y si conviene reiniciar el micrófono
    resultado(i, alternativas, final) {
      const ahora = reloj();
      const pal = palabras(alternativas[0] || '');
      let st = frases.get(i);
      if (!st) { st = { base: 0, n: 0, t: ahora }; frases.set(i, st); }
      if (st.n > 0 && pal.length > st.n && ahora - st.t > PAUSA_FRASE) st.base = Math.max(st.base, st.n);
      st.base = Math.min(st.base, pal.length);
      st.n = pal.length; st.t = ahora;
      const frase = pal.slice(st.base);
      const texto = frase.join(' ');
      const salida = { texto, reiniciar: pal.length > REINICIO };
      if (!frase.length || frase.length > MAX_PALABRAS) return salida;
      let orden = null;
      for (let a = 0; a < alternativas.length && !orden; a++) orden = interpretar(palabras(alternativas[a]).slice(st.base).join(' '));
      if (!orden) return salida;
      if (orden !== 'callar' && hablando()) {
        const l = ' ' + palabras(leido()).join(' ') + ' ';
        if (l.includes(' ' + texto + ' ')) {
          if (frase.length >= 2) return salida; // eco seguro
          if (!final) {
            // Palabra suelta que también se está leyendo: se espera a ver si la frase sigue
            cancelar(espera);
            const base = st.base, n = st.n;
            espera = diferir(() => { espera = null; if (st.base === base && st.n === n) disparar(st, n, orden, texto); }, ESPERA_ECO);
            return salida;
          }
        }
      }
      disparar(st, pal.length, orden, texto);
      return salida;
    },
    soltar() { cancelar(espera); espera = null; }
  };
}

// estado: 'apagado' | 'iniciando' | 'escuchando' | 'pausado' | 'denegado' | 'sin-micro' | 'error' | 'no-disponible'
// encender() y apagar() se llaman desde el toque del botón: Safari solo deja abrir el micrófono dentro de un gesto.
export function useVoz(onOrden) {
  const [estado, setEstado] = useState(Reconocedor ? 'apagado' : 'no-disponible');
  const [oido, setOido] = useState('');
  const cb = useRef(onOrden); cb.current = onOrden;
  const r = useRef(null);
  const quiere = useRef(false);  // el usuario quiere que siga escuchando
  const fallos = useRef(0);      // errores seguidos (red): se reintenta con espera creciente
  const funciono = useRef(false); // alguna vez arrancó: un "not-allowed" posterior es una pausa, no un rechazo
  const espera = useRef(null);
  const ultimoOido = useRef('');

  const crear = () => {
    const rec = new Reconocedor();
    rec.lang = 'es-CL'; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 3;
    // Un procesador por sesión del micrófono: los índices de resultado parten de cero en cada una
    const proc = procesadorOrdenes((orden, texto) => { if (r.current === rec) cb.current(orden, texto); });
    rec.onstart = () => { if (r.current !== rec) return; rec.inicio = Date.now(); funciono.current = true; fallos.current = 0; setEstado('escuchando'); };
    rec.onresult = (ev) => {
      if (r.current !== rec) return;
      fallos.current = 0;
      let reiniciar = false, mostrar = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        const alts = []; for (let a = 0; a < res.length; a++) alts.push(res[a].transcript || '');
        const sal = proc.resultado(i, alts, res.isFinal);
        if (sal.texto) mostrar = sal.texto;
        reiniciar = reiniciar || sal.reiniciar;
      }
      // Solo se vuelve a dibujar si cambió lo que se oyó (los resultados provisorios llegan varias veces por segundo)
      if (mostrar && mostrar !== ultimoOido.current) { ultimoOido.current = mostrar; setOido(mostrar); }
      if (reiniciar) { try { rec.abort(); } catch (e) {} } // onend lo vuelve a abrir
    };
    rec.onerror = (e) => {
      if (r.current !== rec) return;
      const err = e.error;
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        quiere.current = false; setEstado(funciono.current ? 'pausado' : 'denegado');
      } else if (err === 'audio-capture') { quiere.current = false; setEstado('sin-micro'); }
      else if (err === 'network') { fallos.current++; if (fallos.current > 4) { quiere.current = false; setEstado('error'); } }
      // 'no-speech' y 'aborted' son normales: se reinicia en onend
    };
    // El navegador corta la escucha tras un silencio o cada cierto tiempo: se reinicia mientras se quiera.
    // Sin fallos se reabre casi de inmediato (antes 250 ms: una orden dicha justo ahí se perdía).
    rec.onend = () => {
      if (r.current !== rec) return;
      proc.soltar();
      if (!quiere.current) { r.current = null; return; }
      clearTimeout(espera.current);
      const abrir = () => {
        if (!quiere.current || r.current !== rec) return;
        try { const n = crear(); r.current = n; n.start(); }
        catch (e) { setEstado('pausado'); quiere.current = false; }
      };
      // Si la sesión duró menos de un segundo, algo la está cortando: se espera un poco para no girar en vacío
      const breve = !rec.inicio || Date.now() - rec.inicio < 1000;
      const ms = fallos.current ? Math.min(250 * 2 ** fallos.current, 4000) : breve ? 300 : 0;
      if (ms) espera.current = setTimeout(abrir, ms); else abrir();
    };
    return rec;
  };

  const encender = () => {
    if (!Reconocedor) return;
    quiere.current = true; fallos.current = 0;
    clearTimeout(espera.current);
    try { if (r.current) r.current.abort(); } catch (e) {}
    try { const n = crear(); r.current = n; setEstado('iniciando'); n.start(); }
    catch (e) { setEstado('error'); }
  };
  const apagar = () => {
    quiere.current = false; clearTimeout(espera.current);
    const rec = r.current; r.current = null;
    try { if (rec) rec.abort(); } catch (e) {}
    ultimoOido.current = ''; setOido(''); setEstado(Reconocedor ? 'apagado' : 'no-disponible');
  };
  useEffect(() => () => { quiere.current = false; clearTimeout(espera.current); try { if (r.current) r.current.abort(); } catch (e) {} r.current = null; }, []);

  const activo = estado === 'iniciando' || estado === 'escuchando';
  return { estado, oido, activo, encender, apagar };
}
