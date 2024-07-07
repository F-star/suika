import { debounce } from '@suika/common';
import { type Editor, type IEditorPaperData } from '@suika/core';

const STORE_KEY = 'suika-paper';

export class AutoSaveGraphics {
  constructor(private editor: Editor) {
    const data = this.load();
    if (data) {
      if (data.appVersion !== editor.appVersion) {
        if (
          confirm(
            '编辑器版本和图纸版本不兼容，将清空本地缓存 (version not match, to clear data)',
          )
        ) {
          this.clear();
        }
      } else {
        editor.setContents(data);
      }
    }

    this.autoSave();
    this.editor.on('destroy', () => this.stopAutoSave());
  }

  private listener = debounce(() => {
    this.save();
  }, 10);

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
