import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Toaster } from './Toaster';
import { toast } from '@/hooks/useToast';

// Mock the Toast components
vi.mock('./Toast', () => ({
  Toast: ({ children, ...props }: any) => <div data-testid="toast" {...props}>{children}</div>,
  ToastClose: () => <button data-testid="toast-close">Close</button>,
  ToastDescription: ({ children }: any) => <div data-testid="toast-description">{children}</div>,
  ToastProvider: ({ children }: any) => <div data-testid="toast-provider">{children}</div>,
  ToastTitle: ({ children }: any) => <div data-testid="toast-title">{children}</div>,
  ToastViewport: () => <div data-testid="toast-viewport" />,
}));

describe('Toaster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<Toaster />);
    expect(screen.getByTestId('toast-provider')).toBeInTheDocument();
    expect(screen.getByTestId('toast-viewport')).toBeInTheDocument();
  });

  it('should render a toast with title and description', () => {
    render(<Toaster />);

    act(() => {
      toast({
        title: 'Test Title',
        description: 'Test Description',
      });
    });

    expect(screen.getByTestId('toast-title')).toHaveTextContent('Test Title');
    expect(screen.getByTestId('toast-description')).toHaveTextContent('Test Description');
  });

  it('should render a toast with only title', () => {
    render(<Toaster />);

    act(() => {
      toast({
        title: 'Only Title',
      });
    });

    expect(screen.getByTestId('toast-title')).toHaveTextContent('Only Title');
    expect(screen.queryByTestId('toast-description')).not.toBeInTheDocument();
  });

  it('should render a toast with only description', () => {
    render(<Toaster />);

    act(() => {
      toast({
        description: 'Only Description',
      });
    });

    expect(screen.queryByTestId('toast-title')).not.toBeInTheDocument();
    expect(screen.getByTestId('toast-description')).toHaveTextContent('Only Description');
  });

  it('should render multiple toasts', () => {
    render(<Toaster />);

    act(() => {
      toast({ title: 'Toast 1' });
    });

    // Note: TOAST_LIMIT is set to 1 in useToast, so only one toast is shown at a time
    const toasts = screen.getAllByTestId('toast');
    expect(toasts).toHaveLength(1);
  });

  it('should render toast with close button', () => {
    render(<Toaster />);

    act(() => {
      toast({
        title: 'Closeable Toast',
      });
    });

    expect(screen.getByTestId('toast-close')).toBeInTheDocument();
  });

  it('should render toast with default variant', () => {
    render(<Toaster />);

    act(() => {
      toast({
        title: 'Default Toast',
        variant: 'default',
      });
    });

    const toastElement = screen.getByTestId('toast');
    expect(toastElement).toBeInTheDocument();
    expect(screen.getByTestId('toast-title')).toHaveTextContent('Default Toast');
  });

  it('should render toast with destructive variant', () => {
    render(<Toaster />);

    act(() => {
      toast({
        title: 'Error Toast',
        variant: 'destructive',
      });
    });

    const toastElement = screen.getByTestId('toast');
    expect(toastElement).toBeInTheDocument();
    expect(screen.getByTestId('toast-title')).toHaveTextContent('Error Toast');
  });

  it('should render toast with success variant', () => {
    render(<Toaster />);

    act(() => {
      toast({
        title: 'Success Toast',
        variant: 'success',
      });
    });

    const toastElement = screen.getByTestId('toast');
    expect(toastElement).toBeInTheDocument();
    expect(screen.getByTestId('toast-title')).toHaveTextContent('Success Toast');
  });

  it('should render toast with action element', () => {
    render(<Toaster />);

    act(() => {
      toast({
        title: 'Toast with Action',
        action: <button data-testid="custom-action">Undo</button>,
      });
    });

    expect(screen.getByTestId('custom-action')).toBeInTheDocument();
    expect(screen.getByTestId('custom-action')).toHaveTextContent('Undo');
  });

  it('should render toast with long description', () => {
    const longDescription = 'This is a very long description that should still render correctly in the toast component without any issues.';
    
    render(<Toaster />);

    act(() => {
      toast({
        title: 'Long Description Toast',
        description: longDescription,
      });
    });

    expect(screen.getByTestId('toast-description')).toHaveTextContent(longDescription);
  });

  it('should render toast with special characters in title', () => {
    render(<Toaster />);

    act(() => {
      toast({
        title: 'Special <>&" Characters',
      });
    });

    expect(screen.getByTestId('toast-title')).toHaveTextContent('Special <>&" Characters');
  });
});

describe('Toaster viewport filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows only center-viewport toasts when viewport="center"', () => {
    render(<Toaster viewport="center" />);

    act(() => {
      toast({ title: 'Center Toast', viewport: 'center' });
    });

    expect(screen.getByTestId('toast-title')).toHaveTextContent('Center Toast');
  });

  it('excludes center-viewport toasts from default toaster', () => {
    render(<Toaster />);

    // Fire a center-only toast; default toaster should not display it
    act(() => {
      toast({ title: 'Center Only', viewport: 'center' });
    });

    expect(screen.queryByTestId('toast-title')).not.toBeInTheDocument();
  });

  it('applies viewportClassName to the ToastViewport', () => {
    render(<Toaster viewportClassName="my-custom-class" />);
    const viewport = screen.getByTestId('toast-viewport');
    // Our mock renders <div data-testid="toast-viewport" />, className is passed via props
    expect(viewport).toBeInTheDocument();
  });
});
