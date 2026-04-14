import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TncCheckboxRow } from './TncCheckboxRow';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'tncCheckbox.iAccept': 'I accept the',
        'tncCheckbox.termsLink': 'Terms & Conditions',
        'tncCheckbox.forCreatingBatch': 'for creating this batch',
      };
      return map[key] ?? key;
    },
  }),
}));

vi.mock('@/hooks/useSystemSetting', () => ({
  useSystemSetting: vi.fn(() => ({ data: null })),
}));

vi.mock('@/hooks/useTnc', () => ({
  useGetTncUrl: vi.fn(() => ({ data: null })),
}));

vi.mock('@/components/termsAndCondition/TermsAndConditionsDialog', () => ({
  TermsAndConditionsDialog: ({ children }: { children: React.ReactNode; termsUrl: string; title: string }) => (
    <div data-testid="tnc-dialog">{children}</div>
  ),
}));

import { useSystemSetting } from '@/hooks/useSystemSetting';
import { useGetTncUrl } from '@/hooks/useTnc';
import React from 'react';

// ── Tests ────────────────────────────────────────────────────────────────────

const defaultProps = {
  checked: false,
  onCheckedChange: vi.fn(),
};

describe('TncCheckboxRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSystemSetting).mockReturnValue({ data: null } as unknown as ReturnType<typeof useSystemSetting>);
    vi.mocked(useGetTncUrl).mockReturnValue({ data: null } as unknown as ReturnType<typeof useGetTncUrl>);
  });

  it('renders the "I accept the" text and terms label', () => {
    render(<TncCheckboxRow {...defaultProps} />);
    expect(screen.getByText('I accept the')).toBeInTheDocument();
    expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
  });

  it('renders the default trailing label and required asterisk', () => {
    render(<TncCheckboxRow {...defaultProps} />);
    expect(screen.getByText('for creating this batch')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders a custom label when label prop is provided', () => {
    render(<TncCheckboxRow {...defaultProps} label="for this content" />);
    expect(screen.getByText('for this content')).toBeInTheDocument();
  });

  it('renders Terms & Conditions as a plain span when termsUrl is falsy', () => {
    render(<TncCheckboxRow {...defaultProps} />);
    // No button or dialog — just a span with the terms text
    const termsEl = screen.getByText('Terms & Conditions');
    expect(termsEl.tagName).toBe('SPAN');
  });

  it('renders TermsAndConditionsDialog button when termsUrl is set and no onTermsClick', () => {
    vi.mocked(useGetTncUrl).mockReturnValue({ data: 'https://example.com/tnc.html' } as unknown as ReturnType<typeof useGetTncUrl>);
    render(<TncCheckboxRow {...defaultProps} />);
    // TermsAndConditionsDialog wraps the inner button — dialog mock renders children inside it
    expect(screen.getByTestId('tnc-dialog')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: 'Terms & Conditions' });
    expect(btn).toBeInTheDocument();
  });

  it('line 67 — calls onTermsClick (not dialog) when termsUrl is set and onTermsClick is provided', () => {
    vi.mocked(useGetTncUrl).mockReturnValue({ data: 'https://example.com/tnc.html' } as unknown as ReturnType<typeof useGetTncUrl>);
    const onTermsClick = vi.fn();
    render(<TncCheckboxRow {...defaultProps} onTermsClick={onTermsClick} />);

    const btn = screen.getByRole('button', { name: 'Terms & Conditions' });
    fireEvent.click(btn);

    expect(onTermsClick).toHaveBeenCalledTimes(1);
    // TermsAndConditionsDialog should NOT be rendered
    expect(screen.queryByTestId('tnc-dialog')).not.toBeInTheDocument();
  });

  it('onCheckedChange is called when checkbox is clicked', () => {
    const onCheckedChange = vi.fn();
    render(<TncCheckboxRow checked={false} onCheckedChange={onCheckedChange} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onCheckedChange).toHaveBeenCalled();
  });

  it('renders checkbox in checked state when checked=true', () => {
    render(<TncCheckboxRow checked={true} onCheckedChange={vi.fn()} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
  });
});
