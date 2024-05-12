import './ToolBtn.scss';

import classNames from 'classnames';
import React, { type FC } from 'react';

interface IToolBtn {
  className?: string;
  children?: React.ReactNode;
  tooltipContent: string;
  hotkey: string;
  onMouseDown: () => void;
}

export const ToolBtn: FC<IToolBtn> = ({
  children,
  onMouseDown,
  className,
  tooltipContent,
  hotkey,
}) => {
  return (
    <div
      className={classNames('tool-btn', className)}
      onMouseDown={() => {
        onMouseDown();
      }}
    >
      {children}
      <div className="tooltip">
        {tooltipContent}
        {hotkey && <span className="tool-hotkey">{hotkey}</span>}
      </div>
    </div>
  );
};
