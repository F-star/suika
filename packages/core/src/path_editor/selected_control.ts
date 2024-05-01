import { cloneDeep, parseHexToRGBA, throttle } from '@suika/common';
import { getRotatedRectByTwoPoint, isPointEqual } from '@suika/geo';

import { ControlHandle } from '../control_handle_manager';
import { type Editor } from '../editor';
import { Ellipse, Line, Path, Rect } from '../graphs';
import { PaintType } from '../paint';
import { type ISelectedIdxInfo, type SelectedIdexType } from './type';

/**
 * Path Selected Control Handler Manager
 */
export class SelectedControl {
  /** 没有被选中，但要绘制的 anchor/in/out 控制点 */
  private normalControls: ISelectedIdxInfo[] = [];
  /** 需要高亮的控制点 */
  private selectedControls: ISelectedIdxInfo[] = [];

  constructor(private editor: Editor) {}

  private getItemsNeedDraw(path: Path | null): Map<number, Set<number>> {
    const curveMap = new Map<number, Set<number>>();
    if (!path) {
      return curveMap;
    }
    const selectedControls = [...this.selectedControls, ...this.normalControls];

    for (const selectedIndex of selectedControls) {
      const { type, pathIdx, segIdx } = selectedIndex;

      // invalid index
      if (pathIdx < 0 || pathIdx >= path.attrs.pathData.length) {
        continue;
      }
      const pathItem = path.attrs.pathData[pathIdx];
      const segCount = pathItem.segs.length;
      const closed = pathItem.closed;
      if (segIdx < 0 || segIdx >= segCount) {
        continue;
      }

      let segIdxSet = curveMap.get(pathIdx);
      if (!segIdxSet) {
        segIdxSet = new Set<number>();
        curveMap.set(pathIdx, segIdxSet);
      }
      segIdxSet.add(segIdx);

      const leftSegIdx = segIdx - 1;
      const rightSegIdx = segIdx + 1;
      if (type === 'anchor') {
        if (leftSegIdx >= 0) {
          segIdxSet.add(leftSegIdx);
        } else if (closed) {
          segIdxSet.add(segCount - 1);
        }

        if (rightSegIdx < segCount) {
          segIdxSet.add(rightSegIdx);
        } else if (closed) {
          segIdxSet.add(0);
        }
      } else if (type === 'in') {
        if (leftSegIdx >= 0) {
          segIdxSet.add(leftSegIdx);
        }
      } else if (type === 'out' || type === 'curve') {
        if (rightSegIdx < segCount) {
          segIdxSet.add(rightSegIdx);
        }
      }
    }

    return curveMap;
  }

