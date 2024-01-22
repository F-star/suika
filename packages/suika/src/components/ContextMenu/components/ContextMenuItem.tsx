import './ContextMenuItem.scss';

import classNames from 'classnames';
import { FC, PropsWithChildren } from 'react';

interface IProps extends PropsWithChildren {
  suffix?: string;
  disabled?: boolean;
  onClick(): void;
}

const ContextMenuItem: FC<IProps> = ({
  children,
  suffix,
  disabled,
  onClick,
}) => {
  return (
    <div
      className={classNames('suika-context-menu-item', {
        'suika-is-disable': disabled,
      })}
      onClick={onClick}
    >
      {children}
      {suffix && <span>{suffix}</span>}
    </div>
  );
};

export default ContextMenuItem;
