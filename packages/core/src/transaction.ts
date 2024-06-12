import { UpdateGraphicsAttrsCmd } from './commands';
import { type Editor } from './editor';
import { type GraphicsAttrs, type SuikaGraphics } from './graphs';
import { getParentIdSet } from './service/group_and_record';
import { updateParentSize } from './tools/tool_select/utils';

export class Transaction {
  private originAttrsMap = new Map<string, Partial<GraphicsAttrs>>();
  private updatedAttrsMap = new Map<string, Partial<GraphicsAttrs>>();
  private removedIds = new Set<string>();

  constructor(private editor: Editor) {}

  recordOld(id: string, attrs: Partial<GraphicsAttrs>) {
    this.originAttrsMap.set(id, attrs);
  }

  update(id: string, attrs: Partial<GraphicsAttrs>) {
    this.updatedAttrsMap.set(id, attrs);
  }

  remove(id: string) {
    this.removedIds.add(id);
  }

  updateParentSize(elements: SuikaGraphics[]) {
    updateParentSize(
      this.editor,
      getParentIdSet(elements),
      this.originAttrsMap,
      this.updatedAttrsMap,
    );
  }

  commit(desc: string) {
    this.editor.commandManager.pushCommand(
      new UpdateGraphicsAttrsCmd(
        desc,
        this.editor,
        this.originAttrsMap,
        this.updatedAttrsMap,
        this.removedIds,
      ),
    );
  }
}
