// Portada pública de Criterium (fase 4 del rediseño, 2026-10-11). Le habla primero a la administración de una clínica y,
// en un segundo camino, a estudiantes y docentes. Sistema de diseño 2026 (base.jsx); capturas reales de la demo con datos
// ficticios en public/portada/ (npm run capturas:portada).
// Reglas del contenido: nada inventado (sin testimonios, cifras ni logos de clientes: [PENDIENTE]), sin nombres de
// universidades, sin prometer cumplimiento legal, guías y calculadoras dichas como borrador. Solo depende de React:
// main.jsx la muestra sin cargar Firebase a quien no tiene sesión.
import React, { useState } from 'react';
import { Pagina, Seccion, Rotulo, Titulo, Bajada, Icono, Boton, Insignia, Tarjeta, MarcoNavegador, MarcoTelefono, Pendiente, Revela, Logo, cx } from './base.jsx';
import { Cadena } from './cadena.jsx';
import { FormularioInteres, WHATSAPP } from './interes.jsx';

const img = (n) => ({ src: `/portada/${n}-1x.webp`, srcSet: `/portada/${n}-1x.webp 1x, /portada/${n}-2x.webp 2x` });
const quieto = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
// Los enlaces internos se mueven con scroll (sin tocar la URL: el «#» lo usa la app para abrir procedimientos y perfiles)
const ir = (id) => (e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: quieto() ? 'auto' : 'smooth', block: 'start' }); };

const NAV = [['clinica', 'Clínica'], ['universidad', 'Universidad'], ['evidencia', 'Evidencia'], ['preguntas', 'Preguntas']];

const PUNTO_A = [
  'La agenda en un sistema, la ficha en otro y la caja en una planilla.',
  'El inventario se cuenta a mano y se nota que algo falta cuando ya falta.',
  'La evolución se escribe de memoria, al final del día.',
  'El lote del autoclave queda anotado en un cuaderno.',
  'Si te fiscalizan, juntar todo puede tomar horas.'
];
const PUNTO_B = [
  'Un solo sistema, de la cita al cobro.',
  'La evolución se arma con los pasos de la guía. Tú la revisas y la firmas.',
  'Lo que se usó en la atención se descuenta del inventario al firmar.',
  'El lote de esterilización queda escrito en la evolución.',
  'Cada atención es trazable: quién, qué, con qué y cuándo.'
];

const CLINICA = [
  ['calendario', 'Agenda', 'Por profesional, por box o por semana. Confirmaciones por WhatsApp con el mensaje listo.'],
  ['ficha', 'Ficha clínica', 'Anamnesis, alertas médicas a la vista, odontograma y evoluciones firmadas que no se editan.'],
  ['evolucion', 'Evolución con guía', 'Pasos, insumos y lote de esterilización en un solo registro.'],
  ['caja', 'Presupuestos y caja', 'Presupuesto por pieza, abonos, saldos y cierre del día por medio de pago.'],
  ['insumos', 'Inventario', 'Entradas, salidas y aviso cuando un insumo queda bajo el mínimo.'],
  ['lote', 'Esterilización y laboratorio', 'Ciclos por autoclave con su lote. Órdenes de laboratorio con su fecha de entrega.'],
  ['personas', 'Equipo y permisos', 'Roles para administración, odontólogos, recepción y asistentes. Recepción no ve lo clínico.'],
  ['revision', 'Informes', 'Lo atendido, lo cobrado y los honorarios de cada profesional.']
];
const GALERIA_CLINICA = [
  ['clinica-agenda', 'Agenda', 'Agenda semanal de la clínica de ejemplo, con las citas de cada profesional en su color.'],
  ['clinica-evolucion', 'Evolución con guía', 'Evolución con guía clínica: los pasos de la resina marcados como hechos y el lote del autoclave elegido.'],
  ['clinica-ficha', 'Ficha y odontograma', 'Ficha de una paciente ficticia con su odontograma.'],
  ['clinica-caja', 'Caja', 'Caja: presupuestos con su saldo pendiente y los últimos pagos por medio de pago.']
];

