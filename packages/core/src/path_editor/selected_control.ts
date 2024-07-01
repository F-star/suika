import { cloneDeep, parseHexToRGBA, throttle } from '@suika/common';
import { getRotatedRectByTwoPoint, isPointEqual } from '@suika/geo';

import { ControlHandle } from '../control_handle_manager';
import { type Editor } from '../editor';
import { SuikaEllipse, SuikaLine, SuikaPath } from '../graphs';
import { SuikaRegularPolygon } from '../graphs/regular_polygon';
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
  /** 需要绘制控制点的 segment */
  private segControlsNeedDraw: { pathIdx: number; segIdx: number }[] = [];

  constructor(private editor: Editor) {}

  getSegControlsNeedDraw() {
    return this.segControlsNeedDraw;
  }

  private getItemsNeedDraw() {
    const path = this.editor.pathEditor.getPath();
    const segControlsNeedDrawMap = new Map<number, Set<number>>();
    const segControlsNeedDraw: { pathIdx: number; segIdx: number }[] = [];

    if (!path) {
      console.warn('path is no exist');
      return {
        segControlsNeedDrawMap,
        segControlsNeedDraw,
      };
    }
    const controls = [...this.selectedControls, ...this.normalControls];

    for (const control of controls) {
      const { type, pathIdx, segIdx } = control;

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

      let segIdxSet = segControlsNeedDrawMap.get(pathIdx);
      if (!segIdxSet) {
        segIdxSet = new Set<number>();
        segControlsNeedDrawMap.set(pathIdx, segIdxSet);
      }
      segIdxSet.add(segIdx);
      segControlsNeedDraw.push({ pathIdx, segIdx });

      const leftSegIdx = segIdx - 1;
      const rightSegIdx = segIdx + 1;
      if (type === 'anchor') {
        if (leftSegIdx >= 0) {
          segIdxSet.add(leftSegIdx);
          segControlsNeedDraw.push({ pathIdx, segIdx: leftSegIdx });
        } else if (closed) {
          segIdxSet.add(segCount - 1);
          segControlsNeedDraw.push({ pathIdx, segIdx: segCount - 1 });
        }

        if (rightSegIdx < segCount) {
          segIdxSet.add(rightSegIdx);
          segControlsNeedDraw.push({ pathIdx, segIdx: rightSegIdx });
        } else if (closed) {
          segIdxSet.add(0);
          segControlsNeedDraw.push({ pathIdx, segIdx: 0 });
        }
      } else if (type === 'in') {
        if (leftSegIdx >= 0) {
          segIdxSet.add(leftSegIdx);
          segControlsNeedDraw.push({ pathIdx, segIdx: leftSegIdx });
        }
      } else if (type === 'out' || type === 'curve') {
        if (rightSegIdx < segCount) {
          segIdxSet.add(rightSegIdx);
          segControlsNeedDraw.push({ pathIdx, segIdx: rightSegIdx });
        }
      }
    }

    return {
      segControlsNeedDrawMap,
      segControlsNeedDraw,
    };
  }

  /**
   * get anchor and control handles
   */
  public generateControls(): ControlHandle[] {
    const path = this.editor.pathEditor.getPath();
    if (!path) {
      // console.warn('path is not exist');
      return [];
    }
    // TODO: move to setting.ts
    const padding = 4;
    const handleInOutSize = 6;
    const handleStroke = this.editor.setting.get('handleStroke');
    const zoom = this.editor.zoomManager.getZoom();
    const pathData = path.attrs.pathData;

    const { segControlsNeedDrawMap, segControlsNeedDraw } =
      this.getItemsNeedDraw();

    // side effect
    this.segControlsNeedDraw = segControlsNeedDraw;

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
          graphics: new SuikaEllipse(
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
            {
              advancedAttrs: this.editor.sceneCoordsToViewport(
                anchor.x + anchorSize / 2,
                anchor.y + anchorSize / 2,
              ),
              doc: this.editor.doc,
            },
          ),
          padding,
          getCursor: () => 'default',
        });
        anchors.push(anchorControlHandle);

        // 2. draw handleIn, handleOut, handleInLine and handleOutLine
        const segIdxSet = segControlsNeedDrawMap.get(i);
        if (!segIdxSet || !segIdxSet.has(j)) {
          continue;
        }

        const pathLineStroke = parseHexToRGBA(
          this.editor.setting.get('pathLineStroke'),
        )!;
        const handles = [
          SuikaPath.getHandleIn(seg),
          SuikaPath.getHandleOut(seg),
        ];
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
            graphics: new SuikaLine(
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
              {
                advancedAttrs: { x: rect.x, y: rect.y },
                doc: this.editor.doc,
              },
            ),
            hitTest: () => false,
            getCursor: () => 'default',
          });

          const size = isSelected ? 8.5 : handleInOutSize;
          const handlePoint = new ControlHandle({
            cx: handle.x,
            cy: handle.y,
            type: [handleIdx === 0 ? 'in' : 'out', i, j].join('-'),
            graphics: new SuikaRegularPolygon(
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
                count: 4,
              },
              {
                advancedAttrs: this.editor.sceneCoordsToViewport(
                  handle.x + size / 2,
                  handle.y + size / 2,
                ),
                doc: this.editor.doc,
              },
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
    addedControlHandles = this.generateControls().concat(addedControlHandles);

    this.editor.controlHandleManager.setCustomHandles(addedControlHandles);
    this.editor.controlHandleManager.showCustomHandles();
  });
}
