import './select.scss';

import {
  autoUpdate,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react';
import { ArrowDownOutlined, CheckOutlined } from '@suika/icons';
import classNames from 'classnames';
import React, { type FC, useState } from 'react';

type ValueType = string;

interface OptionType {
  label: string;
  value: ValueType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SelectProps {
  defaultValue?: string; // TODO:
  value?: ValueType;
  placeholder?: string; // TODO:
  options?: OptionType[];
  /**
   * whether to show border
   */
  bordered?: boolean;
  style?: React.CSSProperties;
  /**
   * width of dropdown
   */
  dropdownWidth?: number;
  onSelect?: (value: ValueType) => void;
}

export const Select: FC<SelectProps> = ({
  value,
  options = [],
  bordered = true,
  style,
  dropdownWidth,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { x, y, strategy, refs, context } = useFloating({
    placement: 'bottom-start',
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  const activeLabel =
    options.find((option) => option.value === value)?.label ?? '';

  const handleChange = (value: ValueType) => {
    onSelect && onSelect(value);
    setIsOpen(false);
  };

  return (
    <>
      <div
        style={style}
        className={classNames('sk-select', {
          'sk-select-no-border': !bordered,
        })}
        ref={refs.setReference}
        onClick={() => setIsOpen(!isOpen)}
        {...getReferenceProps()}
      >
        {activeLabel}
        <span className="sk-select-suffix-icon">
          <ArrowDownOutlined />
        </span>
      </div>
      <FloatingPortal>
        {isOpen && (
          <div
            ref={refs.setFloating}
            className="sk-select-popover"
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
              width: dropdownWidth,
            }}
            {...getFloatingProps()}
          >
            {options.map((option) => (
              <div
                className="sk-select-popover-item"
                key={option.label}
                onClick={() => handleChange(option.value)}
              >
                <span className="sk-select-popover-item-icon">
                  {option.value === value && <CheckOutlined />}
                </span>

                {option.label}
              </div>
            ))}
          </div>
        )}
      </FloatingPortal>
    </>
  );
};
