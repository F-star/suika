import { genUuid, increaseIdGenerator, noop } from '@suika/common';
import {
  boxToRect,
  invertMatrix,
  mergeBoxes,
  multiplyMatrix,
} from '@suika/geo';
import { generateNKeysBetween } from 'fractional-indexing';

import { type SuikaEditor } from './editor';
import {
  type GraphicsAttrs,
  isFrameGraphics,
  SuikaGraphics,
  SuikaRect,
} from './graphics';
import { isCanvasGraphics } from './graphics/canvas';
import { PaintType } from './paint';
import { toSVG } from './to_svg';
import { Transaction } from './transaction';
import { type IEditorPaperData } from './type';
import { getChildNodeSet } from './utils';

/**
 * Clipboard Manager
 *
 * reference: https://mp.weixin.qq.com/s/kHyltZNHeh6lXqtoP6orUQ
 */
export class ClipboardManager {
  private unbindEvents = noop;
  private hasBindEvents = false;
  constructor(private editor: SuikaEditor) {}

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

      if (clipboardData.files.length > 0) {
        for (const file of clipboardData.files) {
          if (file.type.includes('image')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64 = e.target?.result as string;
              this.createGraphicsWithImg(base64);
            };
            reader.readAsDataURL(file);
          }
        }
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

