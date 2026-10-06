// Comentarios en cada paso de un protocolo.
// Hoy: cualquiera con sesión comenta un paso y lee lo que otros dejaron; cada uno borra los suyos.
// Para después: las correcciones de los expertos que validan el protocolo (tipo «Corrección») y los comentarios
// de docentes visibles para sus estudiantes (se guarda si el autor es docente).
import React, { createContext, useContext, useState } from 'react';
import { useApp } from '../ctx.js';
import { hace } from '../logic.js';
import { Avatar, Pill, Seg, Btn, cx, inputCls } from '../ui.jsx';
import { useComentariosProto, comentarPasoFS, borrarComentarioFS } from '../db.js';

const MAX = 1000;
const Ctx = createContext(null);

// Una sola suscripción por protocolo; los pasos leen de aquí
export function ComentariosProvider({ id, d, children }) {
  const { myUid } = useApp();
  const lista = useComentariosProto(id, !!myUid);
  const version = (d.tags || []).find((t) => /^v\d/.test(t)) || '';
  return <Ctx.Provider value={{ id, version, lista }}>{children}</Ctx.Provider>;
}
// Cuántos comentarios tiene el paso i (null si no hay protocolo con comentarios alrededor)
export function useNComentarios(i) {
  const c = useContext(Ctx);
  return c ? c.lista.filter((x) => x.paso === i).length : null;
}

export function ComentariosPaso({ i, s }) {
  const c = useContext(Ctx);
  const { myUid, perfil, esDocente, avisar } = useApp();
  const [txt, setTxt] = useState('');
  const [tipo, setTipo] = useState('comentario');
  const [enviando, setEnviando] = useState(false);
  const [borrar, setBorrar] = useState(null);
  if (!c) return null;
  const lista = c.lista.filter((x) => x.paso === i);
  const limpio = txt.trim();
  const publicar = async () => {
    if (!limpio || limpio.length > MAX || enviando) return;
    setEnviando(true);
    try {
      await comentarPasoFS({
        protoId: c.id, paso: i, pasoCorto: s.corto || '', version: c.version, uid: myUid, tipo, txt: limpio,
        autor: { uid: myUid, nombre: (perfil && perfil.nombre) || 'Sin nombre', rol: (perfil && perfil.rol) || '', docente: !!esDocente }
      });
      setTxt(''); setTipo('comentario');
    } catch (e) { avisar('No se pudo publicar el comentario. Revisa tu conexión.', 'warn'); }
    setEnviando(false);
  };
  const quitar = async (id) => {
    try { await borrarComentarioFS(id); } catch (e) { avisar('No se pudo borrar el comentario.', 'warn'); }
    setBorrar(null);
  };
  return (
    <div className="flex flex-col gap-4">
      {lista.length === 0 ? <p className="m-0 text-[13.5px] text-ink3">Todavía nadie comenta este paso. Si algo no se entiende, falta o está mal, dilo aquí.</p> : (
        <ul className="m-0 flex list-none flex-col p-0">
          {lista.map((x, k) => (
            <li key={x.id} className={cx('grid grid-cols-[32px_minmax(0,1fr)] gap-3 py-3', k > 0 && 'border-t border-line2')}>
              <Avatar nombre={x.autor && x.autor.nombre} size={32} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                  <b className="text-ink">{x.autor && x.autor.nombre}</b>
                  {x.autor && x.autor.docente && <Pill tono="acento">Docente</Pill>}
                  {x.tipo === 'correccion' && <Pill tono="warn">Corrección</Pill>}
                  <span className="text-[11.5px] text-ink3">{x.autor && x.autor.rol ? x.autor.rol + ' · ' : ''}{hace(x.fecha)}</span>
                </div>
                <p className="m-0 mt-1 whitespace-pre-wrap text-[14px] leading-[1.55] text-ink2 [overflow-wrap:anywhere]">{x.txt}</p>
                {x.uid === myUid && (borrar === x.id ? (
                  <div className="mt-1.5 flex items-center gap-3 text-[12.5px]">
                    <span className="text-ink3">¿Borrar tu comentario?</span>
                    <button type="button" onClick={() => quitar(x.id)} className="font-semibold text-bad hover:underline">Borrar</button>
                    <button type="button" onClick={() => setBorrar(null)} className="font-semibold text-ink2 hover:underline">No</button>
                  </div>
                ) : <button type="button" onClick={() => setBorrar(x.id)} className="mt-1 text-[12px] font-semibold text-ink3 hover:text-bad">Borrar</button>)}
              </div>
            </li>
          ))}
        </ul>
      )}
      {myUid ? (
        <div className="flex flex-col gap-2.5">
          <textarea value={txt} onChange={(e) => setTxt(e.target.value.slice(0, MAX))} rows={3} aria-label={'Comentario sobre el paso ' + (i + 1)}
            placeholder={tipo === 'correccion' ? 'Qué cambiarías en este paso y por qué (si hay una fuente, cítala)…' : 'Tu comentario sobre este paso…'}
            className={cx(inputCls, 'resize-y text-[14px]')} />
          <div className="flex flex-wrap items-center gap-2.5">
            <Seg size="sm" valor={tipo} onChange={setTipo} opciones={[{ v: 'comentario', t: 'Comentario' }, { v: 'correccion', t: 'Corrección' }]} />
            <span className="flex-1 text-right text-[11.5px] tabular-nums text-ink3">{limpio.length > MAX - 150 ? MAX - limpio.length : ''}</span>
            <Btn v="primary" sm onClick={publicar} disabled={!limpio || enviando}>{enviando ? 'Publicando…' : 'Publicar'}</Btn>
          </div>
          <p className="m-0 text-[11.5px] leading-normal text-ink3">Va con tu nombre y lo ve toda la comunidad de Criterium. Nunca escribas datos de un paciente.</p>
        </div>
      ) : <p className="m-0 text-[13px] text-ink3">Inicia sesión para comentar.</p>}
    </div>
  );
}
