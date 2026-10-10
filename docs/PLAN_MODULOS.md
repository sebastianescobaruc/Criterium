# Plan de módulos nuevos · Criterium

Fecha: 7-10-2026. Estado: **F (modo piloto) hecho el 7-10-2026**, con el visto bueno de Sebastián. Decisiones: el indicador muestra las dos cifras, el paso de muestra de la portada se queda, Herramientas sigue abierta para participantes y apagar la voz queda pendiente. Los demás módulos quedan esbozados al final.

## 0 · Lo que hay hoy (resumen del repositorio)

El prompt de los módulos supone una web Next.js + TypeScript + Supabase + Stripe. **Esa web no existe.** La carpeta `Desktop/criterium-migracion/criterium` es un Next.js vacío (solo el commit inicial, sin Supabase ni Stripe). Criterium es este repositorio, y se decidió (7-10-2026) construir sobre él.

| Lo que pide el prompt | Lo que hay en Criterium | Cómo se traduce |
|---|---|---|
| Next.js App Router + TS | React 18 + Vite 5, JS, sin router (navegación por estado `view`) | Vistas nuevas en `src/views/`, igual que las de hoy |
| Supabase (auth + BD + RLS) | Firebase Auth + Firestore + `firestore.rules` | Cada política RLS pasa a una regla de Firestore |
| Supabase Storage | Firebase Storage **sin activar** (exige el plan Blaze) | Lo que necesite archivos espera a Blaze |
| API routes / Server Actions | No hay servidor (hosting estático) | Cloud Functions (exige Blaze) o una función en Vercel |
| Stripe freemium | No existe | Queda fuera hasta que exista |
| Variables de entorno como interruptores | `VITE_*` se fijan al compilar y **las ve cualquiera** | Interruptores reales en `config/piloto` (Firestore), que las reglas leen; las `VITE_*` solo dan valores por defecto a la interfaz |
| Sincronización con la app | Es la misma app (web, PWA e iOS con Capacitor) | Nada que sincronizar |

Otras piezas que importan:
- **Los protocolos van dentro del código.** `src/data.js` (119 KB) se empaqueta en el JS de la app y lo importan 11 archivos; los PDF de box están en `public/`. Hoy cualquiera puede leerlos sin cuenta. **Para que el bloqueo del piloto sea real, el contenido tiene que salir del paquete y pasar a Firestore**, con reglas por grupo. Es el cambio más grande del módulo F.
- Diseño: tokens en `src/index.css`, componentes base en `src/ui.jsx` y convenciones en `CLAUDE.md`.
- Roles hoy: docente (`docentes/{uid}`), admin (`admins/{uid}`) y revisor; todos se asignan a mano desde la consola.
- Edición **Criterium Red** (`npm run build:creativa`): ya compila sin protocolos (cambia `data.js` por un archivo vacío). El piloto se aplica a la edición completa.
- No hay Java en el equipo, así que el emulador de Firestore no corre. Para probar las reglas con los 5 usuarios hace falta instalarlo (`brew install openjdk`) o usar cuentas de prueba reales.

## F · Modo piloto START MEDUC (primero)

### F1 · Configuración del piloto
- Documento `config/piloto`: `apertura` (fecha, por defecto 1-11-2027), `abierto` (botón «Abrir todo»), `congelados`, `modulosNuevos`, `registroUCInvitacion`, `dominiosInvitacion` (`['uc.cl']`) y `estudio` (los 5 ids).
- Lo lee cualquiera con sesión y lo escribe solo un admin. Las reglas lo consultan con `get()`, así que cambiarlo surte efecto sin compilar.
- Las `VITE_*` (`VITE_PILOTO_APERTURA`, `VITE_REGISTRO_UC_POR_INVITACION`, `VITE_MODULOS_NUEVOS_EN_PILOTO`, `VITE_PROTOCOLOS_CONGELADOS`) solo sirven de valor inicial cuando el documento no existe.

### F2 · Participantes y seudónimos
- `participantes/{uid}` = `{ grupo: 'criterium' | 'habitual', codigo }`. Lo escribe solo un admin; cada persona lee solo el suyo, porque la app necesita su grupo y su código.
- `identidades/{codigo}` = `{ uid, nombre, correo, consentimiento: fecha }`. Lo lee y escribe solo un admin. Es la tabla que une el código con la persona.

