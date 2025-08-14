import { UpdateGraphicsAttrsCmd } from '../commands';
import { type SuikaEditor } from '../editor';
import {
  type GraphicsAttrs,
  isFrameGraphics,
  type SuikaGraphics,
} from '../graphics';
import { getChildNodeSet, getParentIdSet, updateNodeSize } from '../utils';

export const removeGraphicsAndRecord = (
  editor: SuikaEditor,
  graphicsArray: SuikaGraphics[],
) => {
  const removeIdSet = new Set<string>();
  for (const graphics of graphicsArray) {
    graphics.removeFromParent();
    graphics.setDeleted(true);
    removeIdSet.add(graphics.attrs.id);
  }

  const parentIdSet = getParentIdSet(graphicsArray);

  // remove empty group
  for (const id of parentIdSet) {
    const parent = editor.doc.getGraphicsById(id);
    if (parent && isFrameGraphics(parent) && parent.isEmpty()) {
      parent.removeFromParent();
      parent.setDeleted(true);
      removeIdSet.add(id);
    }
  }

  const childNodeSet = getChildNodeSet(graphicsArray);
  for (const child of childNodeSet) {
    // 标记为删除
    child.setDeleted(true);
    removeIdSet.add(child.attrs.id);
  }

  const originAttrsMap = new Map<string, Partial<GraphicsAttrs>>();
  const updatedAttrsMap = new Map<string, Partial<GraphicsAttrs>>();

  updateNodeSize(editor, parentIdSet, originAttrsMap, updatedAttrsMap);

  editor.commandManager.pushCommand(
    new UpdateGraphicsAttrsCmd(
      'remove graphics',
      editor,
      originAttrsMap,
      updatedAttrsMap,
      removeIdSet,
    ),
  );
};
