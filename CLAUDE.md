# CLAUDE.md — Criterium

Contexto para Claude Code. Léelo entero antes de tocar el código.

## Qué es

Criterium es una app web para dentistas y estudiantes de Odontología. Tiene tres partes:

1. **Biblioteca de protocolos** con la evidencia a la vista: cada paso dice qué hacer, cuándo está terminado, por qué, y con qué grado de evidencia. Lo que no tiene respaldo se marca como "sin evidencia" y lo que está en discusión como "en disputa".
2. **Mis casos**: el clínico registra sus casos (sin identificar al paciente), sube fotos y radiografías, marca cómo siguió cada paso del protocolo y agenda controles.
3. **Revisión por pares**: un revisor puntúa el caso (pertinencia, claridad, suficiencia de la evidencia, de 1 a 5) y lo aprueba, pide cambios o lo deniega, siempre con justificación.

Además: calculadoras clínicas (periodoncia 2018, step-back de endodoncia, dosis máxima de lidocaína), un feed de preguntas, postulación a revisor y contacto.

Estado: **prototipo con backend Firebase**. Autenticación con email/contraseña, datos en Firestore, fotos en Firebase Storage. Al registrarse, los datos locales se migran automáticamente.

## Cómo correrlo

```bash
npm install
npm run dev      # desarrollo en http://localhost:5173
npm run build    # genera dist/
npm run preview  # sirve dist/
```

Stack: React 18 + Vite 5 + Tailwind CSS 3 + Firebase (Auth, Firestore, Storage). Sin TypeScript, sin router, sin librería de estado.

```bash
npm run pdfs       # regenera los PDF de box desde data.js (scripts/pdfs.mjs, usa el Chrome instalado)
npm run voces      # genera los audios de voz natural con Google Cloud Text-to-Speech (docs/VOCES_GOOGLE_TTS.md)
npm run deploy     # publica el sitio en https://criterium-e5d90.web.app (Firebase Hosting)
npm run ios:sync   # compila y copia la web al proyecto de iOS (ios/, Capacitor 7 con SPM)
npm run ios        # lo anterior + abre el proyecto en Xcode
```

**App instalable y de iOS.** La web es instalable como app (`public/manifest.webmanifest`, íconos en `public/icons/`). La app de iOS es la misma web envuelta con Capacitor (`capacitor.config.json`, id `cl.criterium.app`, carpeta `ios/`). Dentro de la app nativa Firebase Auth se inicializa con `initializeAuth` + IndexedDB (ver `firebase.js`). El reconocimiento de voz no existe en el WebView de iOS: ahí el botón de voz no aparece (la lectura en voz alta sí funciona). Capacitor 8 pide Node 22; con Node 20 se usa la 7. `cap add ios` con SPM exige CocoaPods por un error de la CLI: si hay que regenerar `ios/`, usar `CAPACITOR_COCOAPODS_PATH=/usr/bin/true npx cap add ios --packagemanager SPM`.

## Estructura

```
src/
  main.jsx            monta <App />
  App.jsx             AuthGate + layout + estado global + acciones (usa Firestore)
  ctx.js              contexto de React (useApp)
  firebase.js         inicialización de Firebase (Auth, Firestore, Storage)
  auth.js             registro, login, logout, useUsuario, errorAuth
  db.js               hooks y operaciones de Firestore/Storage (casos, feed, fotos, migración)
  ui.jsx              componentes base: Btn, Pill, Field, Seg, Modal, Foto, Lightbox, Chequeo, toasts, íconos
  lectura.js          textos que se leen en voz alta (los usa la app y scripts/voces.mjs) y su clave de audio
  logic.js            lógica pura: chequeo de casos, validador, calculadoras, almacenamiento legacy, exportar
  data.js             CONTENIDO CLÍNICO: PROTOS (catálogo) y DATOS (protocolos completos con fuentes)
  seeds.js            casos y publicaciones de ejemplo (marcados ejemplo: true)
  index.css           tokens de color (solo tema claro) + Tailwind
  views/
    auth.jsx          AuthGate, login, registro, recuperar contraseña
    migracion.jsx     migración de datos locales (IndexedDB → Firestore)
    protocolos.jsx    Inicio, Biblioteca, Protocolo (modo box)
    mapa.jsx          Mapa de protocolos por especialidad (vista `mapa`) y constelación del inicio (MapaInicio)
    periodontograma.jsx  Periodontograma con la estructura de PerioTools (dentro de Herramientas)
    casos.jsx         Mis casos: lista, detalle, editor, galería, sesiones
    revision.jsx      Revisión: intro, cola, pantalla de revisión con formulario
    trabajo.jsx       Asistente
    herramientas.jsx  Herramientas: calculadoras con el resultado dibujado (escala de estadios, conducto a escala, medidor de anestesia)
    comunidad.jsx     Feed, Postular a revisor, Contacto, modal de perfil
    agenda.jsx        Mi agenda, Calificaciones (estudiante), Evaluaciones (docente) y Solicitar un protocolo
public/
  protocolo-*.pdf                     PDF de box de los 6 protocolos, generados con npm run pdfs (el de PMMA hecho a mano quedó en git)
  voz/                                audios de voz natural y manifest.json (los genera npm run voces; si no existen, se usan las voces del sistema)
scripts/pdfs.mjs     genera los PDF de box desde data.js
scripts/voces.mjs    genera los audios con Google Cloud Text-to-Speech (clave en .env.local)
docs/MASTER_PROMPT_PROTOCOLOS.md     master prompt para redactar protocolos
docs/VOCES_GOOGLE_TTS.md             guía para activar las voces naturales
  favicon.svg                         ícono del logo
firestore.rules      reglas de seguridad de Firestore
storage.rules        reglas de seguridad de Storage
.env.example         plantilla de credenciales Firebase
```

