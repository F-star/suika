import { type Editor } from '../editor';
import { type GraphicsAttrs } from '../graphs';
import { type ICommand } from './type';

export class UpdateGraphicsAttrsCmd implements ICommand {
  static readonly type = 'UpdateGraphicsAttrs';
  constructor(
    public desc: string,
    private editor: Editor,
    private originAttrsMap: Map<string, Partial<GraphicsAttrs>>,
    private updatedAttrsMap: Map<string, Partial<GraphicsAttrs>>,
    private removedIds: Set<string> = new Set(),
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
      graphics.updateAttrs(attrs);
      if (attrs.parentIndex) {
        graphics.insertAtParent(graphics.attrs.parentIndex!.position);
      }
    }

    for (const id of this.removedIds) {
      const graphics = doc.getGraphicsById(id);
      if (graphics) {
        graphics.setDeleted(true);
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
  }
}
