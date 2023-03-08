import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../context';
import { IPoint } from '../../type.interface';

interface IItem {
  label: string;
  command: string;
  onClick: () => void;
}

export const ContextMenu: FC = () => {
  const editor = useContext(EditorContext);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (editor) {
      // 监听 editor 的 contextmenu 事件
      const handler = (pos: IPoint) => {
        if (!visible) {
          setVisible(true);
          setPos(pos);
        }
      };
      editor.hostEventManager.on('contextmenu', handler);
      return () => {
        editor.hostEventManager.off('contextmenu', handler);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  return (
    <div style={{ display: visible ? undefined : 'none' }}>
      {/* 分两种。有选中元素、无选中元素 */}
      <div>撤销</div>
      <div>重做</div>
    </div>
  );
};
