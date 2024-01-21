import { Graph } from '../scene/graph';
import { Editor } from '../editor';
import { ICommand } from './type';
import { Group } from '../group_manager';

export class GroupElements implements ICommand {
  private groupedElSet = new Set<Graph>();
  /** prevGraphId -> groupInfo */
  private prevGroupedElInfoMap = new Map<
    string,
    { graph: Graph; groupIds: Set<string> }
  >();
  private group: Group;

  constructor(
    public desc: string,
    private editor: Editor,
    groupedEls: Graph[],
  ) {
    this.groupedElSet = new Set(groupedEls);
    if (groupedEls.length !== this.groupedElSet.size) {
      console.warn(
        'the arg "groupedEls" in GroupCmd constructor has duplicate values',
      );
    }
    this.group = new Group();
    this.editor.groupManager.addGroup(this.group);
    this.do();
  }
  private do() {
    const groupedSet = new Set(this.groupedElSet);
    const graphs = this.editor.sceneGraph.children;
    const newGraphs: Graph[] = [];
    const groupedGraphs: Graph[] = [];

    for (let i = 0; i < graphs.length; i++) {
      const prevGraphId = i <= 0 ? '' : graphs[i - 1].id;
      const graph = graphs[i];
      if (groupedSet.has(graph)) {
        groupedSet.delete(graph);
        groupedGraphs.push(graph);

        this.prevGroupedElInfoMap.set(prevGraphId, {
          graph,
          groupIds: this.editor.groupManager.getGraphGroupIds(graph.id),
        });

        if (groupedSet.size === 0) {
          newGraphs.push(...groupedGraphs);
          const groupIds = this.editor.groupManager.getGraphGroupIds(graph.id);
          for (const groupedGraph of groupedGraphs) {
            this.editor.groupManager.setGraphGroupIds(
              groupedGraph.id,
              new Set([...groupIds, this.group.id]),
            );
          }
        }
      } else {
        newGraphs.push(graph);
      }
    }

    this.editor.sceneGraph.children = newGraphs;
    this.editor.sceneGraph.render();
  }

  redo() {
    this.do();
  }
  undo() {
    const prevGroupedElInfoMap = this.prevGroupedElInfoMap;
    const graphs = this.editor.sceneGraph.children.filter(
      (graph) => !this.groupedElSet.has(graph),
    );
    const newGraphs: Graph[] = [];

    if (prevGroupedElInfoMap.has('')) {
      newGraphs.push();
    }

    for (let i = -1; i < graphs.length; i++) {
      const graph = i === -1 ? null : graphs[i];

      if (graph) {
        newGraphs.push(graph);
      }

      let graphId = graph ? graph.id : '';
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (prevGroupedElInfoMap.has(graphId)) {
          const { graph: groupedGraph, groupIds } =
            prevGroupedElInfoMap.get(graphId)!;
          this.editor.groupManager.setGraphGroupIds(groupedGraph.id, groupIds);
          newGraphs.push(groupedGraph);
          graphId = groupedGraph.id;
        } else {
          break;
        }
      }
    }

    this.editor.sceneGraph.children = newGraphs;
  }
}
