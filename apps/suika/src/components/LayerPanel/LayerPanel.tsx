import './LayerPanel.scss';

import { isWindows } from '@suika/common';
import {
  type IObject,
  MutateGraphsAndRecord,
  repositionAfterAndRecord,
  repositionBeforeAndRecord,
  repositionInsideAndRecord,
  SelectCmd,
  type SuikaGraphics,
} from '@suika/core';
import {
  type FC,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { EditorContext } from '../../context';
import { LayerTree } from './LayerTree';

export const LayerPanel: FC = () => {
  const editor = useContext(EditorContext);
  const [objects, setObjects] = useState<IObject[]>([]);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [hlId, setHlId] = useState('');
  const [focusId, setFocusId] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const isLayerTreeSelectionRef = useRef(false);
  const lastFocusIdRef = useRef('');

  const ancestorIdsById = useMemo(() => {
    const ancestorsById = new Map<string, string[]>();

    const collectAncestorIds = (items: IObject[], ancestors: string[]) => {
      items.forEach((item) => {
        ancestorsById.set(item.id, ancestors);
        if (item.children?.length) {
          collectAncestorIds(item.children, [...ancestors, item.id]);
        }
      });
    };

    collectAncestorIds(objects, []);
    return ancestorsById;
  }, [objects]);

  // Expand the ancestors of the focused layer, so that it is visible in the tree.
  useEffect(() => {
    if (!focusId) {
      lastFocusIdRef.current = '';
      return;
    }
    if (lastFocusIdRef.current === focusId) return;

    lastFocusIdRef.current = focusId;
    const ancestorIds = ancestorIdsById.get(focusId) ?? [];
    setCollapsedIds((ids) => {
      const nextIds = new Set(ids);
      ancestorIds.forEach((id) => nextIds.delete(id));
      return nextIds.size === ids.size ? ids : nextIds;
    });
  }, [ancestorIdsById, focusId]);

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

      // App-side decision: collapse the imported SVG group in the layer panel
      // by default, as it may contain a large number of shapes.
      const handleSvgImported = ({ groupId }: { groupId: string }) => {
        setCollapsedIds((prevIds) => {
          const nextIds = new Set(prevIds);
          nextIds.add(groupId);
          return nextIds;
        });
      };
      editor.on('svgImported', handleSvgImported);

      return () => {
        editor.selectedElements.off('itemsChange', handleItemsChange);
        editor.selectedElements.off(
          'highlightedItemChange',
          handleHighlightedItemChange,
        );
        editor.off('svgImported', handleSvgImported);
      };
    }
  }, [editor]);

  const toggleExpanded = (id: string) => {
    setCollapsedIds((ids) => {
      const nextIds = new Set(ids);
      if (nextIds.has(id)) nextIds.delete(id);
      else nextIds.add(id);
      return nextIds;
    });
  };

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

  const reposition = (
    draggedIds: string[],
    targetId: string,
    position: 'before' | 'after' | 'inside',
  ) => {
    if (!editor) return;

    const target = editor.doc.getGraphicsById(targetId);
    const entities = draggedIds
      .map((id) => editor.doc.getGraphicsById(id))
      .filter((entity): entity is NonNullable<typeof entity> => !!entity);
    if (!target || !entities.length) return;

    switch (position) {
      case 'before':
        repositionAfterAndRecord(editor, target, entities);
        break;
      case 'after':
        repositionBeforeAndRecord(editor, target, entities);
        break;
      case 'inside':
        repositionInsideAndRecord(editor, target, entities);
        break;
    }
    editor.render();
  };

  return (
    <div className="layer-panel">
      <LayerTree
        treeData={objects}
        activeIds={Array.from(selectedIds)}
        focusId={focusId}
        hlId={hlId}
        collapsedIds={collapsedIds}
        toggleExpanded={toggleExpanded}
        toggleVisible={toggleVisible}
        toggleLock={toggleLock}
        setHlId={setEditorHlId}
        setName={setName}
        setSelectedGraph={setSelectedGraph}
        getLayerIcon={getLayerIcon}
        zoomGraphicsToFit={zoomGraphicsToFit}
        reposition={reposition}
      />
    </div>
  );
};
