import { cloneDeep, getClosestTimesVal, parseHexToRGBA } from '@suika/common';
import { IPoint } from '@suika/geo';

import { AddGraphCmd, SetGraphsAttrsCmd } from '../commands';
import { ControlHandle } from '../control_handle_manager';
import { ICursor } from '../cursor_manager';
import { Editor } from '../editor';
import { Ellipse, ISegment, Path } from '../graphs';
import { TextureType } from '../texture';
import { PathSelectTool } from './tool_path_select';
import { ITool } from './type';

const TYPE = 'drawPath';
const HOTKEY = 'p';

export class DrawPathTool implements ITool {
  static readonly type = TYPE;
  static readonly hotkey = HOTKEY;
  readonly type = TYPE;
  readonly hotkey = HOTKEY;
  cursor: ICursor = 'default';

  private startPoint: IPoint | null = null;
  private path: Path | null = null;
  private prevPathData: ISegment[][] = [];
  private pathIdx = 0;
  private currCursorScenePoint: IPoint | null = null;

  constructor(private editor: Editor) {}
  active() {
    if (this.editor.pathEditor.getActive()) {
      this.path = this.editor.pathEditor.getPath()!;
      this.pathIdx = this.path.pathData.length;
    }
  }
  inactive() {
    this.editor.commandManager.batchCommandEnd();

    this.editor.pathEditor.updateControlHandles();
    this.editor.render();
  }

  moveExcludeDrag(e: PointerEvent, isOutsideCanvas: boolean) {
    if (isOutsideCanvas) {
      return;
    }
    const point = this.editor.getSceneCursorXY(e);
    if (this.editor.setting.get('snapToPixelGrid')) {
      point.x = getClosestTimesVal(point.x, 0.5);
      point.y = getClosestTimesVal(point.y, 0.5);
    }

    this.currCursorScenePoint = point;
    if (this.editor.hostEventManager.isSpacePressing) {
      this.editor.pathEditor.updateControlHandles();
    } else {
      this.updateControlHandlesWithPreviewHandles(this.currCursorScenePoint);
    }
  }

  start(e: PointerEvent) {
    const point = this.editor.getSceneCursorXY(e);
    const pathEditor = this.editor.pathEditor;
    if (this.editor.setting.get('snapToPixelGrid')) {
      point.x = getClosestTimesVal(point.x, 0.5);
      point.y = getClosestTimesVal(point.y, 0.5);
    }
    this.startPoint = point;

    if (!pathEditor.getActive()) {
      const pathData: ISegment[][] = [
        [
          {
            point: { ...point },
            handleIn: { x: 0, y: 0 },
            handleOut: { x: 0, y: 0 },
          },
        ],
      ];

      const path = new Path({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        strokeWidth: 1,
        stroke: [
          {
            type: TextureType.Solid,
            attrs: parseHexToRGBA('#000')!,
          },
        ],
        pathData,
      });
      this.path = path;

      this.editor.sceneGraph.addItems([path]);
      this.editor.commandManager.batchCommandStart();
      this.editor.commandManager.pushCommand(
        new AddGraphCmd('Add Path', this.editor, [path]),
        {
          beforeRedo: () => {
            this.editor.pathEditor.active(path);
            this.editor.toolManager.setActiveTool(PathSelectTool.type);
          },
          beforeUndo: () => {
            this.editor.pathEditor.inactive('undo');
          },
        },
      );
      this.editor.selectedElements.setItems([path]);

      pathEditor.active(path);
    } else {
      const path = this.path!;
      this.prevPathData = path.pathData;
      const newPathData = cloneDeep(path.pathData);

      // TODO: 应该改为判断是否选中了 path 的末尾 anchor
      // 如果是，则继续绘制。
      if (pathEditor.getSelectedIndicesSize() === 0) {
        this.pathIdx = path.pathData.length;
      }

      if (!newPathData[this.pathIdx]) {
        newPathData[this.pathIdx] = [];
      }
      newPathData[this.pathIdx].push({
        point,
        handleIn: { x: 0, y: 0 },
        handleOut: { x: 0, y: 0 },
      });
      path.updateAttrs({
        pathData: newPathData,
      });
    }

    pathEditor.setSelectedIndices([
      {
        type: 'anchor',
        pathIdx: this.pathIdx,
        segIdx: this.path!.pathData[this.pathIdx].length - 1,
      },
    ]);

    pathEditor.updateControlHandles();
    this.editor.render();
  }

