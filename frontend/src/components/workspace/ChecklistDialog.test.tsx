import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChecklistDialog from './ChecklistDialog';
import { FormField } from '@/types/formTypes';

describe('ChecklistDialog - Task 3.3: Checkbox Interaction Handlers', () => {
  const mockFormFields: FormField[] = [
    {
      title: 'Content Review',
      contents: [
        {
          name: 'Code Quality',
          checkList: ['All functions have proper error handling', 'Code follows style guide']
        },
        {
          name: 'Documentation',
          checkList: ['README is up to date', 'API docs are complete']
        }
      ]
    }
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onPublish: vi.fn(),
    formFields: mockFormFields,
    isLoading: false,
    mode: 'publish' as const
  };

  it('should toggle checkbox state when clicked (Requirement 4.5)', () => {
    const { container } = render(<ChecklistDialog {...defaultProps} />);
    
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    expect(checkboxes.length).toBe(4); // 2 sections with 2 items each
    
    const firstCheckbox = checkboxes[0]!;
    
    // Initially unchecked
    expect(firstCheckbox.checked).toBe(false);
    
    // Click to check
    fireEvent.click(firstCheckbox);
    expect(firstCheckbox.checked).toBe(true);
    
    // Click again to uncheck
    fireEvent.click(firstCheckbox);
    expect(firstCheckbox.checked).toBe(false);
  });

  it('should update checkedItems record when checkbox is clicked (Requirement 4.3)', () => {
    const { container } = render(<ChecklistDialog {...defaultProps} />);
    
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    
    // Check first checkbox
    fireEvent.click(checkboxes[0]!);
    expect(checkboxes[0]!.checked).toBe(true);
    
    // Check second checkbox
    fireEvent.click(checkboxes[1]!);
    expect(checkboxes[1]!.checked).toBe(true);
    
    // Verify both remain checked (state is tracked independently)
    expect(checkboxes[0]!.checked).toBe(true);
    expect(checkboxes[1]!.checked).toBe(true);
  });

  it('should track checked state independently for all checkboxes (Requirement 4.4)', () => {
    const { container } = render(<ChecklistDialog {...defaultProps} />);
    
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    
    // Check all checkboxes
    checkboxes.forEach(checkbox => fireEvent.click(checkbox));
    
    // Verify all are checked
    checkboxes.forEach(checkbox => {
      expect(checkbox.checked).toBe(true);
    });
    
    // Uncheck the second checkbox
    fireEvent.click(checkboxes[1]!);
    
    // Verify only the second checkbox is unchecked
    expect(checkboxes[0]!.checked).toBe(true);
    expect(checkboxes[1]!.checked).toBe(false);
    expect(checkboxes[2]!.checked).toBe(true);
    expect(checkboxes[3]!.checked).toBe(true);
  });

  it('should disable all checkboxes when isLoading is true (Requirement 4.6)', () => {
    const { container } = render(
      <ChecklistDialog {...defaultProps} isLoading={true} />
    );
    
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    
    // Verify all checkboxes are disabled
    checkboxes.forEach(checkbox => {
      expect(checkbox.disabled).toBe(true);
    });
  });

  it('should enable all checkboxes when isLoading is false (Requirement 4.6)', () => {
    const { container } = render(
      <ChecklistDialog {...defaultProps} isLoading={false} />
    );
    
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    
    // Verify all checkboxes are enabled
    checkboxes.forEach(checkbox => {
      expect(checkbox.disabled).toBe(false);
    });
  });

  it('should not allow checkbox state changes when disabled (Requirement 4.6)', () => {
    const { container } = render(
      <ChecklistDialog {...defaultProps} isLoading={true} />
    );
    
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const firstCheckbox = checkboxes[0]!;
    
    // Verify checkbox is disabled
    expect(firstCheckbox.disabled).toBe(true);
    expect(firstCheckbox.checked).toBe(false);
    
    // Try to click (should not change state due to disabled attribute)
    fireEvent.click(firstCheckbox);
    
    // Verify state hasn't changed
    expect(firstCheckbox.checked).toBe(false);
  });

  it('should use correct checkbox key pattern for state tracking', () => {
    const { container } = render(<ChecklistDialog {...defaultProps} />);
    
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    
    // Check specific checkboxes to verify key pattern works correctly
    // fieldIndex=0, contentIndex=0, itemIndex=0
    fireEvent.click(checkboxes[0]!);
    expect(checkboxes[0]!.checked).toBe(true);
    
    // fieldIndex=0, contentIndex=1, itemIndex=1
    fireEvent.click(checkboxes[3]!);
    expect(checkboxes[3]!.checked).toBe(true);
    
    // Verify other checkboxes remain unchecked
    expect(checkboxes[1]!.checked).toBe(false);
    expect(checkboxes[2]!.checked).toBe(false);
  });
});

