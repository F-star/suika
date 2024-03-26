import { type ITexture } from '../../texture';
import { type GraphType } from '../../type';

export interface GraphAttrs {
  type?: GraphType;
  id: string;
  objectName: string;
  x: number;
  y: number;
  width: number;
  height: number;

  /**
   * | a | c | tx|
   * | b | d | ty|
   * | 0 | 0 | 1 |
   *
   * // 替代原来的 x/y，以及 rotation
   */
  // transform?: number[];

  fill?: ITexture[];
  stroke?: ITexture[];
  strokeWidth?: number;

  rotation?: number;
  cornerRadius?: number;
  visible?: boolean;
  lock?: boolean;
}
