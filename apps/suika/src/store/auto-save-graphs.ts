import { debounce } from '@suika/common';
import { type IEditorPaperData, type SuikaEditor } from '@suika/core';

import { dataCompatibilityV3 } from './data-compatibility-v3';

const STORE_KEY = 'suika-paper';

export class AutoSaveGraphics {
  constructor(private editor: SuikaEditor) {
    let data = this.load();
    if (data) {
      if (data.appVersion !== editor.appVersion) {
        if (data.appVersion === 'suika-editor_0.0.2') {
          data = dataCompatibilityV3(data);
          editor.setContents(data);
        } else {
          window.alert(
            '编辑器版本和图纸版本不兼容，将清空本地缓存 (version not match, to clear data)',
          );
          // this.clear();
          data = null;
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
