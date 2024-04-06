import { type IMatrixArr } from '@suika/geo';

import { type IPaint } from '../../paint';
import { type GraphType } from '../../type';

export interface GraphAttrs {
  type?: GraphType;
  id: string;
  objectName: string;
  x: number; // TODO: to delete
  y: number;
  width: number;
  height: number;
  /**
   * | a | c | tx|
   * | b | d | ty|
   * | 0 | 0 | 1 |
   */
  transform: IMatrixArr;

  fill?: IPaint[];
  stroke?: IPaint[];
  strokeWidth?: number;

  cornerRadius?: number;
  visible?: boolean;
  lock?: boolean;
}
