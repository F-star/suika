import { FC, PropsWithChildren } from 'react';
import './ActionItem.scss';
import { CheckOutlined } from '@suika/icons';

interface IProps extends PropsWithChildren {
  suffix?: string;
  onClick: () => void;
  check?: boolean;
}

export const ActionItem: FC<IProps> = ({
  onClick,
  children,
  suffix,
  check,
}) => {
  return (
    <div className="suika-action-item-wrap" onClick={onClick}>
      <div className="suika-action-item">
        <div className="suika-icon-box">{check && <CheckOutlined />}</div>
        {children}
      </div>
      {suffix && <span>{suffix}</span>}
    </div>
  );
};
