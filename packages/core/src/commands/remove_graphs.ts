import { type Editor } from '../editor';
import { type SuikaGraphics } from '../graphs';
import { getParent } from '../utils/common';
import { type ICommand } from './type';

/**
 * @deprecated
 * use UpdateGraphicsAttrsCmd
 */
export class RemoveGraphsCmd implements ICommand {
  private removedIndexes: number[] = [];

  constructor(
    public desc: string,
    private editor: Editor,
    private removedElements: SuikaGraphics[],
  ) {
    this.do();
  }
  private do() {
    this.removedIndexes = [];
    const set = new Set(this.removedElements);
    if (set.size !== this.removedElements.length) {
      throw new Error('removedElements 不能有重复元素');
    }
    const sceneGraph = this.editor.sceneGraph;
    const nextElements: SuikaGraphics[] = [];
    const elements = sceneGraph.children;

    for (let i = 0, len = elements.length; i < len; i++) {
      const el = elements[i];
      if (set.has(el)) {
        this.removedIndexes.push(i);
        el.removeFromParent();
        // 更新父节点们的 transform
      } else {
        nextElements.push(el);
      }
    }
    sceneGraph.children = nextElements;

    this.editor.selectedElements.clear();
  }
  redo() {
    this.do();
  }
  undo() {
    // 实现上有点复杂了...如果是链表会简单一些，以后还是考虑换成链表实现图形树
    const sceneGraph = this.editor.sceneGraph;
    const removedElements = this.removedElements;
    const elements = sceneGraph.children;
    const removedIndexes = this.removedIndexes;
    const nextElements: SuikaGraphics[] = new Array(
      elements.length + removedIndexes.length,
    );

    let i = 0; // nextElements 的指针
    let j = 0; // elements
    let k = 0; // removedIndexes 和 removedElement 的指针
    while (i < nextElements.length) {
      if (i === removedIndexes[k]) {
        nextElements[i] = removedElements[k];
        k++;
      } else {
        nextElements[i] = elements[j];
        j++;
      }
      i++;
    }
    sceneGraph.children = nextElements;

    for (const el of removedElements) {
      const parent = getParent(el, this.editor.doc.graphicsStore)!;
      parent.appendChild(el, el.attrs.parentIndex?.position);
    }
    this.editor.selectedElements.setItems(removedElements);
  }
}
