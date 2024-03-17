import { type PathSegPointType } from '../graphs';

export type SelectedIdexType = PathSegPointType | 'curve';

export interface ISelectedIdxInfo {
  type: SelectedIdexType;
  pathIdx: number;
  segIdx: number;
}
