import './LayerItem.scss';

import {
  HideOutlined,
  LockFilled,
  PointSolid,
  ShowOutlined,
  SmallCaretDownSolid,
  UnlockFilled,
} from '@suika/icons';
import { useDebounceEffect } from 'ahooks';
import classNames from 'classnames';
import { type FC, useEffect, useRef, useState } from 'react';

import { LayerIcon } from './LayerIcon';
import { type IBaseEvents } from './type';

interface IProps extends IBaseEvents {
  id: string;
  type: string;
  name: string;
  hasChildren: boolean;
  isExpanded: boolean;
  toggleExpanded: (id: string) => void;
  active?: boolean;
  activeSecond?: boolean;
  level?: number;
  hlId?: string;
  visible: boolean;
  visibleSecond?: boolean;
  lock: boolean;
  lockSecond?: boolean;
}

const LayerItem: FC<IProps> = ({
  name,
  hasChildren,
  isExpanded,
  toggleExpanded,
  active = false,
  activeSecond = false,
  id,
  type,
  level = 0,
  hlId,
  visible,
  visibleSecond = true,
  lock,
  lockSecond = false,
  toggleVisible,
  toggleLock,
  setHlId,
  setName,
  setSelectedGraph,
  getLayerIcon,
  zoomGraphicsToFit,
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

  const finalVisible = visible && visibleSecond;
  const finalLock = lock || lockSecond;

  const [layerIcon, setLayerIcon] = useState('');

  useDebounceEffect(
    () => {
      setLayerIcon(getLayerIcon(id));
    },
    [getLayerIcon, id],
    {
      wait: 300,
      leading: true,
    },
  );

  return (
    <>
      <div
        className={classNames('sk-layer-item', {
          'sk-active': active,
          'sk-active-second': active ? false : activeSecond,
          'sk-hidden': !finalVisible,
          'sk-layer-highlight': isHl,
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
      >
        <div style={{ width: indentWidth, minWidth: indentWidth }} />
        <button
          className={classNames('sk-group-collapse-btn', {
            'sk-collapsed': !isExpanded,
          })}
          type="button"
          aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
          aria-expanded={hasChildren ? isExpanded : undefined}
          disabled={!hasChildren}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => toggleExpanded(id)}
        >
          {hasChildren && <SmallCaretDownSolid />}
        </button>
        <div
          className="sk-layer-icon"
          onDoubleClick={() => {
            zoomGraphicsToFit(id);
          }}
        >
          <LayerIcon
            content={layerIcon}
            enableFill={['Text', 'Frame'].includes(type)}
            enableStroke={!['Text', 'Frame'].includes(type)}
          />
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
        {/* icon button area */}
        <div
          className={classNames('sk-layer-item-actions', {
            'sk-action-visible': finalLock || !finalVisible,
          })}
          onMouseDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          {/* lock button */}
          <span
            className="sk-action-btn"
            style={{
              visibility: finalLock ? 'visible' : undefined,
            }}
            onMouseDown={() => {
              toggleLock(id);
            }}
          >
            {lock ? (
              <LockFilled />
            ) : lockSecond ? (
              <PointSolid />
            ) : (
              <UnlockFilled />
            )}
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
              visibility: !finalVisible ? 'visible' : undefined,
            }}
            onMouseDown={() => {
              toggleVisible && toggleVisible(id);
            }}
          >
            {!visible ? (
              <HideOutlined />
            ) : !visibleSecond ? (
              <PointSolid />
            ) : (
              <ShowOutlined />
            )}
          </span>
        </div>
      </div>
    </>
  );
};

export default LayerItem;
