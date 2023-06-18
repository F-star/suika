export enum TextureType {
  Solid = 'Solid',
  Image = 'Image',
}

export interface IRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface TextureSolid {
  type: TextureType.Solid;
  attrs: IRGBA;
}

export interface TextureImage {
  type: TextureType.Image;
  attrs: {
    src?: string;
    opacity?: number;
  };
}

export type ITexture = TextureSolid | TextureImage;

export const DEFAULT_SOLID_TEXTURE: TextureSolid = {
  type: TextureType.Solid,
  attrs: { r: 217, g: 217, b: 217, a: 1 },
};

export const DEFAULT_IMAGE_TEXTURE: TextureImage = {
  type: TextureType.Image,
  attrs: {},
};

export const DEFAULT_TEXTURES = {
  [TextureType.Solid]: DEFAULT_SOLID_TEXTURE,
  [TextureType.Image]: DEFAULT_IMAGE_TEXTURE,
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
