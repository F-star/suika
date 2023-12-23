import { getRectRotatedXY } from '../../utils/geo';
import { SetElementsAttrs } from '../commands/set_elements_attrs';
import { Editor } from '../editor';
import { Graph } from '../scene/graph';

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
      prevXs[i] = { x: element.x };
      element.setRotatedX(rotatedX);
    }
    editor.commandManager.pushCommand(
      new SetElementsAttrs(
        'Update X of Elements',
        elements,
        elements.map((el) => ({ x: el.x })),
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
      prevXs[i] = { y: element.y };
      element.setRotatedY(rotatedY);
    }
    editor.commandManager.pushCommand(
      new SetElementsAttrs(
        'Update Y of Elements',
        elements,
        elements.map((el) => ({ y: el.y })),
        prevXs,
      ),
    );
  },
  setWidth(editor: Editor, elements: Graph[], width: number) {
    if (elements.length === 0) {
      return;
    }

    const prevAttrs = elements.map((el) => ({
      x: el.x,
      y: el.y,
      width: el.width,
    }));
    elements.forEach((el) => {
      const { x: preRotatedX, y: preRotatedY } = getRectRotatedXY(el);
      el.width = width;
      const { x: rotatedX, y: rotatedY } = getRectRotatedXY(el);
      const dx = rotatedX - preRotatedX;
      const dy = rotatedY - preRotatedY;
      el.x -= dx;
      el.y -= dy;
    });
    editor.commandManager.pushCommand(
      new SetElementsAttrs(
        'Update Width of Elements',
        elements,
        elements.map((el) => ({ width: el.width, x: el.x, y: el.y })),
        prevAttrs,
      ),
    );
  },
  setHeight(editor: Editor, elements: Graph[], height: number) {
    if (elements.length === 0) {
      return;
    }

    const prevAttrs = elements.map((el) => ({
      x: el.x,
      y: el.y,
      height: el.height,
    }));
    elements.forEach((el) => {
      const { x: preRotatedX, y: preRotatedY } = getRectRotatedXY(el);
      el.height = height;
      const { x: rotatedX, y: rotatedY } = getRectRotatedXY(el);
      const dx = rotatedX - preRotatedX;
      const dy = rotatedY - preRotatedY;
      el.x -= dx;
      el.y -= dy;
    });
    editor.commandManager.pushCommand(
      new SetElementsAttrs(
        'update Height of Elements',
        elements,
        elements.map((el) => ({ height: el.height, x: el.x, y: el.y })),
        prevAttrs,
      ),
    );
  },
  setRotation(editor: Editor, elements: Graph[], rotation: number) {
    if (elements.length === 0) {
      return;
    }

    const prevAttrs = elements.map((el) => ({ rotation: el.rotation || 0 }));
    elements.forEach((el) => {
      el.rotation = rotation;
    });
    editor.commandManager.pushCommand(
      new SetElementsAttrs(
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
      cornerRadius: el.cornerRadius || 0,
    }));
    elements.forEach((el) => {
      el.cornerRadius = cornerRadius;
    });
    editor.commandManager.pushCommand(
      new SetElementsAttrs(
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
    const prevAttrs = graphs.map((el) => ({ visible: el.visible }));
    graphs.forEach((el) => {
      el.visible = newVisible;
    });
    editor.commandManager.pushCommand(
      new SetElementsAttrs(
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
    const prevAttrs = graphs.map((el) => ({ lock: el.lock }));
    graphs.forEach((el) => {
      el.lock = newLock;
    });
    editor.commandManager.pushCommand(
      new SetElementsAttrs(
        'update lock of graphs',
        graphs,
        { lock: newLock },
        prevAttrs,
      ),
    );
  },

  /** set name of graph */
  setGraphName(editor: Editor, graph: Graph, objectName: string) {
    const prevAttrs = [{ objectName: graph.objectName }];
    graph.objectName = objectName;
    editor.commandManager.pushCommand(
      new SetElementsAttrs(
        'update name of graph',
        [graph],
        { objectName },
        prevAttrs,
      ),
    );
  },
};
