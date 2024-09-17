import { cloneDeep, swap } from '@suika/common';
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';

import { type SuikaEditor } from '../editor';
import { SuikaGraphics } from '../graphics';
import { Transaction } from '../transaction';
import { ArrangeType } from '../type';

export const arrangeAndRecord = (editor: SuikaEditor, type: ArrangeType) => {
  if (editor.selectedElements.size() === 0) {
    console.warn("can't arrange, no element");
  }

  const selectedItems = editor.selectedElements.getItems();
  const transaction = new Transaction(editor);
  // parent -> children set
  const map = new Map<SuikaGraphics, Set<SuikaGraphics>>();

  for (const graphics of selectedItems) {
    const parent = graphics.getParent()!;
    if (!map.has(parent)) {
      map.set(parent, new Set());
    }
    const graphicsSet = map.get(parent)!;
    graphicsSet.add(graphics);
  }

  let isArrangeHappen = true;
  switch (type) {
    case ArrangeType.Front: {
      isArrangeHappen = front(transaction, map);
      break;
    }
    case ArrangeType.Back: {
      isArrangeHappen = back(transaction, map);
      break;
    }
    case ArrangeType.Forward: {
      isArrangeHappen = forward(transaction, map);
      break;
    }
    case ArrangeType.Backward: {
      isArrangeHappen = backward(transaction, map);
      break;
    }
    default:
      console.warn(`invalid type ${type}`);
      break;
  }

  if (isArrangeHappen) {
    transaction.commit(`Arrange ${type}`);
    editor.render();
  } else {
    console.log('No need to arrange.');
  }
};

const front = (
  transaction: Transaction,
  map: Map<SuikaGraphics, Set<SuikaGraphics>>,
) => {
  let isArrangeHappen = false;

  for (const [parent, movedChildSet] of map) {
    if (parent.getChildrenCount() === movedChildSet.size) {
      continue;
    }
    const { count } = getLastUnmovedGraphics(
      parent.getChildren(),
      movedChildSet,
    );
    if (count === movedChildSet.size) {
      continue;
    }
    isArrangeHappen = true;

    const maxSortIndex = parent.getMaxChildIndex();
    const sortedMovedChildren = SuikaGraphics.sortGraphicsArray(
      Array.from(movedChildSet),
    );
    const positionArr = generateNKeysBetween(
      maxSortIndex,
      null,
      sortedMovedChildren.length,
    );
    for (let i = 0; i < sortedMovedChildren.length; i++) {
      const child = sortedMovedChildren[i];

      transaction.recordOld(child.attrs.id, {
        parentIndex: cloneDeep(child.attrs.parentIndex),
      });

      child.updateAttrs({
        parentIndex: {
          guid: parent.attrs.id,
          position: positionArr[i],
        },
      });

      transaction.update(child.attrs.id, {
        parentIndex: cloneDeep(child.attrs.parentIndex),
      });
    }
    parent.markSortDirty();
    parent.sortChildren();
  }

  return isArrangeHappen;
};

const back = (
  transaction: Transaction,
  map: Map<SuikaGraphics, Set<SuikaGraphics>>,
) => {
  let isArrangeHappen = false;
  for (const [parent, movedChildSet] of map) {
    if (parent.getChildrenCount() === movedChildSet.size) {
      continue;
    }
    const { count } = getFirstUnmovedGraphics(
      parent.getChildren(),
      movedChildSet,
    );
    if (count === movedChildSet.size) {
      continue;
    }
    isArrangeHappen = true;

    const minSortIndex = parent.getMinChildIndex();
    const sortedMovedChildren = SuikaGraphics.sortGraphicsArray(
      Array.from(movedChildSet),
    );
    const positionArr = generateNKeysBetween(
      null,
      minSortIndex,
      sortedMovedChildren.length,
    );
    for (let i = 0; i < sortedMovedChildren.length; i++) {
      const child = sortedMovedChildren[i];

      transaction.recordOld(child.attrs.id, {
        parentIndex: cloneDeep(child.attrs.parentIndex),
      });

      child.updateAttrs({
        parentIndex: {
          guid: parent.attrs.id,
          position: positionArr[i],
        },
      });

      transaction.update(child.attrs.id, {
        parentIndex: cloneDeep(child.attrs.parentIndex),
      });
    }
    parent.markSortDirty();
    parent.sortChildren();
  }
  return isArrangeHappen;
};

