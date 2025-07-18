import './Pages.scss';

import { type FC, useContext, useEffect, useState } from 'react';

import { EditorContext } from '../../context';
import { BaseCard } from '../Cards/BaseCard';

export const Pages: FC = () => {
  const editor = useContext(EditorContext);

  const [pageItems, setPageItems] = useState<
    {
      id: string;
      name: string;
    }[]
  >([]);

  useEffect(() => {
    if (!editor) return;

    const pages = editor.doc.graphicsStoreManager.getCanvasItemsData();

    setPageItems(pages);
  }, [editor]);

  return (
    <div className="suika-canvas-list">
      <BaseCard title="Pages">
        {pageItems.map((item) => (
          <div key={item.id}>{item.name}</div>
        ))}
      </BaseCard>
    </div>
  );
};
