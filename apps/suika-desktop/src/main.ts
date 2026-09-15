import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';

let mainWindow: BrowserWindow | undefined;
let documentPath: string | undefined;

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Suika',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const devServerUrl = process.env.SUIKA_DEV_SERVER_URL;
  if (devServerUrl) {
    await mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await mainWindow.loadFile(
      path.join(process.resourcesPath, 'renderer/index.html'),
    );
  }
};

const sendRendererCommand = (command: string) => {
  mainWindow?.webContents.send('menu:command', command);
};

const openTextFile = async (filters: Electron.FileFilter[]) => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters,
  });
  if (result.canceled || !result.filePaths[0]) return null;

  const filePath = result.filePaths[0];
  return {
    content: await readFile(filePath, 'utf8'),
    name: path.basename(filePath),
    path: filePath,
  };
};

const saveDocument = async (content: string, saveAs: boolean) => {
  if (!mainWindow) return null;
  if (!documentPath || saveAs) {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: documentPath ?? 'design.suika',
      filters: [{ name: 'Suika document', extensions: ['suika'] }],
    });
    if (result.canceled || !result.filePath) return null;
    documentPath = result.filePath;
  }
  await writeFile(documentPath, content, 'utf8');
  mainWindow.setTitle(`${path.basename(documentPath)} — Suika`);
  return documentPath;
};

app.whenReady().then(() => {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'File',
        submenu: [
          {
            label: 'Open…',
            accelerator: 'CommandOrControl+O',
            click: () => sendRendererCommand('open'),
          },
          {
            label: 'Save',
            accelerator: 'CommandOrControl+S',
            click: () => sendRendererCommand('save'),
          },
          {
            label: 'Save As…',
            accelerator: 'CommandOrControl+Shift+S',
            click: () => sendRendererCommand('save-as'),
          },
          { type: 'separator' },
          { role: 'quit' },
        ],
      },
      { role: 'editMenu' },
      { role: 'windowMenu' },
    ]),
  );
  ipcMain.handle('document:open', async () => {
    const file = await openTextFile([
      { name: 'Suika document', extensions: ['suika'] },
    ]);
    if (file) {
      documentPath = file.path;
      mainWindow?.setTitle(`${file.name} — Suika`);
    }
    return file;
  });
  ipcMain.handle('svg:open', () =>
    openTextFile([{ name: 'SVG', extensions: ['svg'] }]),
  );
  ipcMain.handle('document:save', (_event, content: string, saveAs: boolean) =>
    saveDocument(content, saveAs),
  );
  ipcMain.handle(
    'export:save',
    async (_event, data: Uint8Array, suggestedName: string) => {
      if (!mainWindow) return null;
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: suggestedName,
      });
      if (result.canceled || !result.filePath) return null;
      await writeFile(result.filePath, data);
      return result.filePath;
    },
  );

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
