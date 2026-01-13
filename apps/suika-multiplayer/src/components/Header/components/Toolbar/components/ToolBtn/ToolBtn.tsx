import './ToolBtn.scss';

import classNames from 'classnames';
import React, { type FC } from 'react';

interface IToolBtn {
  className?: string;
  children?: React.ReactNode;
  onMouseDown: () => void;
}

export const ToolBtn: FC<IToolBtn> = ({ children, onMouseDown, className }) => {
  return (
    <div
      className={classNames('tool-btn', className)}
      onMouseDown={() => {
        onMouseDown();
      }}
    >
      {children}
    </div>
  );
};
