import { type SuikaEditor } from '../editor';
import { toSVG } from '../to_svg';

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
    const graphicsItems = currentPage.getChildren();

    if (graphicsItems.length === 0) {
      // TODO: if no graphics items, show error message
      console.error('No graphics items to export');
      return;
    }

    const svg = toSVG(graphicsItems);
    const blob = new Blob([svg], {
      type: 'image/svg+xml',
    });
    download(blob, 'design.svg');
  },
};

const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  a.click();
};
