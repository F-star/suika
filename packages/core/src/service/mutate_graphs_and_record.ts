import { cloneDeep } from '@suika/common';

import { SetGraphsAttrsCmd } from '../commands/set_elements_attrs';
import { type SuikaEditor } from '../editor';
import { type SuikaGraphics, type SuikaRect } from '../graphs';
import { type SuikaRegularPolygon } from '../graphs/regular_polygon';
import { type SuikaStar } from '../graphs/star';
import { Transaction } from '../transaction';
import { GraphicsType } from '../type';

/**
 * mutate elements and record to history
 */
export const MutateGraphsAndRecord = {
  setX(editor: SuikaEditor, graphicsArr: SuikaGraphics[], val: number) {
    if (graphicsArr.length === 0) {
      return;
    }

    const transaction = new Transaction(editor);

    for (const graphics of graphicsArr) {
      transaction.recordOld(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });

      const tf = graphics.getWorldTransform();
      tf[4] = val;

      graphics.setWorldTransform(tf);
      transaction.update(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });
    }

    transaction.updateParentSize(graphicsArr);
    transaction.commit('Update X of Elements');
  },
  setY(editor: SuikaEditor, graphicsArr: SuikaGraphics[], val: number) {
    if (graphicsArr.length === 0) {
      return;
    }

    const transaction = new Transaction(editor);

    for (const graphics of graphicsArr) {
      transaction.recordOld(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });

      const tf = graphics.getWorldTransform();
      tf[5] = val;

      graphics.setWorldTransform(tf);
      transaction.update(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });
    }

    transaction.updateParentSize(graphicsArr);
    transaction.commit('Update Y of Elements');
  },
  setWidth(editor: SuikaEditor, graphicsArr: SuikaGraphics[], val: number) {
    if (graphicsArr.length === 0) {
      return;
    }

    const transaction = new Transaction(editor);
    for (const graphics of graphicsArr) {
      transaction.recordOld(graphics.attrs.id, { width: graphics.attrs.width });
      graphics.updateAttrs({ width: val });
      transaction.update(graphics.attrs.id, { width: graphics.attrs.width });
    }

    transaction.updateParentSize(graphicsArr);
    // FIXME: update children
    transaction.commit('Update Width of Elements');
  },
  setHeight(editor: SuikaEditor, graphicsArr: SuikaGraphics[], val: number) {
    if (graphicsArr.length === 0) {
      return;
    }

    const transaction = new Transaction(editor);
    for (const graphics of graphicsArr) {
      transaction.recordOld(graphics.attrs.id, {
        height: graphics.attrs.height,
      });
      graphics.updateAttrs({ height: val });
      transaction.update(graphics.attrs.id, { height: graphics.attrs.height });
    }

    transaction.updateParentSize(graphicsArr);
    // FIXME: update children
    transaction.commit('Update Height of Elements');
  },
  setRotation(
    editor: SuikaEditor,
    graphicsArr: SuikaGraphics[],
    rotation: number,
  ) {
    if (graphicsArr.length === 0) {
      return;
    }

    const transaction = new Transaction(editor);

    for (const graphics of graphicsArr) {
      transaction.recordOld(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });
      graphics.setRotate(rotation);
      transaction.update(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });
    }

    transaction.updateParentSize(graphicsArr);
    transaction.commit('Update Rotation');
  },
  setCornerRadius(
    editor: SuikaEditor,
    graphicsArr: SuikaGraphics[],
    cornerRadius: number,
  ) {
    if (graphicsArr.length === 0) {
      return;
    }

    const rectGraphics = graphicsArr.filter(
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

  setCount(editor: SuikaEditor, elements: SuikaGraphics[], count: number) {
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

  setStarInnerScale(
    editor: SuikaEditor,
    elements: SuikaGraphics[],
    val: number,
  ) {
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
  toggleVisible(editor: SuikaEditor, graphicsArr: SuikaGraphics[]) {
    if (graphicsArr.length === 0) {
      return;
    }
    // if at least one graph is hidden, show all graphs; otherwise, hide all graphs
    const newVal = graphicsArr.some((item) => !item.isVisible());

    const transaction = new Transaction(editor);

    for (const graphics of graphicsArr) {
      transaction.recordOld(graphics.attrs.id, {
        visible: graphics.attrs.visible,
      });
      graphics.updateAttrs({
        visible: newVal,
      });
      transaction.update(graphics.attrs.id, { visible: newVal });
    }

    transaction.updateParentSize(graphicsArr);
    transaction.commit('update visible of graphs');
  },
  /**
   * lock / unlock
   */
  toggleLock(editor: SuikaEditor, graphicsArr: SuikaGraphics[]) {
    if (graphicsArr.length === 0) {
      return;
    }

    // if at least one graph is unlocked, lock all graphs; otherwise, unlock all graphs
    const newLock = graphicsArr.some((item) => !item.isLock());
    const prevAttrs = graphicsArr.map((el) => ({ lock: el.attrs.lock }));
    graphicsArr.forEach((el) => {
      el.updateAttrs({
        lock: newLock,
      });
    });
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update lock of graphs',
        graphicsArr,
        { lock: newLock },
        prevAttrs,
      ),
    );
  },

  /** set name of graph */
  setGraphName(
    editor: SuikaEditor,
    graphics: SuikaGraphics,
    objectName: string,
  ) {
    const prevAttrs = [{ objectName: graphics.attrs.objectName }];
    graphics.updateAttrs({
      objectName,
    });
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update name of graph',
        [graphics],
        { objectName },
        prevAttrs,
      ),
    );
  },
};
