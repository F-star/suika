import { type PathSegPointType } from '../graphics';

export type SelectedIdexType = PathSegPointType | 'curve';

export interface ISelectedIdxInfo {
  type: SelectedIdexType;
  pathIdx: number;
  segIdx: number;
}