const forward = (
  transaction: Transaction,
  map: Map<SuikaGraphics, Set<SuikaGraphics>>,
) => {
  let isArrangeHappen = false;

  for (const [parent, movedChildSet] of map) {
    if (parent.getChildrenCount() === movedChildSet.size) {
      continue;
    }
    const children = parent.getChildren();
    const { index, count } = getLastUnmovedGraphics(children, movedChildSet);
    if (count === movedChildSet.size) {
      continue;
    }
    isArrangeHappen = true;

    for (let i = index; i >= 0; i--) {
      const child = children[i];
      if (movedChildSet.has(child)) {
        const newLeft = children[i + 1].getSortIndex();
        const newRight = children[i + 2]?.getSortIndex() ?? null;
        const newIndex = generateKeyBetween(newLeft, newRight);
        swap(children, i, i + 1);

        transaction.recordOld(child.attrs.id, {
          parentIndex: cloneDeep(child.attrs.parentIndex),
        });

        child.updateAttrs({
          parentIndex: {
            guid: parent.attrs.id,
            position: newIndex,
          },
        });

        transaction.update(child.attrs.id, {
          parentIndex: cloneDeep(child.attrs.parentIndex),
        });
      }
    }
    parent.markSortDirty();
    parent.sortChildren();
  }
  return isArrangeHappen;
};

const backward = (
  transaction: Transaction,
  map: Map<SuikaGraphics, Set<SuikaGraphics>>,
) => {
  let isArrangeHappen = false;

  for (const [parent, movedChildSet] of map) {
    if (parent.getChildrenCount() === movedChildSet.size) {
      continue;
    }
    const children = parent.getChildren();
    const { index, count } = getFirstUnmovedGraphics(children, movedChildSet);
    if (count === movedChildSet.size) {
      continue;
    }
    isArrangeHappen = true;

    for (let i = index; i <= children.length; i++) {
      const child = children[i];
      if (movedChildSet.has(child)) {
        const newLeft = children[i - 2]?.getSortIndex() ?? null;
        const newRight = children[i - 1].getSortIndex();
        const newIndex = generateKeyBetween(newLeft, newRight);
        swap(children, i, i - 1);

        transaction.recordOld(child.attrs.id, {
          parentIndex: cloneDeep(child.attrs.parentIndex),
        });

        child.updateAttrs({
          parentIndex: {
            guid: parent.attrs.id,
            position: newIndex,
          },
        });

        transaction.update(child.attrs.id, {
          parentIndex: cloneDeep(child.attrs.parentIndex),
        });
      }
    }
    parent.markSortDirty();
    parent.sortChildren();
  }
  return isArrangeHappen;
};

const getFirstUnmovedGraphics = (
  graphicsArr: SuikaGraphics[],
  movedGraphSet: Set<SuikaGraphics>,
): { index: number; count: number } => {
  let index = 0;
  let count = 0;
  for (; index < graphicsArr.length; index++) {
    if (!movedGraphSet.has(graphicsArr[index])) {
      break;
    }
    count++;
  }
  return { index, count };
};

const getLastUnmovedGraphics = (
  graphicsArr: SuikaGraphics[],
  movedGraphSet: Set<SuikaGraphics>,
): { index: number; count: number } => {
  let index = graphicsArr.length - 1;
  let count = 0;
  for (; index >= 0; index--) {
    if (!movedGraphSet.has(graphicsArr[index])) {
      break;
    }
    count++;
  }
  return { index, count };
};
