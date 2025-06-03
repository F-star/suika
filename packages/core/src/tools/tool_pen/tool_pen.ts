import { getClosestTimesVal, parseHexToRGBA } from '@suika/common';
import { type IPoint } from '@suika/geo';

import { ControlHandle } from '../../control_handle_manager';
import { type ICursor } from '../../cursor_manager';
import { type SuikaEditor } from '../../editor';
import { SuikaEllipse, SuikaPath } from '../../graphics';
import { PaintType } from '../../paint';
import { type IBaseTool, type ITool } from '../type';
import { ToolDrawPathAnchorAdd } from './tool_pen_anchor_add';
import { ToolDrawPathAnchorAppend } from './tool_pen_anchor_append';
import { ToolDrawPathClose } from './tool_pen_anchor_close';
import { ToolDrawPathAnchorRemove } from './tool_pen_anchor_remove';

const TYPE = 'pen';
const HOTKEY = 'p';

export class PenTool implements ITool {
  static readonly type = TYPE;
  static readonly hotkey = HOTKEY;
  readonly type = TYPE;
  readonly hotkey = HOTKEY;
  cursor: ICursor = 'pen';

  path: SuikaPath | null = null;
  pathIdx = 0;

  private childTool: IBaseTool | null = null;

  constructor(private editor: SuikaEditor) {}
  onActive() {
    if (this.editor.pathEditor.isActive()) {
      this.path = this.editor.pathEditor.getPath()!;
      this.pathIdx = this.path.attrs.pathData.length;
    }
    this.updatePreviewHandles(this.getCorrectedPoint());
  }
  onInactive() {
    this.editor.commandManager.batchCommandEnd();

    this.editor.pathEditor.drawControlHandles();
    this.editor.render();
  }

  onMoveExcludeDrag(_e: PointerEvent, isOutsideCanvas: boolean) {
    const editor = this.editor;
    if (isOutsideCanvas) {
      editor.pathEditor.drawControlHandles();
      editor.render();
      return;
    }

    if (this.editor.canvasDragger.isActive()) {
      editor.pathEditor.drawControlHandles();
    } else {
      const closestAnchor = this.path
        ? this.path.getClosestAnchor({
            point: this.editor.toolManager.getCurrPoint(),
            tol: this.editor.toSceneSize(5),
          })
        : null;

      let snapPoint: IPoint | null = null;

      let noRenderPreviewCurve = false;

      if (closestAnchor) {
        // When alt is pressed, clicking will delete the anchor point
        if (editor.hostEventManager.isAltPressing) {
          snapPoint = closestAnchor.point;
          editor.setCursor('pen-anchor-remove');
          noRenderPreviewCurve = true;
        } else if (
          closestAnchor.segIndex === 0 &&
          closestAnchor.pathItemIndex === this.pathIdx
        ) {
          editor.setCursor('pen-close');
          snapPoint = closestAnchor.point;
        } else {
          editor.setCursor('pen');
        }
      } else {
        const projectInfo = this.path?.project(
          this.editor.toolManager.getCurrPoint(),
          this.editor.toSceneSize(5),
        );

        if (projectInfo && editor.hostEventManager.isAltPressing) {
          snapPoint = projectInfo.point;

          editor.setCursor('pen-anchor-add');
          noRenderPreviewCurve = true;
        } else {
          editor.setCursor('pen');
        }
      }

      this.updatePreviewHandles(
        snapPoint ?? this.getCorrectedPoint(),
        noRenderPreviewCurve,
      );
    }
  }

