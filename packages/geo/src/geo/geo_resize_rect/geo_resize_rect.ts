import { Matrix } from 'pixi.js';

import { type IPoint, type ITransformRect } from '../../type';

interface IResizeOp {
  getLocalOrigin(width: number, height: number): IPoint;
  getNewSize(
    newLocalPt: IPoint,
    localOrigin: IPoint,
    rect: { width: number; height: number },
  ): {
    width: number;
    height: number;
  };
  /**
   * 保持缩放比例时，是基于 width 还是 height 去计算新的 width height
   */
  isBaseWidthWhenKeepRatio(isWidthLarger: boolean): boolean;
  /**
   * 基于中心缩放时，对 size 进行修正
   */
  getSizeWhenScaleFromCenter(
    width: number,
    height: number,
  ): { width: number; height: number };
}

const doubleSize = (width: number, height: number) => ({
  width: width * 2,
  height: height * 2,
});

const resizeOps: Record<string, IResizeOp> = {
  sw: {
    getLocalOrigin: (width: number) => ({ x: width, y: 0 }),
    getNewSize: (newLocalPt: IPoint, localOrigin: IPoint) => ({
      width: localOrigin.x - newLocalPt.x,
      height: newLocalPt.y - localOrigin.y,
    }),
    isBaseWidthWhenKeepRatio: (isWidthLarger: boolean) => isWidthLarger,
    getSizeWhenScaleFromCenter: doubleSize,
  },
  se: {
    getLocalOrigin: () => ({ x: 0, y: 0 }),
    getNewSize: (newLocalPt, localOrigin) => ({
      width: newLocalPt.x - localOrigin.x,
      height: newLocalPt.y - localOrigin.y,
    }),
    isBaseWidthWhenKeepRatio: (isWidthLarger: boolean) => isWidthLarger,
    getSizeWhenScaleFromCenter: doubleSize,
  },
  nw: {
    getLocalOrigin: (width, height) => {
      return { x: width, y: height };
    },
    getNewSize: (newLocalPt, localOrigin) => {
      return {
        width: localOrigin.x - newLocalPt.x,
        height: localOrigin.y - newLocalPt.y,
      };
    },
    isBaseWidthWhenKeepRatio: (isWidthLarger: boolean) => isWidthLarger,
    getSizeWhenScaleFromCenter: doubleSize,
  },
  ne: {
    getLocalOrigin: (_width, height) => ({ x: 0, y: height }),
    getNewSize: (newLocalPt, localOrigin) => ({
      width: newLocalPt.x - localOrigin.x,
      height: localOrigin.y - newLocalPt.y,
    }),
    isBaseWidthWhenKeepRatio: (isWidthLarger: boolean) => isWidthLarger,
    getSizeWhenScaleFromCenter: doubleSize,
  },
  n: {
    getLocalOrigin: (width, height) => ({ x: width / 2, y: height }),
    getNewSize: (newLocalPt, localOrigin, rect) => ({
      width: rect.width,
      height: localOrigin.y - newLocalPt.y,
    }),
    isBaseWidthWhenKeepRatio: () => false,
    getSizeWhenScaleFromCenter: (width, height) => ({
      width: width,
      height: height * 2,
    }),
  },
  s: {
    getLocalOrigin: (width) => ({ x: width / 2, y: 0 }),
    getNewSize: (newLocalPt, localOrigin, rect) => ({
      width: rect.width,
      height: newLocalPt.y - localOrigin.y,
    }),
    isBaseWidthWhenKeepRatio: () => false,
    getSizeWhenScaleFromCenter: (width, height) => ({
      width: width,
      height: height * 2,
    }),
  },
  e: {
    getLocalOrigin: (_width, height) => ({ x: 0, y: height / 2 }),
    getNewSize: (newLocalPt, localOrigin, rect) => ({
      width: newLocalPt.x - localOrigin.x,
      height: rect.height,
    }),
    isBaseWidthWhenKeepRatio: () => true,
    getSizeWhenScaleFromCenter: (width, height) => ({
      width: width * 2,
      height: height,
    }),
  },
  w: {
    getLocalOrigin: (width, height) => ({ x: width, y: height / 2 }),
    getNewSize: (newLocalPt, localOrigin, rect) => ({
      width: localOrigin.x - newLocalPt.x,
      height: rect.height,
    }),
    isBaseWidthWhenKeepRatio: () => true,
    getSizeWhenScaleFromCenter: (width, height) => ({
      width: width * 2,
      height: height,
    }),
  },
};

/**
 * get resized rect
 * used for resize operation
 */
export const resizeRect = (
  /** 'se' | 'ne' | 'nw' | 'sw' | 'n' | 'e' | 's' | 'w' */
  type: string,
  newGlobalPt: IPoint,
  rect: ITransformRect,
  options: {
    keepRatio?: boolean;
    scaleFromCenter?: boolean;
    noChangeWidthAndHeight?: boolean;
  } = {
    keepRatio: false,
    scaleFromCenter: false,
    noChangeWidthAndHeight: false,
  },
): ITransformRect => {
  const resizeOp = resizeOps[type];
  if (!resizeOp) {
    throw new Error(`resize type ${type} is invalid`);
  }
  const { keepRatio, scaleFromCenter } = options;

  const transform = new Matrix(...rect.transform);
  const newRect = {
    width: 0,
    height: 0,
    transform: transform.clone(),
  };

  const localOrigin = scaleFromCenter
    ? { x: rect.width / 2, y: rect.height / 2 }
    : resizeOp.getLocalOrigin(rect.width, rect.height);

  const globalOrigin = transform.apply(localOrigin);
  const newLocalPt = transform.applyInverse(newGlobalPt);
  let size = resizeOp.getNewSize(newLocalPt, localOrigin, rect);

  if (scaleFromCenter) {
    size = resizeOp.getSizeWhenScaleFromCenter(size.width, size.height);
  }

  if (keepRatio) {
    const ratio = rect.width / rect.height;
    const newRatio = Math.abs(size.width / size.height);
    const isWidthLarger = newRatio > ratio;
    if (resizeOp.isBaseWidthWhenKeepRatio(isWidthLarger)) {
      size.height = (Math.sign(size.height) * Math.abs(size.width)) / ratio;
    } else {
      size.width = Math.sign(size.width) * Math.abs(size.height) * ratio;
    }
  }

  const scaleTf = new Matrix();

  if (options.noChangeWidthAndHeight) {
    scaleTf.scale(size.width / rect.width, size.height / rect.height);
    newRect.width = rect.width;
    newRect.height = rect.height;
  } else {
    newRect.width = Math.abs(size.width);
    newRect.height = Math.abs(size.height);
    const scaleX = Math.sign(size.width) || 1;
    const scaleY = Math.sign(size.height) || 1;
    scaleTf.scale(scaleX, scaleY);
  }

  newRect.transform = newRect.transform.append(scaleTf);

  const newGlobalOrigin = newRect.transform.apply(
    scaleFromCenter
      ? { x: newRect.width / 2, y: newRect.height / 2 }
      : resizeOp.getLocalOrigin(newRect.width, newRect.height),
  );

  const offset = {
    x: globalOrigin.x - newGlobalOrigin.x,
    y: globalOrigin.y - newGlobalOrigin.y,
  };
  newRect.transform.prepend(new Matrix().translate(offset.x, offset.y));

  return {
    width: newRect.width,
    height: newRect.height,
    transform: [
      newRect.transform.a,
      newRect.transform.b,
      newRect.transform.c,
      newRect.transform.d,
      newRect.transform.tx,
      newRect.transform.ty,
    ],
  };
};
