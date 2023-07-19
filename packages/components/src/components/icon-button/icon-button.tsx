import { FC, PropsWithChildren } from 'react';
import './icon-button.scss';

interface IProps extends PropsWithChildren {
  onClick: () => void;
}

export const IconButton: FC<IProps> = ({ children, onClick }) => {
  return (
    <div className="sk-icon-btn" onClick={() => onClick()}>
      {children}
    </div>
  );
};
