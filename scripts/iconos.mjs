// Genera los íconos de la app desde los SVG de marca/ (logo «El punto de criterio», 2026-10-11).
// Uso: npm run iconos
//  - public/favicon.svg ............ la ficha redondeada (pestaña del navegador)
//  - public/icons/icon-192|512.png . ficha redondeada con fondo transparente (purpose any)
//  - public/icons/icon-maskable-512  a sangre, el sistema la recorta (purpose maskable; la marca queda dentro del 80 % seguro)
//  - public/icons/icon-180|1024.png  a sangre (iPhone redondea solo)
//  - ios/…/AppIcon-512@2x.png ...... 1024 a sangre y sin canal alfa (lo exige el App Store)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const raiz = fileURLToPath(new URL('..', import.meta.url));
const leer = (f) => fs.readFileSync(raiz + 'marca/' + f, 'utf8');
const ficha = leer('criterium-favicon.svg');
const sangre = leer('criterium-icono-app.svg');

fs.writeFileSync(raiz + 'public/favicon.svg', ficha);

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const pag = await nav.newPage();
async function png(svg, lado, salida, transparente) {
  await pag.setViewport({ width: lado, height: lado, deviceScaleFactor: 1 });
  await pag.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${lado}" height="${lado}" style="display:block" `)}</body></html>`);
  await pag.screenshot({ path: salida, omitBackground: transparente, clip: { x: 0, y: 0, width: lado, height: lado } });
  console.log('✓', salida.replace(raiz, ''));
}
const ic = raiz + 'public/icons/';
await png(ficha, 192, ic + 'icon-192.png', true);
await png(ficha, 512, ic + 'icon-512.png', true);
await png(sangre, 512, ic + 'icon-maskable-512.png', false);
await png(sangre, 180, ic + 'icon-180.png', false);
await png(sangre, 1024, ic + 'icon-1024.png', false);
await nav.close();

// iOS: sin canal alfa (sips lo quita al pasar por BMP, sin pérdida)
const ios = raiz + 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png';
if (fs.existsSync(ios)) {
  const tmp = raiz + 'public/icons/.tmp.bmp';
  execFileSync('sips', ['-s', 'format', 'bmp', ic + 'icon-1024.png', '--out', tmp], { stdio: 'ignore' });
  execFileSync('sips', ['-s', 'format', 'png', tmp, '--out', ios], { stdio: 'ignore' });
  fs.unlinkSync(tmp);
  console.log('✓', ios.replace(raiz, ''), execFileSync('sips', ['-g', 'hasAlpha', ios]).toString().trim().split('\n').pop().trim());
}
