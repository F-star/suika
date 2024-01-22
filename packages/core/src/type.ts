import { IRect } from '@suika/geo';

import { GraphAttrs } from './graphs';
import { IGroupsData } from './group_manager';

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
  rotation?: number;
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
  type: string;
  visible: boolean;
  lock: boolean;
  name: string;
  children?: IObject[];
}

export enum GraphType {
  Graph = 'Graph',
  Rect = 'Rect',
  Ellipse = 'Ellipse',
  Text = 'Text',
  Line = 'Line',
  // Group = 'Group',
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
  groups: IGroupsData;
  data: GraphAttrs[];
}

export interface IVerticalLine {
  x: number;
  ys: number[];
}

export interface IHorizontalLine {
  y: number;
  xs: number[];
}

/**
 * get all boolean keys of T
 * e.g.
 * type A = { a: string; b: boolean; c: boolean };
 * type B = BooleanKeys<A>; // 'b' | 'c'
 */
export type BooleanKeys<T> = {
  [K in keyof T]: T[K] extends boolean ? K : never;
}[keyof T];
