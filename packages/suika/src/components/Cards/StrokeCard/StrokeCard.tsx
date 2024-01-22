import { arrMap, cloneDeep, forEach, isEqual } from '@suika/common';
import {
  Graph,
  ISetElementsAttrsType,
  ITexture,
  SetElementsAttrs,
} from '@suika/core';
import { LineWidthOutlined } from '@suika/icons';
import { FC, useContext, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import { EditorContext } from '../../../context';
import NumberInput from '../../input/NumberInput';
import { TextureCard } from '../TextureCard';

export const StrokeCard: FC = () => {
  const editor = useContext(EditorContext);
  const intl = useIntl();

  const [strokes, setStrokes] = useState<ITexture[]>([]);
  const [strokeWidth, setStrokeWidth] = useState(-1); // -1 means elements have different stroke width
  const prevStrokes = useRef<ITexture[][]>([]);

  useEffect(() => {
    if (editor) {
      prevStrokes.current = editor.selectedElements
        .getItems()
        .map((el) => cloneDeep(el.stroke));

      const updateInfo = () => {
        const selectedElements = editor.selectedElements.getItems();
        if (selectedElements.length > 0) {
          /**
           * 显示 stroke 值时，如果有的图形没有 stroke，将其排除。
           * 添加颜色时，如果有的图形不存在 stroke，赋值给它。
           */
          let strokes = selectedElements[0].stroke;
          for (let i = 1, len = selectedElements.length; i < len; i++) {
            const currentStrokes = selectedElements[i].stroke;
            if (!isEqual(strokes, currentStrokes)) {
              // TODO: 标记为不相同，作为文案提示
              strokes = [];
              break;
            }
          }
          setStrokes(strokes);

          // 线宽
          let strokeWidth = selectedElements[0].strokeWidth ?? 0;
          for (let i = 1, len = selectedElements.length; i < len; i++) {
            const currentStrokeWidth = selectedElements[i].strokeWidth ?? 0;
            if (strokeWidth !== currentStrokeWidth) {
              strokeWidth = -1;
              break;
            }
          }
          setStrokeWidth(strokeWidth);
        }
      };

      updateInfo(); // init

      editor.sceneGraph.on('render', updateInfo);
      return () => {
        editor.sceneGraph.off('render', updateInfo);
      };
    }
  }, [editor]);

  /**
   * update stroke and return a new stroke
   */
  const updateStrokeWithoutRecord = (newTexture: ITexture, index: number) => {
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
    pushToHistory('Add Stroke', selectItems, newStrokes, true);
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
    isAddAction?: boolean,
  ) => {
    if (!editor) return;

    const prevAttrs: ISetElementsAttrsType[] = selectedElements.map((_, i) => ({
      stroke: cloneDeep(prevStrokes.current[i]),
    }));
    const attrs: ISetElementsAttrsType[] = arrMap(selectedElements, () => ({
      stroke: cloneDeep(newStroke),
    }));

    // case 1: add first stroke，change strokeWidth to 1
    if (isAddAction && newStroke.length === 1) {
      selectedElements.forEach((el, i) => {
        prevAttrs[i].strokeWidth = el.strokeWidth;
      });

      const defaultStrokeWidth = editor.setting.get('strokeWidth');
      forEach(selectedElements, (el, i) => {
        el.strokeWidth = defaultStrokeWidth;
        attrs[i].strokeWidth = defaultStrokeWidth;
      });
    }
    // case 2: delete all stroke，change strokeWidth to 0
    else if (newStroke.length === 0) {
      selectedElements.forEach((el, i) => {
        prevAttrs[i].strokeWidth = el.strokeWidth;
      });

      forEach(selectedElements, (el) => {
        delete el.strokeWidth;
      });
    }

    editor.commandManager.pushCommand(
      new SetElementsAttrs(cmdDesc, selectedElements, attrs, prevAttrs),
    );

    prevStrokes.current = selectedElements.map((el) => cloneDeep(el.fill));
  };

  const updateStrokeWidth = (newStrokeWidth: number) => {
    if (!editor) return;

    const selectedElements = editor.selectedElements.getItems();
    editor.commandManager.pushCommand(
      new SetElementsAttrs(
        'update strokeWidth',
        selectedElements,
        { strokeWidth: newStrokeWidth },
        arrMap(selectedElements, (item) => ({ strokeWidth: item.strokeWidth })),
      ),
    );

    selectedElements.forEach((item) => {
      item.strokeWidth = newStrokeWidth;
    });
    setStrokeWidth(newStrokeWidth);

    editor.sceneGraph.render();
  };

  return (
    <TextureCard
      title={intl.formatMessage({ id: 'stroke' })}
      textures={strokes}
      appendedContent={
        <div style={{ padding: '0 8px' }}>
          <NumberInput
            prefix={
              <div
                style={{
                  paddingLeft: '3px',
                  color: '#b3b3b3',
                  display: 'flex',
                }}
              >
                <LineWidthOutlined />
              </div>
            }
            value={strokeWidth}
            min={0}
            onBlur={updateStrokeWidth}
          />
        </div>
      }
      onChange={(newTexture, i) => {
        if (!editor) return;
        updateStrokeWithoutRecord(newTexture, i);
        editor.sceneGraph.render();
      }}
      onChangeComplete={(newTexture, i) => {
        if (!editor) return;
        const newStrokes = updateStrokeWithoutRecord(newTexture, i);

        pushToHistory(
          'Change Stroke',
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
