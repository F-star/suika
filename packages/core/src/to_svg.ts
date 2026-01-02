import { boxToRect, mergeBoxes } from '@suika/geo';

import { type SuikaGraphics } from './graphics';

export const toSVG = (graphicsArr: SuikaGraphics[]) => {
  graphicsArr = graphicsArr.filter((item) => item.isVisible());

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

  return {
    width: mergedRect.width,
    height: mergedRect.height,
    svg: svgHead + content + svgTail,
  };
};

export const toPNGBlob = async (
  graphicsArr: SuikaGraphics[],
): Promise<Blob> => {
  const svgData = toSVG(graphicsArr);
  const { svg, width, height } = svgData;

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const svgDataUrl = URL.createObjectURL(svgBlob);

  // create image object and load SVG
  const img = new Image();
  img.crossOrigin = 'anonymous';

  return new Promise((resolve, reject) => {
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(svgDataUrl);
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        // convert to blob
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(svgDataUrl);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        }, 'image/png');
      } catch (error) {
        URL.revokeObjectURL(svgDataUrl);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(svgDataUrl);
      reject(new Error('Failed to load SVG'));
    };

    img.src = svgDataUrl;
  });
};
