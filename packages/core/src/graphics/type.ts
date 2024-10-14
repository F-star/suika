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
