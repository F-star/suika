import { cloneDeep, getContentLength, sliceContent } from '@suika/common';
import { type IPoint } from '@suika/geo';

import { type SuikaEditor } from '../editor';
import { type IDrawInfo, SuikaText, type TextAttrs } from '../graphics';
import { type IMousemoveEvent } from '../host_event_manager';
import { removeGraphicsAndRecord } from '../service/remove_service';
import { Transaction } from '../transaction';
import { type ISelection, SelectionManager } from './selection_manager';

const defaultInputStyle = {
  position: 'fixed',
  width: '1px',
  zIndex: '-1',
  margin: 0,
  padding: 0,
  border: 0,
  outline: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  opacity: 0,
} as const;

export class TextEditor {
  private inputDom: HTMLTextAreaElement;
  private textGraphics: SuikaText | null = null;
  private selectionManager: SelectionManager;
  private _active = false;
  private transaction!: Transaction;

  constructor(private editor: SuikaEditor) {
    this.selectionManager = new SelectionManager(editor);

    this.inputDom = this.createInputDom();
    this.inactive();
    this.bindEvent();

    editor.containerElement.appendChild(this.inputDom);
  }

  private createInputDom() {
    const inputDom = document.createElement('textarea');
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

  active(params: {
    textGraphics?: SuikaText;
    pos?: IPoint;
    selection?: ISelection;
  }) {
    this._active = true;
    this.inputDom.value = '';
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
          fill: [cloneDeep(this.editor.setting.get('firstTextFill'))],
          lineHeight: { value: 1, units: 'RAW' },
          letterSpacing: { value: 0, units: 'PERCENT' },
          autoFit: true,
          textAutoResize: 'WIDTH_AND_HEIGHT',
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
      height: textGraphics!.attrs.height,
    });

