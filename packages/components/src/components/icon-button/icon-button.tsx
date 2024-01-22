import './icon-button.scss';

import { FC, PropsWithChildren } from 'react';

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
