import { FC } from 'react';
import { ZoomActions } from '../ZoomActions';
import Title from './components/Title';
import ToolBar from './components/Toolbar';
import './style.scss';

const Header: FC = () => {
  return (
    <div className='header'>
      <ToolBar />
      <Title />
      <ZoomActions />
    </div>
  );
};

export default Header;
