import { Graph } from '../scene/graph';
import { Editor } from '../editor';
import { ICommand } from './type';

export enum ArrangeType {
  Front = 'Front',
  Back = 'Back',
  Forward = 'Forward',
  Backward = 'Backward'
}

export class ArrangeCmd implements ICommand {
  private movedGraphSet: Set<Graph>;
  private prevGraphs: Graph[] = []; // used by Front and Back. TODO: optimize space complexity
  constructor(
    public desc: string,
    private editor: Editor,
    /**
     * it's no need to keep right relative order
     */
    movedGraphs: Graph[],
    public type: ArrangeType
  ) {
    if (movedGraphs.length === 0) {
      throw new Error('can\'t arrange, no element');
    }

    const movedGraphSet = this.movedGraphSet = new Set(movedGraphs);
    if (movedGraphSet.size !== movedGraphs.length) {
      console.warn('the arg "movedGraphs" in ArrangeCmd constructor has duplicate values');
    }

    this.do();
  }
  do() {
    const graphs = this.editor.sceneGraph.children;
    switch (this.type) {
    case ArrangeType.Front: {
      this.prevGraphs = graphs;

      const newSceneGraphs: Graph[] = [];
      const tailGraphs: Graph[] = [];
      const prevIndexes: number[] = [];

      /**
         * move to tail
         */
      for (let i = 0; i < graphs.length; i++) {
        const graph = graphs[i];
        if (this.movedGraphSet.has(graph)) {
          tailGraphs.push(graph);
          prevIndexes.push(i);
        } else {
          newSceneGraphs.push(graph);
        }
      }
      newSceneGraphs.push(...tailGraphs);
      this.editor.sceneGraph.children = newSceneGraphs;

      break;
    }
    case ArrangeType.Forward: {
      forward(graphs, this.movedGraphSet);
      break;
    }
    case ArrangeType.Backward: {
      backward(graphs, this.movedGraphSet);
      break;
    }
    case ArrangeType.Back: {
      this.prevGraphs = graphs;

      const newSceneGraphs: Graph[] = [];
      const tailGraphs: Graph[] = [];
      const prevIndexes: number[] = [];

      /**
         * move to tail
         */
      for (let i = graphs.length - 1; i >= 0; i--) {
        const graph = graphs[i];
        if (this.movedGraphSet.has(graph)) {
          tailGraphs.push(graph);
          prevIndexes.push(i);
        } else {
          newSceneGraphs.push(graph);
        }
      }
      newSceneGraphs.push(...tailGraphs);
      this.editor.sceneGraph.children = newSceneGraphs.reverse(); // reverse

      break;
    }
    }

  }
  redo() {
    this.do();
  }
  undo() {
    const graphs = this.editor.sceneGraph.children;
    switch (this.type) {
    case ArrangeType.Forward:
      backward(graphs, this.movedGraphSet);
      break;
    case ArrangeType.Backward:
      forward(graphs, this.movedGraphSet);
      break;
    case ArrangeType.Front:
      this.editor.sceneGraph.children = this.prevGraphs;
      break;
    case ArrangeType.Back:
      this.editor.sceneGraph.children = this.prevGraphs;
      break;
    default:
      console.warn('invalid arrange type:', this.type);
      break;
    }
  }
}


function forward(graphs: Graph[], movedGraphs: Set<Graph>) {
  for (let i = graphs.length - 2; i >= 0; i--) {
    if (movedGraphs.has(graphs[i])) {
      [graphs[i], graphs[i+1]] = [graphs[i + 1], graphs[i]];
    }
  }
}


function backward(graphs: Graph[], movedGraphs: Set<Graph>) {
  for (let i = 1; i < graphs.length; i++) {
    if (movedGraphs.has(graphs[i])) {
      [graphs[i], graphs[i - 1]] = [graphs[i - 1], graphs[i]];
    }
  }
}
