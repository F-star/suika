import { type IObject } from '@suika/core';
import { type FC } from 'react';

import LayerItem from './LayerItem';
import { type IBaseEvents } from './type';

interface IProps extends IBaseEvents {
  treeData: IObject[];
  activeIds: string[];
  hlId: string;
  getLayerIcon: (id: string) => string;
}

export const LayerTree: FC<IProps> = ({
  treeData,
  activeIds = [],
  hlId: hoverId,
  toggleVisible,
  toggleLock,
  setHlId: setHoverId,
  setName,
  setSelectedGraph,
  getLayerIcon,
}) => {
  return (
    <div>
      {[...treeData].reverse().map((item) => (
        <LayerItem
          type={item.type}
          active={activeIds.includes(item.id)}
          activeSecond={activeIds.includes(item.id)}
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
          getLayerIcon={getLayerIcon}
        />
      ))}
    </div>
  );
};
