import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChecklistDialog from './ChecklistDialog';
import { CheckListFormField } from '@/types/formTypes';

const fieldsWithOtherReason: CheckListFormField[] = [
  {
    title: 'Content Review',
    contents: [
      { name: 'Code Quality', checkList: ['All functions have proper error handling', 'Code follows style guide'] },
      { name: 'Documentation', checkList: ['README is up to date', 'API docs are complete'] },
    ],
    otherReason: 'Other Reason',
  },
];

const fieldsWithoutOtherReason: CheckListFormField[] = [
  {
    title: 'Content Review',
    contents: [
      { name: 'Code Quality', checkList: ['Item 1', 'Item 2'] },
    ],
  },
];

const renderRequestChanges = (overrides: Record<string, unknown> = {}) =>
  render(
    <ChecklistDialog
      isOpen={true}
      onClose={vi.fn()}
      onRequestChanges={vi.fn()}
      formFields={fieldsWithOtherReason}
      isLoading={false}
      mode="request-changes"
      {...overrides}
    />
  );

const checkAllChecklistItems = (container: HTMLElement, count: number) => {
  const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
  for (let i = 0; i < count; i++) fireEvent.click(checkboxes[i]!);
  return checkboxes;
};

describe('ChecklistDialog - Request-Changes Validation', () => {
  it('should require all checkboxes checked to enable submit button', () => {
    const { container } = renderRequestChanges();
    const btn = screen.getByRole('button', { name: 'Request for Changes' });
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    expect(btn).toBeDisabled();
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);
    expect(btn).toBeDisabled();
    fireEvent.click(checkboxes[2]!);
    fireEvent.click(checkboxes[3]!);
    expect(btn).not.toBeDisabled();
  });

  it('should require non-empty text when other reason is checked and treat whitespace as empty', () => {
    const { container } = renderRequestChanges();
    const btn = screen.getByRole('button', { name: 'Request for Changes' });
    const checkboxes = checkAllChecklistItems(container, 4);
    expect(btn).not.toBeDisabled();
    // Check other reason
    fireEvent.click(checkboxes[4]!);
    expect(btn).toBeDisabled();
    // Whitespace-only text should keep it disabled
    const textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea')!;
    fireEvent.change(textarea, { target: { value: '   \n\t  ' } });
    expect(btn).toBeDisabled();
    // Real text should enable it
    fireEvent.change(textarea, { target: { value: 'Feedback' } });
    expect(btn).not.toBeDisabled();
  });

  it('should enable button when other reason is unchecked after being checked', () => {
    const { container } = renderRequestChanges();
    const btn = screen.getByRole('button', { name: 'Request for Changes' });
    const checkboxes = checkAllChecklistItems(container, 4);
    fireEvent.click(checkboxes[4]!); // check other reason
    expect(btn).toBeDisabled();
    fireEvent.click(checkboxes[4]!); // uncheck other reason
    expect(btn).not.toBeDisabled();
  });

  it('should disable button when loading in request-changes mode', () => {
    renderRequestChanges({ isLoading: true });
    expect(screen.getByText('Submitting...')).toBeDisabled();
  });

  it('should work without other reason field', () => {
    const { container } = render(
      <ChecklistDialog isOpen={true} onClose={vi.fn()} onRequestChanges={vi.fn()} formFields={fieldsWithoutOtherReason} isLoading={false} mode="request-changes" />
    );
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    expect(checkboxes.length).toBe(2);
    const btn = screen.getByRole('button', { name: 'Request for Changes' });
    expect(btn).toBeDisabled();
    checkboxes.forEach((cb) => fireEvent.click(cb));
    expect(btn).not.toBeDisabled();
  });

  it('should reset state when dialog reopens', () => {
    const { container, rerender } = renderRequestChanges();
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    checkboxes.forEach((cb) => fireEvent.click(cb));
    const textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea')!;
    fireEvent.change(textarea, { target: { value: 'Some feedback' } });
    // Close and reopen
    rerender(<ChecklistDialog isOpen={false} onClose={vi.fn()} onRequestChanges={vi.fn()} formFields={fieldsWithOtherReason} isLoading={false} mode="request-changes" />);
    rerender(<ChecklistDialog isOpen={true} onClose={vi.fn()} onRequestChanges={vi.fn()} formFields={fieldsWithOtherReason} isLoading={false} mode="request-changes" />);
    const newCheckboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    newCheckboxes.forEach((cb) => expect(cb.checked).toBe(false));
    expect(container.querySelector('.review-dialog-textarea')).toBeNull();
  });
});

