import './Pages.scss';

import { IconButton } from '@suika/components';
import {
  addAndSwitchCanvasRecord,
  MutateGraphsAndRecord,
  switchCanvasRecord,
} from '@suika/core';
import { AddOutlined } from '@suika/icons';
import { type FC, useContext, useEffect, useState } from 'react';

import { EditorContext } from '../../context';
import { BaseCard } from '../Cards/BaseCard';
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

  useEffect(() => {
    if (!editor) return;

    const updatePageItems = () => {
      const pages = editor.doc.graphicsStoreManager.getCanvasItemsData();
      setPageItems(pages);
      setCurrPageId(editor.doc.getCurrentCanvas().attrs.id);
    };

    updatePageItems();

    // 监听画布变化
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

    addAndSwitchCanvasRecord(editor, 'New Page');
    editor.render();
  };

  return (
    <div className="suika-canvas-list">
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
        {pageItems.map((item) => (
          <PageItem
            key={item.id}
            id={item.id}
            name={item.name}
            activeId={currPageId}
            setName={setName}
            setSelectedGraph={switchPage}
          />
        ))}
      </BaseCard>
    </div>
  );
};