const UNIVERSIDAD = [
  ['fuente', 'Guías paso a paso', 'Qué hacer, cuándo terminaste y por qué, con el grado de evidencia. Con voz, para usarla en el box.'],
  ['evolucion', 'PDF de box', 'Una hoja para llevar al box, con la bandeja y los pasos que no te puedes saltar.'],
  ['libro', 'Materia', 'Clases interactivas por ramo. Cada afirmación lleva su fuente.'],
  ['calculadora', 'Calculadoras', 'Estadio y grado periodontal, step-back de endodoncia y dosis máxima de anestesia, con el resultado dibujado.'],
  ['personas', 'Comunidad', 'Casos clínicos revisados por docentes, discusión de planes de tratamiento y chat.']
];
const GALERIA_U = [
  ['universidad-materia', 'Materia', 'Clase interactiva de Materia sobre oclusión en prótesis total, con sus fuentes.'],
  ['universidad-herramientas', 'Calculadoras', 'Calculadora de estadio y grado periodontal con el resultado dibujado.']
];

const REVISION = [
  ['Borrador con fuentes', 'Cada paso lleva su fuente verificada: PubMed, revista o documento oficial. Lo que no tiene estudio se marca como práctica habitual.'],
  ['Primera ronda', 'Un panel de 5 especialistas del área puntúa cada paso en pertinencia, claridad y respaldo.'],
  ['Correcciones', 'El autor corrige lo que pidió el panel y explica qué cambió.'],
  ['Segunda ronda', 'Un paso se aprueba si al menos el 80 % del panel le pone 4 o 5.'],
  ['Publicación', 'Se publica con su versión, su fecha y una huella digital: sabes qué versión estás leyendo.']
];

const HOY = [
  'Cuentas personales con correo y contraseña.',
  'Datos en Google Firebase, con reglas de acceso por rol que se prueban de forma automática.',
  'Cada rol ve solo lo suyo: recepción no ve lo clínico.',
  'Evoluciones, documentos y pagos no se editan ni se borran después de firmados.',
  'Queda registrado quién abrió cada ficha.'
];
const FALTA = [
  'Hoy Criterium funciona solo con datos ficticios.',
  'Antes de usarlo con pacientes reales: revisión legal de la ficha clínica (Ley 20.584 y su reglamento) y de la protección de datos (Ley 21.719).',
  'Un acuerdo de tratamiento de datos con cada clínica.'
];

const EQUIPO = [
  ['SE', 'Sebastián Escobar Prieto', 'Co-fundador · Estudiante de Odontología'],
  ['JB', 'Jorge Baeza', 'Co-fundador · Odontología'],
  ['VF', 'Vicente Fones', 'Ingeniería']
];

const PREGUNTAS = [
  ['¿Puedo usar Criterium Clínica con pacientes reales hoy?', 'Todavía no. Hoy es una demostración con datos ficticios. Antes falta la revisión legal y un acuerdo de tratamiento de datos con cada clínica.'],
  ['¿Las guías clínicas están validadas?', 'Todavía no. Están en borrador. Cada una pasa por un panel de especialistas, en dos rondas, antes de publicarse. Lo publicado muestra su versión y su fecha.'],
  ['¿Cuánto cuesta?', 'Estamos definiendo los planes. Si pides una demo o te unes a la lista de espera, te avisamos primero.'],
  ['¿Funciona en el celular?', 'Sí. Funciona en el navegador del computador, la tablet y el celular, y se puede instalar como app.'],
  ['¿Reemplaza el criterio del profesional o del docente?', 'No. Es una guía de procedimiento, no un protocolo rígido. El criterio de cada profesional sigue siendo clave.'],
  ['¿Hay publicidad de marcas?', 'No. Ninguna marca paga por aparecer en Criterium.']
];

/* ── Piezas ── */
function Lista({ items, tono = 'ok' }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((x) => (
        <li key={x} className="flex gap-3 text-s-cuerpo text-s-texto-2">
          <span className={cx('mt-[3px] grid h-5 w-5 flex-none place-items-center rounded-full', tono === 'ok' ? 'bg-s-ok-fondo text-s-ok' : 'bg-s-hundido text-s-texto-3')}>
            <Icono n={tono === 'ok' ? 'check' : 'mas'} s={12} grosor={2.2} className={tono === 'ok' ? '' : 'rotate-45'} />
          </span>
          {x}
        </li>
      ))}
    </ul>
  );
}