describe('ChecklistDialog - Task 5.1: Validation Helper Functions', () => {
  it('should correctly count total checkboxes across all sections (Requirement 5.1)', () => {
    const formFields: FormField[] = [
      {
        title: 'Review Section 1',
        contents: [
          {
            name: 'Section A',
            checkList: ['Item 1', 'Item 2', 'Item 3']
          },
          {
            name: 'Section B',
            checkList: ['Item 4', 'Item 5']
          }
        ]
      },
      {
        title: 'Review Section 2',
        contents: [
          {
            name: 'Section C',
            checkList: ['Item 6', 'Item 7', 'Item 8', 'Item 9']
          }
        ]
      }
    ];

    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onPublish={vi.fn()}
        formFields={formFields}
        isLoading={false}
        mode="publish"
      />
    );

    // Total should be 3 + 2 + 4 = 9 checkboxes
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    expect(checkboxes.length).toBe(9);
  });

  it('should correctly count checked checkboxes from checkedItems state (Requirement 6.1)', () => {
    const formFields: FormField[] = [
      {
        title: 'Content Review',
        contents: [
          {
            name: 'Code Quality',
            checkList: ['Item 1', 'Item 2', 'Item 3']
          },
          {
            name: 'Documentation',
            checkList: ['Item 4', 'Item 5']
          }
        ]
      }
    ];

    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onPublish={vi.fn()}
        formFields={formFields}
        isLoading={false}
        mode="publish"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const publishButton = screen.getByText('Publish');

    // Initially, no checkboxes are checked, button should be disabled
    expect(publishButton).toBeDisabled();

    // Check 2 out of 5 checkboxes
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[2]!);

    // Button should still be disabled (not all checked)
    expect(publishButton).toBeDisabled();

    // Check remaining checkboxes
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[3]!);
    fireEvent.click(checkboxes[4]!);

    // Now all 5 are checked, button should be enabled
    expect(publishButton).not.toBeDisabled();
  });

  it('should handle empty formFields array (edge case)', () => {
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onPublish={vi.fn()}
        formFields={[]}
        isLoading={false}
        mode="publish"
      />
    );

    // Should have 0 checkboxes
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    expect(checkboxes.length).toBe(0);

    // Button should be enabled (all 0 checkboxes are "checked")
    const publishButton = screen.getByText('Publish');
    expect(publishButton).not.toBeDisabled();
  });

  it('should handle formFields with empty contents array (edge case)', () => {
    const formFields: FormField[] = [
      {
        title: 'Empty Section',
        contents: []
      }
    ];

    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onPublish={vi.fn()}
        formFields={formFields}
        isLoading={false}
        mode="publish"
      />
    );

    // Should have 0 checkboxes
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    expect(checkboxes.length).toBe(0);

    // Button should be enabled (all 0 checkboxes are "checked")
    const publishButton = screen.getByText('Publish');
    expect(publishButton).not.toBeDisabled();
  });

  it('should correctly validate when all checkboxes are checked in publish mode (Requirement 5.2)', () => {
    const formFields: FormField[] = [
      {
        title: 'Content Review',
        contents: [
          {
            name: 'Quality',
            checkList: ['Item 1', 'Item 2']
          }
        ]
      }
    ];

    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onPublish={vi.fn()}
        formFields={formFields}
        isLoading={false}
        mode="publish"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const publishButton = screen.getByText('Publish');

    // Initially disabled
    expect(publishButton).toBeDisabled();

    // Check all checkboxes
    checkboxes.forEach(checkbox => fireEvent.click(checkbox));

    // Should be enabled now
    expect(publishButton).not.toBeDisabled();
  });

  it('should correctly validate when some checkboxes are unchecked in publish mode (Requirement 5.3)', () => {
    const formFields: FormField[] = [
      {
        title: 'Content Review',
        contents: [
          {
            name: 'Quality',
            checkList: ['Item 1', 'Item 2', 'Item 3']
          }
        ]
      }
    ];

    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onPublish={vi.fn()}
        formFields={formFields}
        isLoading={false}
        mode="publish"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const publishButton = screen.getByText('Publish');

    // Check only 2 out of 3
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);

    // Should still be disabled
    expect(publishButton).toBeDisabled();
  });

  it('should reset checked count when dialog reopens (Requirement 9.1)', () => {
    const formFields: FormField[] = [
      {
        title: 'Content Review',
        contents: [
          {
            name: 'Quality',
            checkList: ['Item 1', 'Item 2']
          }
        ]
      }
    ];

    const { container, rerender } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onPublish={vi.fn()}
        formFields={formFields}
        isLoading={false}
        mode="publish"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');

    // Check all checkboxes
    checkboxes.forEach(checkbox => fireEvent.click(checkbox));
    expect(checkboxes[0]!.checked).toBe(true);
    expect(checkboxes[1]!.checked).toBe(true);

    // Close dialog
    rerender(
      <ChecklistDialog
        isOpen={false}
        onClose={vi.fn()}
        onPublish={vi.fn()}
        formFields={formFields}
        isLoading={false}
        mode="publish"
      />
    );

    // Reopen dialog
    rerender(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onPublish={vi.fn()}
        formFields={formFields}
        isLoading={false}
        mode="publish"
      />
    );

    // Checkboxes should be reset to unchecked
    const newCheckboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    expect(newCheckboxes[0]!.checked).toBe(false);
    expect(newCheckboxes[1]!.checked).toBe(false);
  });
});

