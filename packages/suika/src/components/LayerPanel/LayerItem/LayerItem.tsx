import classNames from 'classnames';
import { FC, useRef, useState } from 'react';
import './LayerItem.scss';
import {
  HideOutlined,
  // LockFilled,
  ShowOutlined,
  // UnlockFilled,
} from '@suika/icons';

interface IProps {
  id: string;
  name: string;
  children?: IProps[];
  active?: boolean;
  level?: number;
  activeIds?: string[];
  hoverId?: string;
  visible?: boolean;
  toggleVisible?: (id: string) => void;
  setHoverId?: (id: string) => void;
  setName?: (id: string, newName: string) => void;
  setSelectedGraph?: (
    objId: string,
    event: React.MouseEvent<Element, MouseEvent>,
  ) => void;
}

const LayerItem: FC<IProps> = ({
  name,
  children,
  active = false,
  id,
  activeIds = [],
  level = 0,
  hoverId,
  visible = true,
  toggleVisible,
  setHoverId,
  setName,
  setSelectedGraph,
}) => {
  const indentWidth = level * 16;
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setName && setName(id, inputVal);
    }
    setIsEditing(false);
  };

  const isHover = hoverId === id;
  // const lock = false;

  return (
    <>
      <div
        className={classNames('sk-layer-item', {
          'sk-active': active,
          'sk-hidden': !visible,
          'sk-hover': isHover,
          'sk-editing': isEditing,
        })}
        onMouseDown={(e) => {
          setSelectedGraph && setSelectedGraph(id, e);
        }}
        onMouseEnter={() => {
          // TODO: setHoverId when mouse enter
          // setHoverId && setHoverId(id);
        }}
        onDoubleClick={handleDbClick}
      >
        <div style={{ width: indentWidth, minWidth: indentWidth }} />
        {!isEditing && (
          <span key={'span'} className="sk-layout-name">
            {name}
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
        {/* icon area */}
        <div
          className="sk-layer-item-actions"
          onMouseDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          {/* lock icon */}
          {/* <span
            className="sk-action-btn"
            style={{
              display: lock ? 'block' : undefined,
            }}
            onClick={() => {
              //
            }}
          >
            {visible ? <LockFilled /> : <UnlockFilled />}
          </span> */}

          {/* visible icon */}
          {/* 
            1. default hide icon when visible
            2. show icon when invisible
            3. but always show when hovering
          */}
          <span
            className="sk-action-btn"
            style={{
              display: !visible ? 'block' : undefined,
            }}
            onClick={() => {
              toggleVisible && toggleVisible(id);
            }}
          >
            {visible ? <ShowOutlined /> : <HideOutlined />}
          </span>
        </div>
      </div>
      {children && (
        <div className="layer-item-children">
          {[...children].reverse().map((item) => (
            <LayerItem
              key={item.id}
              id={item.id}
              name={item.name}
              active={activeIds.includes(item.id)}
              level={level + 1}
              children={item.children}
              activeIds={activeIds}
              hoverId={hoverId}
              visible={item.visible}
              toggleVisible={toggleVisible}
              setHoverId={setHoverId}
              setSelectedGraph={setSelectedGraph}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default LayerItem;
