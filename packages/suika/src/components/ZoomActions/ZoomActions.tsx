import classNames from 'classnames';
import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../context';
import './ZoomActions.scss';

export const ZoomActions: FC = () => {
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

  const [popoverVisible, setPopoverVisible] = useState(false);

  return (
    <div className="zoom-actions">
      <div
        className={classNames(['value', { active: popoverVisible }])}
        onClick={() => {
          setPopoverVisible(!popoverVisible);
        }}
      >
        {Math.floor(zoom * 100)}%
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M7 10L12 15L17 10" stroke="#333333" />
        </svg>
      </div>
      {popoverVisible && (
        <div className="popover">
          <div
            className="item"
            onClick={() => {
              editor?.zoomManager.zoomOut();
              editor?.sceneGraph.render();
              setPopoverVisible(false);
            }}
          >
            Zoom in
          </div>
          <div
            className="item"
            onClick={() => {
              editor?.zoomManager.zoomIn();
              editor?.sceneGraph.render();
              setPopoverVisible(false);
            }}
          >
            Zoom out
          </div>
        </div>
      )}
      {/* <button
        onClick={() => {
          editor?.zoomManager.zoomIn();
          editor?.sceneGraph.render();
        }}
      >
        +
      </button> */}
    </div>
  );
};
