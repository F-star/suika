import { Graph } from './scene/graph';
import { IBox } from '../type.interface';
import { isSameArray } from '../utils/common';
import EventEmitter from '../utils/event_emitter';
import { getRectCenterPoint, getRectsBBox } from '../utils/graphics';
import { RemoveElement } from './commands/remove_element';
import { Editor } from './editor';
import { AlignCmd, AlignType } from './commands/align';
import { ArrangeCmd, ArrangeType } from './commands/arrange';

interface Events {
  itemsChange(items: Graph[]): void;
}

class SelectedElements {
  private items: Graph[] = [];
  private eventEmitter = new EventEmitter<Events>();

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
  getIdSet() {
    return new Set(this.items.map((item) => item.id));
  }
  setItemsById(ids: Set<string>) {
    const items: Graph[] = [];
    let count = ids.size;

    const allGraphs = this.editor.sceneGraph.children;
    for (let i = 0; i < allGraphs.length; i++) {
      const item = allGraphs[i];
      if (ids.has(item.id)) {
        items.push(item);
        count--;
        if (count === 0) {
          break;
        }
      }
    }

    if (items.length === 0) {
      console.warn('can not find element by id');
    } else {
      this.setItems(items);
    }
  }
  clear() {
    this.items = [];
    this.eventEmitter.emit('itemsChange', this.items);
  }
  /**
   * “追加” 多个元素
   * 如果已选中元素中存在追加元素，将其从已选中元素中取出，否则添加进去
   */
  toggleItems(toggledElements: Graph[]) {
    const prevItems = this.items;
    const retItems: Graph[] = [];
    for (let i = 0, len = prevItems.length; i < len; i++) {
      const item = prevItems[i];
      const idx = toggledElements.indexOf(item);
      if (idx === -1) {
        retItems.push(item);
      } else {
        toggledElements.splice(idx, 1);
      }
    }
    retItems.push(...toggledElements);
    this.items = retItems;

    if (!isSameArray(prevItems, retItems)) {
      this.eventEmitter.emit('itemsChange', this.items);
    }
  }
  toggleItemById(id: string) {
    const toggledElement = this.editor.sceneGraph.getElementById(id);
    if (toggledElement) {
      this.toggleItems([toggledElement]);
    } else {
      console.warn('can not find element by id');
    }
  }
  getCenterPoint() {
    if (this.items.length === 1) {
      return getRectCenterPoint(this.items[0]);
    } else {
      throw new Error('还没实现，敬请期待');
    }
  }
  size() {
    return this.items.length;
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
      new RemoveElement('Remove Elements', this.editor, this.items),
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
  align(type: AlignType) {
    if (this.size() < 2) {
      console.warn('can align zero or two elements, fail silently');
      return;
    }
    this.editor.commandManager.pushCommand(
      new AlignCmd('Align ' + type, this.editor, this.items, type),
    );
    this.editor.sceneGraph.render();
  }

  arrange(type: ArrangeType) {
    if (this.size() === 0) {
      console.warn("can't arrange, no element");
    }

    /**
     * TODO:
     * if the selected graphs had already in the top, stop exec front command
     * also other arrange type
     */
    this.editor.commandManager.pushCommand(
      new ArrangeCmd('Arrange ' + type, this.editor, this.items, type),
    );
    this.editor.sceneGraph.render();
  }
}

export default SelectedElements;
