// Página de muestra del sistema de diseño 2026. Solo en desarrollo: http://localhost:5173/?sistema (main.jsx).
// Muestra tokens, escala de letra, espaciado, radios, sombras y componentes base, en claro y sobre la sección oscura.
import React, { useEffect, useState } from 'react';
import { Pagina, Seccion, Rotulo, Titulo, Bajada, Icono, Boton, Insignia, Tarjeta, Campo, MarcoNavegador, MarcoTelefono, Pendiente, Revela, cx } from './base.jsx';

const ESCALAS = [
  ['Petróleo · base de marca', 'petroleo', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]],
  ['Menta · solo destaca sobre oscuro', 'menta', [100, 300, 400, 700]],
  ['Grises neutros', 'gris', [0, 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900]]
];
const SEMANTICOS = [
  ['Fondos', ['s-fondo', 's-fondo-alt', 's-hundido', 's-marca', 's-marca-2']],
  ['Bordes', ['s-borde-suave', 's-borde', 's-borde-fuerte', 's-borde-campo']],
  ['Texto', ['s-texto', 's-texto-2', 's-texto-3', 's-enlace', 's-sobre-marca-2']],
  ['Primario y destaque', ['s-primario', 's-primario-hover', 's-primario-suave', 's-foco', 's-destaque', 's-destaque-texto']],
  ['Estados', ['s-ok', 's-ok-fondo', 's-aviso', 's-aviso-fondo', 's-error', 's-error-fondo']]
];
const TIPOS = [
  ['text-s-display', 'Display', '40 → 72 px · 700 · −3,8 %', 'De la guía al box.'],
  ['text-s-h1', 'Título 1', '34 → 52 px · 700', 'Cada atención, trazable.'],
  ['text-s-h2', 'Título 2', '28 → 40 px · 700', 'Cómo funciona una cita'],
  ['text-s-h3', 'Título 3', '19 → 22 px · 600', 'Evolución con guía clínica'],
  ['text-s-lead', 'Bajada', '17 → 20 px · 400', 'Agenda, ficha, caja e inventario en un solo lugar, unidos por la guía del procedimiento.'],
  ['text-s-cuerpo', 'Cuerpo', '16 px · 400 · 1,6', 'La evolución se arma con los pasos que marcaste en la bandeja. Tú la revisas y la firmas.'],
  ['text-s-chico', 'Chico', '14 px · 400', 'Los insumos se descuentan del inventario al firmar.'],
  ['text-s-micro', 'Rótulo', '12 px · 600 · mayúsculas', 'CRITERIUM CLÍNICA']
];
const ESPACIOS = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128];

// Lee el valor real de cada token desde el CSS (así la muestra nunca queda desfasada del código)
function useToken(nombre) {
  const [v, setV] = useState('');
  useEffect(() => { setV(getComputedStyle(document.documentElement).getPropertyValue(`--${nombre}`).trim()); }, [nombre]);
  return v;
}
function Muestra({ token, alto = 'h-14', nombre }) {
  const v = useToken(token);
  return (
    <div className="min-w-0">
      <div className={cx(alto, 'rounded-campo border border-[rgba(11,31,39,.08)]')} style={{ background: `var(--${token})` }} />
      <p className="m-0 mt-1.5 truncate text-[12px] font-semibold text-s-texto" title={`--${token}`}>{nombre || `--${token}`}</p>
      <p className="m-0 truncate text-[12px] text-s-texto-3">{v.toUpperCase()}</p>
    </div>
  );
}