describe('ChecklistDialog - Other Reason Field Handlers', () => {
  const smallFields: CheckListFormField[] = [
    { title: 'Review', contents: [{ name: 'Quality', checkList: ['Item 1', 'Item 2'] }], otherReason: 'Other Reason' },
  ];

  it('should toggle other reason checkbox and show/hide textarea', () => {
    const { container } = render(
      <ChecklistDialog isOpen={true} onClose={vi.fn()} onRequestChanges={vi.fn()} formFields={smallFields} isLoading={false} mode="request-changes" />
    );
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const otherCb = checkboxes[2]!;
    expect(container.querySelector('.review-dialog-textarea')).toBeNull();
    fireEvent.click(otherCb);
    expect(otherCb.checked).toBe(true);
    expect(container.querySelector('.review-dialog-textarea')).toBeTruthy();
    fireEvent.click(otherCb);
    expect(otherCb.checked).toBe(false);
    expect(container.querySelector('.review-dialog-textarea')).toBeNull();
  });

  it('should clear textarea content when checkbox is unchecked and support text input', () => {
    const { container } = render(
      <ChecklistDialog isOpen={true} onClose={vi.fn()} onRequestChanges={vi.fn()} formFields={smallFields} isLoading={false} mode="request-changes" />
    );
    const otherCb = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox')[2]!;
    fireEvent.click(otherCb);
    const textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea')!;
    fireEvent.change(textarea, { target: { value: 'Feedback text' } });
    expect(textarea.value).toBe('Feedback text');
    // Uncheck and recheck - text should be cleared
    fireEvent.click(otherCb);
    fireEvent.click(otherCb);
    expect(container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea')!.value).toBe('');
  });

  it('should disable textarea when isLoading is true', () => {
    const { container, rerender } = render(
      <ChecklistDialog isOpen={true} onClose={vi.fn()} onRequestChanges={vi.fn()} formFields={smallFields} isLoading={false} mode="request-changes" />
    );
    fireEvent.click(container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox')[2]!);
    rerender(
      <ChecklistDialog isOpen={true} onClose={vi.fn()} onRequestChanges={vi.fn()} formFields={smallFields} isLoading={true} mode="request-changes" />
    );
    expect(container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea')!.disabled).toBe(true);
  });

  it('should maintain textarea state during dialog session', () => {
    const { container } = render(
      <ChecklistDialog isOpen={true} onClose={vi.fn()} onRequestChanges={vi.fn()} formFields={smallFields} isLoading={false} mode="request-changes" />
    );
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    fireEvent.click(checkboxes[2]!);
    const textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea')!;
    fireEvent.change(textarea, { target: { value: 'Persistent feedback' } });
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);
    expect(textarea.value).toBe('Persistent feedback');
  });
});

describe('ChecklistDialog - Submit Callback & Comment Generation', () => {
  it('should pass checked items as rejectReasons and empty comment when no other reason', () => {
    const onRequestChanges = vi.fn();
    const { container } = renderRequestChanges({ onRequestChanges });
    checkAllChecklistItems(container, 4);
    fireEvent.click(screen.getByRole('button', { name: 'Request for Changes' }));
    expect(onRequestChanges).toHaveBeenCalledTimes(1);
    const [reasons, comment] = onRequestChanges.mock.calls[0]!;
    expect(reasons).toEqual([
      'All functions have proper error handling',
      'Code follows style guide',
      'README is up to date',
      'API docs are complete',
    ]);
    expect(comment).toBe('');
  });

  it('should include "Others" in reasons and pass trimmed text as comment when other reason is checked', () => {
    const onRequestChanges = vi.fn();
    const { container } = renderRequestChanges({ onRequestChanges });
    const checkboxes = checkAllChecklistItems(container, 4);
    fireEvent.click(checkboxes[4]!); // other reason checkbox
    fireEvent.change(container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea')!, {
      target: { value: '   Needs more tests   \n\t' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Request for Changes' }));
    const [reasons, comment] = onRequestChanges.mock.calls[0]!;
    expect(reasons).toContain('Others');
    expect(reasons[reasons.length - 1]).toBe('Others');
    expect(comment).toBe('Needs more tests');
  });

  it('should not include "Others" when other reason checkbox is unchecked', () => {
    const onRequestChanges = vi.fn();
    const { container } = renderRequestChanges({ onRequestChanges });
    checkAllChecklistItems(container, 4);
    fireEvent.click(screen.getByRole('button', { name: 'Request for Changes' }));
    const [reasons, comment] = onRequestChanges.mock.calls[0]!;
    expect(reasons).not.toContain('Others');
    expect(reasons.length).toBe(4);
    expect(comment).toBe('');
  });

  it('should handle multiple sections correctly', () => {
    const multiFields: CheckListFormField[] = [
      {
        title: 'Review',
        contents: [
          { name: 'Security', checkList: ['No SQL injection'] },
          { name: 'Performance', checkList: ['Queries optimized'] },
          { name: 'Testing', checkList: ['Unit tests pass', 'Integration tests pass'] },
        ],
      },
    ];
    const onRequestChanges = vi.fn();
    const { container } = render(
      <ChecklistDialog isOpen={true} onClose={vi.fn()} onRequestChanges={onRequestChanges} formFields={multiFields} isLoading={false} mode="request-changes" />
    );
    checkAllChecklistItems(container, 4);
    fireEvent.click(screen.getByRole('button', { name: 'Request for Changes' }));
    const [reasons] = onRequestChanges.mock.calls[0]!;
    expect(reasons).toEqual(['No SQL injection', 'Queries optimized', 'Unit tests pass', 'Integration tests pass']);
  });

  it('should not call onRequestChanges when button is disabled', () => {
    const onRequestChanges = vi.fn();
    renderRequestChanges({ onRequestChanges });
    fireEvent.click(screen.getByRole('button', { name: 'Request for Changes' }));
    expect(onRequestChanges).not.toHaveBeenCalled();
  });

  it('should not throw when onRequestChanges is undefined', () => {
    const { container } = render(
      <ChecklistDialog isOpen={true} onClose={vi.fn()} formFields={fieldsWithoutOtherReason} isLoading={false} mode="request-changes" />
    );
    checkAllChecklistItems(container, 2);
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Request for Changes' }))).not.toThrow();
  });
});
