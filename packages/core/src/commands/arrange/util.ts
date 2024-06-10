import { type SuikaGraphics } from '../../graphs';

/**
 * return
 * index: first unmovedGraphs index
 * count: the count of movedGraphs when reach first unmovedGraph
 */
export const firstInfoOfUnmovedGraphs = (
  graphs: SuikaGraphics[],
  movedGraphSet: Set<SuikaGraphics>,
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
  graphs: SuikaGraphics[],
  movedGraphSet: Set<SuikaGraphics>,
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
