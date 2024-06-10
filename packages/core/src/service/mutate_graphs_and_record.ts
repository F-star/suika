import { cloneDeep } from '@suika/common';
import { type IMatrixArr, invertMatrix, multiplyMatrix } from '@suika/geo';

import { SetGraphsAttrsCmd } from '../commands/set_elements_attrs';
import { type Editor } from '../editor';
import { type SuikaGraphics, type SuikaRect } from '../graphs';
import { type SuikaRegularPolygon } from '../graphs/regular_polygon';
import { type SuikaStar } from '../graphs/star';
import { GraphicsType } from '../type';

/**
 * mutate elements and record to history
 */
export const MutateGraphsAndRecord = {
  setX(editor: Editor, elements: SuikaGraphics[], newX: number) {
    if (elements.length === 0) {
      return;
    }

    const prevAttrs: { transform: IMatrixArr }[] = new Array(elements.length);
    for (let i = 0, len = elements.length; i < len; i++) {
      const el = elements[i];
      prevAttrs[i] = { transform: cloneDeep(el.attrs.transform) };
      const parentInvertTf = invertMatrix(el.getParentWorldTransform());

      const tf = el.getWorldTransform();
      tf[4] = newX;
      el.updateAttrs({
        transform: multiplyMatrix(parentInvertTf, tf),
      });
    }
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'Update X of Elements',
        elements,
        elements.map((el) => ({ transform: el.attrs.transform })),
        prevAttrs,
      ),
    );
  },
  setY(editor: Editor, elements: SuikaGraphics[], newY: number) {
    if (elements.length === 0) {
      return;
    }

    const prevAttrs: { transform: IMatrixArr }[] = new Array(elements.length);
    for (let i = 0, len = elements.length; i < len; i++) {
      const el = elements[i];
      prevAttrs[i] = { transform: cloneDeep(el.attrs.transform) };
      const parentInvertTf = invertMatrix(el.getParentWorldTransform());

      const tf = el.getWorldTransform();
      tf[5] = newY;
      el.updateAttrs({
        transform: multiplyMatrix(parentInvertTf, tf),
      });
    }
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'Update Y of Elements',
        elements,
        elements.map((el) => ({ transform: el.attrs.transform })),
        prevAttrs,
      ),
    );
  },
  setWidth(editor: Editor, graphs: SuikaGraphics[], width: number) {
    if (graphs.length === 0) {
      return;
    }

    const prevAttrs = graphs.map((el) => ({
      width: el.attrs.width,
    }));
    graphs.forEach((graph) => {
      graph.updateAttrs({ width });
    });
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'Update Width of Elements',
        graphs,
        graphs.map((item) => ({
          width: item.attrs.width,
        })),
        prevAttrs,
      ),
    );
  },
  setHeight(editor: Editor, graphs: SuikaGraphics[], height: number) {
    if (graphs.length === 0) {
      return;
    }

    const prevAttrs = graphs.map((el) => ({
      height: el.attrs.height,
    }));
    graphs.forEach((graph) => {
      graph.updateAttrs({
        height,
      });
    });
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update Height of Elements',
        graphs,
        graphs.map((el) => ({
          height: el.attrs.height,
        })),
        prevAttrs,
      ),
    );
  },
  setRotation(editor: Editor, elements: SuikaGraphics[], rotation: number) {
    if (elements.length === 0) {
      return;
    }

    const prevAttrs = elements.map((el) => ({
      rotation: el.getRotate(),
    }));
    elements.forEach((el) => {
      el.setRotate(rotation);
    });
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update Rotation',
        elements,
        { rotation },
        prevAttrs,
      ),
    );
  },
  setCornerRadius(
    editor: Editor,
    elements: SuikaGraphics[],
    cornerRadius: number,
  ) {
    if (elements.length === 0) {
      return;
    }

    const rectGraphics = elements.filter(
      (el) => el.type === GraphicsType.Rect,
    ) as SuikaRect[];

    const prevAttrs = rectGraphics.map((el) => ({
      cornerRadius: el.attrs.cornerRadius || 0,
    }));
    rectGraphics.forEach((el) => {
      el.attrs.cornerRadius = cornerRadius;
    });
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update Corner Radius',
        rectGraphics,
        { cornerRadius },
        prevAttrs,
      ),
    );
  },

  setCount(editor: Editor, elements: SuikaGraphics[], count: number) {
    if (elements.length === 0) {
      return;
    }

    const rectGraphics = elements.filter(
      (el) =>
        el.type === GraphicsType.RegularPolygon ||
        el.type === GraphicsType.Star,
    ) as SuikaRegularPolygon[];

    const prevAttrs = rectGraphics.map((el) => ({
      count: el.attrs.count,
    }));
    rectGraphics.forEach((el) => {
      el.updateAttrs({
        count,
      });
    });
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update Count',
        rectGraphics,
        { count: count },
        prevAttrs,
      ),
    );
  },

  setStarInnerScale(editor: Editor, elements: SuikaGraphics[], val: number) {
    if (elements.length === 0) {
      return;
    }

    const rectGraphics = elements.filter(
      (el) => el.type === GraphicsType.Star,
    ) as SuikaStar[];

    const prevAttrs = rectGraphics.map((el) => ({
      starInnerScale: el.attrs.starInnerScale,
    }));
    rectGraphics.forEach((el) => {
      el.updateAttrs({
        starInnerScale: val,
      });
    });
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update Star InnerScale',
        rectGraphics,
        { count: val },
        prevAttrs,
      ),
    );
  },

  /**
   * show graphs when at least one graph is hidden
   * and
   * hide graphs when all graphs are shown
   */
  toggleVisible(editor: Editor, graphs: SuikaGraphics[]) {
    if (graphs.length === 0) {
      return;
    }

    // if at least one graph is hidden, show all graphs; otherwise, hide all graphs
    const newVisible = graphs.some((item) => !item.isVisible());
    const prevAttrs = graphs.map((el) => ({ visible: el.attrs.visible }));
    graphs.forEach((el) => {
      el.attrs.visible = newVisible;
    });
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update visible of graphs',
        graphs,
        { visible: newVisible },
        prevAttrs,
      ),
    );
  },
  /**
   * lock / unlock
   */
  toggleLock(editor: Editor, graphs: SuikaGraphics[]) {
    if (graphs.length === 0) {
      return;
    }

    // if at least one graph is unlocked, lock all graphs; otherwise, unlock all graphs
    const newLock = graphs.some((item) => !item.isLock());
    const prevAttrs = graphs.map((el) => ({ lock: el.attrs.lock }));
    graphs.forEach((el) => {
      el.attrs.lock = newLock;
    });
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update lock of graphs',
        graphs,
        { lock: newLock },
        prevAttrs,
      ),
    );
  },

  /** set name of graph */
  setGraphName(editor: Editor, graph: SuikaGraphics, objectName: string) {
    const prevAttrs = [{ objectName: graph.attrs.objectName }];
    graph.attrs.objectName = objectName;
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update name of graph',
        [graph],
        { objectName },
        prevAttrs,
      ),
    );
  },
};
