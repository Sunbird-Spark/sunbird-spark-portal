import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from './InputOTP';

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
});

// The `input-otp` library renders a real <input> element that we interact with.
// OTPInputContext provides slot state to InputOTPSlot.

describe('InputOTP', () => {
  describe('InputOTPGroup', () => {
    it('renders children', () => {
      render(<InputOTPGroup><span>child</span></InputOTPGroup>);
      expect(screen.getByText('child')).toBeInTheDocument();
    });

    it('applies additional className', () => {
      const { container } = render(<InputOTPGroup className="my-group">x</InputOTPGroup>);
      expect(container.firstChild).toHaveClass('my-group');
    });
  });

  describe('InputOTPSeparator', () => {
    // Line 56: renders a div with role="separator" containing FiMinus
    it('renders with role="separator"', () => {
      render(<InputOTPSeparator />);
      expect(screen.getByRole('separator')).toBeInTheDocument();
    });

    it('renders the separator SVG icon inside', () => {
      const { container } = render(<InputOTPSeparator />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('forwards extra props to the div', () => {
      render(<InputOTPSeparator data-testid="otp-sep" />);
      expect(screen.getByTestId('otp-sep')).toBeInTheDocument();
    });

    it('applies additional className', () => {
      render(<InputOTPSeparator className="sep-class" data-testid="sep" />);
      expect(screen.getByTestId('sep')).toHaveClass('sep-class');
    });
  });

  describe('InputOTP component', () => {
    it('renders without crashing with maxLength', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      );
      expect(container).toBeInTheDocument();
    });

    it('renders the underlying input element', () => {
      render(
        <InputOTP maxLength={4}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );
      // input-otp renders a real <input> element
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('applies containerClassName to the container', () => {
      const { container } = render(
        <InputOTP maxLength={4} containerClassName="custom-container">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );
      // The container div should have the custom class
      const containerEl = container.querySelector('.custom-container');
      expect(containerEl).toBeInTheDocument();
    });

    it('applies className to the input', () => {
      render(
        <InputOTP maxLength={4} className="custom-input">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-input');
    });

    it('calls onChange when a value is typed', () => {
      const onChange = vi.fn();
      render(
        <InputOTP maxLength={4} onChange={onChange}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
          </InputOTPGroup>
        </InputOTP>
      );
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '12' } });
      expect(onChange).toHaveBeenCalledWith('12');
    });

    // Covers the onComplete callback (the gap identified at Func 75%)
    it('calls onComplete when all slots are filled', () => {
      const onComplete = vi.fn();
      render(
        <InputOTP maxLength={4} onComplete={onComplete}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      );
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '1234' } });
      expect(onComplete).toHaveBeenCalledWith('1234');
    });

    it('does not call onComplete for partial input', () => {
      const onComplete = vi.fn();
      render(
        <InputOTP maxLength={4} onComplete={onComplete}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      );
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '12' } });
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('renders in disabled state', () => {
      render(
        <InputOTP maxLength={4} disabled>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });

  describe('InputOTPSlot', () => {
    it('returns null for an out-of-bounds index', () => {
      const { container } = render(
        <InputOTP maxLength={2}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            {/* index 99 is out of bounds — slot is undefined → renders null */}
            <InputOTPSlot index={99} />
          </InputOTPGroup>
        </InputOTP>
      );
      // Only 2 slot divs should be rendered (the third renders null)
      const slots = container.querySelectorAll('[class*="relative flex h-10"]');
      expect(slots.length).toBe(2);
    });
  });
});
