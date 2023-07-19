import isEqual from 'lodash.isequal';
import { FC, useContext, useEffect, useRef, useState } from 'react';
import { EditorContext } from '../../../context';

import { useIntl } from 'react-intl';
import { ITexture } from '../../../editor/texture';
import cloneDeep from 'lodash.clonedeep';
import { SetElementsAttrs } from '../../../editor/commands/set_elements_attrs';
import { TextureCard } from '../TextureCard';
import { Graph } from '../../../editor/scene/graph';

export const FillCard: FC = () => {
  const editor = useContext(EditorContext);
  const intl = useIntl();

  const [fill, setFill] = useState<ITexture[]>([]);
  const prevFills = useRef<ITexture[][]>([]);

  /**
   * update fill and return a new fill
   */
  const updateSelectedFill = (newTexture: ITexture, index: number) => {
    if (!editor) return;

    const newFills = [...fill];

    newFills[index] = newTexture;
    setFill(newFills);

    const selectItems = editor.selectedElements.getItems();

    selectItems.forEach((item) => {
      item.fill = cloneDeep(newFills);
    });

    return newFills;
  };

  const addFill = () => {
    if (!editor) return;

    const newTexture = cloneDeep(
      editor.setting.get(fill.length ? 'addedTexture' : 'firstFill'),
    );
    const newFills = [...fill, newTexture];
    setFill(newFills);

    const selectItems = editor.selectedElements.getItems();
    selectItems.forEach((item) => {
      item.fill = cloneDeep(newFills);
    });
    pushToHistory('Add Fill', selectItems, newFills);
    editor?.sceneGraph.render();
  };

  const deleteFill = (index: number) => {
    if (!editor) return;

    const newFills = fill.filter((_, i) => i !== index);
    setFill(newFills);

    const selectItems = editor.selectedElements.getItems();
    selectItems.forEach((item) => {
      item.fill = cloneDeep(newFills);
    });
    pushToHistory('Update Fill', selectItems, newFills);
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
        { fill: newStroke },
        // prev value
        selectedElements.map((_, i) => ({
          fill: cloneDeep(prevFills.current[i]),
        })),
      ),
    );

    prevFills.current = selectedElements.map((el) => cloneDeep(el.fill));
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

  return (
    <TextureCard
      title={intl.formatMessage({ id: 'fill' })}
      textures={fill}
      onChange={(newTexture, i) => {
        if (!editor) return;
        updateSelectedFill(newTexture, i);
        editor.sceneGraph.render();
      }}
      onChangeComplete={(newTexture, i) => {
        if (!editor) return;
        const newFill = updateSelectedFill(newTexture, i);

        pushToHistory(
          'Delete fill',
          editor.selectedElements.getItems(),
          newFill!,
        );

        editor.sceneGraph.render();
      }}
      onAdd={addFill}
      onDelete={deleteFill}
    />
  );
};
