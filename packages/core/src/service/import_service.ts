import { Editor } from '../editor';

export const importService = {
  importOriginFile: (editor: Editor) => {
    readTextFile('.suika', (content) => {
      editor.loadData(JSON.parse(content));
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
