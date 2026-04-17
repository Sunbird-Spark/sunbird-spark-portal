import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('input-otp', () => ({
  OTPInput: React.forwardRef(({ containerClassName, className, ...props }: any, ref: any) => (
    <div ref={ref} className={containerClassName} data-testid="otp-input" {...props} />
  )),
  OTPInputContext: React.createContext({ slots: [] }),
}));

import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from './InputOTP';
import { OTPInputContext } from 'input-otp';

describe('InputOTP', () => {
  it('renders with containerClassName', () => {
    const { container } = render(<InputOTP maxLength={6}><InputOTPGroup /></InputOTP>);
    expect(container.querySelector('[data-testid="otp-input"]')).toBeInTheDocument();
  });
});

describe('InputOTPGroup', () => {
  it('renders children', () => {
    render(<InputOTPGroup><span>child</span></InputOTPGroup>);
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});

describe('InputOTPSlot', () => {
  it('returns null when slot index is out of range', () => {
    const { container } = render(
      <OTPInputContext.Provider value={{ slots: [] } as any}>
        <InputOTPSlot index={0} />
      </OTPInputContext.Provider>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders char without ring when isActive=false and hasFakeCaret=false (false branches)', () => {
    const slots = [{ char: '5', hasFakeCaret: false, isActive: false }];
    const { container } = render(
      <OTPInputContext.Provider value={{ slots } as any}>
        <InputOTPSlot index={0} />
      </OTPInputContext.Provider>
    );
    const div = container.querySelector('div');
    expect(div).toBeInTheDocument();
    expect(div?.textContent).toBe('5');
    // no ring classes when isActive=false
    expect(div?.className).not.toContain('ring-2');
    // no caret element
    expect(container.querySelector('.animate-caret-blink')).not.toBeInTheDocument();
  });

  it('applies ring class when isActive=true (line 38 true branch)', () => {
    const slots = [{ char: '3', hasFakeCaret: false, isActive: true }];
    const { container } = render(
      <OTPInputContext.Provider value={{ slots } as any}>
        <InputOTPSlot index={0} />
      </OTPInputContext.Provider>
    );
    const div = container.querySelector('div');
    expect(div?.className).toContain('ring-2');
  });

  it('renders fake caret when hasFakeCaret=true (line 44 true branch)', () => {
    const slots = [{ char: '', hasFakeCaret: true, isActive: false }];
    const { container } = render(
      <OTPInputContext.Provider value={{ slots } as any}>
        <InputOTPSlot index={0} />
      </OTPInputContext.Provider>
    );
    expect(container.querySelector('.animate-caret-blink')).toBeInTheDocument();
  });
});

describe('InputOTPSeparator', () => {
  it('renders with role=separator', () => {
    render(<InputOTPSeparator />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
});
