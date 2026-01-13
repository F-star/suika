import { isWindows } from '@suika/common';
import {
  alignAndRecord,
  AlignType,
  type SuikaEditor,
  type SuikaGraphics,
} from '@suika/core';
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
import { useIntl } from 'react-intl';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { EditorContext } from '../../context';
import { type MessageIds } from '../../locale';
import { BaseCard } from './BaseCard';

interface AlignItemProps {
  icon: JSX.Element;
  alignType: AlignType;
  intlId: MessageIds;
  editor: SuikaEditor | null;
  disabled: boolean;
  hotkey?: string;
}

const AlignItem: FC<AlignItemProps> = ({
  icon,
  alignType,
  intlId,
  editor,
  disabled,
  hotkey,
}) => {
  const intl = useIntl();

  return (
    <Tooltip>
      <TooltipTrigger>
        <div
          className={classNames(
            'flex justify-center items-center mx-[2px] rounded-[3px] w-9 h-8 text-[#333] hover:bg-[#f2f2f2] cursor-pointer',
            {
              'hover:bg-transparent': disabled,
            },
          )}
          onClick={() => {
            if (editor && !disabled) {
              alignAndRecord(editor, alignType);
            }
          }}
        >
          {icon}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {intl.formatMessage({ id: intlId })}
        {hotkey && <span className="ml-4 text-[#ccc]">{hotkey}</span>}
      </TooltipContent>
    </Tooltip>
  );
};

export const AlignCard: FC = () => {
  const editor = useContext(EditorContext);
  const [disabled, setDisable] = useState(true);

  useEffect(() => {
    if (editor) {
      const selectedEls = editor.selectedElements.getItems();
      setDisable(selectedEls.length < 2);

      const handler = (items: SuikaGraphics[]) => {
        setDisable(items.length < 2);
      };

      editor.selectedElements.on('itemsChange', handler);
      return () => {
        editor.selectedElements.off('itemsChange', handler);
      };
    }
  }, [editor]);

  const getHotkey = (key: string) => {
    return isWindows() ? `Alt ${key}` : `⌥${key}`;
  };

  return (
    <BaseCard>
      <div
        className={classNames('flex px-2', {
          'opacity-30': disabled,
        })}
      >
        <AlignItem
          icon={<AlignLeft />}
          alignType={AlignType.Left}
          intlId="align.left"
          editor={editor}
          disabled={disabled}
          hotkey={getHotkey('A')}
        />
        <AlignItem
          icon={<AlignHCenter />}
          alignType={AlignType.HCenter}
          intlId="align.horizontalCenter"
          editor={editor}
          disabled={disabled}
          hotkey={getHotkey('H')}
        />
        <AlignItem
          icon={<AlignRight />}
          alignType={AlignType.Right}
          intlId="align.right"
          editor={editor}
          disabled={disabled}
          hotkey={getHotkey('D')}
        />
        <AlignItem
          icon={<AlignTop />}
          alignType={AlignType.Top}
          intlId="align.top"
          editor={editor}
          disabled={disabled}
          hotkey={getHotkey('W')}
        />
        <AlignItem
          icon={<AlignVCenter />}
          alignType={AlignType.VCenter}
          intlId="align.verticalCenter"
          editor={editor}
          disabled={disabled}
          hotkey={getHotkey('V')}
        />
        <AlignItem
          icon={<IconAlignBottom />}
          alignType={AlignType.Bottom}
          intlId="align.bottom"
          editor={editor}
          disabled={disabled}
          hotkey={getHotkey('S')}
        />
      </div>
    </BaseCard>
  );
};
