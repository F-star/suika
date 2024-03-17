import { normalizeRect } from './geo';
import { transformRotate } from './transform';
import { type IPoint, type IRectWithRotation } from './type';

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

interface IResizeOperation {
  getSize: (
    rect: IRectWithRotation,
    posX: number,
    posY: number,
    cx: number,
    cy: number,
    scaleFromCenter: boolean,
  ) => {
    width: number;
    height: number;
  };
  getOrigin: (
    rect: IRectWithRotation,
    newWidth: number,
    newHeight: number,
  ) => [number, number, number, number];
}

const se: IResizeOperation = {
  getSize: (
    rect: IRectWithRotation,
    posX: number,
    posY: number,
    cx: number,
    cy: number,
    scaleFromCenter: boolean,
  ) => {
    let width = 0;
    let height = 0;
    if (scaleFromCenter) {
      width = (posX - cx) * 2;
      height = (posY - cy) * 2;
    } else {
      width = posX - rect.x;
      height = posY - rect.y;
    }
    return { width, height };
  },
  getOrigin: (rect: IRectWithRotation) => [rect.x, rect.y, rect.x, rect.y],
};

const ne: IResizeOperation = {
  getSize: (
    rect: IRectWithRotation,
    posX: number,
    posY: number,
    cx: number,
    cy: number,
    scaleFromCenter: boolean,
  ) => {
    let width = 0;
    let height = 0;
    if (scaleFromCenter) {
      width = (posX - cx) * 2;
      height = (cy - posY) * 2;
    } else {
      width = posX - rect.x;
      height = rect.y + rect.height - posY;
    }
    return { width, height };
  },
  getOrigin: (rect: IRectWithRotation, _newWidth, newHeight) => [
    // left-bottom
    rect.x,
    rect.y + rect.height,
    rect.x,
    rect.y + newHeight,
  ],
};

const nw: IResizeOperation = {
  getSize: (
    rect: IRectWithRotation,
    posX: number,
    posY: number,
    cx: number,
    cy: number,
    scaleFromCenter: boolean,
  ) => {
    let width = 0;
    let height = 0;
    if (scaleFromCenter) {
      width = (cx - posX) * 2;
      height = (cy - posY) * 2;
    } else {
      width = rect.x + rect.width - posX;
      height = rect.y + rect.height - posY;
    }
    return { width, height };
  },
  getOrigin: (rect: IRectWithRotation, newWidth, newHeight) => [
    // right-bottom
    rect.x + rect.width,
    rect.y + rect.height,
    rect.x + newWidth,
    rect.y + newHeight,
  ],
};

const sw: IResizeOperation = {
  getSize: (
    rect: IRectWithRotation,
    posX: number,
    posY: number,
    cx: number,
    cy: number,
    scaleFromCenter: boolean,
  ) => {
    let width = 0;
    let height = 0;
    if (scaleFromCenter) {
      width = (cx - posX) * 2;
      height = (posY - cy) * 2;
    } else {
      width = rect.x + rect.width - posX;
      height = posY - rect.y;
    }
    return { width, height };
  },
  getOrigin: (rect: IRectWithRotation, newWidth) => [
    // right-top
    rect.x + rect.width,
    rect.y,
    rect.x + newWidth,
    rect.y,
  ],
};

const n: IResizeOperation = {
  getSize: (
    rect: IRectWithRotation,
    _posX: number,
    posY: number,
    _cx: number,
    cy: number,
    scaleFromCenter: boolean,
  ) => {
    let width = 0;
    let height = 0;
    if (scaleFromCenter) {
      width = rect.width;
      height = (cy - posY) * 2;
    } else {
      width = rect.width;
      height = rect.y + rect.height - posY;
    }
    return { width, height };
  },
  getOrigin: (rect: IRectWithRotation, newWidth, newHeight) => [
    // center-bottom
    rect.x + rect.width / 2,
    rect.y + rect.height,
    rect.x + newWidth / 2,
    rect.y + newHeight,
  ],
};

const e: IResizeOperation = {
  getSize: (
    rect: IRectWithRotation,
    posX: number,
    _posY: number,
    cx: number,
    _cy: number,
    scaleFromCenter: boolean,
  ) => {
    let width = 0;
    let height = 0;
    if (scaleFromCenter) {
      width = (posX - cx) * 2;
      height = rect.height;
    } else {
      width = posX - rect.x;
      height = rect.height;
    }
    return { width, height };
  },
  getOrigin: (rect: IRectWithRotation, _newWidth, newHeight) => [
    // left-center
    rect.x,
    rect.y + rect.height / 2,
    rect.x,
    rect.y + newHeight / 2,
  ],
};

const s: IResizeOperation = {
  getSize: (
    rect: IRectWithRotation,
    _posX: number,
    posY: number,
    _cx: number,
    cy: number,
    scaleFromCenter: boolean,
  ) => {
    let width = 0;
    let height = 0;
    if (scaleFromCenter) {
      width = rect.width;
      height = (posY - cy) * 2;
    } else {
      width = rect.width;
      height = posY - rect.y;
    }
    return { width, height };
  },
  getOrigin: (rect: IRectWithRotation, newWidth: number) => [
    // center-top
    rect.x + rect.width / 2,
    rect.y,
    rect.x + newWidth / 2,
    rect.y,
  ],
};

const w: IResizeOperation = {
  getSize: (
    rect: IRectWithRotation,
    posX: number,
    _posY: number,
    cx: number,
    _cy: number,
    scaleFromCenter: boolean,
  ) => {
    let width = 0;
    let height = 0;
    if (scaleFromCenter) {
      width = (cx - posX) * 2;
      height = rect.height;
    } else {
      width = rect.x + rect.width - posX;
      height = rect.height;
    }
    return { width, height };
  },
  getOrigin: (rect: IRectWithRotation, newWidth: number, newHeight: number) => [
    // right-center
    rect.x + rect.width,
    rect.y + rect.height / 2,
    rect.x + newWidth,
    rect.y + newHeight / 2,
  ],
};

const resizeOperations: Record<string, IResizeOperation> = {
  se,
  ne,
  nw,
  sw,
  n,
  e,
  s,
  w,
};
