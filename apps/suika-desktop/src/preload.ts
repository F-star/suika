import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('suikaDesktop', {
  openDocument: () => ipcRenderer.invoke('document:open'),
  openSvg: () => ipcRenderer.invoke('svg:open'),
  saveDocument: (content: string, historyId: string, saveAs: boolean) =>
    ipcRenderer.invoke('document:save', content, historyId, saveAs),
  setDocumentHistoryId: (historyId: string) =>
    ipcRenderer.send('document:history-changed', historyId),
  markDocumentLoaded: (historyId: string) =>
    ipcRenderer.send('document:loaded', historyId),
  saveExport: (data: Uint8Array, suggestedName: string) =>
    ipcRenderer.invoke('export:save', data, suggestedName),
  onMenuCommand: (callback: (command: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, command: string) =>
      callback(command);
    ipcRenderer.on('menu:command', handler);
    return () => ipcRenderer.removeListener('menu:command', handler);
  },
});
