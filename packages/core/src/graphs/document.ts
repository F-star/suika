import { GraphicsStore } from '../graphics_manger';
import { GraphicsType, type Optional } from '../type';
import {
  type GraphicsAttrs,
  type IGraphicsOpts,
  SuikaGraphics,
} from './graphics';

type SuikaCanvasAttrs = GraphicsAttrs;

export class SuikaDocument extends SuikaGraphics<SuikaCanvasAttrs> {
  override type = GraphicsType.Document;
  protected override isContainer = true;

  graphicsStore = new GraphicsStore();

  constructor(attrs: Optional<SuikaCanvasAttrs, 'id' | 'transform'>) {
    super({ ...attrs, type: GraphicsType.Document }, {} as IGraphicsOpts);
  }

  getGraphicsById(id: string) {
    return this.graphicsStore.get(id);
  }

  getCurrCanvas() {
    return this.graphicsStore.getCanvas();
  }

  private updatedGraphicsIds = new Set<string>();
  collectUpdatedGraphics(id: string) {
    this.updatedGraphicsIds.add(id);
  }

  getDeltas() {
    const deltas = [];
    for (const id of this.updatedGraphicsIds) {
      const graphics = this.getGraphicsById(id);
      if (!graphics) {
        console.error(`graphics ${id} is lost!`);
        continue;
      }
      deltas.push({
        type: 'update',
        id,
        payload: graphics.getUpdatedAttrs(),
      });
    }
    return deltas;
  }
}
