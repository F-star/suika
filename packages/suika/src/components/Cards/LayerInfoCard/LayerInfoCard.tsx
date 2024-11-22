import './LayerInfoCard.scss';

import { Transaction } from '@suika/core';
import { type FC, useContext, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { EditorContext } from '../../../context';
import { PercentInput } from '../../input/PercentInput';
import { BaseCard } from '../BaseCard';

export const LayerInfoCard: FC = () => {
  const [opacity, setOpacity] = useState<number | string>(1);

  const intl = useIntl();
  const MIXED = intl.formatMessage({ id: 'mixed' });

  const editor = useContext(EditorContext);
  useEffect(() => {
    if (!editor) return;

    const updateOpacity = () => {
      if (!editor) return;
      const items = editor.selectedElements.getItems();
      if (!items.length) return;

      let opacity: number | string = items[0].getOpacity();
      for (let i = 1; i < items.length; i++) {
        if (opacity !== items[i].getOpacity()) {
          opacity = MIXED;
          break;
        }
      }
      setOpacity(opacity);
    };

    updateOpacity();
    editor.sceneGraph.on('render', updateOpacity);
    return () => {
      editor.sceneGraph.off('render', updateOpacity);
    };
  }, [editor, MIXED]);

  const recordOpacityChange = (value: number) => {
    if (!editor) return;
    const items = editor.selectedElements.getItems();
    if (!items.length) return;

    const transaction = new Transaction(editor);
    for (const el of items) {
      transaction.recordOld(el.attrs.id, { opacity: el.getOpacity() });
      el.updateAttrs({ opacity: value });
      transaction.update(el.attrs.id, { opacity: value });
    }
    transaction.commit('Update Opacity');

    setOpacity(value);
  };

  return (
    <BaseCard title={intl.formatMessage({ id: 'layer' })}>
      <div className="suika-layer-info-card">
        <PercentInput
          value={opacity}
          min={0}
          max={1}
          onChange={recordOpacityChange}
        />
      </div>
    </BaseCard>
  );
};
