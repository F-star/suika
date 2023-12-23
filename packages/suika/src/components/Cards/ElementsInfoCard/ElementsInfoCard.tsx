import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../../context';
import { MutateGraphsAndRecord } from '../../../editor/service/mutate_graphs_and_record';
import { remainDecimal } from '../../../utils/common';
import { getRectRotatedXY } from '../../../utils/geo';
import { deg2Rad, normalizeRadian, rad2Deg } from '@suika/geo';
import { BaseCard } from '../BaseCard';
import NumberInput from '../../input/NumberInput';
import './style.scss';
import { useIntl } from 'react-intl';
import { GraphType } from '../../../type';

/**
 * 因为运算中会丢失精度
 * 如果两个数距离非常非常小，我们认为它相等
 */
const isEqual = (a: number | string, b: number) => {
  if (typeof a === 'string') return false;
  return Math.abs(a - b) < 0.00000001;
};

export const ElementsInfoCards: FC = () => {
  const editor = useContext(EditorContext);
  const intl = useIntl();
  const MIXED = intl.formatMessage({ id: 'mixed' });

  // graph type string
  const [graphType, setGraphType] = useState<GraphType | typeof MIXED>(MIXED);
  const [rotatedX, setRotatedX] = useState<number | typeof MIXED>(MIXED);
  const [rotatedY, setRotatedY] = useState<number | typeof MIXED>(MIXED);
  const [width, setWidth] = useState<number | typeof MIXED>(MIXED);
  const [height, setHeight] = useState<number | typeof MIXED>(MIXED);
  const [rotation, setRotation] = useState<number | typeof MIXED>(MIXED);
  const [cornerRadius, setCornerRadius] = useState<number | typeof MIXED>(
    MIXED,
  );

  useEffect(() => {
    if (editor) {
      const updateInfo = () => {
        const items = editor.selectedElements.getItems();
        if (items.length > 0) {
          let {
            x: newRotatedX,
            y: newRotatedY,
          }: {
            x: number | typeof MIXED;
            y: number | typeof MIXED;
          } = getRectRotatedXY(items[0]);
          let newGraphType: GraphType | typeof MIXED = items[0].type;
          let newWidth: number | typeof MIXED = items[0].width;
          let newHeight: number | typeof MIXED = items[0].height;
          let newRotation: number | typeof MIXED = items[0].rotation || 0;
          let newCornerRadius: number | typeof MIXED =
            items[0].cornerRadius || 0;

          for (const element of items) {
            if (element.type !== newGraphType) {
              newGraphType = MIXED;
            }
            const { x: currentRotatedX, y: currentRotatedY } =
              getRectRotatedXY(element);
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
            if (!isEqual(newCornerRadius, element.cornerRadius || 0)) {
              newCornerRadius = MIXED;
            }
          }

          setGraphType(newGraphType);
          setRotatedX(
            newRotatedX === MIXED
              ? newRotatedX
              : remainDecimal(newRotatedX as number),
          );
          setRotatedY(
            newRotatedY === MIXED
              ? newRotatedY
              : remainDecimal(newRotatedY as number),
          );
          setWidth(
            newWidth === MIXED ? newWidth : remainDecimal(newWidth as number),
          );
          setHeight(
            newHeight === MIXED
              ? newHeight
              : remainDecimal(newHeight as number),
          );
          setRotation(
            newRotation === MIXED
              ? newRotation
              : remainDecimal(rad2Deg(newRotation as number)),
          );
          setCornerRadius(
            newCornerRadius === MIXED
              ? newCornerRadius
              : remainDecimal(newCornerRadius as number),
          );
        }
      };

      updateInfo(); // init

      editor.sceneGraph.on('render', updateInfo);

      return () => {
        editor.sceneGraph.off('render', updateInfo);
      };
    }
  }, [editor, MIXED]);

  // attributes x, y, width, height, rotation, cornerRadius
  const attrs = [
    {
      label: 'X',
      value: rotatedX,
      onBlur: (newRotatedX: number) => {
        if (editor) {
          const elements = editor.selectedElements.getItems();
          MutateGraphsAndRecord.setRotateX(editor, elements, newRotatedX);
          editor.sceneGraph.render();
        }
      },
    },
    {
      label: 'Y',
      value: rotatedY,
      onBlur: (newRotatedY: number) => {
        if (editor) {
          const elements = editor.selectedElements.getItems();
          MutateGraphsAndRecord.setRotateY(editor, elements, newRotatedY);
          editor.sceneGraph.render();
        }
      },
    },
    {
      label: 'W',
      min: 1,
      value: width,
      onBlur: (newWidth: number) => {
        if (editor) {
          const elements = editor.selectedElements.getItems();
          MutateGraphsAndRecord.setWidth(editor, elements, newWidth);
          editor.sceneGraph.render();
        }
      },
    },
    {
      label: 'H',
      min: 1,
      value: height,
      onBlur: (newHeight: number) => {
        if (editor) {
          const elements = editor.selectedElements.getItems();
          MutateGraphsAndRecord.setHeight(editor, elements, newHeight);
          editor.sceneGraph.render();
        }
      },
    },
    {
      label: 'R',
      value: rotation,
      suffixValue: '°',
      onBlur: (newRotation: number) => {
        if (editor) {
          newRotation = normalizeRadian(deg2Rad(newRotation));
          const elements = editor.selectedElements.getItems();
          MutateGraphsAndRecord.setRotation(editor, elements, newRotation);
          editor.sceneGraph.render();
        }
      },
    },
    {
      label: 'C',
      min: 0,
      value: cornerRadius,
      visible: () => {
        return graphType === GraphType.Rect;
      },
      onBlur: (newCornerRadius: number) => {
        if (editor) {
          const elements = editor.selectedElements.getItems();
          MutateGraphsAndRecord.setCornerRadius(
            editor,
            elements,
            newCornerRadius,
          );
          editor.sceneGraph.render();
        }
      },
    },
  ];

  return (
    <BaseCard>
      <div className="element-info-attrs-row">
        {attrs.slice(0, 2).map((item) => (
          <AttrInput {...item} key={item.label} />
        ))}
      </div>
      <div className="element-info-attrs-row">
        {attrs.slice(2, 4).map((item) => (
          <AttrInput {...item} key={item.label} />
        ))}
      </div>
      <div className="element-info-attrs-row">
        {attrs
          .slice(4, 6)
          .filter((item) => {
            return item.visible ? item.visible() : true;
          })
          .map((item) => (
            <AttrInput {...item} key={item.label} />
          ))}
      </div>
    </BaseCard>
  );
};

const AttrInput: FC<{
  label: string;
  min?: number;
  value: string | number;
  onBlur: (newValue: number) => void;
  suffixValue?: string;
}> = (props) => {
  return (
    <NumberInput
      prefix={<span className="suika-info-attrs-label">{props.label}</span>}
      value={props.value}
      min={props.min}
      onBlur={props.onBlur}
      suffixValue={props.suffixValue}
    />
  );
};
