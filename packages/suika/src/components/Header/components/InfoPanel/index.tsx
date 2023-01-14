import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../../../context';
import { Graph } from '../../../../scene/graph';
import { getElementRotatedXY, radian2Degree } from '../../../../utils/graphics';
import './style.scss';

const InfoPanel: FC = () => {
  const editor = useContext(EditorContext);
  const [items, setItems] = useState<Graph[]>([]);

  let rotatedX = 0;
  let rotatedY = 0;
  if (items.length === 1) {
    [rotatedX, rotatedY] = getElementRotatedXY(items[0]);
  }

  useEffect(() => {
    if (editor) {
      const handler = () => {
        setItems((prevItems) => {
          const items = editor.selectedElements.getItems();
          // 如果变化前后数组长度都是 0，就不更新
          return prevItems.length === 0 && items.length === 0
            ? prevItems
            : items;
        });
      };
      editor.sceneGraph.on('render', handler);

      return () => {
        editor.sceneGraph.off('render', handler);
      };
    }
  }, [editor]);

  return (
    <div className="info-panel">
      {items.length === 0 ? (
        <div className='empty-text'>No Selected Shapes</div>
      ) : (
        <>
          {/* TODO: 如果多个元素的某个属性相同，则不显示 'Mixed'，显示具体属性值 */}
          <div className="field">
            <span>X</span>
            {items.length === 1 ? rotatedX.toFixed(2) : 'Mixed'}
          </div>
          <div className="field">
            <span>Y</span>
            {items.length === 1 ? rotatedY.toFixed(2) : 'Mixed'}
          </div>
          <div className="field">
            <span>W</span>
            {items.length === 1 ? items[0].width.toFixed(2) : 'Mixed'}
          </div>
          <div className="field">
            <span>H</span>
            {items.length === 1 ? items[0].height.toFixed(2) : 'Mixed'}
          </div>
          <div className="field">
            <span>R</span>
            {items.length === 1
              ? radian2Degree(items[0].rotation || 0).toFixed(2) + '°'
              : 'Mixed'}
          </div>
        </>
      )}
    </div>
  );
};

export default InfoPanel;
