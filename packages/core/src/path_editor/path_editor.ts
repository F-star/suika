import {
  cloneDeep,
  EventEmitter,
  parseHexToRGBA,
  throttle,
} from '@suika/common';
import { getRotatedRectByTwoPoint, isPointEqual } from '@suika/geo';

import { RemoveGraphsCmd } from '../commands';
import { ControlHandle } from '../control_handle_manager';
import { type Editor } from '../editor';
import { Ellipse, type Graph, Line, Path, Rect } from '../graphs';
import { PaintType } from '../paint';
import { DrawPathTool, PathSelectTool } from '../tools';
import { SelectTool } from '../tools/tool_select';
import { type ISelectedIdxInfo, type SelectedIdexType } from './type';

interface Events {
  toggle: (active: boolean) => void;
}

export class PathEditor {
  private _active = false;
  private path: Path | null = null;
  private eventTokens: number[] = [];
  private selectedIndices: ISelectedIdxInfo[] = [];
  private prevToolKeys: string[] = [];
  private eventEmitter = new EventEmitter<Events>();

  constructor(private editor: Editor) {}

  private onSelectedChange = (items: Graph[]) => {
    if (items.length === 0 || items[0] === this.path) {
      return;
    }
    // end path edit
    this.inactive();
    this.editor.toolManager.setActiveTool('select');
  };
  getPath() {
    return this.path;
  }
  isActive() {
    return this._active;
  }
  active(path: Path) {
    this._active = true;
    this.path = path;

    const editor = this.editor;
    editor.sceneGraph.showSelectedGraphsOutline = false;
    editor.sceneGraph.highlightLayersOnHover = false;

    this.unbindHotkeys();
    this.bindHotkeys();

    this.prevToolKeys = editor.toolManager.getEnableTools();
    editor.toolManager.setEnableHotKeyTools([
      PathSelectTool.type,
      DrawPathTool.type,
    ]);
    const currTool = editor.toolManager.getActiveToolName();
    if (currTool !== PathSelectTool.type && currTool !== DrawPathTool.type) {
      editor.toolManager.setActiveTool(PathSelectTool.type);
    }

    editor.selectedElements.on('itemsChange', this.onSelectedChange);
    editor.pathEditor.updateControlHandles();
    this.eventEmitter.emit('toggle', true);
  }
  inactive(source?: 'undo') {
    if (!this._active) {
      return;
    }

    this._active = false;
    if (source !== 'undo') {
      this.removePathIfEmpty();
    }

    this.setSelectedIndices([]);
    this.path = null;
    const editor = this.editor;
    editor.sceneGraph.showSelectedGraphsOutline = true;
    editor.sceneGraph.highlightLayersOnHover = true;

    this.unbindHotkeys();
    editor.toolManager.setEnableHotKeyTools(this.prevToolKeys);
    editor.toolManager.setActiveTool(SelectTool.type);
    editor.selectedElements.off('itemsChange', this.onSelectedChange);

    editor.controlHandleManager.clearCustomHandles();
    editor.render();

    // TODO: FIXME: 加一个结束路径编辑的空命令，但加一个 beforeUndo...

    this.eventEmitter.emit('toggle', false);
  }
  private removePathIfEmpty() {
    const path = this.path;
    if (!path) return;
    const pathData = path.attrs.pathData;
    if (
      pathData.length === 0 ||
      pathData.every((item) => item.segs.length <= 1)
    ) {
      this.editor.commandManager.pushCommand(
        new RemoveGraphsCmd('remove empty path', this.editor, [path]),
      );
    }
  }
  private bindHotkeys() {
    const editor = this.editor;

    this.eventTokens = [];
    // delete / backspace: delete selected segments
    let token = editor.keybindingManager.registerWithHighPrior({
      key: [{ keyCode: 'Backspace' }, { keyCode: 'Delete' }],
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Path Delete',
      action: () => {
        // TODO: 删除选中的控制点
      },
    });
    this.eventTokens.push(token);

    // esc: finish current path edit
    token = editor.keybindingManager.registerWithHighPrior({
      key: { keyCode: 'Escape' },
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Path Finish',
      action: () => {
        if (this.selectedIndices.length > 0) {
          this.setSelectedIndices([]);
          this.updateControlHandles();
          this.editor.render();
        } else {
          this.inactive();
        }
      },
    });
    this.eventTokens.push(token);

    // enter: end path
    token = editor.keybindingManager.registerWithHighPrior({
      key: { keyCode: 'Enter' },
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Path End',
      action: () => {
        this.inactive();
      },
    });
    this.eventTokens.push(token);
  }

