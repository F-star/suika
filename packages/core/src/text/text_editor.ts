import { cloneDeep } from '@suika/common';

import { AddGraphCmd } from '../commands/add_graphs';
import { Editor } from '../editor';
import { TextGraph } from '../graphs';

export class TextEditor {
  textarea: HTMLInputElement;
  x = -1;
  y = -1;

  constructor(private editor: Editor) {
    this.textarea = document.createElement('input');
    this.setStyle();
    this.hide();
    this.bindEvent();
    editor.containerElement.appendChild(this.textarea);
  }
  private setStyle() {
    const styles = {
      background: 'transparent',
      border: 'none',
      outline: 'none',
      resize: 'none',
      padding: '0',
      fontFamily: 'sans-serif',
      lineHeight: '1',
      position: 'absolute',
      overflow: 'hidden',
      width: '240px',
      zIndex: '20',
    } as const;
    Object.assign(this.textarea.style, styles);
  }
  private bindEvent() {
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    });
    this.textarea.addEventListener('blur', () => {
      this.createTextGraph();
      this.hide();
    });
  }
  private createTextGraph() {
    if (!this.textarea.value) return;

    const sceneXY = this.editor.viewportCoordsToScene(
      this.x,
      this.y,
      this.editor.setting.get('snapToPixelGrid'),
    );
    const text = new TextGraph({
      objectName: '',
      x: sceneXY.x,
      y: sceneXY.y,
      content: this.textarea.value,
      autoFit: true,
      fontSize: this.editor.setting.get('defaultFontSize'),
      height: this.editor.setting.get('defaultFontSize'),
      fill: cloneDeep(this.editor.setting.get('textFill')),
    });
    this.editor.sceneGraph.addItems([text]);

    if (!this.editor.setting.get('keepToolSelectedAfterUse')) {
      this.editor.selectedElements.setItems([text]);
      this.editor.render();
    }

    this.editor.commandManager.pushCommand(
      new AddGraphCmd('draw text', this.editor, [text]),
    );
  }
  visible(x: number, y: number) {
    this.x = x;
    this.y = y;
    const zoom = this.editor.zoomManager.getZoom();
    const textarea = this.textarea;

    const fontSize = this.editor.setting.get('defaultFontSize') * zoom + 'px';
    const styles = {
      left: x + 'px',
      top: y + 'px',
      height: fontSize,
      fontSize,
      display: 'block',
    } as const;
    Object.assign(textarea.style, styles);

    textarea.focus();
  }
  hide() {
    this.textarea.style.display = 'none';
    this.textarea.value = '';
  }
  isEditing() {
    return this.textarea.style.display !== 'none';
  }
  destroy() {
    this.textarea.remove();
  }
}
