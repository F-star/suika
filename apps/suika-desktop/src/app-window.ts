import { randomUUID } from 'node:crypto';
import path from 'node:path';

import {
  app,
  BaseWindow,
  type BaseWindowConstructorOptions,
  dialog,
  Menu,
  shell,
  type WebContents,
  WebContentsView,
} from 'electron';

import {
  createDocumentSession,
  type DocumentSession,
} from './document-session';

/** Keep in sync with the tab bar height in the shell renderer. */
const TAB_BAR_HEIGHT = 40;

const devServerUrl = process.env.SUIKA_DEV_SERVER_URL;

/**
 * Packaged builds get the icon from electron-builder; an unpackaged app would
 * show the default Electron icon.
 */
export const devIconPath = app.isPackaged
  ? undefined
  : path.join(__dirname, '../resources/icon.png');

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

/** Menu items that only apply to a document tab, not to Home. */
const DOCUMENT_MENU_ITEM_IDS = ['save', 'save-as'];

interface Tab {
  id: string;
  view: WebContentsView;
  session: DocumentSession;
}

const titleBarOptions: BaseWindowConstructorOptions =
  process.platform === 'darwin'
    ? { titleBarStyle: 'hidden', trafficLightPosition: { x: 14, y: 13 } }
    : {
        titleBarStyle: 'hidden',
        titleBarOverlay: {
          color: '#f5f5f5',
          symbolColor: '#404040',
          height: TAB_BAR_HEIGHT,
        },
      };

const createView = (preload: string) => {
  const view = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, preload),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  // Navigating away would discard the document, e.g. after dropping a file
  // or clicking a link. Web links open in the default browser instead.
  view.webContents.on('will-navigate', (event) => event.preventDefault());
  view.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  return view;
};

const loadRendererPage = (
  webContents: WebContents,
  page: 'index.html' | 'shell.html',
) => {
  if (devServerUrl) {
    return webContents.loadURL(new URL(page, devServerUrl).toString());
  }
  return webContents.loadFile(
    path.join(process.resourcesPath, 'renderer', page),
  );
};

const appWindows = new Set<AppWindow>();

/**
 * A native window made of a shell view (tab bar and Home, drawn at the bottom
 * and filling the window) and one editor view per tab stacked below the tab
 * bar. Only the active tab's editor view is visible; when Home is active, all
 * editor views are hidden and the shell's Home page shows through.
 */
export class AppWindow {
  static all() {
    return [...appWindows];
  }

  static fromBaseWindow(window: BaseWindow | undefined) {
    return AppWindow.all().find((appWindow) => appWindow.window === window);
  }

  /** Finds the window hosting the webContents, either as its shell or a tab. */
  static fromWebContents(webContents: WebContents) {
    return AppWindow.all().find(
      (appWindow) =>
        appWindow.isShell(webContents) ||
        appWindow.tabs.some((tab) => tab.view.webContents === webContents),
    );
  }

  static fromShell(webContents: WebContents) {
    return AppWindow.all().find((appWindow) => appWindow.isShell(webContents));
  }

  readonly window: BaseWindow;
  private readonly shellView: WebContentsView;
  private tabs: Tab[] = [];
  /** Undefined when Home is active. */
  private activeTabId: string | undefined;
  private closingTabIds = new Set<string>();
  private closeConfirmation: Promise<boolean> | undefined;
  private isCloseConfirmed = false;

  constructor() {
    this.window = new BaseWindow({
      width: 1440,
      height: 900,
      minWidth: 1024,
      minHeight: 700,
      title: 'Suika',
      icon: devIconPath,
      ...titleBarOptions,
    });
    this.shellView = createView('preload-shell.cjs');
    this.window.contentView.addChildView(this.shellView);
    loadRendererPage(this.shellView.webContents, 'shell.html');

    this.window.on('resize', () => this.layout());
    this.window.on('focus', () => this.updateMenuState());
    this.window.on('close', (event) => {
      if (this.isCloseConfirmed || !this.hasDirtyTabs()) return;
      event.preventDefault();
      this.confirmClose().then((confirmed) => {
        if (!confirmed) return;
        this.skipCloseConfirmation();
        this.window.close();
      });
    });
    this.window.on('closed', () => {
      appWindows.delete(this);
      // Views are not destroyed together with a BaseWindow.
      this.shellView.webContents.close();
      for (const tab of this.tabs) tab.view.webContents.close();
    });
    appWindows.add(this);
    this.layout();
  }

  get activeTab() {
    return this.tabs.find((tab) => tab.id === this.activeTabId);
  }

  findTabByPath(filePath: string) {
    return this.tabs.find((tab) => tab.session.filePath === filePath);
  }

  /** Opens an untitled document, or the document at filePath. */
  openEditorTab(filePath?: string) {
    const view = createView('preload.cjs');
    const tab: Tab = {
      id: randomUUID(),
      view,
      session: createDocumentSession(view.webContents, () =>
        this.handleTabsChange(),
      ),
    };
    this.tabs.push(tab);
    if (filePath) tab.session.open(filePath);
    this.window.contentView.addChildView(view);
    loadRendererPage(view.webContents, 'index.html');
    this.activateTab(tab.id);
    return tab;
  }