**Pantalla de carga** (`#carga` en `index.html`, no en React, para que se vea antes de que cargue el código): la ficha del logo aparece, un punto menta (la sonda) recorre el anillo y va dibujando la C y su tramo verde azulado, la muela sube desde abajo como una erupción, un halo menta late y entra «Criterium» letra a letra con el lema. Mientras espera, la sonda sigue girando alrededor de la muela. `AuthGate` llama a `window.criteriumListo()` cuando ya se sabe si hay sesión; la pantalla espera a que termine la entrada (1,7 s) y se desvanece. Con «reducir movimiento» se ve quieta y se va de inmediato. Usa los valores en hex de los tokens porque `index.css` aún no está cargado.

La navegación es por estado (`view` en App.jsx), no por URL. `go(view, extra)` cambia de vista. Excepción: `#proto/<id>` abre ese protocolo con todo a la vista (fuentes incluidas); lo usan el QR y el enlace de los PDF de box, y `abrirProto` lo escribe en la barra.
La vista inicial es el **feed** (`view = 'feed'`, rotulado "Inicio"). Arriba de todo va el **mapa del inicio** (`MapaInicio` en `views/mapa.jsx`), en forma de **constelación**: los protocolos en un anillo (ordenados por especialidad), las conexiones como arcos que pasan cerca del centro (más gruesos y más cerca del centro mientras más comparten), y al centro un disco con la cifra (protocolos, o conexiones del que señalas). Solo colores de Criterium (`--deep`, `--acento`, `--menta`, `--rotulo`), sin colores por especialidad; nombre en negrita y especialidad · pasos como rótulo en mayúsculas espaciadas. Usa `corto` de `PROTOS` como nombre. Sin recuadro y continuo con la página; no captura el scroll y al tocar un protocolo lleva a la Biblioteca con `go('biblioteca', { foco: id })`, que limpia búsqueda y filtro, baja hasta ese protocolo y lo destaca (`.foco-proto`). Después sigue el feed con estilo de red social: franja de protocolos tipo historias, publicaciones y, en escritorio, la columna "Tu día". La antigua portada (`view = 'inicio'`) quedó como "Sobre Criterium". Arriba del feed va la guía "Qué puedes hacer en Criterium" (`Guia` en `comunidad.jsx`): cuatro pasos (aprende, registra, valida, conversa) que llevan a su sección; se puede ocultar.

**Mapa de protocolos** (`views/mapa.jsx`, vista `mapa`, botón en la Biblioteca y en la barra lateral): mismo lenguaje de constelación que el inicio, solo colores de Criterium. Nivel 1: las especialidades (`ESPECIALIDADES`, según `PROTOS.esp`) en un anillo, con arcos según cuánto se conectan sus protocolos. Nivel 2 (al tocar una): sus protocolos entrelazados con el nombre de lo que comparten y flecha cuando uno deriva a otro; alrededor, las especialidades vecinas (tocar salta a ellas); al lado, la lista de cada protocolo con sus conexiones en palabras y «Abrir el protocolo». Las relaciones se calculan desde `data.js` (`grafoProtocolos` → `lazosProtocolos`), nunca a mano: temas compartidos (`TEMAS`, regex sobre los pasos y la bandeja), «deriva a» (rama de un árbol que apunta a otro protocolo, `DESTINO`) y «lo menciona» (un «por qué» que habla de otro protocolo).

## Docentes y estudiantes

