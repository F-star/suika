import { ITexture } from '../../texture';
import { GraphType } from '../../type';

export interface GraphAttrs {
  type?: GraphType;
  id: string;
  objectName: string;
  x: number;
  y: number;
  width: number;
  height: number;

  fill?: ITexture[];
  stroke?: ITexture[];
  strokeWidth?: number;

  rotation?: number;
  cornerRadius?: number;
  visible?: boolean;
  lock?: boolean;
}
