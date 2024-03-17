import { type IPoint } from '@suika/geo';

export type PathSegPointType = 'in' | 'out' | 'anchor';

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
