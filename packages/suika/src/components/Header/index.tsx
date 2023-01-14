import { FC } from 'react';
import Title from './components/Title';
import ToolBar from './components/Toolbar';
import './style.scss';

const Header: FC = () => {
  return (
    <div className='header'>
      <ToolBar />
      <Title />
    </div>
  );
};

export default Header;
