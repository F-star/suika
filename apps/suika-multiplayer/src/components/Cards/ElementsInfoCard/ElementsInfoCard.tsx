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
        // TODO: config attr order
        const map = new Map<string, IAttr>();
        for (const el of items) {
          const attrs = el.getInfoPanelAttrs();
          for (const attr of attrs) {
            if (attr.uiType === 'number') {
              const precision = 2;
              attr.value = remainDecimal(attr.value as number, precision);
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

  const execCommand = (
    key: string,
    newVal: number,
    isDelta: boolean = false,
  ) => {
    if (!editor) {
      return false;
    }
    const elements = editor.selectedElements.getItems();
    const params = {
      editor,
      graphicsArr: elements,
      val: newVal,
      isDelta,
    };
    if (key === 'x') {
      MutateGraphsAndRecord.setX(params);
    } else if (key === 'y') {
      MutateGraphsAndRecord.setY(params);
    } else if (key === 'width') {
      MutateGraphsAndRecord.setWidth(params);
    } else if (key === 'height') {
      MutateGraphsAndRecord.setHeight(params);
    } else if (key === 'rotation') {
      MutateGraphsAndRecord.setRotation({
        editor,
        graphicsArr: elements,
        rotation: normalizeRadian(deg2Rad(newVal)),
        isDelta,
      });
    } else if (key === 'cornerRadius') {
      // 特定图形特有属性要做特殊处理。。。遍历图形时需要判断当前图形是否支持某个属性
      MutateGraphsAndRecord.setCornerRadius(params);
    } else if (key === 'count') {
      /// count must to be integer
      MutateGraphsAndRecord.setCount({
        editor,
        graphicsArr: elements,
        val: Math.round(newVal),
        isDelta,
      });
    } else if (key === 'starInnerScale') {
      MutateGraphsAndRecord.setStarInnerScale(params);
    }
    editor.render();
  };

  const getEventHandlers = (key: string) => {
    return {
      onChange: (newVal: number) => {
        execCommand(key, newVal);
      },
      onIncrement: () => {
        const step = key === 'starInnerScale' ? 0.01 : 1;
        execCommand(key, step, true);
      },
      onDecrement: () => {
        const step = key === 'starInnerScale' ? -0.01 : -1;
        execCommand(key, step, true);
      },
    };
  };

  return (
    <BaseCard>
      <div className="element-info-attrs-row">
        {attrs.slice(0, 2).map((item) => (
          <NumAttrInput
            {...item}
            key={item.key}
            {...getEventHandlers(item.key)}
          />
        ))}
      </div>
      <div className="element-info-attrs-row">
        {attrs.slice(2, 4).map((item) => (
          <NumAttrInput
            {...item}
            key={item.key}
            {...getEventHandlers(item.key)}
          />
        ))}
      </div>
      <div className="element-info-attrs-row">
        {attrs.slice(4, 6).map((item) => (
          <NumAttrInput
            {...item}
            key={item.key}
            {...getEventHandlers(item.key)}
          />
        ))}
      </div>
      {attrs.length > 6 && (
        <div className="element-info-attrs-row">
          {attrs.slice(6, 8).map((item) => (
            <NumAttrInput
              {...item}
              key={item.key}
              {...getEventHandlers(item.key)}
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
  suffixValue?: string;
  uiType: string;
  onChange: (newValue: number) => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
}> = (props) => {
  if (props.uiType === 'percent') {
    return (
      <PercentInput
        prefix={<span className="suika-info-attrs-label">{props.label}</span>}
        value={props.value}
        min={props.min}
        max={props.max}
        onChange={props.onChange}
        onIncrement={props.onIncrement}
        onDecrement={props.onDecrement}
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
        onIncrement={props.onIncrement}
        onDecrement={props.onDecrement}
      />
    );
  }
};
