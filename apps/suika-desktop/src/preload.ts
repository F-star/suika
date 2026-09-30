import { contextBridge, ipcRenderer } from 'electron';

import type { DocumentContent } from './document-session';

contextBridge.exposeInMainWorld('suikaDesktop', {
  openDocument: () => ipcRenderer.invoke('document:open'),
  getInitialDocument: () => ipcRenderer.invoke('document:get-initial'),
  openSvg: () => ipcRenderer.invoke('svg:open'),
  saveDocument: (content: string, historyId: string, saveAs: boolean) =>
    ipcRenderer.invoke('document:save', content, historyId, saveAs),
  setDocumentHistoryId: (historyId: string) =>
    ipcRenderer.send('document:history-changed', historyId),
  markDocumentLoaded: (historyId: string) =>
    ipcRenderer.send('document:loaded', historyId),
  saveExport: (data: Uint8Array, suggestedName: string) =>
    ipcRenderer.invoke('export:save', data, suggestedName),
  onContentRequest: (provider: () => DocumentContent) => {
    const handler = (_event: Electron.IpcRendererEvent, requestId: number) =>
      ipcRenderer.send('document:content', requestId, provider());
    ipcRenderer.on('document:content-request', handler);
    return () =>
      ipcRenderer.removeListener('document:content-request', handler);
  },
});
