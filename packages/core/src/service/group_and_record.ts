import { cloneDeep } from '@suika/common';
import {
  boxToRect,
  calcRectBbox,
  invertMatrix,
  mergeBoxes,
  multiplyMatrix,
} from '@suika/geo';

import { AddGraphCmd, MacroCmd, SetGraphsAttrsCmd } from '../commands';
import { type Editor } from '../editor';
import { SuikaFrame, SuikaGraphics } from '../graphs';

export const groupAndRecord = (graphs: SuikaGraphics[], editor: Editor) => {
  if (graphs.length === 0) {
    console.warn('graphics should not be empty');
    return;
  }
  graphs = SuikaGraphics.sortGraphics(graphs);

  const prevAttrsArr = graphs.map((item) => ({
    parentIndex: cloneDeep(item.attrs.parentIndex)!,
    transform: cloneDeep(item.attrs.transform),
  }));

  const lastGraphics = graphs.at(-1)!;
  const parentOfGroup = lastGraphics.getParent()!;
  const parentOfGroupInvertTf = invertMatrix(parentOfGroup.getWorldTransform());

  const groupSortIndex = lastGraphics.getSortIndex();

  const { x, y, width, height } = boxToRect(
    mergeBoxes(
      graphs.map((el) => {
        return calcRectBbox({
          ...el.getSize(),
          transform: multiplyMatrix(
            parentOfGroupInvertTf,
            el.getWorldTransform(),
          ),
        });
      }),
    ),
  );

  const group = new SuikaFrame(
    {
      objectName: '',
      width: width,
      height: height,
      resizeToFit: true,
    },
    {
      advancedAttrs: {
        x,
        y,
      },
      doc: editor.doc,
    },
  );
  parentOfGroup.insertChild(group, groupSortIndex);
  const groupInvertTf = invertMatrix(group.getWorldTransform());

  for (const el of graphs) {
    el.updateAttrs({
      transform: multiplyMatrix(groupInvertTf, el.getWorldTransform()),
    });
    group.insertChild(el);
  }

  const AttrsArr = graphs.map((item) => ({
    parentIndex: cloneDeep(item.attrs.parentIndex)!,
    transform: cloneDeep(item.attrs.transform),
  }));

  editor.sceneGraph.addItems([group]);
  editor.selectedElements.setItems([group]);
  editor.commandManager.pushCommand(
    new MacroCmd('group', [
      new AddGraphCmd('', editor, [group]),
      new SetGraphsAttrsCmd('', graphs, AttrsArr, prevAttrsArr),
    ]),
  );
};

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
