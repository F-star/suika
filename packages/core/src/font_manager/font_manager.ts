import opentype, { type Font } from 'opentype.js';

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

    for (const [fontName, url] of Object.entries(fonts)) {
      if (this.fonts[fontName]) {
        continue;
      }

      const font = await opentype.load(url);
      this.fonts[fontName] = font;
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

  getFontNames() {
    return Object.keys(this.fonts);
  }
}

const fontManager = new FontManager();
(window as any).fontManager = fontManager;
export { fontManager };
