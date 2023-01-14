import classNames from 'classnames';
import React, { FC } from 'react';
import './ToolBtn.scss';

interface IToolBtn {
  className?: string;
  onClick: () => void;
  children?: React.ReactNode;
}

const ToolBtn: FC<IToolBtn> = ({ children, onClick, className }) => {
  return (
    <div
      className={classNames('tool-btn', className)}
      onClick={() => {
        onClick();
      }}
    >
      {children}
    </div>
  );
};

export default ToolBtn;
