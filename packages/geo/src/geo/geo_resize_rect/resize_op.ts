import { type IRectWithRotation } from '../../type';

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
    /** 缩放前的矩形 */
    rect: IRectWithRotation,
    /** 新位置 x */
    posX: number,
    /** 新位置 y */
    posY: number,
    /** 缩放中心，其实可以从 rect 中计算 */
    cx: number,
    cy: number,
    /** 是否基于图形中心缩放 */
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

export const resizeOperations: Record<string, IResizeOperation> = {
  se,
  ne,
  nw,
  sw,
  n,
  e,
  s,
  w,
};
