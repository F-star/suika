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

export interface ITransformRect {
  width: number;
  height: number;
  transform: IMatrixArr;
}

export interface ICircle {
  x: number;
  y: number;
  radius: number;
}

export type IMatrixArr = [number, number, number, number, number, number];
