import { cloneDeep } from '@suika/common';

import { AddGraphCmd } from '../commands';
import { type SuikaEditor } from '../editor';
import { type SuikaGraphics, SuikaPath } from '../graphics';
import { PaintType } from '../paint';
import { type OffsetPathJoin } from '../utils/path';

export interface OffsetPathAndRecordOptions {
  join?: OffsetPathJoin;
}

const getOffsetPathAttrs = (
  editor: SuikaEditor,
  graphics: SuikaGraphics,
  distance: number,
  options?: OffsetPathAndRecordOptions,
): ConstructorParameters<typeof SuikaPath>[0] | null => {
  const offsetPathCmds = editor.pathTool.offsetPath(
    graphics.toWorldPathCmds(),
    distance,
    options,
  );

  if (!offsetPathCmds?.length) return null;

  const pathData = editor.pathTool.pathCmdsToPathData(offsetPathCmds);
  if (!pathData?.length) return null;

  const {
    id: _id,
    parentIndex: _parentIndex,
    ...attrs
  } = cloneDeep(graphics.attrs);

  const recomputedAttrs = SuikaPath.recomputeAttrs(
    pathData,
    [1, 0, 0, 1, 0, 0],
  );

  return {
    ...cloneDeep(attrs),
    objectName: 'offset',
    transform: [1, 0, 0, 1, recomputedAttrs.x, recomputedAttrs.y],
    ...recomputedAttrs,
    fill: [],
    stroke: [
      {
        type: PaintType.Solid,
        attrs: {
          r: 0,
          g: 0,
          b: 0,
          a: 1,
        },
        visible: true,
      },
    ],
  };
};

/** Creates an offset path from the selected graphic and records it. */
export const offsetPathAndRecord = (
  editor: SuikaEditor,
  distance: number,
  options?: OffsetPathAndRecordOptions,
): SuikaPath | null => {
  const selectedGraphics = editor.selectedElements.getItems()[0];
  if (!selectedGraphics?.isSupportOffsetPath()) return null;

  const attrs = getOffsetPathAttrs(editor, selectedGraphics, distance, options);
  if (!attrs) return null;

  const path = new SuikaPath(attrs, { doc: editor.doc });

  const canvas = editor.doc.getCurrentCanvas();
  editor.sceneGraph.addItems([path]);
  canvas.insertChild(path);
  editor.selectedElements.setItems([path]);
  editor.commandManager.pushCommand(
    new AddGraphCmd('Offset vector', editor, [path]),
  );
  editor.render();

  return path;
};

/** Updates an existing offset path from its original source graphic. */
export const updateOffsetPath = (
  editor: SuikaEditor,
  source: SuikaGraphics,
  path: SuikaPath,
  distance: number,
  options?: OffsetPathAndRecordOptions,
): boolean => {
  const attrs = getOffsetPathAttrs(editor, source, distance, options);
  if (!attrs) return false;

  path.updateAttrs(
    {
      pathData: attrs.pathData,
      transform: attrs.transform,
      width: attrs.width,
      height: attrs.height,
    },
    {
      finishRecomputed: true,
    },
  );
  editor.render();
  return true;
};
