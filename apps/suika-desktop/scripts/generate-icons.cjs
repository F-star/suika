/**
 * Regenerates resources/icon.png and resources/icon.icns from
 * resources/icon.svg. Run with Electron (`pnpm icons`), which rasterizes the
 * SVG; icon.icns needs macOS `iconutil`.
 *
 * icon.icns is committed instead of letting electron-builder convert
 * icon.png: its converter stores the 16px and 32px images in a form Finder
 * draws as noise.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { app, BrowserWindow } = require('electron');

const resourcesDir = path.join(__dirname, '../resources');
const svg = fs.readFileSync(path.join(resourcesDir, 'icon.svg'), 'utf8');

/** iconutil expects these names; every size is rendered from the SVG. */
const ICONSET = [16, 32, 128, 256, 512].flatMap((size) => [
  { name: `icon_${size}x${size}.png`, size },
  { name: `icon_${size}x${size}@2x.png`, size: size * 2 },
]);

/** Draws the SVG on a canvas in the page and returns it as PNG bytes. */
const renderPng = async (webContents, size) => {
  const dataUrl = await webContents.executeJavaScript(`(async () => {
    const image = new Image();
    image.src = ${JSON.stringify(
      `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    )};
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = ${size};
    canvas.getContext('2d').drawImage(image, 0, 0, ${size}, ${size});
    return canvas.toDataURL('image/png');
  })()`);
  return Buffer.from(dataUrl.split(',')[1], 'base64');
};

const generate = async () => {
  const window = new BrowserWindow({ show: false });
  await window.loadURL('about:blank');
  const { webContents } = window;

  fs.writeFileSync(
    path.join(resourcesDir, 'icon.png'),
    await renderPng(webContents, 1024),
  );

  if (process.platform !== 'darwin') {
    console.warn('Skipped icon.icns: iconutil is only available on macOS.');
    return;
  }
  const iconsetDir = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'suika-icon-')),
    'icon.iconset',
  );
  fs.mkdirSync(iconsetDir);
  try {
    for (const { name, size } of ICONSET) {
      fs.writeFileSync(
        path.join(iconsetDir, name),
        await renderPng(webContents, size),
      );
    }
    execFileSync('iconutil', [
      '--convert',
      'icns',
      iconsetDir,
      '--output',
      path.join(resourcesDir, 'icon.icns'),
    ]);
  } finally {
    fs.rmSync(path.dirname(iconsetDir), { recursive: true, force: true });
  }
};

app.dock?.hide();
app
  .whenReady()
  .then(generate)
  .then(
    () => app.quit(),
    (error) => {
      console.error(error);
      app.exit(1);
    },
  );
