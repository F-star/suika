import { type GraphicsStore } from '../graphics_manger';
import { type SuikaGraphics } from '../graphs';

export const getParent = (
  graphics: SuikaGraphics,
  graphicsStore: GraphicsStore,
) => {
  const parentId = graphics.attrs.parentIndex?.guid;
  const parent = parentId
    ? graphicsStore.get(parentId)
    : graphicsStore.getCanvas();
  return parent;
};
