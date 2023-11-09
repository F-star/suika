import { IBox, IPoint } from '../../type';
import EventEmitter from '../../utils/event_emitter';
import { Editor } from '../editor';
import { MoveGraphsKeyBinding } from './move_graphs_key_binding';
import { CommandKeyBinding } from './command_key_binding';
import { ICursor } from '../cursor_manager';

interface Events {
  shiftToggle(press: boolean): void;
  altToggle(press: boolean): void;
  spaceToggle(press: boolean): void;
  contextmenu(point: IPoint): void;
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

  isDraggingCanvasBySpace = false;
  isEnableDragCanvasBySpace = true;
  isEnableDelete = true;
  isEnableContextMenu = true;
  // isEnableMoveSelectedElementByKey = true; // no use now

  private moveGraphsKeyBinding: MoveGraphsKeyBinding;
  private commandKeyBinding: CommandKeyBinding;

  private prevCursor: ICursor = 'default';
  private eventEmitter = new EventEmitter<Events>();
  private unbindHandlers: Array<() => void> = [];

  constructor(private editor: Editor) {
    this.moveGraphsKeyBinding = new MoveGraphsKeyBinding(editor);
    this.commandKeyBinding = new CommandKeyBinding(editor);
  }
  bindHotkeys() {
    this.bindModifiersRecordEvent(); // 记录 isShiftPressing 等值
    this.bindWheelEventToZoom(); // 滚轮移动画布
    this.bindDragCanvasEvent(); // 空格和拖拽移动画布
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
      this.isSpacePressing = event.code === 'Space' && event.type === 'keydown';

      if (prevShift !== this.isShiftPressing) {
        this.eventEmitter.emit('shiftToggle', this.isShiftPressing);
      }
      if (prevAlt !== this.isAltPressing) {
        this.eventEmitter.emit('altToggle', this.isAltPressing);
      }
      if (prevSpace !== this.isSpacePressing) {
        this.eventEmitter.emit('spaceToggle', this.isSpacePressing);
      }

      // TODO: move to correct position
      // 按住按键会不停触发响应函数，下面这种写法则只会在按下和释放时分别执行一次
      if (
        this.isEnableDragCanvasBySpace &&
        prevSpace !== this.isSpacePressing
      ) {
        if (this.isSpacePressing) {
          this.prevCursor = this.editor.getCursor();
          this.editor.setCursor('grab');
        } else {
          if (!this.isDraggingCanvasBySpace) {
            this.editor.setCursor(this.prevCursor);
          }
        }
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

  private bindWheelEventToZoom() {
    const editor = this.editor;
    const handler = (event: WheelEvent) => {
      if (this.isCtrlPressing || this.isCommandPressing) {
        const { x: cx, y: cy } = this.editor.getCursorXY(event);
        if (event.deltaY > 0) {
          editor.zoomManager.zoomOut(cx, cy);
          editor.sceneGraph.render();
        } else if (event.deltaY < 0) {
          editor.zoomManager.zoomIn(cx, cy);
          editor.sceneGraph.render();
        }
      } else {
        const zoom = editor.zoomManager.getZoom();
        editor.viewportManager.translate(
          event.deltaX / zoom,
          event.deltaY / zoom,
        );
        editor.sceneGraph.render();
      }
    };

    // prevent default scale page action in win
    const preventDefaultScalePage = (event: WheelEvent) => {
      if (this.isCtrlPressing || this.isCommandPressing) {
        event.preventDefault();
      }
    };

    editor.canvasElement.addEventListener('wheel', handler);
    window.addEventListener('wheel', preventDefaultScalePage, {
      passive: false,
    });
    this.unbindHandlers.push(() => {
      editor.canvasElement.removeEventListener('wheel', handler);
      window.removeEventListener('wheel', preventDefaultScalePage);
    });
  }

  private bindDragCanvasEvent() {
    let isEnableDrag = false;
    let startPointer: IPoint | null = null;
    let prevViewport: IBox;

    // 鼠标按下
    const pointerdownHandler = (event: PointerEvent) => {
      isEnableDrag = false;
      startPointer = null;
      this.isDraggingCanvasBySpace = false;

      if (this.isEnableDragCanvasBySpace && this.isSpacePressing) {
        this.editor.setCursor('grabbing');
        this.isDraggingCanvasBySpace = true;
        startPointer = this.editor.getCursorXY(event);
        prevViewport = this.editor.viewportManager.getViewport();
      }
    };
    this.editor.canvasElement.addEventListener(
      'pointerdown',
      pointerdownHandler,
    );

    // drag canvas when mouse move
    const pointermoveHandler = (event: PointerEvent) => {
      if (startPointer) {
        const viewportPos = this.editor.getCursorXY(event);
        const dx = viewportPos.x - startPointer.x;
        const dy = viewportPos.y - startPointer.y;
        const dragBlockStep = this.editor.setting.get('dragBlockStep');
        if (
          (!isEnableDrag && Math.abs(dx) > dragBlockStep) ||
          Math.abs(dy) > dragBlockStep
        ) {
          isEnableDrag = true;
        }
        if (isEnableDrag) {
          const zoom = this.editor.zoomManager.getZoom();
          const viewportX = prevViewport.x - dx / zoom;
          const viewportY = prevViewport.y - dy / zoom;

          this.editor.viewportManager.setViewport({
            x: viewportX,
            y: viewportY,
          });
          this.editor.sceneGraph.render();
        }
      }
    };
    window.addEventListener('pointermove', pointermoveHandler);

    // 鼠标释放
    const pointerupHandler = () => {
      if (this.isDraggingCanvasBySpace) {
        this.editor.setCursor(this.isSpacePressing ? 'grab' : this.prevCursor);
      }
      isEnableDrag = false;
      startPointer = null;
      // we hope reset isDraggingCanvasBySpace after exec tool.end()
      setTimeout(() => {
        this.isDraggingCanvasBySpace = false;
      });
    };
    window.addEventListener('pointerup', pointerupHandler);

    this.unbindHandlers.push(() => {
      this.editor.canvasElement.removeEventListener(
        'pointerdown',
        pointerdownHandler,
      );
      window.removeEventListener('pointermove', pointermoveHandler);
      window.removeEventListener('pointerup', pointerupHandler);
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

  enableDragBySpace() {
    this.isEnableDragCanvasBySpace = true;
  }
  disableDragBySpace() {
    this.isEnableDragCanvasBySpace = false;
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
