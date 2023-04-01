import isEqual from 'lodash.isequal';
import { FC, useContext, useEffect, useRef, useState } from 'react';
import { EditorContext } from '../../../context';
import { IRGBA } from '../../../editor/scene/graph';
import { parseRGBAStr } from '../../../utils/color';
import { BaseCard } from '../BaseCard';
import { SketchPicker } from 'react-color';
import { SetElementsAttrs } from '../../../editor/commands/set_elements_attrs';
import { forEach } from '../../../utils/array_util';
import { useClickAway } from 'ahooks';
import './style.scss';
import { useIntl } from 'react-intl';

export const FillCard: FC = () => {
  const editor = useContext(EditorContext);
  const intl = useIntl();
  const [fill, setFill] = useState<IRGBA[]>([]);
  const prevFills = useRef<IRGBA[][]>([]);
  const colorPickerPopoverRef = useRef<HTMLDivElement>(null);
  const [colorPickIdx, setColorPickIdx] = useState(-1);

  useClickAway(
    () => {
      setColorPickIdx(-1);
    },
    [
      () => {
        return document.querySelector('.color-picker-popover');
      },
      () => {
        return document.querySelector('.color-block');
      },
    ],
    'mousedown'
  );

  useEffect(() => {
    if (editor) {
      const handler = () => {
        const selectedElements = editor.selectedElements.getItems();
        if (selectedElements.length > 0) {
          /**
           * 目前一个图形只支持一个 fill
           * 显示 fill 值时，如果有的图形没有 fill，将其排除。
           * 添加颜色时，如果有的图形不存在 fill，赋值给它。
           */

          let newFill = selectedElements[0].fill;
          for (let i = 1, len = selectedElements.length; i < len; i++) {
            const currentFill = selectedElements[i].fill;
            if (!isEqual(newFill, currentFill)) {
              // TODO: 标记为不相同
              newFill = [];
              break;
            }
          }
          setFill(newFill);
        }
      };
      editor.sceneGraph.on('render', handler);
      return () => {
        editor.sceneGraph.off('render', handler);
      };
    }
  }, [editor]);

  return (
    <BaseCard title={intl.formatMessage({ id: 'fill' })}>
      {fill.length > 0 ? (
        fill.map((rgba, index) => {
          const rgbaStr = parseRGBAStr(rgba);
          return (
            <div key={index} className="fill-item">
              {index === colorPickIdx && (
                <div
                  ref={colorPickerPopoverRef}
                  className="color-picker-popover"
                >
                  <SketchPicker
                    color={rgba}
                    onChange={(color, event) => {
                      if (!editor) {
                        return;
                      }

                      const elements = editor.selectedElements.getItems();
                      if (editor && event.type !== 'mousemove') {
                        // 记录颜色变化前的颜色
                        prevFills.current = elements.map((el) => el.fill);
                      }
                      forEach(elements, (el) => {
                        el.fill = [{ ...color.rgb, a: color.rgb.a || 1 }];
                      });
                      editor.sceneGraph.render();
                    }}
                    onChangeComplete={(color) => {
                      if (!editor) {
                        return;
                      }

                      const elements = editor.selectedElements.getItems();
                      const newFill = [{ ...color.rgb, a: color.rgb.a || 1 }];
                      editor.commandManager.pushCommand(
                        new SetElementsAttrs(
                          'Update Fill',
                          elements,
                          { fill: newFill },
                          elements.map((item, index) => ({
                            fill: prevFills.current[index],
                          }))
                        )
                      );

                      editor.sceneGraph.render();
                    }}
                  />
                </div>
              )}

              <div
                className="color-block"
                style={{ backgroundColor: rgbaStr }}
                onClick={() => {
                  setColorPickIdx(index);
                }}
              />
            </div>
          );
        })
      ) : (
        <div style={{ marginLeft: 16 }}>Mixed</div>
      )}
    </BaseCard>
  );
};
