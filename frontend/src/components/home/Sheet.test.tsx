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
      <div ref={ref} data-testid="sheet-content" className={className} {...props}>{children}</div>
    )),
    Close: ({ className, children, ...props }: any) => (
      <button data-testid="sheet-close" className={className} {...props}>{children}</button>
    ),
  };
});

import { SheetContent } from './Sheet';

describe('SheetContent', () => {
  it('uses right side by default in LTR (no flip)', () => {
    mockIsRTL.value = false;
    render(<SheetContent side="right">Sheet body</SheetContent>);
    const content = screen.getByTestId('sheet-content');
    expect(content.className).toContain('right-0');
  });

  it('flips right → left in RTL (line 60-61 true branch)', () => {
    mockIsRTL.value = true;
    render(<SheetContent side="right">Sheet body</SheetContent>);
    const content = screen.getByTestId('sheet-content');
    expect(content.className).toContain('left-0');
  });

  it('flips left → right in RTL (line 61 ternary right branch)', () => {
    mockIsRTL.value = true;
    render(<SheetContent side="left">Sheet body</SheetContent>);
    const content = screen.getByTestId('sheet-content');
    expect(content.className).toContain('right-0');
  });

  it('does not flip non-horizontal sides in RTL (top stays top)', () => {
    mockIsRTL.value = true;
    render(<SheetContent side="top">Sheet body</SheetContent>);
    const content = screen.getByTestId('sheet-content');
    expect(content.className).toContain('top-0');
  });

  it('places close button on right-4 in LTR (line 71 false branch)', () => {
    mockIsRTL.value = false;
    render(<SheetContent>Sheet body</SheetContent>);
    const closeBtn = screen.getByTestId('sheet-close');
    expect(closeBtn.className).toContain('right-4');
    expect(closeBtn.className).not.toContain('left-4');
  });

  it('places close button on left-4 in RTL (line 71 true branch)', () => {
    mockIsRTL.value = true;
    render(<SheetContent>Sheet body</SheetContent>);
    const closeBtn = screen.getByTestId('sheet-close');
    expect(closeBtn.className).toContain('left-4');
    expect(closeBtn.className).not.toContain('right-4');
  });
});
