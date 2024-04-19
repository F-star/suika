import { cloneDeep } from '@suika/common';
import { type IMatrixArr } from '@suika/geo';

import { type Graph, type IPathItem } from '../graphs';
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
}>;

export class SetGraphsAttrsCmd implements ICommand {
  static readonly type = 'SetElementsAttrs';
  constructor(
    public desc: string,
    private elements: Graph[],
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
    }
  }
  undo() {
    const { elements, prevAttrs } = this;
    for (let i = 0, len = this.elements.length; i < len; i++) {
      elements[i].updateAttrs(prevAttrs[i]);
    }
  }
}
