import './style.scss';

import { remainDecimal } from '@suika/common';
import { useMount } from 'ahooks';
import { type FC, useRef, useState } from 'react';

interface IProps {
  defaultValue?: number;
  onChange?: (value: number) => void;
}

export const ZoomInput: FC<IProps> = ({ defaultValue, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(
    defaultValue ? `${String(Math.round(defaultValue * 100))}%` : '',
  );

  useMount(() => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  });

  const emitChange = () => {
    const newZoom = parseInt(value);
    if (!Number.isNaN(newZoom)) {
      onChange && onChange(remainDecimal(newZoom / 100));
    }
  };

  return (
    <input
      ref={inputRef}
      value={value}
      className="suika-zoom-input"
      onInput={(e) => {
        const newValue = (e.target as HTMLInputElement).value.replace(
          /\s/g,
          '',
        );
        setValue(newValue);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
          emitChange();
        }
      }}
      onBlur={() => emitChange()}
    />
  );
};
