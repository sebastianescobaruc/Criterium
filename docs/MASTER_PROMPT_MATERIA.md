# Master prompt · Materia de Criterium

Instrucciones para escribir **una clase de Materia**: un HTML de estudio, interactivo y autocontenido, para estudiantes de Odontología de 4.° y 5.° año. Lo usa `npm run materia:noche` (un `claude -p` por clase) y también sirve para hacerlo a mano. Léelo entero antes de empezar.

## Qué recibes

Un JSON con la clase:

```json
{ "id": "kebab-case", "ramo": "geriatria", "titulo": "Título de la clase", "orden": 3,
  "archivos": ["materia/_entrada/<id>.txt", "…"], "nota": "lo que dejó dicho la etapa de ordenar" }
```

- `archivos` son el texto extraído de los PDF de la clase (presentaciones, transcripciones o apuntes de estudiantes). **Son solo la lista de temas.** No son una fuente y no se citan.
- El ramo y su paleta están en `materia/ramos.json`.
- Las dos clases de referencia, ya revisadas, están en `materia/geriatria/`. Úsalas como plantilla de estructura, estilos y código: `oclusion-protesis-total.html` y `terminacion-instalacion-protesis-removible.html`.

## Qué entregas (solo estos archivos)

1. `materia/<ramo>/<id>.html`: la clase.
2. `materia/<ramo>/<id>.meta.json`: `{ "resumen": "una frase de 10 a 20 palabras", "orden": <orden> }`.
3. `materia/_reportes/<ramo>/<id>.md`: el informe (ver al final).

**No toques ningún otro archivo del proyecto.** Nada en `src/`, `scripts/`, `docs/`, `firestore.rules`, `package.json` ni en otras clases. Si algo te falta, anótalo en el informe.

## Regla 1 · Propiedad intelectual: texto propio, desde la literatura

El material de entrada viene de clases de una universidad y es de sus docentes. Por eso:

- **Escribe desde cero**, en tus palabras, a partir de las fuentes publicadas que encuentres. No copies frases, ejemplos, casos, tablas, esquemas ni el orden exacto de la clase. Usa la clase solo para saber qué temas cubrir y con qué profundidad.
- **Nunca nombres** la universidad (ni «UC», «PUC», «Pontificia», «la Católica»), la facultad, el código o la sigla del ramo (por ejemplo «GER», «CIA», «CIN»), ni a docentes, técnicos, ayudantes o estudiantes. Tampoco «Dr.» o «Dra.» seguidos de un apellido.
- **Sin frases que delaten el origen**: nada de «en clase», «el profesor dijo», «el apunte», «la transcripción», «así viene en el programa», «la clase anterior de…», «paciente del docente».
- Sin marcas comerciales, salvo que la fuente publicada las nombre y sean necesarias. En ese caso, di qué es el producto en términos genéricos.
- **Sin imágenes** de la clase ni de ningún otro lado. Los dibujos se hacen en SVG dentro del HTML.
- **Sin datos de pacientes**: ni nombres, ni iniciales, ni fotos, ni casos reales de la clase.

## Regla 2 · Evidencia: cada afirmación con su fuente

- **Cada afirmación clínica, cifra, definición discutible o recomendación lleva su fuente**: `<sup class="c"><a href="#fN">N</a></sup>` en el HTML, o `c(N)` dentro del JavaScript.
- **Solo fuentes que verificaste tú, en esta sesión.** Para todo lo que está en PubMed:
  - `node scripts/pubmed.mjs buscar "consulta en inglés"` para encontrar fuentes.
  - `node scripts/pubmed.mjs resumen PMID` para **leer el resumen antes de citar**.
  - `node scripts/pubmed.mjs cita PMID` para copiar la cita exacta, con autores, año, volumen, páginas y DOI.
  - `node scripts/pubmed.mjs pmc PMID "palabra"` para buscar una cifra en el texto completo, si el artículo es libre.
  - La afirmación tiene que estar en lo que leíste. **Nunca escribas un PMID, DOI, autor, año o título de memoria.**
- Documentos oficiales (MINSAL, OMS, guías de sociedades científicas): solo si abriste el documento con WebFetch o lo descargaste y leíste la parte que citas. Enlaza la URL exacta.
- **Jerarquía.** Prefiere, en este orden:
  1. guías de práctica clínica y revisiones sistemáticas
  2. ensayos aleatorizados
  3. estudios clínicos observacionales
  4. estudios in vitro y revisiones narrativas

  Si solo hay evidencia in vitro, dilo: «en laboratorio».
- **Lo que no tiene fuente:**
  - Si es una indicación clínica razonable y de uso común sin estudio que la compare, se deja con la etiqueta `<span class="tag sinev">Práctica habitual · sin estudio que la compare</span>`. Úsala con moderación: no más de 1 de cada 5 afirmaciones.
  - Una cifra concreta (temperaturas, tiempos, ángulos, porcentajes, dosis) sin fuente **se elimina**. Explica el principio sin la cifra, o di que el valor lo indica el fabricante.
  - Si la clase afirma algo que la evidencia contradice, **escribe lo que dice la evidencia**. En el HTML, preséntalo como «Lo que dice la evidencia». En el informe, anota la diferencia.
- **Dosis, fármacos e indicaciones terapéuticas:** solo con fuente de guía, ficha técnica oficial o revisión sistemática. Si no la encuentras, sácalo y anótalo como pendiente en el informe.
- Mínimo **8 fuentes** por clase. Sin máximo, pero cada una tiene que usarse.

