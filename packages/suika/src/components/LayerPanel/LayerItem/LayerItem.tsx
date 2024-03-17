import './LayerItem.scss';

import {
  HideOutlined,
  LockFilled,
  ShowOutlined,
  UnlockFilled,
} from '@suika/icons';
import classNames from 'classnames';
import { type FC, useEffect, useRef, useState } from 'react';

import { type IObject } from '../../../type';
import { type IBaseEvents } from './type';

interface IProps extends IBaseEvents {
  id: string;
  name: string;
  children?: IObject[];
  active?: boolean;
  level?: number;
  activeIds?: string[];
  hlId?: string;
  visible: boolean;
  lock: boolean;
}

const LayerItem: FC<IProps> = ({
  name,
  children,
  active = false,
  id,
  activeIds = [],
  level = 0,
  hlId,
  visible,
  lock,
  toggleVisible,
  toggleLock,
  setHlId,
  setName,
  setSelectedGraph,
}) => {
  const indentWidth = level * 16;
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

  const isHl = hlId === id;

  return (
    <>
      <div
        className={classNames('sk-layer-item', {
          'sk-active': active,
          'sk-hidden': !visible,
          'sk-hover': isHl,
          'sk-editing': isEditing,
        })}
        onMouseDown={(e) => {
          setSelectedGraph && setSelectedGraph(id, e);
        }}
        onMouseEnter={() => {
          setHlId && setHlId(id);
        }}
        onMouseLeave={() => {
          setHlId && setHlId('');
        }}
        onDoubleClick={handleDbClick}
      >
        <div style={{ width: indentWidth, minWidth: indentWidth }} />
        {!isEditing && (
          <span key={'span'} className="sk-layout-name">
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
        {/* icon button area */}
        <div
          className="sk-layer-item-actions"
          onMouseDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          {/* lock button */}
          <span
            className="sk-action-btn"
            style={{
              visibility: lock ? 'visible' : undefined,
            }}
            onMouseDown={() => {
              toggleLock(id);
            }}
          >
            {lock ? <LockFilled /> : <UnlockFilled />}
          </span>

          {/* visible button */}
          {/* 
            1. default hide icon when visible
            2. show icon when invisible
            3. but always show when hovering
          */}
          <span
            className="sk-action-btn"
            style={{
              visibility: !visible ? 'visible' : undefined,
            }}
            onMouseDown={() => {
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
              hlId={hlId}
              visible={item.visible}
              lock={item.lock}
              setName={setName}
              toggleVisible={toggleVisible}
              toggleLock={toggleLock}
              setHlId={setHlId}
              setSelectedGraph={setSelectedGraph}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default LayerItem;
