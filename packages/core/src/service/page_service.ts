import { SwitchCurrentCanvasCmd } from '../commands';
import { type SuikaEditor } from '../editor';
import { SuikaCanvas } from '../graphics';
import { Transaction } from '../transaction';
import { getNoConflictObjectName } from '../utils';

export const addAndSwitchCanvasRecord = (
  editor: SuikaEditor,
  canvasName: string | undefined,
) => {
  editor.commandManager.batchCommandStart();
  const canvas = addCanvasAndRecord(editor, canvasName);
  switchCanvasRecord(editor, canvas.attrs.id);
  editor.commandManager.batchCommandEnd();
};

export const addCanvasAndRecord = (
  editor: SuikaEditor,
  canvasName: string | undefined,
) => {
  if (!canvasName) {
    canvasName = getNoConflictObjectName(editor.doc, 'Page');
  }
  const canvas = new SuikaCanvas(
    {
      objectName: canvasName,
    },
    {
      doc: editor.doc,
    },
  );
  editor.sceneGraph.addItems([canvas]);

  // TODO: insert after current canvas
  editor.doc.insertChild(canvas);

  const transaction = new Transaction(editor);
  transaction.addNewIds([canvas.attrs.id]);
  transaction.commit('Add Canvas');
  return canvas;
};

export const switchCanvasRecord = (editor: SuikaEditor, canvasId: string) => {
  const prevId = editor.doc.getCurrentCanvas().attrs.id;
  if (prevId === canvasId) {
    console.log('Same canvas, switch canvas failed');
    return;
  }
  editor.doc.setCurrentCanvas(canvasId);
  const updateCurrentCanvasCmd = new SwitchCurrentCanvasCmd(
    'Update Current Canvas',
    editor,
    {
      id: canvasId,
      prevId,
    },
  );
  editor.commandManager.pushCommand(updateCurrentCanvasCmd);
};
