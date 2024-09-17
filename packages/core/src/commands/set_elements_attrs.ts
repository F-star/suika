import { cloneDeep } from '@suika/common';
import { type IMatrixArr, type IPathItem } from '@suika/geo';

import { type IParentIndex, type SuikaGraphics } from '../graphics';
import { type IPaint } from '../paint';
import { type ICommand } from './type';

export type ISetElementsAttrsType = Partial<{
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  cornerRadius: number;
  fill: IPaint[];
  stroke: IPaint[];
  strokeWidth: number;
  objectName: string;
  visible: boolean;
  lock: boolean;
  transform: IMatrixArr;
  pathData: IPathItem[];
  content: string;
  count: number;
  starInnerScale: number;
  parentIndex: IParentIndex;
}>;

export class SetGraphsAttrsCmd implements ICommand {
  static readonly type = 'SetElementsAttrs';
  constructor(
    public desc: string,
    private elements: SuikaGraphics[],
    private attrs: ISetElementsAttrsType | ISetElementsAttrsType[],
    private prevAttrs: ISetElementsAttrsType[],
  ) {
    if (elements.length !== prevAttrs.length) {
      throw new Error(
        `elements 和 preAttrs 数量不匹配 ${elements.length} ${prevAttrs.length}`,
      );
    }
  }
  redo() {
    const { elements, attrs } = this;
    for (let i = 0, len = this.elements.length; i < len; i++) {
      const attrs_ = Array.isArray(attrs) ? attrs[i] : cloneDeep(attrs);
      const el = elements[i];
      // 更新维护父子关系

      if (attrs_.parentIndex) {
        el.removeFromParent();
      }
      el.updateAttrs(attrs_);
      if (attrs_.parentIndex) {
        const parent = el.getParent();
        if (parent) {
          parent.insertChild(el, el.attrs.parentIndex?.position);
        }
      }
    }
  }
  undo() {
    const { elements, prevAttrs } = this;
    for (let i = 0, len = this.elements.length; i < len; i++) {
      const el = elements[i];
      const attrs_ = prevAttrs[i];
      elements[i].updateAttrs(prevAttrs[i]);

      if ('parentIndex' in attrs_ && attrs_.parentIndex === undefined) {
        el.removeFromParent();
      } else if (attrs_.parentIndex) {
        const parent = el.getParent();
        if (parent) {
          parent.insertChild(el, el.attrs.parentIndex?.position);
        }
      }
    }
  }
}
