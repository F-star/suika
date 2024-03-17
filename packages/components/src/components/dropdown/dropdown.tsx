import './dropdown.scss';

import { type OffsetOptions, type Placement } from '@floating-ui/react';
import { EventEmitter } from '@suika/common';
import React, { type FC, useRef, useState } from 'react';

import { Popover } from '../popover';
import { DropdownItem } from './dropdown-item';
import { type DropdownDivider, type DropdownEvents, type Item } from './type';

export interface IDropdownProps {
  items: Item[];
  onClick?: (params: { key: string }) => boolean | void;
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

export const Dropdown: FC<IDropdownProps> = (props) => {
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
                  const preventClose = props.onClick?.(params);
                  if (!preventClose) {
                    onOpenChange(false);
                  }
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
