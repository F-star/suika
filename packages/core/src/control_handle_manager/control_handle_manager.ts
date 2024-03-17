import {
  type IPoint,
  type IRect,
  type IRectWithRotation,
  offsetRect,
  rectToMidPoints,
  rectToPoints,
} from '@suika/geo';

import { type ICursor } from '../cursor_manager';
import { type Editor } from '../editor';
import { GraphType } from '../type';
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
  private transformHandlesVisible = false;
  private transformHandles: Map<ITransformHandleType, ControlHandle>;

  private customHandlesVisible = false;
  private customHandles: ControlHandle[] = [];

  constructor(private editor: Editor) {
    const setting = editor.setting;
    this.transformHandles = createTransformHandles({
      size: setting.get('handleSize'),
      fill: setting.get('handleFill'),
      stroke: setting.get('handleStroke'),
      strokeWidth: setting.get('handleStrokeWidth'),
    });
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

  private updateTransformHandles(rect: IRectWithRotation | null) {
    if (!rect || this.editor.pathEditor.isActive()) {
      this.transformHandlesVisible = false;
      return;
    }
    this.transformHandlesVisible = true;

    const zoom = this.editor.zoomManager.getZoom();
    const handleSize = this.editor.setting.get('handleSize');
    const handleStrokeWidth = this.editor.setting.get('handleStrokeWidth');
    const neswHandleWidth = this.editor.setting.get('neswHandleWidth');

    // calculate handle position
    const handlePoints = (() => {
      const cornerPoints = rectToPoints(rect);

      const offset = handleSize / 2 / zoom;
      const cornerRotation = rectToPoints(offsetRect(rect, offset));

      // when rect size < 40（viewport）, nwse handle should outside the selectedBox
      const MIN_SIZE = 40;
      const offsets: number[] = new Array(4).fill(0);
      if (rect.width * zoom < MIN_SIZE) {
        offsets[1] = offsets[3] = neswHandleWidth / 2 / zoom;
      }
      if (rect.height * zoom < MIN_SIZE) {
        offsets[0] = offsets[2] = neswHandleWidth / 2 / zoom;
      }
      const neswRect = offsetRect(rect, offsets);
      const midPoints = rectToMidPoints(neswRect);

      return {
        ...cornerPoints,
        ...midPoints,
        nwRotation: cornerRotation.nw,
        neRotation: cornerRotation.ne,
        seRotation: cornerRotation.se,
        swRotation: cornerRotation.sw,
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
    n.graph.attrs.width = s.graph.attrs.width =
      rect.width * zoom - handleSize - handleStrokeWidth;
    w.graph.attrs.height = e.graph.attrs.height =
      rect.height * zoom - handleSize - handleStrokeWidth;
    n.graph.attrs.height =
      s.graph.attrs.height =
      w.graph.attrs.width =
      e.graph.attrs.width =
        neswHandleWidth;
  }

  draw(rect: IRectWithRotation | null) {
    this.updateTransformHandles(rect);
    const handles: ControlHandle[] = [];
    if (this.transformHandlesVisible) {
      handles.push(...Array.from(this.transformHandles.values()));
    }
    if (this.customHandlesVisible) {
      handles.push(...this.customHandles);
    }

    const ctx = this.editor.ctx;
    handles.forEach((handle) => {
      const graph = handle.graph;
      if (graph.type === GraphType.Path) {
        // TODO:
      } else {
        const { x, y } = this.editor.sceneCoordsToViewport(
          handle.cx,
          handle.cy,
        );
        graph.updateAttrs({
          x: x - graph.attrs.width / 2,
          y: y - graph.attrs.height / 2,
        });
      }
      if (rect) {
        graph.attrs.rotation = rect.rotation;
      }
      if (handle.rotation !== undefined) {
        graph.attrs.rotation = handle.rotation;
      }

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
    const handles: ControlHandle[] = [];
    if (this.transformHandlesVisible) {
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
        : handle.graph.hitTest(hitPointVW.x, hitPointVW.y, handle.padding);

      if (isHit) {
        return {
          handleName: type,
          cursor: handle.getCursor(type, selectedBox),
        };
      }
    }

    return null;
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
    rect = {
      x: leftTop.x,
      y: leftTop.y,
      width: bottomRight.x - leftTop.x,
      height: bottomRight.y - leftTop.y,
    };
    return this.customHandles.filter((handle) =>
      handle.graph.intersectWithRect(rect),
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
