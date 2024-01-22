import './ToolBtn.scss';

import classNames from 'classnames';
import React, { FC } from 'react';

interface IToolBtn {
  className?: string;
  children?: React.ReactNode;
  tooltipContent: string;
  hotkey: string;
  onClick: () => void;
}

export const ToolBtn: FC<IToolBtn> = ({
  children,
  onClick,
  className,
  tooltipContent,
  hotkey,
}) => {
  return (
    <div
      className={classNames('tool-btn', className)}
      onClick={() => {
        onClick();
      }}
    >
      {children}
      <div className="tooltip">
        {tooltipContent} <span className="tool-hotkey">{hotkey}</span>
      </div>
    </div>
  );
};
