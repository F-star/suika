import { FC, PropsWithChildren } from 'react';
import './ContextMenuItem.scss';
import classNames from 'classnames';

interface IProps extends PropsWithChildren {
  disabled?: boolean;
  onClick(): void;
}

const ContextMenuItem: FC<IProps> = ({ children, disabled, onClick }) => {
  return (
    <div
      className={classNames('suika-context-menu-item', {
        'suika-is-disable': disabled,
      })}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default ContextMenuItem;