function Rasgos({ items, cols = 'lg:grid-cols-4' }) {
  return (
    <div className={cx('grid gap-x-8 gap-y-8 sm:grid-cols-2', cols)}>
      {items.map(([ic, t, x], k) => (
        <Revela key={t} retraso={(k % 4) * 60}>
          <span className="grid h-10 w-10 place-items-center rounded-campo bg-s-primario-suave text-s-primario"><Icono n={ic} /></span>
          <h3 className="m-0 mt-4 text-[17px] font-semibold leading-snug">{t}</h3>
          <p className="m-0 mt-1 text-s-chico text-s-texto-2">{x}</p>
        </Revela>
      ))}
    </div>
  );
}

// Capturas con pestañas: cada una completa dentro del marco
function Galeria({ items, direccion, etiqueta }) {
  const [i, setI] = useState(0);
  return (
    <div>
      <div role="tablist" aria-label={etiqueta} className="mb-4 flex flex-wrap gap-1.5">
        {items.map(([n, t], k) => (
          <button key={n} type="button" role="tab" id={`tab-${n}`} aria-selected={k === i} aria-controls={`panel-${n}`} onClick={() => setI(k)}
            className={cx('h-9 rounded-campo px-3.5 text-[14px] font-semibold transition-colors', k === i ? 'bg-s-texto text-s-fondo' : 'text-s-texto-2 hover:bg-s-hundido')}>{t}</button>
        ))}
      </div>
      {items.map(([n, , alt], k) => (
        <div key={n} role="tabpanel" id={`panel-${n}`} aria-labelledby={`tab-${n}`} hidden={k !== i}>
          <MarcoNavegador {...img(n)} alt={alt} direccion={direccion} />
        </div>
      ))}
    </div>
  );
}

function PieDemo({ className }) {
  return <p className={cx('m-0 flex flex-wrap items-center justify-center gap-2 text-s-chico text-s-texto-3', className)}><Insignia tono="neutro">Demo · datos ficticios</Insignia>Capturas reales de Criterium.</p>;
}

