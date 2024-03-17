import { type IRectWithRotation } from '@suika/geo';

import { type ICursor } from '../cursor_manager';
import { type Graph } from '../graphs';

type HitTest = (
  x: number,
  y: number,
  tol: number,
  rect: IRectWithRotation | null,
) => boolean;

type GetCursorFn = (
  type: string,
  selectedBox: IRectWithRotation | null,
) => ICursor;

export class ControlHandle {
  cx: number;
  cy: number;
  rotation?: number;
  type: string;
  graph: Graph;
  padding: number;
  hitTest?: HitTest;
  getCursor: GetCursorFn;

  constructor(attrs: {
    cx?: number;
    cy?: number;
    type: string;
    rotation?: number;
    padding?: number;
    graph: Graph;
    hitTest?: HitTest;
    getCursor: GetCursorFn;
  }) {
    this.cx = attrs.cx ?? 0;
    this.cy = attrs.cy ?? 0;
    if (attrs.rotation !== undefined) {
      this.rotation = attrs.rotation;
    }
    this.type = attrs.type;
    this.padding = attrs.padding ?? 0;
    this.graph = attrs.graph;
    this.getCursor = attrs.getCursor;
    if (attrs.hitTest) {
      this.hitTest = attrs.hitTest;
    }
  }
}
