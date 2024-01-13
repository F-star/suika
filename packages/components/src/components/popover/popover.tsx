import React, { FC, useState } from 'react';
import './popover.scss';

import {
  FloatingPortal,
  OffsetOptions,
  Placement,
  autoUpdate,
  flip,
  offset as floatUiOffset,
  useClick,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
} from '@floating-ui/react';

interface PopoverProps {
  content: React.ReactNode;
  children: React.ReactElement;

  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  placement?: Placement;
  trigger?: 'click' | 'hover';
  offset?: OffsetOptions;
}

export const Popover: FC<PopoverProps> = (props) => {
  const {
    content,
    children,
    placement = 'bottom-start',
    trigger = 'click',
    offset = 5,
  } = props;

  const [open, setOpen] = useState(false);

  const onOpenChange = (visible: boolean) => {
    setOpen(visible);
    props.onOpenChange?.(visible);
  };

  const mixedOpen = props.open === undefined ? open : props.open;

  const { x, y, strategy, refs, context } = useFloating({
    placement: placement,
    open: mixedOpen,
    onOpenChange,
    whileElementsMounted: autoUpdate,
    middleware: [
      flip({
        fallbackAxisSideDirection: 'end',
      }),
      floatUiOffset(offset),
    ],
  });

  const click = useClick(context, {
    event: 'mousedown',
    enabled: trigger === 'click',
  });
  const dismiss = useDismiss(context);

  const hover = useHover(context, {
    enabled: trigger === 'hover',
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    hover,
    dismiss,
  ]);

  return (
    <>
      {React.cloneElement(children as React.ReactElement, {
        ...getReferenceProps(),
        ref: refs.setReference,
      })}
      <FloatingPortal>
        {mixedOpen && (
          <div
            ref={refs.setFloating}
            className="sk-popover-content"
            style={{
              position: strategy,
              left: x ?? 0,
              top: y ?? 0,
            }}
            {...getFloatingProps()}
          >
            {content}
          </div>
        )}
      </FloatingPortal>
    </>
  );
};
