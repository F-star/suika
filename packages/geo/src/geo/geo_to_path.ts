import { IPathCommand, IRect, type ISize } from '../type';
import { Matrix } from './geo_matrix_class';
import { rectToBox } from './geo_rect';

const K = 0.5522847498307936;

const calcRenderCornerRadii = (size: ISize, radii: number[]) => {
  const edges = [size.width, size.height, size.width, size.height];

  const correctedRadii = [0, 0, 0, 0];
  for (let i = 0; i < radii.length; i++) {
    const r = radii[i];

    if (r === 0) {
      correctedRadii[i] = r;
      continue;
    }

    const prevIndex = (i - 1) % edges.length;
    const nextIndex = (i + 1) % edges.length;
    const edge1 = edges[prevIndex];
    const edge2 = edges[i];
    const r1 = radii[prevIndex];
    const r2 = radii[nextIndex];

    let correctedR1 = r;
    let correctedR2 = r;

    if (r1 + r > edge1) {
      correctedR1 = (r / (r1 + r)) * edge1;
    }
    if (r2 + r > edge2) {
      correctedR2 = (r / (r2 + r)) * edge2;
    }
    correctedRadii[i] = Math.min(correctedR1, correctedR2);
  }
  return correctedRadii;
};

export const roundRectToPathCmds_2 = (
  rect: IRect,
  cornerRadii: number[] = [],
): IPathCommand[] => {
  const radii = calcRenderCornerRadii(rect, cornerRadii);

  const { minX, minY, maxX, maxY } = rectToBox(rect);

  const commands: IPathCommand[] = [
    // left top
    { type: 'M', points: [{ x: minX, y: minY + radii[0] }] },
    {
      type: 'C',
      points: [
        { x: minX, y: minY + radii[0] - radii[0] * K },
        { x: minX + radii[0] - radii[0] * K, y: minY },
        { x: minX + radii[0], y: minY },
      ],
    },
  ];
  // top line (skip if full width)
  if (radii[0] + radii[1] < rect.width) {
    commands.push({
      type: 'L',
      points: [{ x: maxX - radii[1], y: minY }],
    });
  }
  // right top
  commands.push({
    type: 'C',
    points: [
      { x: maxX - radii[1] + radii[1] * K, y: minY },
      { x: maxX, y: minY + radii[1] - radii[1] * K },
      { x: maxX, y: minY + radii[1] },
    ],
  });
  // right line (skip if full height)
  if (radii[1] + radii[2] < rect.height) {
    commands.push({
      type: 'L',
      points: [{ x: maxX, y: maxY - radii[2] }],
    });
  }
  // right bottom
  commands.push({
    type: 'C',
    points: [
      { x: maxX, y: maxY - radii[2] + radii[2] * K },
      { x: maxX - radii[2] + radii[2] * K, y: maxY },
      { x: maxX - radii[2], y: maxY },
    ],
  });
  // bottom line (skip if full width)

  if (radii[2] + radii[3] < rect.width) {
    commands.push({
      type: 'L',
      points: [{ x: minX + radii[3], y: maxY }],
    });
  }
  // left bottom
  commands.push({
    type: 'C',
    points: [
      { x: minX + radii[3] - radii[3] * K, y: maxY },
      { x: minX, y: maxY - radii[3] + radii[3] * K },
      { x: minX, y: maxY - radii[3] },
    ],
  });
  // left line (skip if full height)
  if (radii[3] * radii[1] <= rect.height) {
    commands.push({
      type: 'L',
      points: [{ x: minX, y: minY + radii[0] }],
    });
  }
  commands.push({
    type: 'Z',
    points: [],
  });

  return commands;
};

/**
 * 对任意圆弧进行拟合
 * 极轴坐标系规定：起点为正右方，方向为顺时针
 */
export const arcToCubic = (params: {
  cx: number;
  cy: number;
  r: number;
  startAngle: number;
  endAngle: number;
}) => {
  const { cx, cy, r } = params;
  let { startAngle, endAngle } = params;
  // 计算 k
  const sweepAngle = endAngle - startAngle;
  const halfSweepAngle = sweepAngle / 2;
  const k =
    (4 * (1 - Math.cos(halfSweepAngle))) / (3 * Math.sin(halfSweepAngle));

  const originStartAngle = startAngle;
  startAngle = 0;
  endAngle -= originStartAngle;

  const matrix = new Matrix()
    .rotate(originStartAngle)
    .scale(r, r)
    .translate(cx, cy);

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

  const pathData = [];
  // 起点为正右方，方向为顺时针
  pathData.push(['M', p1.x, p1.y]);
  pathData.push(['C', p2.x, p2.y, p3.x, p3.y, p4.x, p4.y]);

  return pathData;
};
