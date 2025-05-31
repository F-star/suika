import { cloneDeep, parseHexToRGBA } from '@suika/common';
import type { IMatrixArr, IPathItem, IPoint, ISegment } from '@suika/geo';

import { AddGraphCmd, SetGraphsAttrsCmd } from '../../commands';
import { type SuikaEditor } from '../../editor';
import { GraphicsObjectSuffix, SuikaPath } from '../../graphics';
import { PaintType } from '../../paint';
import { getNoConflictObjectName } from '../../utils';
import { PathSelectTool } from '../tool_path_select';
import { type IBaseTool } from '../type';
import { type PenTool } from './tool_pen';

export class ToolDrawPathAnchorAppend implements IBaseTool {
  private startPoint: IPoint | null = null;
  private prevAttrs: {
    transform: IMatrixArr;
    pathData: IPathItem[];
  } | null = null;

  constructor(private editor: SuikaEditor, private parentTool: PenTool) {}

  onActive() {
    /* noop */
  }

  onInactive() {
    /* noop */
  }

  onAltToggle() {
    if (!this.startPoint) return;
    this.onDrag();
  }

  onStart() {
    const pathEditor = this.editor.pathEditor;

    this.startPoint = this.parentTool.getCorrectedPoint();

    // create new path
    if (!pathEditor.isActive()) {
      const pathItemData: IPathItem[] = [
        {
          segs: [
            {
              point: { x: 0, y: 0 },
              in: { x: 0, y: 0 },
              out: { x: 0, y: 0 },
            },
          ],
          closed: false,
        },
      ];

      const currCanvas = this.editor.doc.getCurrCanvas();
      const path = new SuikaPath(
        {
          objectName: getNoConflictObjectName(
            currCanvas,
            GraphicsObjectSuffix.Path,
          ),
          width: 100,
          height: 100,
          strokeWidth: 1,
          stroke: [
            {
              type: PaintType.Solid,
              attrs: parseHexToRGBA('#000')!,
            },
          ],
          pathData: pathItemData,
        },
        {
          advancedAttrs: this.startPoint,
          doc: this.editor.doc,
        },
      );
      this.parentTool.path = path;

      this.editor.sceneGraph.addItems([path]);
      this.editor.doc.getCurrCanvas().insertChild(path);
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

      this.prevAttrs = cloneDeep({
        transform: path.attrs.transform,
        pathData: path.attrs.pathData,
      });

      pathEditor.active(path);
    }
    // add new anchor
    else {
      const path = this.parentTool.path!;
      this.prevAttrs = cloneDeep({
        transform: path.attrs.transform,
        pathData: path.attrs.pathData,
      });

      if (pathEditor.selectedControl.getSelectedControlsSize() === 0) {
        this.parentTool.pathIdx = path.getPathItemCount();
      }

      if (!path.hasPath(this.parentTool.pathIdx)) {
        path.addEmptyPath();
      }

      path.addSeg(this.parentTool.pathIdx, {
        point: this.startPoint,
        in: { x: 0, y: 0 },
        out: { x: 0, y: 0 },
      });
    }

    const lastSegIdx =
      this.parentTool.path!.getSegCount(this.parentTool.pathIdx) - 1;
    const selectSegIdx = lastSegIdx;
    pathEditor.selectedControl.setItems([
      {
        type: 'anchor',
        pathIdx: this.parentTool.pathIdx,
        segIdx: selectSegIdx,
      },
    ]);

    pathEditor.drawControlHandles();
    this.editor.render();
  }

  onDrag() {
    if (!this.startPoint) {
      console.warn('startPoint is null, check start()');
      return;
    }

    const point = this.parentTool.getCorrectedPoint();

    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;

    const path = this.parentTool.path!;
    const lastSegIdx = path.getSegCount(this.parentTool.pathIdx) - 1;
    // mirror angle and length
    const inAndOut: Partial<ISegment> = {
      out: { x: dx, y: dy },
    };
    // （1）按住 alt 时不需要满足对称（2）绘制第一个点时，in 保持为 0
    if (!this.editor.hostEventManager.isAltPressing && lastSegIdx !== 0) {
      inAndOut.in = { x: -dx, y: -dy };
    }
    path.setSeg(this.parentTool.pathIdx, lastSegIdx, inAndOut);

    this.editor.pathEditor.drawControlHandles();
    this.editor.render();
  }

  onEnd() {
    const path = this.parentTool.path!;
    path.updateAttrs({ pathData: path.attrs.pathData });
    this.editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'Update Path Data',
        [path],
        [
          cloneDeep({
            transform: path.attrs.transform,
            pathData: path.attrs.pathData,
          }),
        ],
        [this.prevAttrs!],
      ),
    );
    this.editor.commandManager.batchCommandEnd();
  }

  afterEnd() {
    /* noop */
  }
}
