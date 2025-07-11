import { type IPoint } from '../type';
import { Matrix } from './geo_matrix_class';

/** arc to cubic bezier */
export const arcToBezier = ({
  center,
  r,
  startAngle,
  endAngle,
  angleDir = true,
}: {
  center: IPoint;
  r: number;
  startAngle: number;
  endAngle: number;
  angleDir: boolean;
}) => {
  if (angleDir === false) {
    [startAngle, endAngle] = [endAngle, startAngle];
  }

  const sweepAngle = (endAngle - startAngle + Math.PI * 2) % (Math.PI * 2);
  const halfSweepAngle = sweepAngle / 2;
  const k =
    (4 * (1 - Math.cos(halfSweepAngle))) / (3 * Math.sin(halfSweepAngle));

  const matrix = new Matrix()
    .rotate(startAngle)
    .scale(r, r)
    .translate(center.x, center.y);

  endAngle -= startAngle;
  startAngle = 0;

  const p1 = matrix.apply({
    x: 1,
    y: 0,
  });
  const p2 = matrix.apply({
    x: 1,
    y: k,
  });

  const p3 = matrix.apply({
    x: Math.cos(sweepAngle) + k * Math.sin(sweepAngle),
    y: Math.sin(sweepAngle) - k * Math.cos(sweepAngle),
  });

  const p4 = matrix.apply({
    x: Math.cos(sweepAngle),
    y: Math.sin(sweepAngle),
  });

  if (angleDir) {
    return [p1, p2, p3, p4];
  }
  return [p4, p3, p2, p1];
};
