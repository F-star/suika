import { cloneDeep } from '@suika/common';

import { AddGraphCmd } from '../commands';
import { type SuikaEditor } from '../editor';
import { SuikaPath } from '../graphics';

/** Offsets the selected graphics and records adding the resulting path. */
export const offsetPathAndRecord = (
  editor: SuikaEditor,
  distance: number,
): boolean => {
  const selectedGraphics = editor.selectedElements.getItems()[0];
  if (!selectedGraphics?.isSupportOffsetPath()) return false;

  const offsetPathCmds = editor.pathTool.offsetPath(
    selectedGraphics.toWorldPathCmds(),
    distance,
  );

  if (!offsetPathCmds?.length) return false;

  const pathData = editor.pathTool.pathCmdsToPathData(offsetPathCmds);
  if (!pathData?.length) return false;

  const {
    id: _id,
    parentIndex: _parentIndex,
    ...attrs
  } = selectedGraphics.attrs;

  const recomputedAttrs = SuikaPath.recomputeAttrs(
    pathData,
    [1, 0, 0, 1, 0, 0],
  );

  const path = new SuikaPath(
    {
      ...cloneDeep(attrs),
      objectName: `${selectedGraphics.attrs.objectName} offset`,
      transform: [1, 0, 0, 1, recomputedAttrs.x, recomputedAttrs.y],
      ...recomputedAttrs,
    },
    { doc: editor.doc },
  );

  const canvas = editor.doc.getCurrentCanvas();
  editor.sceneGraph.addItems([path]);
  canvas.insertChild(path);
  editor.selectedElements.setItems([path]);
  editor.commandManager.pushCommand(
    new AddGraphCmd('Offset vector', editor, [path]),
  );
  editor.render();

  return true;
};
