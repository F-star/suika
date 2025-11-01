import opentype, { type Font } from 'opentype.js';

class FontManager {
  private fonts: Record<string, Font | null> = {};

  async loadFonts(fonts: Record<string, string>) {
    for (const [key] of Object.entries(fonts)) {
      if (this.fonts[key]) {
        console.warn(`Font ${key} is loaded or loading, skip`);
        continue;
      }
      this.fonts[key] = null;
    }

    for (const [key, url] of Object.entries(fonts)) {
      if (this.fonts[key]) {
        continue;
      }

      const font = await opentype.load(url);
      this.fonts[key] = font;
    }
  }

  getFont(fontFamily: string) {
    const font = this.fonts[fontFamily];
    if (!font) {
      console.warn(`Font ${fontFamily} not found, use default font`);
      return this.fonts['Smiley Sans']!;
    }
    return font;
  }
}

const fontManager = new FontManager();
(window as any).fontManager = fontManager;
export { fontManager };
