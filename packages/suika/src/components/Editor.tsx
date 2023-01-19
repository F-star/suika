import throttle from 'lodash.throttle';
import { FC, useEffect, useRef, useState } from 'react';
import { EditorContext } from '../context';
import { Editor as GraphEditor } from '../editor/editor';
import Header from './Header';
import InfoPanel from './InfoPanel';
import ZoomActions from './ZoomActions';

const rightPadding = 241;

const Editor: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [editor, setEditor] = useState<GraphEditor | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const editor = new GraphEditor({
        canvasElement: canvasRef.current,
        width: document.body.clientWidth - rightPadding,
        height: document.body.clientHeight,
        offsetY: 48,
      });
      (window as any).editor = editor;

      const changeViewport = throttle(() => {
        editor.viewportManager.setViewport({
          width: document.body.clientWidth - rightPadding,
          height: document.body.clientHeight,
        });
        editor.sceneGraph.render();
      }, 150, { leading: false });
      window.addEventListener('resize', changeViewport);
      setEditor(editor);

      return () => {
        editor.destroy(); // 注销事件
        window.removeEventListener('resize', changeViewport);
        changeViewport.cancel();
      };
    }
  }, [canvasRef]);

  return (
    <div>
      <EditorContext.Provider value={editor}>
        <Header />
        <ZoomActions />
        <InfoPanel />
        <canvas ref={canvasRef} />
      </EditorContext.Provider>
    </div>
  );
};

export default Editor;