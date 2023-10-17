import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../context';
import { IObject } from '../../type';
import './LayerPanel.scss';
import { Tree } from './LayerItem/tree';
import { MutateGraphsAndRecord } from '../../editor/service/mutate_graphs_and_record';

export const LayerPanel: FC = () => {
  const editor = useContext(EditorContext);
  const [objects, setObjects] = useState<IObject[]>([]);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [hoverId, setHoverId] = useState('');

  useEffect(() => {
    if (editor) {
      setObjects(editor.sceneGraph.toObjects());
      editor.sceneGraph.on('render', () => {
        setObjects(editor.sceneGraph.toObjects());
        setSelectedIds(editor.selectedElements.getIdSet());
      });

      setHoverId(editor.selectedElements.getHoverItem()?.id || '');
      editor.selectedElements.on('hoverItemChange', (item) => {
        const hoverId = item ? item.id : '';
        setHoverId(hoverId);
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

  const setEditorHoverId = (id: string) => {
    if (editor) {
      const graph = editor.sceneGraph.getElementById(id);
      if (graph) {
        editor.selectedElements.setHoverItem(graph);
        editor.sceneGraph.render();
      }
    }
  };

  const toggleVisible = (id: string) => {
    if (editor) {
      const graph = editor.sceneGraph.getElementById(id);
      if (graph) {
        MutateGraphsAndRecord.toggleVisible(editor, [graph]);
        editor.sceneGraph.render();
      }
    }
  };

  return (
    <div className="layer-panel" onMouseDown={(e) => handleMouseDown(e)}>
      <Tree
        treeData={objects}
        activeIds={Array.from(selectedIds)}
        hoverId={hoverId}
        toggleVisible={toggleVisible}
        setHoverId={setEditorHoverId}
      />
    </div>
  );
};