function Bloque({ rotulo, titulo, children, className }) {
  return (
    <div className={cx('grid gap-8 border-t border-s-borde pt-10 lg:grid-cols-[220px_minmax(0,1fr)]', className)}>
      <div><Rotulo>{rotulo}</Rotulo><Titulo nivel={2} tam={3} className="mt-2">{titulo}</Titulo></div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default function Sistema() {
  const [correo, setCorreo] = useState('');
  useEffect(() => { document.title = 'Sistema de diseño · Criterium'; try { window.criteriumListo && window.criteriumListo(); } catch (e) {} }, []);
  return (
    <div className="s-raiz min-h-screen">
      <header className="border-b border-s-borde">
        <Pagina className="flex h-16 items-center gap-3">
          <b className="text-[17px] font-bold tracking-[-.02em] text-s-texto">Criterium</b>
          <Insignia tono="neutro">Sistema de diseño 2026</Insignia>
          <span className="ml-auto hidden text-s-chico text-s-texto-3 sm:block">Solo en desarrollo · /?sistema</span>
        </Pagina>
      </header>

      <Seccion etiqueta="Presentación" className="!pb-12">
        <Rotulo>Fase 2</Rotulo>
        <Titulo nivel={1} tam="display" className="mt-3 max-w-[14ch]">Sistema de diseño de Criterium</Titulo>
        <Bajada className="mt-5">Clínico y sobrio: mucho blanco, bordes finos, un solo color de marca y la menta solo para destacar sobre oscuro. Cada par de texto y fondo cumple AA.</Bajada>
      </Seccion>

      <Pagina className="flex flex-col gap-16 pb-24">
        <Bloque rotulo="01 · Color" titulo="Primitivos">
          <div className="flex flex-col gap-8">
            {ESCALAS.map(([t, base, pasos]) => (
              <div key={base}>
                <p className="m-0 mb-3 text-s-chico font-semibold text-s-texto-2">{t}</p>
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 xl:grid-cols-12">{pasos.map((n) => <Muestra key={n} token={`${base}-${n}`} nombre={n} />)}</div>
              </div>
            ))}
          </div>
        </Bloque>

        <Bloque rotulo="02 · Color" titulo="Semánticos (los que usan los componentes)">
          <div className="flex flex-col gap-8">
            {SEMANTICOS.map(([t, toks]) => (
              <div key={t}>
                <p className="m-0 mb-3 text-s-chico font-semibold text-s-texto-2">{t}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">{toks.map((k) => <Muestra key={k} token={k} alto="h-11" nombre={k.slice(2)} />)}</div>
              </div>
            ))}
            <p className="m-0 text-s-chico text-s-texto-3">Contraste comprobado con <b className="font-semibold text-s-texto-2">npm run contraste</b>: 27 pares, todos AA (4,5:1 texto; 3:1 bordes de campo y foco).</p>
          </div>
        </Bloque>

        <Bloque rotulo="03 · Tipografía" titulo="Una sola familia, ocho tamaños">
          <p className="m-0 mb-6 text-s-chico text-s-texto-3">San Francisco en Apple; Inter en Windows y Android. Tamaños fluidos entre 390 y 1440 px. Sin tipografía monoespaciada, tampoco para números.</p>
          <div className="flex flex-col divide-y divide-s-borde-suave">
            {TIPOS.map(([cls, nom, spec, txt]) => (
              <div key={cls} className="grid gap-2 py-5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                <div><p className="m-0 text-s-chico font-semibold text-s-texto">{nom}</p><p className="m-0 text-[12px] text-s-texto-3">{spec}</p></div>
                <p className={cx('m-0 min-w-0 text-s-texto [overflow-wrap:anywhere]', cls, cls === 'text-s-micro' && 'font-semibold uppercase text-s-texto-3', ['text-s-display', 'text-s-h1', 'text-s-h2'].includes(cls) && 'font-bold', cls === 'text-s-h3' && 'font-semibold', ['text-s-lead', 'text-s-cuerpo'].includes(cls) && 'text-s-texto-2')}>{txt}</p>
              </div>
            ))}
          </div>
        </Bloque>

        <Bloque rotulo="04 · Forma" titulo="Espaciado, radios y sombras">
          <div className="grid gap-10 xl:grid-cols-2">
            <div>
              <p className="m-0 mb-3 text-s-chico font-semibold text-s-texto-2">Espaciado · base de 4 px</p>
              <div className="flex flex-col gap-2">
                {ESPACIOS.map((n) => (
                  <div key={n} className="flex items-center gap-3">
                    <span className="w-12 text-right text-[12px] text-s-texto-3">{n} px</span>
                    <span className="h-3 rounded-[3px] bg-s-primario-borde" style={{ width: Math.min(n * 2, 256) }} />
                  </div>
                ))}
              </div>
              <p className="m-0 mt-4 text-s-chico text-s-texto-3">Página de 1200 px; margen lateral 16 / 24 / 32 px; secciones de 64 a 128 px de alto.</p>
            </div>
            <div className="flex flex-col gap-8">
              <div>
                <p className="m-0 mb-3 text-s-chico font-semibold text-s-texto-2">Radios · tres, no más</p>
                <div className="grid grid-cols-3 gap-3">
                  {[['rounded-campo', 'Campo y botón', '8–10 px'], ['rounded-tarjeta', 'Tarjeta', '12 px'], ['rounded-marco', 'Marco', '20 px']].map(([c, t, v]) => (
                    <div key={c}><div className={cx('h-20 border border-s-borde-fuerte bg-s-fondo-alt', c)} /><p className="m-0 mt-1.5 text-[12px] font-semibold">{t}</p><p className="m-0 text-[12px] text-s-texto-3">{v}</p></div>
                  ))}
                </div>
              </div>
              <div>
                <p className="m-0 mb-3 text-s-chico font-semibold text-s-texto-2">Sombras · finas</p>
                <div className="grid grid-cols-3 gap-4 rounded-tarjeta bg-s-fondo-alt p-4">
                  {[['shadow-s-1', 'Botón'], ['shadow-s-2', 'Tarjeta al pasar'], ['shadow-s-3', 'Marco']].map(([c, t]) => (
                    <div key={c}><div className={cx('h-20 rounded-tarjeta bg-s-superficie', c)} /><p className="m-0 mt-2 text-[12px] font-semibold">{t}</p></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Bloque>

        <Bloque rotulo="05 · Componentes" titulo="Botones">
          <div className="flex flex-col gap-6">
            {['md', 'lg', 'sm'].map((t) => (
              <div key={t} className="flex flex-wrap items-center gap-3">
                <Boton tam={t} iconoFin="flecha">Agenda una demo</Boton>
                <Boton tam={t} variante="secundario">Ver cómo funciona</Boton>
                <Boton tam={t} variante="fantasma" iconoFin="chevron">Conocer más</Boton>
                <Boton tam={t} disabled>Desactivado</Boton>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3 rounded-tarjeta bg-s-marca p-6">
              <Boton variante="claro" iconoFin="flecha">Agenda una demo</Boton>
              <Boton variante="menta">Únete a la lista</Boton>
              <Boton variante="contorno-oscuro">Ver cómo funciona</Boton>
            </div>
            <p className="m-0 text-s-chico text-s-texto-3">Esquinas de 10 px en vez de píldora: se leen más clínicas. Alto mínimo de 44 px en md y lg (dedo en el celular).</p>
          </div>
        </Bloque>

        <Bloque rotulo="06 · Componentes" titulo="Insignias">
          <div className="flex flex-wrap gap-2.5">
            <Insignia tono="aviso" punto>Borrador · sin revisión de especialista</Insignia>
            <Insignia tono="neutro">Demo · datos ficticios</Insignia>
            <Insignia tono="primario">Guía clínica</Insignia>
            <Insignia tono="ok" punto>Atendida</Insignia>
            <Insignia tono="error" punto>Stock bajo</Insignia>
            <span className="inline-flex rounded-campo bg-s-marca px-3 py-2"><Insignia tono="oscuro">Paso 3 de 9</Insignia></span>
          </div>
        </Bloque>

        <Bloque rotulo="07 · Componentes" titulo="Campos de formulario">
          <form className="grid max-w-[640px] gap-5 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()} noValidate>
            <Campo id="m-nombre" etiqueta="Nombre de la clínica" placeholder="Nombre de tu clínica" />
            <Campo id="m-correo" etiqueta="Correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="nombre@clinica.cl"
              error={correo && !/^\S+@\S+\.\S+$/.test(correo) ? 'Revisa el correo: falta algo.' : undefined} ayuda="Te escribimos solo para coordinar la demo." />
            <Campo id="m-sillones" etiqueta="Sillones" como="select" defaultValue="">
              <option value="" disabled>Elige</option><option>1 a 2</option><option>3 a 5</option><option>6 o más</option>
            </Campo>
            <Campo id="m-error" etiqueta="Teléfono" opcional defaultValue="12" error="Ese número está incompleto." />
            <Campo id="m-mensaje" etiqueta="¿Qué te gustaría ver?" como="textarea" opcional className="sm:col-span-2" />
          </form>
          <p className="m-0 mt-4 text-s-chico text-s-texto-3">Escribe un correo incompleto en «Correo» para ver el error. Letra de 16 px en los campos: el iPhone no hace zoom al tocarlos.</p>
        </Bloque>

        <Bloque rotulo="08 · Componentes" titulo="Tarjetas e íconos">
          <div className="grid gap-4 md:grid-cols-3">
            {[['calendario', 'Agenda', 'Por profesional o por box, con la guía del procedimiento en cada cita.'],
              ['evolucion', 'Evolución con guía', 'Se arma con los pasos marcados. Tú la revisas y la firmas.'],
              ['insumos', 'Inventario', 'Lo que se usó en la atención se descuenta al firmar.']].map(([ic, t, x], k) => (
              <Revela key={t} retraso={k * 80}>
                <Tarjeta interactiva className="h-full">
                  <span className="grid h-10 w-10 place-items-center rounded-campo bg-s-primario-suave text-s-primario"><Icono n={ic} /></span>
                  <Titulo nivel={3} className="mt-4">{t}</Titulo>
                  <p className="m-0 mt-1.5 text-s-chico text-s-texto-2">{x}</p>
                </Tarjeta>
              </Revela>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-5 gap-3 sm:grid-cols-8 xl:grid-cols-12">
            {['calendario', 'bandeja', 'evolucion', 'insumos', 'lote', 'caja', 'ficha', 'libro', 'calculadora', 'personas', 'escudo', 'candado', 'clinica', 'birrete', 'fuente', 'revision', 'diente', 'check', 'flecha', 'mas'].map((n) => (
              <div key={n} className="flex flex-col items-center gap-1.5 rounded-campo border border-s-borde-suave py-3 text-s-texto-2" title={n}>
                <Icono n={n} s={22} /><span className="text-[10.5px] text-s-texto-3">{n}</span>
              </div>
            ))}
          </div>
        </Bloque>

        <Bloque rotulo="09 · Componentes" titulo="Marcos de dispositivo">
          <div className="grid items-end gap-8 md:grid-cols-[minmax(0,1fr)_200px]">
            <MarcoNavegador><Pendiente className="absolute inset-4 min-h-0">Captura de la demo de Criterium Clínica (datos ficticios) · fase 4</Pendiente></MarcoNavegador>
            <MarcoTelefono className="mx-auto w-[200px]"><Pendiente className="absolute inset-3 top-10 min-h-0 text-[12px]">Captura en celular · fase 4</Pendiente></MarcoTelefono>
          </div>
          <p className="m-0 mt-4 text-s-chico text-s-texto-3">La captura se ve completa dentro del marco (object-contain), con su alto reservado para que la página no salte al cargar.</p>
        </Bloque>

        <Bloque rotulo="10 · Componentes" titulo="Espacio pendiente">
          <Pendiente>Testimonio de una clínica real, con su permiso. Hasta tenerlo, este espacio no se rellena.</Pendiente>
        </Bloque>
      </Pagina>

      <Seccion tono="oscuro" etiqueta="Sección oscura">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <Rotulo>Sección oscura</Rotulo>
            <Titulo nivel={2} className="mt-3">Petróleo profundo, menta solo para lo que importa.</Titulo>
            <Bajada className="mt-4">Se usa una o dos veces por página, para el momento clave. El texto secundario usa --s-sobre-marca-2.</Bajada>
            <div className="mt-8 flex flex-wrap gap-3"><Boton variante="menta" iconoFin="flecha">Agenda una demo</Boton><Boton variante="contorno-oscuro">Ver cómo funciona</Boton></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['calendario', 'Cita'], ['bandeja', 'Bandeja'], ['evolucion', 'Evolución'], ['caja', 'Caja']].map(([ic, t]) => (
              <Tarjeta key={t} oscura className="p-5"><Icono n={ic} className="text-s-destaque" /><p className="m-0 mt-3 font-semibold">{t}</p></Tarjeta>
            ))}
          </div>
        </div>
      </Seccion>
    </div>
  );
}
