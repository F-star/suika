import { getContentLength, sliceContent } from '@suika/common';
import { type IPoint } from '@suika/geo';

import { type SuikaEditor } from '../editor';
import { type IDrawInfo, SuikaText, type TextAttrs } from '../graphics';
import { type IMousemoveEvent } from '../host_event_manager';
import { removeGraphicsAndRecord } from '../service/remove_service';
import { Transaction } from '../transaction';
import { type IRange, RangeManager } from './range_manager';

const defaultInputStyle = {
  position: 'fixed',
  width: '1px',
  zIndex: '-1',
  margin: 0,
  padding: 0,
  border: 0,
  outline: 0,
  opacity: 0,
} as const;

export class TextEditor {
  private inputDom: HTMLInputElement;
  private textGraphics: SuikaText | null = null;
  private rangeManager: RangeManager;
  private _active = false;
  private transaction!: Transaction;

  constructor(private editor: SuikaEditor) {
    this.rangeManager = new RangeManager(editor);

    this.inputDom = this.createInputDom();
    this.inactive();
    this.bindEvent();

    editor.containerElement.appendChild(this.inputDom);
  }

  private createInputDom() {
    const inputDom = document.createElement('input');
    inputDom.tabIndex = -1;
    Object.assign(inputDom.style, defaultInputStyle);
    return inputDom;
  }

  isEditorInputDom(dom: HTMLElement) {
    return dom === this.inputDom;
  }

  getTextGraphics() {
    return this.textGraphics;
  }

  isActive() {
    return this._active;
  }

  active(params: { textGraphics?: SuikaText; pos: IPoint; range?: IRange }) {
    this._active = true;
    this.editor.controlHandleManager.enableTransformControl = false;
    this.editor.selectedBox.enableDrawSizeIndicator = false;
    this.transaction = new Transaction(this.editor);

    let textGraphics = params.textGraphics;

    if (!params.textGraphics) {
      const fontSize = this.editor.setting.get('defaultFontSize');
      const defaultFontFamily = this.editor.setting.get('defaultFontFamily');
      textGraphics = new SuikaText(
        {
          objectName: '',
          content: '',
          fontSize,
          fontFamily: defaultFontFamily,
          width: 0,
          height: fontSize,
          autoFit: true,
        },
        {
          advancedAttrs: params.pos,
          doc: this.editor.doc,
        },
      );
      this.textGraphics = textGraphics;

      this.editor.sceneGraph.addItems([textGraphics]);
      this.editor.doc.getCurrentCanvas().insertChild(textGraphics);
    }
    this.textGraphics = textGraphics!;
    this.editor.selectedElements.setItems([textGraphics!]);

    this.transaction.recordOld<TextAttrs>(textGraphics!.attrs.id, {
      content: textGraphics!.attrs.content,
      width: textGraphics!.attrs.width,
    });

    if (params.range) {
      this.rangeManager.setRange(params.range);
    } else {
      const rangeStart = textGraphics!.getContentLength();
      this.rangeManager.setRange({
        start: rangeStart,
        end: rangeStart,
      });
    }

    const cursorPos = this.editor.mouseEventManager.getCursorPos();
    if (cursorPos) {
      this.updateCursor(cursorPos);
    }

    this.inputDom.focus();
    this.editor.render();
  }

  inactive() {
    this._active = false;

    if (this.textGraphics) {
      if (!this.textGraphics.attrs.content) {
        removeGraphicsAndRecord(this.editor, [this.textGraphics]);
      } else {
        this.transaction.update<TextAttrs>(this.textGraphics.attrs.id, {
          content: this.textGraphics.attrs.content,
          width: this.textGraphics.attrs.width,
        });
        this.transaction.updateParentSize([this.textGraphics]);
        this.transaction.commit('update text content');
      }
      this.textGraphics = null;
    }

    this.editor.controlHandleManager.enableTransformControl = true;
    this.editor.selectedBox.enableDrawSizeIndicator = true;
  }

