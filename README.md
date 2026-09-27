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
