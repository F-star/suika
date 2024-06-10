import { type SuikaGraphics } from './graphs';
import { SuikaCanvas } from './graphs/canvas';

/**
 * Graphics Manager
 *
 * 1. record "id -> graphics"
 * 2. TODO: search graphics by box (with R-Tree)
 */
export class GraphicsStore {
  private graphicsStore = new Map<string, SuikaGraphics>();
  private canvasStore = new Map<string, SuikaCanvas>();

  add(graphics: SuikaGraphics) {
    const id = graphics.attrs.id;
    const graphicsStore = this.graphicsStore;
    if (graphicsStore.has(id)) {
      console.warn(`graphics ${id} has added`);
    }
    if (graphics instanceof SuikaCanvas) {
      this.canvasStore.set(id, graphics);
    }
    graphicsStore.set(id, graphics);
  }

  get(id: string) {
    return this.graphicsStore.get(id);
  }

  getCanvas() {
    const canvas = Array.from(this.canvasStore.values());
    return canvas[0];
  }
}
