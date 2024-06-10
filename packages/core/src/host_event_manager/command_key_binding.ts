import { ArrangeType } from '../commands/arrange';
import { type Editor } from '../editor';
import {
  isGroupGraphics,
  type SuikaGraphics,
  SuikaPath,
  SuikaText,
} from '../graphs';
import { arrangeAndRecord, MutateGraphsAndRecord } from '../service';
import { groupAndRecord } from '../service/group_and_record';

export class CommandKeyBinding {
  private isBound = false;

  constructor(private editor: Editor) {}

  bindKey() {
    if (this.isBound) {
      console.warn('CommandKeyBinding has been bound, please destroy it first');
      return;
    }
    this.isBound = true;
    const editor = this.editor;

    // undo
    const undoAction = () => editor.commandManager.undo();
    editor.keybindingManager.register({
      key: { metaKey: true, keyCode: 'KeyZ' },
      winKey: { ctrlKey: true, keyCode: 'KeyZ' },
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Undo',
      action: undoAction,
    });

    // redo
    const redoAction = () => editor.commandManager.redo();
    editor.keybindingManager.register({
      key: { metaKey: true, shiftKey: true, keyCode: 'KeyZ' },
      winKey: { ctrlKey: true, shiftKey: true, keyCode: 'KeyZ' },
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Redo',
      action: redoAction,
    });

    // delete
    const deleteAction = () => {
      // TODO: 一些情况要考虑是否允许删除操作，以及允许删除的处理方案
      // 绘制图形中、对图形旋转或缩放时
      if (editor.hostEventManager.isEnableDelete) {
        editor.selectedElements.removeFromScene();
      }
    };
    editor.keybindingManager.register({
      key: [{ keyCode: 'Backspace' }, { keyCode: 'Delete' }],
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Delete',
      action: deleteAction,
    });

    // select all
    const selectAllAction = () => {
      editor.selectedElements.selectAll();
      editor.render();
    };
    editor.keybindingManager.register({
      key: { metaKey: true, keyCode: 'KeyA' },
      winKey: { ctrlKey: true, keyCode: 'KeyA' },
      actionName: 'Select All',
      action: selectAllAction,
    });

    // switch to default select tool
    // or cancel select(when in select tool)
    const setDefaultToolOrCancelSelectAction = () => {
      if (this.editor.toolManager.getActiveToolName() === 'select') {
        editor.selectedElements.clear();
      } else {
        this.editor.toolManager.setActiveTool('select');
      }
      editor.render();
    };
    editor.keybindingManager.register({
      key: { keyCode: 'Escape' },
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Back to Select Tool or Cancel Select',
      action: setDefaultToolOrCancelSelectAction,
    });

    /********** Ruler **********/
    // toggle ruler
    const toggleRulersAction = () => {
      editor.setting.set('enableRuler', !editor.setting.get('enableRuler'));
      editor.render();
    };
    editor.keybindingManager.register({
      key: { shiftKey: true, keyCode: 'KeyR' },
      actionName: 'Toggle Rulers',
      action: toggleRulersAction,
    });

    /*************** Zoom **************/
    // zoom to fix
    const zoomToFitAction = () => {
      editor.zoomManager.zoomToFit();
      editor.render();
    };
    editor.keybindingManager.register({
      key: { shiftKey: true, keyCode: 'Digit1' },
      actionName: 'Zoom To Fit',
      action: zoomToFitAction,
    });

    // zoom to selection
    const zoomToSelectionAction = () => {
      editor.zoomManager.zoomToSelection();
      editor.render();
    };
    editor.keybindingManager.register({
      key: { shiftKey: true, keyCode: 'Digit2' },
      actionName: 'Zoom To Selection',
      action: zoomToSelectionAction,
    });

    // zoom in
    const zoomInAction = () => {
      editor.zoomManager.zoomIn({ enableLevel: true });
      editor.render();
    };
    editor.keybindingManager.register({
      key: { metaKey: true, keyCode: 'Equal' },
      winKey: { ctrlKey: true, keyCode: 'Equal' },
      actionName: 'Zoom In',
      action: zoomInAction,
    });

    // zoom out
    const zoomOutAction = () => {
      editor.zoomManager.zoomOut({ enableLevel: true });
      editor.render();
    };
    editor.keybindingManager.register({
      key: { metaKey: true, keyCode: 'Minus' },
      winKey: { ctrlKey: true, keyCode: 'Minus' },
      actionName: 'Zoom Out',
      action: zoomOutAction,
    });

    // zoom to 100%
    const zoomTo100 = () => {
      editor.zoomManager.setZoomAndUpdateViewport(1);
      editor.render();
    };
    editor.keybindingManager.register({
      key: [
        { metaKey: true, keyCode: 'Digit0' },
        { shiftKey: true, keyCode: 'Digit0' },
      ],
      winKey: [
        { ctrlKey: true, keyCode: 'Digit0' },
        { shiftKey: true, keyCode: 'Digit0' },
      ],
      actionName: 'Zoom To 100%',
      action: zoomTo100,
    });

    /*************** Grid **************/
    // toggle grid
    const toggleGridAction = () => {
      editor.setting.set(
        'enablePixelGrid',
        !editor.setting.get('enablePixelGrid'),
      );
      editor.render();
    };
    editor.keybindingManager.register({
      key: { metaKey: true, keyCode: 'Quote' },
      winKey: { ctrlKey: true, keyCode: 'Quote' },
      actionName: 'Toggle Grid',
      action: toggleGridAction,
    });

    // snap to grid
    const snapToGridAction = () => {
      editor.setting.set('snapToGrid', !editor.setting.get('snapToGrid'));
      editor.render();
    };
    editor.keybindingManager.register({
      key: { shiftKey: true, metaKey: true, keyCode: 'Quote' },
      winKey: { shiftKey: true, ctrlKey: true, keyCode: 'Quote' },
      actionName: 'Snap To Grid',
      action: snapToGridAction,
    });

    /********** Arrange *******/
    // front
    const frontAction = () => {
      arrangeAndRecord(editor, ArrangeType.Front);
      editor.render();
    };
    editor.keybindingManager.register({
      key: { keyCode: 'BracketRight' },
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Front',
      action: frontAction,
    });

    // back
    const backAction = () => {
      arrangeAndRecord(editor, ArrangeType.Back);
      editor.render();
    };
    editor.keybindingManager.register({
      key: { keyCode: 'BracketLeft' },
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Back',
      action: backAction,
    });

    // forward
    const forwardAction = () => {
      arrangeAndRecord(editor, ArrangeType.Forward);
      editor.render();
    };
    editor.keybindingManager.register({
      key: { metaKey: true, keyCode: 'BracketRight' },
      winKey: { ctrlKey: true, keyCode: 'BracketRight' },
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Forward',
      action: forwardAction,
    });

    // backward
    const backwardAction = () => {
      arrangeAndRecord(editor, ArrangeType.Backward);
      editor.render();
    };
    editor.keybindingManager.register({
      key: { metaKey: true, keyCode: 'BracketLeft' },
      winKey: { ctrlKey: true, keyCode: 'BracketLeft' },
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Backward',
      action: backwardAction,
    });

    /*************** group **************/
    // group
    const groupAction = () => {
      // editor.selectedElements.group();
      groupAndRecord(this.editor.selectedElements.getItems(), editor);
      editor.render();
    };
    editor.keybindingManager.register({
      key: { metaKey: true, keyCode: 'KeyG' },
      winKey: { ctrlKey: true, keyCode: 'KeyG' },
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Group',
      action: groupAction,
    });

    /******* show/hide *****/
    const showOrHideAction = () => {
      MutateGraphsAndRecord.toggleVisible(
        editor,
        editor.selectedElements.getItems(),
      );
      editor.render();
    };
    editor.keybindingManager.register({
      key: { metaKey: true, shiftKey: true, keyCode: 'KeyH' },
      winKey: { ctrlKey: true, shiftKey: true, keyCode: 'KeyH' },
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Show/Hide',
      action: showOrHideAction,
    });

    /******* lock/unlock *****/
    const lockOrUnlockAction = () => {
      MutateGraphsAndRecord.toggleLock(
        editor,
        editor.selectedElements.getItems(),
      );
      editor.render();
    };
    editor.keybindingManager.register({
      key: { metaKey: true, shiftKey: true, keyCode: 'KeyL' },
      winKey: { ctrlKey: true, shiftKey: true, keyCode: 'KeyL' },
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Lock/Unlock',
      action: lockOrUnlockAction,
    });

    /******** enter path edit *******/
    const enterGraphicsEditWithGroup = () => {
      const items = editor.selectedElements.getItems();
      const newItems: SuikaGraphics[] = [];
      let hasGroup = false;
      for (const item of items) {
        if (isGroupGraphics(item)) {
          newItems.push(...item.getChildren());
          hasGroup = true;
        } else {
          newItems.push(item);
        }
      }
      if (hasGroup) {
        editor.selectedElements.setItems(newItems);
        editor.render();
      }
    };
    const enterGraphicsEdit = () => {
      const selectedCount = editor.selectedElements.size();
      if (editor.pathEditor.isActive() || selectedCount === 0) return;

      if (selectedCount === 1) {
        const graphics = editor.selectedElements.getItems()[0];
        if (graphics instanceof SuikaPath) {
          editor.pathEditor.active(graphics);
        } else if (graphics instanceof SuikaText) {
          editor.textEditor.active({ textGraph: graphics });
        } else if (isGroupGraphics(graphics)) {
          enterGraphicsEditWithGroup();
        }
      } else {
        // 如果有 group，取消 group 的选中，改为选中其下的 children
        enterGraphicsEditWithGroup();
      }
    };
    editor.keybindingManager.register({
      key: { keyCode: 'Enter' },
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'EnterGraphEdit',
      action: enterGraphicsEdit,
    });
  }

  destroy() {
    this.isBound = false;
    //  KeyBindingManager will destroy all keybindings when editor destroy
  }
}
