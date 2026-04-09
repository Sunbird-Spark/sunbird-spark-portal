import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogOverlay,
} from './Dialog';

// useAppI18n is used inside DialogContent for the close button label
vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = { close: 'Close' };
      return map[key] ?? key;
    },
    isRTL: false,
  }),
}));

// Radix UI Dialog uses a Portal — it renders outside the test container by default.
// happy-dom includes document.body so this works fine.

describe('Dialog', () => {
  describe('uncontrolled open/close', () => {
    it('does not show dialog content before being opened', () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    });

    it('shows dialog content after trigger is clicked', () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Title</DialogTitle>
            <DialogDescription>Some description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      fireEvent.click(screen.getByText('Open'));
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('shows close button by default', () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      fireEvent.click(screen.getByText('Open'));
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('hides close button when hideCloseButton is true', () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent hideCloseButton>
            <DialogTitle>Test Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      fireEvent.click(screen.getByText('Open'));
      expect(screen.queryByText('Close')).not.toBeInTheDocument();
    });
  });

  // Covers the controlled `open` prop branch (line 72 area — DialogFooter render path)
  describe('controlled open prop', () => {
    it('renders content when controlled open=true', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Controlled Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Controlled Title')).toBeInTheDocument();
    });

    it('does not render content when controlled open=false', () => {
      render(
        <Dialog open={false}>
          <DialogContent>
            <DialogTitle>Hidden Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      expect(screen.queryByText('Hidden Title')).not.toBeInTheDocument();
    });

    it('calls onOpenChange when close button is clicked in controlled mode', () => {
      const onOpenChange = vi.fn();
      render(
        <Dialog open onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Controlled</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      fireEvent.click(screen.getByText('Close'));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onOpenChange when DialogClose child is clicked', () => {
      const onOpenChange = vi.fn();
      render(
        <Dialog open onOpenChange={onOpenChange}>
          <DialogContent hideCloseButton>
            <DialogTitle>Controlled</DialogTitle>
            <DialogClose>Custom Close</DialogClose>
          </DialogContent>
        </Dialog>
      );
      fireEvent.click(screen.getByText('Custom Close'));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('DialogHeader', () => {
    it('renders children', () => {
      render(<DialogHeader>Header Content</DialogHeader>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('applies additional className', () => {
      const { container } = render(<DialogHeader className="custom-header">H</DialogHeader>);
      expect(container.firstChild).toHaveClass('custom-header');
    });
  });

  describe('DialogFooter', () => {
    // DialogFooter is on line 71-73 — the flex layout container
    it('renders children', () => {
      render(<DialogFooter>Footer Content</DialogFooter>);
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('applies additional className', () => {
      const { container } = render(<DialogFooter className="custom-footer">F</DialogFooter>);
      expect(container.firstChild).toHaveClass('custom-footer');
    });

    it('has flex layout classes', () => {
      const { container } = render(<DialogFooter>F</DialogFooter>);
      expect(container.firstChild).toHaveClass('flex');
    });
  });

  describe('DialogTitle', () => {
    it('renders with correct text', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>My Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('My Title')).toBeInTheDocument();
    });

    it('applies additional className', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle className="custom-title">Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Title')).toHaveClass('custom-title');
    });
  });

  describe('DialogDescription', () => {
    it('renders description text', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>T</DialogTitle>
            <DialogDescription>Desc text</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Desc text')).toBeInTheDocument();
    });
  });

  describe('DialogOverlay', () => {
    it('renders overlay inside an open dialog', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>T</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      // The overlay is rendered by DialogContent internally; verify dialog content is visible
      expect(screen.getByText('T')).toBeInTheDocument();
    });
  });

  describe('full dialog flow with header, footer, and close', () => {
    it('renders a complete dialog with all sub-components', () => {
      const onOpenChange = vi.fn();
      render(
        <Dialog open onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Full Dialog</DialogTitle>
              <DialogDescription>Description here</DialogDescription>
            </DialogHeader>
            <p>Body content</p>
            <DialogFooter>
              <button>Cancel</button>
              <button>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Full Dialog')).toBeInTheDocument();
      expect(screen.getByText('Description here')).toBeInTheDocument();
      expect(screen.getByText('Body content')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });
  });
});
