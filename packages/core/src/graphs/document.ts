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
}
