import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { app, BaseWindow, dialog, ipcMain, Menu } from 'electron';

import { AppWindow } from './app-window';
import { type DocumentSession, getDocumentSession } from './document-session';

const createWindow = () => {
  new AppWindow().openEditorTab();
};

const sendRendererCommand = (
  window: BaseWindow | undefined,
  command: string,
) => {
  AppWindow.fromBaseWindow(window)?.activeTab?.view.webContents.send(
    'menu:command',
    command,
  );
};

const getOwnerWindow = (webContents: Electron.WebContents) =>
  AppWindow.fromWebContents(webContents)?.window;

const openTextFile = async (
  window: BaseWindow,
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
  window: BaseWindow,
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
    const window = getOwnerWindow(event.sender);
    if (!session || !window) return null;

    const file = await openTextFile(window, [
      { name: 'Suika document', extensions: ['suika'] },
    ]);
    if (file) session.open(file.path);
    return file;
  });
  ipcMain.handle('svg:open', (event) => {
    const window = getOwnerWindow(event.sender);
    if (!window) return null;
    return openTextFile(window, [{ name: 'SVG', extensions: ['svg'] }]);
  });
  ipcMain.handle(
    'document:save',
    (event, content: string, historyId: string, saveAs: boolean) => {
      const session = getDocumentSession(event.sender);
      const window = getOwnerWindow(event.sender);
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
      const window = getOwnerWindow(event.sender);
      if (!window) return null;
      const result = await dialog.showSaveDialog(window, {
        defaultPath: suggestedName,
      });
      if (result.canceled || !result.filePath) return null;
      await writeFile(result.filePath, data);
      return result.filePath;
    },
  );

  ipcMain.handle(
    'shell:get-tabs',
    (event) => AppWindow.fromShell(event.sender)?.getTabInfos() ?? [],
  );
  ipcMain.on('shell:activate-tab', (event, id: string) => {
    AppWindow.fromShell(event.sender)?.activateTab(id);
  });

  createWindow();
  app.on('activate', () => {
    if (BaseWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
