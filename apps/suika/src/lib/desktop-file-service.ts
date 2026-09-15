export interface DesktopFile {
  content: string;
  name: string;
}

interface DesktopFileService {
  openDocument(): Promise<DesktopFile | null>;
  openSvg(): Promise<DesktopFile | null>;
  saveDocument(content: string, saveAs: boolean): Promise<string | null>;
  saveExport(data: Uint8Array, suggestedName: string): Promise<string | null>;
  onMenuCommand(callback: (command: string) => void): () => void;
}

declare global {
  interface Window {
    suikaDesktop?: DesktopFileService;
  }
}

export const desktopFileService = () => window.suikaDesktop;
