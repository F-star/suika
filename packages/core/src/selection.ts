/**
 * 辅助线管理。
 *
 *
 * 图形高亮轮廓线 outlines
 * 选区 selection
 */

import { type IRect, rectToBox } from '@suika/geo';
import { Graphics } from 'pixi.js';

import { type Editor } from './editor';
import { type Graph } from './graphs';

/**
 * selection box
 */
export class Selection {
  private selectionRect: IRect | null = null;
  private selectionGraphics: Graphics;

  getGraphics() {
    return this.selectionGraphics;
  }

  constructor(private editor: Editor) {
    this.selectionGraphics = new Graphics();
  }

  setRect(rect: IRect) {
    this.selectionRect = rect;
    this.selectionGraphics.clear();

    const fillColor = this.editor.setting.get('selectionFill');
    const strokeColor = this.editor.setting.get('selectionStroke');
    const zoom = this.editor.zoomManager.getZoom();
    const { x, y, width, height } = rect;

    const { x: xInViewport, y: yInViewport } =
      this.editor.sceneCoordsToViewport(x, y);

    const widthInViewport = width * zoom;
    const heightInViewport = height * zoom;

    this.selectionGraphics
      .rect(xInViewport, yInViewport, widthInViewport, heightInViewport)
      .fill(fillColor)
      .stroke(strokeColor);
  }

  clear() {
    this.selectionGraphics.clear();
  }

  getElementsInSelection() {
    const selection = this.selectionRect;
    if (selection === null) {
      console.warn('selection 为 null，请确认在正确的时机调用当前方法');
      return [];
    }

    const selectionMode = this.editor.setting.get('selectionMode');
    const elements = this.editor.sceneGraph.getVisibleItems();
    const containedElements: Graph[] = [];
    // TODO: optimize, use r-tree to reduce time complexity
    const selectionBox = rectToBox(selection);
    for (const el of elements) {
      if (el.getLock()) {
        continue;
      }
      let isSelected = false;
      if (selectionMode === 'contain') {
        isSelected = el.containWithBox(selectionBox);
      } else {
        isSelected = el.intersectWithBox(selectionBox);
      }
      if (isSelected) {
        containedElements.push(el);
      }
    }
    return containedElements;
    // return [];
  }
}
