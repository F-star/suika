import { ArrangeCmd, type ArrangeType } from '../commands/arrange';
import { type Editor } from '../editor';

export const arrangeAndRecord = (editor: Editor, type: ArrangeType) => {
  if (editor.selectedElements.size() === 0) {
    console.warn("can't arrange, no element");
  }

  const items = editor.selectedElements.getItems();
  if (
    ArrangeCmd.shouldExecCmd(type, editor.sceneGraph.children, new Set(items))
  ) {
    editor.commandManager.pushCommand(
      new ArrangeCmd('Arrange ' + type, editor, items, type),
    );
  }
  editor.render();
};
