import './Toolbar.scss';

import { Button } from '@suika/components';
import {
  EllipseOutlined,
  HandOutlined,
  LineOutlined,
  PenOutlined,
  RectOutlined,
  SelectOutlined,
  TextFilled,
} from '@suika/icons';
import classNames from 'classnames';
import { useContext, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { EditorContext } from '../../../../context';
import { type MessageIds } from '../../../../locale';
import { ToolBtn } from './components/ToolBtn';
import { Menu } from './menu';

export const ToolBar = () => {
  const editor = useContext(EditorContext);
  const intl = useIntl();
  const [currTool, setCurrTool] = useState('');
  const [enableTools, setEnableTools] = useState<string[]>([]);
  const [isPathEditorActive, setIsPathEditorActive] = useState(false);

  useEffect(() => {
    if (editor) {
      setCurrTool(editor.toolManager.getActiveToolName() || '');
      setEnableTools(editor.toolManager.getEnableTools());
      setIsPathEditorActive(editor.pathEditor.isActive());

      const onTogglePathEditor = (active: boolean) => {
        setIsPathEditorActive(active);
      };
      const onSwitchTool = (toolName: string) => {
        setCurrTool(toolName);
      };
      const onChangeEnableTools = (tools: string[]) => {
        setEnableTools(tools);
      };

      editor.toolManager.on('switchTool', onSwitchTool);
      editor.toolManager.on('changeEnableTools', onChangeEnableTools);
      editor.pathEditor.on('toggle', onTogglePathEditor);
      return () => {
        editor.toolManager.off('switchTool', onSwitchTool);
        editor.toolManager.off('changeEnableTools', onChangeEnableTools);
        editor.pathEditor.off('toggle', onTogglePathEditor);
      };
    }
  }, [editor]);

  const keyMap: Record<
    string,
    { name: string; hotkey: string; intlId: MessageIds; icon: JSX.Element }
  > = {
    select: {
      name: 'select',
      hotkey: 'V',
      intlId: 'tool.select',
      icon: <SelectOutlined />,
    },
    drawRect: {
      name: 'drawRect',
      hotkey: 'R',
      intlId: 'tool.rectangle',
      icon: <RectOutlined />,
    },
    drawEllipse: {
      name: 'drawEllipse',
      hotkey: 'O',
      intlId: 'tool.ellipse',
      icon: <EllipseOutlined />,
    },
    pathSelect: {
      name: 'pathSelect',
      hotkey: 'V',
      intlId: 'tool.select',
      icon: <SelectOutlined />,
    },
    drawPath: {
      name: 'drawPath',
      hotkey: 'P',
      intlId: 'tool.pen',
      icon: <PenOutlined />,
    },
    drawLine: {
      name: 'drawLine',
      hotkey: 'L',
      intlId: 'tool.line',
      icon: <LineOutlined />,
    },
    drawText: {
      name: 'drawText',
      hotkey: 'T',
      intlId: 'tool.text',
      icon: <TextFilled />,
    },
    dragCanvas: {
      name: 'dragCanvas',
      hotkey: 'H',
      intlId: 'tool.hand',
      icon: <HandOutlined />,
    },
  };

  return (
    <div className="suika-tool-bar">
      <Menu />
      {enableTools.map((toolType) => {
        const tool = keyMap[toolType];
        return (
          <ToolBtn
            key={tool.name}
            className={classNames({ active: currTool === tool.name })}
            tooltipContent={intl.formatMessage({ id: tool.intlId })}
            hotkey={tool.hotkey}
            onMouseDown={() => {
              editor?.toolManager.setActiveTool(tool.name);
            }}
          >
            {tool.icon}
          </ToolBtn>
        );
      })}

      {isPathEditorActive && (
        <Button
          style={{
            marginLeft: '16px',
          }}
          onClick={() => {
            if (editor) {
              editor.pathEditor.inactive();
            }
          }}
        >
          {intl.formatMessage({ id: 'done' })}
        </Button>
      )}
    </div>
  );
};