## Regla 3 · Formato del HTML

Copia la arquitectura de las clases de referencia de `materia/geriatria/`:

- `<!doctype html>`, `<html lang="es">`, `<meta charset>`, `<meta viewport>` y un `<title>` con el título de la clase.
- Un comentario de cabecera como el de la referencia.
- Todo inline: CSS en `<style>` y JS en un `<script>` al final. **Sin recursos externos**: nada de `<script src>`, Google Fonts, CDN, `@import` ni imágenes externas. Tipografía: `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif`.
- **Solo tema claro** (`color-scheme: light`), sin bloques oscuros.
- **Paleta del ramo** desde `materia/ramos.json`, en los tokens de la referencia:
  - `--acr` = `acento`
  - `--acr-soft` = `suave`
  - `--bg` = `fondo`
  - `--ink` = `texto`
  - `--malva` = `detalle` (números de las citas)
  - `--malva-soft` = `detalleSuave`

  El resto de los tokens (`--ok`, `--warn`, `--bad`, hueso, diente, encía) se mantiene igual que en la referencia. Nada de rojo como color de marca: el rojo es solo para errores o marcas clínicas, como el papel de articular.
- **Cabecera:**
  - un rótulo «Ramo · Tema»
  - el `<h1>`
  - un párrafo `lead`
  - la fila `.meta` exactamente así: `<span>Criterium · Materia</span><span>v1.0 · D de mes de AAAA</span><span>N fuentes</span><span class="rev">Sin revisión de especialista todavía</span>`

    La fecha es la de hoy, y N es el número real de fuentes.
  - objetivos en `.goal`
  - un mapa SVG de los temas, donde cada nodo lleva a su sección
- **Índice fijo** (`nav.toc`) con una pastilla por sección, más «Autoevaluación» y «Fuentes».
- **Secciones** (`<section id="s-…">`) con explicación breve y, en cada una, al menos un **«banco» interactivo** que enseñe de verdad. Por ejemplo:
  - un esquema SVG que cambia con botones
  - un paso a paso con «Anterior / Siguiente»
  - un deslizador que muestra un efecto
  - un clasificador «sí / no»
  - tarjetas con la causa oculta
  - una lista de chequeo

  Los dibujos son esquemas didácticos, rotulados «no a escala» si corresponde.
- **Autoevaluación** al final: de 8 a 12 preguntas de opción única. Cada una muestra el porqué y su fuente (`f:[N]`).
- **Fuentes** (`<section id="fuentes">`):
  - Una `<ol class="refs">` con `<li id="fN">` en formato Vancouver.
  - Enlaces `<a href="https://doi.org/…" target="_blank" rel="noopener">DOI</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/PMID/" target="_blank" rel="noopener">PubMed</a>`: DOI solo si existe, y PubMed siempre que esté en PubMed.
  - Los números van seguidos y en orden de primera aparición. Toda fuente listada se cita, y toda cita tiene su fuente.
  - Pie: «Criterium · Materia de <Ramo>. Texto propio, escrito desde las fuentes citadas. Es material de estudio: no reemplaza el juicio clínico ni las indicaciones de tu docente.»
- **Navegación interna sin `href` que navegue**: la clase se ve dentro de un iframe aislado. Copia de la referencia:
  - la función `go(id)`, que usa `window.scrollTo`; **nunca `scrollIntoView`**, porque movería la página de Criterium
  - el manejador de clics para `a[href^="#"]`
- **Prohibido:** `localStorage`, `sessionStorage`, `alert`, `confirm`, `prompt`, `eval` y formularios que envíen datos.
- **Debe funcionar a 390 px de ancho sin desplazamiento horizontal de la página.** Un SVG ancho va dentro de `.svgbox` con su propio desplazamiento.
- Respeta «reducir movimiento» (`prefers-reduced-motion`).
- **Idioma:** español de Chile, simple y directo, que lo entienda un estudiante de primer año clínico. Frases cortas. Los tecnicismos se dejan y se explican en la misma frase.

## Regla 4 · Contenido

- Cubre los temas de la clase, ni más ni menos, pero **corrige con la evidencia**.
- Distingue lo que tiene buena evidencia, lo que está en discusión y lo que es práctica habitual.
- Si hay controversia, muéstrala con sus fuentes, por ejemplo con tarjetas «a favor / en contra».
- Tamaño razonable: entre 30 y 120 KB de HTML.

## Antes de terminar: valida

```
node scripts/validar-materia.mjs materia/<ramo>/<id>.html --navegador
```

Corrige todo lo que marque como **error** y vuelve a correrlo hasta que diga `OK`. Los **avisos** revísalos y corrígelos si corresponde.

## El informe (`materia/_reportes/<ramo>/<id>.md`)

```
# <Título> · informe de fuentes
- Archivos de entrada: …
- Fuentes: N (PubMed: n, documentos oficiales: n)
- Afirmaciones marcadas «práctica habitual»: n (lístalas)
- Cifras de la clase que se eliminaron por no tener fuente: …
- Diferencias con la clase (lo que la evidencia corrigió): …
- Temas de la clase que no se cubrieron y por qué: …
- Pendientes para el revisor humano: …
```

Termina tu respuesta con una sola línea: `RESULTADO: OK <ruta del html>` o `RESULTADO: FALLA <motivo>`.
