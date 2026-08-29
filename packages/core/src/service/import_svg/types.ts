export type Matrix = [number, number, number, number, number, number];

export interface SvgNode {
  type: string;
  transform: Matrix;
  attributes: Record<string, string>;
  children: SvgNode[];
  text?: string;
}
