import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../context';
import './ZoomActions.scss';

const ZoomActions: FC = () => {
  const editor = useContext(EditorContext);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (editor) {
      setZoom(editor.zoomManager.getZoom());
      const handler = (zoom: number) => {
        setZoom(zoom);
      };
      editor.zoomManager.on('zoomChange', handler);
      return () => {
        editor.zoomManager.off('zoomChange', handler);
      };
    }
  }, [editor]);

  return (
    <div className="zoom-actions">
      <button
        onClick={() => {
          editor?.zoomManager.zoomOut();
          editor?.sceneGraph.render();
        }}
      >
        -
      </button>
      <span className="value" onClick={() => {
        editor?.zoomManager.setZoomAndAdjustScroll(1);
        editor?.sceneGraph.render();
      }}>{Math.floor(zoom * 100)}%</span>
      <button
        onClick={() => {
          editor?.zoomManager.zoomIn();
          editor?.sceneGraph.render();
        }}
      >
        +
      </button>
    </div>
  );
};

export default ZoomActions;
