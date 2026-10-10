# Master prompt · Materia: ordenar el material

Primera etapa de `npm run materia:noche`. Recibes el inventario de los PDF de clases de 4.° y 5.° año y decides **qué clases de Materia se van a escribir**: cuáles hay, de qué ramo es cada una y con qué archivos. No escribes ninguna clase.

## Qué lees

- `materia/_inventario.tsv`: una línea por PDF, con estas columnas:
  - `id`
  - `ruta`: incluye las carpetas, que dicen año, semestre, ramo e interrogación
  - `paginas`
  - `letras_por_pagina`
  - `duplicado_de`
  - `inicio`: las primeras palabras del texto

  Léelo completo, por partes si es largo.
- `materia/ramos.json`: los ramos válidos. Usa **solo esos `id`**.
- Si necesitas ver más de un archivo para decidir, su texto está en `materia/_entrada/<id>.txt`. Léelo solo cuando haga falta.
- Las clases que ya existen están en `materia/<ramo>/*.html`. No las repitas.

## Cómo decidir

- **Una clase de Materia = un tema de clase.** Si el mismo tema está en varios archivos, se juntan en una sola clase con todos esos archivos. Por ejemplo: la presentación y la transcripción, el mismo PDF en dos carpetas, o la versión de 2025 y la de 2026.
- **Ramo:** por la carpeta y el contenido. Equivalencias:
  - CIA → `cia`
  - CIN y «niño» → `cin`
  - Cirugía bucal → `cirugia`
  - Patología oral y maxilofacial (también «Pato wolf») → `patologia`
  - Geriatría o «GER» → `geriatria`
  - NNEE → `nnee`
  - TTM → `ttm`
  - Imagenología → `imagenologia`
  - Ética → `etica`
  - Seminario en ciencias odontológicas → `seminario`

  Si un tema de CIA es claramente de un área (endodoncia, periodoncia, operatoria, prótesis fija), igual va en `cia`. El área se anota en el título.
- **Se descartan**, con su motivo:
  - `duplicado`: tiene `duplicado_de`, salvo que sea el archivo principal
  - `evaluacion`: pruebas, certámenes, pautas, rúbricas, retroalimentación («feedback»), preguntas de interrogación
  - `paper`: artículos científicos publicados, como «papers obligatorios». Anota el título si lo ves, porque puede servir como fuente.
  - `administrativo`: programa, calendario, horarios, reglamentos, listas
  - `sin-texto`: menos de 80 letras por página y sin otro archivo del mismo tema
  - `ya-existe`: el tema ya está en `materia/<ramo>/`
  - `resumen-general`: resúmenes de varias clases hechos por estudiantes. Si el resumen trae una clase que no está en otro archivo, úsalo como archivo de esa clase en vez de descartarlo.
  - `fuera-de-alcance`: no es odontología clínica, o es material personal (fichas de pacientes, casos con datos)
- **Título:** tuyo, claro y neutro, en español de Chile, de 3 a 9 palabras. Sin siglas del ramo, sin «Clase 3», sin nombres de docentes ni de la universidad. Ejemplo: «Manejo de la lesión de caries».
- **Id:** en kebab-case, sin tildes, único dentro del ramo, de 3 a 6 palabras. Ejemplo: `manejo-lesion-caries`.
- **Orden:** el orden lógico dentro del ramo, siguiendo el número de clase y la secuencia de las carpetas (I1 antes que I2, primer semestre antes que segundo).

## Qué escribes

Un solo archivo: `materia/plan.json`. No toques ningún otro.

```json
{
  "creado": "AAAA-MM-DD",
  "clases": [
    { "id": "manejo-lesion-caries", "ramo": "cia", "titulo": "Manejo de la lesión de caries", "orden": 10,
      "archivos": ["materia/_entrada/724281672e36.txt"], "nota": "presentación + transcripción del mismo tema" }
  ],
  "descartados": [
    { "id": "3635bdfb6027", "ruta": "…", "motivo": "administrativo", "detalle": "instructivo de ficha clínica en software" }
  ]
}
```

- Cada `id` del inventario tiene que aparecer **una vez**: o en los `archivos` de una clase (como `materia/_entrada/<id>.txt`) o en `descartados`.
- Ordena `clases` por ramo y luego por orden.

Al terminar, revisa con `node -e "JSON.parse(require('fs').readFileSync('materia/plan.json','utf8'))"` que el JSON sea válido. Termina tu respuesta con `RESULTADO: OK <n clases> clases, <n descartados> descartados` o `RESULTADO: FALLA <motivo>`.
