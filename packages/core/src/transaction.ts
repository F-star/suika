import { UpdateGraphicsAttrsCmd } from './commands';
import { type Editor } from './editor';
import { type GraphicsAttrs, type SuikaGraphics } from './graphs';
import { getParentIdSet, updateNodeSize } from './utils';

export class Transaction {
  private originAttrsMap = new Map<string, Partial<GraphicsAttrs>>();
  private updatedAttrsMap = new Map<string, Partial<GraphicsAttrs>>();
  private removedIds = new Set<string>();
  private newIds = new Set<string>();

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

  newId(id: string) {
    this.newIds.add(id);
  }

  updateParentSize(elements: SuikaGraphics[]) {
    updateNodeSize(
      this.editor,
      getParentIdSet(elements),
      this.originAttrsMap,
      this.updatedAttrsMap,
    );
  }

  updateNodeSize(idSet: Set<string>) {
    updateNodeSize(
      this.editor,
      idSet,
      this.originAttrsMap,
      this.updatedAttrsMap,
    );
  }

  commit(desc: string) {
    // TODO: check duplicated id between removeIds and newIds
    this.editor.commandManager.pushCommand(
      new UpdateGraphicsAttrsCmd(
        desc,
        this.editor,
        this.originAttrsMap,
        this.updatedAttrsMap,
        this.removedIds,
        this.newIds,
      ),
    );
  }
}
