import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

const { mockIsRTL } = vi.hoisted(() => ({ mockIsRTL: { value: false } }));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
    isRTL: mockIsRTL.value,
    dir: mockIsRTL.value ? 'rtl' : 'ltr',
  }),
}));

vi.mock('@radix-ui/react-dialog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@radix-ui/react-dialog')>();
  return {
    ...actual,
    Portal: ({ children }: any) => <div data-testid="portal">{children}</div>,
    Overlay: React.forwardRef(({ className, ...props }: any, ref: any) => (
      <div ref={ref} data-testid="overlay" className={className} {...props} />
    )),
    Content: React.forwardRef(({ className, children, ...props }: any, ref: any) => (
      <div ref={ref} data-testid="dialog-content" className={className} {...props}>{children}</div>
    )),
    Close: ({ className, children, ...props }: any) => (
      <button data-testid="dialog-close" className={className} {...props}>{children}</button>
    ),
  };
});

import { DialogContent } from './Dialog';

describe('DialogContent', () => {
  it('places close button on right-4 in LTR (line 55 false branch)', () => {
    mockIsRTL.value = false;
    render(<DialogContent>Test</DialogContent>);
    const closeBtn = screen.getByTestId('dialog-close');
    expect(closeBtn.className).toContain('right-4');
    expect(closeBtn.className).not.toContain('left-4');
  });

  it('places close button on left-4 in RTL (line 55 true branch)', () => {
    mockIsRTL.value = true;
    render(<DialogContent>Test</DialogContent>);
    const closeBtn = screen.getByTestId('dialog-close');
    expect(closeBtn.className).toContain('left-4');
    expect(closeBtn.className).not.toContain('right-4');
  });

  it('hides close button when hideCloseButton=true', () => {
    mockIsRTL.value = false;
    render(<DialogContent hideCloseButton>Test</DialogContent>);
    expect(screen.queryByTestId('dialog-close')).not.toBeInTheDocument();
  });

  it('renders children', () => {
    render(<DialogContent><span>Hello</span></DialogContent>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
