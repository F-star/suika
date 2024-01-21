import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../context';
import { IObject } from '../../type';
import './LayerPanel.scss';
import { Tree } from './LayerItem/tree';
import { MutateGraphsAndRecord } from '@suika/core';

export const LayerPanel: FC = () => {
  const editor = useContext(EditorContext);
  const [objects, setObjects] = useState<IObject[]>([]);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [hlId, setHlId] = useState('');

  useEffect(() => {
    if (editor) {
      setObjects(editor.sceneGraph.toObjects());
      editor.sceneGraph.on('render', () => {
        setObjects(editor.sceneGraph.toObjects());
        setSelectedIds(editor.selectedElements.getIdSet());
      });

      setHlId(editor.selectedElements.getHighlightedItem()?.id || '');
      editor.selectedElements.on('highlightedItemChange', (item) => {
        const id = item ? item.id : '';
        setHlId(id);
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

  const setEditorHlId = (id: string) => {
    if (editor) {
      const graph = editor.sceneGraph.getElementById(id) ?? null;

      editor.selectedElements.setHighlightedItem(graph);
      editor.sceneGraph.render();
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
        hlId={hlId}
        toggleVisible={toggleVisible}
        toggleLock={toggleLock}
        setHlId={setEditorHlId}
        setName={setName}
        setSelectedGraph={setSelectedGraph}
      />
    </div>
  );
};
