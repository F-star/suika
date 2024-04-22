import { arrMap, noop, omit } from '@suika/common';

import { AddGraphCmd } from './commands/add_graphs';
import { type Editor } from './editor';
import { Graph } from './graphs';
import { type IEditorPaperData } from './type';

/**
 * Clipboard Manager
 *
 * reference: https://mp.weixin.qq.com/s/kHyltZNHeh6lXqtoP6orUQ
 */
export class ClipboardManager {
  private unbindEvents = noop;
  private hasBindEvents = false;
  constructor(private editor: Editor) {}

  bindEvents() {
    if (this.hasBindEvents) {
      console.log('ClipboardManager has bind events, please destroy first');
      return;
    }
    this.hasBindEvents = true;

    const copyHandler = () => {
      this.copy();
    };

    const pasteHandler = (e: Event) => {
      const event = e as ClipboardEvent;
      const clipboardData = event.clipboardData;
      if (
        !clipboardData ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const pastedData = clipboardData.getData('Text');
      this.addGraphsFromClipboard(pastedData);
    };

    this.editor.keybindingManager.register({
      key: { metaKey: true, keyCode: 'KeyC' },
      winKey: { ctrlKey: true, keyCode: 'KeyC' },
      actionName: 'Copy',
      action: copyHandler,
    });

    window.addEventListener('paste', pasteHandler);

    this.unbindEvents = () => {
      window.removeEventListener('paste', pasteHandler);
    };
  }

  copy() {
    const snapshot = this.getSelectedItemsSnapshot();
    if (!snapshot) {
      return;
    }

    // TODO: write to blob data
    navigator.clipboard.writeText(snapshot).then(() => {
      console.log('copied');
    });
  }

  /**
   * paste at special coords
   */
  pasteAt(x: number, y: number) {
    navigator.clipboard.readText().then((pastedData) => {
      this.addGraphsFromClipboard(pastedData, x, y);
    });
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

  private addGraphsFromClipboard(dataStr: string): void;
  private addGraphsFromClipboard(dataStr: string, x: number, y: number): void;
  private addGraphsFromClipboard(dataStr: string, x?: number, y?: number) {
    let pastedData: IEditorPaperData | null = null;
    try {
      pastedData = JSON.parse(dataStr);
    } catch (e) {
      // TODO: create text graph from pastedData
      return;
    }

    // TODO: more format validate
    if (
      !(
        pastedData &&
        typeof pastedData === 'object' &&
        pastedData.appVersion.startsWith('suika-editor') &&
        pastedData.data
      )
    ) {
      // TODO: create text graph from pastedData
      return;
    }

    const editor = this.editor;
    const pastedGraphs = editor.sceneGraph.addGraphsByStr(pastedData.data);
    if (pastedGraphs.length === 0) {
      return;
    }

    // TODO: duplicated objectName should be renamed
    editor.commandManager.pushCommand(
      new AddGraphCmd('pasted graphs', editor, pastedGraphs),
    );
    editor.selectedElements.setItems(pastedGraphs);

    const bbox = editor.selectedElements.getBbox()!;
    if (
      (x === undefined || y === undefined) &&
      pastedData.paperId !== editor.paperId
    ) {
      const vwCenter = this.editor.viewportManager.getCenter();
      x = vwCenter.x - bbox.width / 2;
      y = vwCenter.y - bbox.height / 2;
    }

    if (x !== undefined && y !== undefined) {
      const dx = x - bbox.x;
      const dy = y - bbox.y;
      if (dx || dy) {
        Graph.dMove(pastedGraphs, dx, dy);
      }
    }
    editor.render();
  }

  destroy() {
    this.hasBindEvents = false;
    this.unbindEvents();
  }
}