- **Rol docente = backend**: existe `docentes/{uid}` en Firestore. Se agrega **a mano desde la consola de Firebase** (como `revisores/`); nadie se lo asigna desde la app. `useEsDocente` (db.js) lo lee y `esDocente` va en el contexto.
- **Portal docente** (barra lateral, grupo «Portal docente»): Mis casos, Revisión de casos y Asistente (`VISTAS_DOCENTE` en App.jsx: `casos`, `caso`, `editor`, `revision`, `asistente`). Para un estudiante esas vistas no existen: `go()` las manda al inicio, y desaparecen «Nuevo caso», «Tu día», «Registrar un caso con este protocolo» (protocolo y cierre del modo guiado), los casos propios del protocolo, la mención honrosa y los pasos «Registra» y «Valida» de la guía (el estudiante ve aprende, practica, explora y conversa). En móvil la barra inferior del estudiante es Inicio, Biblioteca, Mapa y Herramientas.
- Las consultas de casos (`useMisCasos`, `useColaRevision`, `useAprobadoresProtocolo`) solo corren para docentes, y la migración de datos locales solo se ofrece a docentes.
- **Reglas** (`firestore.rules`, `storage.rules`): leer, crear, editar, revisar y borrar casos y sus fotos exige `esDocente()`. Revisar además exige no ser el autor. `docentes/{uid}`: cada uno lee solo el suyo; nadie escribe.
- **Firebase Storage no está activado en el proyecto** (al 2026-10-06): las fotos de casos no se pueden subir hasta activarlo en la consola.

**Periodontograma** (`views/periodontograma.jsx`, en Herramientas): estructura de PerioTools. Por diente: número (tocar = ausente), implante, movilidad y furca (cambian con cada toque). Por sitio: sangrado, placa, margen gingival y profundidad de sondaje. Orden: superior vestibular y palatino; inferior lingual y vestibular. Dibujo de cada cara con los dientes, el límite amelocementario, la línea del margen (`--bad`), el fondo del saco (`--acento`) y el saco sombreado. Al escribir un dígito el cursor salta al sitio siguiente (en el sondaje un «1» espera 700 ms por si es 10 o más). Arriba, sondaje medio, NIC medio, % de sangrado y de placa, sitios ≥4 mm y NIC interdental máximo; «Usar en estadio y grado» los pasa a la calculadora. Convención: margen positivo hacia coronal del LAC, negativo si hay recesión; NIC = sondaje − margen. No se guarda.

**PDF de box** (`scripts/pdfs.mjs`): una hoja para ojear, dos como máximo (el script falla si pasa de 2 y achica la escala hasta 85 % si se pasa por poco). Trae los pasos (título y qué hacer), el instrumental por fase, «No te lo saltes» (pasos críticos) y «En disputa». Sin fuentes: un QR y el enlace `#proto/<id>` llevan a Criterium, donde están las fuentes. Campos del box sin nombre de paciente ni ficha.

**Herramientas** (`views/herramientas.jsx`): mismo lenguaje que el mapa del inicio. Selector de 4 piezas con glifo; datos con botones − / + grandes (`Paso`) e interruptores (`Elige`); resultado dibujado: escala de estadios I–IV y grado A–C (periodoncia), conducto a escala con LT, pasaje, 2/3 LAD, cateterismo y escalonado, más la «escalera» de limas (endodoncia, usa `endo().num`), medidor en arco y fila de tubos (anestesia, usa `.num`). «De dónde sale esto y qué falta» va plegado. Las reglas de cálculo siguen en `logic.js`.

## Agenda, evaluación, calificaciones y solicitudes

Flujo: el estudiante agenda un paciente con el protocolo a realizar y el docente que lo evalúa → al terminar, el docente marca la **T de terminado** y pone la nota → la nota aparece en **Calificaciones**. Los protocolos que faltan se piden con «Solicitar un protocolo» (al final de la Biblioteca) y Criterium se compromete a publicarlos en **10 días hábiles** (`PLAZO_SOLICITUD`, `sumarDiasHabiles` en `logic.js`; no descuenta feriados).

