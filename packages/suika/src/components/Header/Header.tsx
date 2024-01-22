import './Header.scss';

import { FC } from 'react';

import { LocaleSelector } from '../LocaleSelector';
import { ZoomActions } from '../ZoomActions';
import Title from './components/Title';
import { ToolBar } from './components/Toolbar';

export const Header: FC = () => {
  return (
    <div className="header">
      <ToolBar />
      <Title />
      <div className="right-area">
        <LocaleSelector />
        <ZoomActions />
      </div>
    </div>
  );
};
