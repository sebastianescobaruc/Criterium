// node scripts/musica.mjs <video.mp4> [salida.mp4]   (sin salida: reemplaza el video)
// Música de fondo ORIGINAL para los videos de Criterium (generada aquí: sin derechos de terceros): acordes suaves que
// cambian cada 8 s (Do, La menor, Fa, Sol), un arpegio liviano y un bajo tenue. Se mezcla bastante más baja que la voz
// y además baja sola cuando alguien habla (sidechain), para que la narración siempre se entienda.
// La usa también scripts/video-motor.mjs al terminar cada video (salvo con --sin-musica).
import { writeFileSync, existsSync, renameSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'node:path';

const SR = 44100;
const nota = (n) => 440 * Math.pow(2, (n - 69) / 12); // número MIDI → Hz
// Acordes (MIDI): Cmaj9, Am7, Fmaj7, Gsus/6. Cada uno 8 s, en bucle
const ACORDES = [[48, 55, 60, 64, 67, 71, 74], [45, 52, 57, 60, 64, 67], [41, 48, 57, 60, 64, 69], [43, 50, 55, 59, 62, 64]];
const DUR_ACORDE = 8, CRUCE = 2.5;

// Escribe un WAV estéreo de 16 bits con la música, de la duración pedida (s)
export function generarMusica(salida, segundos) {
  const n = Math.ceil((segundos + 1) * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  const fases = new Map();
  // Peso de cada acorde en el tiempo t: cruce suave (coseno) entre acordes
  const peso = (k, t) => {
    const ciclo = ACORDES.length * DUR_ACORDE;
    const tc = ((t % ciclo) + ciclo) % ciclo;
    const ini = k * DUR_ACORDE;
    let d = tc - ini; if (d < -CRUCE) d += ciclo;
    if (d < -CRUCE || d > DUR_ACORDE + CRUCE) return 0;
    if (d < CRUCE) return 0.5 - 0.5 * Math.cos(Math.PI * (d + CRUCE) / (2 * CRUCE));
    if (d > DUR_ACORDE - CRUCE) return 0.5 + 0.5 * Math.cos(Math.PI * (d - DUR_ACORDE + CRUCE) / (2 * CRUCE));
    return 1;
  };
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let l = 0, r = 0;
    ACORDES.forEach((ac, k) => {
      const w = peso(k, t); if (!w) return;
      ac.forEach((m, j) => {
        const f = nota(m);
        // pad: dos sinusoides apenas desafinadas por canal (ancho estéreo) y un armónico tenue
        const a = 0.055 * w * (j === 0 ? 1.3 : 1);
        l += a * (Math.sin(2 * Math.PI * f * 0.9985 * t) + 0.25 * Math.sin(2 * Math.PI * 2 * f * t));
        r += a * (Math.sin(2 * Math.PI * f * 1.0015 * t + 0.7) + 0.25 * Math.sin(2 * Math.PI * 2 * f * t + 0.3));
      });
      // bajo: la raíz una octava abajo
      const fb = nota(ac[0] - 12), ab = 0.08 * w;
      l += ab * Math.sin(2 * Math.PI * fb * t); r += ab * Math.sin(2 * Math.PI * fb * t);
    });
    // arpegio: una nota cada 0,75 s, del acorde que suena, una octava arriba, con caída exponencial
    const paso = 0.75, kArp = Math.floor(t / paso), tA = t - kArp * paso;
    const ac = ACORDES[Math.floor(((kArp * paso) % (ACORDES.length * DUR_ACORDE)) / DUR_ACORDE)];
    const fa = nota(ac[[2, 3, 4, 3][kArp % 4] % ac.length] + 12);
    const ea = 0.09 * Math.exp(-tA / 0.55) * Math.min(1, tA / 0.01);
    const sa = ea * (Math.sin(2 * Math.PI * fa * t) + 0.18 * Math.sin(2 * Math.PI * 3 * fa * t));
    const pan = kArp % 2 ? 0.65 : 0.35;
    l += sa * (1 - pan); r += sa * pan;
    // respiración lenta del pad
    const lfo = 0.85 + 0.15 * Math.sin(2 * Math.PI * t / 13);
    L[i] = l * lfo; R[i] = r * lfo;
  }
  // Paso bajo suave (un polo) para quitar brillo, entrada y salida en fundido, y normalización
  let pl = 0, pr = 0; const alfa = 0.18;
  let pico = 0;
  for (let i = 0; i < n; i++) {
    pl += alfa * (L[i] - pl); pr += alfa * (R[i] - pr);
    const t = i / SR, fin = segundos - t;
    const g = Math.min(1, t / 3, Math.max(0, fin) / 4);
    L[i] = pl * g; R[i] = pr * g;
    pico = Math.max(pico, Math.abs(L[i]), Math.abs(R[i]));
  }
  const k = pico ? 0.7 / pico : 1;
  const datos = Buffer.alloc(44 + n * 4);
  datos.write('RIFF', 0); datos.writeUInt32LE(36 + n * 4, 4); datos.write('WAVE', 8); datos.write('fmt ', 12);
  datos.writeUInt32LE(16, 16); datos.writeUInt16LE(1, 20); datos.writeUInt16LE(2, 22); datos.writeUInt32LE(SR, 24);
  datos.writeUInt32LE(SR * 4, 28); datos.writeUInt16LE(4, 32); datos.writeUInt16LE(16, 34); datos.write('data', 36); datos.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    datos.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(L[i] * k * 32767))), 44 + i * 4);
    datos.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(R[i] * k * 32767))), 46 + i * 4);
  }
  writeFileSync(salida, datos);
}

const duracion = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());

// Mezcla la música bajo la voz de un video (la voz queda intacta; la música va unos 17 dB abajo y baja más al hablar)
export function agregarMusica(entrada, salida = entrada) {
  const dur = duracion(entrada);
  const tmp = join(dirname(resolve(entrada)), '_musica-' + Date.now());
  const wav = tmp + '.wav', fx = tmp + '-fx.wav', out = tmp + '.mp4';
  generarMusica(wav, dur);
  execFileSync('ffmpeg', ['-y', '-i', wav, '-af', 'aecho=0.8:0.55:90|180|270:0.22|0.15|0.1,lowpass=f=4200', fx], { stdio: 'ignore' });
  const filtro = '[1:a]volume=0.3[m];[0:a]asplit=2[voz][sc];[m][sc]sidechaincompress=threshold=0.015:ratio=5:attack=20:release=700[md];[voz][md]amix=inputs=2:normalize=0:duration=first[a]';
  execFileSync('ffmpeg', ['-y', '-i', entrada, '-i', fx, '-filter_complex', filtro, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out], { stdio: 'ignore' });
  rmSync(wav, { force: true }); rmSync(fx, { force: true });
  if (existsSync(salida) && salida === entrada) rmSync(salida);
  renameSync(out, salida);
  return salida;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [entrada, salida] = process.argv.slice(2);
  if (!entrada) { console.error('Uso: node scripts/musica.mjs <video.mp4> [salida.mp4]'); process.exit(1); }
  console.log('· música agregada:', agregarMusica(entrada, salida || entrada));
}
