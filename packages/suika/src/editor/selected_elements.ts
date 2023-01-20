import { Graph } from './scene/graph';
import { IBox } from '../type.interface';
import { isSameArray } from '../utils/common';
import EventEmitter from '../utils/event_emitter';
import { getRectCenterPoint, getRectsBBox } from '../utils/graphics';
import { RemoveElement } from './commands/remove_element';
import { Editor } from './editor';

class SelectedElements {
  private items: Graph[] = [];
  private eventEmitter = new EventEmitter();

  constructor(private editor: Editor) {}
  setItems(items: Graph[]) {
    const prevItems = this.items;
    this.items = items;
    if (!isSameArray(prevItems, items)) {
      this.eventEmitter.emit('itemsChange', items);
    }
  }
  getItems() {
    return [...this.items];
  }
  clear() {
    this.items = [];
    this.eventEmitter.emit('itemsChange', this.items);
  }
  /**
   * “追加” 多个元素
   * 如果已选中元素中存在追加元素，将其从已选中元素中取出，否则添加进去
   */
  toggleElement(addedElements: Graph[]) {
    const prevItems = this.items;
    const retItems: Graph[] = [];
    for (let i = 0, len = prevItems.length; i < len; i++) {
      const item = prevItems[i];
      const idx = addedElements.indexOf(item);
      if (idx === -1) {
        retItems.push(item);
      } else {
        addedElements.splice(idx, 1);
      }
    }
    retItems.push(...addedElements);
    this.items = retItems;

    if (!isSameArray(prevItems, retItems)) {
      this.eventEmitter.emit('itemsChange', this.items);
    }
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
  getBBox(): IBox | null {
    if (this.isEmpty()) {
      return null;
    }
    const bBoxesWithRotation = this.items.map((element) => element.getBBox());
    return getRectsBBox(...bBoxesWithRotation);
  }
  getRotation() {
    if (this.items.length === 0 || this.items.length > 1) {
      return 0;
    }
    return this.items[0].rotation || 0;
  }
  on(eventName: 'itemsChange', handler: (items: Graph[]) => void) {
    this.eventEmitter.on(eventName, handler);
  }
  off(eventName: 'itemsChange', handler: (items: Graph[]) => void) {
    this.eventEmitter.off(eventName, handler);
  }
  removeFromScene() {
    if (this.isEmpty()) {
      return;
    }
    this.editor.commandManager.pushCommand(
      new RemoveElement(this.editor, this.items)
    );
    this.editor.sceneGraph.render();
  }
  setRotateXY(rotatedX: number, rotatedY: number) {
    const items = this.items;
    for (let i = 0, len = items.length; i < len; i++) {
      const element = items[i];
      element.setRotateXY(rotatedX, rotatedY);
    }
  }
}

export default SelectedElements;
