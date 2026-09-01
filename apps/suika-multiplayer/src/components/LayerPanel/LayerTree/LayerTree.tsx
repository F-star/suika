import { type IObject } from '@suika/core';
import { type FC, useEffect, useMemo, useRef, useState } from 'react';

import LayerItem from './LayerItem';
import { type IBaseEvents } from './type';

const ROW_HEIGHT = 32;
const OVERSCAN_COUNT = 8;

interface IProps extends IBaseEvents {
  treeData: IObject[];
  activeIds: string[];
  focusId: string;
  hlId: string;
}

interface IVisibleLayer {
  item: IObject;
  level: number;
  active: boolean;
  activeSecond: boolean;
  visibleSecond: boolean;
  lockSecond: boolean;
  hasChildren: boolean;
}

export const LayerTree: FC<IProps> = ({
  treeData,
  activeIds,
  focusId,
  hlId: hoverId,
  toggleVisible,
  toggleLock,
  setHlId: setHoverId,
  setName,
  setSelectedGraph,
  getLayerIcon,
  zoomGraphicsToFit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [pendingFocusId, setPendingFocusId] = useState('');
  const lastFocusIdRef = useRef('');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateViewportHeight = () =>
      setViewportHeight(container.clientHeight);
    updateViewportHeight();

    const observer = new ResizeObserver(updateViewportHeight);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const ancestorIdsById = useMemo(() => {
    const ancestorsById = new Map<string, string[]>();

    const collectAncestorIds = (items: IObject[], ancestors: string[]) => {
      items.forEach((item) => {
        ancestorsById.set(item.id, ancestors);
        if (item.children?.length) {
          collectAncestorIds(item.children, [...ancestors, item.id]);
        }
      });
    };

    collectAncestorIds(treeData, []);
    return ancestorsById;
  }, [treeData]);

  useEffect(() => {
    if (!focusId) {
      lastFocusIdRef.current = '';
      setPendingFocusId('');
      return;
    }
    if (lastFocusIdRef.current === focusId) return;

    lastFocusIdRef.current = focusId;
    setPendingFocusId(focusId);
    const ancestorIds = ancestorIdsById.get(focusId) ?? [];
    setCollapsedIds((ids) => {
      const nextIds = new Set(ids);
      ancestorIds.forEach((id) => nextIds.delete(id));
      return nextIds.size === ids.size ? ids : nextIds;
    });
  }, [ancestorIdsById, focusId]);

  const visibleLayers = useMemo(() => {
    const selectedIds = new Set(activeIds);
    const layers: IVisibleLayer[] = [];

    const appendLayers = (
      items: IObject[],
      level: number,
      ancestorActive: boolean,
      ancestorVisible: boolean,
      ancestorLock: boolean,
    ) => {
      for (let index = items.length - 1; index >= 0; index -= 1) {
        const item = items[index];
        const active = selectedIds.has(item.id);
        const hasChildren = Boolean(item.children?.length);
        const finalVisible = item.visible && ancestorVisible;
        const finalLock = item.lock || ancestorLock;

        layers.push({
          item,
          level,
          active,
          activeSecond: ancestorActive || active,
          visibleSecond: ancestorVisible,
          lockSecond: ancestorLock,
          hasChildren,
        });

        if (hasChildren && !collapsedIds.has(item.id)) {
          appendLayers(
            item.children!,
            level + 1,
            ancestorActive || active,
            finalVisible,
            finalLock,
          );
        }
      }
    };

    appendLayers(treeData, 0, false, true, false);
    return layers;
  }, [activeIds, collapsedIds, treeData]);

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_COUNT,
  );
  const endIndex = Math.min(
    visibleLayers.length,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN_COUNT,
  );

  useEffect(() => {
    if (!pendingFocusId) return;

    const itemIndex = visibleLayers.findIndex(
      (layer) => layer.item.id === pendingFocusId,
    );
    const container = containerRef.current;
    if (itemIndex < 0 || !container) return;

    const targetTop = itemIndex * ROW_HEIGHT;
    container.scrollTo({
      top: targetTop,
    });
    setPendingFocusId('');
  }, [pendingFocusId, visibleLayers]);

  const toggleExpanded = (id: string) => {
    setCollapsedIds((ids) => {
      const nextIds = new Set(ids);
      if (nextIds.has(id)) nextIds.delete(id);
      else nextIds.add(id);
      return nextIds;
    });
  };

  return (
    <div
      ref={containerRef}
      className="suika-layer-tree"
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div
        style={{
          height: visibleLayers.length * ROW_HEIGHT,
          position: 'relative',
        }}
      >
        {visibleLayers.slice(startIndex, endIndex).map((layer, offset) => {
          const { item } = layer;
          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top: (startIndex + offset) * ROW_HEIGHT,
                width: '100%',
              }}
            >
              <LayerItem
                id={item.id}
                type={item.type}
                name={item.name}
                hasChildren={layer.hasChildren}
                isExpanded={!collapsedIds.has(item.id)}
                toggleExpanded={toggleExpanded}
                active={layer.active}
                activeSecond={layer.activeSecond}
                level={layer.level}
                hlId={hoverId}
                visible={item.visible}
                visibleSecond={layer.visibleSecond}
                lock={item.lock}
                lockSecond={layer.lockSecond}
                toggleVisible={toggleVisible}
                toggleLock={toggleLock}
                setHlId={setHoverId}
                setName={setName}
                setSelectedGraph={setSelectedGraph}
                getLayerIcon={getLayerIcon}
                zoomGraphicsToFit={zoomGraphicsToFit}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
