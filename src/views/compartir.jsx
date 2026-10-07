// Tu caso en Instagram: arma una imagen vertical (1080 × 1350) con el caso o el plan de tratamiento y la marca Criterium.
// Solo usa texto ya publicado (que pasó el filtro de datos personales): nunca fotos clínicas.
// Se comparte con el menú del celular (Web Share con archivo) o se descarga.
import React, { useEffect, useState } from 'react';
import { Ic, Btn, Modal } from '../ui.jsx';

const W = 1080, H = 1350, M = 88;
const C = { deep: '#0F2530', panel: '#1F3441', menta: '#5CCFC0', mentaInk: '#0F2530', blanco: '#FFFFFF', gris: '#A9C3C9', logoBg: '#1B3949', logoAcc: '#346F7D' };
const FUENTE = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif';
const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="61 60 317 317"><path d="M101 60H338A40 40 0 0 1 378 100V337A40 40 0 0 1 338 377H101A40 40 0 0 1 61 337V100A40 40 0 0 1 101 60Z" fill="${C.logoBg}"/><path d="M301.1 151.1A115 115 0 1 0 270.5 324.6L250.0 289.1A74 74 0 1 1 269.7 177.4Z" fill="#FFFFFF"/><path d="M266.1 327.0A115 115 0 0 0 323.2 258L279.2 258A74 74 0 0 1 247.2 290.6Z" fill="${C.logoAcc}"/><path d="M210 194C222 184 252 182 254 212C256 232 246 244 242 264C238 282 234 292 228 292C220 292 219 268 210 252C201 268 200 292 192 292C186 292 182 282 178 264C174 244 164 232 166 212C168 182 198 184 210 194Z" fill="#FFFFFF"/></svg>`;

const cargarLogo = () => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(LOGO); });
const fuente = (peso, px) => `${peso} ${px}px ${FUENTE}`;
// Corta el texto en líneas que caben en el ancho; si sobran, la última termina en «…»
function lineas(ctx, txt, ancho, max) {
  const palabras = String(txt || '').replace(/\s+/g, ' ').trim().split(' ');
  const out = []; let l = '';
  for (const p of palabras) {
    const prueba = l ? l + ' ' + p : p;
    if (ctx.measureText(prueba).width <= ancho) l = prueba;
    else { if (l) out.push(l); l = p; }
  }
  if (l) out.push(l);
  if (out.length > max) { const r = out.slice(0, max); let u = r[max - 1]; while (u && ctx.measureText(u + '…').width > ancho) u = u.slice(0, -1); r[max - 1] = u.replace(/[\s,.;:]+$/, '') + '…'; return r; }
  return out;
}
function pildora(ctx, x, y, txt, fondo, tinta, px = 26) {
  ctx.font = fuente(800, px); const w = ctx.measureText(txt).width + px * 1.3, h = px * 1.75;
  ctx.fillStyle = fondo; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = tinta; ctx.textBaseline = 'middle'; ctx.fillText(txt, x + px * 0.65, y + h / 2 + 1); ctx.textBaseline = 'alphabetic';
  return w;
}

export async function imagenPublicacion(p, host) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  if (!ctx.roundRect) ctx.roundRect = function (x, y, w, h, r) { this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); };
  // Fondo petróleo con un brillo menta, como la portada de la Red
  ctx.fillStyle = C.deep; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W - 120, 120, 0, W - 120, 120, 620); g.addColorStop(0, 'rgba(92,207,192,.30)'); g.addColorStop(1, 'rgba(92,207,192,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // Marca
  const logo = await cargarLogo();
  if (logo) ctx.drawImage(logo, M, M, 76, 76);
  ctx.font = fuente(700, 52); ctx.fillStyle = C.blanco; ctx.fillText('Criter', M + 96, M + 56);
  const wc = ctx.measureText('Criter').width; ctx.fillStyle = C.menta; ctx.fillText('ium', M + 96 + wc, M + 56);
  pildora(ctx, M + 96 + wc + ctx.measureText('ium').width + 18, M + 16, 'FREE', C.menta, C.mentaInk, 22);

  let y = M + 190;
  const discusion = p.tipo === 'discusion';
  pildora(ctx, M, y, discusion ? '¿QUÉ HARÍAS TÚ?' : 'CASO CLÍNICO', C.menta, C.mentaInk, 26);
  const meta = [p.especialidad, p.procedimiento, p.diente && 'Diente ' + p.diente].filter(Boolean).join(' · ');
  if (meta) { ctx.font = fuente(600, 28); ctx.fillStyle = C.gris; ctx.fillText(meta, M, y + 96); y += 64; }
  y += 130;
  // Título
  ctx.font = fuente(800, 66); ctx.fillStyle = C.blanco;
  for (const l of lineas(ctx, p.titulo || p.txt, W - 2 * M, 4)) { ctx.fillText(l, M, y); y += 78; }
  y += 30;
  if (discusion) {
    ctx.font = fuente(400, 32); ctx.fillStyle = C.gris;
    for (const l of lineas(ctx, p.txt, W - 2 * M, 3)) { ctx.fillText(l, M, y); y += 44; }
    y += 24;
    (p.opciones || []).slice(0, 4).forEach((o, k) => {
      const h = 92; ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.roundRect(M, y, W - 2 * M, h, 26); ctx.fill();
      ctx.fillStyle = C.menta; ctx.beginPath(); ctx.arc(M + 50, y + h / 2, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.mentaInk; ctx.font = fuente(800, 26); ctx.textAlign = 'center'; ctx.fillText(String.fromCharCode(65 + k), M + 50, y + h / 2 + 9); ctx.textAlign = 'left';
      ctx.fillStyle = C.blanco; ctx.font = fuente(600, 31); ctx.fillText(lineas(ctx, o, W - 2 * M - 120, 1)[0] || '', M + 96, y + h / 2 + 11);
      y += h + 16;
    });
  } else {
    const sec = p.secciones || {};
    for (const [k, t, max] of [['diagnostico', 'DIAGNÓSTICO', 3], ['plan', 'PLAN DE TRATAMIENTO', 4]]) {
      if (!sec[k] || y > H - 330) continue;
      ctx.font = fuente(800, 24); ctx.fillStyle = C.menta; ctx.fillText(t, M, y); y += 46;
      ctx.font = fuente(400, 34); ctx.fillStyle = C.blanco;
      for (const l of lineas(ctx, sec[k], W - 2 * M, max)) { ctx.fillText(l, M, y); y += 46; }
      y += 30;
    }
    if (!p.secciones && p.txt) { ctx.font = fuente(400, 34); ctx.fillStyle = C.blanco; for (const l of lineas(ctx, p.txt, W - 2 * M, 6)) { ctx.fillText(l, M, y); y += 46; } }
  }
  // Pie: quién lo revisó y dónde verlo
  const pie = H - M;
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(M, pie - 118, W - 2 * M, 2);
  ctx.font = fuente(700, 30); ctx.fillStyle = C.blanco;
  ctx.fillText(discusion ? 'Vota y discute en Criterium' : p.revisado ? 'Revisado por ' + p.revisado.por.nombre : 'Publicado en Criterium', M, pie - 56);
  ctx.font = fuente(500, 26); ctx.fillStyle = C.gris;
  ctx.fillText([host, 'La red de la Odontología'].filter(Boolean).join(' · '), M, pie - 12);
  return new Promise((res) => cv.toBlob((b) => res(b), 'image/png'));
}

export function CompartirModal({ p, cerrar }) {
  const [img, setImg] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [aviso, setAviso] = useState('');
  useEffect(() => {
    let url = null, vivo = true;
    imagenPublicacion(p, location.host).then((b) => {
      if (!vivo || !b) return;
      url = URL.createObjectURL(b); setImg(url);
      try { setArchivo(new File([b], 'criterium-' + (p.tipo === 'discusion' ? 'plan' : 'caso') + '.png', { type: 'image/png' })); } catch (e) {}
    });
    return () => { vivo = false; if (url) URL.revokeObjectURL(url); };
  }, [p.id]);
  const puedeCompartir = archivo && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [archivo] });
  const compartir = async () => {
    try { await navigator.share({ files: [archivo], title: p.titulo || 'Criterium', text: (p.tipo === 'discusion' ? '¿Qué harías tú? ' : '') + (p.titulo || '') + ' · en Criterium' }); }
    catch (e) { if (e && e.name !== 'AbortError') setAviso('No se pudo abrir el menú para compartir. Descarga la imagen y súbela tú.'); }
  };
  return (
    <Modal open onClose={cerrar} title="Compartir en Instagram">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[18px] bg-deep shadow-shlg" style={{ aspectRatio: '1080 / 1350' }}>
          {img ? <img src={img} alt="Vista previa de la imagen para compartir" className="h-full w-full object-contain" /> : <div className="h-full w-full animate-pulse bg-panel" />}
        </div>
        <p className="m-0 text-center text-[12.5px] leading-snug text-ink3">Solo lleva el texto ya publicado, nunca fotos del paciente. Revísala antes de subirla.</p>
        {aviso && <p className="m-0 text-center text-[12.5px] font-semibold text-warn">{aviso}</p>}
        <div className="flex flex-wrap justify-center gap-2">
          {puedeCompartir && <Btn v="primary" icon="compartir" onClick={compartir}>Compartir</Btn>}
          {img && <a href={img} download={archivo ? archivo.name : 'criterium.png'} className="inline-flex items-center justify-center gap-2 rounded-full border border-cardline bg-card px-[18px] py-2.5 text-[13.5px] font-semibold text-ink2 shadow-sh hover:bg-soft"><Ic n="download" s={16} />Descargar imagen</a>}
        </div>
      </div>
    </Modal>
  );
}
