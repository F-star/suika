import { Editor } from '../../editor';
import { Graph } from '../../scene/graph';
import { ICommand } from '../type';
import { firstInfoOfUnmovedGraphs, lastInfoOfUnmovedGraphs } from './util';

export enum ArrangeType {
  Front = 'Front',
  Back = 'Back',
  Forward = 'Forward',
  Backward = 'Backward',
}

export class ArrangeCmd implements ICommand {
  private movedGraphSet: Set<Graph>;
  private prevGraphs: Graph[] = []; // TODO: optimize space complexity
  constructor(
    public desc: string,
    private editor: Editor,
    /**
     * it's no need to keep right relative order
     */
    movedGraphs: Graph[],
    public type: ArrangeType,
  ) {
    if (movedGraphs.length === 0) {
      throw new Error("can't arrange, no element");
    }

    const movedGraphSet = (this.movedGraphSet = new Set(movedGraphs));
    if (movedGraphSet.size !== movedGraphs.length) {
      console.warn(
        'the arg "movedGraphs" in ArrangeCmd constructor has duplicate values',
      );
    }

    this.do();
  }
  do() {
    const graphs = this.editor.sceneGraph.children;
    this.prevGraphs = graphs;
    switch (this.type) {
      case ArrangeType.Front: {
        this.editor.sceneGraph.children = front(graphs, this.movedGraphSet);
        break;
      }
      case ArrangeType.Forward: {
        this.editor.sceneGraph.children = forward(graphs, this.movedGraphSet);
        break;
      }
      case ArrangeType.Backward: {
        this.editor.sceneGraph.children = backward(graphs, this.movedGraphSet);
        break;
      }
      case ArrangeType.Back: {
        this.editor.sceneGraph.children = back(graphs, this.movedGraphSet);
        break;
      }
    }
  }
  redo() {
    this.do();
  }
  undo() {
    this.editor.sceneGraph.children = this.prevGraphs;
  }
  static shouldExecCmd(
    type: ArrangeType,
    graphs: Graph[],
    movedGraphSet: Set<Graph>,
  ): boolean {
    if (
      graphs.length === 0 ||
      movedGraphSet.size === 0 ||
      movedGraphSet.size === graphs.length
    ) {
      return false;
    }

    switch (type) {
      case ArrangeType.Front:
      case ArrangeType.Forward: {
        // ps: the last element in the array is the top element in the canvas
        const { count } = lastInfoOfUnmovedGraphs(graphs, movedGraphSet);
        if (count === movedGraphSet.size) return false;
        break;
      }
      case ArrangeType.Back:
      case ArrangeType.Backward: {
        const { count } = firstInfoOfUnmovedGraphs(graphs, movedGraphSet);
        if (count === movedGraphSet.size) return false;
        break;
      }
    }

    return true;
  }
}

const front = (graphs: Graph[], movedGraphSet: Set<Graph>) => {
  const newGraphs: Graph[] = [];
  const tailGraphs: Graph[] = [];
  for (let i = 0; i < graphs.length; i++) {
    const graph = graphs[i];
    if (movedGraphSet.has(graph)) {
      tailGraphs.push(graph);
    } else {
      newGraphs.push(graph);
    }
  }
  newGraphs.push(...tailGraphs);
  return newGraphs;
};

const back = (graphs: Graph[], movedGraphSet: Set<Graph>) => {
  const newGraphs: Graph[] = [];
  const tailGraphs: Graph[] = [];
  for (let i = graphs.length - 1; i >= 0; i--) {
    const graph = graphs[i];
    if (movedGraphSet.has(graph)) {
      tailGraphs.push(graph);
    } else {
      newGraphs.push(graph);
    }
  }
  newGraphs.push(...tailGraphs);
  return newGraphs.reverse(); // reverse
};

const forward = (graphs: Graph[], movedGraphs: Set<Graph>) => {
  const newGraphs = [...graphs];

  let i = lastInfoOfUnmovedGraphs(newGraphs, movedGraphs).index;

  for (; i >= 0; i--) {
    if (movedGraphs.has(newGraphs[i])) {
      [newGraphs[i], newGraphs[i + 1]] = [newGraphs[i + 1], newGraphs[i]];
    }
  }
  return newGraphs;
};

const backward = (graphs: Graph[], movedGraphs: Set<Graph>) => {
  const newGraphs = [...graphs];

  let i = firstInfoOfUnmovedGraphs(newGraphs, movedGraphs).index;

  for (; i < newGraphs.length; i++) {
    if (movedGraphs.has(newGraphs[i])) {
      [newGraphs[i], newGraphs[i - 1]] = [newGraphs[i - 1], newGraphs[i]];
    }
  }
  return newGraphs;
};
