import * as React from 'react';

import { cn } from '../../lib/utils';

export interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  React.useEffect(() => {
    if (onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [onClose]);

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 flex items-center gap-2 rounded-md border px-4 py-3 shadow-lg transition-all',
        {
          'bg-destructive text-destructive-foreground border-destructive':
            type === 'error',
          'bg-green-500 text-white border-green-500': type === 'success',
          'bg-primary text-primary-foreground border-primary': type === 'info',
        },
      )}
    >
      <span>{message}</span>
    </div>
  );
};

let toastContainer: HTMLDivElement | null = null;

const createToastContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

const renderToast = async (
  message: string,
  type: 'error' | 'success' | 'info',
  duration: number,
) => {
  const { createRoot } = await import('react-dom/client');
  const container = createToastContainer();
  const toastDiv = document.createElement('div');
  container.appendChild(toastDiv);
  const root = createRoot(toastDiv);

  const close = () => {
    root.unmount();
    if (container.contains(toastDiv)) {
      container.removeChild(toastDiv);
    }
  };

  root.render(<Toast message={message} type={type} onClose={close} />);

  setTimeout(() => {
    close();
  }, duration);
};

export const toast = {
  error: (message: string, duration = 3000) => {
    renderToast(message, 'error', duration);
  },
  success: (message: string, duration = 3000) => {
    renderToast(message, 'success', duration);
  },
  info: (message: string, duration = 3000) => {
    renderToast(message, 'info', duration);
  },
};
