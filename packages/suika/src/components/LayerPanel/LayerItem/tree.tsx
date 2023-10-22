import { FC } from 'react';
import LayerItem from './LayerItem';
import { IObject } from '../../../type';
import { IBaseEvents } from './type';

interface IProps extends IBaseEvents {
  treeData: IObject[];
  activeIds: string[];
  hoverId: string;
}

export const Tree: FC<IProps> = ({
  treeData,
  activeIds = [],
  hoverId,
  toggleVisible,
  toggleLock,
  setHoverId,
  setName,
  setSelectedGraph,
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
          lock={item.lock}
          toggleVisible={toggleVisible}
          toggleLock={toggleLock}
          setHoverId={setHoverId}
          setName={setName}
          setSelectedGraph={setSelectedGraph}
        />
      ))}
    </div>
  );
};
