import { IRectWithRotation } from '@suika/geo';
import { ICursor } from '../../cursor_manager';
import { Graph } from '../graph';

type HitTest = (
  x: number,
  y: number,
  tol: number,
  rect: IRectWithRotation,
) => boolean;

type GetCursor = (
  type: string,
  rotation: number,
  selectedBox: IRectWithRotation,
) => ICursor;

export class ControlHandle {
  cx: number;
  cy: number;
  type: string;
  graph: Graph;
  padding: number;
  hitTest?: HitTest;
  getCursor: GetCursor;

  constructor(attrs: {
    cx?: number;
    cy?: number;
    type: string;
    padding?: number;
    graph: Graph;
    hitTest?: HitTest;
    getCursor: GetCursor;
  }) {
    this.cx = attrs.cx ?? 0;
    this.cy = attrs.cy ?? 0;
    this.type = attrs.type;
    this.padding = attrs.padding ?? 0;
    this.graph = attrs.graph;
    this.getCursor = attrs.getCursor;
    if (attrs.hitTest) {
      this.hitTest = attrs.hitTest;
    }
  }
}
