import { type SuikaGraphics } from '../graphics';

export const getNoConflictObjectName = (
  parent: SuikaGraphics,
  objectType: string,
) => {
  const children = parent.getChildren();
  let maxNum = 0;
  const regexp = new RegExp(`^${objectType}\\s+(\\d+)`);
  for (const child of children) {
    const match = child.attrs.objectName.match(regexp);
    if (match) {
      const num = parseInt(match[1]);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }
  return `${objectType} ${maxNum + 1}`;
};

export const mergeIntervals = (intervals: [number, number][]) => {
  intervals.sort(([a], [b]) => a - b);

  const result: [number, number][] = [];
  for (const [prev, next] of intervals) {
    const cur = result.at(-1);
    if (cur && cur[1] >= prev) {
      cur[1] = Math.max(next, cur[1]);
    } else {
      result.push([prev, next]);
    }
  }
  return result;
};
