import { type IPoint } from '../type';

export const getMidPoint = (p1: IPoint, p2: IPoint) => {
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
