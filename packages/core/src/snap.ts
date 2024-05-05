import { getClosestTimesVal } from '@suika/common';
import { type IPoint } from '@suika/geo';

import { type Setting } from './setting';

export const SnapHelper = {
  /**
   * support grid snap
   *
   * TODO:
   * objects snap
   * polar tracking snap
   * ortho
   * ruler ref line snap
   */
  getSnapPtBySetting(point: IPoint, setting: Setting) {
    point = { x: point.x, y: point.y };
    const snapGrid = setting.get('snapToGrid');
    if (snapGrid) {
      const gridSnapX = setting.get('gridSnapX');
      const gridSnapY = setting.get('gridSnapY');
      return {
        x: getClosestTimesVal(point.x, gridSnapX),
        y: getClosestTimesVal(point.y, gridSnapY),
      };
    }
    return point;
  },
};
