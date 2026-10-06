// Control por voz del modo guiado. Usa la Web Speech API del navegador (sin servidor ni librerías).
// Chrome y Edge hacen el reconocimiento en servidores de Google; Safari, en servidores de Apple. Firefox no lo trae.
// Por eso la interfaz pide no decir datos del paciente: solo se escuchan órdenes cortas.
import { useEffect, useRef, useState } from 'react';

const Reconocedor = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
export const vozDisponible = () => !!Reconocedor;

const sinTildes = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Orden importa: "por qué" y "anterior" se revisan antes que "siguiente"
const ORDENES = [
  ['callar', /\b(silencio|calla|callate|para de leer|deten)\b/],
  ['salir', /\b(salir|salgamos|cerrar|cierra)\b/],
  ['porque', /\bpor ?que\b/],
  ['anterior', /\b(anterior|atras|volver|vuelve|retrocede|retroceder)\b/],
  ['leer', /\b(lee|leer|leelo|repite|repetir|de nuevo|que hago)\b/],
  ['siguiente', /\b(siguiente|sigamos|sigue|seguimos|seguir|avanza|avanzar|avancemos|listo|lista|termine|terminado|hecho|dale|next)\b/]
];
export function interpretar(texto) {
  const t = sinTildes(texto);
  for (const [orden, re] of ORDENES) if (re.test(t)) return orden;
  return null;
}

// Lectura en voz alta. Mientras habla, se ignoran los comandos (para que no se escuche a sí misma).
let hablandoHasta = 0;
const oyentes = new Set(); // componentes que muestran "leyendo…"
const avisarHabla = (v) => oyentes.forEach((f) => f(v));
let actual = null; // solo la última lectura avisa; al cortar una para empezar otra, la vieja no apaga el indicador
export const lecturaDisponible = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
export function hablar(texto) {
  try {
    const s = window.speechSynthesis; if (!s || !texto) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-CL'; u.rate = 1.04;
    const voces = s.getVoices();
    const voz = voces.find((v) => v.lang === 'es-CL') || voces.find((v) => v.lang === 'es-US') || voces.find((v) => v.lang.startsWith('es'));
    if (voz) u.voice = voz;
    hablandoHasta = Date.now() + 60000;
    actual = u;
    u.onstart = () => { if (actual === u) avisarHabla(true); };
    u.onend = u.onerror = () => { if (actual !== u) return; hablandoHasta = Date.now() + 500; avisarHabla(false); };
    s.speak(u);
  } catch (e) {}
}
export function callar() { actual = null; try { window.speechSynthesis.cancel(); } catch (e) {} hablandoHasta = Date.now() + 300; avisarHabla(false); }
export function useHablando() {
  const [v, setV] = useState(false);
  useEffect(() => { oyentes.add(setV); return () => { oyentes.delete(setV); }; }, []);
  return v;
}

// activo: si el micrófono debe estar escuchando. onOrden(orden, texto) se llama una vez por frase reconocida.
// estado: 'apagado' | 'escuchando' | 'denegado' | 'error' | 'no-disponible'
export function useVoz(activo, onOrden) {
  const [estado, setEstado] = useState(Reconocedor ? 'apagado' : 'no-disponible');
  const [oido, setOido] = useState('');
  const cb = useRef(onOrden); cb.current = onOrden;

  useEffect(() => {
    if (!activo || !Reconocedor) { setEstado(Reconocedor ? 'apagado' : 'no-disponible'); return; }
    let vivo = true;
    const r = new Reconocedor();
    r.lang = 'es-CL'; r.continuous = true; r.interimResults = true; r.maxAlternatives = 1;
    const usados = new Set(); // índice de resultado ya convertido en orden (para no avanzar dos veces)
    r.onstart = () => { if (vivo) setEstado('escuchando'); };
    r.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const texto = ev.results[i][0].transcript.trim();
        if (!texto) continue;
        setOido(texto);
        if (usados.has(i)) continue;
        const orden = interpretar(texto);
        // Mientras lee en voz alta solo se acepta "silencio": el texto leído podría sonar como una orden
        if (Date.now() < hablandoHasta && orden !== 'callar') continue;
        // Una orden reconocida en un resultado parcial se ejecuta altiro; así responde más rápido
        if (orden) { usados.add(i); cb.current(orden, texto); }
      }
    };
    r.onerror = (e) => {
      if (!vivo) return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { vivo = false; setEstado('denegado'); }
      else if (e.error !== 'no-speech' && e.error !== 'aborted') setEstado('error');
    };
    // El navegador corta la escucha tras un silencio: se reinicia mientras siga activo
    r.onend = () => { if (vivo) { usados.clear(); try { r.start(); } catch (e) {} } };
    try { r.start(); } catch (e) { setEstado('error'); }
    return () => { vivo = false; try { r.abort(); } catch (e) {} };
  }, [activo]);

  return { estado, oido };
}
