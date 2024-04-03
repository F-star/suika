export enum PaintType {
  Solid = 'Solid',
  Image = 'Image',
}

export interface IRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface PaintSolid {
  type: PaintType.Solid;
  attrs: IRGBA;
}

export interface PaintImage {
  type: PaintType.Image;
  attrs: {
    src?: string;
    opacity?: number;
  };
}

export type IPaint = PaintSolid | PaintImage;

export const DEFAULT_SOLID_PAINT: PaintSolid = {
  type: PaintType.Solid,
  attrs: { r: 217, g: 217, b: 217, a: 1 },
};

export const DEFAULT_IMAGE_PAINT: PaintImage = {
  type: PaintType.Image,
  attrs: {},
};

export const DEFAULT_PAINTS = {
  [PaintType.Solid]: DEFAULT_SOLID_PAINT,
  [PaintType.Image]: DEFAULT_IMAGE_PAINT,
};

export const DEFAULT_IMAGE = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 4;
  const ctx = canvas.getContext('2d')!;
  // draw a 4x4 black-white grid
  for (let i = 0; i < canvas.width; i++) {
    for (let j = 0; j < canvas.height; j++) {
      // The color is determined by the parity (even or odd nature) of the sum of i and j.
      const color = (i + j) % 2 === 0 ? 'black' : 'white';
      ctx.fillStyle = color;
      ctx.fillRect(i, j, 1, 1);
    }
  }
  return canvas;
})();

export const DEFAULT_IMAGE_SRC = DEFAULT_IMAGE.toDataURL();
