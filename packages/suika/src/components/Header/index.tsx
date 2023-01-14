import { FC } from 'react';
import ToolBar from './components/Toolbar';
import './style.scss';

const Header: FC = () => {
  return (
    <div className='header'>
      <ToolBar />
    </div>
  );
};

export default Header;