  activateTab(id: string) {
    if (!this.tabs.some((tab) => tab.id === id)) return;
    this.setActiveTabId(id);
  }

  activateHome() {
    this.setActiveTabId(undefined);
  }

  /**
   * Activates the tab `offset` positions away from the active one, wrapping
   * around. Home counts as the position before the first tab.
   */
  activateAdjacentTab(offset: number) {
    const ids = [undefined, ...this.tabs.map((tab) => tab.id)];
    const count = ids.length;
    const index = ids.indexOf(this.activeTabId);
    this.setActiveTabId(ids[(((index + offset) % count) + count) % count]);
  }

  /** Resolves false if the user canceled closing a tab with unsaved changes. */
  async closeTab(id: string) {
    const tab = this.tabs.find((tab) => tab.id === id);
    if (!tab || this.closingTabIds.has(id)) return false;

    this.closingTabIds.add(id);
    try {
      if (tab.session.isDirty) {
        this.activateTab(id);
        if (!(await this.confirmDiscardChanges(tab))) return false;
      }
      this.destroyTab(tab);
      return true;
    } finally {
      this.closingTabIds.delete(id);
    }
  }

  /**
   * Asks the user about every tab with unsaved changes. Resolves false if
   * any prompt was canceled. Does not close anything by itself.
   */
  confirmClose() {
    this.closeConfirmation ??= (async () => {
      try {
        for (const tab of this.tabs) {
          if (!tab.session.isDirty) continue;
          this.activateTab(tab.id);
          if (!(await this.confirmDiscardChanges(tab))) return false;
        }
        return true;
      } finally {
        this.closeConfirmation = undefined;
      }
    })();
    return this.closeConfirmation;
  }

  /** Lets the next window close proceed without asking about unsaved changes. */
  skipCloseConfirmation() {
    this.isCloseConfirmed = true;
  }

  getShellState(): ShellState {
    return {
      tabs: this.tabs.map((tab) => ({
        id: tab.id,
        title: tab.session.fileName,
        isDirty: tab.session.isDirty,
        isActive: tab.id === this.activeTabId,
      })),
      isHomeActive: this.activeTabId === undefined,
    };
  }

  sendToShell(channel: string, ...args: unknown[]) {
    if (!this.shellView.webContents.isDestroyed()) {
      this.shellView.webContents.send(channel, ...args);
    }
  }

  private hasDirtyTabs() {
    return this.tabs.some((tab) => tab.session.isDirty);
  }

  /** Resolves true if the tab may be closed: saved, or changes discarded. */
  private async confirmDiscardChanges(tab: Tab) {
    const { response } = await dialog.showMessageBox(this.window, {
      type: 'warning',
      message: `Do you want to save the changes you made to "${tab.session.fileName}"?`,
      detail: "Your changes will be lost if you don't save them.",
      buttons: ['Save', "Don't Save", 'Cancel'],
      defaultId: 0,
      cancelId: 2,
    });
    if (response === 0) return tab.session.save(this.window);
    return response === 1;
  }

  private destroyTab(tab: Tab) {
    const index = this.tabs.indexOf(tab);
    if (index === -1) return;

    this.tabs.splice(index, 1);
    this.window.contentView.removeChildView(tab.view);
    tab.view.webContents.close();

    if (this.tabs.length === 0) {
      this.activateHome();
    } else if (tab.id === this.activeTabId) {
      this.activateTab(this.tabs[Math.min(index, this.tabs.length - 1)].id);
    } else {
      this.handleTabsChange();
    }
  }

  private isShell(webContents: WebContents) {
    return this.shellView.webContents === webContents;
  }

  private setActiveTabId(id: string | undefined) {
    this.activeTabId = id;
    for (const tab of this.tabs) tab.view.setVisible(tab.id === id);
    this.layout();
    (this.activeTab?.view ?? this.shellView).webContents.focus();
    this.handleTabsChange();
  }

  private handleTabsChange() {
    this.window.setTitle(this.activeTab?.session.title ?? 'Suika');
    this.sendToShell('shell:state-changed', this.getShellState());
    this.updateMenuState();
  }

  /** The application menu is shared, so only the focused window updates it. */
  private updateMenuState() {
    if (!this.window.isFocused()) return;
    const menu = Menu.getApplicationMenu();
    for (const id of DOCUMENT_MENU_ITEM_IDS) {
      const item = menu?.getMenuItemById(id);
      if (item) item.enabled = !!this.activeTab;
    }
  }

  private layout() {
    const [width, height] = this.window.getContentSize();
    this.shellView.setBounds({ x: 0, y: 0, width, height });
    for (const tab of this.tabs) {
      tab.view.setBounds({
        x: 0,
        y: TAB_BAR_HEIGHT,
        width,
        height: height - TAB_BAR_HEIGHT,
      });
    }
  }
}
