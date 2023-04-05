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
    url: string;
    opacity: number;
  };
}

export type ITexture = TextureSolid | TextureImage;
