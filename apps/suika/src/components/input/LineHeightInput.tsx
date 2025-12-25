import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { cn } from '@/lib/utils';

export interface LineHeightInputProps {
  value: number;
  unit: 'PIXELS' | 'PERCENT' | 'RAW';
  onChange: (value: number, unit: 'PIXELS' | 'PERCENT' | 'RAW') => void;
  className?: string;
  mixed?: boolean;
}

export const LineHeightInput: React.FC<LineHeightInputProps> = ({
  value,
  unit,
  onChange,
  className,
  mixed = false,
}) => {
  const intl = useIntl();
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Helper to format the display value
  const formatDisplayValue = (val: number, u: 'PIXELS' | 'PERCENT' | 'RAW') => {
    if (u === 'RAW') {
      return intl.formatMessage({ id: 'auto' });
    }
    if (u === 'PIXELS') {
      return `${val}`;
    }
    return `${val}%`;
  };

  // Sync internal state with props when not focused
  useEffect(() => {
    if (!isFocused) {
      if (mixed) {
        setInputValue(intl.formatMessage({ id: 'mixed' }));
      } else {
        setInputValue(formatDisplayValue(value, unit));
      }
    }
  }, [value, unit, isFocused, mixed, intl]);

  const handleBlur = () => {
    setIsFocused(false);
    const selection = window.getSelection();
    selection && selection.removeAllRanges();
    parseAndSubmit(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!e.nativeEvent.isComposing && e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const parseAndSubmit = (rawStr: string) => {
    const str = rawStr.trim();

    // If empty string, set to Auto (RAW type with value 1)
    if (str === '') {
      onChange(1, 'RAW');
      setInputValue(intl.formatMessage({ id: 'auto' }));
      return;
    }

    // Regex to capture number and optional suffix (px or %)
    // Matches numbers like "10", "10.5", ".5", "10px", "10%", "10 px"
    // Also allows negative temporarily to check min value logic, though regex captures it.
    const match = str.match(/^(-?\d*\.?\d+)\s*(px|%)?$/);

    if (match) {
      let num = parseFloat(match[1]);
      const suffix = match[2];

      let newUnit: 'PIXELS' | 'PERCENT' | 'RAW' = 'PIXELS';
      if (suffix === 'px') {
        newUnit = 'PIXELS';
      } else if (suffix === '%') {
        newUnit = 'PERCENT';
      }
      // If no suffix, default to PIXELS (pure numbers typically represent pixels)

      // Min value check
      if (num < 0) num = 0;

      // Update parent
      onChange(num, newUnit);

      // Force update local state to ensure correct formatting
      // (e.g. if user typed "10", we want "10" for PIXELS or "10%" for PERCENT)
      setInputValue(formatDisplayValue(num, newUnit));
    } else {
      // Invalid input (e.g. non-numeric), revert to current props
      if (mixed) {
        setInputValue(intl.formatMessage({ id: 'mixed' }));
      } else {
        setInputValue(formatDisplayValue(value, unit));
      }
    }
  };

  return (
    <input
      type="text"
      className={cn(
        'flex h-9 w-full rounded-md border border-transparent bg-[#f5f5f5] px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground hover:border-[#e6e6e6] focus-visible:outline-none focus-visible:border-[#0d99ff] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onFocus={(e) => {
        setIsFocused(true);
        const input = e.target;
        const value = input.value;
        // If value ends with '%', only select the number part (excluding the '%')
        if (value.endsWith('%')) {
          const numberLength = value.length - 1;
          input.setSelectionRange(0, numberLength);
        } else {
          input.select();
        }
      }}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
};
