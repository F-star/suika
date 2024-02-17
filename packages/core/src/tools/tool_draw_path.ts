import { cloneDeep, getClosestTimesVal, parseHexToRGBA } from '@suika/common';
import { IPoint } from '@suika/geo';

import { AddGraphCmd, SetGraphsAttrsCmd } from '../commands';
import { ControlHandle } from '../control_handle_manager';
import { ICursor } from '../cursor_manager';
import { Editor } from '../editor';
import { Ellipse, ISegment, Path } from '../graphs';
import { TextureType } from '../texture';
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
  private pathIndex = -1;
  private currCursorScenePoint: IPoint | null = null;

  constructor(private editor: Editor) {}
  active() {
    // noop
  }
  inactive() {
    this.editor.commandManager.batchCommandEnd();

    this.editor.pathEditor.inactive();
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
      this.updateControlHandles();
    } else {
      this.updateControlHandlesAndPreviewHandles(this.currCursorScenePoint);
    }
  }

  start(e: PointerEvent) {
    const point = this.editor.getSceneCursorXY(e);
    if (this.editor.setting.get('snapToPixelGrid')) {
      point.x = getClosestTimesVal(point.x, 0.5);
      point.y = getClosestTimesVal(point.y, 0.5);
    }
    this.startPoint = point;

    if (!this.editor.pathEditor.getActive()) {
      this.pathIndex = 0;

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
            attrs: {
              r: 0,
              g: 0,
              b: 0,
              a: 1,
            },
          },
        ],
        pathData,
      });
      this.path = path;

      this.editor.sceneGraph.addItems([path]);
      this.editor.commandManager.batchCommandStart();
      this.editor.commandManager.pushCommand(
        new AddGraphCmd('add path', this.editor, [path]),
      );
      this.editor.selectedElements.setItems([path]);

      this.editor.pathEditor.active(path);
    } else {
      this.prevPathData = this.path!.pathData;
      const pathData = cloneDeep(this.path!.pathData);
      this.path?.updateAttrs({
        pathData,
      });
      const pathDataItem = this.path!.pathData[this.pathIndex];
      pathDataItem.push({
        point,
        handleIn: { x: 0, y: 0 },
        handleOut: { x: 0, y: 0 },
      });
    }

    this.updateControlHandles();
    this.editor.render();
  }

  drag(e: PointerEvent) {
    if (!this.startPoint) {
      console.warn('startPoint is null, check start()');
      return;
    }

    const point = this.editor.getSceneCursorXY(e);
    if (this.editor.setting.get('snapToPixelGrid')) {
      point.x = getClosestTimesVal(point.x, 0.5);
      point.y = getClosestTimesVal(point.y, 0.5);
    }

    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;

    const path = this.path!;
    const currPath = path.pathData[this.pathIndex];
    const lastSeg = currPath.at(-1)!;
    // mirror angle and length
    lastSeg.handleOut = { x: dx, y: dy };
    lastSeg.handleIn = { x: -dx, y: -dy };

    this.updateControlHandles();
    this.editor.render();
  }

  end() {
    this.editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update path data',
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
      this.updateControlHandlesAndPreviewHandles(this.currCursorScenePoint);
    }
  }

  onSpaceToggle(isSpacePressing: boolean) {
    if (isSpacePressing) {
      this.updateControlHandles();
      this.editor.render();
    } else {
      if (this.currCursorScenePoint) {
        this.updateControlHandlesAndPreviewHandles(this.currCursorScenePoint);
        this.editor.render();
      }
    }
  }

  onViewportXOrYChange() {
    if (this.editor.hostEventManager.isSpacePressing) {
      this.updateControlHandles();
    } else {
      this.updateControlHandlesAndPreviewHandles(this.currCursorScenePoint!);
    }
    this.editor.render();
  }

  private updateControlHandlesAndPreviewHandles(point: IPoint) {
    const previewHandles: ControlHandle[] = [];

    const lastSeg = this.path?.pathData[this.pathIndex]?.at(-1);
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

    this.updateControlHandles(previewHandles);
    this.editor.render();
  }

  private updateControlHandles(controlHandles: ControlHandle[] = []) {
    const path = this.path!;
    if (this.pathIndex !== -1) {
      const currPath: ISegment[] | undefined = path.pathData[this.pathIndex];

      const segIndies = currPath ? [currPath.length - 1] : [];
      if (currPath && currPath.length > 1) {
        segIndies.push(currPath.length - 2);
      }

      controlHandles = this.editor.pathEditor
        .getControlHandles(path, [{ path: this.pathIndex, seg: segIndies }])
        .concat(controlHandles);
    }

    this.editor.controlHandleManager.setCustomHandles(controlHandles);
    this.editor.controlHandleManager.showCustomHandles();
  }
}
