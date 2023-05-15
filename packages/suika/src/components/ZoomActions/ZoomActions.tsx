import { useClickAway } from 'ahooks';
import classNames from 'classnames';
import { FC, useContext, useEffect, useRef, useState } from 'react';
import { EditorContext } from '../../context';
import { SettingValue } from '../../editor/setting';
import { ActionItem } from './components/ActionItem/ActionItem';
import './ZoomActions.scss';
import { FormattedMessage } from 'react-intl';
import { ArrowDownOutlined } from '@suika/icons';

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
      editor.setting.on('update', (setting) => {
        setSetting(setting);
      });
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
        <ArrowDownOutlined />
      </div>
      {popoverVisible && (
        <div className="popover">
          <ActionItem
            onClick={() => {
              editor?.zoomManager.zoomIn();
              editor?.sceneGraph.render();
              setPopoverVisible(false);
            }}
          >
            <FormattedMessage id="zoom.zoomIn" />
          </ActionItem>
          <ActionItem
            onClick={() => {
              editor?.zoomManager.zoomOut();
              editor?.sceneGraph.render();
              setPopoverVisible(false);
            }}
          >
            <FormattedMessage id="zoom.zoomOut" />
          </ActionItem>
          <ActionItem
            onClick={() => {
              editor?.zoomManager.zoomToFit();
              editor?.sceneGraph.render();
              setPopoverVisible(false);
            }}
          >
            <FormattedMessage id="zoom.zoomToFit" />
          </ActionItem>
          <div className="separator" />
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
            <FormattedMessage id="setting.grid.pixelGrid" />
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
            <FormattedMessage id="setting.grid.snapToPixelGrid" />
          </ActionItem>
          <ActionItem
            check={setting.enableRuler}
            onClick={() => {
              if (editor) {
                const enableRuler = editor.setting.get('enableRuler');
                editor.setting.set('enableRuler', !enableRuler);
                editor.sceneGraph.render();
                setPopoverVisible(false);
              }
            }}
          >
            <FormattedMessage id="setting.rulers" />
          </ActionItem>
        </div>
      )}
    </div>
  );
};
