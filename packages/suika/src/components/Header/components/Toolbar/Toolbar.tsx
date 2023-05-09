import classNames from 'classnames';
import { useEffect, useContext, useState } from 'react';
import { EditorContext } from '../../../../context';
import { ToolBtn } from './components/ToolBtn/ToolBtn';
import './Toolbar.scss';
import { useIntl } from 'react-intl';
import {
  EllipseOutlined,
  HandOutlined,
  RectOutlined,
  SelectOutlined,
} from '@suika/icons';

export const ToolBar = () => {
  const editor = useContext(EditorContext);
  const intl = useIntl();
  const [currTool, setCurrTool] = useState('');

  useEffect(() => {
    if (editor) {
      setCurrTool(editor.toolManager.getToolName() || '');
      editor.toolManager.on('change', (toolName: string) => {
        setCurrTool(toolName);
      });
    }
  }, [editor]);

  return (
    <div className="suika-tool-bar">
      {(
        [
          { name: 'select', intlId: 'tool.select', icon: <SelectOutlined /> },
          {
            name: 'drawRect',
            intlId: 'tool.rectangle',
            icon: <RectOutlined />,
          },
          {
            name: 'drawEllipse',
            intlId: 'tool.ellipse',
            icon: <EllipseOutlined />,
          },
          {
            name: 'dragCanvas',
            intlId: 'tool.hand',
            icon: <HandOutlined />,
          },
        ] as const
      ).map((tool) => (
        <ToolBtn
          key={tool.name}
          className={classNames({ active: currTool === tool.name })}
          tooltipContent={intl.formatMessage({ id: tool.intlId })}
          onClick={() => {
            editor?.toolManager.setTool(tool.name);
          }}
        >
          {tool.icon}
        </ToolBtn>
      ))}
    </div>
  );
};
