import opentype, { type Font } from 'opentype.js';

import { AsyncTaskManager } from './async_task_manager';

const FONT_LOAD_CONCURRENCY = 3;

class FontManager {
  private fonts: Record<string, Font | null> = {};

  async loadFonts(fonts: Record<string, string>) {
    for (const [fontName] of Object.entries(fonts)) {
      if (this.fonts[fontName]) {
        console.warn(`Font ${fontName} is loaded or loading, skip`);
        continue;
      }
      this.fonts[fontName] = null;
    }

    const taskManager = new AsyncTaskManager<Font>(FONT_LOAD_CONCURRENCY);
    const tasks: Array<() => Promise<Font>> = [];

    for (const [fontName, url] of Object.entries(fonts)) {
      if (this.fonts[fontName]) {
        continue;
      }

      tasks.push(async () => {
        const font = await opentype.load(url);
        this.fonts[fontName] = font;
        return font;
      });
    }

    await taskManager.addTaskList(tasks);
  }

  getFont(fontFamily: string) {
    const font = this.fonts[fontFamily];
    if (!font) {
      console.warn(`Font ${fontFamily} not found, use default font`);
      return this.fonts['Smiley Sans']!;
    }
    return font;
  }

  getFontNames() {
    return Object.keys(this.fonts);
  }
}

const fontManager = new FontManager();
(window as any).fontManager = fontManager;
export { fontManager };
