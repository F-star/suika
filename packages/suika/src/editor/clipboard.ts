import { Editor } from './editor';
import hotkeys from 'hotkeys-js';
import { noop } from '../utils/common';
import { arrMap } from '../utils/array_util';
import omit from 'lodash.omit';
import { AddShapeCommand } from './commands/add_shape';
import { IEditorPaperData } from '../type';
import { Graph } from './scene/graph';

export class ClipboardManager {
  private unbindEvents = noop;
  constructor(private editor: Editor) {}

  bindEvents() {
    const copyHandler = () => {
      const snapshot = this.getSelectedItemsSnapshot();
      if (!snapshot) {
        return;
      }

      // TODO: write to blob data
      navigator.clipboard.writeText(snapshot).then(() => {
        console.log('copied');
      });
    };

    const pasteHandler = (e: Event) => {
      const event = e as ClipboardEvent;
      const clipboardData = event.clipboardData;
      if (!clipboardData) {
        return;
      }
      const pastedData = clipboardData.getData('Text');
      this.addGraphsFromClipboard(pastedData);
    };

    hotkeys('cmd+c, ctrl+c', copyHandler);
    // TODO: paste by content menu
    window.addEventListener('paste', pasteHandler);

    this.unbindEvents = () => {
      hotkeys.unbind('cmd+c, ctrl+c', copyHandler);
      window.removeEventListener('paste', pasteHandler);
    };
  }

  private getSelectedItemsSnapshot() {
    const selectedItems = this.editor.selectedElements.getItems();
    if (selectedItems.length === 0) {
      return null;
    }

    // remove id attr
    const copiedData = arrMap(selectedItems, (item) =>
      omit(item.getAttrs(), 'id'),
    );

    return JSON.stringify({
      appVersion: this.editor.appVersion,
      paperId: this.editor.paperId,
      data: JSON.stringify(copiedData),
    });
  }

  private addGraphsFromClipboard(dataStr: string) {
    let pastedData: IEditorPaperData | null = null;
    try {
      pastedData = JSON.parse(dataStr);
    } catch (e) {
      return;
    }
    // TODO: more validate pastedData format
    if (
      !pastedData ||
      !pastedData.appVersion.startsWith('suika-editor') ||
      !pastedData.data
    ) {
      return;
    }

    const editor = this.editor;
    const pastedGraphs = editor.sceneGraph.addGraphsByStr(pastedData.data);
    if (pastedGraphs.length === 0) {
      return;
    }

    // TODO: duplicated objectName should be renamed
    editor.commandManager.pushCommand(
      new AddShapeCommand('pasted graphs', editor, pastedGraphs),
    );
    editor.selectedElements.setItems(pastedGraphs);
    /*********** cross paper case ***********/
    if (pastedData.paperId !== this.editor.paperId) {
      // TODO: make pasted graphs center
      // move to origin temporarily
      const bbox = editor.selectedElements.getBBox()!;
      const dx = -bbox.x;
      const dy = -bbox.y;
      if (dx || dy) {
        Graph.dMove(pastedGraphs, dx, dy);
      }

      editor.zoomManager.zoomToSelection();
    }
    editor.sceneGraph.render();
  }

  destroy() {
    this.unbindEvents();
  }
}
