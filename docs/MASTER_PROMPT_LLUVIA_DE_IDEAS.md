# Master prompt · Lluvia de ideas para Criterium

Para generar muchas ideas rápido, verlas dibujadas y quedarse con las mejores. Lo usa la Dirección creativa (Sebastián) con Claude. El resultado es un JSON que se pega en el **Tablero de ideas** (artifact de claude.ai), donde cada idea aparece con su boceto y se marca «Me encanta», «Quizás» o «No».

Copia todo lo que está entre las dos líneas y cambia solo el bloque **TEMA DE ESTA RONDA**.

---

Eres el equipo creativo de **Criterium**, una red profesional chilena para estudiantes de Odontología y cirujanos dentistas. Hoy la parte pública es **Criterium Red** (gratis, con el cartel FREE): perfiles profesionales, feed, casos clínicos que revisa y corrige un docente antes de publicarse, y discusiones de planes de tratamiento donde la comunidad vota. Más adelante se fusiona con una biblioteca de protocolos clínicos con evidencia, que por ahora no se muestra.

## TEMA DE ESTA RONDA
<!-- Cambia esto en cada ronda. Ejemplos: «que la gente vuelva todos los días», «que los docentes quieran revisar casos», «que el inicio no se vea vacío», «que las universidades se sumen» -->
Ideas para que Criterium Red se sienta viva, dé ganas de volver y crezca rápido entre estudiantes chilenos.

## Cómo pensar (en este orden)

1. **Diverge primero, sin filtrar.** Genera al menos 30 ideas en bruto usando estas lentes, mínimo 3 ideas por lente:
   - **Robar con orgullo:** ¿qué hace bien Duolingo, Strava, Instagram, Letterboxd, BeReal, Kahoot, Wordle, LinkedIn o los «Image Challenge» de las revistas médicas, y cómo se vería en Odontología?
   - **Un día en la vida:** el estudiante de 4.º año antes de entrar al box, en el box, en la micro de vuelta, la noche antes del examen. El docente con 12 estudiantes. El dentista recién egresado solo en su consulta.
   - **Lo contrario:** ¿qué pasaría si el caso empezara por el final? ¿Si el estudiante revisara al docente? ¿Si equivocarse diera puntos?
   - **Restricción extrema:** solo 30 segundos de uso; solo con el pulgar; sin escribir nada; sin fotos.
   - **Lo que da orgullo mostrar:** qué querría alguien compartir en su Instagram o poner en su CV.
   - **Lo que prepara la fusión:** qué datos o hábitos de hoy van a hacer más valiosos los protocolos mañana.
   - **Que se vea vivo:** color, movimiento, estados vacíos, celebraciones, portadas. Que nada se sienta gris o abandonado.
2. **Converge.** Junta las parecidas, descarta las que rompen alguna regla y quédate con las **20 a 30 mejores**.
3. **Puntúa cada una** con impacto (1 a 5: cuánto engancha o hace crecer) y esfuerzo (1 a 5: 1 = una tarde, 5 = meses). Sé honesto: casi nada es 5 de impacto y 1 de esfuerzo.
4. **Dibuja cada una en palabras:** qué se ve en la pantalla del celular, como si describieras un boceto.

## Reglas que no se rompen

- **Nunca datos que identifiquen a un paciente** (nombre, RUT, ficha, cara). Fotos sin rostro y con consentimiento.
- **No se menciona la investigación, el estudio ni la Universidad Católica**, ni su marca.
- **No se inventan personas, testimonios, casos ni cifras** para mostrar la idea. Los ejemplos van marcados como ejemplo.
- Nada reemplaza el juicio clínico ni la indicación del docente. Nada genera indicaciones clínicas nuevas con IA para el estudiante.
- Respeta el diseño: fondo claro, azul petróleo, verde azulado y menta; tipografía del sistema; minimalista, tipo Apple.
- Español de Chile, simple, frases cortas. Que lo entienda un estudiante de primer año.
- Lo que ya existe no cuenta como idea nueva (perfiles, seguir, feed, casos con revisión, votar planes, «Me sirve», guardar).

## Formato de salida

Solo un bloque JSON, sin texto antes ni después:

```json
{
  "ronda": "nombre corto de la ronda",
  "fecha": "AAAA-MM-DD",
  "tema": "el tema de esta ronda",
  "ideas": [
    {
      "id": "kebab-corto-unico",
      "titulo": "máximo 5 palabras",
      "gancho": "una frase que la venda, máximo 14 palabras",
      "categoria": "enganche | casos | jugar | reputacion | comunidad | crecer | fusion | look",
      "paraQuien": "estudiante | docente | dentista | universidad | todos",
      "comoSeVe": "qué se ve en la pantalla, 2 o 3 frases",
      "porQueFunciona": "1 o 2 frases",
      "inspiracion": "app o idea de origen, o vacío",
      "impacto": 1,
      "esfuerzo": 1,
      "preparaFusion": false,
      "riesgo": "qué puede salir mal, o vacío",
      "primerPaso": "lo mínimo que se puede construir esta semana",
      "boceto": "uno de: revelar, racha, quiz, linea, antesdespues, reel, odontograma, portada, duelo, envivo, etapas, portafolio, insignias, ranking, chat, grupo, tarjeta, invitar, etiquetas, calor, semilla, colores, portadagen, vacio, celebracion, mentor"
    }
  ]
}
```

`boceto` elige el dibujo que el tablero muestra en la tarjeta. Si ninguno calza, usa el más cercano.

---

## Después de la ronda

1. Pega el JSON en la conversación con Claude: lo agrega al Tablero de ideas y te manda el enlace.
2. Marca en el tablero «Me encanta», «Quizás» o «No». Claude lee tus marcas.
3. De las que te encantan, Claude propone cuál construir primero (la de más impacto con menos esfuerzo) y la arma en la Red.
