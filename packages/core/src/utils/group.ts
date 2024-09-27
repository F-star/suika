import { type SuikaEditor } from '../editor';
import {
  type GraphicsAttrs,
  isFrameGraphics,
  type SuikaGraphics,
} from '../graphics';

export const getParentIdSet = (items: SuikaGraphics[]) => {
  return items.reduce((set, graphics) => {
    const currSet = new Set<string>();
    for (const id of graphics.getFrameParentIds()) {
      if (set.has(id)) {
        break;
      }
      currSet.add(id);
    }

    if (currSet.size === 0) {
      return set;
    }
    // union set
    set.forEach((id) => {
      currSet.add(id);
    });
    return currSet;
  }, new Set<string>());
};

export const getChildNodeSet = (
  nodes: SuikaGraphics[],
  includeSelf = false,
) => {
  const set = new Set<SuikaGraphics>();
  for (const node of nodes) {
    if (set.has(node)) {
      return set;
    }

    if (includeSelf) {
      set.add(node);
    }

    if (isFrameGraphics(node)) {
      const childSet = getChildNodeSet(node.getChildren(), true);
      childSet.forEach((node) => {
        set.add(node);
      });
    }
  }
  return set;
};

// 修正节点的 width/height/transform
export const updateNodeSize = (
  editor: SuikaEditor,
  idSet: Set<string>,
  originAttrsMap: Map<string, Partial<GraphicsAttrs>>,
  updatedAttrsMap: Map<string, Partial<GraphicsAttrs>>,
) => {
  for (const id of idSet) {
    const node = editor.doc.getGraphicsById(id);
    if (node && isFrameGraphics(node) && node.isGroup() && !node.isEmpty()) {
      node.updateSizeByChildren(originAttrsMap, updatedAttrsMap);
    }
  }
};