  private unbindHotkeys() {
    for (const token of this.eventTokens) {
      this.editor.keybindingManager.unregister(token);
    }
    this.eventTokens = [];
  }

  private getHandleIndiesNeedDraw(): Map<number, Set<number>> {
    const curveMap = new Map<number, Set<number>>();
    const path = this.path;
    if (!path) {
      return curveMap;
    }
    const selectedIndices = this.selectedIndices;

    for (const selectedIndex of selectedIndices) {
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

      if (type === 'anchor') {
        const leftSegIdx = segIdx - 1;
        if (leftSegIdx < 0 && closed) {
          segIdxSet.add(segCount - 1);
        } else if (leftSegIdx >= 0 && !closed) {
          segIdxSet.add(leftSegIdx);
        }
        if (segIdx + 1 < segCount) {
          segIdxSet.add(segIdx + 1);
        }
      } else if (type === 'in') {
        if (segIdx - 1 >= 0) {
          segIdxSet.add(segIdx - 1);
        }
      } else if (type === 'out' || type === 'curve') {
        if (segIdx + 1 < segCount) {
          segIdxSet.add(segIdx + 1);
        }
      }
    }

    return curveMap;
  }

  /**
   * get anchor and control handles
   */
  private getPathControlHandles(path: Path | null): ControlHandle[] {
    if (!path) {
      return [];
    }
    const QUARTER_PI = Math.PI / 4;
    const padding = 4;
    const handleInOutSize = 4;
    const handleStroke = this.editor.setting.get('handleStroke');
    const zoom = this.editor.zoomManager.getZoom();
    const pathData = path.attrs.pathData;

    const handleIndiesNeedDraw = this.getHandleIndiesNeedDraw();

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
        if (this.containsSelectedIndex('anchor', i, j)) {
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
                    attrs: pathLineStroke,
                  },
                ],
                strokeWidth: 1,
              },
              { x: rect.x, y: rect.y },
            ),
            hitTest: () => false,
            getCursor: () => 'default',
          });

          const handlePoint = new ControlHandle({
            cx: handle.x,
            cy: handle.y,
            rotation: QUARTER_PI,
            type: [handleIdx === 0 ? 'in' : 'out', i, j].join('-'),
            graph: new Rect(
              {
                objectName: 'pathHandle',
                width: handleInOutSize,
                height: handleInOutSize,
                fill: [
                  {
                    type: PaintType.Solid,
                    attrs: parseHexToRGBA('#fff')!,
                  },
                ],
                stroke: [
                  {
                    type: PaintType.Solid,
                    attrs: parseHexToRGBA(handleStroke)!,
                  },
                ],
                strokeWidth: 1,
              },
              handle,
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

  getSelectedIndicesSize() {
    return this.selectedIndices.length;
  }
  getSelectedIndices() {
    return cloneDeep(this.selectedIndices);
  }
  setSelectedIndices(items: ISelectedIdxInfo[]) {
    // TODO: solve duplicate indices
    this.selectedIndices = items;
  }
  clearSelectedIndices() {
    this.selectedIndices = [];
  }
  /**
   * parse selected index from string
   * e.g. 'anchor-0-1' -> { type: 'anchor', pathIdx: 0, segIdx: 1 }
   */
  static parseSelectedIndex(selectedIndex: string): ISelectedIdxInfo | null {
    const selectedInfo = selectedIndex.split('-');
    if (selectedInfo.length !== 3) return null;
    return {
      type: selectedInfo[0] as SelectedIdexType,
      pathIdx: parseInt(selectedInfo[1]),
      segIdx: parseInt(selectedInfo[2]),
    };
  }

  containsSelectedIndex(
    type: SelectedIdexType,
    pathIdx: number,
    segIdx: number,
  ) {
    return this.selectedIndices.some(
      (item) =>
        item.type === type &&
        item.pathIdx === pathIdx &&
        item.segIdx === segIdx,
    );
  }

  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }
  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.off(eventName, handler);
  }

  updateControlHandles = throttle(
    (addedControlHandles: ControlHandle[] = []) => {
      const path = this.path!;
      addedControlHandles =
        this.getPathControlHandles(path).concat(addedControlHandles);

      this.editor.controlHandleManager.setCustomHandles(addedControlHandles);
      this.editor.controlHandleManager.showCustomHandles();
    },
  );
}
