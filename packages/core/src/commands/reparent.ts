import { cloneDeep } from '@suika/common';
import { type IMatrixArr } from '@suika/geo';

import { type IParentIndex, type SuikaGraphics } from '../graphics';
import { type ICommand } from './type';

export type ISetElementsAttrsType = Partial<{
  transform: IMatrixArr;
  parentIndex: IParentIndex;
}>;

export class ReparentGraphsCmd implements ICommand {
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
      if (Array.isArray(attrs)) {
        elements[i].updateAttrs(attrs[i]);
      } else {
        elements[i].updateAttrs(cloneDeep(attrs));
      }
      // TODO: 更新父节点的 children
    }
  }
  undo() {
    const { elements, prevAttrs } = this;
    for (let i = 0, len = this.elements.length; i < len; i++) {
      elements[i].updateAttrs(prevAttrs[i]);
      // TODO: 更新父节点的 children
    }
  }
}
