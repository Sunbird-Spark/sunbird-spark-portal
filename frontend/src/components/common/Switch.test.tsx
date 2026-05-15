import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SwitchToggle, SwitchRow } from './Switch';

describe('SwitchToggle', () => {
  it('renders with checked=false', () => {
    render(<SwitchToggle id="s1" checked={false} onChange={vi.fn()} />);
    const btn = screen.getByRole('switch');
    expect(btn).toHaveAttribute('aria-checked', 'false');
  });

  it('renders with checked=true', () => {
    render(<SwitchToggle id="s1" checked={true} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with toggled value on click', () => {
    const onChange = vi.fn();
    render(<SwitchToggle id="s1" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn();
    render(<SwitchToggle id="s1" checked={false} onChange={onChange} disabled />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop is set', () => {
    render(<SwitchToggle id="s1" checked={false} onChange={vi.fn()} disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });
});

describe('SwitchRow', () => {
  it('renders label', () => {
    render(<SwitchRow id="r1" checked={false} onChange={vi.fn()} label="Toggle me" />);
    expect(screen.getByText('Toggle me')).toBeInTheDocument();
  });

  it('renders valueLabel when provided', () => {
    render(
      <SwitchRow id="r1" checked={true} onChange={vi.fn()} label="Toggle" valueLabel="ON" />
    );
    expect(screen.getByText('ON')).toBeInTheDocument();
  });

  it('does not render valueLabel when not provided', () => {
    render(<SwitchRow id="r1" checked={false} onChange={vi.fn()} label="Toggle" />);
    expect(screen.queryByText('ON')).not.toBeInTheDocument();
  });

  it('applies disabled styles when disabled', () => {
    render(<SwitchRow id="r1" checked={false} onChange={vi.fn()} label="Toggle" disabled />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toBeDisabled();
  });
});
