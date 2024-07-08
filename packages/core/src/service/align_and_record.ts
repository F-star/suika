import { cloneDeep } from '@suika/common';
import { type IMatrixArr, mergeBoxes } from '@suika/geo';

import { type SuikaEditor } from '../editor';
import { type SuikaGraphics } from '../graphs';
import { Transaction } from '../transaction';
import { AlignType } from '../type';

/**
 * Align graphics
 * reference: https://mp.weixin.qq.com/s/9mGZYP_EPL7r-JVjOwyotw
 */
export const alignAndRecord = (editor: SuikaEditor, type: AlignType) => {
  if (editor.selectedElements.size() < 2) {
    console.warn('can align zero or two elements, fail silently');
    return;
  }

  const graphicsArr = editor.selectedElements.getItems();

  const bboxes = graphicsArr.map((item) => item.getBbox());
  const worldTfs = graphicsArr.map((item) => item.getWorldTransform());
  const mixedBBox = mergeBoxes(bboxes);

  const transaction = new Transaction(editor);

  const updateGraphicsPosition = (
    graphics: SuikaGraphics,
    worldTf: IMatrixArr,
    dx: number,
    dy: number,
  ) => {
    transaction.recordOld(graphics.attrs.id, {
      transform: cloneDeep(graphics.attrs.transform),
    });

    const newWorldTf = cloneDeep(worldTf);
    newWorldTf[4] += dx;
    newWorldTf[5] += dy;
    graphics.setWorldTransform(newWorldTf);

    transaction.update(graphics.attrs.id, {
      transform: cloneDeep(graphics.attrs.transform),
    });
  };

  switch (type) {
    case AlignType.Left: {
      for (let i = 0; i < graphicsArr.length; i++) {
        const graphics = graphicsArr[i];
        const dx = mixedBBox.minX - bboxes[i].minX;
        if (dx !== 0) {
          updateGraphicsPosition(graphics, worldTfs[i], dx, 0);
        }
      }
      break;
    }
    case AlignType.HCenter: {
      const centerX = mixedBBox.minX / 2 + mixedBBox.maxX / 2;
      for (let i = 0; i < graphicsArr.length; i++) {
        const graphics = graphicsArr[i];
        const dx = centerX - (bboxes[i].minX / 2 + bboxes[i].maxX / 2);
        if (dx !== 0) {
          updateGraphicsPosition(graphics, worldTfs[i], dx, 0);
        }
      }
      break;
    }
    case AlignType.Right: {
      for (let i = 0; i < graphicsArr.length; i++) {
        const graphics = graphicsArr[i];
        const dx = mixedBBox.maxX - bboxes[i].maxX;
        if (dx !== 0) {
          updateGraphicsPosition(graphics, worldTfs[i], dx, 0);
        }
      }
      break;
    }
    case AlignType.Top: {
      for (let i = 0; i < graphicsArr.length; i++) {
        const graphics = graphicsArr[i];
        const dy = mixedBBox.minY - bboxes[i].minY;
        if (dy !== 0) {
          updateGraphicsPosition(graphics, worldTfs[i], 0, dy);
        }
      }
      break;
    }
    case AlignType.VCenter: {
      const centerY = mixedBBox.minY / 2 + mixedBBox.maxY / 2;
      for (let i = 0; i < graphicsArr.length; i++) {
        const graphics = graphicsArr[i];
        const dy = centerY - (bboxes[i].minY / 2 + bboxes[i].maxY / 2);
        if (dy !== 0) {
          updateGraphicsPosition(graphics, worldTfs[i], 0, dy);
        }
      }
      break;
    }
    case AlignType.Bottom: {
      for (let i = 0; i < graphicsArr.length; i++) {
        const graphics = graphicsArr[i];
        const dy = mixedBBox.maxY - bboxes[i].maxY;
        if (dy !== 0) {
          updateGraphicsPosition(graphics, worldTfs[i], 0, dy);
        }
      }
      break;
    }
    default: {
      console.warn('invalid type:', type);
      break;
    }
  }

  transaction.updateParentSize(graphicsArr);
  transaction.commit('Align ' + type);
  editor.render();
};
