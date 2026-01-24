import './Header.scss';

import { type FC } from 'react';

import { useFileInfo, useUserInfo } from '../editorHook';
import { LocaleSelector } from '../LocaleSelector';
import { ZoomActions } from '../ZoomActions';
import Title from './components/Title';
import { ToolBar } from './components/Toolbar';

interface IProps {
  title: string;
  userInfo?: { username: string; id: string };
}

export const Header: FC<IProps> = ({ title, userInfo }) => {
  return (
    <div className="sk-header">
      <ToolBar />
      <Title value={title} />
      <div className="sk-right-area">
        <div>{userInfo?.username ?? ''}</div>
        <LocaleSelector />
        <ZoomActions />
      </div>
    </div>
  );
};