describe('ChecklistDialog - Task 5.3: Request-Changes Mode Validation', () => {
  const mockFormFields: FormField[] = [
    {
      title: 'Content Review',
      contents: [
        {
          name: 'Code Quality',
          checkList: ['All functions have proper error handling', 'Code follows style guide']
        },
        {
          name: 'Documentation',
          checkList: ['README is up to date']
        }
      ],
      otherReason: 'Other Reason'
    }
  ];

  it('should require all checkboxes checked in request-changes mode (Requirement 6.1)', () => {
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');

    // Initially, button should be disabled (no checkboxes checked)
    expect(submitButton).toBeDisabled();

    // Check only some checkboxes (not all)
    fireEvent.click(checkboxes[0]!); // First checklist item
    fireEvent.click(checkboxes[1]!); // Second checklist item
    // Skip third checklist item

    // Button should still be disabled (not all checklist items checked)
    expect(submitButton).toBeDisabled();

    // Check the remaining checklist item
    fireEvent.click(checkboxes[2]!); // Third checklist item

    // Now all checklist items are checked, button should be enabled
    expect(submitButton).not.toBeDisabled();
  });

  it('should require non-empty text when other reason checkbox is checked (Requirement 6.2)', () => {
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');

    // Check all checklist items (first 3 checkboxes)
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[2]!);

    // Button should be enabled (all checklist items checked, other reason not checked)
    expect(submitButton).not.toBeDisabled();

    // Check the "Other Reason" checkbox (4th checkbox)
    const otherReasonCheckbox = checkboxes[3]!;
    fireEvent.click(otherReasonCheckbox);

    // Button should now be disabled (other reason checked but no text)
    expect(submitButton).toBeDisabled();

    // Add text to the textarea
    const textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    expect(textarea).toBeTruthy();
    fireEvent.change(textarea!, { target: { value: 'Additional feedback' } });

    // Button should be enabled now (all checklist items checked and other reason has text)
    expect(submitButton).not.toBeDisabled();
  });

  it('should treat whitespace-only text as empty (Requirement 6.2)', () => {
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');

    // Check all checklist items
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[2]!);

    // Check the "Other Reason" checkbox
    fireEvent.click(checkboxes[3]!);

    // Add whitespace-only text
    const textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    fireEvent.change(textarea!, { target: { value: '   \n\t  ' } });

    // Button should still be disabled (whitespace-only text is treated as empty)
    expect(submitButton).toBeDisabled();

    // Add actual text
    fireEvent.change(textarea!, { target: { value: '  Some feedback  ' } });

    // Button should be enabled now
    expect(submitButton).not.toBeDisabled();
  });

  it('should enable button when other reason is unchecked (Requirement 6.3)', () => {
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');

    // Check all checklist items
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[2]!);

    // Check the "Other Reason" checkbox
    fireEvent.click(checkboxes[3]!);

    // Button should be disabled (other reason checked but no text)
    expect(submitButton).toBeDisabled();

    // Uncheck the "Other Reason" checkbox
    fireEvent.click(checkboxes[3]!);

    // Button should be enabled (all checklist items checked, other reason not checked)
    expect(submitButton).not.toBeDisabled();
  });

  it('should validate correctly when all conditions are met (Requirement 6.3)', () => {
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');

    // Initially disabled
    expect(submitButton).toBeDisabled();

    // Check all checklist items
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[2]!);

    // Should be enabled (all checklist items checked)
    expect(submitButton).not.toBeDisabled();

    // Check other reason
    fireEvent.click(checkboxes[3]!);

    // Should be disabled (other reason checked but no text)
    expect(submitButton).toBeDisabled();

    // Add text
    const textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    fireEvent.change(textarea!, { target: { value: 'Additional feedback' } });

    // Should be enabled (all conditions met)
    expect(submitButton).not.toBeDisabled();
  });

  it('should disable button when loading in request-changes mode (Requirement 6.4)', () => {
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={true}
        mode="request-changes"
      />
    );

    const submitButton = screen.getByText('Submitting...');
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');

    // Check all checklist items
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[2]!);

    // Button should be disabled due to loading state
    expect(submitButton).toBeDisabled();
  });

  it('should work without other reason field (Requirement 6.1)', () => {
    const formFieldsWithoutOtherReason: FormField[] = [
      {
        title: 'Content Review',
        contents: [
          {
            name: 'Code Quality',
            checkList: ['Item 1', 'Item 2']
          }
        ]
      }
    ];

    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={formFieldsWithoutOtherReason}
        isLoading={false}
        mode="request-changes"
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });
    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');

    // Should only have 2 checkboxes (no other reason field)
    expect(checkboxes.length).toBe(2);

    // Initially disabled
    expect(submitButton).toBeDisabled();

    // Check all checkboxes
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);

    // Should be enabled (all checklist items checked, no other reason field)
    expect(submitButton).not.toBeDisabled();
  });

  it('should reset other reason state when dialog reopens (Requirement 9.2, 9.3)', () => {
    const { container, rerender } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');

    // Check all items including other reason
    checkboxes.forEach(checkbox => fireEvent.click(checkbox));

    // Add text to other reason
    const textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    fireEvent.change(textarea!, { target: { value: 'Some feedback' } });

    // Verify state is set
    expect(checkboxes[3]!.checked).toBe(true);
    expect(textarea!.value).toBe('Some feedback');

    // Close dialog
    rerender(
      <ChecklistDialog
        isOpen={false}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    // Reopen dialog
    rerender(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    // Verify state is reset
    const newCheckboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    expect(newCheckboxes[3]!.checked).toBe(false);

    // Textarea should not be visible when other reason is unchecked
    const newTextarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    expect(newTextarea).toBeNull();
  });
});

