import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../context';
import { IPoint } from '../../type.interface';
import ContextMenuItem from './components/ContextMenuItem';
import ContextMenuSep from './components/ContextMenuSep';
import './ContextMenu.scss';

const OFFSET_X = 2;
const OFFSET_Y = -5;

export const ContextMenu: FC = () => {
  const editor = useContext(EditorContext);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (editor) {
      // 监听 editor 的 contextmenu 事件
      const handler = (pos: IPoint) => {
        if (!visible) {
          setVisible(true);
          setPos(pos);
        }
      };
      editor.hostEventManager.on('contextmenu', handler);
      return () => {
        editor.hostEventManager.off('contextmenu', handler);
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
        <ContextMenuItem
          onClick={() => {
            setVisible(false);
            if (editor) {
              editor.commandManager.undo();
            }
          }}
        >
          Undo
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            setVisible(false);
            if (editor) {
              editor.commandManager.redo();
            }
          }}
        >
          Redo
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
          onClick={() => {
            setVisible(false);
            if (editor) {
              editor.selectedElements.removeFromScene();
            }
          }}
        >
          Delete
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
        {editor && !editor.selectedElements.isEmpty() && renderSelectContextMenu()}
      </div>
    </div>
  );
};
