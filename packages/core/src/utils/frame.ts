import { type IPoint } from '@suika/geo';

import {
  isFrameGraphics,
  type SuikaFrame,
  type SuikaGraphics,
} from '../graphics';

export const getDeepFrameAtPoint = (
  point: IPoint,
  nodes: SuikaGraphics[],
  excludeFn?: (node: SuikaGraphics) => boolean,
): SuikaFrame | null => {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const child = nodes[i];
    if (excludeFn?.(child)) {
      continue;
    }
    if (isFrameGraphics(child) && !child.isGroup() && child.hitTest(point)) {
      const item = getDeepFrameAtPoint(point, child.getChildren(), excludeFn);
      return item || child;
    }
  }
  return null;
};
