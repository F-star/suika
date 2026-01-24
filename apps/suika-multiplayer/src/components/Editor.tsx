import './Editor.scss';

import { pick, throttle } from '@suika/common';
import { fontManager, type SettingValue, SuikaEditor } from '@suika/core';
import { type FC, useEffect, useMemo, useRef, useState } from 'react';

import { FONT_FILES } from '@/constant';
import { joinRoom } from '@/store/join-room';
import { type IUserItem } from '@/type';

import { EditorContext } from '../context';
import { ContextMenu } from './ContextMenu';
import { useFileInfo, useUserInfo } from './editorHook';
import { Header } from './Header';
import { InfoPanel } from './InfoPanel';
import { LayerPanel } from './LayerPanel';
import { MultiCursorsView } from './MultiCursorsView';
import { Pages } from './Pages';
import { ProgressOverlay } from './ProgressOverlay';

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

  const [suikaEditor, setEditor] = useState<SuikaEditor | null>(null);

  const [progress, setProgress] = useState(0);

  /**
   * let fileId: number | undefined;
    const pathname = location.pathname;
    const suffix = '/design/';
    if (pathname.startsWith(suffix)) {
      fileId = Number(pathname.slice(suffix.length));
    }
    if (fileId === undefined || Number.isNaN(fileId)) {
      console.error('请提供正确格式图纸 id');
      return;
    }
   */
  const roomId = useMemo(() => {
    const pathname = location.pathname;
    const suffix = '/design/';
    if (pathname.startsWith(suffix)) {
      return pathname.slice(suffix.length);
    }
    return undefined;
  }, [location.pathname]);

  const userInfo = useUserInfo();
  const fileInfo = useFileInfo(roomId!);

  const [awarenessClientId, setAwarenessClientId] = useState(-1);

  const [viewWidth, setViewWidth] = useState(0);
  const [viewHeight, setViewHeight] = useState(0);

  const [users, setUsers] = useState<IUserItem[]>([]);

  useEffect(() => {
    if (containerRef.current) {
      const width = document.body.clientWidth - leftRightMargin;
      const height = document.body.clientHeight - topMargin;
      setViewWidth(width);
      setViewHeight(height);

      const userPreferenceEncoded = localStorage.getItem(USER_PREFERENCE_KEY);
      const userPreference = userPreferenceEncoded
        ? (JSON.parse(userPreferenceEncoded) as Partial<SettingValue>)
        : undefined;

      const editorReference: { value: SuikaEditor | null } = {
        value: null,
      };

      let isCanceled = false;

      const changeViewport = throttle(
        () => {
          const editor = editorReference.value;
          if (!editor) return;

          const width = document.body.clientWidth - leftRightMargin;
          const height = document.body.clientHeight - topMargin;
          setViewWidth(width);
          setViewHeight(height);
          editor.viewportManager.setViewportSize({
            width,
            height,
          });
          editor.render();
        },
        10,
        { leading: false },
      );

      (async () => {
        await fontManager.loadFonts(FONT_FILES);
        setProgress(100);
        if (isCanceled) return;

        const editor = new SuikaEditor({
          containerElement: containerRef.current!,
          width: document.body.clientWidth - leftRightMargin,
          height: document.body.clientHeight - topMargin,
          offsetY: 48,
          offsetX: 240,
          showPerfMonitor: false,
          userPreference: userPreference,
        });
        editorReference.value = editor;

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

        window.addEventListener('resize', changeViewport);

        setEditor(editor);
      })();

      return () => {
        isCanceled = true;

        editorReference.value?.destroy();
        window.removeEventListener('resize', changeViewport);
        changeViewport.cancel();
      };
    }
  }, [containerRef]);

  useEffect(() => {
    if (suikaEditor && fileInfo && userInfo) {
      const binding = joinRoom(suikaEditor, fileInfo.id, userInfo);
      setAwarenessClientId(binding.awareness.clientID);
      binding.on('usersChange', (users: IUserItem[]) => {
        console.log('usersChange', users);
        setUsers(users);
      });

      return () => {
        binding.destroy();
      };
    }
  }, [suikaEditor, fileInfo, userInfo]);

  return (
    <div>
      <ProgressOverlay value={progress} />
      <EditorContext.Provider value={suikaEditor}>
        <Header
          title={fileInfo?.title ?? ''}
          userInfo={userInfo ?? undefined}
        />
        {/* body */}
        <div className="body">
          <div className="suika-editor-left-area">
            <Pages />
            <LayerPanel />
          </div>{' '}
          <div
            ref={containerRef}
            style={{ position: 'absolute', left: 240, top: 0 }}
          />
          <MultiCursorsView
            width={viewWidth}
            height={viewHeight}
            users={users}
            awarenessClientId={awarenessClientId}
          />
          <InfoPanel />
          <ContextMenu />
        </div>
      </EditorContext.Provider>
    </div>
  );
};

export default Editor;
