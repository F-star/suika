import './LayerPanel.scss';

import { type IObject, MutateGraphsAndRecord } from '@suika/core';
import { type FC, useContext, useEffect, useState } from 'react';

import { EditorContext } from '../../context';
import { LayerTree } from './LayerTree';

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

      setHlId(editor.selectedElements.getHighlightedItem()?.attrs.id || '');
      editor.selectedElements.on('highlightedItemChange', (item) => {
        const id = item ? item.attrs.id : '';
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
      // parent and child can not be selected together, remove parent in selected object
      editor.selectedElements.toggleItemById(objId, {
        disableParentAndChildCoexist: true,
      });
    } else {
      editor.selectedElements.setItemsById(new Set([objId]));
    }
    editor.render();
  };

  const getLayerIcon = (id: string) => {
    if (!editor) return '';

    const graphics = editor.doc.getGraphicsById(id);
    return graphics ? graphics.getLayerIconPath() : '';
  };

  const zoomGraphicsToFit = (id: string) => {
    if (editor) {
      const graphics = editor.doc.getGraphicsById(id);
      if (graphics) {
        editor.viewportManager.zoomToGraphics(graphics);
        editor.render();
      }
    }
  };

  const setEditorHlId = (id: string) => {
    if (editor) {
      const graphics = editor.doc.getGraphicsById(id) ?? null;

      editor.selectedElements.setHighlightedItem(graphics);
      editor.render();
    }
  };

  const setName = (id: string, newName: string) => {
    if (editor) {
      const graphics = editor.doc.getGraphicsById(id);
      if (graphics && graphics.attrs.objectName !== newName) {
        MutateGraphsAndRecord.setGraphName(editor, graphics, newName);
        editor.render();
      }
    }
  };

  const toggleVisible = (id: string) => {
    if (editor) {
      const graphics = editor.doc.getGraphicsById(id);
      if (graphics) {
        MutateGraphsAndRecord.toggleVisible(editor, [graphics]);
        editor.render();
      }
    }
  };

  const toggleLock = (id: string) => {
    if (editor) {
      const graphics = editor.doc.getGraphicsById(id);
      if (graphics) {
        MutateGraphsAndRecord.toggleLock(editor, [graphics]);
        editor.render();
      }
    }
  };

  return (
    <div className="layer-panel">
      <LayerTree
        treeData={objects}
        activeIds={Array.from(selectedIds)}
        hlId={hlId}
        toggleVisible={toggleVisible}
        toggleLock={toggleLock}
        setHlId={setEditorHlId}
        setName={setName}
        setSelectedGraph={setSelectedGraph}
        getLayerIcon={getLayerIcon}
        zoomGraphicsToFit={zoomGraphicsToFit}
      />
    </div>
  );
};
