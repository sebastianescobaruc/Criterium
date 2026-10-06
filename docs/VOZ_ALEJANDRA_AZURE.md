# Alejandra, la voz chilena de Criterium

Alejandra lee los pasos del modo guiado con acento chileno neutro. Es la voz por defecto de la app: aparece primera en «···» como **Alejandra · voz chilena**.

## De dónde sale

- Ni Apple, ni Chrome, ni Google Cloud tienen una voz de Chile. **Azure AI Speech (Microsoft) sí**: su voz neural `es-CL-CatalinaNeural`, una voz femenina nativa de Chile. En Criterium se llama Alejandra.
- Funciona igual que las voces de Google:
  - Los audios **se generan una sola vez** en tu computador con `npm run voces` y se publican con la app en `public/voz/es-CL-Alejandra/`.
  - La app los reproduce sin servidor, la clave **nunca llega al navegador** y escuchar no cuesta nada.
  - Funciona sin internet en el box.
- Si falta un audio, la app lee con la voz del sistema (Paulina, Mónica u otra).

## Costo

El plan gratis de Azure (**F0**) trae **500 000 caracteres al mes**. Generar todos los protocolos son unos **55 000 caracteres**. Después, `npm run voces` solo genera los textos que cambiaron. Con el plan gratis no se paga nada.

El plan gratis permite **20 audios por minuto**. La primera vez el script tarda unos **13 minutos** y avisa cuánto falta. Deja la terminal abierta.

## Configuración (una sola vez, unos 15 minutos)

1. **Cuenta.** Entra a <https://portal.azure.com>. Si no tienes cuenta, crea una gratis con «Comenzar gratis». Azure pide una tarjeta para verificar tu identidad, pero el recurso **F0** no cobra.
2. **Crear el recurso de voz.**
   - Arriba, en el buscador, escribe **«Voz»** (en inglés: *Speech services*). Abre **Servicios de voz › Crear**.
   - **Suscripción:** la tuya.
   - **Grupo de recursos:** crea uno nuevo, por ejemplo `criterium`.
   - **Región:** **East US** (`eastus`). Tiene las voces de Chile.
   - **Nombre:** por ejemplo `criterium-voz`.
   - **Plan de tarifa:** **Free F0**. Es importante: así no se cobra.
   - **Revisar y crear › Crear.** Espera a que diga «La implementación se completó».
3. **Copiar la clave.**
   - Abre el recurso **› Administración de recursos › Claves y punto de conexión**.
   - Copia la **CLAVE 1** y la **Ubicación/Región** (por ejemplo `eastus`).
4. **Guardarla en el proyecto.** En la carpeta del proyecto, abre (o crea) el archivo `.env.local` y agrega dos líneas:

   ```
   AZURE_SPEECH_KEY=la-clave-que-copiaste
   AZURE_SPEECH_REGION=eastus
   ```

   - `.env.local` está en `.gitignore`: no se sube a git.
   - **No pegues la clave en el código ni en un chat.**
   - Sin el prefijo `VITE_`, a propósito: así nunca llega al navegador.
5. **Generar los audios.**

   ```bash
   npm run voces
   ```

   - Si también tienes `GOOGLE_TTS_API_KEY`, genera Alejandra y las voces de Google.
   - Si no, genera solo Alejandra.
6. **Escucharla.**
   - Corre `npm run dev`, abre un protocolo y entra al modo guiado.
   - En «···», Alejandra aparece primera y elegida. Toca **Probar**.
7. **Publicar:** `npm run deploy` (o el canal de vista previa).

## Ajustes

- **Otra voz de Chile.** Azure también tiene `es-CL-LorenzoNeural` (masculina). Para usarla, agrega `AZURE_VOZ=es-CL-LorenzoNeural` a `.env.local` y borra la carpeta `public/voz/es-CL-Alejandra/` antes de correr `npm run voces`. Si eliges una voz que no existe en tu región, el script muestra las voces de Chile disponibles.
- **Plan pagado.** Con un plan pagado de Azure (S0), `AZURE_RAPIDO=1` quita la pausa entre audios.
- **Ritmo y velocidad.** Alejandra lee apenas más pausado (`prosody rate -4 %`) para entenderse bien con el ruido del box. La velocidad Calma, Normal o Rápida de la app se aplica al reproducir, sin cambiar el tono.

## Si algo falla

- **401:** la clave o la región no coinciden. Copia de nuevo la «CLAVE 1» y la «Ubicación/Región» del mismo recurso.
- **403:** el recurso no es de «Voz» o no está activo.
- **«Esta región no tiene voces de Chile»:** crea el recurso en **East US**.
- **Se demora:** es normal en el plan gratis (20 audios por minuto). Si cortas el script, al volver a correrlo sigue donde quedó.
- Los textos que se leen están en `src/lectura.js` y en `src/data.js`. Si cambian, vuelve a correr `npm run voces`.
