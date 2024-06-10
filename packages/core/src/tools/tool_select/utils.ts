import { type IBox, type IPoint, rectToBox } from '@suika/geo';

import { type Editor } from '../../editor';
import {
  type GraphicsAttrs,
  isGroupGraphics,
  SuikaFrame,
  type SuikaGraphics,
} from '../../graphs';

/********* get top hit element ********/
export const getTopHitElement = (
  editor: Editor,
  pt: IPoint,
): SuikaGraphics | null => {
  const padding =
    editor.setting.get('selectionHitPadding') / editor.zoomManager.getZoom();
  const canvasGraphics = editor.doc.getCurrCanvas();
  const parentIdSet = editor.selectedElements.getParentIdSet();

  return getTopHitElementDFS(pt, padding, canvasGraphics, parentIdSet);
};

const getTopHitElementDFS = (
  pt: IPoint,
  padding: number,
  parent: SuikaGraphics,
  parentIdSet: Set<string>,
): SuikaGraphics | null => {
  const children = parent.getChildren();
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];
    if (!child.isVisible() || child.isLock()) {
      continue;
    }
    if (child.hitTest(pt.x, pt.y, padding)) {
      if (child instanceof SuikaFrame) {
        const target = getTopHitElementDFS(pt, padding, child, parentIdSet);
        if (target) {
          const parent = target.getParent();
          // 找到最近的一个 parent
          if (parent && !parentIdSet.has(parent.attrs.id)) {
            return parent;
          }
          return target;
        }
      } else {
        return child;
      }
    }
  }
  return null;
};

/****** get elements in selection ******/
export const getElementsInSelection = (
  editor: Editor,
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
  editor: Editor,
  box: IBox,
  node: SuikaGraphics,
  parentIdSet: Set<string>,
): SuikaGraphics[] => {
  const graphicsArr: SuikaGraphics[] = [];
  const children = node.getChildren();
  for (const child of children) {
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

// 修正父节点的 width/height/transform
export const updateParentSize = (
  editor: Editor,
  parentIdSet: Set<string>,
  originAttrsMap: Map<string, Partial<GraphicsAttrs>>,
  updatedAttrsMap: Map<string, Partial<GraphicsAttrs>>,
) => {
  parentIdSet.forEach((id) => {
    const node = editor.doc.getGraphicsById(id);
    if (node && isGroupGraphics(node) && !node.isEmpty()) {
      node.updateSizeByChildren(originAttrsMap, updatedAttrsMap);
    }
  });
};
