import { parseHexToRGBA } from '@suika/common';
import { getRotatedRectByTwoPoint, IPoint, isPointEqual } from '@suika/geo';

import { RemoveGraphsCmd } from '../commands';
import { ControlHandle } from '../control_handle_manager';
import { Editor } from '../editor';
import { Ellipse, Graph, Line, Path, Rect } from '../graphs';
import { TextureType } from '../texture';

export class PathEditor {
  private _active = false;
  private path: Path | null = null;
  private eventTokens: number[] = [];
  constructor(private editor: Editor) {}

  private onSelectedChange = (items: Graph[]) => {
    if (items.length === 0 && items[0] === this.path) {
      return;
    }
    // end path edit
    this.inactive();
    this.editor.toolManager.setActiveTool('select');
  };

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
    this.editor.selectedElements.on('itemsChange', this.onSelectedChange);
  }
  inactive() {
    if (!this._active) {
      return;
    }

    this._active = false;
    this.removePathIfEmpty();

    this.path = null;
    this.editor.sceneGraph.showSelectedGraphsOutline = true;
    this.editor.sceneGraph.highlightLayersOnHover = true;
    this.editor.controlHandleManager.clearCustomHandles();

    this.unbindHotkeys();
    this.editor.selectedElements.off('itemsChange', this.onSelectedChange);
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
    const token = editor.keybindingManager.registerWithHighPrior({
      key: [{ keyCode: 'Backspace' }, { keyCode: 'Delete' }],
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Path Delete',
      action: () => {
        // TODO: ...
      },
    });
    this.eventTokens.push(token);

    // TODO:
    // esc: finish current path edit
    // enter: end path
  }

  private unbindHotkeys() {
    for (const token of this.eventTokens) {
      this.editor.keybindingManager.unregister(token);
    }
    this.eventTokens = [];
  }

  /**
   * get anchor and control handles
   */
  getControlHandles(
    path: Path | null,
    activePos: { path: number; seg: number[] }[],
  ): ControlHandle[] {
    if (!path) {
      return [];
    }
    const handleStroke = this.editor.setting.get('handleStroke');
    const zoom = this.editor.zoomManager.getZoom();
    const pathData = path.pathData;

    const controlHandles: ControlHandle[] = [];

    for (const pathDataItem of pathData) {
      for (const seg of pathDataItem) {
        const anchor = seg.point;
        // 1. draw anchor
        const anchorControlHandle = new ControlHandle({
          cx: anchor.x,
          cy: anchor.y,
          type: 'anchor',
          graph: new Ellipse({
            x: anchor.x,
            y: anchor.y,
            width: 6,
            height: 6,
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
          getCursor: () => 'default',
        });
        controlHandles.push(anchorControlHandle);
      }
    }

    for (const pos of activePos) {
      const pathItem = pathData[pos.path];
      if (!pathItem) {
        console.warn('pathItem not found', pos.path);
        continue;
      }
      for (const segIndex of pos.seg) {
        const seg = pathItem[segIndex];
        if (!seg) {
          console.warn('seg not found', segIndex);
          continue;
        }
        const anchor = seg.point;

        // 2. draw handleLine and handlePoint
        const handles: IPoint[] = [];
        const handleIn = Path.getHandleIn(seg);
        const handleOut = Path.getHandleOut(seg);
        !isPointEqual(handleIn, anchor) && handles.push(handleOut);
        !isPointEqual(handleOut, anchor) && handles.push(handleIn);

        for (let i = 0; i < handles.length; i++) {
          const handle = handles[i];

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
                  attrs: parseHexToRGBA(handleStroke)!,
                },
              ],
              strokeWidth: 1,
            }),
            getCursor: () => 'default',
          });

          const QUARTER_PI = Math.PI / 4;
          const handlePoint = new ControlHandle({
            cx: handle.x,
            cy: handle.y,
            rotation: QUARTER_PI,
            type: 'handle',
            graph: new Rect({
              x: handle.x,
              y: handle.y,
              width: 4,
              height: 4,
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
            getCursor: () => 'default',
          });

          controlHandles.push(handleLine);
          controlHandles.push(handlePoint);
        }
      }
    }

    return controlHandles;
  }
}
