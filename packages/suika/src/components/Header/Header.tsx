import './Header.scss';

import { type FC } from 'react';

import { LocaleSelector } from '../LocaleSelector';
import { ZoomActions } from '../ZoomActions';
import Title from './components/Title';
import { ToolBar } from './components/Toolbar';

export const Header: FC = () => {
  return (
    <div className="sk-header">
      <ToolBar />
      <Title />
      <div className="sk-right-area">
        <LocaleSelector />
        <ZoomActions />
      </div>
    </div>
  );
};
