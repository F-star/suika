import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  app,
  type BaseWindow,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
} from 'electron';

import {
  createDocumentSession,
  type DocumentSession,
  getDocumentSession,
} from './document-session';

const updateWindowTitle = (session: DocumentSession) => {
  BrowserWindow.fromWebContents(session.webContents)?.setTitle(session.title);
};

const createWindow = async () => {
  const window = new BrowserWindow({
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
  const session = createDocumentSession(window.webContents, updateWindowTitle);
  updateWindowTitle(session);

  const devServerUrl = process.env.SUIKA_DEV_SERVER_URL;
  if (devServerUrl) {
    await window.loadURL(devServerUrl);
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    await window.loadFile(
      path.join(process.resourcesPath, 'renderer/index.html'),
    );
  }
};

const sendRendererCommand = (
  window: BaseWindow | undefined,
  command: string,
) => {
  if (window instanceof BrowserWindow) {
    window.webContents.send('menu:command', command);
  }
};

const openTextFile = async (
  window: BrowserWindow,
  filters: Electron.FileFilter[],
) => {
  const result = await dialog.showOpenDialog(window, {
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

const saveDocument = async (
  session: DocumentSession,
  window: BrowserWindow,
  content: string,
  historyId: string,
  saveAs: boolean,
) => {
  let filePath = session.filePath;
  if (!filePath || saveAs) {
    const result = await dialog.showSaveDialog(window, {
      defaultPath: filePath ?? 'design.suika',
      filters: [{ name: 'Suika document', extensions: ['suika'] }],
    });
    if (result.canceled || !result.filePath) return null;
    filePath = result.filePath;
  }
  await writeFile(filePath, content, 'utf8');
  session.markSaved(filePath, historyId);
  return filePath;
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
            click: (_item, window) => sendRendererCommand(window, 'open'),
          },
          {
            label: 'Save',
            accelerator: 'CommandOrControl+S',
            click: (_item, window) => sendRendererCommand(window, 'save'),
          },
          {
            label: 'Save As…',
            accelerator: 'CommandOrControl+Shift+S',
            click: (_item, window) => sendRendererCommand(window, 'save-as'),
          },
          { type: 'separator' },
          { role: 'quit' },
        ],
      },
      { role: 'editMenu' },
      { role: 'windowMenu' },
    ]),
  );
  ipcMain.handle('document:open', async (event) => {
    const session = getDocumentSession(event.sender);
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!session || !window) return null;

    const file = await openTextFile(window, [
      { name: 'Suika document', extensions: ['suika'] },
    ]);
    if (file) session.open(file.path);
    return file;
  });
  ipcMain.handle('svg:open', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return null;
    return openTextFile(window, [{ name: 'SVG', extensions: ['svg'] }]);
  });
  ipcMain.handle(
    'document:save',
    (event, content: string, historyId: string, saveAs: boolean) => {
      const session = getDocumentSession(event.sender);
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!session || !window) return null;
      return saveDocument(session, window, content, historyId, saveAs);
    },
  );
  ipcMain.on('document:history-changed', (event, historyId: string) => {
    getDocumentSession(event.sender)?.setHistoryId(historyId);
  });
  ipcMain.on('document:loaded', (event, historyId: string) => {
    getDocumentSession(event.sender)?.markLoaded(historyId);
  });
  ipcMain.handle(
    'export:save',
    async (event, data: Uint8Array, suggestedName: string) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) return null;
      const result = await dialog.showSaveDialog(window, {
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
