import { DOUBLE_PI } from '../constant';
import { IBox, IBox2, IBoxWithMid, ICircle, IPoint, IRect } from '../type';
import { transformRotate } from './transform';

/**
 * 根据两个坐标点确定一个矩形
 */
export function getRectByTwoCoord(point1: IPoint, point2: IPoint): IRect {
  return {
    x: Math.min(point1.x, point2.x),
    y: Math.min(point1.y, point2.y),
    width: Math.abs(point1.x - point2.x),
    height: Math.abs(point1.y - point2.y),
  };
}

/**
 * 标准化 rect
 * 处理可能为负数的 width 和 height
 */
export const normalizeRect = ({ x, y, width, height }: IRect) => {
  const x2 = x + width;
  const y2 = y + height;
  return getRectByTwoCoord({ x, y }, { x: x2, y: y2 });
};

/**
 * 标准化角度
 */
export const normalizeAngle = (angle: number): number => {
  if (angle >= DOUBLE_PI) {
    return angle % DOUBLE_PI;
  }
  return angle;
};

/**
 * 求多个矩形组成的包围盒
 */
export function getRectsBBox(...rects: IRect[]): IBox {
  if (rects.length === 0) {
    throw new Error('the count of rect can not be 0');
  }

  const minX = Math.min(...rects.map((rect) => rect.x));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * 点是否在矩形中
 */
export function isPointInRect(point: IPoint, rect: IRect) {
  return (
    point.x >= rect.x &&
    point.y >= rect.y &&
    point.x <= rect.x + rect.width &&
    point.y <= rect.y + rect.height
  );
}

/**
 * 点是否在圆形中
 */
export function isPointInCircle(point: IPoint, circle: ICircle) {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;
  const dSquare = dx * dx + dy * dy;
  return dSquare <= circle.radius * circle.radius;
}

/**
 * 矩形是否相交
 */
export function isRectIntersect(rect1: IRect, rect2: IRect) {
  return (
    rect1.x <= rect2.x + rect2.width &&
    rect1.x + rect1.width >= rect2.x &&
    rect1.y <= rect2.y + rect2.height &&
    rect1.y + rect1.height >= rect2.y
  );
}

export function isRectIntersect2(rect1: IBox2, rect2: IBox2) {
  return (
    rect1.minX <= rect2.maxX &&
    rect1.maxX >= rect2.minX &&
    rect1.minY <= rect2.maxY &&
    rect1.maxY >= rect2.minY
  );
}

/**
 * 矩形 1 是否包含矩形 2
 */
export function isRectContain(rect1: IRect, rect2: IRect) {
  return (
    rect1.x <= rect2.x &&
    rect1.y <= rect2.y &&
    rect1.x + rect1.width >= rect2.x + rect2.width &&
    rect1.y + rect1.height >= rect2.y + rect2.height
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
 * 求向量到右侧轴(x正半轴)的夹角
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
 * 弧度转角度
 */
export function radian2Degree(radian: number) {
  return (radian * 180) / Math.PI;
}

/**
 * 角度转弧度
 */
export function degree2Radian(degree: number) {
  return (degree * Math.PI) / 180;
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

export function arr2point([x, y]: number[]): IPoint {
  return { x, y };
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

export const bboxToBboxWithMid = (box: IBox2): IBoxWithMid => {
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
