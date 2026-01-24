import { parseToNumber } from '@suika/common';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { type FC, useEffect, useRef, useState } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const FONT_SIZE_OPTIONS = [
  10, 11, 12, 13, 14, 15, 16, 20, 24, 32, 36, 40, 48, 64, 96, 128,
];

interface FontSizeInputProps {
  value: number | string;
  min?: number;
  max?: number;
  onChange: (newValue: number) => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  className?: string;
}

const isNumberStr = (str: string) => {
  return !Number.isNaN(Number(str));
};

export const FontSizeInput: FC<FontSizeInputProps> = ({
  value,
  min = 1,
  max = 100,
  onChange,
  onIncrement,
  onDecrement,
  className,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = String(value);
    }
  }, [value]);

  const handleInputChange = (str: string) => {
    str = str.trim();
    let num = parseToNumber(str);
    if (!Number.isNaN(num)) {
      const currentNum = typeof value === 'number' ? value : Number(value);
      if (num !== currentNum || Number.isNaN(currentNum)) {
        num = Math.max(min, num);
        num = Math.min(max, num);
        onChange(num);
      }
    }
  };

  const handleSelectSize = (size: number) => {
    onChange(size);
  };

  const displayValue = isNumberStr(String(value)) ? value : String(value);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          'relative flex items-center border border-transparent w-full h-9 rounded-md focus-within:border-[#0d99ff] box-border',
          (isFocused || isOpen) && 'border-[#0d99ff]',
          className,
        )}
      >
        <div className="relative flex-1 min-w-0 h-full">
          <PopoverTrigger asChild>
            <div className="absolute left-0 top-0 h-full w-full" />
          </PopoverTrigger>
          <input
            ref={inputRef}
            className={cn(
              'relative z-10 h-full w-full rounded-l-md border-r-0 border-transparent bg-[#f5f5f5] px-3 py-1 text-sm text-left focus:outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            )}
            defaultValue={value}
            onMouseUp={(e) => {
              const el = e.currentTarget;
              if (!isActive.current) {
                el.select();
              }
              isActive.current = true;
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                onIncrement?.();
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                onDecrement?.();
              } else if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.currentTarget.blur();
              }
            }}
            onFocus={() => {
              setIsFocused(true);
            }}
            onBlur={(e) => {
              isActive.current = false;
              setIsFocused(false);
              const selection = window.getSelection();
              selection && selection.removeAllRanges();
              if (inputRef.current) {
                const str = inputRef.current.value.trim();
                handleInputChange(str);
                e.target.value = String(displayValue);
              }
            }}
          />
        </div>
        <button
          type="button"
          className={cn(
            'flex h-full shrink-0 items-center justify-center rounded-r-md border-l-0 border-transparent bg-[#f5f5f5] px-2 text-sm transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDownIcon className="size-4 opacity-50" />
        </button>
      </div>
      <PopoverContent className="w-auto p-1" align="start" sideOffset={4}>
        <div className="max-h-[300px] min-w-[8rem] overflow-y-auto">
          {FONT_SIZE_OPTIONS.map((size) => (
            <div
              key={size}
              className={cn(
                'relative flex w-full cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                typeof value === 'number' &&
                  value === size &&
                  'bg-accent text-accent-foreground',
              )}
              onClick={() => handleSelectSize(size)}
            >
              <span className="absolute left-2 flex size-3.5 items-center justify-center">
                {typeof value === 'number' && value === size && (
                  <CheckIcon className="size-4" />
                )}
              </span>
              {size}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
