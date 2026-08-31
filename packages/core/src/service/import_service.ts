import { type IBox, mergeBoxes } from '@suika/geo';
import { generateNKeysBetween } from 'fractional-indexing';

import { type SuikaEditor } from '../editor';
import { SuikaFrame } from '../graphics';
import { Transaction } from '../transaction';
import { svgStrToSuikaData } from './import_svg';

export const importService = {
  importOriginFile: (editor: SuikaEditor) => {
    readTextFile('.suika', (content) => {
      editor.setContents(JSON.parse(content));
    });
  },
  importSVGFile: (editor: SuikaEditor) => {
    readTextFile('.svg', (content) => {
      const result = svgStrToSuikaData(content);

      if (result.length === 0) {
        console.log('empty svg, end import');
        return;
      }

      // set parentIndex
      const canvas = editor.doc.getCurrentCanvas();
      const maxIndex = canvas.getMaxChildIndex();
      console.log('maxIndex', maxIndex);
      const keys = generateNKeysBetween(maxIndex, null, result.length);
      for (let i = 0; i < result.length; i++) {
        const item = result[i];
        item.parentIndex = {
          guid: canvas.attrs.id,
          position: keys[i],
        };
      }

      editor.appendContent(result);

      // Offset = Scene Center - MergedBox
      const addedItemIdSet = new Set<string>();
      for (const item of result) {
        addedItemIdSet.add(item.id);
      }
      const addedItems = editor.doc.getGraphicsArrByIds(addedItemIdSet);

      let bbox: IBox = addedItems[0].getBbox();
      for (let i = 1; i < addedItems.length; i++) {
        bbox = mergeBoxes([bbox, addedItems[i].getBbox()]);
      }

      const sceneCenter = editor.viewportManager.getSceneCenter();
      const offsetX = sceneCenter.x - (bbox.maxX - bbox.minX) / 2;
      const offsetY = sceneCenter.y - (bbox.maxY - bbox.minY) / 2;

      // 创建一个 group 包住新增的图形
      const group = new SuikaFrame(
        {
          resizeToFit: true,
          objectName: 'group',
          width: bbox.maxX - bbox.minX,
          height: bbox.maxY - bbox.minY,
          transform: [1, 0, 0, 1, offsetX, offsetY],
        },
        {
          doc: editor.doc,
        },
      );
      editor.sceneGraph.addItems([group]);
      canvas.insertChild(group);

      for (const item of addedItems) {
        item.attrs.transform[4] -= bbox.minX;
        item.attrs.transform[5] -= bbox.minY;
      }

      // debugger;
      for (const item of addedItems) {
        // item.insertAtParent(group);
        group.insertChild(item);
      }

      // selected added graphics
      // editor.selectedElements.setItemsById(addedItemIdSet);
      editor.selectedElements.setItemsById(new Set([group.attrs.id]));

      // history
      const transaction = new Transaction(editor);
      transaction.addNewIds([...addedItemIdSet, group.attrs.id]);
      transaction.commit('import svg');

      editor.render();
    });
  },
};

function readTextFile(
  accept: string,
  callback: (contents: string) => void,
): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.style.display = 'none';

  input.addEventListener('change', function (event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
      const contents = e.target?.result as string;
      if (contents) {
        callback(contents);
      }
    };

    reader.readAsText(file);
  });

  input.click();
}
