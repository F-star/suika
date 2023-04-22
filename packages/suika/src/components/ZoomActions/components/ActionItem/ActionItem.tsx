import { FC, PropsWithChildren } from 'react';
import './ActionItem.scss';
import { CheckOutlined } from '@suika/icons';

interface IProps extends PropsWithChildren {
  onClick: () => void;
  check?: boolean;
}

export const ActionItem: FC<IProps> = ({ onClick, children, check }) => {
  return (
    <div className="action-item" onClick={onClick}>
      <div className="icon-box">{check && <CheckOutlined />}</div>
      {children}
    </div>
  );
};
