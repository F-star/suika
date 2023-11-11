import { ICursor } from '../../cursor_manager';
import { Graph } from '../graph';

export class ControlHandle {
  x: number;
  y: number;
  graph: Graph;
  getCursor: (type: string, rotation: number) => ICursor;

  constructor(attrs: {
    x?: number;
    y?: number;
    graph: Graph;
    getCursor: (type: string, rotation: number) => ICursor;
  }) {
    this.x = attrs.x ?? 0;
    this.y = attrs.y ?? 0;
    this.graph = attrs.graph;
    this.getCursor = attrs.getCursor;
  }
}
