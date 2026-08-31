import './dropdown-item.scss';

import { type EventEmitter } from '@suika/common';
import { CheckOutlined, RightOutlined } from '@suika/icons';
import classNames from 'classnames';
import { type FC, useEffect, useState } from 'react';

import { Dropdown } from '../dropdown';
import { type DropdownEvents, type Item } from '../type';

interface IProps {
  itemKey: string;
  label: string;
  suffix?: string;
  check?: boolean;
  disabled?: boolean;
  subItems?: Item[];

  onClick: (params: { key: string }) => void;

  emitter: EventEmitter<DropdownEvents>;
}

export const DropdownItem: FC<IProps> = (props) => {
  const { onClick, label, suffix, check, disabled, subItems, emitter } = props;

  useEffect(() => {
    const handleOpenSubMenu = () => {
      setOpen(false);
    };

    emitter.on('openSubMenu', handleOpenSubMenu);
    return () => {
      emitter.off('openSubMenu', handleOpenSubMenu);
    };
  }, [emitter, props.itemKey]);

  const item = (
    <>
      <div className="sk-dropdown-item">
        <div className="sk-dropdown-item-icon-box">
          {check && <CheckOutlined />}
        </div>
        {label}
      </div>
      {suffix && <span>{suffix}</span>}
      {subItems && <RightOutlined />}
    </>
  );

  const [open, setOpen] = useState(false);

  return (
    <>
      {subItems ? (
        <Dropdown
          items={subItems}
          onClick={onClick}
          open={open}
          placement="right-start"
          offset={{
            mainAxis: 0,
            crossAxis: -8,
          }}
        >
          <div
            aria-disabled={disabled}
            className={classNames('sk-dropdown-item-wrap', {
              active: open,
              disabled,
            })}
            onMouseEnter={() => {
              if (disabled) return;
              emitter.emit('openSubMenu', props.itemKey);
              setOpen(true);
            }}
          >
            {item}
          </div>
        </Dropdown>
      ) : (
        <div
          aria-disabled={disabled}
          className={classNames('sk-dropdown-item-wrap', { disabled })}
          onClick={() => {
            if (!disabled) {
              onClick({ key: props.itemKey });
            }
          }}
          onMouseEnter={() => {
            emitter.emit('openSubMenu', props.itemKey);
          }}
        >
          {item}
        </div>
      )}
    </>
  );
};
