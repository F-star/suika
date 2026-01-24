import './PageItem.scss';

import { CheckOutlined } from '@suika/icons';
import classNames from 'classnames';
import { type FC, useEffect, useRef, useState } from 'react';

interface IProps {
  id: string;
  name: string;
  activeId: string;

  /** set highlight id */
  setName: (id: string, newName: string) => void;
  setSelectedGraph: (
    objId: string,
    event: React.MouseEvent<Element, MouseEvent>,
  ) => void;

  onContextMenu: (e: React.MouseEvent<Element, MouseEvent>, id: string) => void;
}

export const PageItem: FC<IProps> = ({
  name,
  id,
  activeId,

  setName,
  setSelectedGraph,
  onContextMenu,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [layoutName, setLayoutName] = useState(name);

  useEffect(() => {
    setLayoutName(name);
  }, [name]);

  const handleDbClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      const inputEl = inputRef.current;
      if (inputEl) {
        inputEl.value = name;
        inputEl.select();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.currentTarget.blur();
    }
  };

  const handleBlur = () => {
    const inputVal = inputRef.current?.value;
    if (inputVal) {
      if (setName) {
        setName(id, inputVal);
        setLayoutName(inputVal);
      }
    }
    setIsEditing(false);
  };

  return (
    <>
      <div
        className={classNames('sk-page-item', {
          'sk-editing': isEditing,
        })}
        onMouseDown={(e) => {
          // only left click
          if (e.button !== 0) return;
          setSelectedGraph && setSelectedGraph(id, e);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(e, id);
        }}
      >
        <div className="sk-layer-icon" style={{ marginLeft: 20 }}>
          {activeId === id && <CheckOutlined />}
        </div>
        {!isEditing && (
          <span
            key={'span'}
            className="sk-layout-name"
            onDoubleClick={handleDbClick}
          >
            {layoutName}
          </span>
        )}
        {isEditing && (
          <input
            ref={inputRef}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
        )}
      </div>
    </>
  );
};
