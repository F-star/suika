export interface ITool {
  type: string;
  active: () => void;
  inactive: () => void;
  moveExcludeDrag: (event: PointerEvent) => void;
  start: (event: PointerEvent) => void;
  drag: (event: PointerEvent) => void;
  end: (event: PointerEvent) => void;
}

export interface IBaseTool {
  active: () => void;
  inactive: () => void;
  // moveExcludeDrag: (event: PointerEvent) => void;
  start: (event: PointerEvent) => void;
  drag: (event: PointerEvent) => void;
  end: (event: PointerEvent) => void;
}

// import { DrawRectTool } from './tool.drawRect';

// export type Tool = DrawRectTool
