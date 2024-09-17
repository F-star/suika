import { type IMatrixArr, type IPoint, type ITransformRect } from '@suika/geo';

import { type ICursor } from '../cursor_manager';
import { type SuikaGraphics } from '../graphics';

type HitTest = (
  point: IPoint,
  tol: number,
  rect: ITransformRect | null,
) => boolean;

type GetCursorFn = (
  type: string,
  selectedBox: ITransformRect | null,
) => ICursor;

export class ControlHandle {
  cx: number;
  cy: number;
  rotation?: number;
  transform?: IMatrixArr;
  type: string;
  graphics: SuikaGraphics;
  padding: number;
  /** rotation will follow rotated bbox */
  isTransformHandle: boolean;
  hitTest?: HitTest;
  getCursor: GetCursorFn;

  constructor(attrs: {
    cx?: number;
    cy?: number;
    type: string;
    rotation?: number;
    transform?: IMatrixArr;
    padding?: number;
    graphics: SuikaGraphics;
    hitTest?: HitTest;
    getCursor: GetCursorFn;
    isTransformHandle?: boolean;
  }) {
    this.cx = attrs.cx ?? 0;
    this.cy = attrs.cy ?? 0;
    if (attrs.rotation !== undefined) {
      this.rotation = attrs.rotation;
    }
    if (attrs.transform) {
      this.transform = attrs.transform;
    }
    this.type = attrs.type;
    this.padding = attrs.padding ?? 0;
    this.graphics = attrs.graphics;
    this.getCursor = attrs.getCursor;
    if (attrs.hitTest) {
      this.hitTest = attrs.hitTest;
    }
    this.isTransformHandle = attrs.isTransformHandle ?? false;

    this.graphics.cancelCollectUpdate();
  }
}
