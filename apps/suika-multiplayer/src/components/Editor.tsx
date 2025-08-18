import './Editor.scss';

import { throttle } from '@suika/common';
import { SuikaEditor } from '@suika/core';
import { type FC, useEffect, useRef, useState } from 'react';

import { ApiService } from '../api-service';
import { EditorContext } from '../context';
// import { AutoSaveGraphics } from '../store/auto-save-graphs';
import { joinRoom } from '../store/join-room';
import { type IUserItem } from '../type';
import { ContextMenu } from './ContextMenu';
import { Header } from './Header';
import { InfoPanel } from './InfoPanel';
import { LayerPanel } from './LayerPanel';
import { MultiCursorsView } from './MultiCursorsView';

const topMargin = 48;
const leftRightMargin = 240 * 2;

const Editor: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [editor, setEditor] = useState<SuikaEditor | null>(null);

  const [viewWidth, setViewWidth] = useState(0);
  const [viewHeight, setViewHeight] = useState(0);

  const [users, setUsers] = useState<IUserItem[]>([]);
  const [awarenessClientId, setAwarenessClientId] = useState(-1);

  const [title, setTitle] = useState('');
  const userInfo = useRef<{ username: string; id: number } | null>();

  useEffect(() => {
    let fileId: number | undefined;
    const pathname = location.pathname;
    const suffix = '/design/';
    if (pathname.startsWith(suffix)) {
      fileId = Number(pathname.slice(suffix.length));
    }
    if (fileId === undefined || Number.isNaN(fileId)) {
      console.error('请提供正确格式图纸 id');
      return;
    }

    // 1. 请求用户名
    // 2. 请求文件元数据
    Promise.all([ApiService.getUserInfo(), ApiService.getFile(fileId)]).then(
      ([userData, fileData]) => {
        userInfo.current = userData.data;
        if (!fileData.data) {
          console.error('图纸 id 不存在');
          return;
        }
        setTitle(fileData.data.title);
        initEditor('' + fileId);
      },
    );
  }, [containerRef]);

  const initEditor = (fileId: string) => {
    if (!containerRef.current) return;
    const width = document.body.clientWidth - leftRightMargin;
    const height = document.body.clientHeight - topMargin;
    setViewWidth(width);
    setViewHeight(height);

    const editor = new SuikaEditor({
      containerElement: containerRef.current,
      width,
      height,
      offsetY: 48,
      offsetX: 240,
      showPerfMonitor: false,
    });
    (window as any).editor = editor;

    const suikaBinding = joinRoom(editor, fileId, userInfo.current!);
    setAwarenessClientId(suikaBinding.awareness.clientID);
    suikaBinding.on('usersChange', setUsers);

    const changeViewport = throttle(
      () => {
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
    window.addEventListener('resize', changeViewport);
    setEditor(editor);

    return () => {
      editor.destroy();
      window.removeEventListener('resize', changeViewport);
      changeViewport.cancel();
      suikaBinding.destroy();
    };
  };

  return (
    <div>
      <EditorContext.Provider value={editor}>
        <Header title={title} />
        {/* body */}
        <div className="body">
          <LayerPanel />
          <div
            ref={containerRef}
            style={{
              position: 'absolute',
              left: 240,
              top: 0,
            }}
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
