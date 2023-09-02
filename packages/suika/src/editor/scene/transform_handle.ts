import { Editor } from '../editor';
import { IBox, IPoint, IRect } from '../../type';
import {
  drawCircle,
  drawSquareWithCenter,
  rotateInCanvas,
} from '../../utils/canvas';
import {
  getRectCenterPoint,
  isPointInCircle,
  isPointInRect,
  radian2Degree,
} from '../../utils/graphics';
import { transformRotate } from '../../utils/transform';
import { ICursor } from '../cursor_manager';

export type HandleName = 'rotation' | 'nw' | 'ne' | 'se' | 'sw';

/**
 * draw transform handle
 *
 * rotation and scale
 */
export class TransformHandle {
  handle: {
    rotation: IPoint;
    nw: IPoint;
    ne: IPoint;
    se: IPoint;
    sw: IPoint;
  } | null = null;
  private center: IPoint | null = null;

  constructor(private editor: Editor) {}
  draw(selectedElementsBBox: IRect | null) {
    const handle = this.getTransformHandle(selectedElementsBBox);
    this.handle = handle;

    if (selectedElementsBBox) {
      const [x, y] = getRectCenterPoint(selectedElementsBBox);
      this.center = { x, y };
    } else {
      this.center = null;
    }

    if (handle) {
      const ctx = this.editor.ctx;
      const setting = this.editor.setting;

      const selectedElements = this.editor.selectedElements.getItems();
      const elementsRotation =
        selectedElements.length === 1 ? selectedElements[0].rotation || 0 : 0;

      ctx.save();
      ctx.strokeStyle = setting.get('handleRotationStroke');
      ctx.fillStyle = setting.get('handleRotationFill');
      ctx.lineWidth = setting.get('handleStrokeWidth');

      // (1) draw rotation handle
      const rotationPos = this.editor.sceneCoordsToViewport(
        handle.rotation.x,
        handle.rotation.y,
      );

      // (2) draw scale handle
      const size = setting.get('handleSize');
      drawCircle(ctx, rotationPos.x, rotationPos.y, size / 2);
      // nw（左上）
      const startTf = ctx.getTransform();
      const nwPos = this.editor.sceneCoordsToViewport(handle.nw.x, handle.nw.y);
      rotateInCanvas(ctx, elementsRotation, nwPos.x, nwPos.y);
      drawSquareWithCenter(ctx, nwPos.x, nwPos.y, size);
      ctx.setTransform(startTf);
      // ne（右上）
      const nePos = this.editor.sceneCoordsToViewport(handle.ne.x, handle.ne.y);
      rotateInCanvas(ctx, elementsRotation, nePos.x, nePos.y);
      drawSquareWithCenter(ctx, nePos.x, nePos.y, size);
      ctx.setTransform(startTf);
      // se（右下）
      const sePos = this.editor.sceneCoordsToViewport(handle.se.x, handle.se.y);
      rotateInCanvas(ctx, elementsRotation, sePos.x, sePos.y);
      drawSquareWithCenter(ctx, sePos.x, sePos.y, size);
      ctx.setTransform(startTf);
      // sw（左下）
      const swPos = this.editor.sceneCoordsToViewport(handle.sw.x, handle.sw.y);
      rotateInCanvas(ctx, elementsRotation, swPos.x, swPos.y);
      drawSquareWithCenter(ctx, swPos.x, swPos.y, size);
      ctx.setTransform(startTf);

      ctx.restore();
    }
  }

