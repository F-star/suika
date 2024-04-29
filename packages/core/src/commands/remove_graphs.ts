import { type Editor } from '../editor';
import { type Graph } from '../graphs';
import { type ICommand } from './type';

export class RemoveGraphsCmd implements ICommand {
  private removedIndexes: number[] = [];

  constructor(
    public desc: string,
    private editor: Editor,
    private removedElements: Graph[],
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
    const nextElements: Graph[] = [];
    const elements = sceneGraph.children;
    for (let i = 0, len = elements.length; i < len; i++) {
      const element = elements[i];
      if (set.has(element)) {
        this.removedIndexes.push(i);
      } else {
        nextElements.push(element);
      }
    }

    console.log('removedIndexes', this.removedIndexes);
    for (let i = this.removedIndexes.length - 1; i >= 0; i--) {
      const index = this.removedIndexes[i];
      const graphics = elements[index].getGraphics();
      if (graphics) {
        graphics.removeFromParent();
      } else {
        console.warn('graphics is empty');
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
    const nextElements: Graph[] = new Array(
      elements.length + removedIndexes.length,
    );
    const parent = this.editor.stageManager.getScene();

    let i = 0; // nextElements 的指针
    let j = 0; // elements
    let k = 0; // removedIndexes 和 removedElement 的指针
    while (i < nextElements.length) {
      if (i === removedIndexes[k]) {
        nextElements[i] = removedElements[k];
        const graphics = removedElements[k].getGraphics();
        if (graphics) {
          parent.addChildAt(graphics, i);
        } else {
          console.warn('graphics is empty');
        }

        k++;
      } else {
        nextElements[i] = elements[j];
        j++;
      }
      i++;
    }
    sceneGraph.children = nextElements;

    this.editor.selectedElements.setItems(removedElements);
  }
}
