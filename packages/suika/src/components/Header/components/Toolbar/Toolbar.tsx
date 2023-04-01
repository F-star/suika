import classNames from 'classnames';
import { useEffect, useContext, useState } from 'react';
import { EditorContext } from '../../../../context';
import { ToolBtn } from './components/ToolBtn/ToolBtn';
import './Toolbar.scss';
import { useIntl } from 'react-intl';
import { IconEllipse, IconHand, IconRect, IconSelect } from './icons';


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
        <IconSelect />
      </ToolBtn>
      <ToolBtn
        className={classNames({ active: tool === 'drawRect' })}
        tooltipContent={intl.formatMessage({ id: 'tool.rectangle' })}
        onClick={() => {
          editor?.toolManager.setTool('drawRect');
        }}
      >
        <IconRect />
      </ToolBtn>
      <ToolBtn
        className={classNames({ active: tool === 'drawEllipse' })}
        tooltipContent={intl.formatMessage({ id: 'tool.ellipse' })}
        onClick={() => {
          editor?.toolManager.setTool('drawEllipse');
        }}
      >
        <IconEllipse />
      </ToolBtn>
      <ToolBtn
        className={classNames({ active: tool === 'dragCanvas' })}
        tooltipContent={intl.formatMessage({ id: 'tool.hand' })}
        onClick={() => {
          editor?.toolManager.setTool('dragCanvas');
        }}
      >
        <IconHand />
      </ToolBtn>
    </div>
  );
};
