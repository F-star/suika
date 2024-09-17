import { cloneDeep } from '@suika/common';
import { type IMatrixArr, type IPoint, Matrix, mergeBoxes } from '@suika/geo';

import { type SuikaEditor } from '../editor';
import { type SuikaGraphics } from '../graphics';
import { Transaction } from '../transaction';
import { getBoxCenter } from '../utils';

export const flipHorizontalAndRecord = (
  editor: SuikaEditor,
  graphicsArr: SuikaGraphics[],
) => {
  flipAndRecord(editor, graphicsArr, { x: -1, y: 1 });
};

export const flipVerticalAndRecord = (
  editor: SuikaEditor,
  graphicsArr: SuikaGraphics[],
) => {
  flipAndRecord(editor, graphicsArr, { x: 1, y: -1 });
};

const flipAndRecord = (
  editor: SuikaEditor,
  graphicsArr: SuikaGraphics[],
  scale: IPoint,
) => {
  const size = graphicsArr.length;
  if (size === 0) {
    console.warn('graphics should not be empty');
    return;
  }

  let flipCenter: IPoint;

  if (size === 1) {
    flipCenter = graphicsArr[0].getWorldCenter();
  } else {
    flipCenter = getBoxCenter(
      mergeBoxes(graphicsArr.map((item) => item.getBbox())),
    );
  }

  const tf = new Matrix()
    .translate(-flipCenter.x, -flipCenter.y)
    .scale(scale.x, scale.y)
    .translate(flipCenter.x, flipCenter.y);

  prependMatrixAndRecord(editor, graphicsArr, tf.getArray(), 'Flip Vertical');
};

const prependMatrixAndRecord = (
  editor: SuikaEditor,
  graphicsArr: SuikaGraphics[],
  tf: IMatrixArr,
  recordDesc: string,
) => {
  const transaction = new Transaction(editor);
  for (const graphics of graphicsArr) {
    transaction.recordOld(graphics.attrs.id, {
      transform: cloneDeep(graphics.attrs.transform),
    });
    graphics.prependWorldTransform(tf);
    transaction.update(graphics.attrs.id, {
      transform: cloneDeep(graphics.attrs.transform),
    });
  }
  transaction.updateParentSize(graphicsArr);
  transaction.commit(recordDesc);
};
