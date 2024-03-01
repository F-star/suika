import { ICursor } from '../cursor_manager';
import { Editor } from '../editor';

export interface ITool extends IBaseTool {
  hotkey: string;
  type: string;
  cursor: ICursor;
  moveExcludeDrag: (event: PointerEvent, isOutsideCanvas: boolean) => void;
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
  /** viewport x or y change */
  onViewportXOrYChange?: (x: number, y: number) => void;
}

export interface IToolClassConstructor {
  new (editor: Editor): ITool;
  type: string;
  hotkey: string;
}
