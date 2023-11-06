import { IPoint } from '@suika/geo';
import { ICursor } from '../../cursor_manager';
import { Graph } from '../graph';

export class ControlHandle {
  x: number;
  y: number;
  visible: boolean;
  graph: Graph;
  getCursor: (type: string, rotation: number) => ICursor;
  hitTest?: (point: IPoint) => boolean;

  constructor(attrs: {
    x?: number;
    y?: number;
    visible?: boolean;
    graph: Graph;
    getCursor: (type: string, rotation: number) => ICursor;
    hitTest?: (point: IPoint) => boolean;
  }) {
    this.x = attrs.x ?? 0;
    this.y = attrs.y ?? 0;
    this.visible = attrs.visible ?? true;
    this.graph = attrs.graph;
    this.getCursor = attrs.getCursor;
    this.hitTest = attrs.hitTest;
  }
}
