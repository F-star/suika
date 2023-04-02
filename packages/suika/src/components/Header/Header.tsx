import { FC } from 'react';
import { ZoomActions } from '../ZoomActions';
import Title from './components/Title';
import { ToolBar } from './components/Toolbar';
import './Header.scss';
import { LocaleSelector } from '../LocaleSelector';

export const Header: FC = () => {
  return (
    <div className='header'>
      <ToolBar />
      <Title />
      <div className='right-area'>
        <LocaleSelector />
        <ZoomActions />
      </div>
    </div>
  );
};
