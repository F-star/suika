import { cloneDeep } from '@suika/common';
import { invertMatrix, multiplyMatrix } from '@suika/geo';
import { generateNKeysBetween } from 'fractional-indexing';

import { type SuikaEditor } from '../editor';
import { isFrameGraphics, type SuikaGraphics } from '../graphics';
import { Transaction } from '../transaction';

export const repositionAfterAndRecord = (
  editor: SuikaEditor,
  target: SuikaGraphics,
  entities: SuikaGraphics[],
) => {
  const parent = target.getParent();
  if (!canReposition(parent, target, entities)) return;

  const leftIndex = target.getSortIndex();
  const nextSibling = target.getNextSibling();
  const rightIndex = nextSibling ? nextSibling.getSortIndex() : null;
  const positions = generateNKeysBetween(
    leftIndex,
    rightIndex,
    entities.length,
  );

  repositionAndRecord(editor, parent, entities, positions);
};

export const repositionBeforeAndRecord = (
  editor: SuikaEditor,
  target: SuikaGraphics,
  entities: SuikaGraphics[],
) => {
  const parent = target.getParent();
  if (!canReposition(parent, target, entities)) return;

  const prevSibling = target.getPrevSibling();
  const positions = generateNKeysBetween(
    prevSibling ? prevSibling.getSortIndex() : null,
    target.getSortIndex(),
    entities.length,
  );

  repositionAndRecord(editor, parent, entities, positions);
};

export const repositionInsideAndRecord = (
  editor: SuikaEditor,
  target: SuikaGraphics,
  entities: SuikaGraphics[],
) => {
  if (!canReposition(target, target, entities)) return;

  const positions = generateNKeysBetween(
    target.getMaxChildIndex(),
    null,
    entities.length,
  );

  repositionAndRecord(editor, target, entities, positions);
};

const canReposition = (
  parent: SuikaGraphics | undefined,
  target: SuikaGraphics,
  entities: SuikaGraphics[],
): parent is SuikaGraphics => {
  if (!parent) {
    console.warn('parent not found.');
    return false;
  }
  if (!entities.length) return false;
  if (parent !== target && !target.getSortIndex()) {
    console.warn('"parentIndex.position" not found.');
    return false;
  }
  if (entities.some((entity) => entity === target || entity === parent)) {
    return false;
  }
  if (entities.some((entity) => parent.hasAncestor(entity.attrs.id))) {
    console.warn("can't reposition a graphic inside itself.");
    return false;
  }
  return true;
};

const repositionAndRecord = (
  editor: SuikaEditor,
  parent: SuikaGraphics,
  entities: SuikaGraphics[],
  positions: string[],
) => {
  const transaction = new Transaction(editor);
  const sourceParents = new Set<SuikaGraphics>();
  const parentIdSet = new Set<string>(parent.getParentIds());
  parentIdSet.add(parent.attrs.id);

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const worldTf = entity.getWorldTransform();
    const sourceParent = entity.getParent();
    if (sourceParent) {
      sourceParents.add(sourceParent);
    }
    entity.getParentIds().forEach((id) => parentIdSet.add(id));

    transaction.recordOld(entity.attrs.id, {
      parentIndex: cloneDeep(entity.attrs.parentIndex),
      transform: cloneDeep(entity.attrs.transform),
    });
    entity.removeFromParent();

    parent.insertChild(entity, positions[i]);
    entity.updateAttrs({
      transform: multiplyMatrix(
        invertMatrix(parent.getWorldTransform()),
        worldTf,
      ),
    });
    transaction.update(entity.attrs.id, {
      parentIndex: cloneDeep(entity.attrs.parentIndex),
      transform: cloneDeep(entity.attrs.transform),
    });
  }

  for (const sourceParent of sourceParents) {
    if (isFrameGraphics(sourceParent) && sourceParent.isEmpty()) {
      sourceParent.removeFromParent();
      sourceParent.setDeleted(true);
      transaction.remove(sourceParent.attrs.id);
    }
  }

  transaction.updateNodeSize(parentIdSet);
  transaction.commit('reposition');
};
