import opentype, { type Font } from 'opentype.js';
import decompressWoff2 from 'woff2-encoder/decompress';

import { AsyncTaskManager } from './async_task_manager';

const FONT_LOAD_CONCURRENCY = 3;

const WOFF2_SIGNATURE = 'wOF2';

async function loadFont(url: string): Promise<Font> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load font: ${url} (${response.status})`);
  }

  const buffer = await response.arrayBuffer();
  const signature = new TextDecoder().decode(new Uint8Array(buffer, 0, 4));
  const fontBuffer =
    signature === WOFF2_SIGNATURE
      ? (await decompressWoff2(buffer)).buffer
      : buffer;

  return opentype.parse(fontBuffer as ArrayBuffer);
}

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
        const font = await loadFont(url);
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
      return this.fonts['Source Han Sans CN']!;
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
