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
      const gridSnapSpacing = {
        x: setting.get('gridSnapX'),
        y: setting.get('gridSnapY'),
      };
      return this.getGridSnapPt(point, gridSnapSpacing);
    }
    return point;
  },

  getGridSnapPt(point: IPoint, snapSpacing: IPoint) {
    return {
      x: getClosestTimesVal(point.x, snapSpacing.x),
      y: getClosestTimesVal(point.y, snapSpacing.y),
    };
  },
};
