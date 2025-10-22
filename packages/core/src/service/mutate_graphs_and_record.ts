import { cloneDeep } from '@suika/common';

import { SetGraphsAttrsCmd } from '../commands/set_elements_attrs';
import { type SuikaEditor } from '../editor';
import {
  type SuikaGraphics,
  type SuikaRect,
  type SuikaRegularPolygon,
  type SuikaStar,
  SuikaText,
} from '../graphics';
import { Transaction } from '../transaction';
import { GraphicsType } from '../type';

/**
 * mutate elements and record to history
 */
export const MutateGraphsAndRecord = {
  setX({
    editor,
    graphicsArr,
    val,
    isDelta = false,
  }: {
    editor: SuikaEditor;
    graphicsArr: SuikaGraphics[];
    val: number;
    isDelta: boolean;
  }) {
    if (graphicsArr.length === 0) {
      return;
    }

    const transaction = new Transaction(editor);

    for (const graphics of graphicsArr) {
      transaction.recordOld(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });

      const tf = graphics.getWorldTransform();
      const newVal = isDelta ? tf[4] + val : val;
      tf[4] = newVal;

      graphics.setWorldTransform(tf);
      transaction.update(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });
    }

    transaction.updateParentSize(graphicsArr);
    transaction.commit('Update X of Elements');
  },
  setY({
    editor,
    graphicsArr,
    val,
    isDelta = false,
  }: {
    editor: SuikaEditor;
    graphicsArr: SuikaGraphics[];
    val: number;
    isDelta: boolean;
  }) {
    if (graphicsArr.length === 0) {
      return;
    }

    const transaction = new Transaction(editor);

    for (const graphics of graphicsArr) {
      transaction.recordOld(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });

      const tf = graphics.getWorldTransform();
      const newVal = isDelta ? tf[5] + val : val;
      tf[5] = newVal;

      graphics.setWorldTransform(tf);
      transaction.update(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });
    }

    transaction.updateParentSize(graphicsArr);
    transaction.commit('Update Y of Elements');
  },
  setWidth({
    editor,
    graphicsArr,
    val,
    isDelta = false,
  }: {
    editor: SuikaEditor;
    graphicsArr: SuikaGraphics[];
    val: number;
    isDelta: boolean;
  }) {
    let updateSuccess = false;

    if (graphicsArr.length === 0) {
      return false;
    }

    const transaction = new Transaction(editor);
    for (const graphics of graphicsArr) {
      transaction.recordOld(graphics.attrs.id, { width: graphics.attrs.width });
      let newVal = isDelta ? graphics.attrs.width + val : val;
      if (newVal <= 0) {
        newVal = 0.0000001;
      }
      if (newVal !== graphics.attrs.width) {
        updateSuccess = true;
      }
      graphics.updateAttrs({ width: newVal });
      transaction.update(graphics.attrs.id, { width: graphics.attrs.width });
    }

    if (updateSuccess) {
      transaction.updateParentSize(graphicsArr);
      // FIXME: update group children
      transaction.commit('Update Width of Elements');
    }

    return updateSuccess;
  },
  setHeight({
    editor,
    graphicsArr,
    val,
    isDelta = false,
  }: {
    editor: SuikaEditor;
    graphicsArr: SuikaGraphics[];
    val: number;
    isDelta: boolean;
  }) {
    if (graphicsArr.length === 0) {
      return false;
    }

    let updateSuccess = false;

    const transaction = new Transaction(editor);
    for (const graphics of graphicsArr) {
      transaction.recordOld(graphics.attrs.id, {
        height: graphics.attrs.height,
      });
      let newVal = isDelta ? graphics.attrs.height + val : val;
      if (newVal <= 0) {
        newVal = 0;
      }
      if (newVal !== graphics.attrs.height) {
        updateSuccess = true;
      }
      graphics.updateAttrs({ height: newVal });
      transaction.update(graphics.attrs.id, { height: graphics.attrs.height });
    }

    if (updateSuccess) {
      transaction.updateParentSize(graphicsArr);
      // FIXME: update children
      transaction.commit('Update Height of Elements');
    }

    return updateSuccess;
  },
  setRotation({
    editor,
    graphicsArr,
    rotation,
    isDelta = false,
  }: {
    editor: SuikaEditor;
    graphicsArr: SuikaGraphics[];
    rotation: number;
    isDelta: boolean;
  }) {
    if (graphicsArr.length === 0) {
      return;
    }

    const transaction = new Transaction(editor);

    for (const graphics of graphicsArr) {
      transaction.recordOld(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });
      const newVal = isDelta ? graphics.getRotate() + rotation : rotation;
      graphics.setRotate(newVal);
      transaction.update(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });
    }

    transaction.updateParentSize(graphicsArr);
    transaction.commit('Update Rotation');
  },
  setCornerRadius({
    editor,
    graphicsArr,
    val,
    isDelta = false,
  }: {
    editor: SuikaEditor;
    graphicsArr: SuikaGraphics[];
    val: number;
    isDelta: boolean;
  }) {
    if (graphicsArr.length === 0) {
      return false;
    }

    let updateSuccess = false;
    const matchGraphicsArr = graphicsArr.filter(
      (el) =>
        el.type === GraphicsType.Rect ||
        el.type === GraphicsType.RegularPolygon ||
        el.type === GraphicsType.Star,
    ) as (SuikaRect | SuikaRegularPolygon | SuikaStar)[];

    const transaction = new Transaction(editor);
    for (const graphics of matchGraphicsArr) {
      transaction.recordOld(graphics.attrs.id, {
        cornerRadius: graphics.attrs.cornerRadius,
      });
      const oldVal = graphics.attrs.cornerRadius ?? 0;
      let newVal = isDelta ? oldVal + val : val;
      if (newVal <= 0) {
        newVal = 0;
      }
      if (newVal !== oldVal) {
        updateSuccess = true;
      }
      graphics.updateAttrs({ cornerRadius: newVal });
      transaction.update(graphics.attrs.id, {
        cornerRadius: graphics.attrs.cornerRadius,
      });
    }
    if (updateSuccess) {
      transaction.commit('Update CornerRadius of Elements');
    }
    return updateSuccess;
  },

  setCount({
    editor,
    graphicsArr,
    val,
    isDelta = false,
  }: {
    editor: SuikaEditor;
    graphicsArr: SuikaGraphics[];
    val: number;
    isDelta: boolean;
  }) {
    if (graphicsArr.length === 0) {
      return;
    }
    let updateSuccess = false;

    const matchGraphicsArr = graphicsArr.filter(
      (el) =>
        el.type === GraphicsType.RegularPolygon ||
        el.type === GraphicsType.Star,
    ) as (SuikaRegularPolygon | SuikaStar)[];

    const transaction = new Transaction(editor);
    for (const graphics of matchGraphicsArr) {
      transaction.recordOld(graphics.attrs.id, {
        count: graphics.attrs.count,
      });
      const oldVal = graphics.attrs.count ?? 0;
      let newVal = isDelta ? oldVal + val : val;
      if (newVal <= 3) {
        newVal = 3;
      }
      if (newVal !== oldVal) {
        updateSuccess = true;
      }
      graphics.updateAttrs({ count: newVal });
      transaction.update(graphics.attrs.id, {
        count: graphics.attrs.count,
      });
    }
    if (updateSuccess) {
      transaction.commit('Update Count of Elements');
    }
    return updateSuccess;
  },

  setStarInnerScale({
    editor,
    graphicsArr,
    val,
    isDelta = false,
  }: {
    editor: SuikaEditor;
    graphicsArr: SuikaGraphics[];
    val: number;
    isDelta: boolean;
  }) {
    if (graphicsArr.length === 0) {
      return;
    }

    let updateSuccess = false;
    const matchGraphicsArr = graphicsArr.filter(
      (el) => el.type === GraphicsType.Star,
    ) as SuikaStar[];

    const transaction = new Transaction(editor);
    for (const graphics of matchGraphicsArr) {
      transaction.recordOld(graphics.attrs.id, {
        starInnerScale: graphics.attrs.starInnerScale,
      });
      const oldVal = graphics.attrs.starInnerScale ?? 0;
      let newVal = isDelta ? oldVal + val : val;
      if (newVal <= 0.001) {
        newVal = 0.001;
      }
      if (newVal !== oldVal) {
        updateSuccess = true;
      }
      graphics.updateAttrs({ starInnerScale: newVal });
      transaction.update(graphics.attrs.id, {
        starInnerScale: graphics.attrs.starInnerScale,
      });
    }
    if (updateSuccess) {
      transaction.commit('Update StarInnerScale of Elements');
    }
    return updateSuccess;
  },

  /**
   * show graphs when at least one graphics is hidden
   * and
   * hide graphs when all graphs are shown
   */
  toggleVisible(editor: SuikaEditor, graphicsArr: SuikaGraphics[]) {
    if (graphicsArr.length === 0) {
      return;
    }
    // if at least one graphics is hidden, show all graphs; otherwise, hide all graphs
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

    // if at least one graphics is unlocked, lock all graphs; otherwise, unlock all graphs
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

  /** set name of graphics */
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
        'update name of graphics',
        [graphics],
        { objectName },
        prevAttrs,
      ),
    );
  },

  setFontSize(editor: SuikaEditor, graphicsArr: SuikaGraphics[], val: number) {
    const transaction = new Transaction(editor);

    let hasTextElement = false;

    for (const graphics of graphicsArr) {
      if (!(graphics instanceof SuikaText)) {
        continue;
      }
      hasTextElement = true;
      transaction.recordOld(graphics.attrs.id, {
        fontSize: graphics.attrs.fontSize,
        width: graphics.attrs.width,
        height: graphics.attrs.height,
      });

      graphics.updateAttrs({ fontSize: val });
      graphics.fitContent();

      transaction.update(graphics.attrs.id, {
        fontSize: graphics.attrs.fontSize,
        width: graphics.attrs.width,
        height: graphics.attrs.height,
      });
    }
    if (!hasTextElement) {
      return;
    }
    transaction.updateParentSize(graphicsArr);
    transaction.commit('Update FontSize of Elements');
  },

  setFontFamily(
    editor: SuikaEditor,
    graphicsArr: SuikaGraphics[],
    val: string,
  ) {
    const transaction = new Transaction(editor);

    let hasTextElement = false;

    for (const graphics of graphicsArr) {
      if (!(graphics instanceof SuikaText)) {
        continue;
      }
      hasTextElement = true;
      transaction.recordOld(graphics.attrs.id, {
        fontFamily: graphics.attrs.fontFamily,
      });

      graphics.updateAttrs({ fontFamily: val });
      graphics.fitContent();

      transaction.update(graphics.attrs.id, {
        fontFamily: graphics.attrs.fontFamily,
      });
    }
    if (!hasTextElement) {
      return;
    }
    transaction.updateParentSize(graphicsArr);
    transaction.commit('Update FontFamily of Elements');
  },
};
