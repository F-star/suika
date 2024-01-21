import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../context';
import { GraphAttrs } from '@suika/core';
import { AlignCard } from '../Cards/AlignCard';
import { ElementsInfoCards } from '../Cards/ElementsInfoCard';
import { FillCard } from '../Cards/FillCard';
import './style.scss';
import { FormattedMessage } from 'react-intl';
import { StrokeCard } from '../Cards/StrokeCard';
import { DebugPanel } from '../DebugPanel';

enum PanelType {
  Global = 'Global',
  SelectedElements = 'SelectedElements',
}

export const InfoPanel: FC = () => {
  const editor = useContext(EditorContext);
  const [type, setType] = useState(PanelType.Global);
  // select panel type by selected elements

  const showDebugPanel = localStorage.getItem('suika-debug-panel') === 'true';

  useEffect(() => {
    if (editor) {
      const handler = (items: GraphAttrs[]) => {
        setType(items.length ? PanelType.SelectedElements : PanelType.Global);
      };
      editor.selectedElements.on('itemsChange', handler);

      return () => {
        editor.selectedElements.off('itemsChange', handler);
      };
    }
  }, [editor]);

  return (
    <div className="info-panel" onKeyDown={(e) => e.stopPropagation()}>
      {type === PanelType.SelectedElements && (
        <>
          <AlignCard />
          <ElementsInfoCards />
          <FillCard key="fill" />
          <StrokeCard key="stroke" />
        </>
      )}
      {type === PanelType.Global && (
        <div className="empty-text">
          <FormattedMessage id="noSelectedShapes" />
        </div>
      )}

      {showDebugPanel && <DebugPanel />}
    </div>
  );
};