  private async createGraphicsWithImg(imgUrl: string) {
    const editor = this.editor;
    await editor.imgManager.addImg(imgUrl);
    const img = editor.imgManager.getImg(imgUrl);
    const center = editor.viewportManager.getCenter();
    if (img) {
      const rectGraphics = new SuikaRect(
        {
          objectName: '',
          width: img.width,
          height: img.height,
          fill: [{ type: PaintType.Image, attrs: { src: imgUrl } }],
        },
        {
          advancedAttrs: {
            x: center.x - img.width / 2,
            y: center.y - img.height / 2,
          },
          doc: editor.doc,
        },
      );
      editor.sceneGraph.addItems([rectGraphics]);
      editor.doc.getCanvas().insertChild(rectGraphics);
      editor.render();
    }
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

  copyAsSVG() {
    const graphs = this.editor.selectedElements.getItems();
    if (graphs.length === 0) {
      return;
    }
    const svgStr = toSVG(graphs);
    navigator.clipboard.writeText(svgStr).then(() => {
      console.log('SVG copied');
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
    const selectedItems = SuikaGraphics.sortGraphics(
      this.editor.selectedElements.getItems(),
    );
    if (selectedItems.length === 0) {
      return null;
    }

    const idGenerator = increaseIdGenerator();
    const replacedIdMap = new Map<string, string>();
    const copiedData: GraphicsAttrs[] = [];

    for (const item of selectedItems) {
      const attrs = item.getAttrs();
      attrs.transform = item.getWorldTransform();
      attrs.parentIndex = undefined;
      const tmpId = idGenerator();
      replacedIdMap.set(attrs.id, tmpId);
      attrs.id = tmpId;

      copiedData.push(attrs);
    }

    const childNodes = getChildNodeSet(selectedItems);
    for (const item of childNodes) {
      const attrs = item.getAttrs();
      const tmpId = idGenerator();
      replacedIdMap.set(attrs.id, tmpId);
      attrs.id = tmpId;

      if (attrs.parentIndex) {
        attrs.parentIndex.guid = replacedIdMap.get(attrs.parentIndex.guid)!;
      }

      copiedData.push(attrs);
    }

    return JSON.stringify({
      appVersion: this.editor.appVersion,
      paperId: this.editor.paperId,
      data: copiedData,
    });
  }

  /**
   * update parentIndex.guid and transform for attributes array
   * @param attrsArr attribute array
   * @returns top parent count
   */
  private updateAttrsParentIndex(attrsArr: GraphicsAttrs[]): number {
    /**
     * TODO: to finish
     * （逻辑待梳理）
     * 如果选中一个 group 节点。按顺序粘贴子节点中的到最上方
     * 如果选中一个非 group 节点，按顺序粘贴到它的上方
     * 如果选中多个节点。等价于选中最靠上的那一个节点，应用上面两种情况之一的效果
     *
     * 选中单个 group 后，然后粘贴的位置依旧是这个 group，在 group 后粘贴。
     */
    let left: string | null = null;
    let right: string | null = null;
    const firstGraphics =
      SuikaGraphics.sortGraphics(this.editor.selectedElements.getItems()).at(
        -1,
      ) ?? this.editor.doc.getCurrCanvas();
    let parent = firstGraphics;

    if (isCanvasGraphics(firstGraphics) || isFrameGraphics(firstGraphics)) {
      left = firstGraphics.getMaxChildIndex();
    } else {
      parent = firstGraphics.getParent()!;
      left = firstGraphics.getSortIndex();
      const nextSibling = firstGraphics.getNextSibling();
      right = nextSibling ? nextSibling.getSortIndex() : null;
    }

    const parentId = parent.attrs.id;
    const parentInvertWorldTf = invertMatrix(parent.getWorldTransform());

    let i = 0;
    while (i < attrsArr.length) {
      const attrs = attrsArr[i];
      if (attrs.parentIndex) {
        break;
      }
      i++;
    }

    const topGraphicsCount = i;
    const sortIndies = generateNKeysBetween(left, right, topGraphicsCount);

    // top parent node
    const oldNewIdMap = new Map<string, string>();
    for (let j = 0; j < topGraphicsCount; j++) {
      const attrs = attrsArr[j];
      attrs.parentIndex = {
        guid: parentId,
        position: sortIndies[j],
      };

      const newId = genUuid();
      oldNewIdMap.set(attrs.id, newId);
      attrs.id = newId;

      attrs.transform = multiplyMatrix(parentInvertWorldTf, attrs.transform);
    }

    // child node
    while (i < attrsArr.length) {
      const attrs = attrsArr[i];
      const newId = genUuid();
      oldNewIdMap.set(attrs.id, newId);
      attrs.id = newId;
      attrs.parentIndex!.guid = oldNewIdMap.get(attrs.parentIndex!.guid)!;
      i++;
    }

    return topGraphicsCount;
  }

  private addGraphsFromClipboard(dataStr: string): void;
  private addGraphsFromClipboard(dataStr: string, x: number, y: number): void;
  private addGraphsFromClipboard(dataStr: string, x?: number, y?: number) {
    let pastedData: IEditorPaperData | null = null;
    try {
      pastedData = JSON.parse(dataStr);
    } catch (e) {
      // TODO: create text graphics from pastedData
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
      // TODO: create text graphics from pastedData
      return;
    }

    const editor = this.editor;
    if (pastedData.data.length === 0) {
      return;
    }

    const topGraphicsCount = this.updateAttrsParentIndex(pastedData.data);
    const pastedGraphicsArr = editor.sceneGraph.createGraphicsArr(
      pastedData.data,
    );
    editor.sceneGraph.addItems(pastedGraphicsArr);
    editor.sceneGraph.initGraphicsTree(pastedGraphicsArr);

    const selectedItems = pastedGraphicsArr.slice(0, topGraphicsCount);
    editor.selectedElements.setItems(selectedItems);

    const boundingRect = boxToRect(
      mergeBoxes(selectedItems.map((item) => item.getBbox())),
    );
    if (
      (x === undefined || y === undefined) &&
      pastedData.paperId !== editor.paperId
    ) {
      const vwCenter = this.editor.viewportManager.getCenter();
      x = vwCenter.x - boundingRect.width / 2;
      y = vwCenter.y - boundingRect.height / 2;
    }

    if (x !== undefined && y !== undefined) {
      const dx = x - boundingRect.x;
      const dy = y - boundingRect.y;
      if (dx || dy) {
        SuikaGraphics.dMove(selectedItems, dx, dy);
      }
    }

    // TODO: duplicated objectName should be renamed

    const transaction = new Transaction(editor);
    transaction
      .addNewIds(pastedGraphicsArr.map((item) => item.attrs.id))
      .updateParentSize(selectedItems)
      .commit('pasted graphs');

    editor.render();
  }

  destroy() {
    this.hasBindEvents = false;
    this.unbindEvents();
  }
}
