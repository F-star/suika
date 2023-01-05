import { Rect } from '../../scene/rect';
import { ICommand } from './type';

type IAttrs = Partial<{
  x: number,
  y: number,
  width: number,
  height: number
  rotation: number
}>

/**
 * 创建矩形
 */
export class SetElementsAttrs implements ICommand {
  static readonly type = 'SetElementsAttrs';
  elements: Rect[];
  prevAttrs: IAttrs[] = [];
  attrs: IAttrs;
  constructor(
    elements: Rect[],
    attrs: IAttrs,
    preAttrs: IAttrs[],
  ) {
    if (elements.length !== preAttrs.length) {
      throw new Error('elements 和 preAttrs 数量不匹配');
    }
    this.elements = elements;
    this.attrs = attrs;
    this.prevAttrs = preAttrs;
  }
  redo() {
    const { elements, attrs } = this;
    for (let i = 0, len = this.elements.length; i < len; i++) {
      elements[i].setAttrs(attrs);
    }
  }
  undo() {
    const { elements, prevAttrs } = this;
    for (let i = 0, len = this.elements.length; i < len; i++) {
      elements[i].setAttrs(prevAttrs[i]);
    }
  }
}
