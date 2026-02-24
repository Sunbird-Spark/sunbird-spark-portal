import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useResourceForm } from './useResourceForm';

// Mock the services
const mockFormService = {
  formRead: vi.fn(),
};

const mockFrameworkService = {
  read: vi.fn(),
};

vi.mock('@/services/FormService', () => ({
  FormService: vi.fn(() => mockFormService),
}));

vi.mock('@/services/FrameworkService', () => ({
  FrameworkService: vi.fn(() => mockFrameworkService),
}));

const mockFormResponse = {
  data: {
    form: {
      data: {
        fields: [
          {
            code: 'name',
            name: 'Name',
            label: 'Content Name',
            description: 'Name of the content',
            inputType: 'text',
            required: true,
            editable: true,
            visible: true,
            placeholder: 'Enter content name',
            index: 1,
          },
          {
            code: 'description',
            name: 'Description',
            label: 'Description',
            description: 'Content description',
            inputType: 'text',
            required: false,
            editable: true,
            visible: true,
            placeholder: 'Enter description',
            index: 2,
          },
          {
            code: 'subject',
            name: 'Subject',
            label: 'Subject',
            description: 'Subject area',
            inputType: 'select',
            required: true,
            editable: true,
            visible: true,
            placeholder: '',
            index: 3,
            range: [
              { key: 'mathematics', name: 'Mathematics' },
              { key: 'science', name: 'Science' },
            ],
          },
          {
            code: 'audience',
            name: 'Audience',
            label: 'Target Audience',
            description: 'Target audience',
            inputType: 'multiSelect',
            required: false,
            editable: true,
            visible: true,
            placeholder: '',
            index: 4,
          },
          {
            code: 'hiddenField',
            name: 'Hidden',
            label: 'Hidden Field',
            description: 'This should not appear',
            inputType: 'text',
            required: false,
            editable: true,
            visible: false,
            placeholder: '',
            index: 5,
          },
          {
            code: 'conceptField',
            name: 'Concept',
            label: 'Concept Field',
            description: 'This should be filtered out',
            inputType: 'Concept',
            required: false,
            editable: true,
            visible: true,
            placeholder: '',
            index: 6,
          },
        ],
      },
    },
  },
};

const mockFrameworkResponse = {
  data: {
    framework: {
      categories: [
        {
          code: 'audience',
          terms: [
            { name: 'Student', code: 'student' },
            { name: 'Teacher', code: 'teacher' },
            { name: 'Parent', code: 'parent' },
          ],
        },
      ],
    },
  },
};

