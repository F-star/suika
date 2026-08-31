import './menu.scss';

import { isWindows } from '@suika/common';
import { Dropdown, type IDropdownProps } from '@suika/components';
import {
  arrangeAndRecord,
  ArrangeType,
  exportService,
  flipHorizontalAndRecord,
  flipVerticalAndRecord,
  type IHistoryStatus,
  importService,
  MutateGraphsAndRecord,
  type SettingValue,
} from '@suika/core';
import { MenuOutlined } from '@suika/icons';
import { type FC, useContext, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { EditorContext } from '../../../../../context';
import { type MessageIds } from '../../../../../locale';

export const Menu: FC = () => {
  const intl = useIntl();
  const editor = useContext(EditorContext);
  const [historyStatus, setHistoryStatus] = useState<IHistoryStatus>({
    canRedo: false,
    canUndo: false,
  });
  const [hasSelection, setHasSelection] = useState(false);

  const [editorSetting, setEditorSetting] = useState<SettingValue>(
    {} as SettingValue,
  );

  useEffect(() => {
    if (!editor) return;
    setEditorSetting(editor.setting.getAttrs());
    const handler = (keys: SettingValue) => {
      setEditorSetting(keys);
    };
    editor.setting.on('update', handler);
    return () => {
      editor.setting.off('update', handler);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    setHistoryStatus(editor.commandManager.getStatus());
    setHasSelection(!editor.selectedElements.isEmpty());

    const handleHistoryChange = (status: IHistoryStatus) => {
      setHistoryStatus(status);
    };
    const handleSelectionChange = () => {
      setHasSelection(!editor.selectedElements.isEmpty());
    };

    editor.commandManager.on('change', handleHistoryChange);
    editor.selectedElements.on('itemsChange', handleSelectionChange);
    return () => {
      editor.commandManager.off('change', handleHistoryChange);
      editor.selectedElements.off('itemsChange', handleSelectionChange);
    };
  }, [editor]);

  const t = (params: { id: MessageIds }) => intl.formatMessage(params);

  const items: IDropdownProps['items'] = [
    {
      key: 'file',
      label: t({ id: 'file' }),
      children: [
        {
          key: 'import',
          label: t({ id: 'import.originFile' }),
        },
        {
          key: 'export',
          label: t({ id: 'export.originFile' }),
        },
        {
          key: 'exportCurrentPageAsSVG',
          label: t({ id: 'export.currentPageAsSVG' }),
        },
        {
          key: 'exportCurrentPageAsPNG',
          label: t({ id: 'export.currentPageAsPNG' }),
        },
      ],
    },
    {
      key: 'edit',
      label: t({ id: 'edit' }),
      children: [
        {
          key: 'undo',
          label: t({ id: 'command.undo' }),
          suffix: isWindows() ? 'Ctrl+Z' : '⌘Z',
          disabled: !historyStatus.canUndo,
        },
        {
          key: 'redo',
          label: t({ id: 'command.redo' }),
          suffix: isWindows() ? 'Ctrl+Shift+Z' : '⇧⌘Z',
          disabled: !historyStatus.canRedo,
        },
        { type: 'divider' },
        {
          key: 'copy',
          label: t({ id: 'command.copy' }),
          suffix: isWindows() ? 'Ctrl+C' : '⌘C',
          disabled: !hasSelection,
        },
        {
          key: 'copyAsSVG',
          label: t({ id: 'command.copyAsSVG' }),
          disabled: !hasSelection,
        },
        { type: 'divider' },
        {
          key: 'selectAll',
          label: t({ id: 'command.selectAll' }),
          suffix: isWindows() ? 'Ctrl+A' : '⌘A',
        },
      ],
    },
    {
      key: 'object',
      label: t({ id: 'object' }),
      children: [
        {
          key: 'bringToFront',
          label: t({ id: 'arrange.front' }),
          suffix: ']',
          disabled: !hasSelection,
        },
        {
          key: 'bringForward',
          label: t({ id: 'arrange.forward' }),
          suffix: isWindows() ? 'Ctrl+]' : '⌘]',
          disabled: !hasSelection,
        },
        {
          key: 'sendBackward',
          label: t({ id: 'arrange.backward' }),
          suffix: isWindows() ? 'Ctrl+[' : '⌘[',
          disabled: !hasSelection,
        },
        {
          key: 'sendToBack',
          label: t({ id: 'arrange.back' }),
          suffix: '[',
          disabled: !hasSelection,
        },
        { type: 'divider' },
        {
          key: 'flipHorizontal',
          label: t({ id: 'flip.horizontal' }),
          suffix: isWindows() ? 'Shift+H' : '⇧H',
          disabled: !hasSelection,
        },
        {
          key: 'flipVertical',
          label: t({ id: 'flip.vertical' }),
          suffix: isWindows() ? 'Shift+V' : '⇧V',
          disabled: !hasSelection,
        },
        { type: 'divider' },
        {
          key: 'toggleVisible',
          label: t({ id: 'showOrHide' }),
          suffix: isWindows() ? 'Ctrl+Shift+H' : '⇧⌘H',
          disabled: !hasSelection,
        },
        {
          key: 'toggleLock',
          label: t({ id: 'lockOrUnlock' }),
          suffix: isWindows() ? 'Ctrl+Shift+L' : '⇧⌘L',
          disabled: !hasSelection,
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      key: 'preference',
      label: t({ id: 'preference' }),
      children: [
        {
          key: 'snapToObjects',
          check: editorSetting.snapToObjects,
          label: t({ id: 'snapToObjects' }),
        },
        {
          key: 'keepToolSelectedAfterUse',
          check: editorSetting.keepToolSelectedAfterUse,
          label: t({ id: 'keepToolSelectedAfterUse' }),
        },
        {
          key: 'invertZoomDirection',
          check: editorSetting.invertZoomDirection,
          label: t({ id: 'invertZoomDirection' }),
        },
        {
          key: 'highlightLayersOnHover',
          check: editorSetting.highlightLayersOnHover,
          label: t({ id: 'highlightLayersOnHover' }),
        },
        {
          key: 'flipObjectsWhileResizing',
          check: editorSetting.flipObjectsWhileResizing,
          label: t({ id: 'flipObjectsWhileResizing' }),
        },
      ],
    },
  ];

  const handleClick = ({ key }: { key: string }) => {
    if (!editor) return;

    let preventClose = false;

    switch (key) {
      case 'undo':
        editor.commandManager.undo();
        break;
      case 'redo':
        editor.commandManager.redo();
        break;
      case 'copy':
        editor.clipboard.copy();
        break;
      case 'copyAsSVG':
        editor.clipboard.copyAsSVG();
        break;
      case 'selectAll':
        editor.selectedElements.selectAll();
        editor.render();
        break;
      case 'bringToFront':
        arrangeAndRecord(editor, ArrangeType.Front);
        break;
      case 'bringForward':
        arrangeAndRecord(editor, ArrangeType.Forward);
        break;
      case 'sendBackward':
        arrangeAndRecord(editor, ArrangeType.Backward);
        break;
      case 'sendToBack':
        arrangeAndRecord(editor, ArrangeType.Back);
        break;
      case 'flipHorizontal':
        flipHorizontalAndRecord(editor, editor.selectedElements.getItems());
        editor.render();
        break;
      case 'flipVertical':
        flipVerticalAndRecord(editor, editor.selectedElements.getItems());
        editor.render();
        break;
      case 'toggleVisible':
        MutateGraphsAndRecord.toggleVisible(
          editor,
          editor.selectedElements.getItems(),
        );
        editor.render();
        break;
      case 'toggleLock':
        MutateGraphsAndRecord.toggleLock(
          editor,
          editor.selectedElements.getItems(),
        );
        editor.render();
        break;
      case 'import':
        importService.importOriginFile(editor);
        break;
      case 'export':
        exportService.exportOriginFile(editor);
        break;
      case 'exportCurrentPageAsSVG':
        exportService.exportCurrentPageSVG(editor);
        break;
      case 'exportCurrentPageAsPNG':
        exportService.exportCurrentPagePNG(editor);
        break;
      case 'keepToolSelectedAfterUse':
      case 'invertZoomDirection':
      case 'highlightLayersOnHover':
      case 'flipObjectsWhileResizing':
      case 'snapToObjects':
        editor.setting.toggle(key);
        preventClose = true;
        break;
      default:
        break;
    }

    return preventClose;
  };

  return (
    <Dropdown items={items} onClick={handleClick}>
      <div className="sk-ed-menu-btn">
        <MenuOutlined />
      </div>
    </Dropdown>
  );
};
