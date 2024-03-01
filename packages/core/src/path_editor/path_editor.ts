import { EventEmitter, parseHexToRGBA } from '@suika/common';
import { getRotatedRectByTwoPoint, isPointEqual } from '@suika/geo';

import { RemoveGraphsCmd } from '../commands';
import { ControlHandle } from '../control_handle_manager';
import { Editor } from '../editor';
import { Ellipse, Graph, Line, Path, Rect } from '../graphs';
import { TextureType } from '../texture';
import { DrawPathTool, PathSelectTool } from '../tools';
import { SelectTool } from '../tools/tool_select';
import { ISelectedIdxInfo, SelectedIdexType } from './type';

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
  getActive() {
    return this._active;
  }
  active(path: Path) {
    this._active = true;
    this.path = path;

    this.editor.sceneGraph.showSelectedGraphsOutline = false;
    this.editor.sceneGraph.highlightLayersOnHover = false;

    this.unbindHotkeys();
    this.bindHotkeys();

    this.prevToolKeys = this.editor.toolManager.getEnableTools();
    this.editor.toolManager.setEnableHotKeyTools([
      PathSelectTool.type,
      DrawPathTool.type,
    ]);

    this.editor.selectedElements.on('itemsChange', this.onSelectedChange);
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
    if (
      this.path &&
      (this.path.pathData.length === 0 ||
        this.path.pathData.every((item) => item.length <= 1))
    ) {
      this.editor.commandManager.pushCommand(
        new RemoveGraphsCmd('remove empty path', this.editor, [this.path]),
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
      if (pathIdx < 0 || pathIdx >= path.pathData.length) {
        continue;
      }
      const segCount = path.pathData[pathIdx].length;
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
        if (segIdx - 1 >= 0) {
          segIdxSet.add(segIdx - 1);
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
  private getControlHandles(path: Path | null): ControlHandle[] {
    if (!path) {
      return [];
    }
    const QUARTER_PI = Math.PI / 4;
    const padding = 4;
    const handleInOutSize = 4;
    const handleStroke = this.editor.setting.get('handleStroke');
    const zoom = this.editor.zoomManager.getZoom();
    const pathData = path.pathData;

    const handleIndiesNeedDraw = this.getHandleIndiesNeedDraw();

    const anchors: ControlHandle[] = [];
    const handleLinesAndPoints: ControlHandle[] = [];

    for (let i = 0; i < pathData.length; i++) {
      const pathDataItem = pathData[i];
      for (let j = 0; j < pathDataItem.length; j++) {
        const seg = pathDataItem[j];
        const anchor = seg.point;

        // 1. draw anchor
        // 是否要高亮。
        let anchorSize = 6;
        let fillColorStr = '#fff';
        let strokeColorStr = handleStroke;
        if (this.hasSelectedIndex('anchor', i, j)) {
          anchorSize = 8;
          fillColorStr = handleStroke;
          strokeColorStr = '#fff';
        }
        const anchorControlHandle = new ControlHandle({
          cx: anchor.x,
          cy: anchor.y,
          type: ['anchor', i, j].join('-'),
          graph: new Ellipse({
            x: anchor.x,
            y: anchor.y,
            width: anchorSize,
            height: anchorSize,
            fill: [
              {
                type: TextureType.Solid,
                attrs: parseHexToRGBA(fillColorStr)!,
              },
            ],
            stroke: [
              {
                type: TextureType.Solid,
                attrs: parseHexToRGBA(strokeColorStr)!,
              },
            ],
            strokeWidth: 1,
          }),
          padding,
          getCursor: () => 'default',
        });
        anchors.push(anchorControlHandle);

        // 2. draw handleIn, handleOut, handleInLine and handleOutLine
        const segIdxSet = handleIndiesNeedDraw.get(i);
        if (!segIdxSet || !segIdxSet.has(j)) {
          continue;
        }

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
            graph: new Line({
              ...rect,
              width: rect.width * zoom,
              stroke: [
                {
                  type: TextureType.Solid,
                  attrs: parseHexToRGBA('#a4a4a4')!,
                },
              ],
              strokeWidth: 1,
            }),
            hitTest: () => false,
            getCursor: () => 'default',
          });

          const handlePoint = new ControlHandle({
            cx: handle.x,
            cy: handle.y,
            rotation: QUARTER_PI,
            type: [handleIdx === 0 ? 'in' : 'out', i, j].join('-'),
            graph: new Rect({
              x: handle.x,
              y: handle.y,
              width: handleInOutSize,
              height: handleInOutSize,
              fill: [
                {
                  type: TextureType.Solid,
                  attrs: parseHexToRGBA('#fff')!,
                },
              ],
              stroke: [
                {
                  type: TextureType.Solid,
                  attrs: parseHexToRGBA(handleStroke)!,
                },
              ],
              strokeWidth: 1,
            }),
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

  setSelectedIndices(items: ISelectedIdxInfo[]) {
    this.selectedIndices = items;
  }

  private hasSelectedIndex(
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

  updateControlHandles(addedControlHandles: ControlHandle[] = []) {
    const path = this.path!;

    addedControlHandles =
      this.getControlHandles(path).concat(addedControlHandles);

    this.editor.controlHandleManager.setCustomHandles(addedControlHandles);
    this.editor.controlHandleManager.showCustomHandles();
  }
}