- **Mi agenda** (vista `agenda`, todos): grilla horaria al estilo de un software de agenda dental. Vista semana (columnas por día, lunes a sábado) o día por box (columnas `BOXES`). Horario `HORARIO` (8 a 20 h), filas de 30 min, citas como bloques con color por estado (`.cita-*` en `index.css`). Tocar un hueco abre «Agendar paciente» con fecha, hora y box. La cita guarda box, duración (`DURACIONES`), protocolo, docente, iniciales del paciente (2 a 4 letras, nunca nombre ni RUT) y pieza. Avisa si dos citas propias se pisan en el mismo box (`choques`). Desde la cita: «Abrir el protocolo», editar, cancelar.
- **Calificaciones** (vista `calificaciones`, estudiante): libro de notas al estilo de un LMS: grupos por especialidad con promedio, «Nota final» destacada, % de pasos bien hechos; cada fila se despliega con comentario y pasos. Escala chilena 1,0 a 7,0, aprueba con 4,0 (`NOTA_*`, `leerNota`, `notaTxt`, `promedioNotas`).
- **Evaluaciones** (vista `evaluaciones`, portal docente): «Por evaluar», «Agenda» (la misma grilla con las citas de sus estudiantes) y «Libro de notas» (estudiantes × protocolos, última nota y promedio). Evaluar: T de terminado obligatoria, nota, comentario y, opcional, los pasos bien hechos del protocolo (sirve para el % de pasos bien hechos del piloto).
- Navegación: «Mi agenda» y «Calificaciones» en Trabajo diario; «Evaluaciones» encabeza el portal docente. Barra inferior móvil: estudiante = Inicio, Biblioteca, Agenda, Notas; docente = Inicio, Biblioteca, Evaluar, Casos.
- **Reglas**: `citas` las lee solo el estudiante dueño y el docente asignado; el estudiante crea a su nombre, con docente verificado (existe en `docentes/`, distinto de sí mismo) y edita o cancela mientras no esté evaluada; el docente solo puede cambiar `estado` a `terminada` y escribir `evaluacion` (nota 1 a 7, su uid), una vez. `solicitudes`: cada uno crea y lee las suyas; el equipo de Criterium las gestiona desde la consola. `docentes/` lo lee cualquiera con sesión (para elegir docente).

## Modelo de datos

**Caso**
```js
{
  id, ejemplo, estado,                 // 'borrador' | 'enviado' | 'cambios' | 'aprobado' | 'denegado'
  autor: { id, nombre, rol },          // id 'yo' = el usuario local
  titulo, dientes,                     // dientes en notación FDI: "3.6" o "1.6, 1.7"
  especialidad,
  paciente: { iniciales, edad, sexo }, // nunca nombre ni RUT
  protocoloId,                         // clave de DATOS, o '' si no usa protocolo
  diagnostico, procedimiento, evidencia,
  pasos: { [indice]: { estado: 'hecho'|'modificado'|'omitido'|'noaplica', nota } },
  consentimiento,                      // boolean
  fotos: [{ id, tipo: 'Inicial'|'Progreso'|'Final'|'Radiografía', nota, data, w, h, fecha, postEnvio }],
  sesiones: [{ id, fecha, txt, proximo }],   // fechas 'AAAA-MM-DD'
  revisiones: [Revision], historial: [{ fecha, txt }], creado, actualizado
}
```

**Revisión**
```js
{ id, fecha, revisor: { id, nombre, area, verificado, demo },
  puntajes: { pertinencia, claridad, evidencia },   // 1 a 5
  veredicto: 'aprobado' | 'cambios' | 'denegado', motivos: [string], justificacion }
```

**Publicación del feed** (`feed/{id}`)
```js
{ autorUid, autor: { uid, nombre, rol, verificado }, protocoloId, fecha, txt,
  likes, likedBy: [uid],               // cada persona agrega o quita solo su uid
  respuestas: [{ id, autor: { uid, nombre, rol, verificado }, fecha, txt }] }  // se agregan con arrayUnion
```
Las publicaciones antiguas no tienen `autorUid`: su nombre no enlaza a un perfil.

**Perfil público** (`perfiles/{uid}`): `{ nombre, rol, institucion, area, descripcion (≤ 300), actualizado }`. Nunca el correo (ese queda en `usuarios/{uid}`, privado). Se sincroniza al iniciar sesión y al guardar "Tu perfil". Vista `perfil` con `verPerfil(uid)`.

**Seguimiento** (`seguimientos/{de}_{a}`): `{ de, a, fecha }`. Cada uno crea o borra solo los suyos.

**Cita** (`citas/{id}`): `{ estudianteUid, estudiante: { uid, nombre }, docenteUid, docente: { uid, nombre }, fecha 'AAAA-MM-DD', hora 'HH:MM', duracion (min), box, paciente (iniciales), pieza, protocoloId, nota, estado: 'agendada' | 'cancelada' | 'terminada', evaluacion?: { terminado, nota, comentario, pasosBien: [índices], pasosTotal, fecha, docente }, creado, actualizado }`.

**Solicitud** (`solicitudes/{id}`): `{ uid, nombre, procedimiento, especialidad, detalle, fecha, plazo 'AAAA-MM-DD', estado: 'recibida' | 'en preparación' | 'publicada' }`.