describe('useResourceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFormService.formRead.mockResolvedValue(mockFormResponse);
    mockFrameworkService.read.mockResolvedValue(mockFrameworkResponse);
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() =>
      useResourceForm(false, 'testChannel', 'testFramework', 'resource')
    );

    expect(result.current.fields).toEqual([]);
    expect(result.current.formValues).toEqual({});
    expect(result.current.isFetchingForm).toBe(false);
    expect(result.current.fetchError).toBeNull();
    expect(result.current.openDropdown).toBeNull();
    expect(result.current.canSubmit).toBe(true); // No required fields initially
  });

  it('fetches form data when opened', async () => {
    const { result } = renderHook(() =>
      useResourceForm(true, 'testChannel', 'testFramework', 'resource')
    );

    await waitFor(() => {
      expect(mockFormService.formRead).toHaveBeenCalledWith({
        type: 'content',
        action: 'create',
        subType: 'resource',
        rootOrgId: 'testChannel',
        framework: 'testFramework',
      });
    });

    await waitFor(() => {
      expect(result.current.fields).toHaveLength(4); // Only visible, non-Concept fields
    });

    const fields = result.current.fields;
    expect(fields[0]?.code).toBe('name');
    expect(fields[1]?.code).toBe('description');
    expect(fields[2]?.code).toBe('subject');
    expect(fields[3]?.code).toBe('audience');
  });

  it('creates default form values based on field types', async () => {
    const { result } = renderHook(() =>
      useResourceForm(true, 'testChannel', 'testFramework', 'resource')
    );

    await waitFor(() => {
      expect(result.current.formValues).toEqual({
        name: '',
        description: '',
        subject: '',
        audience: [],
      });
    });
  });

  it('fetches framework data when framework is provided', async () => {
    const { result } = renderHook(() =>
      useResourceForm(true, 'testChannel', 'testFramework', 'resource')
    );

    await waitFor(() => {
      expect(mockFrameworkService.read).toHaveBeenCalledWith('testFramework');
    });
  });

  it('handles form fetch error', async () => {
    mockFormService.formRead.mockRejectedValue(new Error('Form fetch failed'));

    const { result } = renderHook(() =>
      useResourceForm(true, 'testChannel', 'testFramework', 'resource')
    );

    await waitFor(() => {
      expect(result.current.fetchError).toBe('Failed to load form configuration. Please try again.');
    });
  });

  it('handles framework fetch error gracefully', async () => {
    mockFrameworkService.read.mockRejectedValue(new Error('Framework fetch failed'));
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useResourceForm(true, 'testChannel', 'testFramework', 'resource')
    );

    await waitFor(() => {
      expect(result.current.fields).toHaveLength(4);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch framework:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('resets state when closed', async () => {
    const { result, rerender } = renderHook(
      ({ open }) => useResourceForm(open, 'testChannel', 'testFramework', 'resource'),
      { initialProps: { open: true } }
    );

    await waitFor(() => {
      expect(result.current.fields).toHaveLength(4);
    });

    rerender({ open: false });

    expect(result.current.fields).toEqual([]);
    expect(result.current.formValues).toEqual({});
    expect(result.current.fetchError).toBeNull();
    expect(result.current.openDropdown).toBeNull();
  });

  it('does not fetch again if already attempted', async () => {
    const { rerender } = renderHook(
      ({ open }) => useResourceForm(open, 'testChannel', 'testFramework', 'resource'),
      { initialProps: { open: true } }
    );

    await waitFor(() => {
      expect(mockFormService.formRead).toHaveBeenCalledTimes(1);
    });

    rerender({ open: false });
    rerender({ open: true });

    // Should not fetch again
    expect(mockFormService.formRead).toHaveBeenCalledTimes(1);
  });

  it('provides options for fields with range', async () => {
    const { result } = renderHook(() =>
      useResourceForm(true, 'testChannel', 'testFramework', 'resource')
    );

    await waitFor(() => {
      expect(result.current.fields).toHaveLength(4);
    });

    const subjectField = result.current.fields.find(f => f.code === 'subject');
    expect(subjectField).toBeDefined();
    expect(subjectField?.range).toBeDefined();
    
    const options = result.current.getOptionsForField(subjectField!);
    expect(options).toEqual([
      { key: 'mathematics', name: 'Mathematics' },
      { key: 'science', name: 'Science' },
    ]);
  });

  it('provides options from framework categories', async () => {
    const { result } = renderHook(() =>
      useResourceForm(true, 'testChannel', 'testFramework', 'resource')
    );

    await waitFor(() => {
      expect(result.current.fields).toHaveLength(4);
    });

    const audienceField = result.current.fields.find(f => f.code === 'audience');
    expect(audienceField).toBeDefined();
    
    if (audienceField) {
      const options = result.current.getOptionsForField(audienceField);
      expect(options).toEqual([
        { key: 'Student', name: 'Student' },
        { key: 'Teacher', name: 'Teacher' },
        { key: 'Parent', name: 'Parent' },
      ]);
    }
  });

  it('returns empty options when no range or framework category', async () => {
    const { result } = renderHook(() =>
      useResourceForm(true, 'testChannel', 'testFramework', 'resource')
    );

    await waitFor(() => {
      expect(result.current.fields).toHaveLength(4);
    });

    const nameField = result.current.fields.find(f => f.code === 'name');
    expect(nameField).toBeDefined();
    
    if (nameField) {
      const options = result.current.getOptionsForField(nameField);
      expect(options).toEqual([]);
    }
  });

  it('handles field value changes', async () => {
    const { result } = renderHook(() =>
      useResourceForm(true, 'testChannel', 'testFramework', 'resource')
    );

    await waitFor(() => {
      expect(result.current.fields).toHaveLength(4);
    });

    act(() => {
      result.current.handleFieldChange('name', 'Test Content');
    });

    expect(result.current.formValues.name).toBe('Test Content');
  });

  it('handles multiselect toggle', async () => {
    const { result } = renderHook(() =>
      useResourceForm(true, 'testChannel', 'testFramework', 'resource')
    );

    await waitFor(() => {
      expect(result.current.fields).toHaveLength(4);
    });

    // Add option
    act(() => {
      result.current.handleMultiSelectToggle('audience', 'Student');
    });

    expect(result.current.formValues.audience).toEqual(['Student']);

    // Add another option
    act(() => {
      result.current.handleMultiSelectToggle('audience', 'Teacher');
    });

    expect(result.current.formValues.audience).toEqual(['Student', 'Teacher']);

    // Remove option
    act(() => {
      result.current.handleMultiSelectToggle('audience', 'Student');
    });

    expect(result.current.formValues.audience).toEqual(['Teacher']);
  });

  it('calculates canSubmit correctly for required fields', async () => {
    const { result } = renderHook(() =>
      useResourceForm(true, 'testChannel', 'testFramework', 'resource')
    );

    await waitFor(() => {
      expect(result.current.fields).toHaveLength(4);
    });

    // Initially should not be able to submit (required fields empty)
    expect(result.current.canSubmit).toBe(false);

    // Fill required text field
    act(() => {
      result.current.handleFieldChange('name', 'Test Content');
    });

    // Still can't submit (subject is required)
    expect(result.current.canSubmit).toBe(false);

    // Fill required select field
    act(() => {
      result.current.handleFieldChange('subject', 'mathematics');
    });

    // Now should be able to submit
    expect(result.current.canSubmit).toBe(true);

    // Clear required field
    act(() => {
      result.current.handleFieldChange('name', '');
    });

    // Should not be able to submit again
    expect(result.current.canSubmit).toBe(false);
  });

  it('handles dropdown state', async () => {
    const { result } = renderHook(() =>
      useResourceForm(true, 'testChannel', 'testFramework', 'resource')
    );

    await waitFor(() => {
      expect(result.current.fields).toHaveLength(4);
    });

    expect(result.current.openDropdown).toBeNull();

    act(() => {
      result.current.setOpenDropdown('audience');
    });

    expect(result.current.openDropdown).toBe('audience');

    act(() => {
      result.current.setOpenDropdown(null);
    });

    expect(result.current.openDropdown).toBeNull();
  });

  it('uses fallback values for missing orgChannelId and orgFramework', async () => {
    const { result } = renderHook(() =>
      useResourceForm(true, '', '', 'resource')
    );

    await waitFor(() => {
      expect(mockFormService.formRead).toHaveBeenCalledWith({
        type: 'content',
        action: 'create',
        subType: 'resource',
        rootOrgId: '*',
        framework: '*',
      });
    });

    // Should not call framework service when no framework provided
    expect(mockFrameworkService.read).not.toHaveBeenCalled();
  });

  it('sorts fields by index', async () => {
    const unsortedFormResponse = {
      data: {
        form: {
          data: {
            fields: [
              { ...mockFormResponse.data.form.data.fields[2], index: 3 }, // subject
              { ...mockFormResponse.data.form.data.fields[0], index: 1 }, // name
              { ...mockFormResponse.data.form.data.fields[1], index: 2 }, // description
            ],
          },
        },
      },
    };

    mockFormService.formRead.mockResolvedValue(unsortedFormResponse);

    const { result } = renderHook(() =>
      useResourceForm(true, 'testChannel', 'testFramework', 'resource')
    );

    await waitFor(() => {
      expect(result.current.fields).toHaveLength(3);
    });

    const fields = result.current.fields;
    expect(fields.length).toBeGreaterThanOrEqual(3);
    expect(fields[0]?.code).toBe('name'); // index 1
    expect(fields[1]?.code).toBe('description'); // index 2
    expect(fields[2]?.code).toBe('subject'); // index 3
  });
});