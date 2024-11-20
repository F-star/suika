export interface IPoint {
  x: number;
  y: number;
}

export interface ISize {
  width: number;
  height: number;
}

export interface IRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
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

export type IMatrixArr = [
  a: number,
  b: number,
  c: number,
  d: number,
  tx: number,
  ty: number,
];

export interface ISegment {
  point: IPoint;
  /** the coordinates relative to point */
  in: IPoint;
  /** the coordinates relative to point */
  out: IPoint;
}

export interface IPathItem {
  segs: ISegment[];
  closed: boolean;
}

/**
 * only support 'M', 'L' and 'C'
 */
export interface IPathCommand {
  type: string;
  points: IPoint[];
}