  static updateTextContentAndResize(textGraphics: SuikaText, content: string) {
    textGraphics.updateAttrs({ content });
    textGraphics.fitContent();
  }

  private bindEvent() {
    let composingText = '';
    let leftContentWhenComposing = '';
    let rightContentWhenComposing = '';

    const inputDom = this.inputDom;

    inputDom.addEventListener('input', (_e) => {
      const e = _e as InputEvent;

      const textGraphics = this.textGraphics;
      if (!textGraphics) return;

      if (e.isComposing) {
        if (!composingText) {
          const { rangeLeft, rangeRight } = this.rangeManager.getSortedRange();
          const content = textGraphics.attrs.content;
          leftContentWhenComposing = sliceContent(content, 0, rangeLeft);
          rightContentWhenComposing = sliceContent(content, rangeRight);
        }
        composingText = e.data ?? '';
      } else {
        composingText = '';
        leftContentWhenComposing = '';
        rightContentWhenComposing = '';
      }
      // Not IME input, directly add to textGraphics
      if (!e.isComposing && e.data) {
        const { rangeLeft, rangeRight } = this.rangeManager.getSortedRange();

        const content = textGraphics.attrs.content;
        const newContent =
          sliceContent(content, 0, rangeLeft) +
          e.data +
          sliceContent(content, rangeRight);

        TextEditor.updateTextContentAndResize(textGraphics, newContent);
        const dataLength = getContentLength(e.data);
        this.rangeManager.setRange({
          start: rangeLeft + dataLength,
          end: rangeLeft + dataLength,
        });
        this.editor.render();
      } else if (e.isComposing) {
        const newContent =
          leftContentWhenComposing + composingText + rightContentWhenComposing;
        TextEditor.updateTextContentAndResize(textGraphics, newContent);
        const newRangeStart =
          getContentLength(leftContentWhenComposing) +
          getContentLength(composingText);
        this.rangeManager.setRange({
          start: newRangeStart,
          end: newRangeStart,
        });
        this.editor.render();
      }
    });

    inputDom.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.inactive();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        const textGraphics = this.textGraphics;
        if (!textGraphics) return;
        if (!textGraphics.attrs.content) return;

        let { rangeLeft, rangeRight } = this.rangeManager.getSortedRange();
        const isSelected = rangeLeft !== rangeRight;

        if (!isSelected) {
          rangeLeft = e.key === 'Backspace' ? rangeLeft - 1 : rangeLeft;
          rangeRight = e.key === 'Backspace' ? rangeRight : rangeRight + 1;
        }

        const content = textGraphics.attrs.content;
        const leftContent = sliceContent(content, 0, rangeLeft);
        const rightContent = sliceContent(content, rangeRight);
        const newContent = leftContent + rightContent;
        TextEditor.updateTextContentAndResize(textGraphics, newContent);

        if (isSelected) {
          this.rangeManager.setRange({
            start: rangeLeft,
            end: rangeLeft,
          });
        } else if (e.key === 'Backspace') {
          this.rangeManager.moveLeft();
        }
        this.editor.render();
      } else if (e.key === 'ArrowLeft') {
        if (e.isComposing) return;

        if (e.shiftKey) {
          this.rangeManager.moveRangeEnd(-1);
        } else {
          this.rangeManager.moveLeft();
        }
        this.editor.render();
      } else if (e.key === 'ArrowRight') {
        if (e.isComposing) return;

        if (e.shiftKey) {
          this.rangeManager.moveRangeEnd(1);
        } else {
          this.rangeManager.moveRight();
        }
        this.editor.render();
      }
      // select all
      else if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
        if (this.textGraphics) {
          this.rangeManager.setRange({
            start: 0,
            end: this.textGraphics.getContentLength(),
          });
          this.editor.render();
        }
      }
      // copy
      else if (e.key === 'c' && (e.metaKey || e.ctrlKey)) {
        if (!this.textGraphics) return;
        const { rangeLeft, rangeRight } = this.rangeManager.getSortedRange();
        const content = sliceContent(
          this.textGraphics.attrs.content,
          rangeLeft,
          rangeRight,
        );

        if (content) {
          navigator.clipboard.writeText(content);
        }
      }
      // cut
      else if (e.key === 'x' && (e.metaKey || e.ctrlKey)) {
        if (!this.textGraphics) return;
        const { rangeLeft, rangeRight } = this.rangeManager.getSortedRange();
        const content = sliceContent(
          this.textGraphics.attrs.content,
          rangeLeft,
          rangeRight,
        );
        if (content) {
          navigator.clipboard.writeText(content);
        }

        const newContent =
          sliceContent(this.textGraphics.attrs.content, 0, rangeLeft) +
          sliceContent(this.textGraphics.attrs.content, rangeRight);
        TextEditor.updateTextContentAndResize(this.textGraphics, newContent);

        this.rangeManager.setRange({
          start: rangeLeft,
          end: rangeLeft,
        });
        this.editor.render();
      }
    });
    inputDom.addEventListener('blur', () => {
      this.inactive();
    });

    inputDom.addEventListener('compositionend', () => {
      composingText = '';
      leftContentWhenComposing = '';
      rightContentWhenComposing = '';
    });

    /****** bind mouse events *******/

    // set text editor cursor line
    const onStart = (event: IMousemoveEvent) => {
      if (
        !this.isActive() ||
        this.editor.canvasDragger.isActive() ||
        !this.textGraphics
      )
        return;

      const mousePt = event.pos;

      if (!this.textGraphics.hitTest(mousePt)) return;
      event.nativeEvent.preventDefault();

      const cursorIndex = this.textGraphics.getCursorIndex(mousePt);
      this.rangeManager.setRange({
        start: cursorIndex,
        end: cursorIndex,
      });
      this.editor.render();
    };

    // select range end by mouse drag
    const onDrag = (event: IMousemoveEvent) => {
      if (
        !this.isActive() ||
        this.editor.canvasDragger.isActive() ||
        !this.textGraphics
      ) {
        return;
      }

      const mousePt = event.pos;
      const cursorIndex = this.textGraphics.getCursorIndex(mousePt);
      this.rangeManager.setRangeEnd(cursorIndex);
      this.editor.render();
    };

    // update cursor
    const onUpdateCursor = (event: IMousemoveEvent) => {
      this.updateCursor(event.pos);
    };

    this.editor.mouseEventManager.on('start', onStart);
    this.editor.mouseEventManager.on('drag', onDrag);
    this.editor.mouseEventManager.on('move', onUpdateCursor);
    this.editor.mouseEventManager.on('end', onUpdateCursor);
    // TODO: remove listener when text editor destroy
  }

  updateCursor(mousePt: IPoint) {
    if (!this.isActive() || !this.textGraphics) return;
    if (this.textGraphics.hitTest(mousePt)) {
      this.editor.cursorManager.setCursor('text');
    } else {
      this.editor.cursorManager.setCursor('default');
    }
  }

  destroy() {
    this.inputDom.remove();
    this._active = false;
  }

  drawRange(drawInfo: IDrawInfo) {
    if (!this.isActive()) return;

    const textGraphics = this.textGraphics;
    if (!textGraphics) return;

    const editor = this.editor;

    const zoom = editor.viewportManager.getZoom();
    const lineHeight = textGraphics.getActualLineHeight();
    const inputDomHeight = lineHeight * zoom;

    const { topInViewport, bottomInViewport, rightInViewport } =
      this.rangeManager.getCursorLinePos(textGraphics);

    const canvasOffsetX = editor.setting.get('offsetX');
    const canvasOffsetY = editor.setting.get('offsetY');

    const styles = {
      left: bottomInViewport.x + canvasOffsetX + 'px',
      top: bottomInViewport.y - inputDomHeight + canvasOffsetY + 'px',
      height: `${inputDomHeight}px`,
      fontSize: `${inputDomHeight}px`,
    } as const;
    Object.assign(this.inputDom.style, styles);

    this.rangeManager.draw(
      drawInfo,
      topInViewport,
      bottomInViewport,
      rightInViewport,
    );
  }
}
