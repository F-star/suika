import { type SuikaEditor } from '../editor';
import { toPNGBlob, toSVG } from '../to_svg';

export interface IExportFile {
  blob: Blob;
  filename: string;
}

export const exportService = {
  exportOriginFile: (editor: SuikaEditor, filename = 'design') => {
    const file = exportService.getOriginFile(editor, filename);
    download(file.blob, file.filename);
  },

  getOriginFile: (editor: SuikaEditor, filename = 'design'): IExportFile => {
    return {
      blob: new Blob([editor.sceneGraph.toJSON()], {
        type: 'application/json',
      }),
      filename: filename + '.suika',
    };
  },

  exportCurrentPageSVG: (editor: SuikaEditor) => {
    const file = exportService.getCurrentPageSVG(editor);
    if (file) download(file.blob, file.filename);
  },

  getCurrentPageSVG: (editor: SuikaEditor): IExportFile | null => {
    const currentPage = editor.doc.getCurrentCanvas();
    const graphicsItems = currentPage
      .getChildren()
      .filter((item) => item.isVisible());

    if (graphicsItems.length === 0) {
      // TODO: if no graphics items, show error message
      console.error('No graphics items to export');
      return null;
    }

    const svg = toSVG(graphicsItems).svg;
    const suffix = currentPage.attrs.objectName;
    return {
      blob: new Blob([svg], { type: 'image/svg+xml' }),
      filename: `${suffix}.svg`,
    };
  },

  exportCurrentPagePNG: async (editor: SuikaEditor) => {
    const file = await exportService.getCurrentPagePNG(editor);
    if (file) download(file.blob, file.filename);
  },

  getCurrentPagePNG: async (
    editor: SuikaEditor,
  ): Promise<IExportFile | null> => {
    const currentPage = editor.doc.getCurrentCanvas();
    const graphicsItems = currentPage
      .getChildren()
      .filter((item) => item.isVisible());

    if (graphicsItems.length === 0) {
      // TODO: if no graphics items, show error message
      console.error('No graphics items to export');
      return null;
    }

    try {
      const blob = await toPNGBlob(graphicsItems);
      const suffix = currentPage.attrs.objectName;
      return { blob, filename: `${suffix}.png` };
    } catch (error) {
      console.error('Failed to export PNG:', error);
      return null;
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
