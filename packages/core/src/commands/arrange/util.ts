import { type Graph } from '../../graphs';

/**
 * return
 * index: first unmovedGraphs index
 * count: the count of movedGraphs when reach first unmovedGraph
 */
export const firstInfoOfUnmovedGraphs = (
  graphs: Graph[],
  movedGraphSet: Set<Graph>,
): { index: number; count: number } => {
  let index = 0;
  let count = 0;
  for (; index < graphs.length; index++) {
    if (!movedGraphSet.has(graphs[index])) {
      break;
    }
    count++;
  }
  return { index, count };
};

export const lastInfoOfUnmovedGraphs = (
  graphs: Graph[],
  movedGraphSet: Set<Graph>,
): { index: number; count: number } => {
  let index = graphs.length - 1;
  let count = 0;
  for (; index >= 0; index--) {
    if (!movedGraphSet.has(graphs[index])) {
      break;
    }
    count++;
  }
  return { index, count };
};
