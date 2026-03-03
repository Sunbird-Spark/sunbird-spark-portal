import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChecklistDialog from './ChecklistDialog';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'checklistDialog.publish': 'Publish',
        'checklistDialog.publishing': 'Publishing...',
        'checklistDialog.requestForChanges': 'Request for Changes',
        'checklistDialog.submitting': 'Submitting...',
        'checklistDialog.publishContent': 'Publish Content',
        'cancel': 'Cancel',
      };
      return translations[key] || key;
    },
  }),
}));
import { CheckListFormField } from '@/types/formTypes';

const mockFormFields: CheckListFormField[] = [
  {
    title: 'Content Review',
    contents: [
      { name: 'Code Quality', checkList: ['All functions have proper error handling', 'Code follows style guide'] },
      { name: 'Documentation', checkList: ['README is up to date', 'API docs are complete'] },
    ],
  },
];

const defaultPublishProps = {
  isOpen: true,
  onClose: vi.fn(),
  onPublish: vi.fn(),
  formFields: mockFormFields,
  isLoading: false,
  mode: 'publish' as const,
};

const checkAllBoxes = (container: HTMLElement) => {
  const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
  checkboxes.forEach((cb) => fireEvent.click(cb));
  return checkboxes;
};

describe('ChecklistDialog - Checkbox Interactions', () => {
  it('should toggle checkbox state and track independently', () => {
    const { container } = render(<ChecklistDialog {...defaultPublishProps} />);
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    expect(checkboxes.length).toBe(4);
    // Toggle first checkbox
    expect(checkboxes[0]!.checked).toBe(false);
    fireEvent.click(checkboxes[0]!);
    expect(checkboxes[0]!.checked).toBe(true);
    fireEvent.click(checkboxes[0]!);
    expect(checkboxes[0]!.checked).toBe(false);
    // Check all, then uncheck one - verify independence
    checkboxes.forEach((cb) => fireEvent.click(cb));
    checkboxes.forEach((cb) => expect(cb.checked).toBe(true));
    fireEvent.click(checkboxes[1]!);
    expect(checkboxes[0]!.checked).toBe(true);
    expect(checkboxes[1]!.checked).toBe(false);
    expect(checkboxes[2]!.checked).toBe(true);
    expect(checkboxes[3]!.checked).toBe(true);
  });

  it('should disable checkboxes when isLoading is true and prevent state changes', () => {
    const { container } = render(<ChecklistDialog {...defaultPublishProps} isLoading={true} />);
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    checkboxes.forEach((cb) => expect(cb.disabled).toBe(true));
    fireEvent.click(checkboxes[0]!);
    expect(checkboxes[0]!.checked).toBe(false);
  });

  it('should enable checkboxes when isLoading is false', () => {
    const { container } = render(<ChecklistDialog {...defaultPublishProps} isLoading={false} />);
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    checkboxes.forEach((cb) => expect(cb.disabled).toBe(false));
  });
});

