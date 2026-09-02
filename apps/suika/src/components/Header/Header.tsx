import './Header.scss';

import { type FC } from 'react';

import { LocaleSelector } from '../LocaleSelector';
import { ZoomActions } from '../ZoomActions';
import Title from './components/Title';
import { ToolBar } from './components/Toolbar';

interface IProps {
  title: string;
  onClearCanvas: () => void;
}

export const Header: FC<IProps> = ({ title, onClearCanvas }) => {
  return (
    <div className="sk-header">
      <ToolBar onClearCanvas={onClearCanvas} />
      <Title value={title} />
      <div className="sk-right-area">
        <LocaleSelector />
        <ZoomActions />
      </div>
    </div>
  );
};
