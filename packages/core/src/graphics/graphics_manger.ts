import { SuikaFrame, type SuikaGraphics } from '.';
import { SuikaCanvas } from './canvas';

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

  getCanvasItems() {
    return Array.from(this.canvasStore.values());
  }

  getCanvasItemsData() {
    const canvasItems = Array.from(this.canvasStore.values()).filter(
      (canvas) => !canvas.isDeleted(),
    );

    canvasItems.sort((a, b) => {
      const aIndex = a.attrs.parentIndex?.position ?? '';
      const bIndex = b.attrs.parentIndex?.position ?? '';
      return aIndex < bIndex ? -1 : 1;
    });

    return canvasItems.map((canvas) => ({
      id: canvas.attrs.id,
      name: canvas.attrs.objectName,
    }));
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
