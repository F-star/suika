import { type IBox, type IPoint, mergeBoxes } from '@suika/geo';
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
      importSVG(editor, content);
    });
  },
  bindSVGDropEvents: (editor: SuikaEditor) => {
    const onDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes('Files')) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }
    };

    const onDrop = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes('Files')) return;

      event.preventDefault();
      // TODO: support import multiple files
      const file = Array.from(event.dataTransfer?.files ?? []).find(isSVGFile);
      if (!file) return;

      const position = editor.getSceneCursorXY(event);
      readFileAsText(file, (content) => importSVG(editor, content, position));
    };

    const canvas = editor.canvasElement;
    canvas.addEventListener('dragover', onDragOver);
    canvas.addEventListener('drop', onDrop);

    return () => {
      canvas.removeEventListener('dragover', onDragOver);
      canvas.removeEventListener('drop', onDrop);
    };
  },
};

function importSVG(editor: SuikaEditor, content: string, center?: IPoint) {
  const result = svgStrToSuikaData(content);

  if (result.length === 0) {
    console.log('empty svg, end import');
    return;
  }

  // set parentIndex
  const canvas = editor.doc.getCurrentCanvas();
  const maxIndex = canvas.getMaxChildIndex();
  const keys = generateNKeysBetween(maxIndex, null, result.length);
  for (let i = 0; i < result.length; i++) {
    const item = result[i];
    item.parentIndex = {
      guid: canvas.attrs.id,
      position: keys[i],
    };
  }

  editor.appendContent(result);

  const addedItemIdSet = new Set<string>();
  for (const item of result) {
    addedItemIdSet.add(item.id);
  }
  const addedItems = editor.doc.getGraphicsArrByIds(addedItemIdSet);

  let bbox: IBox = addedItems[0].getBbox();
  for (let i = 1; i < addedItems.length; i++) {
    bbox = mergeBoxes([bbox, addedItems[i].getBbox()]);
  }

  const targetCenter = center ?? editor.viewportManager.getSceneCenter();
  const offsetX = targetCenter.x - (bbox.maxX - bbox.minX) / 2;
  const offsetY = targetCenter.y - (bbox.maxY - bbox.minY) / 2;

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

  for (const item of addedItems) {
    group.insertChild(item);
  }

  editor.selectedElements.setItemsById(new Set([group.attrs.id]));

  const transaction = new Transaction(editor);
  transaction.addNewIds([...addedItemIdSet, group.attrs.id]);
  transaction.commit('import svg');

  editor.render();
}

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

    readFileAsText(file, callback);
  });

  input.click();
}

function isSVGFile(file: File) {
  return (
    file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
  );
}

function readFileAsText(file: File, callback: (contents: string) => void) {
  const reader = new FileReader();

  reader.onload = function (event) {
    const contents = event.target?.result as string;
    if (contents) {
      callback(contents);
    }
  };

  reader.readAsText(file);
}
