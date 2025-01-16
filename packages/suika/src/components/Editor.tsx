import './Editor.scss';

import { pick, throttle } from '@suika/common';
import { type SettingValue, SuikaEditor } from '@suika/core';
import { type FC, useEffect, useRef, useState } from 'react';

import { EditorContext } from '../context';
import { AutoSaveGraphics } from '../store/auto-save-graphs';
import { ContextMenu } from './ContextMenu';
import { Header } from './Header';
import { InfoPanel } from './InfoPanel';
import { LayerPanel } from './LayerPanel';

const topMargin = 48;
const leftRightMargin = 240 * 2;

const USER_PREFERENCE_KEY = 'suika-user-preference';
const storeKeys: Partial<keyof SettingValue>[] = [
  'enablePixelGrid',
  'snapToGrid',
  'enableRuler',

  'keepToolSelectedAfterUse',
  'invertZoomDirection',
  'highlightLayersOnHover',
  'flipObjectsWhileResizing',
  'snapToObjects',
];

const Editor: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [editor, setEditor] = useState<SuikaEditor | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const userPreferenceEncoded = localStorage.getItem(USER_PREFERENCE_KEY);
      const userPreference = userPreferenceEncoded
        ? (JSON.parse(userPreferenceEncoded) as Partial<SettingValue>)
        : undefined;

      const editor = new SuikaEditor({
        containerElement: containerRef.current,
        width: document.body.clientWidth - leftRightMargin,
        height: document.body.clientHeight - topMargin,
        offsetY: 48,
        offsetX: 240,
        showPerfMonitor: false,
        userPreference: userPreference,
      });

      editor.setting.on(
        'update',
        (value: SettingValue, changedKey: keyof SettingValue) => {
          if (!storeKeys.includes(changedKey)) return;

          localStorage.setItem(
            USER_PREFERENCE_KEY,
            JSON.stringify(pick(value, storeKeys)),
          );
        },
      );

      (window as any).editor = editor;

      new AutoSaveGraphics(editor);

      const changeViewport = throttle(
        () => {
          editor.viewportManager.setViewport({
            width: document.body.clientWidth - leftRightMargin,
            height: document.body.clientHeight - topMargin,
          });
          editor.render();
        },
        10,
        { leading: false },
      );
      window.addEventListener('resize', changeViewport);
      setEditor(editor);

      return () => {
        editor.destroy(); // 注销事件
        window.removeEventListener('resize', changeViewport);
        changeViewport.cancel();
      };
    }
  }, [containerRef]);

  return (
    <div>
      <EditorContext.Provider value={editor}>
        <Header title="suika" />
        {/* body */}
        <div className="body">
          <LayerPanel />
          <div
            ref={containerRef}
            style={{ position: 'absolute', left: 240, top: 0 }}
          />
          <InfoPanel />
          <ContextMenu />
        </div>
      </EditorContext.Provider>
    </div>
  );
};

export default Editor;
