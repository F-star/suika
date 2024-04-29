import { cloneDeep, isEqual } from '@suika/common';
import { type Graph, type IPaint, SetGraphsAttrsCmd } from '@suika/core';
import { type FC, useContext, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import { EditorContext } from '../../../context';
import { PaintCard } from '../PaintCard';

export const FillCard: FC = () => {
  const editor = useContext(EditorContext);
  const intl = useIntl();

  const [fill, setFill] = useState<IPaint[]>([]);
  const prevFills = useRef<IPaint[][]>([]);

  /**
   * update fill and return a new fill
   */
  const updateSelectedFill = (newPaint: IPaint, index: number) => {
    if (!editor) return;

    const newFills = [...fill];

    newFills[index] = newPaint;
    setFill(newFills);

    const selectItems = editor.selectedElements.getItems();

    selectItems.forEach((item) => {
      item.updateAttrs({
        fill: cloneDeep(newFills),
      });
    });

    return newFills;
  };

  const addFill = () => {
    if (!editor) return;

    const newPaint = cloneDeep(
      editor.setting.get(fill.length ? 'addedPaint' : 'firstFill'),
    );
    const newFills = [...fill, newPaint];
    setFill(newFills);

    const selectItems = editor.selectedElements.getItems();
    selectItems.forEach((item) => {
      item.updateAttrs({
        fill: cloneDeep(newFills),
      });
    });
    pushToHistory('Add Fill', selectItems, newFills);
    editor?.render();
  };

  const deleteFill = (index: number) => {
    if (!editor) return;

    const newFills = fill.filter((_, i) => i !== index);
    setFill(newFills);

    const selectItems = editor.selectedElements.getItems();
    selectItems.forEach((item) => {
      item.updateAttrs({
        fill: cloneDeep(newFills),
      });
    });
    pushToHistory('Update Fill', selectItems, newFills);
    editor.render();
  };

  const pushToHistory = (
    cmdDesc: string,
    selectedElements: Graph[],
    newPaints: IPaint[],
  ) => {
    if (!editor) return;

    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        cmdDesc,
        selectedElements,
        { fill: newPaints },
        // prev value
        selectedElements.map((_, i) => ({
          fill: cloneDeep(prevFills.current[i]),
        })),
      ),
    );

    prevFills.current = selectedElements.map((el) =>
      cloneDeep(el.attrs.fill ?? []),
    );
  };

  useEffect(() => {
    if (editor) {
      const updatePrevFill = (els: Graph[]) => {
        prevFills.current = els.map((el) => cloneDeep(el.attrs.fill ?? []));
      };
      const updateInfo = () => {
        const selectedElements = editor.selectedElements.getItems();
        if (selectedElements.length > 0) {
          /**
           * 目前一个图形只支持一个 fill
           * 显示 fill 值时，如果有的图形没有 fill，将其排除。
           * 添加颜色时，如果有的图形不存在 fill，赋值给它。
           */
          let newFill = selectedElements[0].attrs.fill ?? [];
          for (let i = 1, len = selectedElements.length; i < len; i++) {
            const currentFill = selectedElements[i].attrs.fill;
            if (!isEqual(newFill, currentFill)) {
              // TODO: 标记为不相同，作为文案提示
              newFill = [];
              break;
            }
          }
          setFill(newFill);
        }
      };

      // init
      updatePrevFill(editor.selectedElements.getItems());
      updateInfo();

      editor.sceneGraph.on('render', updateInfo);
      editor.selectedElements.on('itemsChange', updatePrevFill);
      return () => {
        editor.sceneGraph.off('render', updateInfo);
        editor.selectedElements.off('itemsChange', updatePrevFill);
      };
    }
  }, [editor]);

  return (
    <PaintCard
      title={intl.formatMessage({ id: 'fill' })}
      paints={fill}
      onChange={(newPaint, i) => {
        if (!editor) return;
        updateSelectedFill(newPaint, i);
        editor.render();
      }}
      onChangeComplete={(newPaint, i) => {
        if (!editor) return;
        const newFill = updateSelectedFill(newPaint, i);

        pushToHistory(
          'Update fill',
          editor.selectedElements.getItems(),
          newFill!,
        );

        editor.render();
      }}
      onAdd={addFill}
      onDelete={deleteFill}
    />
  );
};
