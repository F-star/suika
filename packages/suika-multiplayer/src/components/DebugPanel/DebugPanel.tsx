import { type SuikaGraphics } from '@suika/core';
import { type IPoint } from '@suika/geo';
import { type FC, useContext, useEffect, useState } from 'react';

import { EditorContext } from '../../context';

export const DebugPanel: FC = () => {
  const editor = useContext(EditorContext);

  const [isSelectedBoxHover, setIsSelectedBoxHover] = useState(false);
  const [hoveredGraphName, setHoveredGraphName] = useState('');
  const [cursorPos, setCursorPos] = useState<IPoint | null>(null);

  useEffect(() => {
    if (!editor) return;

    const handleSelectedBoxHover = (isHover: boolean) => {
      setIsSelectedBoxHover(isHover);
    };
    const handleHoverItemChange = (hoveredItem: SuikaGraphics | null) => {
      setHoveredGraphName(hoveredItem?.attrs?.objectName ?? '');
    };

    editor.selectedBox.on('hoverChange', handleSelectedBoxHover);
    editor.selectedElements.on('hoverItemChange', handleHoverItemChange);
    editor.mouseEventManager.on('cursorPosUpdate', setCursorPos);

    return () => {
      editor.selectedBox.off('hoverChange', handleSelectedBoxHover);
      editor.selectedElements.off('hoverItemChange', handleHoverItemChange);
    };
  }, [editor]);

  return (
    <div style={{ padding: 8 }}>
      <div>isSelectedBoxHover: {isSelectedBoxHover ? 'true' : 'false'}</div>
      <div>hoveredGraphName: {hoveredGraphName}</div>
      {cursorPos && (
        <>
          <div>X: {cursorPos.x.toFixed(2)}</div>
          <div>Y: {cursorPos.y.toFixed(2)}</div>
        </>
      )}
    </div>
  );
};
