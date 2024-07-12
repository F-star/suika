import { type SuikaEditor } from '../editor';
import {
  type GraphicsAttrs,
  isGroupGraphics,
  type SuikaGraphics,
} from '../graphs';

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
  items: SuikaGraphics[],
  includeSelf = false,
) => {
  const set = new Set<SuikaGraphics>();
  for (const item of items) {
    if (set.has(item)) {
      return set;
    }

    if (includeSelf) {
      set.add(item);
    }

    const childSet = getChildNodeSet(item.getChildren(), true);
    childSet.forEach((node) => {
      set.add(node);
    });
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
    if (node && isGroupGraphics(node) && !node.isEmpty()) {
      node.updateSizeByChildren(originAttrsMap, updatedAttrsMap);
    }
  }
};
