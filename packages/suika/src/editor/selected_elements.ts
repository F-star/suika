import { Rect } from '../scene/scene-graph';
import { getRectCenterPoint } from '../utils/graphics';


class SelectedElements {
  value: Rect[] = [];
  setItems(items: Rect[]) {
    this.value = items;
  }
  clear() {
    this.value = [];
  }
  getCenterPoint() {
    if (this.value.length === 1) {
      return getRectCenterPoint(this.value[0]);
    } else {
      throw new Error('还没实现，敬请期待');
    }
  }
}

export default SelectedElements;