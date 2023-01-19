import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../../context';
import { Graph } from '../../../scene/graph';
import { getElementRotatedXY, radian2Degree } from '../../../utils/graphics';
import { InfoCard } from '../../InfoCard';
import './style.scss';

/**
 * 保留两位小数
 * 如果是 0，丢弃 0
 */
const remainTwoDecimal = (n: number) => {
  return Number(n.toFixed(2));
};

const ElementsInfoCards: FC = () => {
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
    <InfoCard title='元素信息'>
      {items.length === 0 ? null : (
        <>
          {/* TODO: 如果多个元素的某个属性相同，则不显示 'Mixed'，显示具体属性值 */}
          <div className='element-info-attrs-row'>
            <div className="field">
              <span>X</span>
              {items.length === 1 ? remainTwoDecimal(rotatedX): 'Mixed'}
            </div>
            <div className="field">
              <span>Y</span>
              {items.length === 1 ? remainTwoDecimal(rotatedY) : 'Mixed'}
            </div>
          </div>
          <div className='element-info-attrs-row'>
            <div className="field">
              <span>W</span>
              {items.length === 1 ? remainTwoDecimal(items[0].width) : 'Mixed'}
            </div>
            <div className="field">
              <span>H</span>
              {items.length === 1 ? remainTwoDecimal(items[0].height) : 'Mixed'}
            </div>
          </div>
          <div className='element-info-attrs-row'>
            <div className="field">
              <span>R</span>
              {items.length === 1
                ? remainTwoDecimal(radian2Degree(items[0].rotation || 0)) + '°'
                : 'Mixed'}
            </div>
          </div>
        </>
      )}
    </InfoCard>
  );
};

export default ElementsInfoCards;
