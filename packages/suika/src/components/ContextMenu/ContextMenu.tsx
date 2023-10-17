import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../context';
import { ArrangeType } from '../../editor/commands/arrange';
import { IPoint } from '../../type';
import ContextMenuItem from './components/ContextMenuItem';
import ContextMenuSep from './components/ContextMenuSep';
import './ContextMenu.scss';
import { FormattedMessage } from 'react-intl';
import { IHistoryStatus } from '../../editor/commands/command_manager';
import { isWindows } from '../../utils/common';
import { MutateGraphsAndRecord } from '../../editor/service/mutate_graphs_and_record';

const OFFSET_X = 2;
const OFFSET_Y = -5;

export const ContextMenu: FC = () => {
  const editor = useContext(EditorContext);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [canRedo, setCanRedo] = useState(false);
  const [canUndo, setCanUdo] = useState(false);
  const [showCopy, setShowCopy] = useState(false);

  useEffect(() => {
    if (editor) {
      // 监听 editor 的 contextmenu 事件
      const handleContextmenu = (pos: IPoint) => {
        if (!visible) {
          setShowCopy(
            editor.sceneGraph.isPointInSelectedBox(
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
   * without select elements
   */
  const renderNoSelectContextMenu = () => {
    return (
      <>
        {showCopy && (
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
      </>
    );
  };

  /**
   * without select elements
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
              editor.selectedElements.group();
            }
          }}
        >
          <FormattedMessage id="group" />
        </ContextMenuItem>
        <ContextMenuSep />
        <ContextMenuItem
          suffix={isWindows ? 'Ctrl+]' : '⌘]'}
          onClick={() => {
            setVisible(false);
            if (editor) {
              editor.selectedElements.arrange(ArrangeType.Forward);
            }
          }}
        >
          <FormattedMessage id="arrange.forward" />
        </ContextMenuItem>
        <ContextMenuItem
          suffix={isWindows ? 'Ctrl+[' : '⌘['}
          onClick={() => {
            setVisible(false);
            if (editor) {
              editor.selectedElements.arrange(ArrangeType.Backward);
            }
          }}
        >
          <FormattedMessage id="arrange.backward" />
        </ContextMenuItem>
        <ContextMenuItem
          suffix="]"
          onClick={() => {
            setVisible(false);
            if (editor) {
              editor.selectedElements.arrange(ArrangeType.Front);
            }
          }}
        >
          <FormattedMessage id="arrange.front" />
        </ContextMenuItem>
        <ContextMenuItem
          suffix="["
          onClick={() => {
            setVisible(false);
            if (editor) {
              editor.selectedElements.arrange(ArrangeType.Back);
            }
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
              editor.sceneGraph.render();
            }
          }}
        >
          <FormattedMessage id="showOrHide" />
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
        className="suika-context-menu"
        style={{
          display: visible ? undefined : 'none',
          left: pos.x + OFFSET_X,
          top: pos.y + OFFSET_Y,
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
