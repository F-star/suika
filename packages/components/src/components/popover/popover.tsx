import React, { FC, useState } from 'react';
import './popover.scss';

import {
  FloatingPortal,
  Placement,
  autoUpdate,
  flip,
  offset as floatUiOffset,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react';

interface PopoverProps {
  placement?: Placement;
  content: React.ReactNode;
  children: React.ReactElement;
  offset?: number;

  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Popover: FC<PopoverProps> = (props) => {
  const { placement = 'bottom', content, children, offset = 5 } = props;

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

  const click = useClick(context, { event: 'mousedown' });
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
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
