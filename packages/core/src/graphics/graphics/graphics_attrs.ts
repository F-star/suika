import { type IMatrixArr } from '@suika/geo';

import { type IPaint } from '../../paint';
import { type GraphicsType as GraphicsType } from '../../type';
import { type SuikaDocument } from '../document';

export interface GraphicsAttrs {
  type?: GraphicsType;
  id: string;
  objectName: string;
  width: number;
  height: number;
  /**
   * | a | c | tx|
   * | b | d | ty|
   * | 0 | 0 | 1 |
   */
  transform: IMatrixArr;

  opacity?: number;

  fill?: IPaint[];
  stroke?: IPaint[];
  strokeWidth?: number;

  visible?: boolean;
  lock?: boolean;

  parentIndex?: IParentIndex;

  cornerRadius?: number;
  count?: number;
  starInnerScale?: number;
}

export interface IParentIndex {
  guid: string;
  position: string;
}

export interface IAdvancedAttrs {
  x?: number;
  y?: number;
  rotate?: number;
}

export interface IGraphicsOpts {
  // advance attribute, will convert to 'attrs.transform'
  advancedAttrs?: IAdvancedAttrs;
  doc: SuikaDocument;
  noCollectUpdate?: boolean;
}
