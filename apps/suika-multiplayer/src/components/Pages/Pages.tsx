import './Pages.scss';

import { IconButton } from '@suika/components';
import {
  addAndSwitchCanvasRecord,
  MutateGraphsAndRecord,
  removeGraphicsAndRecord,
  type SuikaCanvas,
  switchCanvasRecord,
} from '@suika/core';
import { AddOutlined } from '@suika/icons';
import { type FC, useContext, useEffect, useState } from 'react';

import { EditorContext } from '../../context';
import { BaseCard } from '../Cards/BaseCard';
import { PageContextMenu } from '../ContextMenu';
import { PageItem } from './PageItem';

export const Pages: FC = () => {
  const editor = useContext(EditorContext);

  const [currPageId, setCurrPageId] = useState<string>('');
  const [pageItems, setPageItems] = useState<
    {
      id: string;
      name: string;
    }[]
  >([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [canvasIdByMenu, setCanvasIdByMenu] = useState<string>('');

  useEffect(() => {
    if (!editor) return;

    const updatePageItems = () => {
      const pages = editor.doc.graphicsStoreManager.getCanvasItemsData();
      setPageItems(pages);
      setCurrPageId(editor.doc.getCurrentCanvas().attrs.id);
    };

    updatePageItems();

    editor.sceneGraph.on('render', () => {
      updatePageItems();
    });
  }, [editor]);

  const setName = (id: string, newName: string) => {
    if (editor) {
      const graphics = editor.doc.getGraphicsById(id);
      if (graphics && graphics.attrs.objectName !== newName) {
        MutateGraphsAndRecord.setGraphName(editor, graphics, newName);
        editor.render();
      }
    }
  };

  const switchPage = (canvasId: string) => {
    if (!editor) return;
    switchCanvasRecord(editor, canvasId);
    editor.render();
  };

  const createNewPage = () => {
    if (!editor) return;

    addAndSwitchCanvasRecord(editor, undefined);
    editor.render();
  };

  const handleContextMenu = (
    e: React.MouseEvent<Element, MouseEvent>,
    id: string,
  ) => {
    setCanvasIdByMenu(id);
    setMenuVisible(true);
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="suika-page-list">
      <BaseCard
        title="Pages"
        headerAction={
          <IconButton
            onClick={() => {
              createNewPage();
            }}
          >
            <AddOutlined />
          </IconButton>
        }
      >
        <div className="suika-page-list-content">
          {pageItems.map((item) => (
            <PageItem
              key={item.id}
              id={item.id}
              name={item.name}
              activeId={currPageId}
              setName={setName}
              setSelectedGraph={switchPage}
              onContextMenu={handleContextMenu}
            />
          ))}
        </div>
      </BaseCard>
      <PageContextMenu
        visible={menuVisible}
        setVisible={setMenuVisible}
        pos={menuPos}
        style={{
          width: 150,
        }}
        disabledDelete={pageItems.length <= 1}
        onDelete={() => {
          if (!editor) return;
          const canvas = editor.doc.getGraphicsById(
            canvasIdByMenu,
          ) as SuikaCanvas;
          if (!canvas) return;

          const isCurrentCanvasToDelete = canvas.attrs.id === currPageId;

          const newCurrentCanvas =
            canvas.getNextSibling() || canvas.getPrevSibling();

          editor.commandManager.batchCommandStart();
          removeGraphicsAndRecord(editor, [canvas]);
          if (isCurrentCanvasToDelete && newCurrentCanvas) {
            switchCanvasRecord(editor, newCurrentCanvas.attrs.id);
          }
          editor.commandManager.batchCommandEnd();
        }}
      />
    </div>
  );
};
