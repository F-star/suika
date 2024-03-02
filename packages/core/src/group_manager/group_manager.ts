import { Editor } from '../editor';
import { Group } from './group';
import { IGroupsData } from './type';

export class GroupManager {
  private dataSet = new Set<Group>();
  /** graphId -> Set[topGroup1, group2] */
  private graphToGroupMap = new Map<string, Set<string>>();

  constructor(private editor: Editor) {}

  addGroup(group: Group) {
    this.dataSet.add(group);
  }

  getGroup(id: string) {
    for (const group of this.dataSet) {
      if (group.id === id) {
        return group;
      }
    }
    return null;
  }

  load({ groups: groupsData, graphToGroupMap }: IGroupsData) {
    for (const groupData of groupsData) {
      const group = new Group(groupData);
      this.addGroup(group);
    }
    this.graphToGroupMap = new Map(
      Object.entries(graphToGroupMap).map(([key, value]) => {
        return [key, new Set(value)];
      }),
    );
  }

  export(): IGroupsData {
    return {
      groups: this.getUsedGroups(),
      graphToGroupMap: this.getUsedGraphGroupIdsMap(),
    };
  }

  private getUsedGraphGroupIdsMap() {
    const graphs = this.editor.sceneGraph.children;
    const graphToGroupMap: { [id: string]: string[] } = {};
    for (const graph of graphs) {
      const groupIds = this.getGraphGroupIds(graph.attrs.id);
      if (groupIds.size > 0) {
        graphToGroupMap[graph.attrs.id] = [...groupIds];
      }
    }
    return graphToGroupMap;
  }

  private getUsedGroups() {
    // 递归图形树，得到用到的 groupId，然后从 dataSet 中找到它们，并返回
    const usedGroupIds = new Set<string>();
    const graphs = this.editor.sceneGraph.children;
    for (const graph of graphs) {
      this.getGraphGroupIds(graph.attrs.id).forEach((groupId) => {
        usedGroupIds.add(groupId);
      });
    }
    const usedGroups = new Set<Group>();
    for (const group of this.dataSet) {
      if (usedGroupIds.has(group.id)) {
        usedGroups.add(group);
      }
    }
    return [...usedGroups];
  }

  // removeGroup(group: Group) {
  //   this.dataSet.delete(group);
  // }

  getGraphGroupIds(graphId: string) {
    const groupIds = this.graphToGroupMap.get(graphId);
    return groupIds || new Set<string>();
  }

  setGraphGroupIds(graphId: string, groupIds: Set<string>) {
    this.graphToGroupMap.set(graphId, groupIds);
  }
}
