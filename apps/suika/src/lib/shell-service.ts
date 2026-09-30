export interface TabInfo {
  id: string;
  title: string;
  isDirty: boolean;
  isActive: boolean;
}

export interface ShellState {
  tabs: TabInfo[];
  isHomeActive: boolean;
}

export interface RecentFile {
  path: string;
  name: string;
  /** Parent directory, with the home directory shortened to `~`. */
  directory: string;
  openedAt: number;
}

/** Exposed by the desktop host to the shell page (tab bar and Home) only. */
export interface ShellService {
  platform: string;
  getState(): Promise<ShellState>;
  onStateChange(callback: (state: ShellState) => void): () => void;
  activateHome(): void;
  activateTab(id: string): void;
  closeTab(id: string): void;
  newTab(): void;
  /** Shows the open dialog and opens the picked file in a tab. */
  openFile(): void;
  getRecentFiles(): Promise<RecentFile[]>;
  onRecentFilesChange(callback: () => void): () => void;
  openRecentFile(path: string): void;
  showRecentFileMenu(path: string): void;
}

declare global {
  interface Window {
    suikaShell?: ShellService;
  }
}

export const shellService = () => window.suikaShell;
