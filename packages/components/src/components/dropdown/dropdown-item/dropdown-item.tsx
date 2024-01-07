import { FC, PropsWithChildren } from 'react';
import './dropdown-item.scss';
import { CheckOutlined } from '@suika/icons';

interface IProps extends PropsWithChildren {
  suffix?: string;
  onClick: () => void;
  check?: boolean;
}

export const DropdownItem: FC<IProps> = ({
  onClick,
  children,
  suffix,
  check,
}) => {
  return (
    <div className="sk-dropdown-item-wrap" onClick={onClick}>
      <div className="sk-dropdown-item">
        <div className="sk-dropdown-item-icon-box">
          {check && <CheckOutlined />}
        </div>
        {children}
      </div>
      {suffix && <span>{suffix}</span>}
    </div>
  );
};
