import { type SuikaEditor } from '../editor';
import { toPNGBlob, toSVG } from '../to_svg';

export const exportService = {
  exportOriginFile: (editor: SuikaEditor, filename = 'design') => {
    const data = editor.sceneGraph.toJSON();
    const blob = new Blob([data], {
      type: 'application/json',
    });
    download(blob, filename + '.suika');
  },

  exportCurrentPageSVG: (editor: SuikaEditor) => {
    const currentPage = editor.doc.getCurrentCanvas();
    const graphicsItems = currentPage
      .getChildren()
      .filter((item) => item.isVisible());

    if (graphicsItems.length === 0) {
      // TODO: if no graphics items, show error message
      console.error('No graphics items to export');
      return;
    }

    const svg = toSVG(graphicsItems).svg;
    const blob = new Blob([svg], {
      type: 'image/svg+xml',
    });

    const suffix = currentPage.attrs.objectName;
    download(blob, `${suffix}.svg`);
  },

  exportCurrentPagePNG: async (editor: SuikaEditor) => {
    const currentPage = editor.doc.getCurrentCanvas();
    const graphicsItems = currentPage
      .getChildren()
      .filter((item) => item.isVisible());

    if (graphicsItems.length === 0) {
      // TODO: if no graphics items, show error message
      console.error('No graphics items to export');
      return;
    }

    try {
      const blob = await toPNGBlob(graphicsItems);
      const suffix = currentPage.attrs.objectName;
      download(blob, `${suffix}.png`);
    } catch (error) {
      console.error('Failed to export PNG:', error);
    }
  },
};

const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  a.click();
};