**Protocolo** (en `data.js`): `DATOS[id] = { esp, titulo, bandera, tags, alcance, bandeja, evidencia, nota, pdf?, pasos: [Paso] }`.
Cada `Paso` tiene `corto`, `hacer`, `listo`, `porque[]` y opcionales `cond`, `marca`, `disputa`, `sinEv`, `sub[]` (con `parrafos`, `arbol`, `fuentes`) y `aportes[]`.
Cada fuente es `{ grado, cita, loc, url? }`. La cita se vuelve enlace (`enlacesFuente` en `protocolos.jsx`): usa `url` si existe; si no, el DOI escrito en `loc` (→ doi.org) y el PMID (→ PubMed). **Nunca agregues un `url`, DOI o PMID que no hayas verificado.**

## Reglas que no se pueden romper

Están en `logic.js`. Si cambias alguna, cambia también el texto que la explica en la interfaz.

**Chequeo de un caso** (`chequeoCaso`) devuelve ítems de nivel `falla`, `revisar` o `info`.
- Bloquean el **envío** a revisión: falta título, diente FDI válido, diagnóstico, procedimiento o consentimiento; un paso sin marcar; un paso modificado u omitido sin justificar; "no aplica" en un paso que no es condicional sin explicar; caso sin protocolo sin evidencia declarada.
- Bloquea la **aprobación**: omitir un paso crítico (`marca` con "crítico" o "suele faltar").
- Solo avisan: desvíos justificados, pasos en disputa, falta de fotos o de radiografía en endodoncia y cirugía.

**Revisión** (`FormRevision` en `revision.jsx`):
- Los tres puntajes son obligatorios. La justificación pide al menos 40 caracteres.
- No se puede aprobar si el chequeo tiene fallas o si la evidencia se puntuó bajo 3.
- Pedir cambios o denegar exige al menos un motivo. El chequeo sugiere motivos.
- Conflicto de interés: hoy se permite revisar el propio caso **solo como demo**, con aviso. En producción hay que bloquearlo.

**Validador de protocolos** (`validar`): todo paso tiene fuente o está declarado sin evidencia; una revisión de estudios in vitro no puede otorgar grado A ni B (regla del techo); una fuente en población distinta tiene que estar declarada.

## Contenido clínico

- `data.js` es la fuente de verdad del contenido. Viene del borrador original y está revisado por los autores. **No reescribas ni "mejores" el texto clínico** sin que te lo pidan.
- **Nunca inventes referencias**, autores, años, DOI ni cifras. Si algo no tiene fuente, se marca como sin evidencia o extrapolación.
- Las calculadoras dicen de dónde sale cada número y qué falta verificar. Mantén ese bloque al día.

## Almacenamiento

- **Firebase Firestore** es la fuente de verdad para todos los datos compartidos. Los datos se sincronizan en tiempo real con `onSnapshot`.
- **Firebase Storage** almacena las fotos clínicas en `casos/{casoId}/fotos/{fotoId}.jpg`.
- **Firebase Auth** maneja la autenticación con email/contraseña. El UID de Firebase identifica al usuario en todo el sistema.
- **IndexedDB legacy**: `logic.js` conserva las funciones `leer()` y `escribir()` para la migración de datos locales al registrarse.
- **Firestore offline**: habilitado con `enableIndexedDbPersistence`. Los datos se sincronizan cuando hay conexión.
- localStorage (solo comodidades): `criterium-checks` (modo box), `criterium-revisor`, `criterium-guia` (la guía del inicio quedó oculta), `criterium-lateral` (barra lateral visible u oculta en escritorio), `criterium-derecha` (columna "Tu día" del inicio visible u oculta; al ocultarse se pliega hacia el borde y queda una pestaña), `criterium-modo-proto` (`guiado` o `todo`), `criterium-voz` (voz de lectura elegida, por `voiceURI`), `criterium-voz-vel` (velocidad de lectura).
- Las fotos se comprimen en el navegador a 1600 px de lado mayor, JPEG 0,84, sin recortar, y luego se suben a Storage.
- **Variables de entorno**: las credenciales de Firebase van en `.env` (nunca en el código). Ver `.env.example`.
- **Migración**: al registrarse o iniciar sesión por primera vez, la app detecta datos en IndexedDB y ofrece subirlos a Firestore.

## Modo guiado y voz

