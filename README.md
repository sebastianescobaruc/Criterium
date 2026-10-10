# Criterium

Protocolos odontológicos con la evidencia a la vista, registro de casos clínicos y revisión por pares.

> Prototipo en desarrollo. Los protocolos son borradores sin revisión de especialista y no deben usarse como estándar de atención.

## Correr en local

Necesitas Node 18 o superior.

```bash
npm install
npm run dev
```

Abre http://localhost:5173.

## Compilar

```bash
npm run build
```

El resultado queda en `dist/` y se puede subir a cualquier hosting estático.

## Qué incluye

- Biblioteca con 3 protocolos completos y 5 planificados, modo box y PDF de box.
- Mis casos: fotos sin recorte, adherencia paso a paso, sesiones y controles, chequeo de evidencia, exportar en Markdown.
- Revisión: cola, puntajes de 1 a 5, aprobar, pedir cambios o denegar con reglas de evidencia.
- Calculadoras: periodontitis 2018, step-back de endodoncia, dosis máxima de lidocaína.
- Asistente (solo dentro de claude.ai), feed, postulación a revisor y contacto.

Los datos se guardan solo en el navegador. Detalles de arquitectura y próximos pasos en `CLAUDE.md`.

## Modo piloto START MEDUC

Los protocolos ya **no van dentro del código** de la app: viven en Firestore (`protocolos/`) y cada persona recibe solo lo que las reglas le permiten. El plan completo y lo que falta están en `docs/PLAN_MODULOS.md`.

### Primera vez (en este orden)
1. Publicar las reglas: `npx firebase deploy --only firestore:rules` (ya hecho el 7-10-2026).
2. Subir los protocolos: `npm run protocolos:subir`. Pide el correo y la contraseña de una cuenta del equipo (`admins/{uid}`), o los lee de `CRITERIUM_ADMIN_EMAIL` / `CRITERIUM_ADMIN_PASSWORD` en `.env.local`. Crea `config/piloto` si no existe.
3. Recién ahí publicar la app (`npm run deploy`). Si se publica antes, la Biblioteca queda vacía.

Cada vez que cambie `src/data.js`: `npm run pdfs` (si cambió el PDF de box) y `npm run protocolos:subir`. El script calcula la huella SHA-256 y no toca lo que no cambió. Si los protocolos del estudio están congelados, guarda el cambio como versión nueva sin publicar.

### Cómo se maneja
Todo desde **Piloto START** (barra lateral, «Equipo Criterium»):
- **Fecha de apertura** (por defecto 1-11-2027) y **Abrir todo**: abren los protocolos al grupo habitual y los módulos nuevos a todos.
- **Registro por invitación**: con correos de los dominios elegidos (`uc.cl`), la cuenta se crea solo con un código. Actívalo al empezar el piloto.
- **Módulos nuevos para participantes**: apagado = quien tiene grupo no ve el inicio social, la red ni los comentarios hasta la apertura.
- **Protocolos congelados**: los 5 del estudio no se editan. Actívalo después del juicio de expertos.
- **Participantes**: asignar grupo a una cuenta que ya existe (pide la fecha del consentimiento) o quitarla del piloto.
- **Invitaciones**: crear códigos por grupo, anotar quién firmó y cuándo (queda solo en `identidades/`).
- **Uso de protocolos**: el indicador del grupo criterium y **Exportar CSV** (código, grupo, sesión, tipo, protocolo y hora; nunca nombre, correo ni cuenta).

| Grupo | Protocolos antes de la apertura | Red y comentarios | Registro de uso |
|---|---|---|---|
| sin grupo | todos los publicados | sí | no |
| criterium | solo los 5 del estudio (y sus PDF) | no | sí |
| habitual | ninguno, ni sus PDF | no | sí (solo sesiones) |

### Probar
- `npm test`: pruebas de lógica (incluye el indicador y el CSV).
- `npm run test:reglas`: 17 pruebas de las reglas con usuarios de prueba en el emulador (sin cuenta, estudiante sin piloto, dentista, grupo criterium, grupo habitual, correo UC sin invitación, invitaciones, versión congelada y lo de siempre). Necesita Java 11 o más (`JAVA_HOME`).
- Recorrer la app con usuarios ficticios: `npm run emuladores` en una terminal, `node tests-reglas/sembrar-emulador.mjs` en otra (crea 5 usuarios con la contraseña `prueba123`: estudiante@ficticio.cl, dentista@ficticio.cl, criterium@uc.cl, habitual@uc.cl, equipo@ficticio.cl, y la invitación `PRUEBA01`) y después `VITE_EMULADORES=true npm run dev`. Nunca toca el proyecto real.
