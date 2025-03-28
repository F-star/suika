import { GraphicsAttrs } from '../graphics';
import { IPanelBaseProps } from '../type';

export interface StarAttrs extends GraphicsAttrs {
  count: number;
  starInnerScale: number;
}

export interface IStarPanelProps extends IPanelBaseProps {
  count: number;
  starInnerScale: number;
}
