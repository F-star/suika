import { ICursor } from '../cursor_manager';
import { Editor } from '../editor';

export interface ITool extends IBaseTool {
  hotkey: string;
  type: string;
  cursor: ICursor;
  moveExcludeDrag: (event: PointerEvent, isOutsideCanvas: boolean) => void;
}

export interface IBaseTool {
  active: () => void;
  inactive: () => void;
  // moveExcludeDrag: (event: PointerEvent) => void;
  start: (event: PointerEvent) => void;
  drag: (event: PointerEvent) => void;
  /**
   * end (after drag)
   * @param event
   * @param isDragHappened is drag happened
   * @returns
   */
  end: (event: PointerEvent, isDragHappened: boolean) => void;
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
