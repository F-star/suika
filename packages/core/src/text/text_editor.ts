import { cloneDeep } from '@suika/common';
import { type IPoint } from '@suika/geo';

import { SetGraphsAttrsCmd } from '../commands';
import { AddGraphCmd } from '../commands/add_graphs';
import { type SuikaEditor } from '../editor';
import { SuikaText } from '../graphics';
import { removeGraphicsAndRecord } from '../service/remove_service';

export class TextEditor {
  textarea: HTMLInputElement;
  x = -1;
  y = -1;
  private textGraph: SuikaText | null = null;

  constructor(private editor: SuikaEditor) {
    this.textarea = document.createElement('input');
    this.setStyle();
    this.inactive();
    this.bindEvent();
    editor.containerElement.appendChild(this.textarea);
  }

  active(params: { textGraph?: SuikaText; pos?: IPoint }) {
    const { textGraph, pos } = params;
    if (textGraph) {
      this.textGraph = textGraph;
      const viewportPos = this.editor.toViewportPt(
        textGraph.getX(),
        textGraph.getY(),
      );
      this.x = viewportPos.x;
      this.y = viewportPos.y;
    } else if (pos) {
      this.x = pos.x;
      this.y = pos.y;
    } else {
      console.error('invalid params', params);
      return;
    }

    this.editor.controlHandleManager.enableTransformControl = false;

    let content = '';
    if (textGraph) {
      textGraph.noRender = true;
      this.textGraph = textGraph;
      content = textGraph.attrs.content;
    }

    const zoom = this.editor.zoomManager.getZoom();
    const fontSize = this.editor.setting.get('defaultFontSize') * zoom;
    this.initTextarea(fontSize, content);
  }

  inactive() {
    if (this.editor.controlHandleManager) {
      this.editor.controlHandleManager.enableTransformControl = true;
    }

    this.textarea.style.display = 'none';
    this.textarea.value = '';
    if (this.textGraph) {
      this.textGraph.noRender = false;
      this.textGraph = null;
    }
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
        this.inactive();
      }
    });
    this.textarea.addEventListener('blur', () => {
      if (!this.textGraph) {
        this.createTextGraph();
      } else {
        this.updateTextGraph();
      }
      this.inactive();
    });
  }

  private updateTextGraph() {
    const textGraph = this.textGraph;
    if (!textGraph) return;

    if (!this.textarea.value) {
      removeGraphicsAndRecord(this.editor, [textGraph]);
      return;
    }

    const prevContent = textGraph.attrs.content;
    const content = this.textarea.value;
    if (prevContent === content) {
      return;
    }
    textGraph.updateAttrs({ content });
    this.editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd('update text content', [textGraph], { content }, [
        { content: prevContent },
      ]),
    );
  }

  private createTextGraph() {
    if (!this.textarea.value) return;

    const sceneXY = this.editor.toScenePt(
      this.x,
      this.y,
      this.editor.setting.get('snapToGrid'),
    );
    const text = new SuikaText(
      {
        objectName: '',
        content: this.textarea.value,
        autoFit: true,
        fontSize: this.editor.setting.get('defaultFontSize'),
        height: this.editor.setting.get('defaultFontSize'),
        fill: cloneDeep(this.editor.setting.get('textFill')),
      },
      {
        advancedAttrs: sceneXY,
        doc: this.editor.doc,
      },
    );
    this.editor.doc.getCurrCanvas().insertChild(text);
    this.editor.sceneGraph.addItems([text]);

    if (!this.editor.setting.get('keepToolSelectedAfterUse')) {
      this.editor.selectedElements.setItems([text]);
      this.editor.render();
    }

    this.editor.commandManager.pushCommand(
      new AddGraphCmd('draw text', this.editor, [text]),
    );
  }

  private initTextarea(fontSize: number, content: string) {
    const textarea = this.textarea;

    const fontSizeStr = fontSize + 'px';
    const styles = {
      left: this.x + 'px',
      top: this.y + 'px',
      height: fontSizeStr,
      fontSize: fontSizeStr,
      display: 'block',
    } as const;
    Object.assign(textarea.style, styles);

    textarea.value = content;
    textarea.select();
    textarea.focus();
  }

  isActive() {
    return this.textarea.style.display !== 'none';
  }
  getText() {
    return this.textGraph;
  }
  destroy() {
    this.textarea.remove();
  }
}
