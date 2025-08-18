import { GraphicsType, type IEditorPaperData } from '@suika/core';

export const dataCompatibilityV3 = (data: IEditorPaperData) => {
  if (data.appVersion === 'suika-editor_0.0.2') {
    console.log('convert v2 data to v3');
    data.data.unshift({
      id: '0-0',
      objectName: 'Document',
      width: 0,
      height: 0,
      type: GraphicsType.Document,
      transform: [1, 0, 0, 1, 0, 0],
      strokeWidth: 1,
    });
    const canvas = data.data.find((item) => item.type === GraphicsType.Canvas);
    if (canvas) {
      canvas.parentIndex = {
        guid: '0-0',
        position: 'a0',
      };
    }
    data.appVersion = 'suika-editor_0.0.3';
  }

  return data;
};