describe('ChecklistDialog - Task 6.2: Other Reason Field Handlers', () => {
  const mockFormFields: FormField[] = [
    {
      title: 'Content Review',
      contents: [
        {
          name: 'Code Quality',
          checkList: ['Item 1', 'Item 2']
        }
      ],
      otherReason: 'Other Reason'
    }
  ];

  it('should have onChange handler for other reason checkbox (Requirement 7.3)', () => {
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const otherReasonCheckbox = checkboxes[2]!; // Third checkbox is "Other Reason"

    // Initially unchecked
    expect(otherReasonCheckbox.checked).toBe(false);

    // Click to check
    fireEvent.click(otherReasonCheckbox);
    expect(otherReasonCheckbox.checked).toBe(true);

    // Click again to uncheck
    fireEvent.click(otherReasonCheckbox);
    expect(otherReasonCheckbox.checked).toBe(false);
  });

  it('should clear textarea content when checkbox is unchecked (Requirement 7.3)', () => {
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const otherReasonCheckbox = checkboxes[2]!;

    // Check the other reason checkbox to show textarea
    fireEvent.click(otherReasonCheckbox);

    // Add text to textarea
    const textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    expect(textarea).toBeTruthy();
    fireEvent.change(textarea!, { target: { value: 'Some feedback text' } });
    expect(textarea!.value).toBe('Some feedback text');

    // Uncheck the other reason checkbox
    fireEvent.click(otherReasonCheckbox);

    // Textarea should be hidden
    const hiddenTextarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    expect(hiddenTextarea).toBeNull();

    // Check again to verify text was cleared
    fireEvent.click(otherReasonCheckbox);
    const newTextarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    expect(newTextarea!.value).toBe('');
  });

  it('should have onChange handler for textarea input (Requirement 7.3)', () => {
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const otherReasonCheckbox = checkboxes[2]!;

    // Check the other reason checkbox to show textarea
    fireEvent.click(otherReasonCheckbox);

    const textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    expect(textarea).toBeTruthy();

    // Initially empty
    expect(textarea!.value).toBe('');

    // Type text
    fireEvent.change(textarea!, { target: { value: 'First feedback' } });
    expect(textarea!.value).toBe('First feedback');

    // Update text
    fireEvent.change(textarea!, { target: { value: 'Updated feedback' } });
    expect(textarea!.value).toBe('Updated feedback');

    // Clear text
    fireEvent.change(textarea!, { target: { value: '' } });
    expect(textarea!.value).toBe('');
  });

  it('should disable textarea when isLoading is true (Requirement 7.6)', () => {
    const { container, rerender } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const otherReasonCheckbox = checkboxes[2]!;

    // Check the other reason checkbox to show textarea (while not loading)
    fireEvent.click(otherReasonCheckbox);

    // Now set isLoading to true
    rerender(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={true}
        mode="request-changes"
      />
    );

    const textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    expect(textarea).toBeTruthy();
    expect(textarea!.disabled).toBe(true);
  });

  it('should enable textarea when isLoading is false (Requirement 7.6)', () => {
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const otherReasonCheckbox = checkboxes[2]!;

    // Check the other reason checkbox to show textarea
    fireEvent.click(otherReasonCheckbox);

    const textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    expect(textarea).toBeTruthy();
    expect(textarea!.disabled).toBe(false);
  });

  it('should not allow textarea input when disabled (Requirement 7.6)', () => {
    const { container, rerender } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const otherReasonCheckbox = checkboxes[2]!;

    // Check the other reason checkbox to show textarea (while not loading)
    fireEvent.click(otherReasonCheckbox);

    // Now set isLoading to true
    rerender(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={true}
        mode="request-changes"
      />
    );

    const textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    expect(textarea).toBeTruthy();
    expect(textarea!.disabled).toBe(true);
  });

  it('should maintain textarea state during dialog session (Requirement 9.4)', () => {
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const otherReasonCheckbox = checkboxes[2]!;

    // Check the other reason checkbox
    fireEvent.click(otherReasonCheckbox);

    // Add text
    const textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    fireEvent.change(textarea!, { target: { value: 'Persistent feedback' } });

    // Verify text persists
    expect(textarea!.value).toBe('Persistent feedback');

    // Check other checkboxes (simulating other interactions)
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);

    // Verify textarea text still persists
    expect(textarea!.value).toBe('Persistent feedback');
  });

  it('should show/hide textarea based on checkbox state (Requirement 7.2)', () => {
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const otherReasonCheckbox = checkboxes[2]!;

    // Initially, textarea should not be visible
    let textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    expect(textarea).toBeNull();

    // Check the checkbox
    fireEvent.click(otherReasonCheckbox);

    // Textarea should now be visible
    textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    expect(textarea).toBeTruthy();

    // Uncheck the checkbox
    fireEvent.click(otherReasonCheckbox);

    // Textarea should be hidden again
    textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    expect(textarea).toBeNull();
  });
});

