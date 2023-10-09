import { FC } from 'react';
import LayerItem from './LayerItem';

interface ITreeNode {
  id: string | number;
  name: string;
  children?: ITreeNode[];
}

interface IProps {
  treeData: ITreeNode[];
  activeIds?: (string | number)[];
}

export const Tree: FC<IProps> = ({ treeData, activeIds = [] }) => {
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
        />
      ))}
    </div>
  );
};
