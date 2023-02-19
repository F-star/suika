import classNames from 'classnames';
import { useEffect, useContext, useState } from 'react';
import { EditorContext } from '../../../../context';
import { ToolBtn } from './components/ToolBtn/ToolBtn';
import './Toolbar.scss';


export const ToolBar = () => {
  const editor = useContext(EditorContext);
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
        tooltipContent='Select'
        onClick={() => {
          editor?.toolManager.setTool('select');
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            // eslint-disable-next-line max-len
            d="M7.51055 4.42553L7.73603 3.97926L7.01138 3.61312L7.01055 4.42501L7.51055 4.42553ZM19.303 10.3838L19.5647 10.8098L20.3274 10.3412L19.5285 9.93753L19.303 10.3838ZM7.49703 17.6377L6.99703 17.6372L6.99612 18.5323L7.75878 18.0637L7.49703 17.6377ZM11.6438 15.0899L12.0698 14.8281L11.808 14.4021L11.382 14.6638L11.6438 15.0899ZM14.2173 19.2784L13.7913 19.5402L14.0531 19.9662L14.4791 19.7044L14.2173 19.2784ZM17.6254 17.1844L17.8872 17.6104L18.3132 17.3486L18.0514 16.9226L17.6254 17.1844ZM15.0518 12.9958L14.7901 12.5698L14.3641 12.8316L14.6258 13.2576L15.0518 12.9958ZM7.28507 4.8718L19.0775 10.8301L19.5285 9.93753L7.73603 3.97926L7.28507 4.8718ZM7.99703 17.6382L8.01055 4.42604L7.01055 4.42501L6.99703 17.6372L7.99703 17.6382ZM11.382 14.6638L7.23528 17.2117L7.75878 18.0637L11.9055 15.5159L11.382 14.6638ZM14.6434 19.0167L12.0698 14.8281L11.2178 15.3516L13.7913 19.5402L14.6434 19.0167ZM17.3637 16.7584L13.9556 18.8524L14.4791 19.7044L17.8872 17.6104L17.3637 16.7584ZM14.6258 13.2576L17.1994 17.4461L18.0514 16.9226L15.4779 12.7341L14.6258 13.2576ZM19.0412 9.95779L14.7901 12.5698L15.3136 13.4218L19.5647 10.8098L19.0412 9.95779Z"
            fill="#333333"
          />
        </svg>
      </ToolBtn>
      <ToolBtn
        className={classNames({ active: tool === 'drawRect' })}
        tooltipContent='Rectangle'
        onClick={() => {
          editor?.toolManager.setTool('drawRect');
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="4.5" y="6.5" width="16" height="11" rx="0.5" stroke="#333" />
        </svg>
      </ToolBtn>
      <ToolBtn
        className={classNames({ active: tool === 'drawEllipse' })}
        tooltipContent='Ellipse'
        onClick={() => {
          editor?.toolManager.setTool('drawEllipse');
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="7.5" stroke="#333" />
        </svg>
      </ToolBtn>
      <ToolBtn
        className={classNames({ active: tool === 'dragCanvas' })}
        tooltipContent='Hand'
        onClick={() => {
          editor?.toolManager.setTool('dragCanvas');
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            // eslint-disable-next-line max-len
            d="M18.7717 7.39806H17.7548C17.5361 7.39806 17.3568 7.56657 17.3568 7.7767V11.3197H16.6395V6.01456C16.6395 5.55479 16.248 5.18239 15.7647 5.18239H14.8943C14.6712 5.18239 14.4876 5.35506 14.4876 5.56935V11.3197H13.7703V4.89528C13.7703 4.67684 13.5844 4.5 13.3547 4.5H12.4078C11.9726 4.5 11.6205 4.83495 11.6205 5.24896V11.3176H10.9032V6.4785C10.9032 6.23301 10.4364 6.01456 10.1784 6.01456L9.53862 6.03329C9.10343 6.03329 8.75352 6.36824 8.75352 6.78017V15.7698L5.939 13.8495C5.53005 13.5915 4.97676 13.7309 4.75589 14.1491C4.75589 14.1491 4.58968 14.4695 4.53064 14.5756C4.47378 14.6817 4.50221 14.7816 4.56563 14.8523C4.6203 14.9126 7.42171 18.0333 8.34895 19.0527C8.61794 19.3481 9.12092 19.5 9.55393 19.5H18.085C18.8679 19.5 19.384 18.8967 19.384 18.154L19.4999 11.3197V8.09709C19.5065 7.71013 19.1784 7.39806 18.7717 7.39806Z"
            stroke="#333333"
          />
        </svg>
      </ToolBtn>
    </div>
  );
};
