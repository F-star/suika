import classNames from 'classnames';
import { useEffect, useContext, useState } from 'react';
import { EditorContext } from '../../../../context';
import { ToolBtn } from './components/ToolBtn/ToolBtn';
import './Toolbar.scss';
import { useIntl } from 'react-intl';
import { Ellipse, Hand, Rect, Select } from '@suika/icons';


export const ToolBar = () => {
  const editor = useContext(EditorContext);
  const intl = useIntl();
  const [tool, setTool] = useState('');

  useEffect(() => {
    if (editor) {
      setTool(editor.toolManager.getToolName() || '');
      editor.toolManager.on('change', (toolName: string) => {
        setTool(toolName);
      });
    }
  }, [editor]);

  return (
    <div className="suika-tool-bar">
      <ToolBtn
        className={classNames({ active: tool === 'select' })}
        tooltipContent={intl.formatMessage({ id: 'tool.select' })}
        onClick={() => {
          editor?.toolManager.setTool('select');
        }}
      >
        <Select />
      </ToolBtn>
      <ToolBtn
        className={classNames({ active: tool === 'drawRect' })}
        tooltipContent={intl.formatMessage({ id: 'tool.rectangle' })}
        onClick={() => {
          editor?.toolManager.setTool('drawRect');
        }}
      >
        <Rect />
      </ToolBtn>
      <ToolBtn
        className={classNames({ active: tool === 'drawEllipse' })}
        tooltipContent={intl.formatMessage({ id: 'tool.ellipse' })}
        onClick={() => {
          editor?.toolManager.setTool('drawEllipse');
        }}
      >
        <Ellipse />
      </ToolBtn>
      <ToolBtn
        className={classNames({ active: tool === 'dragCanvas' })}
        tooltipContent={intl.formatMessage({ id: 'tool.hand' })}
        onClick={() => {
          editor?.toolManager.setTool('dragCanvas');
        }}
      >
        <Hand />
      </ToolBtn>
    </div>
  );
};
