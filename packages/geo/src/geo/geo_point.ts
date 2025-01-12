import { type IPoint } from '../type';

export const midPoint = (p1: IPoint, p2: IPoint) => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
};

export const pointAdd = (p1: IPoint, p2: IPoint) => {
  return {
    x: p1.x + p2.x,
    y: p1.y + p2.y,
  };
};

export const pointSub = (p1: IPoint, p2: IPoint): IPoint => {
  return {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
  };
};

export const isZeroPoint = (p: IPoint) => {
  return p.x === 0 && p.y === 0;
};

const TOL = 0.0000000001;

export const isPointEqual = (p1: IPoint, p2: IPoint, tol = TOL) => {
  return Math.abs(p1.x - p2.x) < tol && Math.abs(p1.y - p2.y) < tol;
};

export const distance = (p1: IPoint, p2: IPoint) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export const lerpNum = (start: number, end: number, t: number): number => {
  return start * (1 - t) + end * t;
};

export const lerp = (start: IPoint, end: IPoint, t: number) => {
  return {
    x: lerpNum(start.x, end.x, t),
    y: lerpNum(start.y, end.y, t),
  };
};

export const normalizeVec = (p: IPoint) => {
  const len = Math.sqrt(p.x * p.x + p.y * p.y);
  return {
    x: p.x / len,
    y: p.y / len,
  };
};

/**
 * Given a point on a line segment,
 * find two points that are perpendicular to the line segment and at a given distance
 */
export const getPerpendicularPoints = (
  line: [IPoint, IPoint],
  p: IPoint,
  distance: number,
) => {
  const vec = pointSub(line[1], line[0]);
  const perpendicularVec = {
    x: -vec.y,
    y: vec.x,
  };
  const unitVec = normalizeVec(perpendicularVec);
  const p1 = {
    x: p.x + unitVec.x * distance,
    y: p.y + unitVec.y * distance,
  };
  const p2 = {
    x: p.x - unitVec.x * distance,
    y: p.y - unitVec.y * distance,
  };
  return [p1, p2];
};
