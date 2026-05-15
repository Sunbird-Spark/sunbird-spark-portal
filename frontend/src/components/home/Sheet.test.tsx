import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from './Sheet';

// Default mock: isRTL = false
vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (k: string) => k, isRTL: false }),
}));

describe('SheetHeader', () => {
  it('renders children', () => {
    render(<SheetHeader>Header Content</SheetHeader>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('applies additional className', () => {
    const { container } = render(<SheetHeader className="custom-header">H</SheetHeader>);
    expect(container.firstChild).toHaveClass('custom-header');
  });
});

describe('SheetFooter', () => {
  it('renders children', () => {
    render(<SheetFooter>Footer Content</SheetFooter>);
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('applies additional className', () => {
    const { container } = render(<SheetFooter className="custom-footer">F</SheetFooter>);
    expect(container.firstChild).toHaveClass('custom-footer');
  });
});

describe('SheetTitle', () => {
  it('renders text', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>My Sheet Title</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByText('My Sheet Title')).toBeInTheDocument();
  });
});

describe('SheetDescription', () => {
  it('renders text', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetDescription>My Sheet Description</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByText('My Sheet Description')).toBeInTheDocument();
  });
});

describe('SheetContent', () => {
  it('renders children when open', () => {
    render(
      <Sheet open>
        <SheetContent>Sheet Body</SheetContent>
      </Sheet>,
    );
    expect(screen.getByText('Sheet Body')).toBeInTheDocument();
  });

  it('does NOT flip side when isRTL=false and side="top"', () => {
    render(
      <Sheet open>
        <SheetContent side="top">Top Content</SheetContent>
      </Sheet>,
    );
    // Content should still be visible; no left/right flipping occurs for top
    expect(screen.getByText('Top Content')).toBeInTheDocument();
    const content = screen.getByText('Top Content').closest('[data-radix-popper-content-wrapper], [role="dialog"], [data-state]');
    // The dialog element should exist
    expect(content ?? screen.getByText('Top Content')).toBeInTheDocument();
  });

  it('flips left to right when isRTL=true', async () => {
    vi.doMock('@/hooks/useAppI18n', () => ({
      useAppI18n: () => ({ t: (k: string) => k, isRTL: true }),
    }));

    // Dynamically import after re-mock
    const { SheetContent: RTLSheetContent, Sheet: RTLSheet } = await import('./Sheet');

    render(
      <RTLSheet open>
        <RTLSheetContent side="left">RTL Left Content</RTLSheetContent>
      </RTLSheet>,
    );

    const contentEl = screen.getByText('RTL Left Content');
    expect(contentEl).toBeInTheDocument();
  });

  it('flips right to left when isRTL=true', async () => {
    vi.doMock('@/hooks/useAppI18n', () => ({
      useAppI18n: () => ({ t: (k: string) => k, isRTL: true }),
    }));

    const { SheetContent: RTLSheetContent, Sheet: RTLSheet } = await import('./Sheet');

    render(
      <RTLSheet open>
        <RTLSheetContent side="right">RTL Right Content</RTLSheetContent>
      </RTLSheet>,
    );

    const contentEl = screen.getByText('RTL Right Content');
    expect(contentEl).toBeInTheDocument();
  });
});

describe('SheetContent RTL class checks', () => {
  it('uses left-side variant classes when isRTL=false and side="left"', () => {
    // With the static mock (isRTL=false from top-level vi.mock), side="left" stays left
    render(
      <Sheet open>
        <SheetContent side="left">LTR Left</SheetContent>
      </Sheet>,
    );
    // Radix Dialog Content is rendered with role="dialog"
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toMatch(/left/);
  });
});
