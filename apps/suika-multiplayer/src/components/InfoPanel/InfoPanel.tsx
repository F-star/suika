import { type SuikaGraphics } from '@suika/core';
import { type FC, useContext, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { EditorContext } from '../../context';
import { AlignCard } from '../Cards/AlignCard';
import { ElementsInfoCards } from '../Cards/ElementsInfoCard';
import { FillCard } from '../Cards/FillCard';
import { LayerInfoCard } from '../Cards/LayerInfoCard';
import { StrokeCard } from '../Cards/StrokeCard';
import { TypographyCard } from '../Cards/TypographyCard';
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
      const handler = (items: SuikaGraphics[]) => {
        setType(items.length ? PanelType.SelectedElements : PanelType.Global);
      };
      editor.selectedElements.on('itemsChange', handler);

      return () => {
        editor.selectedElements.off('itemsChange', handler);
      };
    }
  }, [editor]);

  return (
    <div
      className="absolute top-0 right-0 z-[40] border-l border-[#e6e6e6] w-[240px] h-[calc(100vh-48px)] text-xs bg-white select-none"
      onKeyDown={(e) => e.stopPropagation()}
    >
      {type === PanelType.SelectedElements && (
        <>
          <AlignCard />
          <ElementsInfoCards />
          <TypographyCard />
          <LayerInfoCard />
          <FillCard key="fill" />
          <StrokeCard key="stroke" />
        </>
      )}
      {type === PanelType.Global && (
        <div className="text-[#b3b3b3] p-4">
          <FormattedMessage id="noSelectedShapes" />
        </div>
      )}

      {showDebugPanel && <DebugPanel />}
    </div>
  );
};
