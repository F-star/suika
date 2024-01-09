import React, { FC, useState } from 'react';
import { Popover } from '../popover';
import { DropdownItem } from './dropdown-item';
import './dropdown.scss';

interface DropdownDivider {
  type: 'divider';
}

interface DropDownItem {
  key: string;
  label: string;
  suffix?: string;
  check?: boolean;
  children?: DropDownItem[];
}

type Item = DropDownItem | DropdownDivider;

interface IProps {
  items: Item[];
  onClick?: (params: { key: string }) => void;
  children: React.ReactNode;
}

const isDivider = (item: Item): item is DropdownDivider => {
  return (item as DropdownDivider).type === 'divider';
};

export const Dropdown: FC<IProps> = (props) => {
  const { items, children } = props;
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
      }}
      content={
        <div className="sk-dropdown-content">
          {items.map((item, index) => {
            return isDivider(item) ? (
              <div key={index} className="sk-dropdown-item-separator" />
            ) : (
              <DropdownItem
                key={item.key}
                suffix={item.suffix}
                check={item.check}
                onClick={() => {
                  setOpen(false);
                  props.onClick?.({ key: item.key });
                }}
              >
                {item.label}
              </DropdownItem>
            );
          })}
        </div>
      }
      placement="bottom-start"
    >
      {React.cloneElement(children as React.ReactElement)}
    </Popover>
  );
};
