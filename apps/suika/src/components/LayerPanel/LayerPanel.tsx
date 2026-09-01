import './LayerPanel.scss';

import { isWindows } from '@suika/common';
import {
  type IObject,
  MutateGraphsAndRecord,
  SelectCmd,
  type SuikaGraphics,
} from '@suika/core';
import { type FC, useContext, useEffect, useRef, useState } from 'react';

import { EditorContext } from '../../context';
import { LayerTree } from './LayerTree';

export const LayerPanel: FC = () => {
  const editor = useContext(EditorContext);
  const [objects, setObjects] = useState<IObject[]>([]);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [hlId, setHlId] = useState('');
  const [focusId, setFocusId] = useState('');
  const isLayerTreeSelectionRef = useRef(false);

  useEffect(() => {
    if (editor) {
      setObjects(editor.sceneGraph.toObjects());
      setSelectedIds(editor.selectedElements.getIdSet());
      editor.sceneGraph.on('render', () => {
        setObjects(editor.sceneGraph.toObjects());
        setSelectedIds(editor.selectedElements.getIdSet());
      });

      const handleItemsChange = () => {
        const ids = editor.selectedElements.getIdSet();
        setSelectedIds(ids);
        if (isLayerTreeSelectionRef.current) {
          isLayerTreeSelectionRef.current = false;
        } else {
          setFocusId(Array.from(ids)[0] ?? '');
        }
      };
      editor.selectedElements.on('itemsChange', handleItemsChange);

      setHlId(editor.selectedElements.getHighlightedItem()?.attrs.id || '');
      const handleHighlightedItemChange = (item: SuikaGraphics | null) => {
        const id = item ? item.attrs.id : '';
        setHlId(id);
      };
      editor.selectedElements.on(
        'highlightedItemChange',
        handleHighlightedItemChange,
      );

      return () => {
        editor.selectedElements.off('itemsChange', handleItemsChange);
        editor.selectedElements.off(
          'highlightedItemChange',
          handleHighlightedItemChange,
        );
      };
    }
  }, [editor]);

  const setSelectedGraph = (
    objId: string,
    event: React.MouseEvent<Element, MouseEvent>,
  ) => {
    if (!editor) return;

    const prevSelectedIds = editor.selectedElements.getIdSet();
    let isSelectUpdated = false;
    isLayerTreeSelectionRef.current = true;

    const isToggle = isWindows() ? event.ctrlKey : event.metaKey;
    if (isToggle) {
      // parent and child can not be selected together, remove parent in selected object
      isSelectUpdated = editor.selectedElements.toggleItemById(objId);
    } else if (event.shiftKey) {
      editor.selectedElements.continuousSelect(objId);
      if (editor.selectedElements.getSelectedCount() !== prevSelectedIds.size) {
        isSelectUpdated = true;
      } else {
        const currentSelectedIds = editor.selectedElements.getIdSet();
        for (const id of prevSelectedIds) {
          if (!currentSelectedIds.has(id)) {
            isSelectUpdated = true;
            break;
          }
        }
      }
    } else {
      editor.selectedElements.setItemsById(new Set([objId]));
      isSelectUpdated = !(
        prevSelectedIds.size === 1 && prevSelectedIds.has(objId)
      );
    }
    if (isSelectUpdated) {
      const command = new SelectCmd('toggle item by id', editor, {
        prevItems: prevSelectedIds,
        items: editor.selectedElements.getIdSet(),
      });
      editor.commandManager.pushCommand(command);
    } else {
      isLayerTreeSelectionRef.current = false;
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
        focusId={focusId}
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
