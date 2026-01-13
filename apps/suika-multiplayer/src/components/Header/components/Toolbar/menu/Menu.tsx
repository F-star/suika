import './menu.scss';

import { Dropdown, type IDropdownProps } from '@suika/components';
import { exportService, importService, type SettingValue } from '@suika/core';
import { MenuOutlined } from '@suika/icons';
import { type FC, useContext, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { EditorContext } from '../../../../../context';
import { type MessageIds } from '../../../../../locale';

export const Menu: FC = () => {
  const intl = useIntl();
  const editor = useContext(EditorContext);

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
