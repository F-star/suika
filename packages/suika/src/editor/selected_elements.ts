import { Rect } from '../scene/scene-graph';


class SelectedElements {
  value: Rect[] = [];
  setItems(items: Rect[]) {
    this.value = items;
  }
  clear() {
    this.value = [];
  }
}

export default SelectedElements;