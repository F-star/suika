import { type ICursor } from '../cursor_manager';
import { type Editor } from '../editor';

export interface ITool extends IBaseTool {
  hotkey: string;
  type: string;
  cursor: ICursor;
  onMoveExcludeDrag: (event: PointerEvent, isOutsideCanvas: boolean) => void;
}

export interface IBaseTool {
  onActive: () => void;
  onInactive: () => void;
  // moveExcludeDrag: (event: PointerEvent) => void;
  onStart: (event: PointerEvent) => void;
  onDrag: (event: PointerEvent) => void;
  /**
   * end (after drag)
   * @param event
   * @param isDragHappened is drag happened
   * @returns
   */
  onEnd: (event: PointerEvent, isDragHappened: boolean) => void;
  /** init state when finish a drag loop */
  afterEnd: (event: PointerEvent) => void;
  onCommandChange?: () => void;
  /** space key toggle */
  onSpaceToggle?: (isSpacePressing: boolean) => void;
  /** alt key toggle */
  onAltToggle?: (isSpacePressing: boolean) => void;
  /** viewport x or y change */
  onViewportXOrYChange?: (x: number, y: number) => void;
  /** canvas drag active change */
  onCanvasDragActiveChange?: (isActive: boolean) => void;
}

export interface IToolClassConstructor {
  new (editor: Editor): ITool;
  type: string;
  hotkey: string;
}
