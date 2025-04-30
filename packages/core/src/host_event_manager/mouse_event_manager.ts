import { cloneDeep, EventEmitter, isEqual } from '@suika/common';
import { distance, type IPoint } from '@suika/geo';

import { type SuikaEditor } from '../editor';

export enum MouseKey {
  Left = 0,
  Mid = 1,
}

export type IMouseEvent = Readonly<{
  pos: Readonly<IPoint>;
  vwPos: Readonly<IPoint>;
  nativeEvent: PointerEvent;
  isComboClick?: boolean;
}>;

export type IMousemoveEvent = Readonly<{
  pos: Readonly<IPoint>;
  vwPos: Readonly<IPoint>;
  nativeEvent: PointerEvent;
  maxDragDistance: number;
  isOutside: boolean; // dragging state and mouse is outside canvas
}>;

interface Events {
  wheelBtnToggle(press: boolean, event: PointerEvent): void;
  cursorPosUpdate(pos: IPoint | null): void;
  start(event: IMouseEvent): void;
  end(event: IMouseEvent): void;
  move(event: IMousemoveEvent): void; // move but not dragging
  drag(event: IMousemoveEvent): void;
  comboClick(event: IMouseEvent): void;
}

export class MouseEventManager {
  private isWheelBtnPressing = false;
  private eventEmitter = new EventEmitter<Events>();
  private cursorPos: IPoint | null = null;

  constructor(private editor: SuikaEditor) {
    this.bindEvent();
  }

  getCursorPos() {
    return cloneDeep(this.cursorPos);
  }

  private setCursorPos(pos: IPoint | null) {
    const prevCursorPos = this.cursorPos;
    this.cursorPos = pos && { x: pos.x, y: pos.y };

    if (!isEqual(prevCursorPos, this.cursorPos)) {
      this.eventEmitter.emit('cursorPosUpdate', cloneDeep(pos));
    }
  }

  private startPos: IPoint = { x: 0, y: 0 };
  private isPressing = false;
  private maxDragDistance = 0;

  private onPointerdown = (event: PointerEvent) => {
    if (event.target !== this.editor.canvasElement) {
      return;
    }
    this.updateIsWheelBtnPressing(event);
    this.isPressing = true;

    const { pos, vwPos } = this.getPosAndVwPos(event);
    this.startPos = { ...pos };
    const isComboClick = this.checkIfComboClick(event);
    const e = {
      pos,
      vwPos,
      nativeEvent: event,
      isComboClick,
    };
    this.eventEmitter.emit('start', e);
    if (isComboClick) {
      this.eventEmitter.emit('comboClick', e);
    }
  };

  private onPointerMove = (event: PointerEvent) => {
    const isInsideCanvas = event.target === this.editor.canvasElement;
    if (isInsideCanvas || this.isPressing) {
      const cursorPos = this.editor.getSceneCursorXY(event);
      this.setCursorPos(cursorPos);
    }

    const { pos, vwPos } = this.getPosAndVwPos(event);
    if (this.isPressing) {
      const dx = pos.x - this.startPos.x;
      const dy = pos.y - this.startPos.y;
      const dragDistance = Math.max(Math.abs(dx), Math.abs(dy));
      this.maxDragDistance = Math.max(dragDistance, this.maxDragDistance);
      this.eventEmitter.emit('drag', {
        pos,
        vwPos,
        nativeEvent: event,
        isOutside: isInsideCanvas,
        maxDragDistance: this.maxDragDistance,
      });
    } else {
      this.eventEmitter.emit('move', {
        pos,
        vwPos,
        nativeEvent: event,
        isOutside: isInsideCanvas,
        maxDragDistance: this.maxDragDistance,
      });
    }
  };

  private getPosAndVwPos(event: PointerEvent) {
    const vwPos = this.editor.getCursorXY(event);
    return {
      pos: this.editor.toScenePt(vwPos.x, vwPos.y),
      vwPos,
    };
  }

  private onPointerUp = (event: PointerEvent) => {
    this.updateIsWheelBtnPressing(event);
    this.isPressing = false;
    this.maxDragDistance = 0;
    const isInsideCanvas = event.target === this.editor.canvasElement;

    // FIXME: 这个要在画布内释放，才能出触发，并不好，交给使用者决定是否要用到。
    // FIXME: this.isPressing 判断写得有问题，前面已经改为 false，是个固定值了
    if (isInsideCanvas || this.isPressing) {
      this.eventEmitter.emit('end', {
        ...this.getPosAndVwPos(event),
        nativeEvent: event,
      });
    }
  };

  private updateIsWheelBtnPressing(event: PointerEvent) {
    if (event.button === MouseKey.Mid) {
      const prevWheelBtnPressing = this.isWheelBtnPressing;
      if (event.type === 'pointerdown') {
        this.isWheelBtnPressing = true;
      } else if (event.type === 'pointerup') {
        this.isWheelBtnPressing = false;
      }
      if (prevWheelBtnPressing !== this.isWheelBtnPressing) {
        this.eventEmitter.emit(
          'wheelBtnToggle',
          this.isWheelBtnPressing,
          event,
        );
      }
    }
  }

  private pointerDownTimeStamp = -Infinity;
  private lastPointerDownPos: IPoint = { x: -99, y: -99 };

  private checkIfComboClick = (nativeEvent: PointerEvent) => {
    if (nativeEvent.button !== MouseKey.Left) {
      return false;
    }
    const now = new Date().getTime();
    const newPos = {
      x: nativeEvent.pageX,
      y: nativeEvent.pageY,
    };

    const interval = now - this.pointerDownTimeStamp;
    const clickDistanceDiff = distance(newPos, this.lastPointerDownPos);
    if (
      interval < this.editor.setting.get('comboClickMaxGap') &&
      clickDistanceDiff < this.editor.setting.get('comboClickDistanceTol')
    ) {
      this.pointerDownTimeStamp = now;
      return true;
    }
    this.pointerDownTimeStamp = now;
    this.lastPointerDownPos = newPos;
    return false;
  };

  private bindEvent() {
    window.addEventListener('pointerdown', this.onPointerdown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  private unbindEvent() {
    window.removeEventListener('pointerdown', this.onPointerdown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }

  destroy() {
    this.unbindEvent();
  }

  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }
  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.off(eventName, handler);
  }
}
