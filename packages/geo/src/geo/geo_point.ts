import { IPoint } from '../type';

export const getMidPoint = (p1: IPoint, p2: IPoint) => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
};

export const addPoint = (p1: IPoint, p2: IPoint) => {
  return {
    x: p1.x + p2.x,
    y: p1.y + p2.y,
  };
};

export const isPointEqual = (p1: IPoint, p2: IPoint) =>
  p1.x === p2.x && p1.y === p2.y;
