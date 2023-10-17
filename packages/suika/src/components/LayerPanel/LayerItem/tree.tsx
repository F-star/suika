import { FC } from 'react';
import LayerItem from './LayerItem';

interface ITreeNode {
  id: string;
  type: string;
  visible: boolean;
  name: string;
  children?: ITreeNode[];
}

interface IProps {
  treeData: ITreeNode[];
  activeIds?: string[];
  hoverId?: string;
  toggleVisible?: (id: string) => void;
  setHoverId?: (id: string) => void;
}

export const Tree: FC<IProps> = ({
  treeData,
  activeIds = [],
  hoverId,
  toggleVisible,
  setHoverId,
}) => {
  return (
    <div>
      {[...treeData].reverse().map((item) => (
        <LayerItem
          active={activeIds.includes(item.id)}
          key={item.id}
          id={item.id}
          name={item.name}
          children={item.children}
          activeIds={activeIds}
          hoverId={hoverId}
          visible={item.visible}
          toggleVisible={toggleVisible}
          setHoverId={setHoverId}
        />
      ))}
    </div>
  );
};
