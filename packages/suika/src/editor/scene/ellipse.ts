import { IBox, GraphType } from '../../type.interface';
import { Graph, IGraph } from './graph';

export interface IEllipseGraph extends IGraph, IBox {}

export class Ellipse extends Graph {
  type = GraphType.Ellipse;
  constructor(options: IEllipseGraph) {
    super(options);
    if (!options.objectName) {
      this.objectName = 'Ellipse ' + this.id;
    }
  }
}
