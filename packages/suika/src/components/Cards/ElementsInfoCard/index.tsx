import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../../context';
import { MutateElementsAndRecord } from '../../../editor/scene/graph';
import { remainTwoDecimal } from '../../../utils/common';
import { getElementRotatedXY } from '../../../utils/graphics';
import { BaseCard } from '../BaseCard';
import NumberInput from './components/NumberInput';
import './style.scss';

const MIXED = 'Mixed';

const ElementsInfoCards: FC = () => {
  const editor = useContext(EditorContext);
  const [rotatedX, setRotatedX] = useState<number | typeof MIXED>(MIXED);
  const [rotatedY, setRotatedY] = useState<number | typeof MIXED>(MIXED);
  const [width, setWidth] = useState<number | typeof MIXED>(MIXED);
  const [height, setHeight] = useState<number | typeof MIXED>(MIXED);
  const [rotation, setRotation] = useState<number | typeof MIXED>(MIXED);

  useEffect(() => {
    if (editor) {
      const handler = () => {
        const items = editor.selectedElements.getItems();
        if (items.length > 0) {
          let [newRotatedX, newRotatedY]: [
            number | typeof MIXED,
            number | typeof MIXED
          ] = getElementRotatedXY(items[0]);
          let newWidth: number | typeof MIXED = items[0].width;
          let newHeight: number | typeof MIXED = items[0].height;
          let newRotation: number | typeof MIXED = items[0].rotation || 0;

          for (let i = 0, len = items.length; i < len; i++) {
            const element = items[i];
            const [currentRotatedX, currentRotatedY] =
              getElementRotatedXY(element);
            if (newRotatedX !== currentRotatedX) {
              newRotatedX = MIXED;
            }
            if (newRotatedY !== currentRotatedY) {
              newRotatedY = MIXED;
            }
            if (newWidth !== element.width) {
              newWidth = MIXED;
            }
            if (newHeight !== element.height) {
              newHeight = MIXED;
            }
            if (newRotation !== (element.rotation || 0)) {
              newRotation = MIXED;
            }
          }

          if (newRotatedX !== MIXED) setRotatedX(remainTwoDecimal(newRotatedX));
          if (newRotatedY !== MIXED) setRotatedY(remainTwoDecimal(newRotatedY));
          if (newWidth !== MIXED) setWidth(newWidth);
          if (newHeight !== MIXED) setHeight(newHeight);
          if (newRotation !== MIXED) setRotation(remainTwoDecimal(newRotation));
        }
      };
      editor.sceneGraph.on('render', handler);

      return () => {
        editor.sceneGraph.off('render', handler);
      };
    }
  }, [editor]);

  return (
    <BaseCard>
      <div className="element-info-attrs-row">
        <div className="field">
          <span>X</span>
          <NumberInput
            value={rotatedX}
            onBlur={(newRotatedX) => {
              if (editor) {
                const elements = editor.selectedElements.getItems();
                MutateElementsAndRecord.setRotateX(
                  editor,
                  elements,
                  newRotatedX
                );
                editor.sceneGraph.render();
              }
            }}
          />
        </div>
        <div className="field">
          <span>Y</span>
          {rotatedY}
        </div>
      </div>
      <div className="element-info-attrs-row">
        <div className="field">
          <span>W</span>
          {width}
        </div>
        <div className="field">
          <span>H</span>
          {height}
        </div>
      </div>
      <div className="element-info-attrs-row">
        <div className="field">
          <span>R</span>
          {rotation}
        </div>
      </div>
    </BaseCard>
  );
};

export default ElementsInfoCards;
