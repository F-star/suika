import classNames from 'classnames';
import { FC, PropsWithChildren } from 'react';
import './LayerItem.scss';

interface IProps extends PropsWithChildren {
  active?: boolean;
  layerId: string;
}

const LayerItem: FC<IProps> = ({ children, active = false, layerId }) => {
  return (
    <div
      className={classNames('layer-item', { active })}
      data-layer-id={layerId}
    >
      {children}
    </div>
  );
};

export default LayerItem;
