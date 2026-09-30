import { randomUUID } from 'node:crypto';
import path from 'node:path';

import {
  BaseWindow,
  type BaseWindowConstructorOptions,
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

export interface TabInfo {
  id: string;
  title: string;
  isDirty: boolean;
  isActive: boolean;
}

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

const createView = (preload: string) =>
  new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, preload),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

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
 * A native window made of a shell view (tab bar, drawn at the bottom and
 * filling the window) and one editor view per tab stacked below the tab bar.
 * Only the active tab's editor view is visible.
 */
export class AppWindow {
  static fromBaseWindow(window: BaseWindow | undefined) {
    for (const appWindow of appWindows) {
      if (appWindow.window === window) return appWindow;
    }
  }

  /** Finds the window hosting the webContents, either as its shell or a tab. */
  static fromWebContents(webContents: WebContents) {
    for (const appWindow of appWindows) {
      if (
        appWindow.isShell(webContents) ||
        appWindow.tabs.some((tab) => tab.view.webContents === webContents)
      ) {
        return appWindow;
      }
    }
  }

  static fromShell(webContents: WebContents) {
    for (const appWindow of appWindows) {
      if (appWindow.isShell(webContents)) return appWindow;
    }
  }

  readonly window: BaseWindow;
  private readonly shellView: WebContentsView;
  private tabs: Tab[] = [];
  private activeTabId: string | undefined;

  constructor() {
    this.window = new BaseWindow({
      width: 1440,
      height: 900,
      minWidth: 1024,
      minHeight: 700,
      title: 'Suika',
      ...titleBarOptions,
    });
    this.shellView = createView('preload-shell.cjs');
    this.window.contentView.addChildView(this.shellView);
    loadRendererPage(this.shellView.webContents, 'shell.html');

    this.window.on('resize', () => this.layout());
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

  openEditorTab() {
    const view = createView('preload.cjs');
    const tab: Tab = {
      id: randomUUID(),
      view,
      session: createDocumentSession(view.webContents, () =>
        this.handleTabsChange(),
      ),
    };
    this.tabs.push(tab);
    this.window.contentView.addChildView(view);
    loadRendererPage(view.webContents, 'index.html').then(() => {
      if (devServerUrl) view.webContents.openDevTools({ mode: 'detach' });
    });
    this.activateTab(tab.id);
    return tab;
  }

  activateTab(id: string) {
    if (!this.tabs.some((tab) => tab.id === id)) return;

    this.activeTabId = id;
    for (const tab of this.tabs) tab.view.setVisible(tab.id === id);
    this.layout();
    this.activeTab?.view.webContents.focus();
    this.handleTabsChange();
  }

  getTabInfos(): TabInfo[] {
    return this.tabs.map((tab) => ({
      id: tab.id,
      title: tab.session.fileName,
      isDirty: tab.session.isDirty,
      isActive: tab.id === this.activeTabId,
    }));
  }

  private isShell(webContents: WebContents) {
    return this.shellView.webContents === webContents;
  }

  private handleTabsChange() {
    this.window.setTitle(this.activeTab?.session.title ?? 'Suika');
    if (!this.shellView.webContents.isDestroyed()) {
      this.shellView.webContents.send('tabs:changed', this.getTabInfos());
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