### F3 · Protocolos fuera del código (bloqueo real)
- Colección `protocolos/{id}` con `{ proto, datos, version, fecha, sha256, estudio, publicado }`. El PDF de box va en `protocolos/{id}/pdf/actual` en base64 (cada PDF pesa 250 a 315 KB, cabe en un documento).
- **Regla de lectura:**
  - sin sesión o paciente: nada;
  - `habitual`: nada hasta `apertura` o hasta que esté `abierto`;
  - `criterium`: solo los 5 del estudio;
  - el resto: lo publicado, como hoy.
- **Edición:** solo un admin. Si `congelados` y el protocolo es del estudio, no se puede modificar; el cambio va a `protocolos/{id}/versiones/{v}` con `publicado: false`.
- **En la app:**
  - `data.js` se reemplaza al compilar por un archivo vacío (como ya hace la Red);
  - los protocolos se cargan de Firestore al entrar (quedan guardados para usar sin conexión);
  - los 11 archivos leen de ese almacén;
  - los PDF salen de `public/`.
- **Para subirlos:** `npm run protocolos:subir`. Lo corres tú con tu correo y contraseña de admin en `.env.local`; lee `data.js`, calcula la huella SHA-256 y sube contenido y PDF. `data.js` sigue en el repositorio como fuente de verdad (lo usan `pdfs`, `voces` y `catalogo`).
- Cada protocolo muestra **versión, fecha y huella SHA-256**.
- `#proto/<id>` (QR de los PDF) pasa a pedir sesión.
- El `habitual` ve la Biblioteca vacía con «Se abre el 1 de noviembre de 2027»: ni el catálogo le llega.

### F4 · Registro UC solo por invitación
- `invitaciones/{codigo}` = `{ grupo, creado, usada, usadaPor }`. Las crea un admin.
- Con `registroUCInvitacion`, quien se registre con un correo `@uc.cl` debe escribir un código válido; al usarlo, el código queda gastado y la persona queda en `participantes/` con su grupo.
- **Límite de Firebase sin Blaze:** no se puede impedir que alguien cree la cuenta en Auth. Sí se puede dejar inútil: si un correo `@uc.cl` no tiene invitación usada, las reglas no le dan nada. Esto cuesta una lectura extra solo a los correos UC.

### F5 · Módulos nuevos apagados para participantes
- Con `modulosNuevos = false` y antes de la apertura, quien tenga grupo no ve el feed ni la red (lo que hoy es «Comunidad»), y lo mismo valdrá para Estudio y Casos simulados cuando existan.
- Se aplica en las reglas de `feed`, `pendientes`, `comentarios`, `seguimientos`, etc., y en la navegación: su inicio pasa a ser la Biblioteca.

### F6 · Registro de uso
- `eventos_uso/{auto}` = `{ codigo, sesion, tipo, protoId, fecha }`.
- Tipos: `sesion_inicio`, `protocolo_abierto`, `nivel_2_abierto` («¿Por qué?»), `nivel_3_abierto` (una ficha), `pdf_descargado`.
- Solo lo crea el participante, con su propio código y la hora del servidor. Solo lo lee un admin. **No guarda uid, nombre ni correo.**
- `sesion` es un id al azar por visita; hace falta para medir «por sesión».

### F7 · Panel admin, pestaña «Piloto»
Dentro de lo que hoy es «Filtro de publicación»:
- interruptores de `config/piloto`;
- asignar grupo a una persona;
- generar códigos de invitación;
- exportar el CSV seudonimizado;
- el indicador;
- el botón **«Abrir todo»**.

### Decisiones que necesito de ti
1. **Indicador:** «% de estudiantes del grupo criterium que abre al menos 1 protocolo por sesión». Propongo mostrar dos cifras: el % de sesiones con al menos 1 protocolo abierto, y el % de estudiantes que lo cumple en la mayoría de sus sesiones. Hay que confirmarlo con el equipo de investigación.
2. **Portada pública:** muestra un paso real de muestra (resina, paso 3). ¿Se queda como muestra o se quita, ya que «los protocolos no se exponen sin cuenta»?
3. **Herramientas** (calculadoras y periodontograma): el prompt no las nombra. ¿Quedan abiertas para los participantes?
4. **Voz y manos libres** durante el estudio (`CLAUDE.md` 2b pide poder apagarla): ¿lo sumo aquí?

