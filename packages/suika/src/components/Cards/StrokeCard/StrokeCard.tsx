import isEqual from 'lodash.isequal';
import { FC, useContext, useEffect, useRef, useState } from 'react';
import { EditorContext } from '../../../context';

import { useIntl } from 'react-intl';
import { ITexture } from '../../../editor/texture';
import cloneDeep from 'lodash.clonedeep';
import { SetElementsAttrs } from '../../../editor/commands/set_elements_attrs';
import { TextureCard } from '../TextureCard';
import { Graph } from '../../../editor/scene/graph';

export const StrokeCard: FC = () => {
  const editor = useContext(EditorContext);
  const intl = useIntl();

  const [strokes, setStrokes] = useState<ITexture[]>([]);
  const prevStrokes = useRef<ITexture[][]>([]);

  /**
   * update stroke and return a new stroke
   */
  const updateSelectedStrokes = (newTexture: ITexture, index: number) => {
    if (!editor) return;

    const newStrokes = [...strokes];

    newStrokes[index] = newTexture;
    setStrokes(newStrokes);

    const selectItems = editor.selectedElements.getItems();

    selectItems.forEach((item) => {
      item.stroke = cloneDeep(newStrokes);
    });

    return newStrokes;
  };

  const addStroke = () => {
    if (!editor) return;

    const newTexture = cloneDeep(
      editor.setting.get(strokes.length ? 'addedTexture' : 'firstStroke'),
    );
    const newStrokes = [...strokes, newTexture];
    setStrokes(newStrokes);

    const selectItems = editor.selectedElements.getItems();
    selectItems.forEach((item) => {
      item.stroke = cloneDeep(newStrokes);
    });
    pushToHistory('Add Stroke', selectItems, newStrokes);
    editor?.sceneGraph.render();
  };

  const deleteStroke = (index: number) => {
    if (!editor) return;

    const newStrokes = strokes.filter((_, i) => i !== index);
    setStrokes(newStrokes);

    const selectItems = editor.selectedElements.getItems();
    selectItems.forEach((item) => {
      item.stroke = cloneDeep(newStrokes);
    });
    pushToHistory('Update Stroke', selectItems, newStrokes);
    editor.sceneGraph.render();
  };

  const pushToHistory = (
    cmdDesc: string,
    selectedElements: Graph[],
    newStroke: ITexture[],
  ) => {
    if (!editor) return;

    editor.commandManager.pushCommand(
      new SetElementsAttrs(
        cmdDesc,
        selectedElements,
        { stroke: newStroke },
        // prev value
        selectedElements.map((_, i) => ({
          stroke: cloneDeep(prevStrokes.current[i]),
        })),
      ),
    );

    prevStrokes.current = selectedElements.map((el) => cloneDeep(el.fill));
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
      onChange={(newTexture, i) => {
        if (!editor) return;
        updateSelectedStrokes(newTexture, i);
        editor.sceneGraph.render();
      }}
      onChangeComplete={(newTexture, i) => {
        if (!editor) return;
        const newStrokes = updateSelectedStrokes(newTexture, i);

        pushToHistory(
          'Delete Stroke',
          editor.selectedElements.getItems(),
          newStrokes!,
        );
        editor.sceneGraph.render();
      }}
      onAdd={addStroke}
      onDelete={deleteStroke}
    />
  );
};
