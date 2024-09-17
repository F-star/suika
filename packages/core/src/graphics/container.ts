import { type SuikaGraphics } from './graphics';

export interface IContainer {
  getChildren(): SuikaGraphics[];
  setChildren(graphs: SuikaGraphics[]): void;
}
