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
  logic.js            lógica pura: chequeo de casos, validador, calculadoras, almacenamiento legacy, exportar
  data.js             CONTENIDO CLÍNICO: PROTOS (catálogo) y DATOS (protocolos completos con fuentes)
  seeds.js            casos y publicaciones de ejemplo (marcados ejemplo: true)
  index.css           tokens de color (tema claro/oscuro) + Tailwind
  views/
    auth.jsx          AuthGate, login, registro, recuperar contraseña
    migracion.jsx     migración de datos locales (IndexedDB → Firestore)
    protocolos.jsx    Inicio, Biblioteca, Protocolo (modo box)
    casos.jsx         Mis casos: lista, detalle, editor, galería, sesiones
    revision.jsx      Revisión: intro, cola, pantalla de revisión con formulario
    trabajo.jsx       Asistente y Herramientas (calculadoras)
    comunidad.jsx     Feed, Postular a revisor, Contacto, modal de perfil
public/
  protocolo-cementado-pmma-v0.4.pdf   PDF de box del protocolo de cementado
firestore.rules      reglas de seguridad de Firestore
storage.rules        reglas de seguridad de Storage
.env.example         plantilla de credenciales Firebase
```

La navegación es por estado (`view` en App.jsx), no por URL. `go(view, extra)` cambia de vista.

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

**Protocolo** (en `data.js`): `DATOS[id] = { esp, titulo, bandera, tags, alcance, bandeja, evidencia, nota, pdf?, pasos: [Paso] }`.
Cada `Paso` tiene `corto`, `hacer`, `listo`, `porque[]` y opcionales `cond`, `marca`, `disputa`, `sinEv`, `sub[]` (con `parrafos`, `arbol`, `fuentes`) y `aportes[]`.

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
- localStorage (solo comodidades): `criterium-tema`, `criterium-checks` (modo box), `criterium-revisor`.
- Las fotos se comprimen en el navegador a 1600 px de lado mayor, JPEG 0,84, sin recortar, y luego se suben a Storage.
- **Variables de entorno**: las credenciales de Firebase van en `.env` (nunca en el código). Ver `.env.example`.
- **Migración**: al registrarse o iniciar sesión por primera vez, la app detecta datos en IndexedDB y ofrece subirlos a Firestore.

## Integraciones de claude.ai

La app se publicó primero como artifact en claude.ai. Ahí existe `window.claude.use(nombre)`, que da dos capacidades:
- `sample`: el asistente (preguntar, borrador de protocolo, segunda lectura del validador y de la revisión).
- `downloads`: guardar archivos.

`cap()` en `logic.js` devuelve `null` fuera de claude.ai. Entonces el asistente muestra "no disponible" y las descargas usan un enlace normal del navegador. Para que el asistente funcione fuera, hay que crear una ruta en un servidor que llame a la API de Anthropic. **La clave de la API nunca va en el navegador.**

## Convenciones de diseño

- Colores solo desde los tokens de `index.css` (`--bg`, `--card`, `--ink`, `--acento`, `--ok`, `--warn`, `--bad`…), mapeados en `tailwind.config.js`. Nada de colores sueltos, salvo la banda oscura del inicio y el lightbox.
- Tres estados de tema: claro, oscuro y "sistema" (sin `data-theme`). Todo color nuevo se define en los tres bloques.
- Texto sobre fondos de color sólido: `text-onc` (no `text-white`), para que funcione en tema oscuro.
- Tipografías: Plus Jakarta Sans (interfaz) y Source Serif 4 (explicaciones). **No usar tipografía monoespaciada.**
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
2. **Privacidad.** Los datos de salud son datos sensibles. Antes de usar casos reales: consentimiento registrado, cifrado, control de acceso y revisión legal según la ley chilena de protección de datos.
3. **Bloquear la autorrevisión** y asignar revisores por área del caso.
4. **Asistente vía servidor** (ver "Integraciones").
5. **Pruebas** para `chequeoCaso`, `validar`, `perio`, `endo`, `anestesia` y `validarDientes`.
6. Mover cada protocolo de `data.js` a su propio archivo para que editarlos sea más fácil.
