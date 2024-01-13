import { FC, useEffect, useState } from 'react';
import './dropdown-item.scss';
import { CheckOutlined } from '@suika/icons';
import { Dropdown } from '../dropdown';
import { DropdownEvents, Item } from '../type';
import { EventEmitter } from '@suika/common';
import classNames from 'classnames';

interface IProps {
  itemKey: string;
  label: string;
  suffix?: string;
  check?: boolean;
  subItems?: Item[];

  onClick: (params: { key: string }) => void;

  emitter: EventEmitter<DropdownEvents>;
}

export const DropdownItem: FC<IProps> = (props) => {
  const { onClick, label, suffix, check, subItems, emitter } = props;

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
            className={classNames('sk-dropdown-item-wrap', { active: open })}
            onMouseEnter={() => {
              emitter.emit('openSubMenu', props.itemKey);
              setOpen(true);
            }}
          >
            {item}
          </div>
        </Dropdown>
      ) : (
        <div
          className="sk-dropdown-item-wrap"
          onClick={() => onClick({ key: props.itemKey })}
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