- Un protocolo se abre en **modo guiado** (`views/guiado.jsx`): primero la bandeja, después un paso a la vez y al final un cierre con los pasos sin marcar y "Registrar un caso". "Terminé este paso" marca el paso (en `criterium-checks`, las mismas marcas del modo box) y avanza. El mapa del recorrido (`Recorrido`) es una fila de puntos dentro del panel oscuro del paso (también en la bandeja y el cierre), así el paso usa todo el ancho (hasta 1100 px); los pasos que aún no se ven muestran solo su número. "Ver todo" vuelve a la lista completa.
- En modo guiado cada paso se recorre solo (`autoPorque` en `Paso`, 5 s): a los 5 s se abre el «¿Por qué?» (con «Se abre en N s» antes) y la página baja para verlo entero; cada 5 s más se abre la ficha siguiente (fuentes, errores, otros casos…) y baja hasta ella. Tocar el «¿Por qué?» o una ficha detiene el recorrido.
- Desde la Biblioteca («Abrir», `abrirProto(id, { libre: true })` → `protoLibre`) el protocolo entra directo a manos libres, solo esa vez. La bandeja tiene «Empezar» y debajo «Descargar el PDF de box» (si el protocolo trae `pdf`). En la Biblioteca, al lado de «Abrir», va «PDF de box» (mismo archivo, `bajarPdf` en `protocolos.jsx`).
- **Manos libres** (botón en la franja superior del modo guiado): capa fija que tapa la app, pantalla completa del navegador si existe (en iPhone no: queda la capa), voz y lectura encendidas, pantalla sin apagarse (Wake Lock) y botones Anterior / Terminé más grandes. Se sale con «Salir», Esc, saliendo de la pantalla completa o diciendo «salir». Enciende el modo voz y al salir lo apaga.
- Animaciones solo con CSS y SVG (`.aparece`, `.flecha`, `.nodo-actual`, `.compacta`, `.onda` en `index.css`). Con "reducir movimiento" no hay animación.
- Cada paso entra desde el lado hacia el que avanzas; el número del paso va de marca de agua; "Terminé" muestra ✓ un instante antes de pasar. En móvil se desliza (izquierda avanza, derecha retrocede).
- **Modo voz** (un solo botón «Voz»): lee cada paso al llegar (`speechSynthesis`) y escucha órdenes a la vez (Web Speech API, `es-CL`). No se guarda entre visitas: el micrófono y el audio se encienden dentro del toque, porque Safari no los abre fuera de un gesto. Donde no hay reconocimiento (Firefox, app de iOS) el botón solo lee.
- Órdenes (`voz.js`): «siguiente / sigamos / listo / dale», «anterior / atrás», «lee / repite», «por qué», «silencio» y, en manos libres, «salir». Los resultados se convierten en órdenes en `procesadorOrdenes` (`voz.js`, aparte del hook para probarlo sin micrófono): cada frase se mira desde la última orden o la última pausa (800 ms), no el resultado entero, porque Safari junta todo en un solo resultado que crece; así la segunda orden también cuenta. Se puede hablar mientras lee: si lo oído (2 palabras o más) está en el texto leído, es eco del parlante y se descarta; si es una sola palabra que también está en el texto («listo», «sigue»), espera 650 ms: si la frase crece era eco, si no era la persona. La misma orden repetida en menos de 1,2 s cuenta una vez (Chrome corrige el texto provisorio). Frases de más de 6 palabras se ignoran (conversación con el paciente). Se miran las alternativas del reconocedor, no solo la primera. Tras 40 palabras en un resultado se reabre el micrófono.
- Lectura: se lee frase por frase (Chrome corta las largas sin avisar) y un vigilante libera el estado «leyendo» si el navegador se calla sin avisar. Voces: solo en español, sin las de juguete de Apple (Eddy, Grandma, Rocko…), ordenadas por calidad (es-CL, latinas, «Google», «Premium/Enhanced»). Botón «···» al lado: elegir voz, velocidad (calma, normal, rápida) y «Probar». **Voces naturales:** si existen audios de Google Cloud Text-to-Speech (`public/voz/manifest.json`, generados con `npm run voces`, guía en `docs/VOCES_GOOGLE_TTS.md`), aparecen primero («Natural · …») y son la opción por defecto: `hablar()` reproduce el mp3 del texto (clave síncrona `clave()` de `lectura.js`, para que Safari lo deje sonar dentro del toque) con la velocidad como `playbackRate`; si falta el audio o falla, lee con la voz del sistema. Los textos leídos salen de `lectura.js`: si cambian, hay que regenerar los audios. Entre frase y frase hay una pausa (550 ms en calma, 300 en normal, 120 en rápida) y el tono va apenas más grave (0,97).
- Micrófono: se reinicia solo tras silencios, al tiro si no hubo fallas (300 ms si la sesión duró menos de 1 s), con espera creciente si falla la red; estados `iniciando`, `escuchando`, `pausado` (toca para seguir), `denegado`, `sin-micro`, `error`, cada uno con su mensaje en el panel. Chrome manda el audio a Google y Safari a Apple: la interfaz pide no decir datos del paciente.
- Teclado: ← y →.

