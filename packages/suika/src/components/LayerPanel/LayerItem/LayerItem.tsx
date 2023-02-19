import classNames from 'classnames';
import { FC, PropsWithChildren } from 'react';
import './LayerItem.scss';

interface IProps extends PropsWithChildren {
  active?: boolean;
}

const LayerItem: FC<IProps> = ({ children, active = false }) => {
  return <div className={classNames('layer-item', { active })}>{children}</div>;
};

export default LayerItem;
