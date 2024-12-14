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
