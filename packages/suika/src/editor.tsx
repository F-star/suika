import { FC, useEffect, useRef } from 'react';
import { Editor as GraphEditor } from './editor/editor';


const Editor2: FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (ref.current) {
      const editor = new GraphEditor({
        canvasElement: ref.current,
      });
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

export default Editor2;