import React, { FC } from 'react';
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

  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Popover: FC<PopoverProps> = ({
  placement = 'bottom',
  content,
  children,
  offset = 5,

  open,
  onOpenChange,
}) => {
  const { x, y, strategy, refs, context } = useFloating({
    placement: placement,
    open,
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
      {/* TODO: remove span container el */}
      <span ref={refs.setReference} {...getReferenceProps()}>
        {children}
      </span>
      <FloatingPortal>
        {open && (
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
