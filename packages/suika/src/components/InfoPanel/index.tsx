import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../context';
import { IGraph } from '../../scene/graph';
import ElementsInfoCards from '../Cards/ElementsInfoCard';
import './style.scss';

enum PanelType {
  Global = 'Global',
  SelectedElements = 'SelectedElements',
}

const InfoPanel: FC = () => {
  const editor = useContext(EditorContext);
  const [type, setType] = useState(PanelType.Global);
  // 根据是否选中元素，来决定面板类型

  useEffect(() => {
    if (editor) {
      const handler = (items: IGraph[]) => {
        setType(items.length ? PanelType.SelectedElements : PanelType.Global);
      };
      editor.selectedElements.on('itemsChange', handler);

      return () => {
        editor.selectedElements.off('itemsChange', handler);
      };
    }
  }, [editor]);

  return (
    <div className="info-panel" onKeyDown={(e) => e.stopPropagation()}>
      {type === PanelType.SelectedElements && <ElementsInfoCards />}
      {type === PanelType.Global && (
        <div className="empty-text">No Selected Shapes</div>
      )}
    </div>
  );
};

export default InfoPanel;
