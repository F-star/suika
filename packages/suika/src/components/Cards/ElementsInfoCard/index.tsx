import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../../context';
import { MutateElementsAndRecord } from '../../../editor/scene/graph';
import { remainTwoDecimal } from '../../../utils/common';
import {
  degree2Radian,
  getElementRotatedXY,
  normalizeAngle,
  radian2Degree,
} from '../../../utils/graphics';
import { BaseCard } from '../BaseCard';
import NumberInput from '../../input/NumberInput';
import './style.scss';
import { useIntl } from 'react-intl';

/**
 * 因为运算中会丢失精度
 * 如果两个数距离非常非常小，我们认为它相等
 */
const isEqual = (a: number | string, b: number) => {
  if (typeof a === 'string') return false;
  return Math.abs(a - b) < 0.00000001;
};

const ElementsInfoCards: FC = () => {
  const editor = useContext(EditorContext);
  const intl = useIntl();
  const MIXED = intl.formatMessage({ id: 'mixed' });

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
            if (!isEqual(newRotatedX, currentRotatedX)) {
              newRotatedX = MIXED;
            }
            if (!isEqual(newRotatedY, currentRotatedY)) {
              newRotatedY = MIXED;
            }
            if (!isEqual(newWidth, element.width)) {
              newWidth = MIXED;
            }
            if (!isEqual(newHeight, element.height)) {
              newHeight = MIXED;
            }
            if (!isEqual(newRotation, element.rotation || 0)) {
              newRotation = MIXED;
            }
          }

          setRotatedX(
            newRotatedX === MIXED ? newRotatedX : remainTwoDecimal(newRotatedX as number)
          );
          setRotatedY(
            newRotatedY === MIXED ? newRotatedY : remainTwoDecimal(newRotatedY as number)
          );
          setWidth(newWidth);
          setHeight(newHeight);
          setRotation(
            newRotation === MIXED
              ? newRotation
              : remainTwoDecimal(radian2Degree(newRotation as number))
          );
        }
      };
      editor.sceneGraph.on('render', handler);

      return () => {
        editor.sceneGraph.off('render', handler);
      };
    }
  }, [editor, MIXED]);

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
          <NumberInput
            value={rotatedY}
            onBlur={(newRotatedY) => {
              if (editor) {
                const elements = editor.selectedElements.getItems();
                MutateElementsAndRecord.setRotateY(
                  editor,
                  elements,
                  newRotatedY
                );
                editor.sceneGraph.render();
              }
            }}
          />
        </div>
      </div>
      <div className="element-info-attrs-row">
        <div className="field">
          <span>W</span>
          <NumberInput
            value={width}
            onBlur={(newWidth) => {
              if (editor) {
                if (newWidth <= 0) {
                  newWidth = 1;
                }
                const elements = editor.selectedElements.getItems();
                MutateElementsAndRecord.setWidth(editor, elements, newWidth);
                editor.sceneGraph.render();
              }
            }}
          />
        </div>
        <div className="field">
          <span>H</span>
          <NumberInput
            value={height}
            onBlur={(newHeight) => {
              if (editor) {
                if (newHeight <= 0) {
                  newHeight = 1;
                }
                const elements = editor.selectedElements.getItems();
                MutateElementsAndRecord.setHeight(editor, elements, newHeight);
                editor.sceneGraph.render();
              }
            }}
          />
        </div>
      </div>
      <div className="element-info-attrs-row">
        <div className="field">
          <span>R</span>
          <NumberInput
            value={rotation}
            onBlur={(newRotation) => {
              if (editor) {
                newRotation = normalizeAngle(degree2Radian(newRotation));

                const elements = editor.selectedElements.getItems();
                MutateElementsAndRecord.setRotation(
                  editor,
                  elements,
                  newRotation
                );
                editor.sceneGraph.render();
              }
            }}
          />
        </div>
      </div>
    </BaseCard>
  );
};

export default ElementsInfoCards;
