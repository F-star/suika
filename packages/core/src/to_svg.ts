import { boxToRect, mergeBoxes } from '@suika/geo';

import { type SuikaGraphics } from './graphs';

export const toSVG = (graphicsArr: SuikaGraphics[]) => {
  // FIXME: to sort
  const mergedBbox = mergeBoxes(
    graphicsArr.map((el) => el.getBboxWithStroke()),
  );
  const mergedRect = boxToRect(mergedBbox);
  const offset = {
    x: -mergedBbox.minX,
    y: -mergedBbox.minY,
  };

  const svgHead = `<svg width="${mergedRect.width}" height="${mergedRect.height}" viewBox="0 0 ${mergedRect.width} ${mergedRect.height}" fill="none" xmlns="http://www.w3.org/2000/svg">\n`;
  const svgTail = `</svg>`;

  let content = '';
  for (const graphics of graphicsArr) {
    content += graphics.toSVGSegment(offset);
  }

  return svgHead + content + svgTail;
};