    if (params.selection) {
      this.selectionManager.setSelection(params.selection);
    } else {
      this.selectAll();
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
          height: this.textGraphics.attrs.height,
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

  selectAll() {
    if (!this.textGraphics) return;
    const maxPosition = this.textGraphics.paragraph.getMaxPosition();
    this.selectionManager.setSelection({
      anchorLineNum: 0,
      anchorColumn: 0,
      focusLineNum: maxPosition.lineNum,
      focusColumn: maxPosition.column,
    });
  }

  private bindEvent() {
    let composingText = '';
    let leftContentWhenComposing = '';
    let rightContentWhenComposing = '';

    const inputDom = this.inputDom;

    const updateContent = (params: {
      isComposing: boolean;
      data: string;
      selection: ISelection;
    }) => {
      const textGraphics = this.textGraphics;
      if (!textGraphics) return;

      // selection 转为 logic
      const rangeLeft = textGraphics.paragraph.getOffsetAt({
        column: params.selection.anchorColumn,
        lineNum: params.selection.anchorLineNum,
      });

      const rangeRight = textGraphics.paragraph.getOffsetAt({
        column: params.selection.focusColumn,
        lineNum: params.selection.focusLineNum,
      });

      if (params.isComposing) {
        if (!composingText) {
          const content = textGraphics.attrs.content;
          leftContentWhenComposing = sliceContent(content, 0, rangeLeft);
          rightContentWhenComposing = sliceContent(content, rangeRight);
        }
        composingText = params.data ?? '';
      } else {
        composingText = '';
        leftContentWhenComposing = '';
        rightContentWhenComposing = '';
      }
      // Not IME input, directly add to textGraphics
      if (!params.isComposing && params.data != undefined) {
        const content = textGraphics.attrs.content;
        const newContent =
          sliceContent(content, 0, rangeLeft) +
          params.data +
          sliceContent(content, rangeRight);

        TextEditor.updateTextContentAndResize(textGraphics, newContent);
        const dataLength = getContentLength(params.data);

        const position = textGraphics.paragraph.getPositionAt(
          rangeLeft + dataLength,
          'upstream',
        );

        this.selectionManager.setSelection({
          anchorLineNum: position.lineNum,
          anchorColumn: position.column,
          focusLineNum: position.lineNum,
          focusColumn: position.column,
        });
        this.editor.render();
      } else if (params.isComposing) {
        const newContent =
          leftContentWhenComposing + composingText + rightContentWhenComposing;
        TextEditor.updateTextContentAndResize(textGraphics, newContent);
        const newRangeStart =
          getContentLength(leftContentWhenComposing) +
          getContentLength(composingText);

        const position = textGraphics.paragraph.getPositionAt(
          newRangeStart,
          'upstream',
        );

        this.selectionManager.setSelection({
          anchorLineNum: position.lineNum,
          anchorColumn: position.column,
          focusLineNum: position.lineNum,
          focusColumn: position.column,
        });
        this.editor.render();
      }
    };

    inputDom.addEventListener('input', (_e) => {
      const e = _e as InputEvent;
      const selection = this.selectionManager.getSelection();

      updateContent({
        isComposing: e.isComposing,
        data: e.data ?? '',
        selection,
      });
    });

    inputDom.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.inactive();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        const textGraphics = this.textGraphics;
        if (!textGraphics) return;
        if (!textGraphics.attrs.content) return;
        const range = this.selectionManager.getSortedSelectionRange();
        const isCollapsed = this.selectionManager.isCollapsed();

        if (isCollapsed) {
          if (range.startColumn === 0 && range.startLineNum === 0) {
            return;
          }

          const offset = textGraphics.paragraph.getOffsetAt({
            column: range.startColumn,
            lineNum: range.startLineNum,
          });
          const leftPosition = textGraphics.paragraph.getPositionAt(offset - 1);
          updateContent({
            isComposing: false,
            data: '',
            selection: {
              anchorLineNum: leftPosition.lineNum,
              anchorColumn: leftPosition.column,
              focusColumn: range.endColumn,
              focusLineNum: range.endLineNum,
            },
          });
        } else {
          updateContent({
            isComposing: false,
            data: '',
            selection: {
              anchorLineNum: range.startLineNum,
              anchorColumn: range.startColumn,
              focusLineNum: range.endLineNum,
              focusColumn: range.endColumn,
            },
          });
        }
        this.editor.render();
      } else if (e.key === 'ArrowLeft') {
        if (e.isComposing) return;
        this.selectionManager.moveLeft(e.shiftKey);
        this.editor.render();
      } else if (e.key === 'ArrowRight') {
        if (e.isComposing) return;
        this.selectionManager.moveRight(e.shiftKey);
        this.editor.render();
      } else if (e.key === 'ArrowUp') {
        if (e.isComposing) return;
        const isRangeSelect = e.shiftKey;
        this.selectionManager.moveUp(isRangeSelect);
        this.editor.render();
      } else if (e.key === 'ArrowDown') {
        if (e.isComposing) return;
        const isRangeSelect = e.shiftKey;
        this.selectionManager.moveDown(isRangeSelect);
        this.editor.render();
      }
      // select all
      else if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
        if (this.textGraphics) {
          this.selectAll();
          this.editor.render();
        }
      }
      // copy
      else if (e.key === 'c' && (e.metaKey || e.ctrlKey)) {
        if (!this.textGraphics) return;
        const left = this.textGraphics.paragraph.getOffsetAt(
          this.selectionManager.getStartPosition(),
        );
        const right = this.textGraphics.paragraph.getOffsetAt(
          this.selectionManager.getEndPosition(),
        );
        const content = sliceContent(
          this.textGraphics.attrs.content,
          left,
          right,
        );

        if (content) {
          navigator.clipboard.writeText(content);
        }
      }
      // cut
      else if (e.key === 'x' && (e.metaKey || e.ctrlKey)) {
        if (!this.textGraphics) return;

        const startPosition = this.selectionManager.getStartPosition();
        const endPosition = this.selectionManager.getEndPosition();
        const left = this.textGraphics.paragraph.getOffsetAt(startPosition);
        const right = this.textGraphics.paragraph.getOffsetAt(endPosition);
        const content = sliceContent(
          this.textGraphics.attrs.content,
          left,
          right,
        );
        if (content) {
          navigator.clipboard.writeText(content);
        }

        const newContent =
          sliceContent(this.textGraphics.attrs.content, 0, left) +
          sliceContent(this.textGraphics.attrs.content, right);
        TextEditor.updateTextContentAndResize(this.textGraphics, newContent);

        this.selectionManager.setSelection({
          anchorLineNum: startPosition.lineNum,
          anchorColumn: startPosition.column,
          focusLineNum: startPosition.lineNum,
          focusColumn: startPosition.column,
        });
        this.editor.render();
      }
      // input '\n'
      else if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault(); // prevent default new line behavior of textarea
        const selection = this.selectionManager.getSelection();
        updateContent({
          isComposing: false,
          data: '\n',
          selection,
        });
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

      const selection = this.textGraphics.getCursorIndex(mousePt);
      this.selectionManager.setSelection({
        anchorLineNum: selection.lineNum,
        anchorColumn: selection.column,
        focusLineNum: selection.lineNum,
        focusColumn: selection.column,
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
      const selection = this.textGraphics.getCursorIndex(mousePt);
      this.selectionManager.setSelection({
        focusLineNum: selection.lineNum,
        focusColumn: selection.column,
      });
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

    const canvasOffsetX = editor.setting.get('offsetX');
    const canvasOffsetY = editor.setting.get('offsetY');
    const zoom = editor.viewportManager.getZoom();
    const lineHeight = textGraphics.getActualLineHeight();
    const inputDomHeight = lineHeight * zoom;

    const { rects, matrix } =
      this.selectionManager.getCursorLinePos(textGraphics);

    // the top position of the left vertical line of the first glyph
    const firstGlyphBottom = matrix.apply({
      x: rects[0].x,
      y: rects[0].y,
    });

    const styles = {
      left: firstGlyphBottom.x + canvasOffsetX + 'px',
      top: firstGlyphBottom.y - inputDomHeight + canvasOffsetY + 'px',
      height: `${inputDomHeight}px`,
      fontSize: `${inputDomHeight}px`,
    } as const;
    Object.assign(this.inputDom.style, styles);

    this.selectionManager.draw(drawInfo, rects, matrix);
  }
}