describe('ChecklistDialog - Task 7.1: Generate Comment Function', () => {
  const mockFormFields: FormField[] = [
    {
      title: 'Content Review',
      contents: [
        {
          name: 'Code Quality',
          checkList: ['All functions have proper error handling', 'Code follows style guide']
        },
        {
          name: 'Documentation',
          checkList: ['README is up to date', 'API docs are complete']
        }
      ],
      otherReason: 'Other Reason'
    }
  ];

  it('should pass checked items as rejectReasons array (Requirement 8.1, 8.2)', () => {
    const onRequestChanges = vi.fn();
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={onRequestChanges}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });

    // Check all checklist items (first 4 checkboxes)
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[2]!);
    fireEvent.click(checkboxes[3]!);

    // Click submit button
    fireEvent.click(submitButton);

    // Verify callback was called with reasons array and empty comment
    expect(onRequestChanges).toHaveBeenCalledTimes(1);
    const rejectReasons = onRequestChanges.mock.calls[0]![0];
    const rejectComment = onRequestChanges.mock.calls[0]![1];

    // Verify reasons array contains the checklist item texts
    expect(rejectReasons).toEqual([
      'All functions have proper error handling',
      'Code follows style guide',
      'README is up to date',
      'API docs are complete',
    ]);
    expect(rejectComment).toBe('');
  });

  it('should return reasons as an array of checklist item texts (Requirement 8.3)', () => {
    const onRequestChanges = vi.fn();
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={onRequestChanges}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });

    // Check all checklist items
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[2]!);
    fireEvent.click(checkboxes[3]!);

    // Click submit button
    fireEvent.click(submitButton);

    const rejectReasons = onRequestChanges.mock.calls[0]![0];

    // Verify reasons is an array with 4 items
    expect(Array.isArray(rejectReasons)).toBe(true);
    expect(rejectReasons.length).toBe(4);
    expect(rejectReasons[0]).toBe('All functions have proper error handling');
    expect(rejectReasons[1]).toBe('Code follows style guide');
    expect(rejectReasons[2]).toBe('README is up to date');
    expect(rejectReasons[3]).toBe('API docs are complete');
  });

  it('should include "Others" in reasons and pass text as rejectComment when other reason is checked (Requirement 8.4)', () => {
    const onRequestChanges = vi.fn();
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={onRequestChanges}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });

    // Check all checklist items
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[2]!);
    fireEvent.click(checkboxes[3]!);

    // Check other reason checkbox (5th checkbox)
    fireEvent.click(checkboxes[4]!);

    // Add text to other reason textarea
    const textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    fireEvent.change(textarea!, { target: { value: 'Please add unit tests for the new feature' } });

    // Click submit button
    fireEvent.click(submitButton);

    const rejectReasons = onRequestChanges.mock.calls[0]![0];
    const rejectComment = onRequestChanges.mock.calls[0]![1];

    // Verify "Others" is in the reasons array
    expect(rejectReasons).toContain('Others');
    expect(rejectReasons[rejectReasons.length - 1]).toBe('Others');

    // Verify the comment text is passed separately
    expect(rejectComment).toBe('Please add unit tests for the new feature');
  });

  it('should not include "Others" in reasons when other reason checkbox is unchecked (Requirement 8.4)', () => {
    const onRequestChanges = vi.fn();
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={onRequestChanges}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });

    // Check all checklist items
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[2]!);
    fireEvent.click(checkboxes[3]!);

    // Do NOT check other reason checkbox

    // Click submit button
    fireEvent.click(submitButton);

    const rejectReasons = onRequestChanges.mock.calls[0]![0];
    const rejectComment = onRequestChanges.mock.calls[0]![1];

    // Verify "Others" is not in the reasons
    expect(rejectReasons).not.toContain('Others');

    // Verify only 4 reasons (the checklist items)
    expect(rejectReasons.length).toBe(4);

    // Verify comment is empty
    expect(rejectComment).toBe('');
  });

  it('should pass empty comment when other reason has no text (Requirement 8.4)', () => {
    const onRequestChanges = vi.fn();
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={onRequestChanges}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });

    // Check all checklist items
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[2]!);
    fireEvent.click(checkboxes[3]!);

    // Check other reason checkbox but leave text empty
    fireEvent.click(checkboxes[4]!);

    // Add text then clear it
    const textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    fireEvent.change(textarea!, { target: { value: 'Some text' } });
    fireEvent.change(textarea!, { target: { value: '' } });

    // Uncheck other reason to allow submission
    fireEvent.click(checkboxes[4]!);

    // Click submit button
    fireEvent.click(submitButton);

    const rejectReasons = onRequestChanges.mock.calls[0]![0];
    const rejectComment = onRequestChanges.mock.calls[0]![1];

    // Verify "Others" is not in reasons
    expect(rejectReasons).not.toContain('Others');
    // Verify comment is empty
    expect(rejectComment).toBe('');
  });

  it('should trim whitespace from other reason text (Requirement 8.4)', () => {
    const onRequestChanges = vi.fn();
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={onRequestChanges}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });

    // Check all checklist items
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[2]!);
    fireEvent.click(checkboxes[3]!);

    // Check other reason checkbox
    fireEvent.click(checkboxes[4]!);

    // Add text with leading/trailing whitespace
    const textarea = container.querySelector<HTMLTextAreaElement>('.review-dialog-textarea');
    fireEvent.change(textarea!, { target: { value: '   Needs more tests   \n\t' } });

    // Click submit button
    fireEvent.click(submitButton);

    const rejectComment = onRequestChanges.mock.calls[0]![1];

    // Verify whitespace is trimmed
    expect(rejectComment).toBe('Needs more tests');
  });

  it('should only include checked items in the reasons array (Requirement 8.1)', () => {
    const onRequestChanges = vi.fn();
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={onRequestChanges}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });

    // Check all items to enable the button
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[2]!);
    fireEvent.click(checkboxes[3]!);

    // Click submit button
    fireEvent.click(submitButton);

    const rejectReasons = onRequestChanges.mock.calls[0]![0];

    // Verify all checked items are included
    expect(rejectReasons).toContain('All functions have proper error handling');
    expect(rejectReasons).toContain('Code follows style guide');
    expect(rejectReasons).toContain('README is up to date');
    expect(rejectReasons).toContain('API docs are complete');

    // Verify correct number of reasons
    expect(rejectReasons.length).toBe(4);
  });

  it('should handle multiple sections with different names correctly (Requirement 8.2)', () => {
    const multiSectionFields: FormField[] = [
      {
        title: 'Review',
        contents: [
          {
            name: 'Security',
            checkList: ['No SQL injection vulnerabilities']
          },
          {
            name: 'Performance',
            checkList: ['Queries are optimized']
          },
          {
            name: 'Testing',
            checkList: ['Unit tests pass', 'Integration tests pass']
          }
        ]
      }
    ];

    const onRequestChanges = vi.fn();
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={onRequestChanges}
        formFields={multiSectionFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });

    // Check all items
    checkboxes.forEach(checkbox => fireEvent.click(checkbox));

    // Click submit button
    fireEvent.click(submitButton);

    const rejectReasons = onRequestChanges.mock.calls[0]![0];

    // Verify each checklist item is in the reasons array
    expect(rejectReasons).toContain('No SQL injection vulnerabilities');
    expect(rejectReasons).toContain('Queries are optimized');
    expect(rejectReasons).toContain('Unit tests pass');
    expect(rejectReasons).toContain('Integration tests pass');

    // Verify count
    expect(rejectReasons.length).toBe(4);
  });

  it('should have empty reasons when no items are checked', () => {
    const onRequestChanges = vi.fn();
    render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={onRequestChanges}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });

    // Since button is disabled, we can't test through UI
    // This test documents expected behavior: button disabled when nothing is checked
    expect(submitButton).toBeDisabled();
  });

  it('should pass rejectReasons array and rejectComment to onRequestChanges callback (Requirement 8.5)', () => {
    const onRequestChanges = vi.fn();
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={onRequestChanges}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });

    // Check all checklist items
    fireEvent.click(checkboxes[0]!);
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[2]!);
    fireEvent.click(checkboxes[3]!);

    // Click submit button
    fireEvent.click(submitButton);

    // Verify callback was called with reasons array and comment string
    expect(onRequestChanges).toHaveBeenCalledTimes(1);
    expect(Array.isArray(onRequestChanges.mock.calls[0]![0])).toBe(true);
    expect(onRequestChanges.mock.calls[0]![0].length).toBeGreaterThan(0);
    expect(typeof onRequestChanges.mock.calls[0]![1]).toBe('string');
  });
});

