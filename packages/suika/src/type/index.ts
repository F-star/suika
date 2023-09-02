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

export interface IBox2WithMid extends IBox2 {
  midX: number;
  midY: number;
}

export interface IBox2WithRotation extends IBox {
  rotation: number;
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
  Graph = 'Graph',
  Rect = 'Rect',
  Ellipse = 'Ellipse',
  Text = 'Text',
  Line = 'Line',
}

/**
 * set some optional property
 *
 * @example
 * type Foo = { a: string; b: number; c: boolean };
 * type FooWithOptionalB = Optional<Foo, 'b'>;
 * // { a: string; b?: number; c: boolean }
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface IEditorPaperData {
  appVersion: string;
  paperId: string;
  data: string;
}

export interface IVerticalLine {
  x: number;
  ys: number[];
}

export interface IHorizontalLine {
  y: number;
  xs: number[];
}
