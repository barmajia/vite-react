import { toast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

/**
 * Show a toast notification
 */
export function showToast(
  type: ToastType,
  message: string,
  options?: ToastOptions
) {
  const { title, description, duration = 3000 } = options || {};

  switch (type) {
    case 'success':
      toast.success(title || message, {
        description,
        duration,
      });
      break;
    case 'error':
      toast.error(title || message, {
        description,
        duration,
      });
      break;
    case 'info':
      toast.info(title || message, {
        description,
        duration,
      });
      break;
    case 'warning':
      toast.warning(title || message, {
        description,
        duration,
      });
      break;
  }
}

/**
 * Show a success toast
 */
export function showSuccess(message: string, options?: Omit<ToastOptions, 'type'>) {
  showToast('success', message, options);
}

/**
 * Show an error toast
 */
export function showError(message: string, options?: Omit<ToastOptions, 'type'>) {
  showToast('error', message, options);
}

/**
 * Show an info toast
 */
export function showInfo(message: string, options?: Omit<ToastOptions, 'type'>) {
  showToast('info', message, options);
}

/**
 * Show a warning toast
 */
export function showWarning(message: string, options?: Omit<ToastOptions, 'type'>) {
  showToast('warning', message, options);
}

/**
 * Handle API errors and show appropriate toast
 */
export function handleApiError(error: unknown, defaultMessage: string = 'An error occurred') {
  console.error('API Error:', error);
  
  let message = defaultMessage;
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  
  showError(message);
}
