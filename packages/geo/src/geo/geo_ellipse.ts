import { type IPathCommand, type IRect } from '../type';
import { rectToBox } from './geo_rect';

export const ellipseToPathCmds = (rect: IRect): IPathCommand[] => {
  const k = 0.5522847498307936;

  const { minX, minY, maxX, maxY } = rectToBox(rect);
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  const rx = rect.width / 2;
  const ry = rect.height / 2;

  const lx = rx * k;
  const ly = ry * k;

  // clockwise, starting from the right vertex
  return [
    { type: 'M', points: [{ x: maxX, y: midY }] },
    // right bottom
    {
      type: 'C',
      points: [
        { x: maxX, y: midY + ly },
        { x: midX + lx, y: maxY },
        { x: midX, y: maxY },
      ],
    },
    // left bottom
    {
      type: 'C',
      points: [
        { x: midX - lx, y: maxY },
        { x: minX, y: midY + ly },
        { x: minX, y: midY },
      ],
    },
    // left top
    {
      type: 'C',
      points: [
        { x: minX, y: midY - ly },
        { x: midX - lx, y: minY },
        { x: midX, y: minY },
      ],
    },
    // right top
    {
      type: 'C',
      points: [
        { x: maxX, y: midY - ly },
        { x: midX + lx, y: minY },
        { x: maxX, y: midY },
      ],
    },
    {
      type: 'Z',
      points: [],
    },
  ];
};
