'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
// import { cn } from 'cn';
import { XIcon } from 'lucide-react';
import * as React from 'react';
import { Rnd } from 'react-rnd';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className,
      )}
      {...props}
    />
  );
}

type DialogContentProps = DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
};

type DraggableDialogContentProps = DialogContentProps & {
  /** Additional styles for the modal backdrop. */
  overlayClassName?: string;
};

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPopup
        className={cn(
          'fixed top-1/2 left-1/2 max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 sm:max-w-sm',
          className,
        )}
        showCloseButton={showCloseButton}
        showDragHandle={false}
        {...props}
      >
        {children}
      </DialogPopup>
    </DialogPortal>
  );
}

function DraggableDialogContent({
  className,
  children,
  showCloseButton = true,
  overlayClassName,
  ...props
}: DraggableDialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay
        className={cn(
          'bg-transparent supports-backdrop-filter:backdrop-blur-none',
          overlayClassName,
        )}
      />
      <DraggableDialogPopup
        className={className}
        showCloseButton={showCloseButton}
        {...props}
      >
        {children}
      </DraggableDialogPopup>
    </DialogPortal>
  );
}

function DialogPopup({
  className,
  children,
  showCloseButton,
  showDragHandle,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton: boolean;
  showDragHandle: boolean;
}) {
  return (
    <DialogPrimitive.Popup
      data-slot="dialog-content"
      className={cn(
        'relative grid w-full gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
        className,
      )}
      {...props}
    >
      {showDragHandle && (
        <div
          aria-hidden="true"
          className="dialog-drag-handle absolute inset-x-0 top-0 h-11"
        />
      )}
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close
          data-slot="dialog-close"
          render={
            <Button
              variant="ghost"
              className="absolute top-2 right-2"
              size="icon-sm"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          }
        />
      )}
    </DialogPrimitive.Popup>
  );
}

function DraggableDialogPopup({
  className,
  children,
  showCloseButton,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton: boolean;
}) {
  const [defaultPosition] = React.useState(() => ({
    x:
      typeof window === 'undefined'
        ? 16
        : Math.max(16, window.innerWidth / 2 - 192),
    y:
      typeof window === 'undefined'
        ? 16
        : Math.max(16, window.innerHeight / 2 - 120),
    width: 'auto',
    height: 'auto',
  }));

  return (
    <Rnd
      bounds="window"
      cancel="button, input, textarea, select, [data-slot=dialog-close]"
      className={cn(
        'z-50 w-full max-w-[calc(100%-2rem)] sm:max-w-sm',
        className,
      )}
      default={defaultPosition}
      dragHandleClassName="dialog-drag-handle"
      enableResizing={false}
    >
      <DialogPopup showDragHandle showCloseButton={showCloseButton} {...props}>
        {children}
      </DialogPopup>
    </Rnd>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        '-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close
          render={<Button variant="outline">Close</Button>}
        />
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        'cn-font-heading text-base leading-none font-medium',
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  DraggableDialogContent,
};
