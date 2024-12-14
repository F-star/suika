import { type ImgManager } from '../Img_manager';

export interface IHitOptions {
  tol: number;
  parentIdSet: Set<string>;
  zoom: number;
}

export interface IDrawInfo {
  ctx: CanvasRenderingContext2D;
  imgManager?: ImgManager;
  smooth?: boolean;
  opacity?: number;
}

export const GraphicsObjectSuffix = {
  Rect: 'Rect',
  Ellipse: 'Ellipse',
  Line: 'Line',
  RegularPolygon: 'Polygon',
  Star: 'Star',
  Path: 'Path',
  Text: 'Text',
  Group: 'Group',
  Frame: 'Frame',
};
