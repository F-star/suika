import { EventEmitter, isSameArray } from '@suika/common';
import { boxToRect, type IRect, mergeBoxes } from '@suika/geo';

import { type Editor } from './editor';
import { isGroupGraphics, type SuikaGraphics } from './graphs';
import { removeGraphicsAndRecord } from './service/remove_service';
import { getParentIdSet } from './utils';

interface Events {
  itemsChange(items: SuikaGraphics[]): void;
  hoverItemChange(
    item: SuikaGraphics | null,
    prevItem: SuikaGraphics | null,
  ): void;
  highlightedItemChange(
    item: SuikaGraphics | null,
    prevItem: SuikaGraphics | null,
  ): void;
}

export class SelectedElements {
  private items: SuikaGraphics[] = [];
  private hoverItem: SuikaGraphics | null = null;
  private highlightedItem: SuikaGraphics | null = null;

  private eventEmitter = new EventEmitter<Events>();

  constructor(private editor: Editor) {}
  setItems(items: SuikaGraphics[]) {
    const prevItems = this.items;
    this.items = items;
    this.emitItemsChangeIfChanged(prevItems, items);
  }
  getItems({ excludeLocked = false } = {}): SuikaGraphics[] {
    if (excludeLocked) {
      return this.items.filter((item) => !item.isLock());
    }
    return [...this.items];
  }
  getIdSet() {
    return new Set(this.items.map((item) => item.attrs.id));
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
    return this.items.every((item) => item.isLock());
  }

  hasItem(item: SuikaGraphics) {
    return this.items.includes(item);
  }

  clear() {
    if (this.hoverItem && this.items.includes(this.hoverItem)) {
      this.setHoverItem(null);
    }
    this.setItems([]);
  }
  /**
   * “追加” 多个元素
   * 如果已选中元素中存在追加元素，将其从已选中元素中取出，否则添加进去
   */
  toggleItems(toggledElements: SuikaGraphics[]) {
    const prevItems = this.items;
    const retItems: SuikaGraphics[] = [];
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

    this.emitItemsChangeIfChanged(prevItems, retItems);
  }
  private emitItemsChangeIfChanged(
    prevItems: SuikaGraphics[],
    items: SuikaGraphics[],
  ) {
    if (!isSameArray(prevItems, items)) {
      this.eventEmitter.emit('itemsChange', items);
    }
  }
  toggleItemById(id: string, opts?: { disableParentAndChildCoexist: boolean }) {
    const toggledElement = this.editor.sceneGraph.getElementById(id);
    if (!toggledElement) {
      console.warn('can not find element by id');
      return;
    }

    if (opts?.disableParentAndChildCoexist) {
      if (isGroupGraphics(toggledElement)) {
        this.items = this.items.filter((item) => !item.containAncestor(id));
      } else {
        const pathIdSet = new Set(toggledElement.getParentIds());
        this.items = this.items.filter((item) => !pathIdSet.has(item.attrs.id));
      }
    }
    this.toggleItems([toggledElement]);
  }
  size() {
    return this.items.length;
  }
  isEmpty() {
    return this.items.length === 0;
  }
  getBoundingRect(): IRect | null {
    if (this.isEmpty()) {
      return null;
    }
    const bboxes = this.items.map((element) => element.getBbox());
    return boxToRect(mergeBoxes(bboxes));
  }
  getRotation() {
    if (this.items.length === 0 || this.items.length > 1) {
      return 0;
    }
    return this.items[0].getRotate() ?? 0;
  }
  getTransform() {
    if (this.items.length === 0 || this.items.length > 1) {
      return null;
    }
    return this.items[0].attrs.transform;
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
    removeGraphicsAndRecord(this.editor, this.items);
    this.clear();
    this.editor.render();
  }

  selectAll() {
    // 判断选中图形的父节点是否相同
    // 如果是，将父节点下的子节点全部选中
    // 如果不是，不做任何操作。
    const parent =
      this.items[0]?.getParent?.() ?? this.editor.doc.getCurrCanvas();

    for (let i = 1; i < this.items.length; i++) {
      if (parent !== this.items[i].getParent()) {
        return;
      }
    }

    this.setItems(parent.getChildren().filter((item) => !item.isLock()));
  }

  setHoverItem(graph: SuikaGraphics | null) {
    const prevHoverItem = this.hoverItem;
    this.hoverItem = graph;
    this.setHighlightedItem(graph);
    if (prevHoverItem !== graph) {
      this.eventEmitter.emit('hoverItemChange', graph, this.hoverItem);
    }
  }

  getHoverItem(): SuikaGraphics | null {
    return this.hoverItem;
  }

  setHighlightedItem(graph: SuikaGraphics | null) {
    const prevHighlightItem = this.highlightedItem;
    this.highlightedItem = graph;
    if (prevHighlightItem !== graph) {
      this.eventEmitter.emit(
        'highlightedItemChange',
        graph,
        this.highlightedItem,
      );
    }
  }

  getHighlightedItem(): SuikaGraphics | null {
    return this.highlightedItem;
  }

  /**
   * get ParentId of selected graphics
   * ids will keep order from bottom to top
   */
  getParentIdSet() {
    return getParentIdSet(this.items);
  }
}
