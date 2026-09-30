import path from 'node:path';

import type { WebContents } from 'electron';

/**
 * State of one document opened in one renderer (webContents): file path and
 * the undo/redo history cursors used for dirty tracking.
 */
export class DocumentSession {
  private _filePath: string | undefined;
  private currentHistoryId: string | undefined;
  private savedHistoryId: string | undefined;

  constructor(
    readonly webContents: WebContents,
    private readonly onChange: (session: DocumentSession) => void,
  ) {}

  get filePath() {
    return this._filePath;
  }

  get isDirty() {
    return (
      this.currentHistoryId !== undefined &&
      this.currentHistoryId !== this.savedHistoryId
    );
  }

  get title() {
    const fileName = this._filePath
      ? path.basename(this._filePath)
      : 'Untitled';
    return this.isDirty ? `${fileName} *` : fileName;
  }

  /** The history baseline is reset until the renderer reports it via markLoaded. */
  open(filePath: string) {
    this._filePath = filePath;
    this.currentHistoryId = undefined;
    this.savedHistoryId = undefined;
    this.onChange(this);
  }

  markLoaded(historyId: string) {
    this.currentHistoryId = historyId;
    this.savedHistoryId = historyId;
    this.onChange(this);
  }

  setHistoryId(historyId: string) {
    this.currentHistoryId = historyId;
    this.onChange(this);
  }

  markSaved(filePath: string, historyId: string) {
    this._filePath = filePath;
    this.savedHistoryId = historyId;
    this.onChange(this);
  }
}

const sessions = new Map<number, DocumentSession>();

export const createDocumentSession = (
  webContents: WebContents,
  onChange: (session: DocumentSession) => void,
) => {
  const session = new DocumentSession(webContents, onChange);
  const id = webContents.id;
  sessions.set(id, session);
  webContents.once('destroyed', () => sessions.delete(id));
  return session;
};

export const getDocumentSession = (webContents: WebContents) =>
  sessions.get(webContents.id);
