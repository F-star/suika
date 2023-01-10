import { Graph } from '../scene/graph';
import { getRectCenterPoint } from '../utils/graphics';


class SelectedElements {
  private items: Graph[] = [];
  setItems(items: Graph[]) {
    this.items = items;
  }
  getItems() {
    return [...this.items];
  }
  clear() {
    this.items = [];
  }
  /**
   * “追加” 多个元素
   * 如果已选中元素中存在追加元素，将其从已选中元素中取出，否则添加进去
   */
  toggleElement(addedElements: Graph[]) {
    const retItems: Graph[] = [];
    for (let i = 0, len = this.items.length; i < len; i++) {
      const item = this.items[i];
      const idx = addedElements.indexOf(item);
      if (idx === -1) {
        retItems.push(item);
      } else {
        addedElements.splice(idx, 1);
      }
    }
    retItems.push(...addedElements);
    this.items = retItems;
  }
  getCenterPoint() {
    if (this.items.length === 1) {
      return getRectCenterPoint(this.items[0]);
    } else {
      throw new Error('还没实现，敬请期待');
    }
  }
  isEmpty() {
    return this.items.length === 0;
  }
}

export default SelectedElements;