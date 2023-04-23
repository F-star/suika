import React, { FC, PropsWithChildren, ReactElement, useState } from 'react';
import './popover.scss';

import {
  FloatingPortal,
  Placement,
  autoUpdate,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react';

interface PopoverProps extends PropsWithChildren {
  placement?: Placement;
  content: React.ReactNode;
}

export const Popover: FC<PopoverProps> = ({
  placement = 'left-start',
  content,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { x, y, strategy, refs, context } = useFloating({
    placement: placement,
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  return (
    <>
      {React.cloneElement(children as ReactElement, {
        ref: refs.setReference,
        ...getReferenceProps(),
        onClick: () => setIsOpen(!isOpen),
      })}
      <FloatingPortal>
        {isOpen && (
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
