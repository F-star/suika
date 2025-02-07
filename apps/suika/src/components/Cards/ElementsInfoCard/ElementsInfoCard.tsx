import './style.scss';

import { remainDecimal } from '@suika/common';
import { MutateGraphsAndRecord } from '@suika/core';
import { deg2Rad, normalizeRadian } from '@suika/geo';
import { type FC, useContext, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { EditorContext } from '../../../context';
import NumberInput from '../../input/NumberInput';
import { PercentInput } from '../../input/PercentInput';
import { BaseCard } from '../BaseCard';

/**
 * 因为运算中会丢失精度
 * 如果两个数距离非常非常小，我们认为它相等
 */
const isEqual = (a: number | string, b: number) => {
  if (typeof a === 'string') return false;
  return Math.abs(a - b) < 0.00000001;
};

interface IAttr {
  label: string;
  key: string;
  value: number | string;
  uiType: string;
  precision?: number;
}

export const ElementsInfoCards: FC = () => {
  const editor = useContext(EditorContext);
  const intl = useIntl();
  const MIXED = intl.formatMessage({ id: 'mixed' });
  const [attrs, setAttrs] = useState<IAttr[]>([]);

  useEffect(() => {
    if (editor) {
      const updateInfo = () => {
        const items = editor.selectedElements.getItems();
        // TODO: 设置顺序
        const map = new Map<string, IAttr>();
        for (const el of items) {
          const attrs = el.getInfoPanelAttrs();
          for (const attr of attrs) {
            if (attr.uiType === 'number') {
              const precision = 2;
              attr.value = remainDecimal(attr.value, precision);
            }
            const label = attr.label;
            if (!map.has(label)) {
              map.set(label, attr);
            } else {
              const valInMap = map.get(label)!.value;
              if (valInMap !== attr.value) {
                map.get(label)!.value = MIXED;
              }
            }
          }
        }

        setAttrs(Array.from(map.values()));
      };

      updateInfo(); // init

      editor.sceneGraph.on('render', updateInfo);

      return () => {
        editor.sceneGraph.off('render', updateInfo);
      };
    }
  }, [editor, MIXED]);

  const execCommand = (key: string, newVal: number) => {
    if (editor) {
      const elements = editor.selectedElements.getItems();
      if (key === 'x') {
        MutateGraphsAndRecord.setX(editor, elements, newVal);
      } else if (key === 'y') {
        MutateGraphsAndRecord.setY(editor, elements, newVal);
      } else if (key === 'width') {
        MutateGraphsAndRecord.setWidth(editor, elements, newVal);
      } else if (key === 'height') {
        MutateGraphsAndRecord.setHeight(editor, elements, newVal);
      } else if (key === 'rotation') {
        MutateGraphsAndRecord.setRotation(
          editor,
          elements,
          normalizeRadian(deg2Rad(newVal)),
        );
      } else if (key === 'cornerRadius') {
        // 特定图形特有属性要做特殊处理。。。遍历图形时需要判断当前图形是否支持某个属性
        MutateGraphsAndRecord.setCornerRadius(editor, elements, newVal);
      } else if (key === 'count') {
        /// count must to ben integer
        MutateGraphsAndRecord.setCount(editor, elements, Math.round(newVal));
      } else if (key === 'starInnerScale') {
        MutateGraphsAndRecord.setStarInnerScale(editor, elements, newVal);
      }
      editor.render();
    }
  };

  return (
    <BaseCard>
      <div className="element-info-attrs-row">
        {attrs.slice(0, 2).map((item) => (
          <NumAttrInput
            {...item}
            key={item.key}
            onChange={(newVal) => {
              execCommand(item.key, newVal);
            }}
          />
        ))}
      </div>
      <div className="element-info-attrs-row">
        {attrs.slice(2, 4).map((item) => (
          <NumAttrInput
            {...item}
            key={item.key}
            onChange={(newVal) => {
              execCommand(item.key, newVal);
            }}
          />
        ))}
      </div>
      <div className="element-info-attrs-row">
        {attrs.slice(4, 6).map((item) => (
          <NumAttrInput
            {...item}
            key={item.key}
            onChange={(newVal) => {
              execCommand(item.key, newVal);
            }}
          />
        ))}
      </div>
      {attrs.length > 6 && (
        <div className="element-info-attrs-row">
          {attrs.slice(6, 8).map((item) => (
            <NumAttrInput
              {...item}
              key={item.key}
              onChange={(newVal) => {
                execCommand(item.key, newVal);
              }}
            />
          ))}
        </div>
      )}
    </BaseCard>
  );
};

const NumAttrInput: FC<{
  label: string;
  min?: number;
  max?: number;
  value: string | number;
  onChange: (newValue: number) => void;
  suffixValue?: string;
  uiType: string;
}> = (props) => {
  if (props.uiType === 'percent') {
    return (
      <PercentInput
        prefix={<span className="suika-info-attrs-label">{props.label}</span>}
        value={props.value}
        min={props.min}
        max={props.max}
        onChange={props.onChange}
      />
    );
  } else {
    return (
      <NumberInput
        prefix={<span className="suika-info-attrs-label">{props.label}</span>}
        value={props.value}
        min={props.min}
        max={props.max}
        onChange={props.onChange}
        suffixValue={props.suffixValue}
      />
    );
  }
};