describe('ChecklistDialog - Publish Mode Validation', () => {
  it('should count total checkboxes across multiple sections', () => {
    const multiFields: CheckListFormField[] = [
      { title: 'Section 1', contents: [{ name: 'A', checkList: ['1', '2', '3'] }, { name: 'B', checkList: ['4', '5'] }] },
      { title: 'Section 2', contents: [{ name: 'C', checkList: ['6', '7', '8', '9'] }] },
    ];
    const { container } = render(
      <ChecklistDialog isOpen={true} onClose={vi.fn()} onPublish={vi.fn()} formFields={multiFields} isLoading={false} mode="publish" />
    );
    expect(container.querySelectorAll('.review-dialog-checkbox').length).toBe(9);
  });

  it('should enable publish button only when all checkboxes are checked', () => {
    const { container } = render(<ChecklistDialog {...defaultPublishProps} />);
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const btn = screen.getByText('Publish');
    expect(btn).toBeDisabled();
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);
    expect(btn).toBeDisabled();
    fireEvent.click(checkboxes[2]!);
    fireEvent.click(checkboxes[3]!);
    expect(btn).not.toBeDisabled();
  });

  it('should handle empty formFields and formFields with empty contents', () => {
    const { rerender } = render(
      <ChecklistDialog isOpen={true} onClose={vi.fn()} onPublish={vi.fn()} formFields={[]} isLoading={false} mode="publish" />
    );
    expect(screen.getByText('Publish')).not.toBeDisabled();
    rerender(
      <ChecklistDialog isOpen={true} onClose={vi.fn()} onPublish={vi.fn()} formFields={[{ title: 'Empty', contents: [] }]} isLoading={false} mode="publish" />
    );
    expect(screen.getByText('Publish')).not.toBeDisabled();
  });

  it('should reset checked state when dialog reopens', () => {
    const fields: CheckListFormField[] = [{ title: 'Review', contents: [{ name: 'Q', checkList: ['Item 1', 'Item 2'] }] }];
    const { container, rerender } = render(
      <ChecklistDialog isOpen={true} onClose={vi.fn()} onPublish={vi.fn()} formFields={fields} isLoading={false} mode="publish" />
    );
    checkAllBoxes(container);
    rerender(<ChecklistDialog isOpen={false} onClose={vi.fn()} onPublish={vi.fn()} formFields={fields} isLoading={false} mode="publish" />);
    rerender(<ChecklistDialog isOpen={true} onClose={vi.fn()} onPublish={vi.fn()} formFields={fields} isLoading={false} mode="publish" />);
    const cbs = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    cbs.forEach((cb) => expect(cb.checked).toBe(false));
  });
});

describe('ChecklistDialog - Button Labels & Click Handlers', () => {
  it('should show correct button labels based on mode and loading state', () => {
    const { rerender } = render(<ChecklistDialog {...defaultPublishProps} />);
    expect(screen.getByRole('button', { name: 'Publish' })).toBeTruthy();
    rerender(<ChecklistDialog {...defaultPublishProps} isLoading={true} />);
    expect(screen.getByText('Publishing...')).toBeTruthy();
    rerender(
      <ChecklistDialog isOpen={true} onClose={vi.fn()} onRequestChanges={vi.fn()} formFields={mockFormFields} isLoading={false} mode="request-changes" />
    );
    expect(screen.getByRole('button', { name: 'Request for Changes' })).toBeTruthy();
    rerender(
      <ChecklistDialog isOpen={true} onClose={vi.fn()} onRequestChanges={vi.fn()} formFields={mockFormFields} isLoading={true} mode="request-changes" />
    );
    expect(screen.getByText('Submitting...')).toBeTruthy();
  });

  it('should call onPublish when all checked and button clicked', () => {
    const onPublish = vi.fn();
    const { container } = render(<ChecklistDialog {...defaultPublishProps} onPublish={onPublish} />);
    checkAllBoxes(container);
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(onPublish).toHaveBeenCalledTimes(1);
  });

  it('should not call callbacks when button is disabled (validation or loading)', () => {
    const onPublish = vi.fn();
    render(<ChecklistDialog {...defaultPublishProps} onPublish={onPublish} />);
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(onPublish).not.toHaveBeenCalled();

    const onPublish2 = vi.fn();
    const { container } = render(<ChecklistDialog {...defaultPublishProps} onPublish={onPublish2} isLoading={true} />);
    checkAllBoxes(container);
    fireEvent.click(screen.getByRole('button', { name: 'Publishing...' }));
    expect(onPublish2).not.toHaveBeenCalled();
  });

  it('should not throw when callback prop is undefined', () => {
    const { container } = render(
      <ChecklistDialog isOpen={true} onClose={vi.fn()} formFields={mockFormFields} isLoading={false} mode="publish" />
    );
    checkAllBoxes(container);
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Publish' }))).not.toThrow();
  });
});
