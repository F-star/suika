import {
  getTransformAngle,
  type IPoint,
  type IRect,
  type ITransformRect,
  Matrix,
  offsetRect,
  rectToMidPoints,
  rectToVertices,
} from '@suika/geo';

import { HALF_PI } from '../constant';
import { type ICursor } from '../cursor_manager';
import { type SuikaEditor } from '../editor';
import { GraphicsType } from '../type';
import { type ControlHandle } from './control_handle';
import { type ITransformHandleType } from './type';
import { createTransformHandles } from './util';

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
  private transformHandles: Map<ITransformHandleType, ControlHandle>;

  private customHandlesVisible = false;
  private customHandles: ControlHandle[] = [];
  private selectedBoxRect: ITransformRect | null = null;
  enableTransformControl = true;

  constructor(private editor: SuikaEditor) {
    const setting = editor.setting;
    this.transformHandles = createTransformHandles(
      {
        size: setting.get('handleSize'),
        fill: setting.get('handleFill'),
        stroke: setting.get('handleStroke'),
        strokeWidth: setting.get('handleStrokeWidth'),
      },
      editor.doc,
    );
  }

  private onHoverItemChange = () => {
    if (!this.editor.pathEditor.isActive()) {
      const hoverItem = this.editor.selectedElements.getHoverItem();
      const isSingleSelectedGraph = this.editor.selectedElements.size() === 1;
      const selectedGraph = isSingleSelectedGraph
        ? this.editor.selectedElements.getItems()[0]
        : null;
      const isSelectedBoxHovered = this.editor.selectedBox.isHover();

      if (
        isSingleSelectedGraph &&
        selectedGraph &&
        (hoverItem === selectedGraph || isSelectedBoxHovered)
      ) {
        const zoom = this.editor.zoomManager.getZoom();
        this.setCustomHandles(selectedGraph.getControlHandles(zoom, true));
      } else {
        this.setCustomHandles([]);
      }
    }
    this.editor.render();
  };
  bindEvents() {
    this.editor.selectedElements.on('hoverItemChange', this.onHoverItemChange);
    this.editor.selectedBox.on('hoverChange', this.onHoverItemChange);
    this.editor.zoomManager.on('zoomChange', this.onHoverItemChange);
    this.editor.commandManager.on('change', this.onHoverItemChange);
  }

  unbindEvents() {
    this.editor.selectedElements.off('hoverItemChange', this.onHoverItemChange);
    this.editor.selectedBox.off('hoverChange', this.onHoverItemChange);
    this.editor.zoomManager.off('zoomChange', this.onHoverItemChange);
    this.editor.commandManager.off('change', this.onHoverItemChange);
  }

  private updateTransformHandles(rect: ITransformRect) {
    const zoom = this.editor.zoomManager.getZoom();
    const handleSize = this.editor.setting.get('handleSize');
    const handleStrokeWidth = this.editor.setting.get('handleStrokeWidth');
    const neswHandleWidth = this.editor.setting.get('neswHandleWidth');

    // calculate handle position
    const _rect = {
      x: 0,
      y: 0,
      width: rect.width,
      height: rect.height,
    };
    const handlePoints = (() => {
      const cornerPoints = rectToVertices(_rect, rect.transform);

      const offset = handleSize / 2 / zoom;
      const cornerRotates = rectToVertices(
        offsetRect(_rect, offset),
        rect.transform,
      );

      // when rect size < 40（viewport）, nwse handle should outside the selectedBox
      const MIN_SIZE = 40;
      const offsets: number[] = new Array(4).fill(0);
      if (rect.width * zoom < MIN_SIZE) {
        offsets[1] = offsets[3] = neswHandleWidth / 2 / zoom;
      }
      if (rect.height * zoom < MIN_SIZE) {
        offsets[0] = offsets[2] = neswHandleWidth / 2 / zoom;
      }
      const neswRect = offsetRect(_rect, offsets);

      const tf = new Matrix(...rect.transform);
      const midPoints = rectToMidPoints(neswRect).map((point) => {
        const { x, y } = tf.apply(point);
        return { x, y };
      });

      return {
        nw: cornerPoints[0],
        ne: cornerPoints[1],
        se: cornerPoints[2],
        sw: cornerPoints[3],

        n: midPoints[0],
        e: midPoints[1],
        s: midPoints[2],
        w: midPoints[3],

        nwRotation: cornerRotates[0],
        neRotation: cornerRotates[1],
        seRotation: cornerRotates[2],
        swRotation: cornerRotates[3],
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
    const n = this.transformHandles.get('n')!;
    const s = this.transformHandles.get('s')!;
    const w = this.transformHandles.get('w')!;
    const e = this.transformHandles.get('e')!;
    n.graphics.attrs.width = s.graphics.attrs.width =
      rect.width * zoom - handleSize - handleStrokeWidth;
    w.graphics.attrs.height = e.graphics.attrs.height =
      rect.height * zoom - handleSize - handleStrokeWidth;
    n.graphics.attrs.height =
      s.graphics.attrs.height =
      w.graphics.attrs.width =
      e.graphics.attrs.width =
        neswHandleWidth;

    const heightTransform = new Matrix()
      .rotate(HALF_PI)
      .prepend(new Matrix(...rect.transform))
      .rotate(HALF_PI);
    const heightRotate = getTransformAngle([
      heightTransform.a,
      heightTransform.b,
      heightTransform.c,
      heightTransform.d,
      heightTransform.tx,
      heightTransform.ty,
    ]);
    n.rotation = heightRotate;
    s.rotation = heightRotate;
  }

  draw(rect: ITransformRect | null) {
    this.selectedBoxRect = rect;
    if (rect) {
      this.updateTransformHandles(rect);
    }
    const handles: ControlHandle[] = [];
    if (this.shouldRenderTransformControl()) {
      handles.push(...Array.from(this.transformHandles.values()));
    }
    if (this.customHandlesVisible) {
      handles.push(...this.customHandles);
    }

    const ctx = this.editor.ctx;
    const rotate = rect ? getTransformAngle(rect.transform) : 0;
    handles.forEach((handle) => {
      const graph = handle.graphics;
      if (graph.type === GraphicsType.Path) {
        // TODO:
      } else {
        const { x, y } = this.editor.sceneCoordsToViewport(
          handle.cx,
          handle.cy,
        );
        graph.updateAttrs({
          transform: [
            1,
            0,
            0,
            1,
            x - graph.attrs.width / 2,
            y - graph.attrs.height / 2,
          ],
        });
      }
      if (rect && handle.isTransformHandle) {
        graph.setRotate(rotate);
      }
      if (handle.rotation !== undefined) {
        graph.setRotate(handle.rotation);
      }

      if (!graph.isVisible()) {
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
    const handles: ControlHandle[] = [];
    if (this.shouldRenderTransformControl()) {
      handles.push(...Array.from(this.transformHandles.values()));
    }
    if (this.customHandlesVisible) {
      handles.push(...this.customHandles);
    }

    if (handles.length === 0) {
      return null;
    }

    const hitPointVW = this.editor.sceneCoordsToViewport(
      hitPoint.x,
      hitPoint.y,
    );

    const selectedBox = this.editor.selectedBox.getBox();

    for (let i = handles.length - 1; i >= 0; i--) {
      const handle = handles[i];
      const type = handle.type;
      if (!handle) {
        console.warn(`handle ${type} not found`);
        continue;
      }

      const isHit = handle.hitTest
        ? handle.hitTest(
            hitPointVW.x,
            hitPointVW.y,
            handle.padding,
            selectedBox,
          )
        : handle.graphics.hitTest(hitPointVW.x, hitPointVW.y, handle.padding);

      if (isHit) {
        return {
          handleName: type,
          cursor: handle.getCursor(type, selectedBox),
        };
      }
    }

    return null;
  }

  private shouldRenderTransformControl() {
    return this.selectedBoxRect && this.enableTransformControl;
  }

  setCustomHandles(handles: ControlHandle[]) {
    this.customHandles = handles;
  }
  getCustomHandlesIntersectedWithRect(rect: IRect) {
    // convert rect to viewport
    const leftTop = this.editor.sceneCoordsToViewport(rect.x, rect.y);
    const bottomRight = this.editor.sceneCoordsToViewport(
      rect.x + rect.width,
      rect.y + rect.height,
    );
    const box = {
      minX: leftTop.x,
      minY: leftTop.y,
      maxX: bottomRight.x,
      maxY: bottomRight.y,
    };
    return this.customHandles.filter((handle) =>
      handle.graphics.intersectWithBox(box),
    );
  }

  clearCustomHandles() {
    this.customHandles = [];
  }
  hasCustomHandles() {
    return this.customHandles.length > 0;
  }

  showCustomHandles() {
    if (!this.customHandlesVisible) {
      this.customHandlesVisible = true;
      this.editor.render();
    }
  }
  hideCustomHandles() {
    if (this.customHandlesVisible) {
      this.customHandlesVisible = false;
      this.editor.render();
    }
  }
}

export const isTransformHandle = (handleName: string) => {
  return types.includes(handleName as any);
};
