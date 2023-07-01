export interface IRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type IBox = IRect;

export interface IBox2 {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ICircle {
  x: number;
  y: number;
  radius: number;
}

/**
 * 数组长度必须大于等于 1 的数组
 */
export type INoEmptyArray<T> = [T, ...T[]];

export interface IPoint {
  x: number;
  y: number;
}

export interface IObject {
  id: string;
  name: string;
}

export enum GraphType {
  Graph = 0,
  Rect = 1,
  Ellipse = 2,
  Text = 3,
}
