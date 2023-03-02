import { useClickAway } from 'ahooks';
import classNames from 'classnames';
import { FC, useContext, useEffect, useRef, useState } from 'react';
import { EditorContext } from '../../context';
import { SettingValue } from '../../editor/setting';
import { ActionItem } from './components/ActionItem/ActionItem';
import './ZoomActions.scss';

export const ZoomActions: FC = () => {
  const editor = useContext(EditorContext);
  const [zoom, setZoom] = useState(1);
  const [setting, setSetting] = useState<SettingValue>({} as SettingValue);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickAway(() => {
    setPopoverVisible(false);
  }, containerRef);

  useEffect(() => {
    if (editor) {
      setZoom(editor.zoomManager.getZoom());
      setSetting(editor.setting.getAttrs());

      const handler = (zoom: number) => {
        setZoom(zoom);
      };
      editor.zoomManager.on('zoomChange', handler);
      editor.setting.on('update', (setting => {
        setSetting(setting);
      }));
      return () => {
        editor.zoomManager.off('zoomChange', handler);
      };
    }
  }, [editor]);

  return (
    <div ref={containerRef} className="zoom-actions">
      <div
        className={classNames(['value', { active: popoverVisible }])}
        onClick={() => {
          setPopoverVisible(!popoverVisible);
        }}
      >
        {Math.floor(zoom * 100)}%
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M7 10L12 15L17 10" stroke="#333333" />
        </svg>
      </div>
      {popoverVisible && (
        <div className="popover">
          <ActionItem
            onClick={() => {
              editor?.zoomManager.zoomOut();
              editor?.sceneGraph.render();
              setPopoverVisible(false);
            }}
          >
            Zoom in
          </ActionItem>
          <ActionItem
            onClick={() => {
              editor?.zoomManager.zoomIn();
              editor?.sceneGraph.render();
              setPopoverVisible(false);
            }}
          >
            Zoom out
          </ActionItem>
          <div className='separator' />
          <ActionItem
            check={setting.enablePixelGrid}
            onClick={() => {
              if (editor) {
                const enablePixelGrid = editor.setting.get('enablePixelGrid');
                editor.setting.set('enablePixelGrid', !enablePixelGrid);
                editor.sceneGraph.render();
                setPopoverVisible(false);
              }
            }}
          >
            Pixel grid
          </ActionItem>
          <ActionItem
            check={setting.snapToPixelGrid}
            onClick={() => {
              if (editor) {
                const snapToPixelGrid = editor.setting.get('snapToPixelGrid');
                editor.setting.set('snapToPixelGrid', !snapToPixelGrid);
                editor.sceneGraph.render();
                setPopoverVisible(false);
              }
            }}
          >
            Snap to pixel grid
          </ActionItem>
        </div>
      )}
    </div>
  );
};
