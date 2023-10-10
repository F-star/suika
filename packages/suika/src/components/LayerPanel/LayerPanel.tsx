import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../context';
import { IObject } from '../../type';
import './LayerPanel.scss';
import { Tree } from './LayerItem/tree';

export const LayerPanel: FC = () => {
  const editor = useContext(EditorContext);
  const [objects, setObjects] = useState<IObject[]>([]);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());

  useEffect(() => {
    if (editor) {
      setObjects(editor.sceneGraph.toObjects());

      editor.sceneGraph.on('render', () => {
        setObjects(editor.sceneGraph.toObjects());
        setSelectedIds(editor.selectedElements.getIdSet());
      });
    }
  }, [editor]);

  const handleMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (!editor) return;
    const target = event.target;

    if (target instanceof HTMLElement && target.hasAttribute('data-layer-id')) {
      const objId = target.getAttribute('data-layer-id');
      if (objId) {
        if (event.ctrlKey || event.metaKey) {
          editor.selectedElements.toggleItemById(objId);
        } else {
          editor.selectedElements.setItemsById(new Set([objId]));
        }
        editor.sceneGraph.render();
      }
    }
  };

  return (
    <div className="layer-panel" onMouseDown={(e) => handleMouseDown(e)}>
      <Tree treeData={objects} activeIds={Array.from(selectedIds)} />
    </div>
  );
};
