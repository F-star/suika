import './AlignCard.scss';

import { alignAndRecord, AlignType, type Graph } from '@suika/core';
import {
  AlignHCenter,
  AlignLeft,
  AlignRight,
  AlignTop,
  AlignVCenter,
  IconAlignBottom,
} from '@suika/icons';
import classNames from 'classnames';
import { type FC, useContext, useEffect, useState } from 'react';

import { EditorContext } from '../../../context';
import { BaseCard } from '../BaseCard';

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
            editor && alignAndRecord(editor, AlignType.Left);
          }}
        >
          <AlignLeft />
        </div>
        <div
          className="align-item"
          onClick={() => {
            editor && alignAndRecord(editor, AlignType.HCenter);
          }}
        >
          <AlignHCenter />
        </div>
        <div
          className="align-item"
          onClick={() => {
            editor && alignAndRecord(editor, AlignType.Right);
          }}
        >
          <AlignRight />
        </div>
        <div
          className="align-item"
          onClick={() => {
            editor && alignAndRecord(editor, AlignType.Top);
          }}
        >
          <AlignTop />
        </div>
        <div
          className="align-item"
          onClick={() => {
            editor && alignAndRecord(editor, AlignType.VCenter);
          }}
        >
          <AlignVCenter />
        </div>
        <div
          className="align-item"
          onClick={() => {
            editor && alignAndRecord(editor, AlignType.Bottom);
          }}
        >
          <IconAlignBottom />
        </div>
      </div>
    </BaseCard>
  );
};
