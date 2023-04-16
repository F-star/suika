import classNames from 'classnames';
import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../../context';
import { AlignType } from '../../../editor/commands/align';
import { Graph } from '../../../editor/scene/graph';
import { BaseCard } from '../BaseCard';
import './AlignCard.scss';
import { AlignHCenter, AlignLeft, AlignRight, AlignTop, AlignVCenter, IconAlignBottom } from '@suika/icons';

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
          <AlignLeft />
        </div>
        <div
          className="align-item"
          onClick={() => {
            editor?.selectedElements.align(AlignType.HCenter);
          }}
        >
          <AlignHCenter />
        </div>
        <div
          className="align-item"
          onClick={() => {
            editor?.selectedElements.align(AlignType.Right);
          }}
        >
          <AlignRight />
        </div>
        <div className="align-item"
          onClick={() => {
            editor?.selectedElements.align(AlignType.Top);
          }}
        >
          <AlignTop />
        </div>
        <div className="align-item"
          onClick={() => {
            editor?.selectedElements.align(AlignType.VCenter);
          }}
        >
          <AlignVCenter />
        </div>
        <div className="align-item"
          onClick={() => {
            editor?.selectedElements.align(AlignType.Bottom);
          }}
        >
          <IconAlignBottom />
        </div>
      </div>
    </BaseCard>
  );
};
