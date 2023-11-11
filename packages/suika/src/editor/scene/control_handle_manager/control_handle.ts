import { ICursor } from '../../cursor_manager';
import { Graph } from '../graph';

export class ControlHandle {
  cx: number;
  cy: number;
  graph: Graph;
  getCursor: (type: string, rotation: number) => ICursor;

  constructor(attrs: {
    cx?: number;
    cy?: number;
    graph: Graph;
    getCursor: (type: string, rotation: number) => ICursor;
  }) {
    this.cx = attrs.cx ?? 0;
    this.cy = attrs.cy ?? 0;
    this.graph = attrs.graph;
    this.getCursor = attrs.getCursor;
  }
}
