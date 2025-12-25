import { type IPoint } from '@suika/geo';

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
  letterSpacing: ILetterSpacing;
}

export type INumberUnits = 'PIXELS' | 'PERCENT';

export interface ILetterSpacing {
  value: number;
  units: INumberUnits;
}

export interface ILineHeight {
  value: number;
  units: INumberUnits | 'RAW';
}
