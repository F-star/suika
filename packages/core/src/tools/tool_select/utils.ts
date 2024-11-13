import { type IBox, type IPoint, rectToBox } from '@suika/geo';

import { type SuikaEditor } from '../../editor';
import { type IHitOptions, type SuikaGraphics } from '../../graphics';

/********* get top hit element ********/
export const getTopHitElement = (
  editor: SuikaEditor,
  point: IPoint,
): SuikaGraphics | null => {
  const zoom = editor.zoomManager.getZoom();
  const tol = editor.setting.get('selectionHitPadding') / zoom;
  const canvasGraphics = editor.doc.getCurrCanvas();
  const parentIdSet = editor.selectedElements.getParentIdSet();

  const hitOptions: IHitOptions = {
    tol,
    parentIdSet,
    zoom,
  };

  return canvasGraphics.getHitGraphics(point, hitOptions);
};

/****** get elements in selection ******/
export const getElementsInSelection = (
  editor: SuikaEditor,
  parentIdSet: Set<string> = new Set(),
): SuikaGraphics[] => {
  const selection = editor.sceneGraph.selection;
  if (selection === null) {
    console.warn('selection 为 null，请确认在正确的时机调用当前方法');
    return [];
  }
  const selectionBox = rectToBox(selection);

  const graphicsArr = getElementsInSelectionDFS(
    editor,
    selectionBox,
    editor.doc.getCurrCanvas(),
    parentIdSet,
  );

  return graphicsArr;
};

const getElementsInSelectionDFS = (
  editor: SuikaEditor,
  box: IBox,
  node: SuikaGraphics,
  parentIdSet: Set<string>,
): SuikaGraphics[] => {
  const graphicsArr: SuikaGraphics[] = [];
  const children = node.getChildren();
  for (const child of children) {
    if (!child.isVisible() || child.isLock()) continue;
    if (parentIdSet.has(child.attrs.id)) {
      graphicsArr.push(
        ...getElementsInSelectionDFS(editor, box, child, parentIdSet),
      );
    } else if (child.intersectWithChildrenBox(box)) {
      graphicsArr.push(child);
    }
  }
  return graphicsArr;
};
