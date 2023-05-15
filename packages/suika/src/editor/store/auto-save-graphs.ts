import debounce from 'lodash.debounce';
import { Editor } from '../editor';

const STORE_KEY = 'suika-scene-graphs';

export class AutoSaveGraphs {
  listener: () => void;
  constructor(private editor: Editor) {
    this.listener = debounce(() => {
      this.save();
    }, 300);
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
  load() {
    const data = localStorage.getItem(STORE_KEY);
    data && this.editor.sceneGraph.load(data);
  }
}
