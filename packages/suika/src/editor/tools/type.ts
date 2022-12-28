export interface ITool {
  active: () => void;
  inactive: () => void;
  start: (event: PointerEvent) => void;
  drag: (event: PointerEvent) => void;
  end: (event: PointerEvent) => void;
}

// import { DrawRectTool } from './tool.drawRect';

// export type Tool = DrawRectTool
