import { SetGraphsAttrsCmd } from '../commands/set_elements_attrs';
import { type Editor } from '../editor';
import { type Graph } from '../graphs';

/**
 * mutate elements and record to history
 */
export const MutateGraphsAndRecord = {
  setX(editor: Editor, elements: Graph[], newX: number) {
    if (elements.length === 0) {
      return;
    }

    const prevXs: { x: number }[] = new Array(elements.length);
    for (let i = 0, len = elements.length; i < len; i++) {
      const element = elements[i];
      prevXs[i] = { x: element.getX() };
      element.updateAttrs({
        x: newX,
      });
    }
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'Update X of Elements',
        elements,
        elements.map((el) => ({ x: el.getX() })),
        prevXs,
      ),
    );
  },
  setY(editor: Editor, elements: Graph[], newY: number) {
    if (elements.length === 0) {
      return;
    }
    const prevXs: { y: number }[] = new Array(elements.length);
    for (let i = 0, len = elements.length; i < len; i++) {
      const element = elements[i];
      prevXs[i] = { y: element.getY() };
      element.updateAttrs({
        y: newY,
      });
    }
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'Update Y of Elements',
        elements,
        elements.map((el) => ({ y: el.getY() })),
        prevXs,
      ),
    );
  },
  setWidth(editor: Editor, graphs: Graph[], width: number) {
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
  setHeight(editor: Editor, graphs: Graph[], height: number) {
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
  setRotation(editor: Editor, elements: Graph[], rotation: number) {
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
