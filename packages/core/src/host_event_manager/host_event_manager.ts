import { EventEmitter } from '@suika/common';
import { distance, type IPoint } from '@suika/geo';

import { type Editor } from '../editor';
import { CommandKeyBinding } from './command_key_binding';
import { MoveGraphsKeyBinding } from './move_graphs_key_binding';

interface Events {
  shiftToggle(press: boolean): void;
  altToggle(press: boolean): void;
  spaceToggle(press: boolean): void;
  wheelBtnToggle(press: boolean, event: PointerEvent): void;
  contextmenu(point: IPoint): void;
  continueClick(): void;
}

/**
 * 按键、鼠标等事件管理
 */
export class HostEventManager {
  isShiftPressing = false;
  isCtrlPressing = false;
  isAltPressing = false;
  isCommandPressing = false;
  isSpacePressing = false;
  isWheelBtnPressing = false;

  isDraggingCanvasBySpace = false;
  isEnableDelete = true;
  isEnableContextMenu = true;
  // isEnableMoveSelectedElementByKey = true; // no use now

  private moveGraphsKeyBinding: MoveGraphsKeyBinding;
  private commandKeyBinding: CommandKeyBinding;

  private eventEmitter = new EventEmitter<Events>();
  private unbindHandlers: Array<() => void> = [];

  constructor(private editor: Editor) {
    this.moveGraphsKeyBinding = new MoveGraphsKeyBinding(editor);
    this.commandKeyBinding = new CommandKeyBinding(editor);
  }
  bindHotkeys() {
    this.bindModifiersRecordEvent(); // 记录 isShiftPressing 等值
    this.bindWheelEvent();
    this.bindMouseRecordEvent();
    this.bindContextMenu();

    this.moveGraphsKeyBinding.bindKey();
    this.commandKeyBinding.bindKey();
  }

  private bindModifiersRecordEvent() {
    const handler = (event: KeyboardEvent) => {
      const prevShift = this.isShiftPressing;
      const prevAlt = this.isAltPressing;
      const prevSpace = this.isSpacePressing;

      this.isShiftPressing = event.shiftKey;
      this.isCtrlPressing = event.ctrlKey;
      this.isAltPressing = event.altKey;
      this.isCommandPressing = event.metaKey;
      if (event.code === 'Space') {
        this.isSpacePressing = event.type === 'keydown';
      }

      if (prevShift !== this.isShiftPressing) {
        this.eventEmitter.emit('shiftToggle', this.isShiftPressing);
      }
      if (prevAlt !== this.isAltPressing) {
        this.eventEmitter.emit('altToggle', this.isAltPressing);
      }
      if (prevSpace !== this.isSpacePressing) {
        this.eventEmitter.emit('spaceToggle', this.isSpacePressing);
      }
    };

    document.addEventListener('keydown', handler);
    document.addEventListener('keyup', handler);

    this.unbindHandlers.push(() => {
      document.removeEventListener('keydown', handler);
      document.removeEventListener('keyup', handler);
    });
  }

  private bindMouseRecordEvent() {
    let pointerDownTimeStamp = -Infinity;
    let lastPointerDownPos: IPoint = { x: -99, y: -99 };

    const handlePointerEvent = (event: PointerEvent) => {
      // mouse left
      if (event.button === 0 && event.type === 'pointerdown') {
        const now = new Date().getTime();
        const newPos = {
          x: event.pageX,
          y: event.pageY,
        };

        const interval = now - pointerDownTimeStamp;
        const clickDistanceDiff = distance(newPos, lastPointerDownPos);
        if (
          interval < this.editor.setting.get('continueClickMaxGap') &&
          clickDistanceDiff <
            this.editor.setting.get('continueClickDistanceTol')
        ) {
          pointerDownTimeStamp = now;
          this.eventEmitter.emit('continueClick');
        }
        pointerDownTimeStamp = now;
        lastPointerDownPos = newPos;
      }

      // mouse middle
      if (event.button === 1) {
        const prevWheelBtnPressing = this.isWheelBtnPressing;
        this.isWheelBtnPressing = event.type === 'pointerdown';
        if (prevWheelBtnPressing !== this.isWheelBtnPressing) {
          this.eventEmitter.emit(
            'wheelBtnToggle',
            this.isWheelBtnPressing,
            event,
          );
        }
      }
    };

    document.addEventListener('pointerdown', handlePointerEvent);
    document.addEventListener('pointerup', handlePointerEvent);

    this.unbindHandlers.push(() => {
      document.removeEventListener('pointerdown', handlePointerEvent);
      document.removeEventListener('pointerup', handlePointerEvent);
    });
  }

  /**
   * shiftToggle 会在切换时触发。按住 shift 不放，只会触发一次
   */
  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }
  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.off(eventName, handler);
  }

  /**
   * bind wheel event, to zoom or move canvas
   */
  private bindWheelEvent() {
    const editor = this.editor;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const point = this.editor.getCursorXY(event);
        let isZoomOut = event.deltaY > 0;
        if (this.editor.setting.get('invertZoomDirection')) {
          isZoomOut = !isZoomOut;
        }
        if (isZoomOut) {
          editor.zoomManager.zoomOut({
            center: point,
            deltaY: event.deltaY,
          });
        } else {
          editor.zoomManager.zoomIn({
            center: point,
            deltaY: event.deltaY,
          });
        }
        editor.render();
      } else {
        if (
          this.editor.canvasDragger.isActive() &&
          this.editor.canvasDragger.isPressing()
        ) {
          return;
        }
        const zoom = editor.zoomManager.getZoom();
        editor.viewportManager.translate(
          event.deltaX / zoom,
          event.deltaY / zoom,
        );
        editor.render();
      }
    };

    // prevent default scale page action in win
    const preventDefaultScalePage = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };

    editor.canvasElement.addEventListener('wheel', onWheel);
    window.addEventListener('wheel', preventDefaultScalePage, {
      passive: false,
    });
    this.unbindHandlers.push(() => {
      editor.canvasElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('wheel', preventDefaultScalePage);
    });
  }

  private bindContextMenu() {
    const handler = (e: MouseEvent) => {
      e.preventDefault();
      if (this.isEnableContextMenu) {
        this.eventEmitter.emit('contextmenu', { x: e.clientX, y: e.clientY });
      }
    };
    this.editor.canvasElement.addEventListener('contextmenu', handler);
    this.unbindHandlers.push(() => {
      this.editor.canvasElement.removeEventListener('contextmenu', handler);
    });
  }

  enableDelete() {
    this.isEnableDelete = true;
  }
  disableDelete() {
    this.isEnableDelete = false;
  }
  enableContextmenu() {
    this.isEnableContextMenu = true;
  }
  disableContextmenu() {
    this.isEnableContextMenu = false;
  }
  destroy() {
    this.unbindHandlers.forEach((fn) => fn());
    this.unbindHandlers = [];
    this.moveGraphsKeyBinding.destroy();
    this.commandKeyBinding.destroy();
  }
}
