import './Editor.scss';

import { throttle } from '@suika/common';
import { Editor as GraphEditor } from '@suika/core';
import { FC, useEffect, useRef, useState } from 'react';

import { EditorContext } from '../context';
import { ContextMenu } from './ContextMenu';
import { Header } from './Header';
import { InfoPanel } from './InfoPanel';
import { LayerPanel } from './LayerPanel';

const topMargin = 48;
const leftRightMargin = 240 * 2;

const Editor: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [editor, setEditor] = useState<GraphEditor | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const editor = new GraphEditor({
        containerElement: containerRef.current,
        width: document.body.clientWidth - leftRightMargin,
        height: document.body.clientHeight - topMargin,
        offsetY: 48,
        offsetX: 240,
        showPerfMonitor: false,
      });
      (window as any).editor = editor;

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
        <Header />
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
