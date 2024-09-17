import { UpdateGraphicsAttrsCmd } from './commands';
import { type SuikaEditor } from './editor';
import { type GraphicsAttrs, type SuikaGraphics } from './graphics';
import { getParentIdSet, updateNodeSize } from './utils';

export class Transaction {
  private originAttrsMap = new Map<string, Partial<GraphicsAttrs>>();
  private updatedAttrsMap = new Map<string, Partial<GraphicsAttrs>>();
  private removedIds = new Set<string>();
  private newIds = new Set<string>();
  private isCommitDone = false;

  constructor(private editor: SuikaEditor) {}

  recordOld(id: string, attrs: Partial<GraphicsAttrs>) {
    this.originAttrsMap.set(id, attrs);
    return this;
  }

  update(id: string, attrs: Partial<GraphicsAttrs>) {
    this.updatedAttrsMap.set(id, attrs);
    return this;
  }

  remove(id: string) {
    this.removedIds.add(id);
    return this;
  }

  addNewIds(ids: string[]) {
    for (const id of ids) {
      this.newIds.add(id);
    }
    return this;
  }

  updateParentSize(elements: SuikaGraphics[]) {
    updateNodeSize(
      this.editor,
      getParentIdSet(elements),
      this.originAttrsMap,
      this.updatedAttrsMap,
    );
    return this;
  }

  updateNodeSize(idSet: Set<string>) {
    updateNodeSize(
      this.editor,
      idSet,
      this.originAttrsMap,
      this.updatedAttrsMap,
    );
    return this;
  }

  commit(desc: string) {
    if (this.isCommitDone) {
      console.error('It had committed before, can not commit again!');
      return;
    }

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

    this.isCommitDone = true;
  }
}
