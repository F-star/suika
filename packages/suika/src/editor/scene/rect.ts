import { IRect } from '../../type.interface';
import { Graph, IGraph } from './graph';

export interface RectGraph extends IGraph, IRect {}

export class Rect extends Graph {
  constructor(options: RectGraph) {
    super(options);
  }
}
