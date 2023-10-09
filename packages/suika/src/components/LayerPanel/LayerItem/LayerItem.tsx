import classNames from 'classnames';
import { FC } from 'react';
import './LayerItem.scss';

interface IProps {
  id: string | number;
  name: string;
  children?: IProps[];
  active?: boolean;
  level?: number;
  activeIds?: (string | number)[];
}

const LayerItem: FC<IProps> = ({
  name,
  children,
  active = false,
  id,
  activeIds = [],
  level = 0,
}) => {
  return (
    <>
      <div className={classNames('layer-item', { active })} data-layer-id={id}>
        <div style={{ width: level * 16 }} />
        {name}
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
            />
          ))}
        </div>
      )}
    </>
  );
};

export default LayerItem;
