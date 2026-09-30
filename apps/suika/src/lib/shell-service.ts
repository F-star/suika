export interface TabInfo {
  id: string;
  title: string;
  isDirty: boolean;
  isActive: boolean;
}

/** Exposed by the desktop host to the shell page (tab bar) only. */
interface ShellService {
  platform: string;
  getTabs(): Promise<TabInfo[]>;
  activateTab(id: string): void;
  closeTab(id: string): void;
  newTab(): void;
  onTabsChange(callback: (tabs: TabInfo[]) => void): () => void;
}

declare global {
  interface Window {
    suikaShell?: ShellService;
  }
}

export const shellService = () => window.suikaShell;
