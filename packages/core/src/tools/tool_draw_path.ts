import { cloneDeep, getClosestTimesVal, parseHexToRGBA } from '@suika/common';
import { distance, IPoint } from '@suika/geo';

import { AddGraphCmd, SetGraphsAttrsCmd } from '../commands';
import { ControlHandle } from '../control_handle_manager';
import { ICursor } from '../cursor_manager';
import { Editor } from '../editor';
import { Ellipse, IPathItem, Path } from '../graphs';
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
  cursor: ICursor = 'pen';

  private startPoint: IPoint | null = null;
  private path: Path | null = null;
  private prevPathData: IPathItem[] = [];
  private pathIdx = 0;

  constructor(private editor: Editor) {}
  onActive() {
    if (this.editor.pathEditor.getActive()) {
      this.path = this.editor.pathEditor.getPath()!;
      this.pathIdx = this.path.attrs.pathData.length;
    }
    this.updateControlHandlesWithPreviewHandles(this.getCorrectedPoint());
  }
  onInactive() {
    this.editor.commandManager.batchCommandEnd();

    this.editor.pathEditor.updateControlHandles();
    this.editor.render();
  }

  onMoveExcludeDrag(_e: PointerEvent, isOutsideCanvas: boolean) {
    if (isOutsideCanvas) {
      this.editor.pathEditor.updateControlHandles();
      this.editor.render();
      return;
    }

    if (this.editor.hostEventManager.isSpacePressing) {
      this.editor.pathEditor.updateControlHandles();
    } else {
      const snapPoint = this.checkCursorPtInStartAnchor();
      if (snapPoint) {
        this.editor.setCursor('pen-close');
      } else {
        this.editor.setCursor('pen');
      }
      this.updateControlHandlesWithPreviewHandles(
        snapPoint ?? this.getCorrectedPoint(),
      );
    }
  }

  onStart() {
    const pathEditor = this.editor.pathEditor;
    const snapPoint = this.checkCursorPtInStartAnchor();
    this.startPoint = snapPoint ?? this.getCorrectedPoint();

    // create new path
    if (!pathEditor.getActive()) {
      const pathData: IPathItem[] = [
        {
          segs: [
            {
              point: { ...this.startPoint },
              in: { x: 0, y: 0 },
              out: { x: 0, y: 0 },
            },
          ],
          closed: false,
        },
      ];

      const path = new Path({
        objectName: '',
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
    }
    // add new anchor
    else {
      const path = this.path!;
      this.prevPathData = path.attrs.pathData;
      const newPathData = cloneDeep(path.attrs.pathData);

      // TODO: 应该改为判断是否选中了 path 的末尾 anchor
      // 如果是，则继续绘制。
      if (pathEditor.getSelectedIndicesSize() === 0) {
        this.pathIdx = newPathData.length;
      }

      if (!newPathData[this.pathIdx]) {
        newPathData[this.pathIdx] = {
          segs: [],
          closed: false,
        };
      }
      // 是否因为闭合，而修改第一个 anchor 的 in
      if (snapPoint) {
        newPathData[this.pathIdx].closed = true;
        newPathData[this.pathIdx].segs[0].in = { x: 0, y: 0 };
      } else {
        newPathData[this.pathIdx].segs.push({
          point: this.startPoint,
          in: { x: 0, y: 0 },
          out: { x: 0, y: 0 },
        });
      }

      path.updateAttrs({
        pathData: newPathData,
      });
    }

    const lastSegIdx = this.path!.attrs.pathData[this.pathIdx].segs.length - 1;
    const selectSegIdx = this.checkPathItemClosed() ? 0 : lastSegIdx;
    pathEditor.setSelectedIndices([
      {
        type: 'anchor',
        pathIdx: this.pathIdx,
        segIdx: selectSegIdx,
      },
    ]);

    pathEditor.updateControlHandles();
    this.editor.render();
  }

  onDrag() {
    if (!this.startPoint) {
      console.warn('startPoint is null, check start()');
      return;
    }

    const point = this.getCorrectedPoint();

    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;

    const path = this.path!;
    const currPathItem = path.attrs.pathData[this.pathIdx];
    const lastSegIdx = currPathItem.segs.length - 1;
    const lastSeg = currPathItem.segs[currPathItem.closed ? 0 : lastSegIdx];
    // mirror angle and length

    lastSeg.out = { x: dx, y: dy };
    // （1）按住 alt 时不需要满足对称（2）绘制第一个点时，in 保持为 0
    if (!this.editor.hostEventManager.isAltPressing && lastSegIdx !== 0) {
      lastSeg.in = { x: -dx, y: -dy };
    }

    this.editor.pathEditor.updateControlHandles();
    this.editor.render();
  }

  private checkPathItemClosed() {
    return this.path?.attrs.pathData[this.pathIdx].closed ?? false;
  }

  onEnd() {
    // TODO: 如果是 closed，结束当前 path 的绘制
    if (this.checkPathItemClosed()) {
      this.editor.pathEditor.setSelectedIndices([]);
    }
    this.editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'Update Path Data',
        [this.path!],
        [{ pathData: this.path!.attrs.pathData }],
        [{ pathData: this.prevPathData }],
      ),
    );
    this.editor.commandManager.batchCommandEnd();
  }

  afterEnd() {
    this.startPoint = null;
  }

  onCommandChange() {
    this.updateControlHandlesWithPreviewHandles(this.getCorrectedPoint());
  }

  onSpaceToggle(isSpacePressing: boolean) {
    if (isSpacePressing) {
      this.editor.pathEditor.updateControlHandles();
      this.editor.render();
    } else {
      this.updateControlHandlesWithPreviewHandles(this.getCorrectedPoint());
      this.editor.render();
    }
  }

  onAltToggle() {
    if (!this.startPoint) return;
    this.onDrag();
  }

  /**
   * check if cursor inside start anchor.
   * if true, return start anchor point
   */
  private checkCursorPtInStartAnchor(): IPoint | null {
    const point = this.editor.toolManager.getCurrPoint();
    if (this.path) {
      const pathItem = this.path.attrs.pathData[this.pathIdx];
      if (!pathItem) {
        return null;
      }
      if (pathItem.segs.length > 1) {
        const startAnchorPoint = pathItem.segs.at(0)!.point;
        const anchorSize = 5;
        const isInside =
          distance(startAnchorPoint, point) <=
          this.editor.viewportSizeToScene(anchorSize);
        return isInside ? { ...startAnchorPoint } : null;
      }
    }
    return null;
  }

  /** get corrected cursor point */
  private getCorrectedPoint() {
    const point = this.editor.toolManager.getCurrPoint();
    if (this.editor.setting.get('snapToPixelGrid')) {
      point.x = getClosestTimesVal(point.x, 0.5);
      point.y = getClosestTimesVal(point.y, 0.5);
    }
    return point;
  }

  onViewportXOrYChange() {
    if (this.editor.hostEventManager.isSpacePressing) {
      this.editor.pathEditor.updateControlHandles();
    } else {
      this.updateControlHandlesWithPreviewHandles(this.getCorrectedPoint());
    }
    this.editor.render();
  }

  private updateControlHandlesWithPreviewHandles(point: IPoint) {
    const previewHandles: ControlHandle[] = [];

    if (this.editor.pathEditor.getSelectedIndicesSize() > 0) {
      const lastSeg = this.path?.attrs.pathData[this.pathIdx]?.segs.at(-1);
      if (lastSeg) {
        const previewCurve = new ControlHandle({
          cx: point.x,
          cy: point.y,
          type: 'path-preview-curve',
          getCursor: () => 'default',
          graph: new Path({
            objectName: 'path-preview-curve',
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            pathData: [
              {
                segs: [
                  {
                    point: this.editor.sceneCoordsToViewport(
                      lastSeg.point.x,
                      lastSeg.point.y,
                    ),
                    in: {
                      x: this.editor.sceneSizeToViewport(lastSeg.in.x),
                      y: this.editor.sceneSizeToViewport(lastSeg.in.y),
                    },
                    out: {
                      x: this.editor.sceneSizeToViewport(lastSeg.out.x),
                      y: this.editor.sceneSizeToViewport(lastSeg.out.y),
                    },
                  },
                  {
                    point: this.editor.sceneCoordsToViewport(point.x, point.y),
                    in: { x: 0, y: 0 },
                    out: { x: 0, y: 0 },
                  },
                ],
                closed: false,
              },
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
        objectName: 'path-preview-anchor',
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
