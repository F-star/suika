export interface IPoint {
  x: number;
  y: number;
}

export interface IRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type IBox = IRect;

export interface IRectWithRotation extends IRect {
  rotation?: number;
}

export interface ICircle {
  x: number;
  y: number;
  radius: number;
}
