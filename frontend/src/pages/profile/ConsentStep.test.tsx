import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { CONDITION_KEYS, ConsentStep } from './ConsentStep';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

const allChecked = CONDITION_KEYS.reduce<Record<string, boolean>>((acc, k) => {
  acc[k] = true;
  return acc;
}, {});

const renderStep = (overrides: Partial<Parameters<typeof ConsentStep>[0]> = {}) =>
  render(
    <ConsentStep
      email="user@example.com"
      checkedConditions={{}}
      toggleCondition={vi.fn()}
      allConditionsAccepted={false}
      isSending={false}
      errorMessage=""
      onSendOtp={vi.fn()}
      onCancel={vi.fn()}
      {...overrides}
    />,
  );

describe('ConsentStep', () => {
  it('renders the title, subtitle, and acknowledged counter with 0/total', () => {
    renderStep();
    expect(screen.getByText('deleteAccount.title')).toBeInTheDocument();
    expect(screen.getByText('deleteAccount.subtitle')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText(`/${CONDITION_KEYS.length}`)).toBeInTheDocument();
  });

  it('reflects checked count in the counter and progress bar', () => {
    const [firstKey, secondKey] = CONDITION_KEYS as readonly [string, string, ...string[]];
    renderStep({ checkedConditions: { [firstKey]: true, [secondKey]: true } });
    expect(screen.getByText('2')).toBeInTheDocument();
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('2');
    expect(progressbar.getAttribute('aria-valuemax')).toBe(String(CONDITION_KEYS.length));
  });

  it('renders all condition checkboxes (one per CONDITION_KEYS entry)', () => {
    renderStep();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(CONDITION_KEYS.length);
  });

  it('invokes toggleCondition when a checkbox is clicked', () => {
    const toggleCondition = vi.fn();
    renderStep({ toggleCondition });
    const [firstCheckbox] = screen.getAllByRole('checkbox');
    if (!firstCheckbox) throw new Error('expected at least one checkbox');
    fireEvent.click(firstCheckbox);
    expect(toggleCondition).toHaveBeenCalledWith(CONDITION_KEYS[0]);
  });

  it('disables the Delete account button while not all conditions are accepted', () => {
    renderStep({ allConditionsAccepted: false });
    const sendBtn = screen.getByRole('button', { name: /sendOtp/i });
    expect(sendBtn).toBeDisabled();
  });

  it('enables the Delete account button when all conditions are accepted and email is present', () => {
    renderStep({ allConditionsAccepted: true, checkedConditions: allChecked });
    expect(screen.getByRole('button', { name: /sendOtp/i })).toBeEnabled();
  });

  it('keeps the Delete account button disabled when email is missing', () => {
    renderStep({ allConditionsAccepted: true, email: undefined });
    expect(screen.getByRole('button', { name: /sendOtp/i })).toBeDisabled();
  });

  it('calls onSendOtp when the Delete account button is clicked', () => {
    const onSendOtp = vi.fn();
    renderStep({ allConditionsAccepted: true, onSendOtp });
    fireEvent.click(screen.getByRole('button', { name: /sendOtp/i }));
    expect(onSendOtp).toHaveBeenCalled();
  });

  it('calls onCancel when the Cancel button is clicked', () => {
    const onCancel = vi.fn();
    renderStep({ onCancel });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders the error message when provided', () => {
    renderStep({ errorMessage: 'Something went wrong' });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows sending state on the Delete account button', () => {
    renderStep({ allConditionsAccepted: true, isSending: true });
    const sendBtn = screen.getByRole('button', { name: /sending/i });
    expect(sendBtn).toBeDisabled();
  });

  it('shows the OTP delivery email in the footer', () => {
    renderStep({ email: 'jane@example.com' });
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });
});
