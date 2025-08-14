import { type SuikaGraphics } from '@suika/core';
import { type IPoint } from '@suika/geo';
import { type FC, useContext, useEffect, useState } from 'react';

import { EditorContext } from '../../context';

export const DebugPanel: FC = () => {
  const editor = useContext(EditorContext);

  const [zoom, setZoom] = useState(1);
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
    const updateZoom = (val: number) => {
      setZoom(val);
    };

    setZoom(editor.viewportManager.getZoom());

    editor.selectedBox.on('hoverChange', handleSelectedBoxHover);
    editor.selectedElements.on('hoverItemChange', handleHoverItemChange);
    editor.mouseEventManager.on('cursorPosUpdate', setCursorPos);
    editor.viewportManager.on('zoomChange', updateZoom);

    return () => {
      editor.selectedBox.off('hoverChange', handleSelectedBoxHover);
      editor.selectedElements.off('hoverItemChange', handleHoverItemChange);
      editor.viewportManager.off('zoomChange', updateZoom);
    };
  }, [editor]);

  return (
    <div style={{ padding: 8 }}>
      <div>zoom: {zoom}</div>
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
