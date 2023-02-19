import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../context';
import { IObject } from '../../type.interface';
import LayerItem from './LayerItem/LayerItem';
import './LayerPanel.scss';

export const LayerPanel: FC = () => {
  const editor = useContext(EditorContext);
  const [objects, setObjects] = useState<IObject[]>([]);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());

  useEffect(() => {
    if (editor) {
      setObjects(editor.sceneGraph.getObjects()); // init

      editor.sceneGraph.on('render', () => {
        setObjects(editor.sceneGraph.getObjects());
        setSelectedIds(editor.selectedElements.getIdSet());
      });
    }
  }, [editor]);

  return (
    <div className="layer-panel">
      {objects
        .map((item) => (
          <LayerItem active={selectedIds.has(item.id)} key={item.id}>
            {item.name}
          </LayerItem>
        ))
        .reverse()}
    </div>
  );
};
