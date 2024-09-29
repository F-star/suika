import './ContextMenu.scss';

import { isWindows } from '@suika/common';
import {
  arrangeAndRecord,
  ArrangeType,
  flipHorizontalAndRecord,
  flipVerticalAndRecord,
  groupAndRecord,
  type IHistoryStatus,
  MutateGraphsAndRecord,
  ungroupAndRecord,
} from '@suika/core';
import { type IPoint } from '@suika/geo';
import {
  type FC,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { FormattedMessage } from 'react-intl';

import { EditorContext } from '../../context';
import ContextMenuItem from './components/ContextMenuItem';
import ContextMenuSep from './components/ContextMenuSep';

const OFFSET_X = 2;
const OFFSET_Y = -5;
const MENU_SPACE_PADDING = 60;

export const ContextMenu: FC = () => {
  const editor = useContext(EditorContext);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [canRedo, setCanRedo] = useState(false);
  const [canUndo, setCanUdo] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const [menuSize, setMenuSize] = useState({ width: 0, height: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // avoid the right-click menu goes off the screen
  const calculateMenuPosition = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = pos.x + OFFSET_X;
    let top = pos.y + OFFSET_Y;

    if (left + menuSize.width > viewportWidth) {
      left = pos.x - menuSize.width - OFFSET_X;
    }

    if (top < MENU_SPACE_PADDING) {
      top = MENU_SPACE_PADDING;
    } else if (pos.y + menuSize.height + MENU_SPACE_PADDING > viewportHeight) {
      top = viewportHeight - MENU_SPACE_PADDING - menuSize.height;
    }

    return { left, top };
  }, [pos.x, pos.y, menuSize]);

  useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      setMenuSize({ width: rect.width, height: rect.height });
    }
  }, [visible]);

  useEffect(() => {
    if (editor) {
      // 监听 editor 的 contextmenu 事件
      const handleContextmenu = (pos: IPoint) => {
        if (!visible) {
          setShowCopy(
            editor.selectedBox.hitTest(
              editor.getSceneCursorXY({
                clientX: pos.x,
                clientY: pos.y,
              }),
            ),
          );
          setVisible(true);
          setPos(pos);
        }
      };
      editor.hostEventManager.on('contextmenu', handleContextmenu);

      const handleCommandChange = (status: IHistoryStatus) => {
        setCanRedo(status.canRedo);
        setCanUdo(status.canUndo);
      };
      editor.commandManager.on('change', handleCommandChange);
      return () => {
        editor.hostEventManager.off('contextmenu', handleContextmenu);
        editor.commandManager.off('change', handleCommandChange);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  /**
   * contextmenu part showed anyway
   */
  const renderNoSelectContextMenu = () => {
    return (
      <>
        {showCopy && (
          <>
            <ContextMenuItem
              suffix={isWindows ? 'Ctrl+C' : '⌘C'}
              onClick={() => {
                setVisible(false);
                if (editor) {
                  editor.clipboard.copy();
                }
              }}
            >
              <FormattedMessage id="command.copy" />
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                setVisible(false);
                if (editor) {
                  editor.clipboard.copyAsSVG();
                }
              }}
            >
              <FormattedMessage id="command.copyAsSVG" />
            </ContextMenuItem>
          </>
        )}
        <ContextMenuItem
          onClick={() => {
            setVisible(false);
            if (editor) {
              const scenePos = editor.getSceneCursorXY(
                {
                  clientX: pos.x,
                  clientY: pos.y,
                },
                true,
              );
              editor.clipboard.pasteAt(scenePos.x, scenePos.y);
            }
          }}
        >
          <FormattedMessage id="command.pasteHere" />
        </ContextMenuItem>
        <ContextMenuSep />
        <ContextMenuItem
          suffix={isWindows ? 'Ctrl+Z' : '⌘Z'}
          disabled={!canUndo}
          onClick={() => {
            setVisible(false);
            if (editor) {
              editor.commandManager.undo();
            }
          }}
        >
          <FormattedMessage id="command.undo" />
        </ContextMenuItem>
        <ContextMenuItem
          suffix={isWindows ? 'Ctrl+Shift+Z' : '⇧⌘Z'}
          disabled={!canRedo}
          onClick={() => {
            setVisible(false);
            if (editor) {
              editor.commandManager.redo();
            }
          }}
        >
          <FormattedMessage id="command.redo" />
        </ContextMenuItem>
        <ContextMenuSep />
        <ContextMenuItem
          suffix={isWindows ? 'Ctrl+A' : '⌘A'}
          onClick={() => {
            setVisible(false);
            if (editor) {
              editor.selectedElements.selectAll();
              editor.render();
            }
          }}
        >
          <FormattedMessage id="command.selectAll" />
        </ContextMenuItem>
      </>
    );
  };

  /**
   * with select elements
   */
  const renderSelectContextMenu = () => {
    return (
      <>
        <ContextMenuSep />
        <ContextMenuItem
          suffix={isWindows ? 'Ctrl+G' : '⌘G'}
          onClick={() => {
            setVisible(false);
            if (editor) {
              groupAndRecord(editor.selectedElements.getItems(), editor);
            }
          }}
        >
          <FormattedMessage id="group" />
        </ContextMenuItem>
        <ContextMenuItem
          suffix={isWindows ? 'Ctrl+Backspace' : '⌘⌫'}
          onClick={() => {
            setVisible(false);
            if (editor) {
              ungroupAndRecord(editor.selectedElements.getItems(), editor);
            }
          }}
        >
          <FormattedMessage id="ungroup" />
        </ContextMenuItem>
        <ContextMenuSep />
        <ContextMenuItem
          suffix={isWindows ? 'Ctrl+]' : '⌘]'}
          onClick={() => {
            setVisible(false);
            editor && arrangeAndRecord(editor, ArrangeType.Forward);
          }}
        >
          <FormattedMessage id="arrange.forward" />
        </ContextMenuItem>
        <ContextMenuItem
          suffix={isWindows ? 'Ctrl+[' : '⌘['}
          onClick={() => {
            setVisible(false);
            editor && arrangeAndRecord(editor, ArrangeType.Backward);
          }}
        >
          <FormattedMessage id="arrange.backward" />
        </ContextMenuItem>
        <ContextMenuItem
          suffix="]"
          onClick={() => {
            setVisible(false);
            editor && arrangeAndRecord(editor, ArrangeType.Front);
          }}
        >
          <FormattedMessage id="arrange.front" />
        </ContextMenuItem>
        <ContextMenuItem
          suffix="["
          onClick={() => {
            setVisible(false);
            editor && arrangeAndRecord(editor, ArrangeType.Back);
          }}
        >
          <FormattedMessage id="arrange.back" />
        </ContextMenuItem>

        <ContextMenuSep />
        <ContextMenuItem
          suffix={isWindows ? 'Ctrl+Shift+H' : '⇧⌘H'}
          onClick={() => {
            setVisible(false);
            if (editor) {
              MutateGraphsAndRecord.toggleVisible(
                editor,
                editor.selectedElements.getItems(),
              );
              editor.render();
            }
          }}
        >
          <FormattedMessage id="showOrHide" />
        </ContextMenuItem>
        {/* lock/unlock */}
        <ContextMenuItem
          suffix={isWindows ? 'Ctrl+Shift+L' : '⇧⌘L'}
          onClick={() => {
            setVisible(false);
            if (editor) {
              MutateGraphsAndRecord.toggleLock(
                editor,
                editor.selectedElements.getItems(),
              );
              editor.render();
            }
          }}
        >
          <FormattedMessage id="lockOrUnlock" />
        </ContextMenuItem>
        <ContextMenuSep />
        {/* flipHorizontal */}
        <ContextMenuItem
          suffix={isWindows ? 'Shift+H' : '⇧H'}
          onClick={() => {
            setVisible(false);
            if (editor) {
              flipHorizontalAndRecord(
                editor,
                editor.selectedElements.getItems(),
              );
              editor.render();
            }
          }}
        >
          <FormattedMessage id="flip.horizontal" />
        </ContextMenuItem>
        {/* flipVertical */}
        <ContextMenuItem
          suffix={isWindows ? 'Shift+V' : '⇧V'}
          onClick={() => {
            setVisible(false);
            if (editor) {
              flipVerticalAndRecord(editor, editor.selectedElements.getItems());
              editor.render();
            }
          }}
        >
          <FormattedMessage id="flip.vertical" />
        </ContextMenuItem>
        <ContextMenuSep />
        <ContextMenuItem
          suffix={isWindows ? 'Backspace' : '⌫'}
          onClick={() => {
            setVisible(false);
            if (editor) {
              editor.selectedElements.removeFromScene();
            }
          }}
        >
          <FormattedMessage id="delete" />
        </ContextMenuItem>
      </>
    );
  };

  return (
    <div onContextMenu={(e) => e.preventDefault()}>
      {visible && (
        <div
          className="suika-context-menu-mask"
          onMouseDown={() => {
            setVisible(false);
          }}
        />
      )}
      <div
        ref={menuRef}
        className="suika-context-menu"
        style={{
          display: visible ? undefined : 'none',
          ...calculateMenuPosition(),
        }}
      >
        {renderNoSelectContextMenu()}
        {editor &&
          !editor.selectedElements.isEmpty() &&
          renderSelectContextMenu()}
      </div>
    </div>
  );
};
