import { type IPoint } from '@suika/geo';

export interface ITextMetrics {
  readonly width: number;
  readonly height: number;
}

export interface IGlyph {
  readonly width: number;
  readonly position: IPoint;
  readonly commands: string;
  // character index in content
  logicIndex: number;
}

export interface IFontStyle {
  fontSize: number;
  fontFamily: string;
  letterSpacing: ILetterSpacing;
  maxWidth: number;
  lineHeight: number;
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

export type ITextAutoResize = 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT';
