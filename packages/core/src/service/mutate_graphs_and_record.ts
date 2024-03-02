import { getRectRotatedXY } from '@suika/geo';

import { SetGraphsAttrsCmd } from '../commands/set_elements_attrs';
import { Editor } from '../editor';
import { Graph } from '../graphs';

/**
 * mutate elements and record to history
 */
export const MutateGraphsAndRecord = {
  setRotateX(editor: Editor, elements: Graph[], rotatedX: number) {
    if (elements.length === 0) {
      return;
    }

    const prevXs: { x: number }[] = new Array(elements.length);
    for (let i = 0, len = elements.length; i < len; i++) {
      const element = elements[i];
      prevXs[i] = { x: element.attrs.x };
      element.setRotatedX(rotatedX);
    }
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'Update X of Elements',
        elements,
        elements.map((el) => ({ x: el.attrs.x })),
        prevXs,
      ),
    );
  },
  setRotateY(editor: Editor, elements: Graph[], rotatedY: number) {
    if (elements.length === 0) {
      return;
    }
    const prevXs: { y: number }[] = new Array(elements.length);
    for (let i = 0, len = elements.length; i < len; i++) {
      const element = elements[i];
      prevXs[i] = { y: element.attrs.y };
      element.setRotatedY(rotatedY);
    }
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'Update Y of Elements',
        elements,
        elements.map((el) => ({ y: el.attrs.y })),
        prevXs,
      ),
    );
  },
  setWidth(editor: Editor, elements: Graph[], width: number) {
    if (elements.length === 0) {
      return;
    }

    const prevAttrs = elements.map((el) => ({
      x: el.attrs.x,
      y: el.attrs.y,
      width: el.attrs.width,
    }));
    elements.forEach((el) => {
      const { x: preRotatedX, y: preRotatedY } = getRectRotatedXY(el.attrs);
      el.attrs.width = width;
      const { x: rotatedX, y: rotatedY } = getRectRotatedXY(el.attrs);
      const dx = rotatedX - preRotatedX;
      const dy = rotatedY - preRotatedY;
      el.attrs.x -= dx;
      el.attrs.y -= dy;
    });
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'Update Width of Elements',
        elements,
        elements.map((el) => ({
          width: el.attrs.width,
          x: el.attrs.x,
          y: el.attrs.y,
        })),
        prevAttrs,
      ),
    );
  },
  setHeight(editor: Editor, elements: Graph[], height: number) {
    if (elements.length === 0) {
      return;
    }

    const prevAttrs = elements.map((el) => ({
      x: el.attrs.x,
      y: el.attrs.y,
      height: el.attrs.height,
    }));
    elements.forEach((el) => {
      const { x: preRotatedX, y: preRotatedY } = getRectRotatedXY(el.attrs);
      el.attrs.height = height;
      const { x: rotatedX, y: rotatedY } = getRectRotatedXY(el.attrs);
      const dx = rotatedX - preRotatedX;
      const dy = rotatedY - preRotatedY;
      el.attrs.x -= dx;
      el.attrs.y -= dy;
    });
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update Height of Elements',
        elements,
        elements.map((el) => ({
          height: el.attrs.height,
          x: el.attrs.x,
          y: el.attrs.y,
        })),
        prevAttrs,
      ),
    );
  },
  setRotation(editor: Editor, elements: Graph[], rotation: number) {
    if (elements.length === 0) {
      return;
    }

    const prevAttrs = elements.map((el) => ({
      rotation: el.attrs.rotation || 0,
    }));
    elements.forEach((el) => {
      el.attrs.rotation = rotation;
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
  setCornerRadius(editor: Editor, elements: Graph[], cornerRadius: number) {
    if (elements.length === 0) {
      return;
    }

    const prevAttrs = elements.map((el) => ({
      cornerRadius: el.attrs.cornerRadius || 0,
    }));
    elements.forEach((el) => {
      el.attrs.cornerRadius = cornerRadius;
    });
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update Corner Radius',
        elements,
        { cornerRadius },
        prevAttrs,
      ),
    );
  },

  /**
   * show graphs when at least one graph is hidden
   * and
   * hide graphs when all graphs are shown
   */
  toggleVisible(editor: Editor, graphs: Graph[]) {
    if (graphs.length === 0) {
      return;
    }

    // if at least one graph is hidden, show all graphs; otherwise, hide all graphs
    const newVisible = graphs.some((item) => !item.getVisible());
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
  toggleLock(editor: Editor, graphs: Graph[]) {
    if (graphs.length === 0) {
      return;
    }

    // if at least one graph is unlocked, lock all graphs; otherwise, unlock all graphs
    const newLock = graphs.some((item) => !item.getLock());
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
  setGraphName(editor: Editor, graph: Graph, objectName: string) {
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
