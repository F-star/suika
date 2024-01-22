import './Toolbar.scss';

import {
  EllipseOutlined,
  HandOutlined,
  LineOutlined,
  RectOutlined,
  SelectOutlined,
  TextFilled,
} from '@suika/icons';
import classNames from 'classnames';
import { useContext, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { EditorContext } from '../../../../context';
import { ToolBtn } from './components/ToolBtn';
import { Menu } from './menu';

export const ToolBar = () => {
  const editor = useContext(EditorContext);
  const intl = useIntl();
  const [currTool, setCurrTool] = useState('');

  useEffect(() => {
    if (editor) {
      setCurrTool(editor.toolManager.getActiveToolName() || '');
      editor.toolManager.on('change', (toolName: string) => {
        setCurrTool(toolName);
      });
    }
  }, [editor]);

  return (
    <div className="suika-tool-bar">
      <Menu />
      {(
        [
          {
            name: 'select',
            hotkey: 'V',
            intlId: 'tool.select',
            icon: <SelectOutlined />,
          },
          {
            name: 'drawRect',
            hotkey: 'R',
            intlId: 'tool.rectangle',
            icon: <RectOutlined />,
          },
          {
            name: 'drawEllipse',
            hotkey: 'O',
            intlId: 'tool.ellipse',
            icon: <EllipseOutlined />,
          },
          {
            name: 'drawLine',
            hotkey: 'L',
            intlId: 'tool.line',
            icon: <LineOutlined />,
          },
          {
            name: 'drawText',
            hotkey: 'T',
            intlId: 'tool.text',
            icon: <TextFilled />,
          },
          {
            name: 'dragCanvas',
            hotkey: 'H',
            intlId: 'tool.hand',
            icon: <HandOutlined />,
          },
        ] as const
      ).map((tool) => (
        <ToolBtn
          key={tool.name}
          className={classNames({ active: currTool === tool.name })}
          tooltipContent={intl.formatMessage({ id: tool.intlId })}
          hotkey={tool.hotkey}
          onClick={() => {
            editor?.toolManager.setActiveTool(tool.name);
          }}
        >
          {tool.icon}
        </ToolBtn>
      ))}
    </div>
  );
};