## Estudio START MEDUC 2026 (contexto de los socios)

Criterium postula al concurso START MEDUC 2026 (cierre 23-10-2026) para validar 5 protocolos y probarlos en un piloto. Documentos fuente: extenso v4.4, formulario, carta a Transferencia UC, Gantt, presupuesto y plan de negocio v2.0 (carpeta "CRITERIUM DOCUMENTOS" del escritorio; la actualización más reciente está en `ACTUALIZACION_CONTEXTO_2026-10-05.md` de esa carpeta).

- **Los 5 protocolos del estudio** (`estudio: true` en `PROTOS`), todos con borrador hecho con el master prompt (2026-10-06): resina oclusal clase I (v0.2) y exodoncia de tercer molar superior 1.8 / 2.8 (v0.2, id `exodoncia-18`), bio/necropulpectomía de primer premolar superior, destartraje y pulido radicular por cuadrante, y sellantes en niños con rama resina o ionómero (v0.1). Cada paso tiene al menos una fuente verificada en PubMed o DailyMed, o `sinEv` (práctica habitual). Ninguno tiene revisión de especialista. El cementado de PMMA no es del estudio y conserva su PDF hecho a mano (v0.4); 5 de sus pasos todavía no tienen fuente ni `sinEv`.
- **Validación de protocolos = juicio de expertos** (Delphi modificado): ≥5 especialistas por protocolo, hasta 2 rondas, paso aprobado si ≥80 % pone 4 o 5 en pertinencia, claridad y respaldo; sin acuerdo → «sin acuerdo experto» o se elimina. No confundir con la revisión por pares de **casos** (los revisores de las 8 áreas).
- **La IA solo está en la producción.** El estudiante lee un texto fijo, fechado y con huella SHA-256. La app no genera indicaciones nuevas.
- **Sin nombre ni marca de la UC** dentro de la plataforma. Se puede decir «validado por juicio de expertos» cuando lo esté; nunca «aprobado por la UC».
- **Piloto (jun–oct 2027):** plataforma cerrada, cuentas individuales solo con consentimiento firmado, y registro de uso (% de estudiantes que abre ≥1 protocolo por sesión). El registro de uso **todavía no existe** en el código.
- **Ley 21.719** (vigente desde el 1-12-2026): datos mínimos, agregados con umbral mínimo de grupo, consentimiento de investigación separado de los términos de uso.
- El código inscrito en el DDI es la **v0.2.0** (manifiesto en `_registro_DDI/`). Todo lo posterior (modo guiado, voz, enlaces a fuentes, rediseño) es una versión nueva que se puede inscribir aparte.

## Integraciones de claude.ai

La app se publicó primero como artifact en claude.ai. Ahí existe `window.claude.use(nombre)`, que da dos capacidades:
- `sample`: el asistente (preguntar, borrador de protocolo, segunda lectura del validador y de la revisión).
- `downloads`: guardar archivos.

**Master prompt de protocolos** (`docs/MASTER_PROMPT_PROTOCOLOS.md`): reglas, grados, formato de `data.js` y reporte de verificación para redactar protocolos. El asistente lo importa (`?raw`) y lo usa como instrucciones en «Borrador de protocolo» (devuelve `{ id, proto, datos, reporte }`, se descarga como `.js` para pegar y `-reporte.md`) y como criterio en la segunda lectura del validador. Sin acceso a internet, el modelo solo puede usar las fuentes que vengan en el material; para el resto propone búsquedas de PubMed pendientes. Editar ese archivo cambia lo que hace la app.

`cap()` en `logic.js` devuelve `null` fuera de claude.ai. Entonces el asistente muestra "no disponible" y las descargas usan un enlace normal del navegador. Para que el asistente funcione fuera, hay que crear una ruta en un servidor que llame a la API de Anthropic. **La clave de la API nunca va en el navegador.**

## Convenciones de diseño

