import { Editor } from './editor';

export const ExportServer = {
  exportOriginFile: (editor: Editor) => {
    const data = editor.sceneGraph.toJSON();
    const blob = new Blob([JSON.stringify(data)], {
      type: 'application/json',
    });
    download(blob, 'design.suika');
  },
};

const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  a.click();
};