/* ── Portada ── */
// entrar(pantalla): 'login' | 'registro' | 'privacidad'. privacidad(): abre Privacidad y términos. precargar(): baja la app antes del clic.
export function Portada({ entrar, privacidad, precargar }) {
  const [form, setForm] = useState(null); // 'demo' | 'lista' | null
  const invitado = (() => { try { return !!sessionStorage.getItem('criterium-invita'); } catch (e) { return false; } })();
  const anio = new Date().getFullYear();
  const alEntrar = { onPointerEnter: precargar, onFocus: precargar, onTouchStart: precargar };

  return (
    <div className="s-raiz min-h-screen">
      <a href="#contenido" onClick={ir('contenido')} className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-campo focus:bg-s-fondo focus:px-4 focus:py-2 focus:shadow-s-2">Saltar al contenido</a>

      {/* Barra */}
      <header className="sticky top-0 z-40 border-b border-s-borde-suave bg-[color-mix(in_srgb,var(--s-fondo)_85%,transparent)] backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Pagina className="flex h-16 items-center gap-2">
          <a href="#contenido" onClick={ir('contenido')} aria-label="Criterium, ir al inicio" className="mr-auto rounded-campo lg:mr-0"><Logo alto={24} /></a>
          <nav aria-label="Secciones" className="mx-auto hidden items-center gap-1 lg:flex">
            {NAV.map(([id, t]) => <a key={id} href={`#${id}`} onClick={ir(id)} className="rounded-campo px-3 py-2 text-[14.5px] font-medium text-s-texto-2 no-underline hover:bg-s-hundido hover:text-s-texto">{t}</a>)}
          </nav>
          <Boton variante="fantasma" tam="sm" onClick={() => entrar('login')} {...alEntrar}>Entrar</Boton>
          <Boton tam="sm" onClick={() => setForm('demo')}><span className="sm:hidden">Demo</span><span className="hidden sm:inline">Agenda una demo</span></Boton>
        </Pagina>
      </header>

      <main id="contenido">
        {/* 1 · Portada */}
        <section aria-labelledby="titulo" className="overflow-hidden pb-16 pt-14 sm:pb-24 sm:pt-20">
          <Pagina className="flex flex-col items-center text-center">
            {invitado && <p className="m-0 mb-6"><Insignia tono="primario"><Icono n="personas" s={14} />Te invitaron a Criterium</Insignia></p>}
            <Rotulo>Software dental con guías clínicas</Rotulo>
            <Titulo nivel={1} id="titulo" tam="display" className="mt-4 max-w-[12ch]">Cada paso, con criterio.</Titulo>
            <Bajada className="mt-6 max-w-[40rem]">Agenda, ficha, caja e inventario en un solo sistema, unidos por guías clínicas con su evidencia. De la cita a la caja, todo queda conectado.</Bajada>

            <div className="mt-10 grid w-full max-w-[880px] gap-3 text-left sm:grid-cols-2 sm:gap-4">
              {[['clinica', 'clinica', 'Soy clínica', 'Agenda, ficha, evolución, caja, inventario y esterilización en un solo lugar.', 'Ver Criterium Clínica'],
                ['universidad', 'birrete', 'Soy estudiante o docente', 'Guías paso a paso con su evidencia, materia y calculadoras para el box.', 'Ver Criterium Universidad']].map(([id, ic, t, x, cta], k) => (
                <a key={id} href={`#${id}`} onClick={ir(id)} className={cx('group flex flex-col rounded-tarjeta border p-6 no-underline transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-s-2 sm:p-7',
                  k === 0 ? 'border-s-marca bg-s-marca text-s-sobre-marca' : 'border-s-borde bg-s-superficie text-s-texto hover:border-s-borde-fuerte')}>
                  <span className={cx('grid h-11 w-11 place-items-center rounded-campo', k === 0 ? 'bg-s-marca-2 text-s-destaque' : 'bg-s-primario-suave text-s-primario')}><Icono n={ic} s={22} /></span>
                  <span className="mt-5 text-s-h3 font-semibold">{t}</span>
                  <span className={cx('mt-1.5 text-s-chico', k === 0 ? 'text-s-sobre-marca-2' : 'text-s-texto-2')}>{x}</span>
                  <span className={cx('mt-5 inline-flex items-center gap-1.5 text-[15px] font-semibold', k === 0 ? 'text-s-destaque' : 'text-s-enlace')}>{cta}<Icono n="flecha" s={16} className="transition-transform duration-200 group-hover:translate-x-0.5" /></span>
                </a>
              ))}
            </div>
          </Pagina>

          <Pagina className="relative mt-14 sm:mt-20">
            <div className="relative mx-auto max-w-[1100px]">
              <MarcoNavegador {...img('clinica-agenda')} prioridad alt="Agenda semanal de Criterium Clínica con las citas de la clínica de ejemplo, cada profesional en su color." />
              <MarcoTelefono {...img('universidad-paso-celular')} className="absolute -bottom-10 -right-2 hidden w-[200px] md:block xl:-right-10 xl:w-[230px]" alt="Un paso de un procedimiento en el celular: qué hacer y cuándo terminaste." />
            </div>
            <PieDemo className="mt-6 md:mt-14" />
          </Pagina>
        </section>

        {/* 2 · Problema → solución */}
        <Seccion id="problema" tono="gris" etiqueta="El problema y la solución">
          <div className="max-w-[44rem]">
            <Rotulo>El problema</Rotulo>
            <Titulo className="mt-3">Hoy la atención queda repartida en varios lugares.</Titulo>
            <Bajada className="mt-4">Criterium la junta en uno, y la guía del procedimiento hace que cada paso deje su registro.</Bajada>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <Revela><Tarjeta className="h-full p-7 sm:p-8"><p className="m-0 text-s-chico font-semibold text-s-texto-3">Hoy</p><h3 className="m-0 mb-6 mt-1 text-s-h3 font-semibold">Todo separado, mucho a mano</h3><Lista items={PUNTO_A} tono="no" /></Tarjeta></Revela>
            <Revela retraso={80}><Tarjeta className="h-full border-s-primario-borde p-7 sm:p-8"><p className="m-0 text-s-chico font-semibold text-s-enlace">Con Criterium</p><h3 className="m-0 mb-6 mt-1 text-s-h3 font-semibold">Un sistema, cada atención trazable</h3><Lista items={PUNTO_B} /></Tarjeta></Revela>
          </div>
        </Seccion>

        {/* 3 · Cómo funciona */}
        <Seccion id="como-funciona" tono="oscuro" etiqueta="Cómo funciona">
          <div className="max-w-[44rem]">
            <Rotulo>Cómo funciona</Rotulo>
            <Titulo className="mt-3">Una guía recorre toda la atención.</Titulo>
            <Bajada className="mt-4">La guía del procedimiento une cada etapa con la siguiente. Nada se escribe dos veces.</Bajada>
          </div>
          <div className="mt-14"><Cadena /></div>
          <Revela className="mx-auto mt-16 max-w-[1000px]">
            <MarcoNavegador {...img('clinica-evolucion')} alt="Evolución con guía clínica: los pasos de la resina marcados como hechos y el lote del autoclave elegido." />
            <p className="m-0 mt-5 text-center text-s-chico text-s-sobre-marca-2">La evolución con guía: pasos, insumos y lote, en un solo registro firmado. Datos ficticios.</p>
          </Revela>
        </Seccion>

        {/* 4 · Criterium Clínica */}
        <Seccion id="clinica" etiqueta="Criterium Clínica">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-[44rem]">
              <Rotulo>Criterium Clínica</Rotulo>
              <Titulo className="mt-3">Orden y control en cada atención.</Titulo>
              <Bajada className="mt-4">Para clínicas dentales que quieren todo en un lugar y cada atención registrada, de la cita al cobro.</Bajada>
            </div>
            <Boton tam="lg" iconoFin="flecha" onClick={() => setForm('demo')} className="justify-self-start">Agenda una demo</Boton>
          </div>
          <div className="mt-12"><Galeria items={GALERIA_CLINICA} etiqueta="Pantallas de Criterium Clínica" /></div>
          <PieDemo className="mt-5" />
          <div className="mt-16"><Rasgos items={CLINICA} /></div>
          <div className="mt-16 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Pendiente className="min-h-[160px]">Testimonio de la primera clínica que use Criterium, con su nombre y su permiso. Hasta tenerlo, este espacio no se rellena.</Pendiente>
            <div className="flex flex-col justify-center rounded-tarjeta bg-s-fondo-alt p-7">
              <h3 className="m-0 text-s-h3 font-semibold">Te la mostramos en una videollamada.</h3>
              <p className="m-0 mt-2 text-s-chico text-s-texto-2">Con la clínica de ejemplo y datos ficticios. Antes de usarla con pacientes reales falta la revisión legal: te contamos en qué va.</p>
              <div className="mt-5 flex flex-wrap gap-3"><Boton iconoFin="flecha" onClick={() => setForm('demo')}>Agenda una demo</Boton><Boton variante="secundario" href={WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp</Boton></div>
            </div>
          </div>
        </Seccion>

        {/* 5 · Criterium Universidad */}
        <Seccion id="universidad" tono="gris" etiqueta="Criterium Universidad">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-[44rem]">
              <Rotulo>Criterium Universidad</Rotulo>
              <Titulo className="mt-3">En el box, la respuesta con su fuente.</Titulo>
              <Bajada className="mt-4">Para estudiantes y docentes de Odontología. Guías paso a paso que dicen de dónde sale cada indicación, en vez de respuestas de una IA general sin revisar.</Bajada>
            </div>
            <Boton tam="lg" iconoFin="flecha" onClick={() => setForm('lista')} className="justify-self-start">Únete a la lista de espera</Boton>
          </div>
          <div className="mt-12 grid items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
            <Revela><MarcoTelefono {...img('universidad-paso-celular')} className="mx-auto w-[240px] lg:w-full" alt="Paso 3 de un procedimiento en el celular, en modo guiado: qué hacer y cuándo terminaste." /></Revela>
            <Revela retraso={80}><Galeria items={GALERIA_U} direccion="criterium · universidad" etiqueta="Pantallas de Criterium Universidad" /></Revela>
          </div>
          <p className="m-0 mt-6 flex flex-wrap items-center gap-2 text-s-chico text-s-texto-3"><Insignia tono="aviso" punto>Borrador</Insignia>Las guías y las calculadoras todavía no tienen revisión de especialistas.</p>
          <div className="mt-14"><Rasgos items={UNIVERSIDAD} cols="lg:grid-cols-5" /></div>
        </Seccion>

        {/* 6 · Evidencia y revisores */}
        <Seccion id="evidencia" etiqueta="Evidencia y revisores">
          <div className="max-w-[44rem]">
            <Rotulo>Evidencia y revisores</Rotulo>
            <Titulo className="mt-3">Nada se publica sin pasar por especialistas.</Titulo>
            <Bajada className="mt-4">Así se revisa cada guía antes de llegar a tu box.</Bajada>
          </div>
          <ol className="m-0 mt-12 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-5">
            {REVISION.map(([t, x], k) => (
              <Revela key={t} como="li" retraso={k * 70} className="flex flex-col rounded-tarjeta border border-s-borde p-6">
                <span className="text-[13px] font-semibold text-s-enlace">Paso {k + 1}</span>
                <h3 className="m-0 mt-2 text-[17px] font-semibold">{t}</h3>
                <p className="m-0 mt-1.5 text-s-chico text-s-texto-2">{x}</p>
              </Revela>
            ))}
          </ol>
          <div className="mt-10 grid gap-x-8 gap-y-4 border-t border-s-borde pt-8 sm:grid-cols-3">
            {[['fuente', 'Cada afirmación con su fuente'], ['revision', 'Lo que está en discusión, se dice'], ['escudo', 'Sin publicidad de marcas']].map(([ic, t]) => (
              <p key={t} className="m-0 flex items-center gap-3 font-semibold"><span className="text-s-primario"><Icono n={ic} /></span>{t}</p>
            ))}
          </div>
          <p className="m-0 mt-8 flex flex-wrap items-center gap-2 text-s-chico text-s-texto-3"><Insignia tono="aviso" punto>Hoy</Insignia>Todas las guías están en borrador, esperando a su panel.</p>
        </Seccion>

        {/* 7 · El puente */}
        <Seccion id="puente" tono="gris" etiqueta="De estudiante a clínica">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Rotulo>El puente</Rotulo>
              <Titulo className="mt-3">Aprendes con una guía. Atiendes con la misma.</Titulo>
              <Bajada className="mt-4">Estudias con Criterium Universidad. Al titularte, llevas las mismas guías a tu clínica: lo que aprendiste es lo que usas en la atención.</Bajada>
            </div>
            <Revela className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
              <Tarjeta className="p-5">
                <p className="m-0 flex items-center gap-2 text-s-chico font-semibold text-s-texto-3"><Icono n="birrete" s={16} />Universidad</p>
                <div className="mt-4 rounded-campo bg-s-marca p-4 text-s-sobre-marca">
                  <p className="m-0 text-[12px] font-semibold text-s-destaque">Paso 3 · en el box</p>
                  <p className="m-0 mt-1 text-[15px] font-semibold leading-snug">Limpia la cara oclusal</p>
                  <p className="m-0 mt-2 text-[12.5px] text-s-sobre-marca-2"><b className="font-semibold text-s-destaque">Terminaste cuando</b> no se ve placa al secar.</p>
                </div>
              </Tarjeta>
              <span className="mx-auto grid h-10 w-10 rotate-90 place-items-center rounded-full bg-s-superficie text-s-primario shadow-s-1 sm:rotate-0"><Icono n="flecha" /></span>
              <Tarjeta className="p-5">
                <p className="m-0 flex items-center gap-2 text-s-chico font-semibold text-s-texto-3"><Icono n="clinica" s={16} />Clínica</p>
                <div className="mt-4 flex items-center gap-3 rounded-campo border border-s-borde p-4">
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-s-ok-fondo text-s-ok"><Icono n="check" s={13} grosor={2.4} /></span>
                  <span className="min-w-0"><b className="block text-[14px] font-semibold leading-snug">3 · Limpia la cara oclusal</b><span className="block text-[12.5px] text-s-texto-3">Hecho · en la evolución</span></span>
                </div>
              </Tarjeta>
            </Revela>
          </div>
        </Seccion>

        {/* 8 · Seguridad */}
        <Seccion id="seguridad" etiqueta="Seguridad de datos">
          <div className="max-w-[44rem]">
            <Rotulo>Seguridad de datos</Rotulo>
            <Titulo className="mt-3">Lo que hacemos hoy, dicho con honestidad.</Titulo>
            <Bajada className="mt-4">Los datos de salud son sensibles. No prometemos cumplimiento legal hasta tener la revisión que falta.</Bajada>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <Revela><Tarjeta className="h-full p-7 sm:p-8"><h3 className="m-0 mb-6 flex items-center gap-2.5 text-s-h3 font-semibold"><span className="text-s-ok"><Icono n="escudo" /></span>Lo que ya está</h3><Lista items={HOY} /></Tarjeta></Revela>
            <Revela retraso={80}><Tarjeta className="h-full border-s-aviso-fondo bg-[color-mix(in_srgb,var(--s-aviso-fondo)_45%,var(--s-fondo))] p-7 sm:p-8"><h3 className="m-0 mb-6 flex items-center gap-2.5 text-s-h3 font-semibold"><span className="text-s-aviso"><Icono n="candado" /></span>Lo que falta</h3><Lista items={FALTA} tono="no" /></Tarjeta></Revela>
          </div>
        </Seccion>

        {/* 9 · Nosotros */}
        <Seccion id="nosotros" tono="gris" etiqueta="Nosotros">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <Rotulo>Nosotros</Rotulo>
              <Titulo tam={3} className="mt-3 text-[clamp(1.375rem,1.2rem+.7vw,1.75rem)] font-bold">Nació en el box.</Titulo>
              <p className="m-0 mt-4 max-w-[36rem] text-s-cuerpo text-s-texto-2">Sebastián, estudiante de 5.º año de Odontología en Chile, vivió en el box la falta de guías claras y que cada docente indicara algo distinto. De ahí sale Criterium: que cada paciente reciba una atención basada en evidencia, con rigor clínico y simpleza.</p>
            </div>
            <ul className="m-0 flex list-none flex-col gap-3 self-center p-0">
              {EQUIPO.map(([ini, n, r]) => (
                <li key={n} className="flex items-center gap-4 rounded-tarjeta border border-s-borde bg-s-superficie px-5 py-4">
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-s-primario-suave text-[13px] font-semibold text-s-enlace" aria-hidden="true">{ini}</span>
                  <span><b className="block font-semibold">{n}</b><span className="block text-s-chico text-s-texto-3">{r}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </Seccion>

        {/* 10 · Preguntas */}
        <Seccion id="preguntas" etiqueta="Preguntas frecuentes">
          <div className="grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16">
            <div>
              <Rotulo>Preguntas frecuentes</Rotulo>
              <Titulo className="mt-3">Lo que más nos preguntan.</Titulo>
              <p className="m-0 mt-4 text-s-chico text-s-texto-2">¿Otra duda? <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="font-semibold text-s-enlace">Escríbenos por WhatsApp</a>.</p>
            </div>
            <div className="divide-y divide-s-borde border-y border-s-borde">
              {PREGUNTAS.map(([q, a]) => (
                <details key={q} className="group">
                  <summary className="flex items-center gap-4 py-5 text-[17px] font-semibold leading-snug">
                    <span className="flex-1">{q}</span>
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-full border border-s-borde text-s-texto-2 transition-transform duration-200 group-open:rotate-45"><Icono n="mas" s={16} /></span>
                  </summary>
                  <p className="m-0 max-w-[40rem] pb-6 pr-12 text-s-cuerpo text-s-texto-2">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </Seccion>

        {/* Cierre */}
        <section aria-label="Empieza" className="s-oscuro bg-s-marca py-16 text-s-sobre-marca sm:py-20">
          <Pagina className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <Logo alto={30} oscuro />
              <p className="m-0 mt-4 text-s-h2 font-bold">Cada paso, con criterio.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Boton variante="menta" tam="lg" iconoFin="flecha" onClick={() => setForm('demo')}>Agenda una demo</Boton>
              <Boton variante="contorno-oscuro" tam="lg" onClick={() => setForm('lista')}>Lista de espera</Boton>
            </div>
          </Pagina>
        </section>
      </main>

      <footer className="border-t border-s-borde bg-s-fondo">
        <Pagina className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center">
          <p className="m-0 text-s-chico text-s-texto-3">© {anio} Criterium · Prototipo con datos ficticios.</p>
          <nav aria-label="Pie de página" className="flex flex-wrap gap-x-6 gap-y-2 text-s-chico font-semibold sm:ml-auto">
            <button type="button" onClick={privacidad} className="text-s-texto-2 hover:text-s-texto">Privacidad y términos</button>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="text-s-texto-2 no-underline hover:text-s-texto">Contacto</a>
            <button type="button" onClick={() => entrar('login')} {...alEntrar} className="text-s-texto-2 hover:text-s-texto">Entrar</button>
          </nav>
        </Pagina>
      </footer>

      <FormularioInteres tipo={form} cerrar={() => setForm(null)} privacidad={() => { setForm(null); privacidad(); }} />
    </div>
  );
}
