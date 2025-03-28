import { IPathItem } from '@suika/geo';
import { GraphicsAttrs } from '../graphics';

export interface PathAttrs extends GraphicsAttrs {
  pathData: IPathItem[];
}

export type PathSegPointType = 'in' | 'out' | 'anchor';
