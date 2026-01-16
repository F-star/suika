// graphics tree utils

import { type SuikaGraphics } from '../graphics';

export const sortGraphicsDeep = (graphics: SuikaGraphics[]) => {
  const elements = graphics.map((item) => ({
    path: item.getSortIndexPath(),
    val: item,
  }));

  elements.sort((a, b) => {
    const len = Math.max(a.path.length, b.path.length);
    for (let i = 0; i < len; i++) {
      const sortIdxA = a.path[i];
      const sortIdxB = b.path[i];
      if (sortIdxA === sortIdxB) {
        continue;
      }
      return sortIdxA < sortIdxB ? -1 : 1;
    }
    return a.path.length < b.path.length ? -1 : 1;
  });
  return elements.map((item) => item.val);
};

/**
 * get post order nodes between node1 and node2
 */
export const getBetweenNodes = (node1: SuikaGraphics, node2: SuikaGraphics) => {
  const result: SuikaGraphics[] = [];
  let bottomNode: SuikaGraphics;
  let topNode: SuikaGraphics;

  if (node1.hasAncestor(node2.attrs.id)) {
    bottomNode = node1;
    topNode = node2;
  } else if (node2.hasAncestor(node1.attrs.id)) {
    bottomNode = node2;
    topNode = node1;
  } else {
    [bottomNode, topNode] = sortGraphicsDeep([node1, node2]);
  }

  let current: SuikaGraphics | null = bottomNode;
  // loop until find endNode or traversal end
  while (current !== null) {
    result.push(current);

    if (current === topNode) {
      break;
    }

    current = getNextPostOrder(current);
  }

  return result;
};

/**
 * get next post order node
 */
const getNextPostOrder = (node: SuikaGraphics): SuikaGraphics | null => {
  const parent = node.getParent();
  if (!parent) return null;

  const children = parent.getChildren();
  const index = children.indexOf(node);

  if (index === children.length - 1) {
    return parent;
  }

  let sibling = children[index + 1];

  let siblingChildren = sibling.getChildren();
  while (siblingChildren.length > 0) {
    sibling = siblingChildren[0];
    siblingChildren = sibling.getChildren();
  }

  return sibling;
};

export const getCommonAncestorId = (
  startNode: SuikaGraphics,
  endNode: SuikaGraphics,
) => {
  const startParentIds = startNode.getParentIds().reverse();
  startParentIds.push(startNode.attrs.id);

  const endParentIds = endNode.getParentIds().reverse();
  endParentIds.push(endNode.attrs.id);

  const minLen = Math.min(startParentIds.length, endParentIds.length);

  // find the first different index
  let diffIndex = -1;
  for (let i = 0; i < minLen; i++) {
    if (startParentIds[i] !== endParentIds[i]) {
      diffIndex = i;
      break;
    }
  }

  if (diffIndex !== -1) {
    // If diffIndex === 0, the root node is different (should not happen, but needs to be processed)
    if (diffIndex === 0) {
      return {
        commonParent: startParentIds[0] ?? endParentIds[0],
        startParent: startParentIds[0],
        endParent: endParentIds[0],
      };
    }
    // The common ancestor is the node at position diffIndex - 1
    return {
      commonParent: startParentIds[diffIndex - 1],
      startParent: startParentIds[diffIndex], // startNode's ancestor behind commonParent
      endParent: endParentIds[diffIndex], // endNode's ancestor behind commonParent
    };
  }

  // If all elements are equal, one node is an ancestor of the other, or the two nodes are the same
  // In this case, the common ancestor is the last element of the shorter path
  return {
    commonParent: startParentIds[minLen - 1],
    startParent: startNode.attrs.id,
    endParent: endNode.attrs.id,
  };
};

export const getAllNodesInTree = (nodes: SuikaGraphics[]): SuikaGraphics[] => {
  const result: SuikaGraphics[] = [];
  const queue: SuikaGraphics[] = [...nodes];
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);
    queue.push(...current.getChildren());
  }
  return result;
};

/**
 * 数据清洗，这里父子节点可能同时存在，某些要丢掉子节点，只保留父节点
 * 规则为：
 * nodes 里的一个节点，它的子节点全部被选中，这个节点就保留，子节点剔除掉
 * 否则子节点保留，父节点剔除掉。
 * 应该要用拓扑遍历，从叶子节点往上不断判断。
 *
 * data cleaning, some nodes may have both parent and child nodes, some need to be removed, some need to be kept.
 * the rule is:
 * if a node in nodes has all its children selected, this node should be kept, its children should be removed.
 * otherwise, the node should be removed, its children should be kept.
 * should use topological traversal, from leaf nodes to the root node, and judge each node.
 */
export const cleanTreeSelectState = (
  nodes: SuikaGraphics[],
  nodeIdSet: Set<string>,
): SuikaGraphics[] => {
  // 排序，深的放前面，分成组
  const levelNodes: SuikaGraphics[][] = [];
  for (const node of nodes) {
    const level = node.getParentIds().length;
    if (!levelNodes[level]) {
      levelNodes[level] = [];
    }
    levelNodes[level].push(node);
  }

  for (let i = levelNodes.length - 1; i >= 0; i--) {
    if (!levelNodes[i]) continue;

    const skipIdSet = new Set<string>();
    for (const node of levelNodes[i]) {
      const parent = node.getParent()!;

      if (skipIdSet.has(node.attrs.id)) {
        continue;
      }

      if (!nodeIdSet.has(node.attrs.id)) {
        nodeIdSet.delete(parent.attrs.id);
        continue;
      }

      // judge if siblings are all in nodeIdSet
      // if yes, delete siblings from nodeIdSet
      // if no, delete parent from nodeIdSet
      if (nodeIdSet.has(parent.attrs.id)) {
        const siblings = parent.getChildren();
        const allChildrenInSet = siblings.every((item) =>
          nodeIdSet.has(item.attrs.id),
        );
        // if all children are in nodeIdSet, delete children from nodeIdSet
        if (allChildrenInSet) {
          for (const item of siblings) {
            nodeIdSet.delete(item.attrs.id);
            skipIdSet.add(item.attrs.id);
          }
        } else {
          nodeIdSet.delete(parent.attrs.id);
        }
      }
    }
  }

  return nodes.filter((node) => nodeIdSet.has(node.attrs.id));
};
