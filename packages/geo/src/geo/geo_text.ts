import { type IPoint } from '../type';

export interface ITextMetrics {
  readonly width: number;
  readonly height: number;
}

export interface IGlyph {
  readonly width: number;
  readonly position: IPoint;
  readonly commands: string;
}

export interface IFontStyle {
  fontSize: number;
  fontFamily: string;
}
