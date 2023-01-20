import { IBox } from '../../type.interface';
import { Graph, IGraph } from './graph';

export interface IEllipseGraph extends IGraph, IBox {}

export class Ellipse extends Graph {
  constructor(options: IEllipseGraph) {
    super(options);
  }
}
