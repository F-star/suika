import debounce from 'lodash.debounce';
import { SetElementsAttrs } from '../commands/set_elements_attrs';
import { arrMap } from '../../utils/array_util';
import { Editor } from '../editor';
import { Graph } from '../scene/graph';
import { IPoint } from '../../type';
import { noop } from '../../utils/common';

/**
 * move graphs by arrow key binding
 */
export class MoveGraphsKeyBinding {
  private unbindHandler = noop;
  private hadBound = false;

  constructor(private editor: Editor) {}

  bindKey() {
    if (this.hadBound) {
      console.warn(
        'MoveGraphsKeyBinding had already bound, please unbind first',
      );
      return;
    }
    this.hadBound = true;

    const editor = this.editor;
    let startPoints: IPoint[] = [];
    let isEnableUpdateStartPoints = true;

    const recordDebounce = debounce((moveEls: Graph[]) => {
      this.editor.controlHandleManager.showCustomHandles();
      isEnableUpdateStartPoints = true;
      this.editor.commandManager.enableRedoUndo();
      editor.commandManager.pushCommand(
        new SetElementsAttrs(
          'Move elements',
          moveEls,
          arrMap(moveEls, ({ x, y }) => ({ x, y })),
          startPoints,
        ),
      );
    }, editor.setting.get('moveElementsDelay'));

    const flushRecordDebounce = () => {
      recordDebounce.flush();
    };

    const pressed = {
      ArrowLeft: false,
      ArrowRight: false,
      ArrowUp: false,
      ArrowDown: false,
    };

    const checkPressed = () =>
      pressed.ArrowLeft ||
      pressed.ArrowRight ||
      pressed.ArrowUp ||
      pressed.ArrowDown;

    const handleKeydown = (event: KeyboardEvent) => {
      const movedEls = editor.selectedElements.getItems();
      if (movedEls.length === 0) return;

      if (event.key in pressed) {
        pressed[event.key as keyof typeof pressed] = true;
      }
      if (!checkPressed()) return;

      if (isEnableUpdateStartPoints) {
        startPoints = arrMap(movedEls, (el) => ({ x: el.x, y: el.y }));
        isEnableUpdateStartPoints = false;
      }

      let nudge = editor.setting.get('smallNudge');
      if (event.shiftKey) nudge = editor.setting.get('bigNudge');

      if (pressed.ArrowLeft) {
        editor.moveElements(movedEls, -nudge, 0);
      }
      if (pressed.ArrowRight) {
        editor.moveElements(movedEls, nudge, 0);
      }
      if (pressed.ArrowUp) {
        editor.moveElements(movedEls, 0, -nudge);
      }
      if (pressed.ArrowDown) {
        editor.moveElements(movedEls, 0, nudge);
      }

      this.editor.commandManager.disableRedoUndo();
      this.editor.controlHandleManager.hideCustomHandles();
      recordDebounce(movedEls);
      editor.sceneGraph.render();
    };

    const handleKeyup = (e: KeyboardEvent) => {
      const key = e.key;
      if (key in pressed) {
        pressed[key as keyof typeof pressed] = false;
      }
    };

    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

    this.editor.keybindingManager.register({
      key: [
        ...keys.map((keyCode) => ({ keyCode })),
        ...keys.map((keyCode) => ({ shiftKey: true, keyCode })),
      ],
      actionName: 'Move Elements',
      action: handleKeydown,
    });

    window.addEventListener('keyup', handleKeyup);
    editor.commandManager.on('beforeExecCmd', flushRecordDebounce);

    this.unbindHandler = () => {
      window.removeEventListener('keyup', handleKeyup);
      editor.commandManager.off('beforeExecCmd', flushRecordDebounce);
    };
  }

  destroy() {
    this.unbindHandler();
    this.hadBound = false;
  }
}
