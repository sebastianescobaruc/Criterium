# Voces naturales con Google Cloud Text-to-Speech

> La voz chilena (**Alejandra**, la voz por defecto) se genera con Azure: mira `docs/VOZ_ALEJANDRA_AZURE.md`. Esta guía es para sumar, además, las voces de Google en español latino.

Criterium lee los pasos del modo guiado en voz alta. Con esta configuración usa las voces **Chirp 3 HD** de Google, que son las más naturales que ofrece, en lugar de las voces del sistema.

## Cómo funciona

- Los textos de los protocolos son fijos. Por eso los audios **se generan una sola vez** en tu computador con `npm run voces` y se publican junto con la app, en `public/voz/`.
- La app los reproduce directamente. **No hay servidor**, la clave **nunca llega al navegador** y escuchar no cuesta nada.
- Solo se paga al generar: un audio por texto y por voz. Si cambias un protocolo, `npm run voces` genera solo lo que cambió y borra lo que ya no se usa.
- La velocidad (Calma, Normal, Rápida) se aplica al reproducir, sin cambiar el tono de la voz.
- Si falta un audio o no hay conexión con el archivo, la app lee con la voz del sistema, como antes.

## Configuración (una sola vez, unos 10 minutos)

Se usa el mismo proyecto de Google que ya tiene Firebase (`criterium-e5d90`).

1. Entra a <https://console.cloud.google.com> con la cuenta dueña del proyecto de Firebase y elige el proyecto **criterium-e5d90** arriba a la izquierda.
2. **Facturación.** Menú › Facturación. Si el proyecto no tiene una cuenta de facturación vinculada, vincúlala. Google pide una tarjeta aunque el uso entre en el tramo gratuito mensual. Revisa los precios vigentes de Chirp 3 HD en la página de precios de Text-to-Speech antes de generar.
3. **Habilitar la API.** Menú › APIs y servicios › Biblioteca › busca «Cloud Text-to-Speech API» › Habilitar.
4. **Crear la clave.** Menú › APIs y servicios › Credenciales › Crear credenciales › Clave de API. Después, en la clave nueva: *Restricciones de API* › Restringir clave › marca solo **Cloud Text-to-Speech API** › Guardar.
5. En la carpeta del proyecto, crea (o abre) el archivo `.env.local` y agrega una línea:

   ```
   GOOGLE_TTS_API_KEY=la-clave-que-copiaste
   ```

   `.env.local` está en `.gitignore`: no se sube a git. **No pegues la clave en el código ni en un chat.**
6. Genera los audios:

   ```bash
   npm run voces
   ```

   La primera vez genera unos 190 textos por voz (unos 61.000 caracteres por voz). Por defecto usa dos voces en español latino (`es-US`): una femenina y una masculina.
7. Publica: `npm run deploy` (o el canal de vista previa). En la app, el botón «···» del modo guiado muestra primero las voces **Natural · …**.

## Elegir otras voces

Para ver las disponibles y elegir, agrega a `.env.local`:

```
VOCES_TTS=es-US-Chirp3-HD-Aoede,es-US-Chirp3-HD-Charon
```

Si escribes un nombre que no existe, `npm run voces` muestra la lista de las voces Chirp 3 HD disponibles para ese idioma. Para voces de España usa `IDIOMA_TTS=es-ES`. Google no tiene voces de Chile: para eso está Alejandra, con Azure.

## Si algo falla

- **403**: la API no está habilitada, el proyecto no tiene facturación o la clave está restringida a otra API.
- **«La clave no es válida»**: cópiala de nuevo desde Credenciales.
- Los textos que se leen están en `src/lectura.js`. Si cambias una frase ahí, vuelve a correr `npm run voces`.
