import React, { useRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import ResourceFormField from './FormFields';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, options?: any) => {
      if (key === 'formFields.select') {
        return `Select ${options?.field}`;
      }
      return key;
    },
  }),
}));

const mockField = {
  code: 'testField',
  name: 'Test Field',
  label: 'Test Field',
  description: 'A test field',
  inputType: 'text',
  required: true,
  editable: true,
  visible: true,
  placeholder: 'Enter test value',
  index: 1,
};

const mockOptions = [
  { key: 'option1', name: 'Option 1' },
  { key: 'option2', name: 'Option 2' },
  { key: 'option3', name: 'Option 3' },
];

describe('ResourceFormField', () => {
  const mockOnFieldChange = vi.fn();
  const mockOnMultiSelectToggle = vi.fn();
  const mockOnDropdownToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const TestWrapper = ({ children, needsRef = false }: { children: React.ReactNode; needsRef?: boolean }) => {
    const dropdownRef = useRef<HTMLDivElement>(null!);

    if (needsRef && React.isValidElement(children)) {
      const childProps = children.props as any;
      return React.cloneElement(children, { ...childProps, dropdownRef });
    }

    return <>{children}</>;
  };

  describe('Text Input Field', () => {
    it('renders text input field correctly', () => {
      render(
        <ResourceFormField
          field={mockField}
          value=""
          options={[]}
          isLoading={false}
          openDropdown={null}
          onFieldChange={mockOnFieldChange}
          onMultiSelectToggle={mockOnMultiSelectToggle}
          onDropdownToggle={mockOnDropdownToggle}
        />
      );

      expect(screen.getByText('Test Field')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter test value')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument(); // Required indicator
    });

    it('handles text input changes', () => {
      render(
        <ResourceFormField
          field={mockField}
          value=""
          options={[]}
          isLoading={false}
          openDropdown={null}
          onFieldChange={mockOnFieldChange}
          onMultiSelectToggle={mockOnMultiSelectToggle}
          onDropdownToggle={mockOnDropdownToggle}
        />
      );

      const input = screen.getByPlaceholderText('Enter test value');
      fireEvent.change(input, { target: { value: 'test value' } });

      expect(mockOnFieldChange).toHaveBeenCalledWith('testField', 'test value');
    });

    it('displays current value in text input', () => {
      render(
        <ResourceFormField
          field={mockField}
          value="existing value"
          options={[]}
          isLoading={false}
          openDropdown={null}
          onFieldChange={mockOnFieldChange}
          onMultiSelectToggle={mockOnMultiSelectToggle}
          onDropdownToggle={mockOnDropdownToggle}
        />
      );

      expect(screen.getByDisplayValue('existing value')).toBeInTheDocument();
    });

    it('disables input when loading or not editable', () => {
      const { rerender } = render(
        <ResourceFormField
          field={mockField}
          value=""
          options={[]}
          isLoading={true}
          openDropdown={null}
          onFieldChange={mockOnFieldChange}
          onMultiSelectToggle={mockOnMultiSelectToggle}
          onDropdownToggle={mockOnDropdownToggle}
        />
      );

      expect(screen.getByPlaceholderText('Enter test value')).toBeDisabled();

      rerender(
        <ResourceFormField
          field={{ ...mockField, editable: false }}
          value=""
          options={[]}
          isLoading={false}
          openDropdown={null}
          onFieldChange={mockOnFieldChange}
          onMultiSelectToggle={mockOnMultiSelectToggle}
          onDropdownToggle={mockOnDropdownToggle}
        />
      );

      expect(screen.getByPlaceholderText('Enter test value')).toBeDisabled();
    });
  });

  describe('Number Input Field', () => {
    it('renders number input field correctly', () => {
      const numberField = { ...mockField, inputType: 'number' };
      render(
        <ResourceFormField
          field={numberField}
          value=""
          options={[]}
          isLoading={false}
          openDropdown={null}
          onFieldChange={mockOnFieldChange}
          onMultiSelectToggle={mockOnMultiSelectToggle}
          onDropdownToggle={mockOnDropdownToggle}
        />
      );

      const input = screen.getByPlaceholderText('Enter test value');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('handles number input changes', () => {
      const numberField = { ...mockField, inputType: 'number' };
      render(
        <ResourceFormField
          field={numberField}
          value=""
          options={[]}
          isLoading={false}
          openDropdown={null}
          onFieldChange={mockOnFieldChange}
          onMultiSelectToggle={mockOnMultiSelectToggle}
          onDropdownToggle={mockOnDropdownToggle}
        />
      );

      const input = screen.getByPlaceholderText('Enter test value');
      fireEvent.change(input, { target: { value: '123' } });

      expect(mockOnFieldChange).toHaveBeenCalledWith('testField', '123');
    });
  });

  describe('Select Field', () => {
    it('renders select field correctly', () => {
      const selectField = { ...mockField, inputType: 'select' };
      render(
        <ResourceFormField
          field={selectField}
          value=""
          options={mockOptions}
          isLoading={false}
          openDropdown={null}
          onFieldChange={mockOnFieldChange}
          onMultiSelectToggle={mockOnMultiSelectToggle}
          onDropdownToggle={mockOnDropdownToggle}
        />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Select test field')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('handles select changes', () => {
      const selectField = { ...mockField, inputType: 'select' };
      render(
        <ResourceFormField
          field={selectField}
          value=""
          options={mockOptions}
          isLoading={false}
          openDropdown={null}
          onFieldChange={mockOnFieldChange}
          onMultiSelectToggle={mockOnMultiSelectToggle}
          onDropdownToggle={mockOnDropdownToggle}
        />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'option2' } });

      expect(mockOnFieldChange).toHaveBeenCalledWith('testField', 'option2');
    });

    it('displays selected value in select', () => {
      const selectField = { ...mockField, inputType: 'select' };
      render(
        <ResourceFormField
          field={selectField}
          value="option2"
          options={mockOptions}
          isLoading={false}
          openDropdown={null}
          onFieldChange={mockOnFieldChange}
          onMultiSelectToggle={mockOnMultiSelectToggle}
          onDropdownToggle={mockOnDropdownToggle}
        />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('option2');
    });
  });

  describe('MultiSelect Field', () => {
    it('renders multiselect field correctly', () => {
      const multiSelectField = { ...mockField, inputType: 'multiSelect' };
      render(
        <TestWrapper needsRef>
          <ResourceFormField
            field={multiSelectField}
            value={[]}
            options={mockOptions}
            isLoading={false}
            openDropdown={null}
            onFieldChange={mockOnFieldChange}
            onMultiSelectToggle={mockOnMultiSelectToggle}
            onDropdownToggle={mockOnDropdownToggle}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Select test field')).toBeInTheDocument();
    });

    it('displays selected values as tags', () => {
      const multiSelectField = { ...mockField, inputType: 'multiSelect' };
      render(
        <TestWrapper needsRef>
          <ResourceFormField
            field={multiSelectField}
            value={['option1', 'option2']}
            options={mockOptions}
            isLoading={false}
            openDropdown={null}
            onFieldChange={mockOnFieldChange}
            onMultiSelectToggle={mockOnMultiSelectToggle}
            onDropdownToggle={mockOnDropdownToggle}
          />
        </TestWrapper>
      );

      expect(screen.getByText('option1')).toBeInTheDocument();
      expect(screen.getByText('option2')).toBeInTheDocument();
    });

    it('opens dropdown when button is clicked', () => {
      const multiSelectField = { ...mockField, inputType: 'multiSelect' };
      render(
        <TestWrapper needsRef>
          <ResourceFormField
            field={multiSelectField}
            value={[]}
            options={mockOptions}
            isLoading={false}
            openDropdown={null}
            onFieldChange={mockOnFieldChange}
            onMultiSelectToggle={mockOnMultiSelectToggle}
            onDropdownToggle={mockOnDropdownToggle}
          />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnDropdownToggle).toHaveBeenCalledWith('testField');
    });

    it('closes dropdown when button is clicked and dropdown is open', () => {
      const multiSelectField = { ...mockField, inputType: 'multiSelect' };
      render(
        <TestWrapper needsRef>
          <ResourceFormField
            field={multiSelectField}
            value={[]}
            options={mockOptions}
            isLoading={false}
            openDropdown="testField"
            onFieldChange={mockOnFieldChange}
            onMultiSelectToggle={mockOnMultiSelectToggle}
            onDropdownToggle={mockOnDropdownToggle}
          />
        </TestWrapper>
      );

      // Get the main toggle button (not the option buttons)
      const buttons = screen.getAllByRole('button');
      const toggleButton = buttons[0];
      if (toggleButton) {
        fireEvent.click(toggleButton);
      }

      expect(mockOnDropdownToggle).toHaveBeenCalledWith(null);
    });

    it('shows dropdown options when open', () => {
      const multiSelectField = { ...mockField, inputType: 'multiSelect' };
      render(
        <TestWrapper needsRef>
          <ResourceFormField
            field={multiSelectField}
            value={[]}
            options={mockOptions}
            isLoading={false}
            openDropdown="testField"
            onFieldChange={mockOnFieldChange}
            onMultiSelectToggle={mockOnMultiSelectToggle}
            onDropdownToggle={mockOnDropdownToggle}
          />
        </TestWrapper>
      );

      const optionButtons = screen.getAllByRole('button');
      expect(optionButtons).toHaveLength(4); // 1 main button + 3 option buttons
    });

    it('toggles option selection when option is clicked', () => {
      const multiSelectField = { ...mockField, inputType: 'multiSelect' };
      render(
        <TestWrapper needsRef>
          <ResourceFormField
            field={multiSelectField}
            value={[]}
            options={mockOptions}
            isLoading={false}
            openDropdown="testField"
            onFieldChange={mockOnFieldChange}
            onMultiSelectToggle={mockOnMultiSelectToggle}
            onDropdownToggle={mockOnDropdownToggle}
          />
        </TestWrapper>
      );

      const optionButtons = screen.getAllByRole('button');
      const firstOption = optionButtons.find(btn => btn.textContent?.includes('Option 1'));

      if (firstOption) {
        fireEvent.click(firstOption);
        expect(mockOnMultiSelectToggle).toHaveBeenCalledWith('testField', 'option1');
      }
    });

    it('removes selected value when tag close button is clicked', () => {
      const multiSelectField = { ...mockField, inputType: 'multiSelect' };
      render(
        <TestWrapper needsRef>
          <ResourceFormField
            field={multiSelectField}
            value={['option1']}
            options={mockOptions}
            isLoading={false}
            openDropdown={null}
            onFieldChange={mockOnFieldChange}
            onMultiSelectToggle={mockOnMultiSelectToggle}
            onDropdownToggle={mockOnDropdownToggle}
          />
        </TestWrapper>
      );

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(mockOnMultiSelectToggle).toHaveBeenCalledWith('testField', 'option1');
    });

    it('handles keyboard interaction on tag close button', () => {
      const multiSelectField = { ...mockField, inputType: 'multiSelect' };
      render(
        <TestWrapper needsRef>
          <ResourceFormField
            field={multiSelectField}
            value={['option1']}
            options={mockOptions}
            isLoading={false}
            openDropdown={null}
            onFieldChange={mockOnFieldChange}
            onMultiSelectToggle={mockOnMultiSelectToggle}
            onDropdownToggle={mockOnDropdownToggle}
          />
        </TestWrapper>
      );

      const closeButton = screen.getByText('×');
      fireEvent.keyDown(closeButton, { key: 'Enter' });

      expect(mockOnMultiSelectToggle).toHaveBeenCalledWith('testField', 'option1');
    });
  });

  describe('Field Variations', () => {
    it('does not show required indicator for optional fields', () => {
      const optionalField = { ...mockField, required: false };
      render(
        <ResourceFormField
          field={optionalField}
          value=""
          options={[]}
          isLoading={false}
          openDropdown={null}
          onFieldChange={mockOnFieldChange}
          onMultiSelectToggle={mockOnMultiSelectToggle}
          onDropdownToggle={mockOnDropdownToggle}
        />
      );

      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('uses default placeholder when none provided', () => {
      const fieldWithoutPlaceholder = { ...mockField, placeholder: '' };
      render(
        <ResourceFormField
          field={fieldWithoutPlaceholder}
          value=""
          options={[]}
          isLoading={false}
          openDropdown={null}
          onFieldChange={mockOnFieldChange}
          onMultiSelectToggle={mockOnMultiSelectToggle}
          onDropdownToggle={mockOnDropdownToggle}
        />
      );

      expect(screen.getByPlaceholderText('Enter test field')).toBeInTheDocument();
    });

    it('returns null for unsupported input types', () => {
      const unsupportedField = { ...mockField, inputType: 'unsupported' };
      const { container } = render(
        <ResourceFormField
          field={unsupportedField}
          value=""
          options={[]}
          isLoading={false}
          openDropdown={null}
          onFieldChange={mockOnFieldChange}
          onMultiSelectToggle={mockOnMultiSelectToggle}
          onDropdownToggle={mockOnDropdownToggle}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('sets autofocus on name field', () => {
      const nameField = { ...mockField, code: 'name' };
      const { container } = render(
        <ResourceFormField
          field={nameField}
          value=""
          options={[]}
          isLoading={false}
          openDropdown={null}
          onFieldChange={mockOnFieldChange}
          onMultiSelectToggle={mockOnMultiSelectToggle}
          onDropdownToggle={mockOnDropdownToggle}
        />
      );

      const input = screen.getByPlaceholderText('Enter test value');
      // In React, autoFocus is a prop that gets applied, check if it's the active element after render
      expect(document.activeElement).toBe(input);
    });
  });
});