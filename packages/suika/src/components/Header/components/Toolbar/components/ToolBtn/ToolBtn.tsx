import classNames from 'classnames';
import React, { FC } from 'react';
import './ToolBtn.scss';

interface IToolBtn {
  className?: string;
  children?: React.ReactNode;
  tooltipContent: string;
  onClick: () => void;
}

export const ToolBtn: FC<IToolBtn> = ({
  children,
  onClick,
  className,
  tooltipContent,
}) => {
  return (
    <div
      className={classNames('tool-btn', className)}
      onClick={() => {
        onClick();
      }}
    >
      {children}
      <div className="tooltip">{tooltipContent}</div>
    </div>
  );
};
