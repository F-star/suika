import { IPoint, IRect, normalizeRadian, transformRotate } from '@suika/geo';
import {
  adjustSizeToKeepPolarSnap,
  getRectCenterPoint,
  getRectRotatedXY,
} from '../../utils/geo';
import { IBox2WithRotation } from '../../type';

/**
 * Get the new position of the line when resizing
 * we consider the graph with 0 height as a line
 *
 * TODO: reuse, this is something same code in tool_draw_graph.ts
 */
export const getResizedLine = (
  /** control type, 'se' | 'ne' | 'nw' | 'sw' */
  type: string,
  newPos: IPoint,
  oldBox: IBox2WithRotation,
  /** keep rotation in 0 45 90 ... */
  keepPolarSnap: boolean,
  scaleFromCenter: boolean,
) => {
  const isControlInLeft = type === 'nw' || type === 'sw';

  const { x, y } = newPos;
  let startX: number;
  let startY: number;
  if (isControlInLeft) {
    const [cx, cy] = getRectCenterPoint(oldBox);
    const rightTop = transformRotate(
      oldBox.x + oldBox.width,
      oldBox.y + oldBox.height,
      oldBox.rotation || 0,
      cx,
      cy,
    );
    startX = rightTop.x;
    startY = rightTop.y;
  } else {
    const leftTop = getRectRotatedXY(oldBox);
    startX = leftTop.x;
    startY = leftTop.y;
  }

  const width = x - startX;
  const height = y - startY;

  let rect = {
    x: startX,
    y: startY,
    width, // width may be negative
    height, // also height
  };

  let cx = 0;
  let cy = 0;
  if (scaleFromCenter) {
    const [oldCx, oldCy] = getRectCenterPoint(oldBox);
    const w = x - oldCx;
    const h = y - oldCy;
    rect = {
      x: oldCx - w,
      y: oldCy - h,
      width: w * 2,
      height: h * 2,
    };

    cx = rect.x + rect.width / 2;
    cy = rect.y + rect.height / 2;
  }

  if (keepPolarSnap) {
    rect = adjustSizeToKeepPolarSnap(rect);
  }

  if (scaleFromCenter) {
    rect.x = cx - rect.width / 2;
    rect.y = cy - rect.height / 2;
  }

  if (isControlInLeft) {
    rect.width = -rect.width;
    rect.height = -rect.height;
  }
  const attrs = getLineAttrsByRect(rect);
  if (isControlInLeft) {
    attrs.x -= rect.width;
    attrs.y -= rect.height;
  }

  return attrs;
};

const getLineAttrsByRect = ({ x, y, width, height }: IRect) => {
  const rotation = normalizeRadian(Math.atan2(height, width));
  const cx = x + width / 2;
  const cy = y + height / 2;
  const p = transformRotate(x, y, -rotation, cx, cy);
  width = Math.sqrt(width * width + height * height);
  return {
    x: p.x,
    y: p.y,
    width,
    rotation,
  };
};
