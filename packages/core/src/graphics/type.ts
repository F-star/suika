import { type ImgManager } from '../Img_manager';

export const GraphicsGraphics: Record<
  string,
  {
    /** icon */
    label: string;
    key: string;
    uiType: string;
    suffixValue?: string;
  }
> = {
  // rotation 使用 numberInput 组件
  // 精度为 0.01
  // 后缀为 “度数”
  x: {
    label: 'X',
    key: 'x',
    uiType: 'number',
  },
  y: {
    label: 'Y',
    key: 'y',
    uiType: 'number',
  },
  width: {
    label: 'W',
    key: 'width',
    uiType: 'number',
  },
  height: {
    label: 'H',
    key: 'height',
    uiType: 'number',
  },
  rotation: {
    label: 'R',
    key: 'rotation',
    suffixValue: '°',
    uiType: 'number',
  },
};

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
