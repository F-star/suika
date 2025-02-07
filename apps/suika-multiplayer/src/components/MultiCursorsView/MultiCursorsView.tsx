import './MultiCursorsView.scss';

import { type SettingValue } from '@suika/core';
import { type IPoint } from '@suika/geo';
import {
  type CSSProperties,
  type FC,
  useContext,
  useEffect,
  useState,
} from 'react';

import { EditorContext } from '../../context';
import { type IUserItem } from '../../type';
import { getColorfulCursor } from './utils';

interface IProps {
  width: number;
  height: number;
  style?: CSSProperties;
  users?: IUserItem[];
  awarenessClientId: number;
}

export const MultiCursorsView: FC<IProps> = ({
  style,
  users = [],
  awarenessClientId,
  width,
  height,
}) => {
  const editor = useContext(EditorContext);

  const toViewportPos = (pos: IPoint) => {
    return editor!.toViewportPt(pos.x, pos.y);
  };

  const [, setViewportId] = useState({}); // to force rerender component
  const [rulerWidth, setRulerWidth] = useState(0);

  useEffect(() => {
    if (!editor) return;

    const changeViewportId = () => {
      setViewportId({});
    };

    editor.viewportManager.on('xOrYChange', changeViewportId);
    editor.zoomManager.on('zoomChange', changeViewportId);

    const updateRulerWidth = (attrs: SettingValue) => {
      setRulerWidth(attrs.enableRuler ? attrs.rulerWidth : 0);
    };
    editor.setting.on('update', updateRulerWidth);
    updateRulerWidth(editor.setting.getAttrs());

    return () => {
      editor.viewportManager.off('xOrYChange', changeViewportId);
      editor.zoomManager.off('zoomChange', changeViewportId);
      editor.setting.off('update', updateRulerWidth);
    };
  }, [editor]);

  return (
    <div
      className="sk-cursors-view"
      style={{
        position: 'absolute',
        left: 240 + rulerWidth,
        top: rulerWidth,
        ...style,
        width: width - rulerWidth,
        height: height - rulerWidth,
      }}
    >
      {editor &&
        users
          .filter((user) => user.pos && user.awarenessId !== awarenessClientId)
          .map((user) => {
            const pos = toViewportPos(user.pos!);
            pos.x -= rulerWidth;
            pos.y -= rulerWidth;
            return (
              <div
                key={user.awarenessId}
                style={{
                  willChange: 'transform',
                  transform: `translate3d(${pos.x}px, ${pos.y}px, 0px)`,
                }}
              >
                <img
                  className="sk-multi-cursor-image"
                  src={getColorfulCursor(user.color)}
                />
                <div
                  className="sk-multi-cursor-username"
                  style={{
                    background: user.color,
                  }}
                >
                  {user.name}
                </div>
              </div>
            );
          })}
    </div>
  );
};