describe('ChecklistDialog - Task 8.1: Render Mode-Specific Button Labels', () => {
  const mockFormFields: FormField[] = [
    {
      title: 'Content Review',
      contents: [
        {
          name: 'Code Quality',
          checkList: ['Item 1', 'Item 2']
        }
      ]
    }
  ];

  it('should display "Publish" button label in publish mode when not loading (Requirement 5.4)', () => {
    render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onPublish={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="publish"
      />
    );

    const publishButton = screen.getByText('Publish');
    expect(publishButton).toBeTruthy();
  });

  it('should display "Publishing..." button label in publish mode when loading (Requirement 5.5)', () => {
    render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onPublish={vi.fn()}
        formFields={mockFormFields}
        isLoading={true}
        mode="publish"
      />
    );

    const publishingButton = screen.getByText('Publishing...');
    expect(publishingButton).toBeTruthy();
  });

  it('should display "Request for Changes" button label in request-changes mode when not loading (Requirement 6.5)', () => {
    render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const requestChangesButton = screen.getByRole('button', { name: 'Request for Changes' });
    expect(requestChangesButton).toBeTruthy();
  });

  it('should display "Submitting..." button label in request-changes mode when loading (Requirement 6.6)', () => {
    render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={true}
        mode="request-changes"
      />
    );

    const submittingButton = screen.getByText('Submitting...');
    expect(submittingButton).toBeTruthy();
  });

  it('should update button label from "Publish" to "Publishing..." when loading state changes', () => {
    const { rerender } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onPublish={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="publish"
      />
    );

    // Initially shows "Publish"
    expect(screen.getByText('Publish')).toBeTruthy();

    // Change to loading state
    rerender(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onPublish={vi.fn()}
        formFields={mockFormFields}
        isLoading={true}
        mode="publish"
      />
    );

    // Should now show "Publishing..."
    expect(screen.getByText('Publishing...')).toBeTruthy();
    expect(screen.queryByText('Publish')).toBeNull();
  });

  it('should update button label from "Request for Changes" to "Submitting..." when loading state changes', () => {
    const { rerender } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    // Initially shows "Request for Changes"
    expect(screen.getByRole('button', { name: 'Request for Changes' })).toBeTruthy();

    // Change to loading state
    rerender(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={true}
        mode="request-changes"
      />
    );

    // Should now show "Submitting..."
    expect(screen.getByRole('button', { name: 'Submitting...' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Request for Changes' })).toBeNull();
  });

  it('should render correct button label based on mode prop', () => {
    const { rerender } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onPublish={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="publish"
      />
    );

    // Publish mode shows "Publish"
    expect(screen.getByRole('button', { name: 'Publish' })).toBeTruthy();

    // Switch to request-changes mode
    rerender(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    // Should now show "Request for Changes"
    expect(screen.getByRole('button', { name: 'Request for Changes' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
  });
});

describe('ChecklistDialog - Task 8.2: Button Click Handlers', () => {
  const mockFormFields: FormField[] = [
    {
      title: 'Content Review',
      contents: [
        {
          name: 'Code Quality',
          checkList: ['All functions have proper error handling', 'Code follows style guide']
        },
        {
          name: 'Documentation',
          checkList: ['README is up to date']
        }
      ]
    }
  ];

  it('should call onPublish callback when button is clicked in publish mode (Requirement 8.5, 11.2)', () => {
    const onPublish = vi.fn();
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onPublish={onPublish}
        formFields={mockFormFields}
        isLoading={false}
        mode="publish"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const publishButton = screen.getByRole('button', { name: 'Publish' });

    // Check all checkboxes to enable the button
    checkboxes.forEach(checkbox => fireEvent.click(checkbox));

    // Verify button is enabled
    expect(publishButton).not.toBeDisabled();

    // Click the publish button
    fireEvent.click(publishButton);

    // Verify onPublish callback was called
    expect(onPublish).toHaveBeenCalledTimes(1);
  });

  it('should call onRequestChanges callback with generated comment when button is clicked in request-changes mode (Requirement 8.5, 11.2)', () => {
    const onRequestChanges = vi.fn();
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={onRequestChanges}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });

    // Check all checkboxes to enable the button
    checkboxes.forEach(checkbox => fireEvent.click(checkbox));

    // Verify button is enabled
    expect(submitButton).not.toBeDisabled();

    // Click the submit button
    fireEvent.click(submitButton);

    // Verify onRequestChanges callback was called with reasons array and comment
    expect(onRequestChanges).toHaveBeenCalledTimes(1);
    const rejectReasons = onRequestChanges.mock.calls[0]![0];
    expect(Array.isArray(rejectReasons)).toBe(true);

    // Verify the reasons contain the expected items
    expect(rejectReasons).toContain('All functions have proper error handling');
    expect(rejectReasons).toContain('Code follows style guide');
    expect(rejectReasons).toContain('README is up to date');
  });

  it('should not call onPublish when button is disabled due to validation failure (Requirement 8.5)', () => {
    const onPublish = vi.fn();
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onPublish={onPublish}
        formFields={mockFormFields}
        isLoading={false}
        mode="publish"
      />
    );

    const publishButton = screen.getByRole('button', { name: 'Publish' });

    // Button should be disabled (not all checkboxes checked)
    expect(publishButton).toBeDisabled();

    // Try to click the button (should not trigger callback)
    fireEvent.click(publishButton);

    // Verify onPublish was not called
    expect(onPublish).not.toHaveBeenCalled();
  });

  it('should not call onRequestChanges when button is disabled due to validation failure (Requirement 8.5)', () => {
    const onRequestChanges = vi.fn();
    render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={onRequestChanges}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });

    // Button should be disabled (not all checkboxes checked)
    expect(submitButton).toBeDisabled();

    // Try to click the button (should not trigger callback)
    fireEvent.click(submitButton);

    // Verify onRequestChanges was not called
    expect(onRequestChanges).not.toHaveBeenCalled();
  });

  it('should not call onPublish when button is disabled due to loading state (Requirement 8.5)', () => {
    const onPublish = vi.fn();
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onPublish={onPublish}
        formFields={mockFormFields}
        isLoading={true}
        mode="publish"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const publishButton = screen.getByRole('button', { name: 'Publishing...' });

    // Check all checkboxes (but button should still be disabled due to loading)
    checkboxes.forEach(checkbox => fireEvent.click(checkbox));

    // Button should be disabled due to loading state
    expect(publishButton).toBeDisabled();

    // Try to click the button (should not trigger callback)
    fireEvent.click(publishButton);

    // Verify onPublish was not called
    expect(onPublish).not.toHaveBeenCalled();
  });

  it('should not call onRequestChanges when button is disabled due to loading state (Requirement 8.5)', () => {
    const onRequestChanges = vi.fn();
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={onRequestChanges}
        formFields={mockFormFields}
        isLoading={true}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const submitButton = screen.getByRole('button', { name: 'Submitting...' });

    // Check all checkboxes (but button should still be disabled due to loading)
    checkboxes.forEach(checkbox => fireEvent.click(checkbox));

    // Button should be disabled due to loading state
    expect(submitButton).toBeDisabled();

    // Try to click the button (should not trigger callback)
    fireEvent.click(submitButton);

    // Verify onRequestChanges was not called
    expect(onRequestChanges).not.toHaveBeenCalled();
  });

  it('should handle multiple button clicks in publish mode (only call once per click)', () => {
    const onPublish = vi.fn();
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onPublish={onPublish}
        formFields={mockFormFields}
        isLoading={false}
        mode="publish"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const publishButton = screen.getByRole('button', { name: 'Publish' });

    // Check all checkboxes
    checkboxes.forEach(checkbox => fireEvent.click(checkbox));

    // Click the button multiple times
    fireEvent.click(publishButton);
    fireEvent.click(publishButton);
    fireEvent.click(publishButton);

    // Verify onPublish was called 3 times (once per click)
    expect(onPublish).toHaveBeenCalledTimes(3);
  });

  it('should handle multiple button clicks in request-changes mode (only call once per click)', () => {
    const onRequestChanges = vi.fn();
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        onRequestChanges={onRequestChanges}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });

    // Check all checkboxes
    checkboxes.forEach(checkbox => fireEvent.click(checkbox));

    // Click the button multiple times
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    // Verify onRequestChanges was called 2 times (once per click)
    expect(onRequestChanges).toHaveBeenCalledTimes(2);
  });

  it('should not call callback if callback prop is undefined in publish mode', () => {
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="publish"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const publishButton = screen.getByRole('button', { name: 'Publish' });

    // Check all checkboxes
    checkboxes.forEach(checkbox => fireEvent.click(checkbox));

    // Click the button (should not throw error even without callback)
    expect(() => fireEvent.click(publishButton)).not.toThrow();
  });

  it('should not call callback if callback prop is undefined in request-changes mode', () => {
    const { container } = render(
      <ChecklistDialog
        isOpen={true}
        onClose={vi.fn()}
        formFields={mockFormFields}
        isLoading={false}
        mode="request-changes"
      />
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.review-dialog-checkbox');
    const submitButton = screen.getByRole('button', { name: 'Request for Changes' });

    // Check all checkboxes
    checkboxes.forEach(checkbox => fireEvent.click(checkbox));

    // Click the button (should not throw error even without callback)
    expect(() => fireEvent.click(submitButton)).not.toThrow();
  });
});