  /**
   * get anchor and control handles
   */
  public generateControls(path: Path | null): ControlHandle[] {
    if (!path) {
      return [];
    }
    const QUARTER_PI = Math.PI / 4;
    // TODO: move to setting.ts
    const padding = 4;
    const handleInOutSize = 4;
    const handleStroke = this.editor.setting.get('handleStroke');
    const zoom = this.editor.zoomManager.getZoom();
    const pathData = path.attrs.pathData;

    const handleIndiesNeedDraw = this.getItemsNeedDraw(path);

    const anchors: ControlHandle[] = [];
    const handleLinesAndPoints: ControlHandle[] = [];

    for (let i = 0; i < pathData.length; i++) {
      const pathItem = pathData[i];
      for (let j = 0; j < pathItem.segs.length; j++) {
        const seg = path.getSeg(i, j, {
          applyTransform: true,
        })!;
        const anchor = seg.point;

        // 1. draw anchor
        let anchorSize = 6;
        let anchorFill = '#fff';
        let anchorStroke = handleStroke;
        if (this.contains('anchor', i, j)) {
          // TODO: move to setting.ts
          anchorSize = 8;
          anchorFill = handleStroke;
          anchorStroke = '#fff';
        }
        const anchorControlHandle = new ControlHandle({
          cx: anchor.x,
          cy: anchor.y,
          type: ['anchor', i, j].join('-'),
          graph: new Ellipse(
            {
              objectName: 'anchor',
              width: anchorSize,
              height: anchorSize,
              fill: [
                {
                  type: PaintType.Solid,
                  attrs: parseHexToRGBA(anchorFill)!,
                },
              ],
              stroke: [
                {
                  type: PaintType.Solid,
                  attrs: parseHexToRGBA(anchorStroke)!,
                },
              ],
              strokeWidth: 1,
            },
            this.editor.sceneCoordsToViewport(
              anchor.x + anchorSize / 2,
              anchor.y + anchorSize / 2,
            ),
          ),
          padding,
          getCursor: () => 'default',
        });
        anchors.push(anchorControlHandle);

        // 2. draw handleIn, handleOut, handleInLine and handleOutLine
        const segIdxSet = handleIndiesNeedDraw.get(i);
        if (!segIdxSet || !segIdxSet.has(j)) {
          continue;
        }

        const pathLineStroke = parseHexToRGBA(
          this.editor.setting.get('pathLineStroke'),
        )!;
        const handles = [Path.getHandleIn(seg), Path.getHandleOut(seg)];
        for (let handleIdx = 0; handleIdx < handles.length; handleIdx++) {
          const handle = handles[handleIdx];
          if (isPointEqual(handle, anchor)) {
            continue;
          }

          const isSelected =
            (handleIdx === 0 && this.contains('in', i, j)) ||
            (handleIdx === 1 && this.contains('out', i, j));

          const rect = getRotatedRectByTwoPoint(anchor, handle);
          const handleLine = new ControlHandle({
            cx: rect.x + rect.width / 2,
            cy: rect.y + rect.height / 2,
            type: 'handleLine',
            rotation: rect.rotation,
            graph: new Line(
              {
                objectName: 'handleLine',
                height: rect.height,
                width: rect.width * zoom,
                stroke: [
                  {
                    type: PaintType.Solid,
                    attrs: isSelected
                      ? parseHexToRGBA(handleStroke)!
                      : pathLineStroke,
                  },
                ],
                strokeWidth: 1,
              },
              { x: rect.x, y: rect.y },
            ),
            hitTest: () => false,
            getCursor: () => 'default',
          });

          const size = isSelected ? 6.5 : handleInOutSize;
          const handlePoint = new ControlHandle({
            cx: handle.x,
            cy: handle.y,
            rotation: QUARTER_PI,
            type: [handleIdx === 0 ? 'in' : 'out', i, j].join('-'),
            graph: new Rect(
              {
                objectName: 'pathHandle',
                width: size,
                height: size,
                fill: [
                  {
                    type: PaintType.Solid,
                    attrs: parseHexToRGBA(isSelected ? handleStroke : '#fff')!,
                  },
                ],
                stroke: [
                  {
                    type: PaintType.Solid,
                    attrs: parseHexToRGBA(isSelected ? '#fff' : handleStroke)!,
                  },
                ],
                strokeWidth: isSelected ? 1.5 : 1,
              },
              this.editor.sceneCoordsToViewport(
                handle.x + size / 2,
                handle.y + size / 2,
              ),
            ),
            padding,
            getCursor: () => 'default',
          });

          handleLinesAndPoints.push(handleLine, handlePoint);
        }
      }
    }

    return anchors.concat(handleLinesAndPoints);
  }

  contains(type: SelectedIdexType, pathIdx: number, segIdx: number) {
    return this.selectedControls.some(
      (item) =>
        item.type === type &&
        item.pathIdx === pathIdx &&
        item.segIdx === segIdx,
    );
  }

  getSelectedControlsSize() {
    return this.selectedControls.length;
  }
  getSelectedControls() {
    return cloneDeep(this.selectedControls);
  }
  setItems(items: ISelectedIdxInfo[]) {
    // TODO: solve duplicate indices
    this.selectedControls = items;
  }
  clear() {
    this.selectedControls = [];
  }

  setNormalControls(items: ISelectedIdxInfo[]) {
    this.normalControls = items;
  }
  getNormalControls() {
    // TODO: solve duplicate indices
    return cloneDeep(this.normalControls);
  }

  drawControlHandles = throttle((addedControlHandles: ControlHandle[] = []) => {
    const path = this.editor.pathEditor.getPath()!;
    addedControlHandles =
      this.generateControls(path).concat(addedControlHandles);

    this.editor.controlHandleManager.setCustomHandles(addedControlHandles);
    this.editor.controlHandleManager.showCustomHandles();
  });
}
