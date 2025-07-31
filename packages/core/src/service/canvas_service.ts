import { SwitchCurrentCanvasCmd } from '../commands';
import { SuikaEditor } from '../editor';
import { SuikaCanvas } from '../graphics/canvas';
import { Transaction } from '../transaction';

export const addAndSwitchCanvasRecord = (
  editor: SuikaEditor,
  canvasName: string,
) => {
  editor.commandManager.batchCommandStart();
  const canvas = addCanvasAndRecord(editor, canvasName);
  switchCanvasRecord(editor, canvas.attrs.id);
  editor.commandManager.batchCommandEnd();
};

export const addCanvasAndRecord = (editor: SuikaEditor, canvasName: string) => {
  const canvas = new SuikaCanvas(
    {
      objectName: canvasName,
    },
    {
      doc: editor.doc,
    },
  );
  editor.sceneGraph.addItems([canvas]);
  editor.doc.insertChild(canvas);

  const transaction = new Transaction(editor);
  transaction.addNewIds([canvas.attrs.id]);
  transaction.commit('Add Canvas');
  return canvas;
};

export const switchCanvasRecord = (editor: SuikaEditor, canvasId: string) => {
  const prevId = editor.doc.getCurrentCanvas().attrs.id;
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
