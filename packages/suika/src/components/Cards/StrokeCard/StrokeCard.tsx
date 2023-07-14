import isEqual from 'lodash.isequal';
import { FC, useContext, useEffect, useRef, useState } from 'react';
import { EditorContext } from '../../../context';

import { useIntl } from 'react-intl';
import { ITexture } from '../../../editor/texture';
import cloneDeep from 'lodash.clonedeep';
import { SetElementsAttrs } from '../../../editor/commands/set_elements_attrs';
import { TextureCard } from '../TextureCard';

export const StrokeCard: FC = () => {
  const editor = useContext(EditorContext);
  const intl = useIntl();

  const [strokes, setStrokes] = useState<ITexture[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const prevStrokes = useRef<ITexture[][]>([]);

  /**
   * update stroke and return a new stroke
   */
  const updateSelectedStrokes = (newTexture: ITexture) => {
    if (!editor) return;

    const newStrokes = [...strokes];

    newStrokes[activeIndex] = newTexture;
    setStrokes(newStrokes);

    const selectItems = editor.selectedElements.getItems();

    selectItems.forEach((item) => {
      item.stroke = cloneDeep(newStrokes);
    });

    return newStrokes;
  };

  useEffect(() => {
    if (editor) {
      prevStrokes.current = editor.selectedElements
        .getItems()
        .map((el) => cloneDeep(el.stroke));

      const handler = () => {
        const selectedElements = editor.selectedElements.getItems();
        if (selectedElements.length > 0) {
          /**
           * 目前一个图形只支持一个 stroke
           * 显示 stroke 值时，如果有的图形没有 stroke，将其排除。
           * 添加颜色时，如果有的图形不存在 stroke，赋值给它。
           */
          let newStrokes = selectedElements[0].stroke;
          for (let i = 1, len = selectedElements.length; i < len; i++) {
            const currentStrokes = selectedElements[i].stroke;
            if (!isEqual(newStrokes, currentStrokes)) {
              // TODO: 标记为不相同，作为文案提示
              newStrokes = [];
              break;
            }
          }
          setStrokes(newStrokes);
        }
      };
      editor.sceneGraph.on('render', handler);
      return () => {
        editor.sceneGraph.off('render', handler);
      };
    }
  }, [editor]);

  return (
    <TextureCard
      title={intl.formatMessage({ id: 'stroke' })}
      textures={strokes}
      onChange={(newTexture) => {
        if (!editor) return;
        updateSelectedStrokes(newTexture);
        editor.sceneGraph.render();
      }}
      onChangeComplete={(newTexture) => {
        if (!editor) return;
        const newStrokes = updateSelectedStrokes(newTexture);
        const selectedElements = editor.selectedElements.getItems();

        editor.commandManager.pushCommand(
          new SetElementsAttrs(
            'Update Stroke',
            selectedElements,
            { stroke: newStrokes },
            // prev value
            selectedElements.map((item, index) => ({
              stroke: cloneDeep(prevStrokes.current[index]),
            })),
          ),
        );

        prevStrokes.current = selectedElements.map((el) =>
          cloneDeep(el.stroke),
        );

        editor.sceneGraph.render();
      }}
      activeIndex={activeIndex}
      setActiveIndex={setActiveIndex}
    />
  );
};
