import classNames from 'classnames';
import { FC } from 'react';
import './LayerItem.scss';
import { HideOutlined, ShowOutlined } from '@suika/icons';

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
}) => {
  const indentWidth = level * 16;
  return (
    <>
      <div
        className={classNames('sk-layer-item', {
          'sk-active': active,
          'sk-hidden': !visible,
          'sk-hover': hoverId === id,
        })}
        data-layer-id={id}
        onMouseEnter={() => {
          // TODO:
          // setHoverId && setHoverId(id);
        }}
      >
        <div
          style={{ width: indentWidth, minWidth: indentWidth }}
          data-layer-id={id}
        />
        {name}
        <div className="sk-layer-item-actions">
          <span
            style={{ fontSize: 0 }}
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
            />
          ))}
        </div>
      )}
    </>
  );
};

export default LayerItem;
