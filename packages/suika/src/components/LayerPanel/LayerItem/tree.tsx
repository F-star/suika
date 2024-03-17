import { type FC } from 'react';

import { type IObject } from '../../../type';
import LayerItem from './LayerItem';
import { type IBaseEvents } from './type';

interface IProps extends IBaseEvents {
  treeData: IObject[];
  activeIds: string[];
  hlId: string;
}

export const Tree: FC<IProps> = ({
  treeData,
  activeIds = [],
  hlId: hoverId,
  toggleVisible,
  toggleLock,
  setHlId: setHoverId,
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
          hlId={hoverId}
          visible={item.visible}
          lock={item.lock}
          toggleVisible={toggleVisible}
          toggleLock={toggleLock}
          setHlId={setHoverId}
          setName={setName}
          setSelectedGraph={setSelectedGraph}
        />
      ))}
    </div>
  );
};
