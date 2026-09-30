export interface DesktopFile {
  content: string;
  name: string;
}

export interface DesktopDocumentContent {
  content: string;
  historyId: string;
}

interface DesktopFileService {
  /** Lets the user pick a document and opens it in a new tab. */
  openDocument(): Promise<void>;
  /** Content of the file this tab was opened with, or null for a new document. */
  getInitialDocument(): Promise<string | null>;
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
  /** Answers the desktop host when it needs the document, e.g. to save it. */
  onContentRequest(provider: () => DesktopDocumentContent): () => void;
}

declare global {
  interface Window {
    suikaDesktop?: DesktopFileService;
  }
}

export const desktopFileService = () => window.suikaDesktop;
