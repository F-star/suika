import { FC } from 'react';
import ToolBar from './Toolbar';
import './Header.scss';

const Header: FC = () => {
  return (
    <div className='header'>
      <ToolBar />
    </div>
  );
};

export default Header;
