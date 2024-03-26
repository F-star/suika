import { Matrix } from 'pixi.js';

import { transformRotate } from '../../transform';
import { type IPoint, type IRectWithRotation } from '../../type';
import { normalizeRect } from '../geo_rect';
import { resizeOperations } from './resize_op';

/**
 * get resized rect
 * used for resize operation
 */
export const getResizedRect = (
  /** 'se' | 'ne' | 'nw' | 'sw' | 'n' | 'e' | 's' | 'w' */
  type: string,
  point: IPoint,
  oldRect: IRectWithRotation,
  keepRatio = false,
  scaleFromCenter = false,
): IRectWithRotation => {
  const resizeOp = resizeOperations[type];
  if (!resizeOp) {
    throw new Error(`resize type ${type} is invalid`);
  }

  // 1. calculate new width and height
  const cx = oldRect.x + oldRect.width / 2;
  const cy = oldRect.y + oldRect.height / 2;
  const { x: posX, y: posY } = transformRotate(
    point.x,
    point.y,
    -(oldRect.rotation || 0),
    cx,
    cy,
  );

  let { width, height } = resizeOp.getSize(
    oldRect,
    posX,
    posY,
    cx,
    cy,
    scaleFromCenter,
  );

  if (keepRatio) {
    const ratio = oldRect.width / oldRect.height;
    const newRatio = Math.abs(width / height);
    if (
      (['nw', 'ne', 'se', 'sw'].includes(type) && newRatio > ratio) ||
      type === 'e' ||
      type === 'w'
    ) {
      height = (Math.sign(height) * Math.abs(width)) / ratio;
    } else {
      width = Math.sign(width) * Math.abs(height) * ratio;
    }
  }

  // 2. correct x and y
  let prevOriginX = 0;
  let prevOriginY = 0;
  let originX = 0;
  let originY = 0;
  if (scaleFromCenter) {
    prevOriginX = cx;
    prevOriginY = cy;
    originX = oldRect.x + width / 2;
    originY = oldRect.y + height / 2;
  } else {
    [prevOriginX, prevOriginY, originX, originY] = resizeOp.getOrigin(
      oldRect,
      width,
      height,
    );
  }

  const { x: prevRotatedOriginX, y: prevRotatedOriginY } = transformRotate(
    prevOriginX,
    prevOriginY,
    oldRect.rotation || 0,
    cx,
    cy,
  );
  const { x: rotatedOriginX, y: rotatedOriginY } = transformRotate(
    originX,
    originY,
    oldRect.rotation || 0,
    oldRect.x + width / 2,
    oldRect.y + height / 2,
  );
  const dx = rotatedOriginX - prevRotatedOriginX;
  const dy = rotatedOriginY - prevRotatedOriginY;
  const x = oldRect.x - dx;
  const y = oldRect.y - dy;

  const retRect: IRectWithRotation = normalizeRect({
    x,
    y,
    width,
    height,
  });
  if (oldRect.rotation !== undefined) {
    retRect.rotation = oldRect.rotation;
  }
  return retRect;
};

/**
 * width, height + transform
 *
 * 计算新的 width height transform
 */
export const resizeRect = (
  /** 'se' | 'ne' | 'nw' | 'sw' | 'n' | 'e' | 's' | 'w' */
  type: string,
  newGlobalPt: IPoint,
  rect: { width: number; height: number; transform: Matrix },
  // keepRatio = false,
  // scaleFromCenter = false,
  options: {
    keepRatio?: boolean;
    scaleFromCenter?: boolean;
  } = {
    keepRatio: false,
    scaleFromCenter: false,
  },
): { width: number; height: number; transform: Matrix } => {
  const resizeOp = resizeOperations[type];
  if (!resizeOp) {
    throw new Error(`resize type ${type} is invalid`);
  }
  const { keepRatio, scaleFromCenter } = options;

  // 假设控制点为左下角
  const getLocalOrigin = (width: number, _height: number): IPoint => {
    return { x: width, y: 0 };
  };

  // 带方向的 size
  const getNewSize = (
    newLocalPt: IPoint,
    localOrigin: IPoint,
  ): { width: number; height: number } => {
    return {
      width: localOrigin.x - newLocalPt.x,
      height: newLocalPt.y - localOrigin.y,
    };
  };

  const newRect = {
    width: 0,
    height: 0,
    transform: rect.transform.clone(),
  };

  const localOrigin = getLocalOrigin(rect.width, rect.height);
  const globalOrigin = rect.transform.apply(localOrigin);
  const newLocalPt = rect.transform.applyInverse(newGlobalPt);
  const size = getNewSize(newLocalPt, localOrigin);
  newRect.width = Math.abs(size.width);
  newRect.height = Math.abs(size.height);
  const scaleX = Math.sign(size.width) || 1;
  const scaleY = Math.sign(size.height) || 1;
  const scaleTransform = new Matrix().scale(scaleX, scaleY);

  newRect.transform = newRect.transform.append(scaleTransform);
  const newGlobalOrigin = newRect.transform.apply({
    x: newRect.width,
    y: 0,
  });

  const offset = {
    x: globalOrigin.x - newGlobalOrigin.x,
    y: globalOrigin.y - newGlobalOrigin.y,
  };
  newRect.transform.translate(offset.x, offset.y);

  return newRect;
};
