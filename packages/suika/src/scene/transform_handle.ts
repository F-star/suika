import { Editor } from '../editor/editor';
import { IBox, IPoint, IRect } from '../type.interface';
import {
  drawCircle,
  // drawSquareWithCenter,
  rotateInCanvas,
} from '../utils/canvas';
import { arr2point, isPointInCircle, isPointInRect } from '../utils/graphics';
import { transformRotate } from '../utils/transform';

export class TransformHandle {
  handle: {
    rotation: IPoint;
    nw: IPoint;
    ne: IPoint;
    se: IPoint;
    sw: IPoint;
  } | null = null;

  constructor(private editor: Editor) {}
  draw(selectedElementsBBox: IRect | null) {
    const handle = this.getTransformHandle(selectedElementsBBox);
    this.handle = handle;

    if (handle) {
      const ctx = this.editor.ctx;
      const setting = this.editor.setting;

      const selectedElements = this.editor.selectedElements.getItems();
      const elementsRotation =
        selectedElements.length === 1 ? selectedElements[0].rotation || 0 : 0;

      ctx.save();
      ctx.strokeStyle = setting.handleRotationStroke;
      ctx.fillStyle = setting.handleRotationFill;
      ctx.lineWidth = setting.handleStrokeWidth;

      // 绘制旋转控制点
      const rotationPos = this.editor.sceneCoordsToViewport(
        handle.rotation.x,
        handle.rotation.y
      );

      const size = setting.handleSize;
      drawCircle(ctx, rotationPos.x, rotationPos.y, size / 2);
      // nw（左上）
      const nwPos = this.editor.sceneCoordsToViewport(handle.nw.x, handle.nw.y);
      rotateInCanvas(ctx, elementsRotation, nwPos.x, nwPos.y);
      // drawSquareWithCenter(ctx, nwPos.x, nwPos.y, size);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // ne（右上）
      const nePos = this.editor.sceneCoordsToViewport(handle.ne.x, handle.ne.y);
      rotateInCanvas(ctx, elementsRotation, nePos.x, nePos.y);
      // drawSquareWithCenter(ctx, nePos.x, nePos.y, size);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // se（右下）
      const sePos = this.editor.sceneCoordsToViewport(handle.se.x, handle.se.y);
      rotateInCanvas(ctx, elementsRotation, sePos.x, sePos.y);
      // drawSquareWithCenter(ctx, sePos.x, sePos.y, size);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // sw（左下）
      const swPos = this.editor.sceneCoordsToViewport(handle.sw.x, handle.sw.y);
      rotateInCanvas(ctx, elementsRotation, swPos.x, swPos.y);
      // drawSquareWithCenter(ctx, swPos.x, swPos.y, size);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

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
        '根据逻辑分支，代码走到这里 selectedElements.length 不可能为 0，请给我提 issue'
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
        y: y - setting.handleRotationLineLength / zoom,
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
        rotation = arr2point(
          transformRotate(
            rotation.x,
            rotation.y,
            singleSelectedElement.rotation,
            cx,
            cy
          )
        );
        nw = arr2point(
          transformRotate(nw.x, nw.y, singleSelectedElement.rotation, cx, cy)
        );
        ne = arr2point(
          transformRotate(ne.x, ne.y, singleSelectedElement.rotation, cx, cy)
        );
        se = arr2point(
          transformRotate(se.x, se.y, singleSelectedElement.rotation, cx, cy)
        );
        sw = arr2point(
          transformRotate(sw.x, sw.y, singleSelectedElement.rotation, cx, cy)
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
        y: y - setting.handleRotationLineLength / zoom,
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
  getTransformHandleByPoint(point: IPoint) {
    const handle = this.handle;
    if (!handle) {
      return undefined;
    }
    if (this.isInRotationHandle(point)) {
      return 'rotation';
    }

    // 选中图形的旋转角度。。
    const elRotation = this.editor.selectedElements.getRotation();
    const setting = this.editor.setting;
    const size = setting.handleSize + setting.handleStrokeWidth;

    // 是否在缩放控制点上
    let key: keyof typeof handle;
    for (key in handle) {
      if (key === 'rotation' && this.isInRotationHandle(point)) {
        return key;
      }

      const scalePoint = handle[key];

      let rotatedX = point.x;
      let rotatedY = point.y;
      if (elRotation) {
        [rotatedX, rotatedY] = transformRotate(
          point.x,
          point.y,
          elRotation,
          scalePoint.x,
          scalePoint.y
        );
      }
      if (
        isPointInRect(
          { x: rotatedX, y: rotatedY },
          {
            x: scalePoint.x - size / 2,
            y: scalePoint.y - size / 2,
            width: size,
            height: size,
          }
        )
      ) {
        return key;
      }
    }
  }
  private isInRotationHandle(point: IPoint) {
    const transformHandle = this.handle;
    if (!transformHandle) {
      return false;
    }
    // 计算旋转后的 x 和 y
    const rotationPoint = transformHandle.rotation;
    const zoom = this.editor.zoomManager.getZoom();

    const size = this.editor.setting.handleSize;
    const padding = 4;
    return isPointInCircle(point, {
      x: rotationPoint.x,
      y: rotationPoint.y,
      radius: (size / 2 + padding) / zoom,
    });
  }
}
