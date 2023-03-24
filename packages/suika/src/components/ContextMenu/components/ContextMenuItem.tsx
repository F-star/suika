import { FC, PropsWithChildren } from 'react';
import './ContextMenuItem.scss';

interface IProps extends PropsWithChildren {
  onClick(): void;
}

const ContextMenuItem: FC<IProps> = ({ children, onClick }) => {
  return (
    <div
      className="suika-context-menu-item"
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default ContextMenuItem;
