import { Toaster as SonnerToaster } from 'sonner';

export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'bg-background border border-border text-foreground',
          title: 'text-foreground',
          description: 'text-muted-foreground',
          success: 'border-green-500',
          error: 'border-destructive',
          warning: 'border-yellow-500',
        },
      }}
    />
  );
}
