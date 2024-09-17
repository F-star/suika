import { SuikaFrame, type SuikaGraphics } from './graphics';
import { SuikaCanvas } from './graphics/canvas';

/**
 * Graphics Manager
 *
 * 1. record "id -> graphics"
 * 2. TODO: search graphics by box (with R-Tree)
 */
export class GraphicsStoreManager {
  private graphicsStore = new Map<string, SuikaGraphics>();
  private canvasStore = new Map<string, SuikaCanvas>();
  private frameStore = new Map<string, SuikaFrame>();

  add(graphics: SuikaGraphics) {
    const id = graphics.attrs.id;
    const graphicsStore = this.graphicsStore;
    if (graphicsStore.has(id)) {
      console.warn(`graphics ${id} has added`);
    }
    if (graphics instanceof SuikaCanvas) {
      this.canvasStore.set(id, graphics);
    } else if (graphics instanceof SuikaFrame) {
      this.frameStore.set(id, graphics);
    }
    graphicsStore.set(id, graphics);
  }

  get(id: string) {
    return this.graphicsStore.get(id);
  }

  getAll() {
    const graphicsArr: SuikaGraphics[] = [];
    for (const [, graphics] of this.graphicsStore) {
      if (!graphics.isDeleted()) {
        graphicsArr.push(graphics);
      }
    }
    return graphicsArr;
  }

  getCanvas() {
    const canvas = Array.from(this.canvasStore.values());
    return canvas[0];
  }

  getFrames() {
    const frames = Array.from(this.frameStore.values());
    return frames;
  }

  clear() {
    // TODO: modify this.changes
    this.graphicsStore.clear();
    this.canvasStore.clear();
    this.frameStore.clear();
  }
}
