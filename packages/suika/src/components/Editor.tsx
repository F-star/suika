import { FC, useEffect, useRef, useState } from 'react';
import { EditorContext } from '../context';
import { Editor as GraphEditor } from '../editor/editor';
import InfoPanel from './InfoPanel';
import ToolBar from './Toolbar';
import ZoomActions from './ZoomActions';

const Editor: FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  const [editor, setEditor] = useState<GraphEditor | null>(null);

  useEffect(() => {
    if (ref.current) {
      const editor = new GraphEditor({
        canvasElement: ref.current,
      });
      (window as any).editor = editor;
      editor.canvasElement.width = document.body.clientWidth;
      editor.canvasElement.height = document.body.clientHeight;
      setEditor(editor);
      return () => {
        editor.destroy(); // 注销事件
      };
    }
  }, [ref]);

  return (
    <div>
      <EditorContext.Provider value={editor}>
        <ToolBar />
        <ZoomActions />
        <InfoPanel />
        <canvas ref={ref} />
      </EditorContext.Provider>
    </div>
  );
};

export default Editor;