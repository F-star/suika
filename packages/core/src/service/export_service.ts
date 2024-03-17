import { type Editor } from '../editor';

export const exportService = {
  exportOriginFile: (editor: Editor, filename = 'design') => {
    const data = editor.sceneGraph.toJSON();
    const blob = new Blob([data], {
      type: 'application/json',
    });
    download(blob, filename + '.suika');
  },
};

const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  a.click();
};
