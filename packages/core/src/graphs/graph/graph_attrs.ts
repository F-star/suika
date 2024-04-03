import { type IPaint } from '../../paint';
import { type GraphType } from '../../type';

export interface GraphAttrs {
  type?: GraphType;
  id: string;
  objectName: string;
  x: number;
  y: number;
  width: number;
  height: number;

  fill?: IPaint[];
  stroke?: IPaint[];
  strokeWidth?: number;

  rotation?: number;
  cornerRadius?: number;
  visible?: boolean;
  lock?: boolean;
}
