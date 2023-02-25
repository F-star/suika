import { FC, PropsWithChildren } from 'react';
import { CheckIcon } from '../../../icons/CheckIcon';
import './ActionItem.scss';

interface IProps extends PropsWithChildren {
  onClick: () => void;
  check?: boolean;
}

export const ActionItem: FC<IProps> = ({ onClick, children, check }) => {
  return (
    <div className="action-item" onClick={onClick}>
      <div className="icon-box">
        {check && <CheckIcon />}
      </div>
      {children}
    </div>
  );
};
