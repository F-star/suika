import { EventEmitter } from '@suika/common';
import { type IPoint } from '@suika/geo';

import { type SuikaEditor } from '../editor';
import { CommandKeyBinding } from './command_key_binding';
import { MoveGraphsKeyBinding } from './move_graphs_key_binding';

interface Events {
  shiftToggle(press: boolean): void;
  altToggle(press: boolean): void;
  spaceToggle(press: boolean): void;
  contextmenu(point: IPoint): void;
}

/**
 * 对原生事件做一层封装
 *
 * 1. 监听 Shift、Alt、Space、Command 的按下释放事件
 * 2. 滚轮事件
 * 3. 鼠标右键菜单
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

  constructor(private editor: SuikaEditor) {
    this.moveGraphsKeyBinding = new MoveGraphsKeyBinding(editor);
    this.commandKeyBinding = new CommandKeyBinding(editor);
  }
  bindHotkeys() {
    this.observeModifiersToggle(); // 记录 isShiftPressing 等值
    this.bindWheelEvent();
    this.bindContextMenu();

    this.moveGraphsKeyBinding.bindKey();
    this.commandKeyBinding.bindKey();
  }

  private observeModifiersToggle() {
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
        // zoom viewport
        event.preventDefault();
        const point = this.editor.getCursorXY(event);
        let isZoomOut = event.deltaY > 0;
        if (this.editor.setting.get('invertZoomDirection')) {
          isZoomOut = !isZoomOut;
        }
        if (isZoomOut) {
          editor.viewportManager.zoomOut({
            center: point,
            deltaY: event.deltaY,
          });
        } else {
          editor.viewportManager.zoomIn({
            center: point,
            deltaY: event.deltaY,
          });
        }
        editor.render();
      } else {
        // translate viewport
        if (
          this.editor.canvasDragger.isActive() &&
          this.editor.canvasDragger.isPressing()
        ) {
          return;
        }
        editor.viewportManager.translate(-event.deltaX, -event.deltaY);
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