### Orden de trabajo y riesgo
1. Reglas y colecciones nuevas, más `npm run protocolos:subir`.
2. La app lee los protocolos desde Firestore. Es el paso con más riesgo: toca 11 archivos y la carga inicial.
3. Grupos, bloqueo y módulos apagados.
4. Invitaciones.
5. Eventos.
6. Panel admin.
7. Pruebas con los 5 usuarios.

**Para no romper nada:**
- primero se suben los protocolos a Firestore, después se publican las reglas y la app nueva;
- el sitio principal se publica solo con tu permiso;
- la app de iOS hay que recompilarla.

## F · Pendiente o simplificado (sin esconder nada)
- **Falta subir los protocolos y publicar la app.** Las reglas ya están publicadas, pero `protocolos/` está vacío hasta que Sebastián corra `npm run protocolos:subir` con su cuenta del equipo. Recién después se puede publicar el sitio principal; antes, la Biblioteca quedaría vacía.
- **Firebase sin Blaze no impide crear la cuenta** con un correo UC sin invitación: la cuenta existe en Auth, pero las reglas no le dan nada. La app valida el código antes de crearla y borra la cuenta si la invitación falla.
- **El participante lee su propio documento `participantes/`** (grupo y código): la app lo necesita para registrar el uso. La unión código ↔ nombre (`identidades/`) es solo del equipo.
- **Variables de entorno:** en una app sin servidor las `VITE_*` se ven en el código y quedan fijas al compilar, así que los interruptores reales están en `config/piloto`. Las variables solo dan los valores iniciales. Por defecto el registro por invitación y el congelamiento quedan **apagados** hasta que empiece el piloto (activarlos hoy bloquearía a estudiantes UC actuales y las correcciones del juicio de expertos).
- **Rol paciente:** todavía no existe (módulo E). En las pruebas, «paciente» se probó como «sin cuenta».
- **Indicador:** definición propuesta (dos cifras); falta que la confirme el equipo de investigación.
- **Voz durante el estudio:** sigue encendida para los participantes (pendiente).
- **Cada lectura de Firestore cuesta una lectura más** (la regla consulta `config/piloto`).
- La portada pública muestra un paso de muestra y los títulos de los protocolos (`src/muestra.js`).
- `data.js` sigue en el repositorio (privado): no lo hagas público.
- **Error previo corregido:** dar «me sirve» o responder a una publicación sin respuestas fallaba en la regla del feed (lista vacía); lo mismo con el chat de las rondas.
- En el emulador, la tercera carga seguida en una misma pestaña deja colgada la consulta de protocolos (Chrome limita a 6 las conexiones HTTP/1.1 al emulador). Con pestañas nuevas todo carga bien. Producción usa HTTP/2 y no tiene ese límite, pero conviene mirarlo en el primer uso real.

## Lo que viene después (esbozo)
- **A · Base común:** roles estudiante, dentista, especialista, paciente y admin; verificación por correo institucional y por número de la Superintendencia (aprobado a mano); barra Inicio · Estudio · Casos · Comunidad · Perfil.
- **B · Estudio:** **bloqueado** hasta tener Storage (Blaze) y una función de servidor con la clave de IA. La regla de fuente (cada tarjeta dice de qué página salió) se valida en el servidor.
- **C · Casos simulados:** sirve la base del skill `caso` (anamnesis → examen → pruebas → diagnóstico → plan). Borrador → en revisión → publicado por un docente. La retroalimentación con IA necesita servidor.
- **D · Comunidad:** ya existe una buena parte (la Red: feed, casos con revisión, reels, preguntas). Faltan las insignias por rol y año, el docente supervisor obligatorio en los casos de estudiantes, «Reportar», borrar el EXIF (se hace en el navegador al comprimir) y fotos y videos (Storage).
- **E · Criterium Pacientes:** directorio solo de profesionales verificados; los comentarios nunca legibles para el rol paciente (en las reglas).
- **Stripe y límites de IA:** cuando exista el cobro; `BILLING_ENABLED=false` mientras tanto.
