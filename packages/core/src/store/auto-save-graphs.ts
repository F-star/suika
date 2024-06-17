import { debounce } from '@suika/common';

import { type Editor } from '../editor';
import { type IEditorPaperData } from '../type';

const STORE_KEY = 'suika-paper';

export class AutoSaveGraphs {
  listener: () => void;
  constructor(private editor: Editor) {
    this.listener = debounce(() => {
      this.save();
    }, 10);
  }

  autoSave() {
    this.editor.commandManager.on('change', this.listener);
  }
  stopAutoSave() {
    this.editor.commandManager.off('change', this.listener);
  }
  save() {
    localStorage.setItem(STORE_KEY, this.editor.sceneGraph.toJSON());
  }
  clear() {
    localStorage.removeItem(STORE_KEY);
  }
  load() {
    const dataStr = localStorage.getItem(STORE_KEY);
    if (!dataStr) return null;
    const data = JSON.parse(dataStr) as IEditorPaperData;
    return data;
  }
}
