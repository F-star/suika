import { FC, useEffect, useRef } from 'react';
import { Editor as GraphEditor } from '../../editor/editor';


const Editor: FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (ref.current) {
      const editor = new GraphEditor({
        canvasElement: ref.current,
      });
      (window as any).editor = editor;
      editor.bindHotkeys();
      editor.canvasElement.width = document.body.clientWidth;
      editor.canvasElement.height = document.body.clientHeight;
      return () => {
        editor.destroy(); // 注销事件
      };
    }
  }, [ref]);

  return (
    <div>
      <canvas ref={ref} />
    </div>
  );
};

export default Editor;