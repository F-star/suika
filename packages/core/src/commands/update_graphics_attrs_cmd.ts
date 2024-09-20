import { type SuikaEditor } from '../editor';
import { type GraphicsAttrs } from '../graphics';
import { type ICommand } from './type';

export class UpdateGraphicsAttrsCmd implements ICommand {
  static readonly type = 'UpdateGraphicsAttrs';
  constructor(
    public desc: string,
    private editor: SuikaEditor,
    private originAttrsMap: Map<string, Partial<GraphicsAttrs>>,
    private updatedAttrsMap: Map<string, Partial<GraphicsAttrs>>,
    private removedIds: Set<string> = new Set(),
    private newIds: Set<string> = new Set(),
  ) {
    if (originAttrsMap.size !== updatedAttrsMap.size) {
      console.warn(
        `originAttrsMap 和 updatedAttrsMap 数量不匹配 ${originAttrsMap.size} ${updatedAttrsMap.size}`,
      );
      console.log('origin:', originAttrsMap);
      console.log('update:', updatedAttrsMap);
    }
  }
  redo() {
    const attrsMap = this.updatedAttrsMap;
    const doc = this.editor.doc;

    for (const [id, attrs] of attrsMap) {
      const graphics = doc.getGraphicsById(id);
      if (!graphics) {
        console.warn(`graphics ${id} is lost.`);
        return;
      }
      if (attrs.parentIndex) {
        graphics.removeFromParent();
      }
      graphics.updateAttrs(attrs);
      if (attrs.parentIndex) {
        graphics.insertAtParent(graphics.attrs.parentIndex!.position);
      }
    }

    for (const id of this.removedIds) {
      const graphics = doc.getGraphicsById(id);
      if (graphics) {
        graphics.setDeleted(true);
        graphics.removeFromParent();
      }
    }

    for (const id of this.newIds) {
      const graphics = doc.getGraphicsById(id);
      if (graphics) {
        graphics.setDeleted(false);
        const position = graphics.attrs.parentIndex?.position;
        if (position) {
          graphics.insertAtParent(position);
        } else {
          console.error('position lost');
        }
      }
    }
  }
  undo() {
    const attrsMap = this.originAttrsMap;
    const doc = this.editor.doc;

    for (const [id, attrs] of attrsMap) {
      const graphics = doc.getGraphicsById(id);
      if (!graphics) {
        console.warn(`graphics ${id} is lost.`);
        return;
      }
      if (attrs.parentIndex) {
        graphics.removeFromParent();
      }
      graphics.updateAttrs(attrs);
      if (attrs.parentIndex) {
        graphics.insertAtParent(graphics.attrs.parentIndex!.position);
      }
    }

    for (const id of this.removedIds) {
      const graphics = doc.getGraphicsById(id);
      if (graphics) {
        graphics.setDeleted(false);
        const position = graphics.attrs.parentIndex?.position;
        if (position) {
          graphics.insertAtParent(position);
        } else {
          console.error('position lost');
        }
      }
    }

    for (const id of this.newIds) {
      const graphics = doc.getGraphicsById(id);
      if (graphics) {
        graphics.setDeleted(true);
        graphics.removeFromParent();
      }
    }

    // resolve temporarily
    if (this.newIds.size !== 0) {
      this.editor.selectedElements.clear();
    }
  }
}
