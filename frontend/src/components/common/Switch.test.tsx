import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SwitchToggle, SwitchRow } from './Switch';

describe('SwitchToggle', () => {
  it('renders with aria-checked=true when checked', () => {
    render(<SwitchToggle id="sw1" checked={true} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('renders with aria-checked=false when unchecked', () => {
    render(<SwitchToggle id="sw2" checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with toggled value when clicked', () => {
    const onChange = vi.fn();
    render(<SwitchToggle id="sw3" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn();
    render(<SwitchToggle id="sw4" checked={false} onChange={onChange} disabled />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('SwitchRow', () => {
  it('renders the label', () => {
    render(<SwitchRow id="sr1" checked={false} onChange={vi.fn()} label="Enable feature" />);
    expect(screen.getByText('Enable feature')).toBeInTheDocument();
  });

  it('does not render valueLabel span when valueLabel is not provided', () => {
    const { container } = render(
      <SwitchRow id="sr2" checked={false} onChange={vi.fn()} label="Feature" />
    );
    expect(container.querySelector('span.text-xs')).not.toBeInTheDocument();
  });

  it('renders valueLabel with text-sunbird-brick when checked=true (line 56 true branch)', () => {
    const { container } = render(
      <SwitchRow id="sr3" checked={true} onChange={vi.fn()} label="Feature" valueLabel="ON" />
    );
    const span = container.querySelector('span.text-xs');
    expect(span).toBeInTheDocument();
    expect(span?.className).toContain('text-sunbird-brick');
    expect(span?.textContent).toBe('ON');
  });

  it('renders valueLabel with text-muted-foreground when checked=false (line 56 false branch)', () => {
    const { container } = render(
      <SwitchRow id="sr4" checked={false} onChange={vi.fn()} label="Feature" valueLabel="OFF" />
    );
    const span = container.querySelector('span.text-xs');
    expect(span).toBeInTheDocument();
    expect(span?.className).toContain('text-muted-foreground');
  });
});
