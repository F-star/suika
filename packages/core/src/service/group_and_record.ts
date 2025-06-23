import { cloneDeep } from '@suika/common';
import {
  boxToRect,
  calcRectBbox,
  invertMatrix,
  mergeBoxes,
  multiplyMatrix,
} from '@suika/geo';

import { type SuikaEditor } from '../editor';
import { GraphicsObjectSuffix, SuikaFrame, SuikaGraphics } from '../graphics';
import { Transaction } from '../transaction';
import { getNoConflictObjectName, getParentIdSet } from '../utils';

export const groupAndRecord = (
  graphicsArr: SuikaGraphics[],
  editor: SuikaEditor,
) => {
  if (graphicsArr.length === 0) {
    console.warn('graphics should not be empty');
    return;
  }
  graphicsArr = SuikaGraphics.sortGraphics(graphicsArr);
  const parentIdSet = getParentIdSet(graphicsArr);

  const lastGraphics = graphicsArr.at(-1)!;
  const parentOfGroup = lastGraphics.getParent()!;
  const parentOfGroupInvertTf = invertMatrix(parentOfGroup.getWorldTransform());

  const groupSortIndex = lastGraphics.getSortIndex();

  const boundRect = boxToRect(
    mergeBoxes(
      graphicsArr.map((el) => {
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
      objectName: getNoConflictObjectName(
        parentOfGroup,
        GraphicsObjectSuffix.Group,
      ),
      width: boundRect.width,
      height: boundRect.height,
      resizeToFit: true,
    },
    {
      advancedAttrs: {
        x: boundRect.x,
        y: boundRect.y,
      },
      doc: editor.doc,
    },
  );
  parentOfGroup.insertChild(group, groupSortIndex);
  const groupInvertTf = invertMatrix(group.getWorldTransform());

  const transaction = new Transaction(editor);
  transaction.addNewIds([group.attrs.id]);

  for (const graphics of graphicsArr) {
    transaction.recordOld(graphics.attrs.id, {
      parentIndex: cloneDeep(graphics.attrs.parentIndex),
      transform: cloneDeep(graphics.attrs.transform),
    });

    graphics.updateAttrs({
      transform: multiplyMatrix(groupInvertTf, graphics.getWorldTransform()),
    });
    group.insertChild(graphics);

    transaction.update(graphics.attrs.id, {
      parentIndex: cloneDeep(graphics.attrs.parentIndex),
      transform: cloneDeep(graphics.attrs.transform),
    });
  }

  transaction.updateNodeSize(parentIdSet);
  transaction.commit('group');

  editor.sceneGraph.addItems([group]);
  editor.selectedElements.setItems([group]);
};
