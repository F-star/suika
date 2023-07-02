import isEqual from 'lodash.isequal';
import { FC, useContext, useEffect, useRef, useState } from 'react';
import { EditorContext } from '../../../context';
import { parseRGBAStr, parseRGBToHex } from '../../../utils/color';
import { BaseCard } from '../BaseCard';
import './FillCard.scss';
import { useIntl } from 'react-intl';
import {
  DEFAULT_IMAGE_SRC,
  IRGBA,
  ITexture,
  TextureType,
} from '../../../editor/texture';
import { TexturePicker } from '../../ColorPicker/TexturePicker';
import cloneDeep from 'lodash.clonedeep';
import { SetElementsAttrs } from '../../../editor/commands/set_elements_attrs';
import { Popover } from '@suika/components';

const isNearWhite = (rgba: IRGBA, threshold = 85) => {
  const { r, g, b } = rgba;

  const dist = Math.sqrt(
    Math.pow(r - 255, 2) + Math.pow(g - 255, 2) + Math.pow(b - 255, 2),
  );
  return dist < threshold;
};

export const FillCard: FC = () => {
  const editor = useContext(EditorContext);
  const intl = useIntl();

  const [fill, setFill] = useState<ITexture[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const prevFills = useRef<ITexture[][]>([]);

  /**
   * update fill and return a new fill
   */
  const updateSelectedFills = (newTexture: ITexture, index: number) => {
    if (!editor) return;
    const newFill = [...fill];

    newFill[index] = newTexture;
    setFill(newFill);

    const selectItems = editor.selectedElements.getItems();

    selectItems.forEach((item) => {
      item.fill = cloneDeep(newFill);
    });

    return newFill;
  };

  useEffect(() => {
    if (editor) {
      prevFills.current = editor.selectedElements
        .getItems()
        .map((el) => cloneDeep(el.fill));

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
              // TODO: 标记为不相同，作为文案提示
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

  const pickerPopover = (
    <TexturePicker
      texture={fill[activeIndex]}
      onClose={() => {
        setActiveIndex(-1);
      }}
      onChange={(newTexture) => {
        if (!editor) return;

        updateSelectedFills(newTexture, activeIndex);
        editor.sceneGraph.render();
      }}
      onChangeComplete={(newTexture) => {
        if (!editor) return;

        const newFill = updateSelectedFills(newTexture, activeIndex);
        const selectedElements = editor.selectedElements.getItems();

        editor.commandManager.pushCommand(
          new SetElementsAttrs(
            'Update Fill',
            selectedElements,
            { fill: newFill },
            // prev value
            selectedElements.map((item, index) => ({
              fill: cloneDeep(prevFills.current[index]),
            })),
          ),
        );

        prevFills.current = selectedElements.map((el) => cloneDeep(el.fill));

        editor.sceneGraph.render();
      }}
    />
  );

  if (fill.length == 0) {
    return <div style={{ marginLeft: 16 }}>Mixed</div>;
  }

  return (
    <Popover
      open={activeIndex >= 0}
      content={activeIndex >= 0 && pickerPopover}
      placement="left-start"
    >
      <BaseCard title={intl.formatMessage({ id: 'fill' })}>
        {fill.map((texture, index) => {
          /** SOLID **/
          if (texture.type === TextureType.Solid) {
            return (
              <div className="fill-item" key={index}>
                <div
                  className="color-block"
                  style={{
                    backgroundColor: parseRGBAStr(texture.attrs),
                    boxShadow: isNearWhite(texture.attrs)
                      ? '0 0 0 1px rgba(0,0,0,0.1) inset'
                      : undefined,
                  }}
                  onClick={() => {
                    setActiveIndex(index);
                  }}
                />
                {parseRGBToHex(texture.attrs)}
              </div>
            );
          }
          /** IMAGE */
          if (texture.type === TextureType.Image) {
            return (
              <div className="fill-item" key={index}>
                <div
                  className="color-block"
                  onClick={() => {
                    setActiveIndex(index);
                  }}
                >
                  <img
                    style={{
                      backgroundImage: `url(${texture.attrs.src})`,
                      objectFit: 'contain',
                      width: '100%',
                      height: '100%',
                    }}
                    alt="img"
                    src={texture.attrs.src || DEFAULT_IMAGE_SRC}
                  />
                </div>
              </div>
            );
          }
        })}
      </BaseCard>
    </Popover>
  );
};
