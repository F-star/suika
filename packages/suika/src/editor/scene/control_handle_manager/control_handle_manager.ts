import {
  IPoint,
  IRectWithRotation,
  offsetRect,
  rectToMidPoints,
  rectToPoints,
} from '@suika/geo';
import { ICursor } from '../../cursor_manager';
import { Editor } from '../../editor';
import { createTransformHandles } from './util';
import { ControlHandle } from './control_handle';
import { ITransformHandleType } from './type';
import { Graph } from '../graph';

const types = [
  'n',
  'e',
  's',
  'w',
  'nwRotation',
  'neRotation',
  'seRotation',
  'swRotation',
  'nw',
  'ne',
  'se',
  'sw',
] as const;

/**
 * Control Point Handle
 */
export class ControlHandleManager {
  private visible = false;
  private transformHandles: Map<ITransformHandleType, ControlHandle>;
  private handles: ControlHandle[] = [];

  constructor(private editor: Editor) {
    const setting = editor.setting;
    this.transformHandles = createTransformHandles({
      size: setting.get('handleSize'),
      fill: setting.get('handleFill'),
      stroke: setting.get('handleStroke'),
      strokeWidth: setting.get('handleStrokeWidth'),
    });
  }

  private onHoverItemChange = (hoverItem: Graph | null) => {
    if (
      hoverItem &&
      this.editor.selectedElements.size() === 1 &&
      this.editor.selectedElements.getItems()[0] === hoverItem
    ) {
      this.handles = hoverItem.getControlHandles();
    } else {
      this.handles = [];
    }
  };
  bindEvents() {
    this.editor.selectedElements.on('hoverItemChange', this.onHoverItemChange);
  }

  unbindEvents() {
    this.editor.selectedElements.off('hoverItemChange', this.onHoverItemChange);
  }

  inactive() {
    this.visible = false;
  }

  draw(rect: IRectWithRotation) {
    this.visible = true;
    const zoom = this.editor.zoomManager.getZoom();
    const size = this.editor.setting.get('handleSize');

    // calculate handle position
    const handlePoints = (() => {
      const cornerPoints = rectToPoints(rect);
      const cornerRotation = rectToPoints(offsetRect(rect, size / 2 / zoom));
      const midPoints = rectToMidPoints(rect);

      return {
        ...cornerPoints,
        ...midPoints,
        nwRotation: { ...cornerRotation.nw },
        neRotation: { ...cornerRotation.ne },
        seRotation: { ...cornerRotation.se },
        swRotation: { ...cornerRotation.sw },
      };
    })();

    // update handle position
    for (const type of types) {
      const point = handlePoints[type];
      const handle = this.transformHandles.get(type);
      if (!handle) {
        console.warn(`handle ${type} not found`);
        continue;
      }
      handle.cx = point.x;
      handle.cy = point.y;
    }

    // update n/s/w/e handle graph size
    const neswHandleWidth = this.editor.setting.get('neswHandleWidth');
    const n = this.transformHandles.get('n')!;
    const s = this.transformHandles.get('s')!;
    const w = this.transformHandles.get('w')!;
    const e = this.transformHandles.get('e')!;
    n.graph.width = s.graph.width = rect.width * zoom;
    w.graph.height = e.graph.height = rect.height * zoom;
    n.graph.height =
      s.graph.height =
      w.graph.width =
      e.graph.width =
        neswHandleWidth;

    // draw transform handles
    const ctx = this.editor.ctx;

    const handles = [
      ...this.handles,
      ...Array.from(this.transformHandles.values()),
    ];

    handles.forEach((handle) => {
      const { x, y } = this.editor.sceneCoordsToViewport(handle.cx, handle.cy);
      const graph = handle.graph;
      graph.x = x - graph.width / 2;
      graph.y = y - graph.height / 2;
      graph.rotation = rect.rotation;

      if (!graph.getVisible()) {
        return;
      }
      ctx.save();
      graph.draw(ctx);
      ctx.restore();
    });
  }

  getHandleInfoByPoint(hitPoint: IPoint): {
    handleName: string;
    cursor: ICursor;
  } | null {
    if (!this.visible) {
      return null;
    }

    const hitPointVW = this.editor.sceneCoordsToViewport(
      hitPoint.x,
      hitPoint.y,
    );

    const rotation = this.editor.selectedElements.getRotation();
    const handleHitToleration = this.editor.setting.get('handleHitToleration');

    const handles = [
      ...this.handles,
      ...Array.from(this.transformHandles.values()),
    ];

    for (let i = handles.length - 1; i >= 0; i--) {
      const handle = handles[i];
      const type = handle.graph.objectName;
      if (!handle) {
        console.warn(`handle ${type} not found`);
        continue;
      }

      const isHit = handle.graph.hitTest(
        hitPointVW.x,
        hitPointVW.y,
        handleHitToleration,
      );

      if (isHit) {
        return {
          handleName: type,
          cursor: handle.getCursor(type, rotation),
        };
      }
    }

    return null;
  }
}

export const isTransformHandle = (handleName: string) => {
  return types.includes(handleName as any);
};
