import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../../context';
import { BaseCard } from '../BaseCard';
import NumberInput from '../ElementsInfoCard/components/NumberInput';
import './style.scss';

const FillCard: FC = () => {
  const editor = useContext(EditorContext);
  const [fill, setFill] = useState<string>('');

  useEffect(() => {
    if (editor) {
      const handler = () => {
        const elements = editor.selectedElements.getItems();
        if (elements.length > 0) {
          /**
           * 目前一个图形只支持一个 fill
           *
           *  显示 fill 值时，如果有的图形没有 fill，将其排除。
           *
           * 添加颜色时，如果有的图形不存在 fill，赋值给它。
           */

          // 遍历，找出有 fill 的元素。
          const elementsHasFill = elements.filter((el) => el.fill);
          if (elementsHasFill.length === 0) {
            setFill('');
          } else {
            let newFill = elementsHasFill[0].fill!;
            for (let i = 1, len = elementsHasFill.length; i < len; i++) {
              const currentFill = elementsHasFill[i].fill!;
              if (newFill !== currentFill) {
                newFill = '';
                break;
              }
            }
            if (newFill[0] === '#') {
              newFill = newFill.slice(1);
            }
            setFill(newFill);
          }
        }
      };
      editor.sceneGraph.on('render', handler);
      return () => {
        editor.sceneGraph.off('render', handler);
      };
    }
  }, [editor]);

  return (
    <BaseCard title="Fill">
      <div className="fill-card">
        <div className="color-block" style={{ backgroundColor: '#' + fill }} />
        <NumberInput
          value={fill}
          onBlur={() => {
            //
          }}
        />
      </div>
    </BaseCard>
  );
};

export default FillCard;
