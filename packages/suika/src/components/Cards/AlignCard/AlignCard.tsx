import classNames from 'classnames';
import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../../context';
import { AlignType } from '../../../editor/commands/align';
import { Graph } from '../../../editor/scene/graph';
import { BaseCard } from '../BaseCard';
import './AlignCard.scss';
import {
  IconAlignBottom,
  IconAlignHCenter,
  IconAlignLeft,
  IconAlignRight,
  IconAlignTop,
  IconAlignVCenter,
} from './icons';

export const AlignCard: FC = () => {
  const editor = useContext(EditorContext);
  const [disabled, setDisable] = useState(true);

  useEffect(() => {
    if (editor) {
      const selectedEls = editor.selectedElements.getItems();
      setDisable(selectedEls.length < 2);

      const handler = (items: Graph[]) => {
        setDisable(items.length < 2);
      };

      editor.selectedElements.on('itemsChange', handler);
      return () => {
        editor.selectedElements.off('itemsChange', handler);
      };
    }
  }, [editor]);

  return (
    <BaseCard>
      <div className={classNames('align-list', { disabled })}>
        <div
          className="align-item"
          onClick={() => {
            editor?.selectedElements.align(AlignType.Left);
          }}
        >
          <IconAlignLeft />
        </div>
        <div
          className="align-item"
          onClick={() => {
            editor?.selectedElements.align(AlignType.HCenter);
          }}
        >
          <IconAlignHCenter />
        </div>
        <div
          className="align-item"
          onClick={() => {
            editor?.selectedElements.align(AlignType.Right);
          }}
        >
          <IconAlignRight />
        </div>
        <div className="align-item">
          <IconAlignTop />
        </div>
        <div className="align-item">
          <IconAlignVCenter />
        </div>
        <div className="align-item">
          <IconAlignBottom />
        </div>
      </div>
    </BaseCard>
  );
};
