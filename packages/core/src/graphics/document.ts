import { EventEmitter, throttle } from '@suika/common';

import { type SuikaEditor } from '../editor';
import { GraphicsStoreManager } from '../graphics_manger';
import { GraphicsType, type Optional } from '../type';
import {
  type GraphicsAttrs,
  type IGraphicsOpts,
  SuikaGraphics,
} from './graphics';

type SuikaCanvasAttrs = GraphicsAttrs;

interface Events {
  sceneChange(
    ops: {
      added: Map<string, GraphicsAttrs>;
      deleted: Set<string>;
      update: Map<string, Partial<GraphicsAttrs>>;
    },
    source: string,
  ): void;
}

export class SuikaDocument extends SuikaGraphics<SuikaCanvasAttrs> {
  override type = GraphicsType.Document;
  protected override isContainer = true;

  graphicsStoreManager = new GraphicsStoreManager();
  private emitter = new EventEmitter<Events>();

  private changes = {
    added: new Map<string, GraphicsAttrs>(),
    deleted: new Set<string>(),
    updatedIds: new Set<string>(),
  };

  private editor!: SuikaEditor;

  constructor(attrs: Optional<SuikaCanvasAttrs, 'id' | 'transform'>) {
    super({ ...attrs, type: GraphicsType.Document }, {} as IGraphicsOpts);
  }

  setEditor(editor: SuikaEditor) {
    this.editor = editor;
  }

  clear() {
    // TODO: update doc.updateInfo
    this.graphicsStoreManager.clear();
  }

  getCanvas() {
    return this.graphicsStoreManager.getCanvas();
  }

  getGraphicsById(id: string) {
    return this.graphicsStoreManager.get(id);
  }

  getGraphicsArrByIds(ids: Set<string>) {
    const graphicsArr: SuikaGraphics[] = [];
    for (const id of ids) {
      const graphics = this.getGraphicsById(id);
      if (!graphics) {
        console.warn(`id ${id} is no exist in graphics array`);
        continue;
      }
      graphicsArr.push(graphics);
    }
    return graphicsArr;
  }

  getAllGraphicsArr() {
    return this.graphicsStoreManager.getAll();
  }

  getCurrCanvas() {
    return this.graphicsStoreManager.getCanvas();
  }

  addGraphics(graphics: SuikaGraphics) {
    this.graphicsStoreManager.add(graphics);
    this.changes.added.set(graphics.attrs.id, graphics.getAttrs());
    this.emitSceneChangeThrottle();
  }

  collectDeletedGraphics(graphics: SuikaGraphics) {
    const id = graphics.attrs.id;
    if (graphics.isDeleted()) {
      this.changes.deleted.add(id);
      this.changes.added.delete(id);
    } else {
      this.changes.deleted.delete(id);
      this.changes.added.set(id, graphics.getAttrs());
    }
    this.emitSceneChangeThrottle();
  }

  collectUpdatedGraphics(id: string) {
    this.changes.updatedIds.add(id);
    this.emitSceneChangeThrottle();
  }

  flushChanges() {
    const updates = new Map<string, Partial<GraphicsAttrs>>();
    for (const id of this.changes.updatedIds) {
      const graphics = this.getGraphicsById(id);
      if (!graphics) {
        console.warn(`graphics ${id} is lost!`);
        continue;
      }
      updates.set(id, graphics.getUpdatedAttrs());
    }
    const changes = {
      added: this.changes.added,
      deleted: this.changes.deleted,
      update: updates,
    };
    this.clearChanges();
    return changes;
  }

  private clearChanges() {
    this.changes = {
      added: new Map(),
      deleted: new Set(),
      updatedIds: new Set(),
    };
  }

  private emitSceneChangeThrottle = throttle(
    () => {
      const changes = this.flushChanges();
      this.emitter.emit('sceneChange', changes, 'unknown');
    },
    100,
    // { leading: false },
  );

  getDeviceViewSize() {
    const canvasEl = this.editor.canvasElement;
    return {
      width: canvasEl.width,
      height: canvasEl.height,
    };
  }

  on<T extends keyof Events>(eventName: T, listener: Events[T]) {
    this.emitter.on(eventName, listener);
  }
  off<T extends keyof Events>(eventName: T, listener: Events[T]) {
    this.emitter.off(eventName, listener);
  }
}
