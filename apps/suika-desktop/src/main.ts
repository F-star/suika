import { readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  app,
  BaseWindow,
  dialog,
  ipcMain,
  Menu,
  type MenuItemConstructorOptions,
} from 'electron';

import { AppWindow } from './app-window';
import {
  type DocumentContent,
  getDocumentSession,
  resolveContentRequest,
} from './document-session';

const SUIKA_FILE_FILTERS = [{ name: 'Suika document', extensions: ['suika'] }];

const createWindow = () => {
  const appWindow = new AppWindow();
  appWindow.openEditorTab();
  return appWindow;
};

const getOwnerWindow = (webContents: Electron.WebContents) =>
  AppWindow.fromWebContents(webContents)?.window;

/** Opens the file in a new tab, or focuses the tab where it is already open. */
const openDocumentPath = async (
  appWindow: AppWindow | undefined,
  filePath: string,
) => {
  try {
    filePath = await realpath(filePath);
    // Validate before creating a tab, so an unreadable file cannot end up as
    // an empty document that overwrites it on save.
    JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    const options = {
      type: 'error' as const,
      message: `Could not open "${path.basename(filePath)}".`,
      detail: String(error),
    };
    if (appWindow) dialog.showMessageBox(appWindow.window, options);
    else dialog.showMessageBox(options);
    return;
  }

  for (const existingWindow of AppWindow.all()) {
    const tab = existingWindow.findTabByPath(filePath);
    if (tab) {
      existingWindow.window.focus();
      existingWindow.activateTab(tab.id);
      return;
    }
  }
  (appWindow ?? new AppWindow()).openEditorTab(filePath);
};

const openDocument = async (appWindow: AppWindow | undefined) => {
  const options: Electron.OpenDialogOptions = {
    properties: ['openFile'],
    filters: SUIKA_FILE_FILTERS,
  };
  const result = appWindow
    ? await dialog.showOpenDialog(appWindow.window, options)
    : await dialog.showOpenDialog(options);
  if (result.canceled || !result.filePaths[0]) return;
  await openDocumentPath(appWindow, result.filePaths[0]);
};

const saveActiveTab = (window: BaseWindow | undefined, saveAs: boolean) => {
  const appWindow = AppWindow.fromBaseWindow(window);
  appWindow?.activeTab?.session.save(appWindow.window, saveAs);
};

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

const buildMenu = () => {
  const isMac = process.platform === 'darwin';
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' } as const] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CommandOrControl+N',
          click: (_item, window) => {
            const appWindow = AppWindow.fromBaseWindow(window);
            if (appWindow) appWindow.openEditorTab();
            else createWindow();
          },
        },
        {
          label: 'Open…',
          accelerator: 'CommandOrControl+O',
          click: (_item, window) =>
            openDocument(AppWindow.fromBaseWindow(window)),
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CommandOrControl+S',
          click: (_item, window) => saveActiveTab(window, false),
        },
        {
          label: 'Save As…',
          accelerator: 'CommandOrControl+Shift+S',
          click: (_item, window) => saveActiveTab(window, true),
        },
        { type: 'separator' },
        {
          label: 'Close Tab',
          accelerator: 'CommandOrControl+W',
          click: (_item, window) => {
            const appWindow = AppWindow.fromBaseWindow(window);
            const tab = appWindow?.activeTab;
            if (tab) appWindow.closeTab(tab.id);
          },
        },
        ...(isMac
          ? []
          : [{ type: 'separator' } as const, { role: 'quit' } as const]),
      ],
    },
    { role: 'editMenu' },
    ...(process.env.SUIKA_DEV_SERVER_URL
      ? [
          {
            label: 'View',
            submenu: [{ role: 'toggleDevTools' } as const],
          },
        ]
      : []),
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        {
          label: 'Select Next Tab',
          accelerator: 'Control+Tab',
          click: (_item, window) =>
            AppWindow.fromBaseWindow(window)?.activateAdjacentTab(1),
        },
        {
          label: 'Select Previous Tab',
          accelerator: 'Control+Shift+Tab',
          click: (_item, window) =>
            AppWindow.fromBaseWindow(window)?.activateAdjacentTab(-1),
        },
        { type: 'separator' },
        { role: 'close', accelerator: 'CommandOrControl+Shift+W' },
        ...(isMac ? [{ role: 'front' } as const] : []),
      ],
    },
  ];
  return Menu.buildFromTemplate(template);
};

let isQuitConfirmed = false;

app.on('before-quit', (event) => {
  if (isQuitConfirmed) return;
  event.preventDefault();
  (async () => {
    const appWindows = AppWindow.all();
    for (const appWindow of appWindows) {
      if (!(await appWindow.confirmClose())) return;
    }
    for (const appWindow of appWindows) appWindow.skipCloseConfirmation();
    isQuitConfirmed = true;
    app.quit();
  })();
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(buildMenu());

  ipcMain.handle('document:open', (event) =>
    openDocument(AppWindow.fromWebContents(event.sender)),
  );
  ipcMain.handle('document:get-initial', async (event) => {
    const filePath = getDocumentSession(event.sender)?.filePath;
    return filePath ? readFile(filePath, 'utf8') : null;
  });
  ipcMain.on(
    'document:content',
    (_event, requestId: number, content: DocumentContent) =>
      resolveContentRequest(requestId, content),
  );
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
      return session.saveContent(window, content, historyId, saveAs);
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
  ipcMain.on('shell:close-tab', (event, id: string) => {
    AppWindow.fromShell(event.sender)?.closeTab(id);
  });
  ipcMain.on('shell:new-tab', (event) => {
    AppWindow.fromShell(event.sender)?.openEditorTab();
  });

  createWindow();
  app.on('activate', () => {
    if (BaseWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