- Colores solo desde los tokens de `index.css` (`--bg`, `--card`, `--ink`, `--acento`, `--ok`, `--warn`, `--bad`…), mapeados en `tailwind.config.js`. Nada de colores sueltos, salvo la banda oscura del inicio y el lightbox.
- **Solo tema claro.** El modo oscuro se eliminó (2026-10-06): no hay botón, el CSS no tiene bloques oscuros, `color-scheme: light` y `data-theme="light"` fijo aunque el sistema esté en oscuro. No agregar colores oscuros.
- Texto sobre fondos de color sólido: `text-onc` (no `text-white`).
- Paleta final (de la presentación para tutores START MEDUC): azul petróleo profundo `#0F2530` (`--deep`, títulos; `--nav`, barra lateral de escritorio), verde azulado `--acento` `#2F6A78` para botones y enlaces, y **menta** `--menta` `#5CCFC0` para lo que se destaca sobre fondo oscuro (números, "Terminaste cuando", ítem activo). Fondo `#F2F6F7`, recuadros suaves `--soft` `#E9F1F3`. Texto sobre menta: `text-mentaink`. Los estados (ok, aviso, error, borrador, validado) van en tonos pastel. Nada neón ni saturado. El anillo de las historias usa `--ring`; el ícono del logo, `--logo-bg` y `--logo-acc`.
- Piezas del sistema (en `index.css`): `.rotulo` (rótulo de sección en mayúsculas espaciadas, color `--rotulo`, como "03 · LA SOLUCIÓN"), `.panel` (recuadro oscuro `--panel` con texto `text-panelink` / `text-panelink2`; lo que siempre se ve), `.suave` (recuadro `--soft` sin borde; explicaciones). Números grandes de una lista: `font-extrabold text-menta`.
- **Paso del protocolo en tres niveles** (`Paso` en `protocolos.jsx`): 1 · `.panel` con "Paso NN", qué hacer y "Terminaste cuando" en menta (siempre visible); 2 · "¿Por qué?" desplegable (`.suave`, cerrado de partida, se abre con altura animada `.despliega`; la voz «por qué» también lo abre); 3 · "Fuente y otros casos": una ficha por cada `sub` (el título se traduce en `FICHA`: "ver fuentes" → Fuentes, "dónde se equivoca la gente" → Errores, "dónde no hay acuerdo" → Disenso…) más "Otros casos" con los aportes. Una ficha abierta a la vez.
- Una sola tipografía en toda la app: la del logo (San Francisco, `-apple-system`, con Inter como respaldo fuera de Apple). `font-serif` apunta a esa misma familia. **El logo y su tipografía no se cambian.** No usar tipografía monoespaciada.
- Estilo "clínico premium": fondo `.fondo` (trama de puntos tenue + brillo de marca), recuadros con la clase `.tarjeta` (blanca, sin borde duro, sombra difusa, `--card-line`), barras con vidrio esmerilado (`backdrop-blur`), campos en `--input`. Encabezados de marca con `.banda-marca` (degradado del logo, texto blanco). Todo en `index.css`.
- Los `<select>` no usan el estilo nativo del sistema: `index.css` les quita la apariencia y dibuja el chevron con el color del tema.
- Logo: componente `Logo` en `ui.jsx` (prop `oscuro` sobre fondo oscuro: "Criter" claro e "ium" menta), recreado en SVG desde el logo oficial (C con una muela al centro y un tramo verde azulado; "Criter" en `text-deep` e "ium" en `text-acento`). El favicon está en `public/favicon.svg`.
- **Fotos clínicas siempre completas dentro de su marco** (`object-contain`), nunca recortadas.
- Todo en español de Chile, simple y directo, que lo entienda un estudiante de primer año. Frases cortas. Los tecnicismos se dejan y se explican en el mismo texto.
- Debe funcionar a 390 px de ancho sin scroll horizontal. En móvil la navegación va en la barra inferior.
- Nada de `alert()`, `confirm()` ni `prompt()`: las confirmaciones van dentro de la página.

## Forma de trabajar

- Una cosa a la vez. Antes de un cambio grande, propone un plan corto y espera el visto bueno.
- Después de cada cambio: `npm run build` sin errores y revisa en el navegador el flujo que tocaste.
- No borres los casos de ejemplo del código de `seeds.js`: el usuario los puede quitar desde la app.

## Próximos pasos (en orden)

1. ~~**Backend y cuentas reales.**~~ ✅ Hecho: Firebase Auth + Firestore + Storage integrados.
2. **Privacidad.** Los datos de salud son datos sensibles. Antes de usar casos reales: consentimiento registrado, cifrado, control de acceso y revisión legal según la Ley 21.719 (vigente desde el 1-12-2026).
2b. **Preparar el piloto:** registro de uso con consentimiento, acceso cerrado por cuentas individuales y opción de desactivar la voz durante el estudio.
3. **Bloquear la autorrevisión** y asignar revisores por área del caso.
4. **Asistente vía servidor** (ver "Integraciones").
5. **Pruebas** para `chequeoCaso`, `validar`, `perio`, `endo`, `anestesia` y `validarDientes`.
6. Mover cada protocolo de `data.js` a su propio archivo para que editarlos sea más fácil.