  private getTransformHandle(selectedElementsBBox: IBox | null) {
    if (selectedElementsBBox === null) {
      return null;
    }
    /**
     * rotation: 旋转方向为正北方向
     * ne 东北 （右上）（西：west、北：north、东：east、西：west）
     * nw 西北 （左上）
     * sw 西南 south west（左下）
     * se 东南 （右下）
     */
    const selectedElements = this.editor.selectedElements.getItems();
    const zoom = this.editor.zoomManager.getZoom();
    const setting = this.editor.setting;

    if (selectedElements.length === 0) {
      console.error(
        '根据逻辑分支，代码走到这里 selectedElements.length 不可能为 0，请给我提 issue',
      );
      return null;
    }
    // 单个元素
    if (selectedElements.length === 1) {
      const singleSelectedElement = selectedElements[0];
      const { x, y, width, height } =
        singleSelectedElement.getBBoxWithoutRotation();
      // 旋转控制点
      let rotation = {
        x: x + width / 2,
        y: y - setting.get('handleRotationLineLength') / zoom,
      };
      // 左上
      let nw = { x, y };
      // 右上
      let ne = { x: x + width, y };
      // se（右下）
      let se = { x: x + width, y: y + height };
      let sw = { x, y: y + height };
      const [cx, cy] = this.editor.selectedElements.getCenterPoint();
      if (singleSelectedElement.rotation) {
        rotation = transformRotate(
          rotation.x,
          rotation.y,
          singleSelectedElement.rotation,
          cx,
          cy,
        );

        nw = transformRotate(
          nw.x,
          nw.y,
          singleSelectedElement.rotation,
          cx,
          cy,
        );

        ne = transformRotate(
          ne.x,
          ne.y,
          singleSelectedElement.rotation,
          cx,
          cy,
        );
        se = transformRotate(
          se.x,
          se.y,
          singleSelectedElement.rotation,
          cx,
          cy,
        );

        sw = transformRotate(
          sw.x,
          sw.y,
          singleSelectedElement.rotation,
          cx,
          cy,
        );
      }

      return {
        rotation,
        nw,
        ne,
        se,
        sw,
      };
    }
    // 多个图形被选中
    else {
      const { x, y, width, height } = selectedElementsBBox;
      const rotation = {
        x: x + width / 2,
        y: y - setting.get('handleRotationLineLength') / zoom,
      };
      const nw = { x, y };
      const ne = { x: x + width, y };
      const se = { x: x + width, y: y + height };
      const sw = { x, y: y + height };

      return {
        rotation,
        nw,
        ne,
        se,
        sw,
      };
    }
  }
  getNameByPoint(hitPoint: IPoint): {
    handleName: HandleName | undefined;
    cursor?: ICursor;
  } {
    const handle = this.handle;
    if (!handle) {
      return { handleName: undefined };
    }
    if (this.isInRotationHandle(hitPoint)) {
      return { handleName: 'rotation', cursor: 'grab' };
    }

    // 选中图形的旋转角度。。
    const elRotation = this.editor.selectedElements.getRotation();
    const setting = this.editor.setting;
    const zoom = this.editor.zoomManager.getZoom();
    const size = setting.get('handleSize') / zoom;

    // 是否在缩放控制点上
    let key: keyof typeof handle;
    for (key in handle) {
      if (key === 'rotation') {
        continue;
      }

      const ctrlPoint = handle[key];

      let rotatedHitPointX = hitPoint.x;
      let rotatedHitPointY = hitPoint.y;
      if (elRotation) {
        const rotatedHitPoint = transformRotate(
          hitPoint.x,
          hitPoint.y,
          elRotation,
          ctrlPoint.x,
          ctrlPoint.y,
        );
        rotatedHitPointX = rotatedHitPoint.x;
        rotatedHitPointY = rotatedHitPoint.y;
      }
      if (
        isPointInRect(
          { x: rotatedHitPointX, y: rotatedHitPointY },
          {
            x: ctrlPoint.x - size / 2,
            y: ctrlPoint.y - size / 2,
            width: size,
            height: size,
          },
          setting.get('handleStrokePadding') / zoom,
        )
      ) {
        return {
          handleName: key,
          cursor: this.getCursor(key),
        };
      }
    }
    return { handleName: undefined };
  }

  getCursor(type: HandleName): ICursor {
    if (type === 'rotation') {
      return 'grab';
    }
    const degree =
      radian2Degree(this.editor.selectedElements.getRotation()) +
      (type === 'se' || type === 'nw' ? -45 : 45);
    return { type: 'resize', degree };
  }

  private isInRotationHandle(point: IPoint) {
    const transformHandle = this.handle;
    if (!transformHandle) {
      return false;
    }
    // 计算旋转后的 x 和 y
    const rotationPoint = transformHandle.rotation;
    const zoom = this.editor.zoomManager.getZoom();

    const size = this.editor.setting.get('handleSize');
    const padding = this.editor.setting.get('handleStrokePadding');
    return isPointInCircle(point, {
      x: rotationPoint.x,
      y: rotationPoint.y,
      radius: (size / 2 + padding) / zoom,
    });
  }
}
