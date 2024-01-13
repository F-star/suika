import React, { FC, useRef, useState } from 'react';
import { Popover } from '../popover';
import { DropdownItem } from './dropdown-item';
import './dropdown.scss';
import { DropdownDivider, DropdownEvents, Item } from './type';
import { OffsetOptions, Placement } from '@floating-ui/react';

import { EventEmitter } from '@suika/common';

interface IProps {
  items: Item[];
  onClick?: (params: { key: string }) => void;
  children: React.ReactNode;

  placement?: Placement;
  trigger?: 'click' | 'hover';
  offset?: OffsetOptions;

  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const isDivider = (item: Item): item is DropdownDivider => {
  return (item as DropdownDivider).type === 'divider';
};

export const Dropdown: FC<IProps> = (props) => {
  const { items, children, placement = 'bottom-start' } = props;
  const [open, setOpen] = useState(false);

  const mixedOpen = props.open === undefined ? open : props.open;

  const onOpenChange = (visible: boolean) => {
    setOpen(visible);
    props.onOpenChange?.(visible);
  };

  const emitter = useRef(new EventEmitter<DropdownEvents>());

  return (
    <Popover
      open={mixedOpen}
      onOpenChange={onOpenChange}
      placement={placement}
      offset={props.offset}
      trigger={props.trigger}
      content={
        <div className="sk-dropdown-content">
          {items.map((item, index) => {
            return isDivider(item) ? (
              <div key={index} className="sk-dropdown-item-separator" />
            ) : (
              <DropdownItem
                key={item.key}
                itemKey={item.key}
                label={item.label}
                suffix={item.suffix}
                check={item.check}
                subItems={item.children}
                emitter={emitter.current}
                onClick={(params) => {
                  setOpen(false);
                  props.onClick?.(params);
                }}
              />
            );
          })}
        </div>
      }
    >
      {React.cloneElement(children as React.ReactElement)}
    </Popover>
  );
};
