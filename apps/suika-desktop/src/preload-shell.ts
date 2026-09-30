import { contextBridge, ipcRenderer } from 'electron';

import type { ShellState } from './app-window';
import { handleFileDrops } from './file-drop';

const subscribe = <T extends unknown[]>(
  channel: string,
  callback: (...args: T) => void,
) => {
  const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
    callback(...(args as T));
  ipcRenderer.on(channel, handler);
  return () => {
    ipcRenderer.removeListener(channel, handler);
  };
};

contextBridge.exposeInMainWorld('suikaShell', {
  platform: process.platform,
  getState: (): Promise<ShellState> => ipcRenderer.invoke('shell:get-state'),
  onStateChange: (callback: (state: ShellState) => void) =>
    subscribe('shell:state-changed', callback),
  activateHome: () => ipcRenderer.send('shell:activate-home'),
  activateTab: (id: string) => ipcRenderer.send('shell:activate-tab', id),
  closeTab: (id: string) => ipcRenderer.send('shell:close-tab', id),
  newTab: () => ipcRenderer.send('shell:new-tab'),
  openFile: () => ipcRenderer.send('shell:open-file'),
  getRecentFiles: () => ipcRenderer.invoke('recent:list'),
  onRecentFilesChange: (callback: () => void) =>
    subscribe('recent:changed', callback),
  openRecentFile: (filePath: string) =>
    ipcRenderer.send('recent:open', filePath),
  showRecentFileMenu: (filePath: string) =>
    ipcRenderer.send('recent:show-menu', filePath),
});

handleFileDrops();
