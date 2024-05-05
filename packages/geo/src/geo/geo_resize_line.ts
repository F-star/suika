import { Matrix } from 'pixi.js';

import { type IPoint, type ITransformRect } from '../type';
import { getSweepAngle } from './geo_angle';
import { closestPolarPt } from './geo_line';
import { distance } from './geo_point';

/**
 * Get the new position of the line when resizing
 * we consider the graph with 0 height as a line
 *
 * TODO: reuse, this is something same code in tool_draw_graph.ts
 */
export const resizeLine = (
  /** control type, 'se' | 'ne' | 'nw' | 'sw' */
  type: string,
  newPos: IPoint,
  rect: ITransformRect,
  options: {
    /** keep rotation in 0 45 90 ... */
    keepPolarSnap?: boolean;
    scaleFromCenter?: boolean;
  } = {
    keepPolarSnap: false,
    scaleFromCenter: false,
  },
): ITransformRect => {
  if (!['se', 'ne', 'nw', 'sw'].includes(type)) {
    throw new Error(`invalid type "${type}"`);
  }

  const isRightControl = type === 'se' || type === 'ne';

  let globalOrigin: IPoint = { x: 0, y: 0 };
  if (options.scaleFromCenter) {
    globalOrigin = new Matrix(...rect.transform).apply({
      x: rect.width / 2,
      y: rect.height / 2,
    });
  } else if (isRightControl) {
    globalOrigin = {
      x: rect.transform[4],
      y: rect.transform[5],
    };
  } else {
    globalOrigin = new Matrix(...rect.transform).apply({
      x: rect.width,
      y: rect.height,
    });
  }

  if (options.keepPolarSnap) {
    newPos = closestPolarPt(globalOrigin, newPos);
  }

  let width = distance(newPos, globalOrigin);
  if (options.scaleFromCenter) {
    width *= 2;
  }

  if (isRightControl) {
    const offset = {
      x: newPos.x - globalOrigin.x,
      y: newPos.y - globalOrigin.y,
    };
    const rotate = getSweepAngle(
      { x: 1, y: 0 },
      {
        x: newPos.x - globalOrigin.x,
        y: newPos.y - globalOrigin.y,
      },
    );
    const tf = new Matrix()
      .rotate(rotate)
      .translate(globalOrigin.x, globalOrigin.y);

    if (options.scaleFromCenter) {
      tf.translate(-offset.x, -offset.y);
    }

    return {
      width,
      height: 0,
      transform: [tf.a, tf.b, tf.c, tf.d, tf.tx, tf.ty],
    };
  } else {
    const offset = {
      x: globalOrigin.x - newPos.x,
      y: globalOrigin.y - newPos.y,
    };
    const rotate = getSweepAngle({ x: 1, y: 0 }, offset);

    const tf = new Matrix().rotate(rotate);
    const newRightBottom = tf.apply({ x: width, y: rect.height });
    tf.translate(
      globalOrigin.x - newRightBottom.x,
      globalOrigin.y - newRightBottom.y,
    );

    if (options.scaleFromCenter) {
      tf.translate(offset.x, offset.y);
    }

    return {
      width,
      height: 0,
      transform: [tf.a, tf.b, tf.c, tf.d, tf.tx, tf.ty],
    };
  }
};
