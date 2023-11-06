import { DOUBLE_PI } from '../constant';
import { IBox, IBox2, IBox2WithMid, IPoint } from '../type';
import { IRect } from '@suika/geo';
import { transformRotate } from '@suika/geo';

export function isRectIntersect2(rect1: IBox2, rect2: IBox2) {
  return (
    rect1.minX <= rect2.maxX &&
    rect1.maxX >= rect2.minX &&
    rect1.minY <= rect2.maxY &&
    rect1.maxY >= rect2.minY
  );
}

export function isRectContain2(rect1: IBox2, rect2: IBox2) {
  return (
    rect1.minX <= rect2.minX &&
    rect1.minY <= rect2.minY &&
    rect1.maxX >= rect2.maxX &&
    rect1.maxY >= rect2.maxY
  );
}

/**
 * rect 中心点
 */
export function getRectCenterPoint({
  x,
  y,
  width,
  height,
}: IRect): [cx: number, cy: number] {
  return [x + width / 2, y + height / 2];
}

/**
 * 求向量到上边(y负半轴)的夹角
 * 范围在 [0, Math.PI * 2)
 */
export function calcVectorRadian(cx: number, cy: number, x: number, y: number) {
  const a = [x - cx, y - cy];
  const b = [0, -1];

  const dotProduct = a[0] * b[0] + a[1] * b[1];
  const d =
    Math.sqrt(a[0] * a[0] + a[1] * a[1]) * Math.sqrt(b[0] * b[0] + b[1] * b[1]);
  let radian = Math.acos(dotProduct / d);

  if (x < cx) {
    radian = DOUBLE_PI - radian;
  }
  return radian;
}

/**
 * 计算绝对坐标
 */
export function getAbsoluteCoords(
  rect: IRect,
): [x: number, y: number, x2: number, y2: number, cx: number, cy: number] {
  return [
    rect.x,
    rect.y,
    rect.x + rect.width,
    rect.y + rect.height,
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
  ];
}

/**
 * 计算一个形状左上角的坐标，考虑旋转
 */
export function getElementRotatedXY(element: {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}) {
  const [cx, cy] = getRectCenterPoint(element);
  return transformRotate(element.x, element.y, element.rotation || 0, cx, cy);
}

export const bboxToBbox2 = (bbox: IBox): IBox2 => {
  return {
    minX: bbox.x,
    minY: bbox.y,
    maxX: bbox.x + bbox.width,
    maxY: bbox.y + bbox.height,
  };
};

export const bboxToBboxWithMid = (box: IBox2): IBox2WithMid => {
  return {
    ...box,
    midX: box.minX / 2 + box.maxX / 2,
    midY: box.minY / 2 + box.maxY / 2,
  };
};

export const pointsToVLines = (points: IPoint[]): Map<number, number[]> => {
  const map = new Map<number, number[]>();
  for (const point of points) {
    const { x, y } = point;
    if (!map.has(x)) {
      map.set(x, []);
    }
    map.get(x)!.push(y);
  }
  return map;
};

export const pointsToHLines = (points: IPoint[]): Map<number, number[]> => {
  const map = new Map<number, number[]>();
  for (const point of points) {
    const { x, y } = point;
    if (!map.has(y)) {
      map.set(y, []);
    }
    map.get(y)!.push(x);
  }
  return map;
};
