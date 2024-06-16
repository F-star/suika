import { cloneDeep } from '@suika/common';
import { generateNKeysBetween } from 'fractional-indexing';

import { type Editor } from '../editor';
import {
  isFrameGraphics,
  type SuikaFrame,
  type SuikaGraphics,
} from '../graphs';
import { Transaction } from '../transaction';
import { getParentIdSet } from '../utils';

export const ungroupAndRecord = (
  graphicsArr: SuikaGraphics[],
  editor: Editor,
) => {
  const frameGraphicsArr = graphicsArr.filter((graphics) =>
    isFrameGraphics(graphics),
  ) as SuikaFrame[];
  if (frameGraphicsArr.length === 0) {
    console.log('no frame graphics, no ungroup');
    return;
  }

  const parentIdSet = getParentIdSet(graphicsArr);

  // parent -> frame graphics set
  const map = new Map<string, Set<SuikaFrame>>();
  for (const graphics of frameGraphicsArr) {
    const parentId = graphics.getParentId();
    if (!parentId) {
      console.warn(`graphics ${parentId} lost`);
      continue;
    }
    if (!map.has(parentId)) {
      map.set(parentId, new Set());
    }
    const graphicsSet = map.get(parentId)!;
    graphicsSet.add(graphics);
  }

  const transaction = new Transaction(editor);

  let allFlattedGraphicsArr: SuikaGraphics[] = [];

  for (const [parentId, selectedChildSet] of map) {
    const parent = editor.doc.getGraphicsById(parentId)!;
    const children = parent.getChildren();
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!isFrameGraphics(child) || !selectedChildSet.has(child)) {
        continue;
      }

      const leftSortIndex = children[i - 1]?.getSortIndex() ?? null;
      const rightSortIndex = child.getSortIndex();

      child.removeFromParent();
      child.setDeleted(true);
      transaction.remove(child.attrs.id);

      const flattedGraphics = flatFrame(
        transaction,
        parentId,
        child,
        leftSortIndex,
        rightSortIndex,
      );
      allFlattedGraphicsArr = allFlattedGraphicsArr.concat(flattedGraphics);
    }
  }

  transaction.updateNodeSize(parentIdSet);
  transaction.commit('ungroup');
  editor.selectedElements.setItems(allFlattedGraphicsArr);
  editor.selectedElements.setHoverItem(null);
};

const flatFrame = (
  transaction: Transaction,
  parentId: string,
  frame: SuikaFrame,
  left: string | null,
  right: string | null,
) => {
  const children = frame.getChildren();
  const sortIndies = generateNKeysBetween(left, right, children.length);

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const worldTf = child.getWorldTransform();

    transaction.recordOld(child.attrs.id, {
      parentIndex: cloneDeep(child.attrs.parentIndex),
      transform: cloneDeep(child.attrs.transform),
    });

    child.updateAttrs({
      parentIndex: {
        guid: parentId,
        position: sortIndies[i],
      },
    });

    child.insertAtParent(sortIndies[i]);
    child.setWorldTransform(worldTf);

    transaction.update(child.attrs.id, {
      parentIndex: cloneDeep(child.attrs.parentIndex),
      transform: cloneDeep(child.attrs.transform),
    });
  }
  return children;
};