  onStart(event: PointerEvent) {
    const tol = this.editor.toSceneSize(
      this.editor.setting.get('selectionHitPadding'),
    );

    const hitAnchor = this.path
      ? this.path.getClosestAnchor({
          point: this.getCorrectedPoint(),
          tol,
        })
      : null;

    if (hitAnchor && this.editor.hostEventManager.isAltPressing) {
      this.childTool = new ToolDrawPathAnchorRemove(this.editor, this);
    } else if (hitAnchor && hitAnchor.segIndex === 0) {
      this.childTool = new ToolDrawPathClose(this.editor, this);
    } else {
      const projectInfo = this.path
        ? this.path.project(this.editor.toolManager.getCurrPoint(), tol)
        : null;

      if (projectInfo && this.editor.hostEventManager.isAltPressing) {
        this.childTool = new ToolDrawPathAnchorAdd(this.editor, this);
      } else {
        this.childTool = new ToolDrawPathAnchorAppend(this.editor, this);
      }
    }

    this.childTool.onStart(event);
  }

  onDrag(event: PointerEvent) {
    this.childTool?.onDrag(event);
  }

  onEnd(event: PointerEvent, isDragHappened: boolean) {
    this.childTool?.onEnd(event, isDragHappened);
  }

  afterEnd() {
    /* noop */
  }

  onCommandChange() {
    this.updatePreviewHandles(this.getCorrectedPoint());
  }

  onCanvasDragActiveChange(active: boolean) {
    if (active) {
      this.editor.pathEditor.drawControlHandles();
    } else {
      this.updatePreviewHandles(this.getCorrectedPoint());
    }
    this.editor.render();
  }

  /** get corrected cursor point */
  getCorrectedPoint() {
    const point = this.editor.toolManager.getCurrPoint();
    if (this.editor.setting.get('snapToGrid')) {
      point.x = getClosestTimesVal(point.x, 0.5);
      point.y = getClosestTimesVal(point.y, 0.5);
    }
    return point;
  }

  onViewportXOrYChange() {
    if (this.editor.canvasDragger.isActive()) {
      this.editor.pathEditor.drawControlHandles();
    } else {
      this.updatePreviewHandles(this.getCorrectedPoint());
    }
    this.editor.render();
  }

  /** update preview anchor and preview curve */
  private updatePreviewHandles(point: IPoint, noCurve = false) {
    const previewHandles: ControlHandle[] = [];

    if (this.editor.pathEditor.selectedControl.getSelectedControlsSize() > 0) {
      const path = this.path;
      if (!path) return;
      const lastSeg = path.getLastSeg(this.pathIdx, {
        applyTransform: true,
      });
      if (lastSeg && !noCurve) {
        const previewCurve = new ControlHandle({
          cx: point.x,
          cy: point.y,
          type: 'path-preview-curve',
          getCursor: () => 'default',
          graphics: new SuikaPath(
            {
              objectName: 'path-preview-curve',
              width: 0,
              height: 0,
              pathData: [
                {
                  segs: [
                    {
                      point: this.editor.toViewportPt(
                        lastSeg.point.x,
                        lastSeg.point.y,
                      ),
                      in: {
                        x: this.editor.toViewportSize(lastSeg.in.x),
                        y: this.editor.toViewportSize(lastSeg.in.y),
                      },
                      out: {
                        x: this.editor.toViewportSize(lastSeg.out.x),
                        y: this.editor.toViewportSize(lastSeg.out.y),
                      },
                    },
                    {
                      point: this.editor.toViewportPt(point.x, point.y),
                      in: { x: 0, y: 0 },
                      out: { x: 0, y: 0 },
                    },
                  ],
                  closed: false,
                },
              ],
              stroke: [
                {
                  type: PaintType.Solid,
                  attrs: parseHexToRGBA('#1592fe')!,
                },
              ],
              strokeWidth: 1,
            },
            {
              doc: this.editor.doc,
            },
          ),
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
      graphics: new SuikaEllipse(
        {
          objectName: 'path-preview-anchor',
          width: 6,
          height: 6,
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
        {
          advancedAttrs: point,
          doc: this.editor.doc,
        },
      ),
    });
    previewHandles.push(previewPoint);

    this.editor.pathEditor.drawControlHandles(previewHandles);
    this.editor.render();
  }
}
