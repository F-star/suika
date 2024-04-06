import { getSweepAngle, type IRect } from '@suika/geo';

import { HALF_PI } from '../constant';
import { type IBox, type IBox2, type IBox2WithMid, type IPoint } from '../type';

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

export const adjustSizeToKeepPolarSnap = (rect: IRect): IRect => {
  const radian = getSweepAngle(
    { x: 0, y: -1 },
    {
      x: rect.width,
      y: rect.height,
    },
  );

  const { width, height } = rect;
  const remainder = radian % HALF_PI;
  if (remainder < Math.PI / 8 || remainder > (Math.PI * 3) / 8) {
    if (Math.abs(width) > Math.abs(height)) {
      rect.height = 0;
    } else {
      rect.width = 0;
    }
  } else {
    const min = Math.min(Math.abs(width), Math.abs(height));
    const max = Math.max(Math.abs(width), Math.abs(height));
    const size = min + (max - min) / 2;

    rect.height = (Math.sign(height) || 1) * size;
    rect.width = (Math.sign(width) || 1) * size;
  }
  return rect;
};
