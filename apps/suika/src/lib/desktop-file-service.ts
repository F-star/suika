export interface DesktopFile {
  content: string;
  name: string;
}

interface DesktopFileService {
  openDocument(): Promise<DesktopFile | null>;
  openSvg(): Promise<DesktopFile | null>;
  saveDocument(
    content: string,
    historyId: string,
    saveAs: boolean,
  ): Promise<string | null>;
  /** Sends the current undo/redo cursor to the desktop host for dirty tracking. */
  setDocumentHistoryId(historyId: string): void;
  /** Sets the current history cursor as the saved baseline after opening/creating. */
  markDocumentLoaded(historyId: string): void;
  saveExport(data: Uint8Array, suggestedName: string): Promise<string | null>;
  onMenuCommand(callback: (command: string) => void): () => void;
}

declare global {
  interface Window {
    suikaDesktop?: DesktopFileService;
  }
}

export const desktopFileService = () => window.suikaDesktop;
