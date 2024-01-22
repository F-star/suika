import { ArrangeType } from '../commands/arrange';
import { Editor } from '../editor';
import { arrangeAndRecord, MutateGraphsAndRecord } from '../service';

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
      editor.sceneGraph.render();
    };
    editor.keybindingManager.register({
      key: { metaKey: true, keyCode: 'KeyA' },
      winKey: { ctrlKey: true, keyCode: 'KeyA' },
      actionName: 'Select All',
      action: selectAllAction,
    });

    // cancel select
    const cancelSelectAction = () => {
      editor.selectedElements.clear();
      editor.sceneGraph.render();
    };
    editor.keybindingManager.register({
      key: { keyCode: 'Escape' },
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Cancel Select',
      action: cancelSelectAction,
    });

    /********** Ruler **********/
    // toggle ruler
    const toggleRulersAction = () => {
      editor.setting.set('enableRuler', !editor.setting.get('enableRuler'));
      editor.sceneGraph.render();
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
      editor.sceneGraph.render();
    };
    editor.keybindingManager.register({
      key: { shiftKey: true, keyCode: 'Digit1' },
      actionName: 'Zoom To Fit',
      action: zoomToFitAction,
    });

    // zoom to selection
    const zoomToSelectionAction = () => {
      editor.zoomManager.zoomToSelection();
      editor.sceneGraph.render();
    };
    editor.keybindingManager.register({
      key: { shiftKey: true, keyCode: 'Digit2' },
      actionName: 'Zoom To Selection',
      action: zoomToSelectionAction,
    });

    // zoom in
    const zoomInAction = () => {
      editor.zoomManager.zoomIn();
      editor.sceneGraph.render();
    };
    editor.keybindingManager.register({
      key: { metaKey: true, keyCode: 'Equal' },
      winKey: { ctrlKey: true, keyCode: 'Equal' },
      actionName: 'Zoom In',
      action: zoomInAction,
    });

    // zoom out
    const zoomOutAction = () => {
      editor.zoomManager.zoomOut();
      editor.sceneGraph.render();
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
      editor.sceneGraph.render();
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
      editor.sceneGraph.render();
    };
    editor.keybindingManager.register({
      key: { metaKey: true, keyCode: 'Quote' },
      winKey: { ctrlKey: true, keyCode: 'Quote' },
      actionName: 'Toggle Grid',
      action: toggleGridAction,
    });

    // snap to grid
    const snapToGridAction = () => {
      editor.setting.set(
        'snapToPixelGrid',
        !editor.setting.get('snapToPixelGrid'),
      );
      editor.sceneGraph.render();
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
      editor.sceneGraph.render();
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
      editor.sceneGraph.render();
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
      editor.sceneGraph.render();
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
      editor.sceneGraph.render();
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
      editor.selectedElements.group();
      editor.sceneGraph.render();
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
      editor.sceneGraph.render();
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
      editor.sceneGraph.render();
    };
    editor.keybindingManager.register({
      key: { metaKey: true, shiftKey: true, keyCode: 'KeyL' },
      winKey: { ctrlKey: true, shiftKey: true, keyCode: 'KeyL' },
      when: (ctx) => !ctx.isToolDragging,
      actionName: 'Lock/Unlock',
      action: lockOrUnlockAction,
    });
  }

  destroy() {
    this.isBound = false;
    //  KeyBindingManager will destroy all keybindings when editor destroy
  }
}
