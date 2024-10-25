import { type ICursor } from '../cursor_manager';
import { type SuikaEditor } from '../editor';
import { type IKey } from '../key_binding_manager';

export interface ITool extends IBaseTool {
  hotkey: string | IKey;
  type: string;
  cursor: ICursor;

  enableActive?: () => Promise<boolean>;
  onMoveExcludeDrag: (event: PointerEvent, isOutsideCanvas: boolean) => void;
  getDragBlockStep?: () => number;
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
  afterEnd: (event: PointerEvent, isDragHappened: boolean) => void;
  onCommandChange?: () => void;
  /** space key toggle */
  onSpaceToggle?: (isSpacePressing: boolean) => void;
  /** shift key toggle */
  onShiftToggle?: (isShiftPressing: boolean) => void;
  /** alt key toggle */
  onAltToggle?: (isAltPressing: boolean) => void;
  /** viewport x or y change */
  onViewportXOrYChange?: (x: number, y: number) => void;
  /** canvas drag active change */
  onCanvasDragActiveChange?: (isActive: boolean) => void;
}

export interface IToolClassConstructor {
  new (editor: SuikaEditor): ITool;
  type: string;
  hotkey: string | IKey;
}
