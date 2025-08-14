import './ContextMenu.scss';

import { type IPoint } from '@suika/geo';
import { type FC, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import ContextMenuItem from './components/ContextMenuItem';

const OFFSET_X = 2;
const OFFSET_Y = -5;
const MENU_SPACE_PADDING = 60;

type IProps = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  pos: IPoint;
  disabledDelete: boolean;
  style?: React.CSSProperties;
  onDelete: () => void;
};

export const PageContextMenu: FC<IProps> = ({
  visible,
  setVisible,
  pos,
  disabledDelete,
  style,
  onDelete,
}) => {
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

  /**
   * contextmenu part showed anyway
   */
  const renderNoSelectContextMenu = () => {
    return (
      <>
        <ContextMenuItem
          disabled={disabledDelete}
          onClick={() => {
            setVisible(false);
            onDelete();
          }}
        >
          <FormattedMessage id="page.delete" />
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
          ...style,
          display: visible ? undefined : 'none',
          ...calculateMenuPosition(),
        }}
      >
        {renderNoSelectContextMenu()}
      </div>
    </div>
  );
};
