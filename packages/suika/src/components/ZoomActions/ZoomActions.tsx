import { useClickAway } from 'ahooks';
import classNames from 'classnames';
import { FC, useContext, useEffect, useRef, useState } from 'react';
import { EditorContext } from '../../context';
import { SettingValue } from '../../editor/setting';
import { ActionItem } from './components/ActionItem';
import { FormattedMessage } from 'react-intl';
import { ArrowDownOutlined } from '@suika/icons';
import './ZoomActions.scss';
import { ZoomInput } from './components/ZoomInput';
import { isWindows } from '../../utils/common';
import { MessageIds } from '../../locale/types';

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
          <div className="zoom-input-box">
            <ZoomInput
              defaultValue={zoom}
              onChange={(newZoom) => {
                editor?.zoomManager.setZoomAndUpdateViewport(newZoom);
                editor?.sceneGraph.render();
              }}
            />
          </div>
          <div className="separator" />
          {(
            [
              {
                id: 'zoom.zoomIn',
                suffix: isWindows ? 'Ctrl++' : '⌘+',
                action: () => {
                  editor?.zoomManager.zoomIn();
                },
              },
              {
                id: 'zoom.zoomOut',
                suffix: isWindows ? 'Ctrl+-' : '⌘-',
                action: () => {
                  editor?.zoomManager.zoomOut();
                },
              },
              {
                id: 'zoom.zoomToFit',
                suffix: isWindows ? 'Shift+1' : '⇧1',
                action: () => {
                  editor?.zoomManager.zoomToFit();
                },
              },
              {
                id: 'zoom.zoomToSelection',
                suffix: isWindows ? 'Shift+2' : '⇧2',
                action: () => {
                  editor?.zoomManager.zoomToSelection();
                },
              },
              {
                id: 'zoom.zoomTo50',
                action: () => {
                  editor?.zoomManager.setZoomAndUpdateViewport(0.5);
                },
              },
              {
                id: 'zoom.zoomTo100',
                suffix: isWindows ? 'Ctrl+0' : '⌘0',
                action: () => {
                  editor?.zoomManager.setZoomAndUpdateViewport(1);
                },
              },
              {
                id: 'zoom.zoomTo200',
                action: () => {
                  editor?.zoomManager.setZoomAndUpdateViewport(2);
                },
              },
            ] as { id: MessageIds; suffix?: string; action(): void }[]
          ).map((item) => {
            return (
              <ActionItem
                suffix={item.suffix}
                key={item.id}
                onClick={() => {
                  item.action();
                  editor?.sceneGraph.render();
                  setPopoverVisible(false);
                }}
              >
                <FormattedMessage id={item.id} />
              </ActionItem>
            );
          })}
          <div className="separator" />
          <ActionItem
            check={setting.enablePixelGrid}
            suffix={isWindows ? "Ctrl+'" : "⌘'"}
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
            suffix={isWindows ? "Ctrl+Shift+'" : "⌘⇧'"}
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
            suffix={isWindows ? 'Shift+R' : '⇧R'}
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
