import { contextBridge, ipcRenderer } from 'electron';

import type { TabInfo } from './app-window';

contextBridge.exposeInMainWorld('suikaShell', {
  platform: process.platform,
  getTabs: (): Promise<TabInfo[]> => ipcRenderer.invoke('shell:get-tabs'),
  activateTab: (id: string) => ipcRenderer.send('shell:activate-tab', id),
  closeTab: (id: string) => ipcRenderer.send('shell:close-tab', id),
  newTab: () => ipcRenderer.send('shell:new-tab'),
  onTabsChange: (callback: (tabs: TabInfo[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, tabs: TabInfo[]) =>
      callback(tabs);
    ipcRenderer.on('tabs:changed', handler);
    return () => ipcRenderer.removeListener('tabs:changed', handler);
  },
});
