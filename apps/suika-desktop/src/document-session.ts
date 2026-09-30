import { realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { type BaseWindow, dialog, type WebContents } from 'electron';

import { addRecentFile } from './recent-files';

export interface DocumentContent {
  content: string;
  historyId: string;
}

let nextContentRequestId = 0;
const pendingContentRequests = new Map<
  number,
  (content: DocumentContent | undefined) => void
>();

/** Resolves a request sent by DocumentSession.requestContent. */
export const resolveContentRequest = (
  requestId: number,
  content: DocumentContent,
) => {
  pendingContentRequests.get(requestId)?.(content);
};

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

  get fileName() {
    return this._filePath ? path.basename(this._filePath) : 'Untitled';
  }

  get isDirty() {
    return (
      this.currentHistoryId !== undefined &&
      this.currentHistoryId !== this.savedHistoryId
    );
  }

  get title() {
    return this.isDirty ? `${this.fileName} *` : this.fileName;
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

  /** Asks the renderer for the document and saves it. Resolves false if not saved. */
  async save(window: BaseWindow, saveAs = false) {
    const doc = await this.requestContent();
    if (!doc) return false;
    return (
      (await this.saveContent(window, doc.content, doc.historyId, saveAs)) !==
      null
    );
  }

  /** Resolves the saved path, or null if the save dialog was canceled. */
  async saveContent(
    window: BaseWindow,
    content: string,
    historyId: string,
    saveAs: boolean,
  ) {
    let filePath = this._filePath;
    if (!filePath || saveAs) {
      const result = await dialog.showSaveDialog(window, {
        defaultPath: filePath ?? 'design.suika',
        filters: [{ name: 'Suika document', extensions: ['suika'] }],
      });
      if (result.canceled || !result.filePath) return null;
      filePath = result.filePath;
    }
    await writeFile(filePath, content, 'utf8');
    this._filePath = await realpath(filePath);
    this.savedHistoryId = historyId;
    this.onChange(this);
    addRecentFile(this._filePath);
    return this._filePath;
  }

  /** Resolves undefined if the renderer is destroyed before replying. */
  private requestContent() {
    return new Promise<DocumentContent | undefined>((resolve) => {
      if (this.webContents.isDestroyed()) return resolve(undefined);

      const requestId = ++nextContentRequestId;
      const handleDestroyed = () => settle(undefined);
      const settle = (content: DocumentContent | undefined) => {
        pendingContentRequests.delete(requestId);
        this.webContents.off('destroyed', handleDestroyed);
        resolve(content);
      };
      pendingContentRequests.set(requestId, settle);
      this.webContents.once('destroyed', handleDestroyed);
      this.webContents.send('document:content-request', requestId);
    });
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
