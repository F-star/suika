import React, { FC, useState } from 'react';
import './popover.scss';

import {
  FloatingPortal,
  Placement,
  autoUpdate,
  flip,
  offset,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react';

interface PopoverProps {
  placement?: Placement;
  content: React.ReactNode;
  children: React.ReactElement;

  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Popover: FC<PopoverProps> = ({
  placement = 'bottom',
  content,
  children,
  open,
  onOpenChange,
}) => {
  const [isOpen, setIsOpen] = useState(open ?? false);

  const { x, y, strategy, refs, context } = useFloating({
    placement: placement,
    open: isOpen,
    onOpenChange: (open) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    whileElementsMounted: autoUpdate,
    middleware: [
      flip({
        fallbackAxisSideDirection: 'end',
      }),
      offset(5),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  const showPopover = () => {
    if (open === undefined) {
      return isOpen;
    }
    return open;
  };

  return (
    <>
      <span ref={refs.setReference} {...getReferenceProps()}>
        {children}
      </span>
      <FloatingPortal>
        {showPopover() && (
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