  drag(e: PointerEvent) {
    if (!this.startPoint) {
      console.warn('startPoint is null, check start()');
      return;
    }

    const point = this.editor.getSceneCursorXY(e);
    this.currCursorScenePoint = point;
    if (this.editor.setting.get('snapToPixelGrid')) {
      point.x = getClosestTimesVal(point.x, 0.5);
      point.y = getClosestTimesVal(point.y, 0.5);
    }

    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;

    const path = this.path!;
    const currPath = path.pathData[this.pathIdx];
    const lastSeg = currPath.at(-1)!;
    // mirror angle and length
    lastSeg.handleOut = { x: dx, y: dy };
    lastSeg.handleIn = { x: -dx, y: -dy };

    this.editor.pathEditor.updateControlHandles();
    this.editor.render();
  }

  end() {
    this.editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'Update Path Data',
        [this.path!],
        [{ pathData: this.path!.pathData }],
        [{ pathData: this.prevPathData }],
      ),
    );
    this.editor.commandManager.batchCommandEnd();
  }

  afterEnd() {
    // noop
  }

  onCommandChange() {
    if (this.currCursorScenePoint) {
      this.updateControlHandlesWithPreviewHandles(this.currCursorScenePoint);
    }
  }

  onSpaceToggle(isSpacePressing: boolean) {
    if (isSpacePressing) {
      this.editor.pathEditor.updateControlHandles();
      this.editor.render();
    } else {
      if (this.currCursorScenePoint) {
        this.updateControlHandlesWithPreviewHandles(this.currCursorScenePoint);
        this.editor.render();
      }
    }
  }

  onViewportXOrYChange() {
    if (this.editor.hostEventManager.isSpacePressing) {
      this.editor.pathEditor.updateControlHandles();
    } else {
      this.updateControlHandlesWithPreviewHandles(this.currCursorScenePoint!);
    }
    this.editor.render();
  }

  private updateControlHandlesWithPreviewHandles(point: IPoint) {
    const previewHandles: ControlHandle[] = [];

    if (this.editor.pathEditor.getSelectedIndicesSize() > 0) {
      const lastSeg = this.path?.pathData[this.pathIdx]?.at(-1);
      if (lastSeg) {
        const previewCurve = new ControlHandle({
          cx: point.x,
          cy: point.y,
          type: 'path-preview-curve',
          getCursor: () => 'default',
          graph: new Path({
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            pathData: [
              [
                {
                  point: this.editor.sceneCoordsToViewport(
                    lastSeg.point.x,
                    lastSeg.point.y,
                  ),
                  handleIn: {
                    x: this.editor.sceneSizeToViewport(lastSeg.handleIn.x),
                    y: this.editor.sceneSizeToViewport(lastSeg.handleIn.y),
                  },
                  handleOut: {
                    x: this.editor.sceneSizeToViewport(lastSeg.handleOut.x),
                    y: this.editor.sceneSizeToViewport(lastSeg.handleOut.y),
                  },
                },
                {
                  point: this.editor.sceneCoordsToViewport(point.x, point.y),
                  handleIn: { x: 0, y: 0 },
                  handleOut: { x: 0, y: 0 },
                },
              ],
            ],
            stroke: [
              {
                type: TextureType.Solid,
                attrs: parseHexToRGBA('#1592fe')!,
              },
            ],
            strokeWidth: 1,
          }),
        });
        previewHandles.push(previewCurve);
      }
    }

    const handleStroke = this.editor.setting.get('handleStroke');

    const previewPoint = new ControlHandle({
      cx: point.x,
      cy: point.y,
      type: 'path-preview-anchor',
      getCursor: () => 'default',
      graph: new Ellipse({
        x: point.x,
        y: point.y,
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
    });
    previewHandles.push(previewPoint);

    this.editor.pathEditor.updateControlHandles(previewHandles);
    this.editor.render();
  }
}
