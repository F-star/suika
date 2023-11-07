import {
  IPoint,
  IRectWithRotation,
  offsetRect,
  rectToPoints,
} from '@suika/geo';
import { ICursor } from '../../cursor_manager';
import { Editor } from '../../editor';
import { createTransformHandles } from './util';
import { ControlHandle } from './control_handle';
import { ITransformHandleType } from './type';
import { nearestPixelVal } from '../../../utils/common';

const types = [
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
  transformHandles: Map<ITransformHandleType, ControlHandle>;

  constructor(private editor: Editor) {
    const setting = editor.setting;
    this.transformHandles = createTransformHandles({
      size: setting.get('handleSize'),
      fill: setting.get('handleFill'),
      stroke: setting.get('handleStroke'),
      strokeWidth: setting.get('handleStrokeWidth'),
    });
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

      return {
        ...cornerPoints,
        nwRotation: { ...cornerRotation.nw },
        neRotation: { ...cornerRotation.ne },
        seRotation: { ...cornerRotation.se },
        swRotation: { ...cornerRotation.sw },
      };
    })();

    // update handle position
    for (const key of types) {
      const point = handlePoints[key];
      const handle = this.transformHandles.get(key);
      if (!handle) {
        console.warn(`handle ${key} not found`);
        continue;
      }
      handle.x = point.x;
      handle.y = point.y;
    }

    // 绘制缩放控制点
    const ctx = this.editor.ctx;
    this.transformHandles.forEach((handle) => {
      const { x, y } = this.editor.sceneCoordsToViewport(handle.x, handle.y);
      const graph = handle.graph;
      graph.x = nearestPixelVal(x - graph.width / 2);
      graph.y = nearestPixelVal(y - graph.height / 2);

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

    for (let i = types.length - 1; i >= 0; i--) {
      const type = types[i];
      const handle = this.transformHandles.get(type);
      if (!handle) {
        console.warn(`handle ${type} not found`);
        continue;
      }

      const isHit = handle.hitTest
        ? handle.hitTest(hitPointVW)
        : handle.graph.hitTest(hitPointVW.x, hitPointVW.y, handleHitToleration);

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
