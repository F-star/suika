import { Graph } from './scene/graph';
import { IBox } from '../type';
import { isSameArray } from '../utils/common';
import EventEmitter from '../utils/event_emitter';
import { getRectCenterPoint } from '../utils/graphics';
import { getMergedRect } from '@suika/geo';
import { RemoveElement } from './commands/remove_element';
import { Editor } from './editor';
import { AlignCmd, AlignType } from './commands/align';
import { ArrangeCmd, ArrangeType } from './commands/arrange';
import { GroupElements } from './commands/group';

interface Events {
  itemsChange(items: Graph[]): void;
  hoverItemChange(item: Graph | null, prevItem: Graph | null): void;
}

class SelectedElements {
  private items: Graph[] = [];
  private hoverItem: Graph | null = null;
  private eventEmitter = new EventEmitter<Events>();

  constructor(private editor: Editor) {}
  setItems(items: Graph[]) {
    const prevItems = this.items;
    this.items = items;
    if (!isSameArray(prevItems, items)) {
      this.eventEmitter.emit('itemsChange', items);
    }
  }
  getItems({ excludeLocked = false } = {}): Graph[] {
    if (excludeLocked) {
      return this.items.filter((item) => !item.getLock());
    }
    return [...this.items];
  }
  getIdSet() {
    return new Set(this.items.map((item) => item.id));
  }
  setItemsById(ids: Set<string>) {
    const items = this.editor.sceneGraph.getElementsByIds(ids);

    if (items.length === 0) {
      console.warn('can not find element by id');
    } else {
      this.setItems(items);
    }
  }

  isAllLocked() {
    return this.items.every((item) => item.getLock());
  }

  hasItem(item: Graph) {
    return this.items.includes(item);
  }

  clear() {
    if (this.hoverItem && this.items.includes(this.hoverItem)) {
      this.setHoverItem(null);
    }
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
    const bBox = this.getBBox();
    if (!bBox) {
      throw new Error('no selected elements');
    }
    return getRectCenterPoint(bBox);
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
    return getMergedRect(...bBoxesWithRotation);
  }
  getRotation() {
    if (this.items.length === 0 || this.items.length > 1) {
      return 0;
    }
    return this.items[0].rotation || 0;
  }

  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }

  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
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

    if (
      ArrangeCmd.shouldExecCmd(
        type,
        this.editor.sceneGraph.children,
        new Set(this.items),
      )
    ) {
      this.editor.commandManager.pushCommand(
        new ArrangeCmd('Arrange ' + type, this.editor, this.items, type),
      );
    }
    this.editor.sceneGraph.render();
  }

  selectAll() {
    this.setItems(
      this.editor.sceneGraph.children.filter((item) => !item.getLock()),
    );
  }

  group() {
    if (this.size() === 0) {
      console.warn('can not group, no element');
      return;
    }
    this.editor.commandManager.pushCommand(
      new GroupElements('Group Elements', this.editor, this.items),
    );
  }

  setHoverItem(graph: Graph | null) {
    const prevHoverItem = this.hoverItem;
    this.hoverItem = graph;
    if (prevHoverItem !== graph) {
      this.eventEmitter.emit('hoverItemChange', graph, this.hoverItem);
    }
  }

  getHoverItem(): Graph | null {
    return this.hoverItem;
  }
}

export default SelectedElements;
