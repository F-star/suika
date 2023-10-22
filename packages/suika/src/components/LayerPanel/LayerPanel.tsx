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

  const setSelectedGraph = (
    objId: string,
    event: React.MouseEvent<Element, MouseEvent>,
  ) => {
    if (!editor) return;
    if (event.ctrlKey || event.metaKey) {
      editor.selectedElements.toggleItemById(objId);
    } else {
      editor.selectedElements.setItemsById(new Set([objId]));
    }
    editor.sceneGraph.render();
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

  const setName = (id: string, newName: string) => {
    if (editor) {
      const graph = editor.sceneGraph.getElementById(id);
      if (graph && graph.objectName !== newName) {
        MutateGraphsAndRecord.setGraphName(editor, graph, newName);
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

  const toggleLock = (id: string) => {
    if (editor) {
      const graph = editor.sceneGraph.getElementById(id);
      if (graph) {
        MutateGraphsAndRecord.toggleLock(editor, [graph]);
        editor.sceneGraph.render();
      }
    }
  };

  return (
    <div className="layer-panel">
      <Tree
        treeData={objects}
        activeIds={Array.from(selectedIds)}
        hoverId={hoverId}
        toggleVisible={toggleVisible}
        toggleLock={toggleLock}
        setHoverId={setEditorHoverId}
        setName={setName}
        setSelectedGraph={setSelectedGraph}
      />
    </div>
  );
};
